import { Heart, Coins, Sparkles } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { Stepper } from './ui.jsx';
import { levelForXp, gritForLevel } from '../rules/character.js';

export default function ResourceBar({ character, patch }) {
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
        </div>
        <Stepper value={pips} min={0} max={99999} label={t('res.pips')} onChange={(n) => patch({ pips: n })} />
      </div>

      <div className="res-block">
        <div className="res-head">
          <Sparkles size={16} /> <span>{t('res.xp')}</span>
          <strong className="res-level">
            {t('res.level')} {level} · {t('res.grit')} {grit}
          </strong>
        </div>
        <Stepper value={xp} min={0} max={999999} label={t('res.xp')}
          onChange={(n) => patch({ xp: n, level: levelForXp(n), grit: gritForLevel(levelForXp(n)) })} />
      </div>
    </div>
  );
}
