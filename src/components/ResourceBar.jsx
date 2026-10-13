import { Heart, Coins, Sparkles, HandHeart } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { Stepper, InfoHint } from './ui.jsx';
import { levelForXp, gritForLevel } from '../rules/character.js';
import { levelDoneOf, pendingLevels } from '../rules/levelup.js';
import { xpForDonation } from '../rules/economy.js';
import { encumbrance, zeroStates, pipPursesNeeded, pipPursesCarried } from '../rules/status.js';

export default function ResourceBar({ character, patch, onLevelUp, onLevelSkip, notify }) {
  const { t } = useLang();

  // Regel S. 11: je 10 selbstlos fuer die Gemeinschaft ausgegebene Pips 1 EP.
  const donate = () => {
    const raw = window.prompt(t('donate.prompt', { n: character.pips }));
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    if (n > character.pips) { notify?.(t('donate.tooMuch'), 'warn'); return; }
    const gain = xpForDonation(n);
    const xpNext = (character.xp || 0) + gain;
    patch({ pips: character.pips - n, xp: xpNext, level: levelForXp(xpNext), grit: gritForLevel(levelForXp(xpNext)) });
    notify?.(t('donate.done', { n, xp: gain }), 'ok');
  };
  const { hp, pips, xp } = character;
  const level = levelForXp(xp);
  const grit = gritForLevel(level);
  const enc = encumbrance(character);
  const zero = zeroStates(character);
  const pursesNeeded = pipPursesNeeded(pips);
  const pct = hp.max > 0 ? Math.max(0, Math.min(100, (hp.current / hp.max) * 100)) : 0;

  return (
    <div className="resource-bar">
      <div className="res-block res-hp">
        <div className="res-head">
          <Heart size={16} /> <span>{t('res.hp')}</span>
          <strong>
            {hp.current} / {hp.max}
          </strong>
        </div>
        <div className="hp-track">
          <div className="hp-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="res-steppers">
          <Stepper value={hp.current} min={0} max={hp.max} label={t('res.hp')}
            onChange={(n) => patch({ hp: { ...hp, current: n } })} />
          <span className="res-sep">/</span>
          <Stepper value={hp.max} min={0} max={20} label={`${t('res.hp')} ${t('attr.max')}`}
            onChange={(n) => patch({ hp: { max: n, current: Math.min(hp.current, n) } })} />
        </div>
      </div>

      <div className="res-block">
        <div className="res-head">
          <Coins size={16} /> <span>{t('res.pips')}</span>
          <InfoHint text={t('hint.pips')} />
        </div>
        <Stepper value={pips} min={0} max={99999} label={t('res.pips')} onChange={(n) => patch({ pips: n })} />
        <button type="button" className="link-btn res-donate" onClick={donate} disabled={!pips} title={t('donate.hint')}>
          <HandHeart size={12} /> {t('donate.button')}
        </button>
        {pursesNeeded > 0 ? (
          <p className={`res-note${enc.pipShort ? ' res-note-bad' : ''}`}>
            {t('pips.purses', { need: pursesNeeded, have: pipPursesCarried(character) })}
          </p>
        ) : null}
      </div>

      <div className="res-block">
        <div className="res-head">
          <Sparkles size={16} /> <span>{t('res.xp')}</span>
          <InfoHint text={t('hint.xp')} />
          <strong className="res-level">
            <span>{t('res.level')} {level}</span>
            <span>{t('res.grit')} {grit}</span>
          </strong>
        </div>
        <Stepper value={xp} min={0} max={999999} label={t('res.xp')}
          onChange={(n) => patch({ xp: n, level: levelForXp(n), grit: gritForLevel(levelForXp(n)) })} />
      </div>

      {pendingLevels(character) > 0 && onLevelUp ? (
        <div className="levelup-banner">
          <Sparkles size={16} />
          <strong>{t('levelup.ready', { level: levelDoneOf(character) + 1 })}</strong>
          <span className="hint">{t('levelup.hint')}</span>
          <button type="button" className="btn btn-sm btn-primary" onClick={onLevelUp}>
            {t('levelup.roll')}
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onLevelSkip} title={t('levelup.manualHint')}>
            {t('levelup.manual')}
          </button>
        </div>
      ) : null}

      {character.incapacitated ? (
        <div className="incap-banner">
          <span className="chip chip-bad">{t('incap.label')}</span>
          <span className="hint">{t('incap.hint')}</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => patch({ incapacitated: false })}>
            {t('incap.clear')}
          </button>
        </div>
      ) : null}

      {/* Attribut auf 0 (Regel S. 10) und Belastung (S. 8): nur anzeigen, die
          Folgen setzt der Tisch um. */}
      {zero.dead || zero.immobile || zero.insensible ? (
        <div className="incap-banner">
          {zero.dead ? <span className="chip chip-bad">{t('zero.deadShort')}</span> : null}
          {zero.immobile ? <span className="chip chip-bad">{t('zero.immobileShort')}</span> : null}
          {zero.insensible ? <span className="chip chip-bad">{t('zero.insensibleShort')}</span> : null}
          <span className="hint">
            {[zero.dead && t('player.gm.dead'), zero.immobile && t('zero.immobile'), zero.insensible && t('zero.insensible')]
              .filter(Boolean).join(' ')}
          </span>
        </div>
      ) : null}

      {enc.encumbered ? (
        <div className="incap-banner">
          <span className="chip chip-bad">{t('enc.label')}</span>
          <span className="hint">
            {t('enc.hint')}
            {enc.overflow.length ? ` ${t('enc.overflow', { n: enc.overflow.length })}` : ''}
            {enc.pipShort ? ` ${t('enc.pips', { n: enc.pipShort })}` : ''}
          </span>
        </div>
      ) : null}
    </div>
  );
}
