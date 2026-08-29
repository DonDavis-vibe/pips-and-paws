import { Moon } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { rollDie } from '../rules/dice.js';

// Rast nach Mausritter-SRD:
//   Kurz  (1 Zug)   : W6+1 TP zurueck
//   Lang  (1 Wache) : Ration essen, alle TP zurueck; sind sie voll, W6 auf einen Wert
//   Voll  (1 Woche) : alle TP und alle Werte voll
export default function RestControls({ character, setCharacter, notify }) {
  const { t } = useLang();

  const findRationId = (items) =>
    Object.keys(items).find((k) => {
      const it = items[k];
      return it.type === 'ration' && it.usage && it.usage.current < it.usage.max;
    });

  const consumeRation = (items) => {
    const rid = findRationId(items);
    if (!rid) return items;
    const it = items[rid];
    return { ...items, [rid]: { ...it, usage: { ...it.usage, current: it.usage.current + 1 } } };
  };

  const shortRest = () => {
    const heal = rollDie(6) + 1;
    setCharacter((c) => ({ ...c, hp: { ...c.hp, current: Math.min(c.hp.max, c.hp.current + heal) } }));
    notify(t('rest.log.short', { n: heal }), 'ok');
  };

  const longRest = () => {
    const c = character;
    const rationNote = findRationId(c.items || {}) ? '' : ` — ${t('rest.noRation')}`;
    const needHp = c.hp.current < c.hp.max;
    const gap = needHp
      ? null
      : ['str', 'dex', 'wil'].map((k) => ({ k, d: c[k].max - c[k].current })).sort((a, b) => b.d - a.d)[0];
    const attrAmt = gap && gap.d > 0 ? Math.min(rollDie(6), gap.d) : 0;

    setCharacter((p) => {
      const next = { ...p, items: consumeRation(p.items || {}) };
      if (needHp) next.hp = { ...p.hp, current: p.hp.max };
      else if (attrAmt > 0) {
        next[gap.k] = { ...p[gap.k], current: Math.min(p[gap.k].max, p[gap.k].current + attrAmt) };
      }
      return next;
    });

    if (needHp) notify(t('rest.log.long') + rationNote, 'ok');
    else if (attrAmt > 0) notify(t('rest.log.longAttr', { n: attrAmt, attr: t(`attr.${gap.k}`) }) + rationNote, 'ok');
    else notify(t('rest.log.longFull') + rationNote, 'ok');
  };

  const fullRest = () => {
    setCharacter((c) => ({
      ...c,
      hp: { ...c.hp, current: c.hp.max },
      str: { ...c.str, current: c.str.max },
      dex: { ...c.dex, current: c.dex.max },
      wil: { ...c.wil, current: c.wil.max },
    }));
    notify(t('rest.log.full'), 'ok');
  };

  return (
    <div className="rest-controls">
      <span className="rest-label">
        <Moon size={14} /> {t('rest.title')}
      </span>
      <button type="button" className="btn btn-sm btn-ghost" onClick={shortRest} title={t('rest.shortHint')}>
        {t('rest.short')}
      </button>
      <button type="button" className="btn btn-sm btn-ghost" onClick={longRest} title={t('rest.longHint')}>
        {t('rest.long')}
      </button>
      <button type="button" className="btn btn-sm btn-ghost" onClick={fullRest} title={t('rest.fullHint')}>
        {t('rest.full')}
      </button>
    </div>
  );
}
