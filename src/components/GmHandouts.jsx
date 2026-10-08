import { useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Eye, Users, Trash2, Plus, Upload } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { readJSON, writeJSON } from '../utils/storage.js';
import { BattleMap } from '../battlemap/battlemap.js';
import { upfToDataUrl } from '../pnp/images.js';
import { partyId } from '../pnp/party.js';
import { usePnpHandler } from '../pnp/PnpBridge.jsx';
import { Field, TextInput } from './ui.jsx';
import Panel from './Panel.jsx';

// "pips-paws-gm-" -> wandert mit "SL-Sitzung sichern" in die Sicherungsdatei.
const KEY = 'pips-paws-gm-handouts';
const newId = () => `h_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

// Handout-Bibliothek des SL: Vorlesetexte und Bilder, die er den Spielern auf
// Knopfdruck zeigt (allen oder einzelnen). Gefuellt von Hand oder per
// PenNodePaper-Bruecke (src/pnp). Was gezeigt wurde, liegt beim Spieler auf
// dem eigenen Geraet (siehe PartyHandouts.jsx) — der SL kann es nicht
// zurueckholen, wie bei einem Zettel, der uebergeben wurde.
export default function GmHandouts({ mp, notify }) {
  const { t } = useLang();
  const [list, setList] = useState(() => {
    const saved = readJSON(KEY);
    return Array.isArray(saved) ? saved : [];
  });
  const listRef = useRef(list);
  listRef.current = list;
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [target, setTarget] = useState({}); // handoutId -> peerId
  const fileInput = useRef(null);

  const commit = (next) => {
    listRef.current = next;
    setList(next);
    if (!writeJSON(KEY, next)) notify?.(t('pnp.err.storageFull'), 'bad');
  };

  const upsert = (entry) => {
    const rest = listRef.current.filter((h) => h.id !== entry.id);
    commit([entry, ...rest]);
  };

  const players = Object.entries(mp.players || {}).map(([peerId, p]) => ({
    peerId, name: p.character?.name || '?', id: partyId(p.character, peerId),
  }));

  const toPlayer = (h) => ({ id: h.id, title: h.title, kind: h.kind, text: h.text, image: h.image });

  const show = (h, peerIds) => {
    const n = mp.sendHandout(toPlayer(h), peerIds);
    notify?.(n > 0 ? t('handout.shown', { n }) : t('handout.nobody'), n > 0 ? 'ok' : 'warn');
    return n;
  };

  // PenNodePaper: { id, title, kind, text, image, reveal, to }
  usePnpHandler('handout', async (p) => {
    if (!p || !p.id) throw new Error('handout: id missing');
    let image = null;
    if (p.kind === 'image') {
      image = (await upfToDataUrl(p.image, 'handout', 1400, 0.78)).dataUrl;
    } else if (!p.text) {
      throw new Error('handout: text missing');
    }
    const entry = {
      id: `pnp:${p.id}`, title: String(p.title || '').slice(0, 120) || t('handout.untitled'),
      kind: p.kind === 'image' ? 'image' : 'text', text: String(p.text || '').slice(0, 8000), image, addedAt: Date.now(),
    };
    upsert(entry);
    if (p.to) {
      const hit = players.find((x) => x.id === p.to || x.name.toLowerCase() === String(p.to).toLowerCase());
      if (!hit) throw new Error(t('pnp.err.playerAbsent', { name: p.to }));
      return { shownTo: mp.sendHandout(toPlayer(entry), [hit.peerId]) };
    }
    if (p.reveal) return { shownTo: mp.sendHandout(toPlayer(entry)) };
    return { shownTo: 0, library: true };
  });

  const onImage = async (file) => {
    if (!file) return;
    try {
      const r = await BattleMap.bildVerkleinern(file, 1400, 0.78);
      setImage(r.dataUrl);
    } catch {
      notify?.(t('portrait.failed'), 'bad');
    }
  };

  const create = () => {
    if (!title.trim() || (!text.trim() && !image)) return;
    upsert({
      id: newId(), title: title.trim(), kind: image ? 'image' : 'text', text: text.trim(), image, addedAt: Date.now(),
    });
    setTitle(''); setText(''); setImage(null); setAdding(false);
  };

  const remove = (h) => {
    if (!window.confirm(t('handout.removeConfirm', { name: h.title }))) return;
    commit(listRef.current.filter((x) => x.id !== h.id));
  };

  return (
    <Panel
      id="gm-handouts"
      icon={FileText}
      title={(
        <>
          {t('handout.title')}
          {list.length ? <span className="stash-count">{list.length}</span> : null}
        </>
      )}
      right={(
        <button type="button" className="btn btn-sm" onClick={() => setAdding((v) => !v)}>
          <Plus size={14} /> {t('handout.new')}
        </button>
      )}
    >
      <p className="hint">{t('handout.hint')}</p>

      {adding ? (
        <div className="custom-item-form handout-form">
          <Field label={t('handout.field.title')}>
            <TextInput value={title} onChange={setTitle} />
          </Field>
          <Field label={t('handout.field.text')}>
            <textarea className="notes" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <div className="handout-form-row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()}>
              <Upload size={14} /> {t('handout.addImage')}
            </button>
            {image ? <img className="handout-thumb" src={image} alt="" /> : null}
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => { onImage(e.target.files?.[0]); e.target.value = ''; }} />
            <button type="button" className="btn btn-sm btn-primary" disabled={!title.trim() || (!text.trim() && !image)} onClick={create}>
              {t('handout.save')}
            </button>
          </div>
        </div>
      ) : null}

      {list.length === 0 ? (
        <p className="hint">{t('handout.empty')}</p>
      ) : (
        <ul className="handout-list">
          {list.map((h) => (
            <li key={h.id} className="handout-item">
              <div className="handout-head">
                {h.kind === 'image' ? <ImageIcon size={15} /> : <FileText size={15} />}
                <button type="button" className="handout-title" onClick={() => setOpenId(openId === h.id ? null : h.id)}>
                  {h.title}
                </button>
                <button type="button" className="btn btn-sm" onClick={() => show(h, null)} title={t('handout.showAll')}>
                  <Eye size={14} /> {t('handout.showAll')}
                </button>
                <select
                  className="text-input handout-select"
                  value={target[h.id] || ''}
                  onChange={(e) => setTarget((prev) => ({ ...prev, [h.id]: e.target.value }))}
                  aria-label={t('handout.showTo')}
                >
                  <option value="">{t('handout.showTo')}</option>
                  {players.map((p) => <option key={p.peerId} value={p.peerId}>{p.name}</option>)}
                </select>
                <button
                  type="button"
                  className="icon-btn"
                  disabled={!target[h.id]}
                  onClick={() => show(h, [target[h.id]])}
                  aria-label={t('handout.showTo')}
                  title={t('handout.showTo')}
                >
                  <Users size={14} />
                </button>
                <button type="button" className="icon-btn" onClick={() => remove(h)} aria-label={t('item.remove')} title={t('item.remove')}>
                  <Trash2 size={14} />
                </button>
              </div>
              {openId === h.id ? (
                <div className="handout-body">
                  {h.image ? <img className="handout-image" src={h.image} alt={h.title} /> : null}
                  {h.text ? <p className="handout-text">{h.text}</p> : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
