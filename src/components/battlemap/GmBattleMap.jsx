import { useEffect, useRef, useState } from 'react';
import {
  Map, Plus, X, Pencil, Trash2, Undo2, Maximize2, Minimize2, ChevronDown, ChevronRight,
  Hand, Ruler, Eraser, CloudFog, Eye, EyeOff, Upload,
} from 'lucide-react';
import { useLang } from '../../i18n/index.jsx';
import { readJSON, writeJSON } from '../../utils/storage.js';
import { BattleMap } from '../../battlemap/battlemap.js';
import { TextInput, Stepper } from '../ui.jsx';
import Panel from '../Panel.jsx';
import BattleMapCanvas from './BattleMapCanvas.jsx';
import { usePnpHandler } from '../../pnp/PnpBridge.jsx';
import { upfToDataUrl } from '../../pnp/images.js';

const KEY = 'pips-paws-gm-map';
const nid = () => `t_${Math.random().toString(36).slice(2, 8)}`;
const mid = () => `m_${Math.random().toString(36).slice(2, 8)}`;

// Vollstaendiges Raster fuer neue Karten: applyState() mischt nur ueber das
// aktuelle Raster der Leinwand, eine leere {} wuerde also das Raster der
// zuvor geladenen Karte (z. B. ausgeblendet, andere Feldgroesse) erben.
const DEFAULT_RASTER = {
  rasterGroesse: 50, rasterVersatzX: 0, rasterVersatzY: 0, rasterSichtbar: true, einheit: 1, einheitName: 'Feld',
};
const emptyNebel = () => ({ aktiv: false, aufgedeckt: [], entwurf: [] });
const emptyZustand = () => ({ raster: { ...DEFAULT_RASTER }, figuren: [], formen: [], nebel: emptyNebel() });

const freshMapData = (name) => ({ id: mid(), name, bild: null, zustand: emptyZustand() });

const TOKEN_KINDS = {
  spieler: { besitzer: 'party', farbe: '#256b5b' },
  gegner: { besitzer: 'sl', farbe: '#b0362f' },
  helfer: { besitzer: 'party', farbe: '#c2912f' },
};

// UPF-Token-Art (PenNodePaper) -> Token-Art der Karte
const PNP_TOKENS = { pc: 'spieler', npc: 'helfer', enemy: 'gegner' };

