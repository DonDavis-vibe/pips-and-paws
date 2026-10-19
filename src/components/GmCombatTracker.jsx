import { useCallback, useEffect, useRef, useState } from 'react';
import { Swords, Plus, Minus, RotateCcw, X, Skull, ListOrdered, HeartCrack, Eye, EyeOff } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { readJSON, writeJSON } from '../utils/storage.js';
import { rollDie, rollSave } from '../rules/dice.js';
import { CREATURES, CREATURE_BY_KEY } from '../data/creatures.js';
import { creatureArt } from '../data/creatureArt.js';
import InkArt from './InkArt.jsx';
import { Field, TextInput, Stepper } from './ui.jsx';
import Panel from './Panel.jsx';
import { usePnpHandler } from '../pnp/PnpBridge.jsx';
import { pnpNpcId } from '../pnp/party.js';
import { emitGm } from '../utils/gmBus.js';
import { dN } from '../utils/dice3d.js';

const KEY = 'pips-paws-gm-combat';
const fresh = () => ({ round: 0, npcs: [] });
const nid = () => `n_${Math.random().toString(36).slice(2, 8)}`;

// Aeltere Eintraege kennen noch keine STR: aus dem Werteblock nachziehen.
const npcStr = (n) => n.str || { current: CREATURE_BY_KEY[n.key]?.str ?? 10, max: CREATURE_BY_KEY[n.key]?.str ?? 10 };

