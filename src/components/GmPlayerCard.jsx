import { useState } from 'react';
import { Heart, Coins, Shield, Swords, Backpack, Sparkles, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { readJSON, writeJSON } from '../utils/storage.js';
import { gritForLevel, ALL_SLOTS, PAW_SLOTS } from '../rules/character.js';
import { CONDITION_CATALOG } from '../data/items.js';
import AddItemMenu from './AddItemMenu.jsx';
import Portrait from './Portrait.jsx';
import {
  GM_DAMAGE, GM_HEAL, GM_PIPS, GM_XP, GM_SAVE, GM_GIVE, GM_CONDITION, GM_WHISPER,
} from '../multiplayer/protocol.js';

const NOTE_KEY = (id) => `pips-paws-gmnote-${id}`;
const SLOT_LABELS = {
  paw_left: 'P1', paw_right: 'P2', body_1: 'K1', body_2: 'K2',
  pack_1: 'R1', pack_2: 'R2', pack_3: 'R3', pack_4: 'R4', pack_5: 'R5', pack_6: 'R6',
};

export default function GmPlayerCard({ player, onCommand }) {
  const { t, lang } = useLang();
  const c = player.character || {};
  const items = player.items || {};
  const inv = c.inventory || {};
  const [open, setOpen] = useState(false);
  const [condOpen, setCondOpen] = useState(false);
  const [note, setNote] = useState(() => readJSON(NOTE_KEY(c.id), '') || '');

  const hpPct = c.hp?.max > 0 ? Math.max(0, Math.min(100, (c.hp.current / c.hp.max) * 100)) : 0;
  const hpColor = hpPct > 50 ? 'var(--ok)' : hpPct > 25 ? 'var(--warn)' : 'var(--bad)';

  const conditions = Object.values(items).filter((i) => i.type === 'condition' && !i.cleared);
  const grit = gritForLevel(c.level || 1);
  const usedSlots = ALL_SLOTS.filter((s) => inv[s]).length;
  const defence = Object.values(items)
    .filter((i) => i.type === 'armour')
    .reduce((sum, i) => sum + (i.defense || 0), 0);
  const pawItems = PAW_SLOTS
    .map((s) => inv[s] && !inv[s].cont && items[inv[s].itemId])
    .filter((i) => i && (i.type === 'weapon' || i.damage));

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
        <Portrait src={c.portrait} size="sm" />
        <div className="gm-card-id">
          <strong>{c.name || '?'}</strong>
          <span className="gm-bg">
            {c.background || ''}
            {c.disposition ? ` · ${c.disposition}` : ''}
          </span>
          <span className="gm-lvl">
            {t('res.level')} {c.level || 1} · {t('res.grit')} {grit} · {t('res.xp')} {c.xp ?? 0}
          </span>
        </div>
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
        <span className="gm-attr">
          <Shield size={12} /> {defence}
        </span>
        <span className={`gm-attr${usedSlots >= 10 ? ' gm-attr-hurt' : ''}`}>
          <Backpack size={12} /> {usedSlots}/10
        </span>
      </div>

      {pawItems.length ? (
        <div className="gm-gear">
          <Swords size={12} />
          {pawItems.map((i) => (
            <span key={i.itemId}>
              {loc(i.name, lang)}
              {i.damage ? ` (${i.damage})` : ''}
            </span>
          ))}
        </div>
      ) : null}

      {conditions.length ? (
        <div className="gm-conditions">
          {conditions.map((cond) => (
            <span key={cond.itemId} className="chip chip-bad" title={loc(cond.effect, lang)}>
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
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => ask('gm.prompt.xp', (n) => ({ cmd: GM_XP, amount: n }), true)}>
          <Sparkles size={13} /> {t('res.xp')}
        </button>
        <span className="gm-save-label">{t('gm.action.save')}:</span>
        {['str', 'dex', 'wil'].map((k) => (
          <button key={k} type="button" className="btn btn-sm btn-ghost" onClick={() => onCommand({ cmd: GM_SAVE, attr: k })}>
            {k.toUpperCase()}
          </button>
        ))}
        <AddItemMenu
          triggerClass="btn btn-sm btn-ghost"
          triggerLabel={t('gm.action.give')}
          onAdd={(item) => onCommand({ cmd: GM_GIVE, item })}
        />
        <span className="gm-cond-picker">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCondOpen((v) => !v)}>
            <AlertTriangle size={13} /> {t('gm.action.condition')}
          </button>
          {condOpen ? (
            <div className="gm-cond-menu">
              {Object.keys(CONDITION_CATALOG).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onCommand({ cmd: GM_CONDITION, key });
                    setCondOpen(false);
                  }}
                >
                  {loc(CONDITION_CATALOG[key].name, lang)}
                </button>
              ))}
            </div>
          ) : null}
        </span>
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
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} {t('gm.details')}
      </button>
      {open ? (
        <div className="gm-details">
          <div className="gm-inv-full">
            {ALL_SLOTS.map((s) => {
              const cell = inv[s];
              const it = cell && !cell.cont ? items[cell.itemId] : null;
              return (
                <div key={s} className={`gm-inv-slot${it ? '' : ' empty'}${cell?.cont ? ' cont' : ''}`}>
                  <span className="gm-inv-pos">{SLOT_LABELS[s]}</span>
                  <span>
                    {it ? loc(it.name, lang) : cell?.cont ? '↑' : '—'}
                    {it?.usage ? ` (${it.usage.current}/${it.usage.max})` : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {c.notes ? (
            <div className="gm-player-notes">
              <span className="gm-mini-label">{t('gm.playerNotes')}</span>
              <p>{c.notes}</p>
            </div>
          ) : null}

          <span className="gm-mini-label">{t('gm.secretNotes')}</span>
          <textarea
            className="notes gm-note"
            rows={2}
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
