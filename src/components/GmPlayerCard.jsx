import { useState } from 'react';
import { Heart, Coins, ChevronDown, ChevronRight } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { readJSON, writeJSON } from '../utils/storage.js';
import {
  GM_DAMAGE, GM_HEAL, GM_PIPS, GM_SAVE, GM_WHISPER,
} from '../multiplayer/protocol.js';

const NOTE_KEY = (id) => `pips-paws-gmnote-${id}`;

export default function GmPlayerCard({ player, onCommand }) {
  const { t, lang } = useLang();
  const c = player.character || {};
  const items = player.items || {};
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(() => readJSON(NOTE_KEY(c.id), '') || '');

  const hpPct = c.hp?.max > 0 ? Math.max(0, Math.min(100, (c.hp.current / c.hp.max) * 100)) : 0;
  const hpColor = hpPct > 50 ? 'var(--ok)' : hpPct > 25 ? 'var(--warn)' : 'var(--bad)';

  const conditions = Object.values(items).filter((i) => i.type === 'condition' && !i.cleared);
  const invList = Object.values(items).filter((i) => i.type !== 'condition');

  const ask = (labelKey, cmd, allowNeg = false) => {
    const raw = window.prompt(t(labelKey));
    if (raw == null) return;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || (!allowNeg && n < 0)) return;
    onCommand(cmd(n));
  };

  return (
    <div className="gm-card">
      <div className="gm-card-head">
        <div>
          <strong>{c.name || '?'}</strong>
          <span className="gm-bg">{c.background || ''}</span>
        </div>
        <span className="gm-lvl">
          {t('res.level')} {c.level || 1}
        </span>
      </div>

      <div className="gm-hp">
        <div className="gm-hp-row">
          <span>
            <Heart size={13} /> {t('res.hpShort')}
          </span>
          <strong style={{ color: hpColor }}>
            {c.hp?.current ?? 0} / {c.hp?.max ?? 0}
          </strong>
        </div>
        <div className="hp-track">
          <div className="hp-fill" style={{ width: `${hpPct}%`, background: hpColor }} />
        </div>
      </div>

      <div className="gm-attrs">
        {['str', 'dex', 'wil'].map((k) => {
          const a = c[k] || { current: 0, max: 0 };
          return (
            <span key={k} className={`gm-attr${a.current < a.max ? ' gm-attr-hurt' : ''}`}>
              {k.toUpperCase()} {a.current}
              {a.current !== a.max ? `/${a.max}` : ''}
            </span>
          );
        })}
        <span className="gm-attr">
          <Coins size={12} /> {c.pips ?? 0}
        </span>
      </div>

      {conditions.length ? (
        <div className="gm-conditions">
          {conditions.map((cond) => (
            <span key={cond.itemId} className="chip chip-bad">
              {loc(cond.name, lang)}
            </span>
          ))}
        </div>
      ) : null}

      <div className="gm-actions">
        <button type="button" className="btn btn-sm btn-danger" onClick={() => ask('gm.prompt.damage', (n) => ({ cmd: GM_DAMAGE, amount: n, target: 'hp' }))}>
          {t('gm.action.damage')}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => ask('gm.prompt.heal', (n) => ({ cmd: GM_HEAL, amount: n, target: 'hp' }))}>
          {t('gm.action.heal')}
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => ask('gm.prompt.pips', (n) => ({ cmd: GM_PIPS, amount: n }), true)}>
          {t('gm.action.pips')}
        </button>
        <span className="gm-save-label">{t('gm.action.save')}:</span>
        {['str', 'dex', 'wil'].map((k) => (
          <button key={k} type="button" className="btn btn-sm btn-ghost" onClick={() => onCommand({ cmd: GM_SAVE, attr: k })}>
            {k.toUpperCase()}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => {
            const text = window.prompt(t('gm.prompt.whisper'));
            if (text) onCommand({ cmd: GM_WHISPER, text });
          }}
        >
          {t('gm.action.whisper')}
        </button>
      </div>

      <button type="button" className="link-btn" onClick={() => setOpen((v) => !v)}>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} {t('gm.expandInv')} ({invList.length})
      </button>
      {open ? (
        <div className="gm-inv">
          {invList.map((i) => (
            <span key={i.itemId} className="chip">
              {loc(i.name, lang)}
              {i.usage ? ` (${i.usage.current}/${i.usage.max})` : ''}
            </span>
          ))}
          <textarea
            className="notes gm-note"
            rows={2}
            placeholder={t('gm.secretNotes')}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              writeJSON(NOTE_KEY(c.id), e.target.value);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
