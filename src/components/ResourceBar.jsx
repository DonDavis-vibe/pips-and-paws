import { Heart, Coins, Sparkles } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { Stepper, InfoHint } from './ui.jsx';
import { levelForXp, gritForLevel } from '../rules/character.js';
import { levelDoneOf, pendingLevels } from '../rules/levelup.js';

export default function ResourceBar({ character, patch, onLevelUp, onLevelSkip }) {
  const { t } = useLang();
  const { hp, pips, xp } = character;
  const level = levelForXp(xp);
  const grit = gritForLevel(level);
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
          <span className="chip chip-bad" title={t('incap.hint')}>{t('incap.label')}</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => patch({ incapacitated: false })}>
            {t('incap.clear')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