// SL-Battlemap: haelt mehrere Karten lokal (ueberlebt Reload wie der Kampf-
// Tracker), zeigt genau eine davon in EINER Leinwand und spiegelt sie bei
// Bedarf an die Spieler — Bild und haeufiger Zustand getrennt, siehe
// broadcastMapState/broadcastMapImage in useMultiplayer.js.
export default function GmBattleMap({ mp, notify }) {
  const { t } = useLang();
  const [s, setS] = useState(() => {
    const loaded = readJSON(KEY);
    if (loaded?.maps?.length) return loaded;
    const first = freshMapData(t('map.defaultName'));
    return { activeId: first.id, maps: [first] };
  });
  const sRef = useRef(s);
  sRef.current = s;

  const [live, setLive] = useState({ figuren: [], offenNebel: 0, kannUndo: false });
  const [advanced, setAdvanced] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [addTokenKind, setAddTokenKind] = useState('gegner');
  const apiRef = useRef(null);
  const fileInput = useRef(null);

  const commit = (next) => {
    sRef.current = next;
    setS(next);
    if (!writeJSON(KEY, next)) notify?.(t('pnp.err.storageFull'), 'bad');
  };

  const active = s.maps.find((m) => m.id === s.activeId) || s.maps[0];

  const refreshLive = () => {
    const api = apiRef.current;
    if (!api) return;
    setLive({ figuren: api.figuren, offenNebel: api.offeneNebelBereiche(), kannUndo: api.kannRueckgaengig() });
  };

  // Engine meldet jede Aenderung (Zug, Zeichnung, Nebel) — hier landet sie in
  // der jeweiligen Karte UND geht (gefiltert um SL-Wissen) an die Spieler raus.
  const onEngineChange = (zustand) => {
    const cur = sRef.current;
    const next = { ...cur, maps: cur.maps.map((m) => (m.id === cur.activeId ? { ...m, zustand } : m)) };
    commit(next);
    refreshLive();
    const a = next.maps.find((m) => m.id === next.activeId);
    const safe = apiRef.current?.getStateFuerSpieler();
    if (safe) mp.broadcastMapState({ name: a?.name, ...safe });
  };

  const loadIntoCanvas = (m) => {
    const api = apiRef.current;
    if (!api || !m) return;
    api.applyState({ ...m.zustand, raster: { ...DEFAULT_RASTER, ...m.zustand.raster } }, m.bild);
    requestAnimationFrame(() => { api.einpassen(); refreshLive(); });
  };

  const switchTo = (id) => {
    if (id === s.activeId) return;
    const next = s.maps.find((m) => m.id === id);
    if (!next) return;
    commit({ ...s, activeId: id });
    loadIntoCanvas(next);
    mp.broadcastMapImage(next.name, next.bild || null);
    mp.broadcastMapState({ name: next.name, ...BattleMap.fuerSpieler(next.zustand) });
  };

  const addMap = () => {
    const name = window.prompt(t('map.prompt.name'), t('map.defaultName'));
    if (!name) return;
    const m = freshMapData(name.trim());
    commit({ activeId: m.id, maps: [...s.maps, m] });
    loadIntoCanvas(m);
    mp.broadcastMapImage(m.name, null);
    mp.broadcastMapState({ name: m.name, ...BattleMap.fuerSpieler(m.zustand) });
  };

  const renameMap = (id) => {
    const m = s.maps.find((x) => x.id === id);
    const name = window.prompt(t('map.prompt.name'), m?.name);
    if (!name) return;
    commit({ ...s, maps: s.maps.map((x) => (x.id === id ? { ...x, name: name.trim() } : x)) });
    if (id === s.activeId) mp.broadcastMapImage(name.trim(), m.bild || null);
  };

  const removeMap = (id) => {
    if (s.maps.length <= 1) return;
    if (!window.confirm(t('map.confirmDelete'))) return;
    const remaining = s.maps.filter((x) => x.id !== id);
    const wasActive = id === s.activeId;
    const nextActive = wasActive ? remaining[0] : s.maps.find((x) => x.id === s.activeId);
    commit({ activeId: nextActive.id, maps: remaining });
    if (wasActive) {
      loadIntoCanvas(nextActive);
      mp.broadcastMapImage(nextActive.name, nextActive.bild || null);
      mp.broadcastMapState({ name: nextActive.name, ...BattleMap.fuerSpieler(nextActive.zustand) });
    }
  };

  const onUpload = async (file) => {
    if (!file || !apiRef.current) return;
    const { dataUrl } = await BattleMap.bildVerkleinern(file);
    apiRef.current.setBild(dataUrl);
    const next = { ...s, maps: s.maps.map((m) => (m.id === s.activeId ? { ...m, bild: dataUrl } : m)) };
    commit(next);
    requestAnimationFrame(() => apiRef.current?.einpassen());
    mp.broadcastMapImage(active?.name, dataUrl);
  };

  const addToken = () => {
    const kind = TOKEN_KINDS[addTokenKind];
    const pos = apiRef.current.sichtbaresZentrum();
    apiRef.current.addFigur({
      id: nid(), name: t(`map.token.${addTokenKind}`), farbe: kind.farbe, besitzer: kind.besitzer, groesse: 1, ...pos,
    });
  };

  const patchToken = (id, patch) => apiRef.current?.addFigur({ id, ...patch });
  const removeToken = (id) => apiRef.current?.removeFigur(id);

  useEffect(() => {
    requestAnimationFrame(() => apiRef.current?.einpassen());
  }, [fullscreen]);

  // PenNodePaper: { id, name, image, width, height, grid, tokens, activate }.
  // Gleiche id ersetzt Bild, Raster und Token der Karte, laesst aber das
  // Aufgedeckte (Nebel) und die Zeichnungen des SL stehen. Hex-Raster kann
  // die Engine nicht (Profil meldet nur "square").
  usePnpHandler('scene', async (p) => {
    if (!p || !p.id) throw new Error('scene: id missing');
    const grid = p.grid || {};
    if (grid.type && grid.type !== 'square') throw new Error(t('pnp.err.hex'));
    const { dataUrl, scale } = await upfToDataUrl(p.image, 'scene', 1800, 0.74);
    const raster = {
      rasterGroesse: Number(grid.size) > 0 ? Number(grid.size) * scale : DEFAULT_RASTER.rasterGroesse,
      rasterVersatzX: (Number(grid.offsetX) || 0) * scale,
      rasterVersatzY: (Number(grid.offsetY) || 0) * scale,
      rasterSichtbar: !grid.hidden,
      einheit: Number(grid.unitsPerCell) > 0 ? Number(grid.unitsPerCell) : 1,
      einheitName: grid.unit ? String(grid.unit).slice(0, 8) : DEFAULT_RASTER.einheitName,
    };
    const base = `pnp-${p.id}`;
    // UPF-Zellkoordinaten: (0,0) = linke obere Zelle; die Engine setzt Token auf den Zellmittelpunkt.
    const figuren = (p.tokens || []).map((tk, i) => {
      const def = TOKEN_KINDS[PNP_TOKENS[tk.kind] || 'helfer'];
      return {
        id: `${base}-t${i}`, name: String(tk.label || '?').slice(0, 24), farbe: def.farbe, besitzer: def.besitzer,
        groesse: 1, x: (Number(tk.x) || 0) + 0.5, y: (Number(tk.y) || 0) + 0.5,
      };
    });
    const cur = sRef.current;
    const existing = cur.maps.find((m) => m.pnpId === p.id);
    const zustand = {
      raster,
      figuren,
      formen: existing?.zustand.formen || [],
      nebel: existing?.zustand.nebel || emptyNebel(),
    };
    const name = String(p.name || '').slice(0, 60) || t('map.defaultName');
    const rec = existing
      ? { ...existing, name, bild: dataUrl, zustand }
      : { id: mid(), pnpId: p.id, name, bild: dataUrl, zustand };
    const maps = existing ? cur.maps.map((m) => (m.id === rec.id ? rec : m)) : [...cur.maps, rec];
    const makeActive = !!p.activate || cur.activeId === rec.id;
    commit({ activeId: makeActive ? rec.id : cur.activeId, maps });
    if (makeActive) {
      loadIntoCanvas(rec);
      mp.broadcastMapImage(rec.name, rec.bild);
      mp.broadcastMapState({ name: rec.name, ...BattleMap.fuerSpieler(rec.zustand) });
    }
    if (p.activate) mp.setMapShared(true);
    return { map: existing ? 'updated' : 'added', shown: !!p.activate };
  });

  const TOOLS = [
    { key: 'zeigen', icon: Hand, label: t('map.tool.hand') },
    { key: 'messen', icon: Ruler, label: t('map.tool.measure') },
    { key: 'malen', icon: Pencil, label: t('map.tool.draw') },
    { key: 'radieren', icon: Eraser, label: t('map.tool.erase') },
    { key: 'nebel-auf', icon: Eye, label: t('map.tool.fogReveal') },
    { key: 'nebel-zu', icon: CloudFog, label: t('map.tool.fogHide') },
  ];
  const MAL_FARBEN = ['#a3342b', '#256b5b', '#c2912f', '#1b1714', '#3f6b2e'];

  return (
    <Panel
      id="gm-map"
      icon={Map}
      title={t('map.title')}
      className={`battlemap-panel${fullscreen ? ' battlemap-fullscreen' : ''}`}
      right={(
        <div className="stash-head-actions">
          <label className="gm-share-log" title={t('map.shareHint')}>
            <input type="checkbox" checked={mp.mapShared} onChange={(e) => mp.setMapShared(e.target.checked)} />
            {t('map.share')}
          </label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFullscreen((f) => !f)}>
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      )}
    >
      <div className="map-list">
        {s.maps.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`map-tab${m.id === s.activeId ? ' active' : ''}`}
            onClick={() => switchTo(m.id)}
            onDoubleClick={() => renameMap(m.id)}
          >
            {m.name}
          </button>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={addMap}>
          <Plus size={14} /> {t('map.addMap')}
        </button>
        {s.maps.length > 1 ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeMap(s.activeId)}>
            <Trash2 size={14} />
          </button>
        ) : null}
      </div>

      <div className="map-quickbar">
        <button type="button" className="btn btn-sm" onClick={() => fileInput.current?.click()}>
          <Upload size={14} /> {t('map.loadImage')}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => { onUpload(e.target.files?.[0]); e.target.value = ''; }}
        />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdvanced((v) => !v)}>
          {advanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {t('map.tools')}
        </button>
      </div>

      <div className="battlemap-stage">
        <BattleMapCanvas
          onReady={(api) => {
            apiRef.current = api;
            if (!api || !active) return;
            loadIntoCanvas(active);
            // Die Refs in useMultiplayer.js, aus denen neu (wieder) verbundene
            // Spieler ihren ersten Kartenstand bekommen, leben nur im laufenden
            // Tab — nach einem Reload sind sie leer, obwohl die Karte hier aus
            // dem lokalen Speicher schon wieder geladen ist. Deshalb hier einmal
            // vorfuellen, nicht erst bei der naechsten Aenderung.
            mp.broadcastMapImage(active.name, active.bild || null);
            mp.broadcastMapState({ name: active.name, ...BattleMap.fuerSpieler(active.zustand) });
          }}
          onChange={onEngineChange}
        />
      </div>

      {advanced ? (
        <div className="map-toolbar">
          <div className="map-tool-row">
            {TOOLS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                title={label}
                className={`map-tool-btn${apiRef.current?.getWerkzeug?.() === key ? ' active' : ''}`}
                onClick={() => { apiRef.current?.setWerkzeug(key); refreshLive(); }}
              >
                <Icon size={16} />
              </button>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={!live.kannUndo}
              onClick={() => { apiRef.current?.rueckgaengig(); refreshLive(); }}
            >
              <Undo2 size={14} /> {t('map.undo')}
            </button>
          </div>

          <div className="map-tool-row">
            <span className="map-tool-label">{t('map.drawColor')}</span>
            {MAL_FARBEN.map((f) => (
              <button
                key={f}
                type="button"
                className="map-color-swatch"
                style={{ background: f }}
                onClick={() => apiRef.current?.setMalFarbe(f)}
                aria-label={f}
              />
            ))}
            <select onChange={(e) => apiRef.current?.setMalArt(e.target.value)} defaultValue="freihand">
              <option value="freihand">{t('map.shape.free')}</option>
              <option value="linie">{t('map.shape.line')}</option>
              <option value="kreis">{t('map.shape.circle')}</option>
              <option value="rechteck">{t('map.shape.rect')}</option>
            </select>
          </div>

          <div className="map-tool-row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { apiRef.current?.nebelAllesZudecken(); refreshLive(); }}>
              <EyeOff size={14} /> {t('map.fog.hideAll')}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { apiRef.current?.nebelFreigeben(); refreshLive(); }}>
              <Eye size={14} /> {t('map.fog.release')} {live.offenNebel ? `(${live.offenNebel})` : ''}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { apiRef.current?.nebelAllesAufdecken(); refreshLive(); }}>
              {t('map.fog.revealAll')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="map-tokens">
        <div className="map-tool-row">
          <select value={addTokenKind} onChange={(e) => setAddTokenKind(e.target.value)}>
            <option value="spieler">{t('map.token.spieler')}</option>
            <option value="gegner">{t('map.token.gegner')}</option>
            <option value="helfer">{t('map.token.helfer')}</option>
          </select>
          <button type="button" className="btn btn-sm" onClick={addToken}>
            <Plus size={14} /> {t('map.addToken')}
          </button>
        </div>
        {live.figuren.length === 0 ? (
          <p className="hint">{t('map.noTokens')}</p>
        ) : (
          <ul className="map-token-list">
            {live.figuren.map((f) => (
              <li key={f.id} className="map-token-row">
                <span className="map-token-swatch" style={{ background: f.farbe }} />
                <TextInput value={f.name} onChange={(v) => patchToken(f.id, { name: v })} className="map-token-name" />
                <Stepper value={f.groesse} min={0.5} max={8} onChange={(v) => { apiRef.current?.setFigurGroesse(f.id, v); refreshLive(); }} label={t('map.tokenSize')} />
                <button
                  type="button"
                  className="icon-btn"
                  title={t('map.tokenHide')}
                  onClick={() => { apiRef.current?.setVerdeckt(f.id, !f.verdeckt); refreshLive(); }}
                >
                  {f.verdeckt ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button type="button" className="icon-btn" onClick={() => removeToken(f.id)}>
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