// NSC-/Kampf-Tracker fuer den Spielleiter. Rein lokal, ueberlebt einen Reload.
export default function GmCombatTracker({ onLog, onInitiative, shareNpcs, pushRoll }) {
  const { t, lang } = useLang();
  const [s, setS] = useState(() => ({ ...fresh(), ...readJSON(KEY) }));
  const [addOpen, setAddOpen] = useState(false);
  const [pick, setPick] = useState('rat');
  const [customName, setCustomName] = useState('');
  const [customHp, setCustomHp] = useState(3);
  const [customDmg, setCustomDmg] = useState(6);
  const [customWil, setCustomWil] = useState(8);
  const sRef = useRef(s);
  sRef.current = s;

  // Jede Aenderung geht auch an die Battlemap: Token, die einen Tracker-Eintrag
  // darstellen (PenNodePaper "characterTokens"), uebernehmen Name, Bild, Groesse
  // und den Tot-Status (siehe GmBattleMap.jsx#syncLinkedTokens).
  const commit = useCallback((next) => {
    sRef.current = next;
    setS(next);
    writeJSON(KEY, next);
    emitGm('combat', next.npcs);
  }, []);

  // Nur die sichtbar geschalteten NSC an die Spieler spiegeln.
  const shownKey = s.npcs.filter((n) => n.shown).map((n) => `${n.id}:${n.name}:${n.key || ''}:${n.note || ''}`).join('|');
  useEffect(() => {
    if (!shareNpcs) return;
    shareNpcs(sRef.current.npcs.filter((n) => n.shown));
  }, [shareNpcs, shownKey]);

  // PenNodePaper: Rolle "creature" -> Eintrag des Kampf-Trackers. Erneutes
  // Pushen derselben id aktualisiert den Eintrag und behaelt den Live-Stand
  // (aktuelle TP, sichtbar geschaltet).
  usePnpHandler('character', (c) => {
    if (!c || !c.id) throw new Error('character: id missing');
    if (c.role !== 'creature') throw new Error(t('pnp.err.role', { role: String(c.role) }));
    const sh = c.sheet || {};
    const clampNum = (v, lo, hi, d) => (Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Math.round(Number(v)))) : d);
    const id = pnpNpcId(c.id);
    const dmg = [4, 6, 8, 10, 12].includes(Number(sh.dmg)) ? Number(sh.dmg) : 6;
    const hpMax = clampNum(sh.hp, 1, 200, 3);
    // STR ist seit 0.6.3 ein echter Wert (Schaden ueber die TP hinaus), DEX bleibt Notiz.
    const stats = [sh.dex && `${t('attr.abbr.dex')} ${sh.dex}`].filter(Boolean).join(', ');
    const note = [stats, sh.special, c.notes].filter(Boolean).join(' · ').slice(0, 600);
    const name = String(c.name || '?').slice(0, 80);
    const prev = sRef.current.npcs.find((n) => n.id === id);
    const fields = {
      base: name, name, dmg, armour: clampNum(sh.armour, 0, 3, 0), wil: clampNum(sh.wil, 1, 20, 8),
      // Erneutes Pushen setzt das Maximum neu, behaelt aber den Live-Schaden.
      str: (() => {
        const max = clampNum(sh.str, 1, 30, prev?.str?.max ?? 10);
        const lost = prev?.str ? prev.str.max - prev.str.current : 0;
        return { current: Math.max(0, max - lost), max };
      })(),
      note, attack: String(sh.attack || '').slice(0, 120) || `W${dmg}`,
      // Vorlage = SRD-Kreatur -> Tusche-Portrait im Tracker und auf dem Token.
      key: CREATURE_BY_KEY[c.preset] ? c.preset : prev?.key,
      size: Number(sh.size) > 0 ? Math.min(8, Math.max(0.5, Number(sh.size))) : (prev?.size ?? 1),
    };
    const npcs = prev
      ? sRef.current.npcs.map((n) => (n.id === id
        ? { ...n, ...fields, hp: { current: Math.min(n.hp.current, hpMax), max: hpMax } }
        : n))
      : [...sRef.current.npcs, { id, ...fields, hp: { current: hpMax, max: hpMax } }];
    commit({ ...sRef.current, npcs });
    return { npcList: prev ? 'updated' : 'added' };
  });

  const nameWithNumber = (base) => {
    const same = sRef.current.npcs.filter((n) => n.base === base);
    return same.length ? `${base} ${same.length + 1}` : base;
  };

  const addCreature = () => {
    const c = CREATURE_BY_KEY[pick];
    const base = loc(c.name, lang);
    commit({
      ...s,
      npcs: [
        ...s.npcs,
        { id: nid(), key: c.key, base, name: nameWithNumber(base), hp: { current: c.hp, max: c.hp }, str: { current: c.str ?? 10, max: c.str ?? 10 }, dmg: c.dmg, armour: c.armour, wil: c.wil ?? 8, note: loc(c.note, lang), attack: loc(c.attack, lang) },
      ],
    });
    setAddOpen(false);
  };

  const addCustom = () => {
    const base = customName.trim();
    if (!base) return;
    commit({
      ...s,
      npcs: [...s.npcs, { id: nid(), base, name: nameWithNumber(base), hp: { current: customHp, max: customHp }, str: { current: 10, max: 10 }, dmg: customDmg, armour: 0, wil: customWil, note: '', attack: `W${customDmg}` }],
    });
    setCustomName('');
    setAddOpen(false);
  };

  const patchNpc = (id, partial) =>
    commit({ ...s, npcs: s.npcs.map((n) => (n.id === id ? { ...n, ...partial } : n)) });

  const removeNpc = (id) => commit({ ...s, npcs: s.npcs.filter((n) => n.id !== id) });

  // Angriff mit dem eigenen Wuerfel, oder verstaerkt (W12) / geschwaecht (W4) — Regel S. 10.
  const attack = (n, sides = n.dmg) => {
    const roll = rollDie(sides);
    onLog('combat.log.attack', { name: n.name, roll, die: `W${sides}` });
    pushRoll?.({
      label: `${n.name} · ${t('dice.dieLetter')}${sides}`, value: roll, max: sides, die: sides, dice3d: dN(sides, roll),
    });
  };

  // Treffer auf einen NSC (Regel S. 10): minus Ruestung auf TP, Rest auf STR,
  // dann STR-Probe — misslungen = kritischer Schaden (Moral-Anlass!). STR 0 = tot.
  const [hitIn, setHitIn] = useState({});
  const hit = (n) => {
    const amount = parseInt(hitIn[n.id], 10);
    if (!Number.isFinite(amount) || amount < 0) return;
    const absorbed = Math.min(amount, n.armour || 0);
    const dealt = amount - absorbed;
    const str = npcStr(n);
    let hp = n.hp.current - dealt;
    let strCur = str.current;
    let strHit = 0;
    if (hp < 0) {
      strHit = -hp;
      strCur = Math.max(0, strCur - strHit);
      hp = 0;
    }
    const parts = [t('dmg.taken', { n: dealt })];
    if (absorbed) parts.push(t('dmg.armour', { n: absorbed }));
    if (strHit) parts.push(`— ${t('dmg.toAttr', { n: strHit, attr: t('attr.abbr.str') })}`);
    let crit = false;
    if (strHit && strCur > 0) {
      const r = rollSave(strCur);
      crit = !r.ok;
      parts.push(`· ${t('dice.saveVs', { attr: t('attr.abbr.str') })} ${r.d} ≤ ${strCur} ${r.ok ? '✓' : '✗'}`);
      if (crit) parts.push(`· ${t('combat.crit')}`);
    }
    if (strCur <= 0) parts.push(`· ${t('combat.dead')}`);
    onLog('gm.log.note', { name: n.name, text: parts.join(' ') });
    patchNpc(n.id, { hp: { ...n.hp, current: hp }, str: { ...str, current: strCur }, crit: crit || n.crit });
    setHitIn((h) => ({ ...h, [n.id]: '' }));
  };

  const morale = (n) => {
    const wil = n.wil ?? 8;
    const r = rollSave(wil);
    onLog('combat.log.morale', {
      name: n.name,
      roll: r.d,
      wil,
      result: t(r.ok ? 'combat.morale.hold' : 'combat.morale.flee'),
    });
  };

  return (
    <Panel
      id="gm-combat"
      icon={Swords}
      title={t('combat.title')}
      className="combat-panel"
      right={(
        <div className="stash-head-actions">
          <button type="button" className="btn btn-sm btn-ghost" onClick={onInitiative}>
            <ListOrdered size={14} /> {t('combat.initiative')}
          </button>
          <button type="button" className="icon-btn" onClick={() => commit(fresh())} aria-label={t('time.reset')} title={t('time.reset')}>
            <RotateCcw size={15} />
          </button>
        </div>
      )}
    >
      <div className="time-row">
        <div className="time-clock">
          <span>{t('combat.round')}</span>
          <strong>{s.round}</strong>
        </div>
        <div className="time-steppers">
          <button type="button" className="btn btn-sm" onClick={() => commit({ ...s, round: Math.max(0, s.round - 1) })} aria-label="-">
            <Minus size={14} />
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => commit({ ...s, round: s.round + 1 })}>
            <Plus size={14} /> {t('combat.round')}
          </button>
        </div>
        <button type="button" className="btn btn-sm" onClick={() => setAddOpen((v) => !v)}>
          <Plus size={14} /> {t('combat.addNpc')}
        </button>
      </div>

      {addOpen ? (
        <div className="combat-add">
          <div className="inline-roll">
            <select className="text-input" value={pick} onChange={(e) => setPick(e.target.value)}>
              {CREATURES.map((c) => (
                <option key={c.key} value={c.key}>
                  {loc(c.name, lang)} — {c.hp} TP, W{c.dmg}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-sm btn-primary" onClick={addCreature}>
              {t('combat.add')}
            </button>
          </div>
          <div className="custom-item-form">
            <Field label={t('combat.customName')}>
              <TextInput value={customName} onChange={setCustomName} />
            </Field>
            <Field label={t('res.hpShort')}>
              <Stepper value={customHp} min={1} max={200} onChange={setCustomHp} />
            </Field>
            <Field label={t('item.damage')}>
              <select className="text-input" value={customDmg} onChange={(e) => setCustomDmg(+e.target.value)}>
                {[4, 6, 8, 10, 12].map((d) => (
                  <option key={d} value={d}>W{d}</option>
                ))}
              </select>
            </Field>
            <Field label={t('combat.wil')}>
              <Stepper value={customWil} min={1} max={20} onChange={setCustomWil} />
            </Field>
            <button type="button" className="btn btn-sm" disabled={!customName.trim()} onClick={addCustom}>
              {t('combat.add')}
            </button>
          </div>
        </div>
      ) : null}

      {s.npcs.length === 0 ? (
        <p className="hint">{t('combat.empty')}</p>
      ) : (
        <div className="combat-list">
          {s.npcs.map((n) => {
            const str = npcStr(n);
            const dead = str.current <= 0;
            return (
              <div key={n.id} className={`combat-npc${dead ? ' npc-dead' : ''}${n.shown ? ' npc-shown' : ''}`}>
                <div className="combat-npc-top">
                  {n.key && creatureArt(n.key) ? <InkArt src={creatureArt(n.key)} className="npc-portrait" /> : null}
                  <strong>
                    {dead ? <Skull size={13} /> : null} {n.name}
                  </strong>
                  <button
                    type="button"
                    className={`icon-btn${n.shown ? ' icon-btn-on' : ''}`}
                    onClick={() => patchNpc(n.id, { shown: !n.shown })}
                    aria-label={n.shown ? t('combat.hideNpc') : t('combat.showNpc')}
                    title={n.shown ? t('combat.hideNpc') : t('combat.showNpc')}
                  >
                    {n.shown ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button type="button" className="icon-btn" onClick={() => removeNpc(n.id)} aria-label={t('item.remove')}>
                    <X size={14} />
                  </button>
                </div>
                <div className="combat-npc-row">
                  <span className="time-dim">{t('res.hpShort')}</span>
                  <Stepper
                    value={n.hp.current}
                    min={-20}
                    max={n.hp.max}
                    onChange={(v) => patchNpc(n.id, { hp: { ...n.hp, current: v } })}
                  />
                  <span className="time-dim">/ {n.hp.max}</span>
                  <span className="time-dim">{t('attr.abbr.str')}</span>
                  <Stepper
                    value={str.current}
                    min={0}
                    max={str.max}
                    onChange={(v) => patchNpc(n.id, { str: { ...str, current: v } })}
                  />
                  {n.armour ? <span className="tag">{t('item.defense')} {n.armour}</span> : null}
                  {n.crit && !dead ? <span className="chip chip-bad">{t('combat.crit')}</span> : null}
                </div>
                <div className="combat-npc-row">
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => attack(n)}>
                    {t('combat.attack')} W{n.dmg}
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => attack(n, 12)} title={t('item.enhancedHint')}>▲ W12</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => attack(n, 4)} title={t('item.impairedHint')}>▼ W4</button>
                  <form className="combat-hit" onSubmit={(e) => { e.preventDefault(); hit(n); }}>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder={t('combat.hitPlaceholder')}
                      aria-label={t('combat.hit')}
                      value={hitIn[n.id] ?? ''}
                      onChange={(e) => setHitIn((h) => ({ ...h, [n.id]: e.target.value }))}
                    />
                    <button type="submit" className="btn btn-sm" disabled={!hitIn[n.id]} title={t('combat.hitHint')}>
                      {t('combat.hit')}
                    </button>
                  </form>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => morale(n)} title={t('combat.morale.hint')}>
                    <HeartCrack size={13} /> {t('combat.morale')}
                  </button>
                </div>
                {n.attack ? <div className="time-dim combat-npc-note">{n.attack}{n.note ? ` · ${n.note}` : ''}</div> : null}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
