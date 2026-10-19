import { useState } from 'react';
import { Swords } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { itemLabel } from '../data/items.js';
import { afterFightCandidates, rollAfterFight } from '../rules/usage.js';
import { dN } from '../utils/dice3d.js';

// "Nach dem Kampf" (Regel S. 8): fuer jede benutzte Waffe, Ruestung und
// Munition W6 — bei 4-6 Nutzung markieren. Vorausgewaehlt ist, was an Pfoten
// und Koerper steckt; abwaehlen, was nicht benutzt wurde.
export default function AfterFight({ character, setCharacter, notify, pushRoll }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState([]);

  const candidates = afterFightCandidates(character);
  const name = (id) => itemLabel(character.items[id], loc(character.items[id]?.name, lang));

  const toggleOpen = () => {
    if (!open) setPicked(candidates);
    setOpen((v) => !v);
  };

  const roll = () => {
    const { character: next, results } = rollAfterFight(character, picked);
    setCharacter(next);
    setOpen(false);
    if (!results.length) return;
    const text = results
      .map((r) => `${name(r.itemId)} ${r.always ? t('fight.always') : `W6 ${r.roll}`}${r.marked ? ' ●' : ''}${r.depleted ? ` (${t('fight.depleted')})` : ''}`)
      .join(' · ');
    const marked = results.filter((r) => r.marked).length;
    pushRoll(
      {
        label: t('fight.title'),
        value: marked,
        max: results.length,
        verdict: t('fight.marked', { n: marked }),
        parts: results.filter((r) => !r.always).map((r) => ({ value: r.roll, label: r.marked ? '●' : '○' })),
        dice3d: results.some((r) => !r.always) ? dN(6, ...results.filter((r) => !r.always).map((r) => r.roll)) : undefined,
      },
      { label: t('fight.title'), verdict: text },
    );
    notify(`${t('fight.title')}: ${text}`, results.some((r) => r.depleted) ? 'warn' : 'ok');
  };

  return (
    <span className="gm-cond-picker">
      <button type="button" className="btn btn-sm btn-ghost" onClick={toggleOpen} title={t('fight.hint')}>
        <Swords size={14} /> {t('fight.title')}
      </button>
      {open ? (
        <div className="gm-dmg-form fight-form">
          {candidates.length === 0 ? (
            <p className="hint">{t('fight.none')}</p>
          ) : (
            candidates.map((id) => (
              <label key={id} className="gm-dmg-check">
                <input
                  type="checkbox"
                  checked={picked.includes(id)}
                  onChange={(e) => setPicked((p) => (e.target.checked ? [...p, id] : p.filter((x) => x !== id)))}
                />
                {name(id)}
              </label>
            ))
          )}
          <p className="hint">{t('fight.hint')}</p>
          <button type="button" className="btn btn-sm btn-primary" disabled={!picked.length} onClick={roll}>
            {t('fight.roll')}
          </button>
        </div>
      ) : null}
    </span>
  );
}
