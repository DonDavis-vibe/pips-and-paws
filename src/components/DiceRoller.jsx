import { useState } from 'react';
import { Dices, Trash2 } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { rollDice, rollD66, rollSave } from '../rules/dice.js';

export default function DiceRoller({ character, onEvent }) {
  const { t } = useLang();
  const [log, setLog] = useState([]);

  const push = (entry) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setLog((prev) => [{ id, ...entry }, ...prev].slice(0, 20));
  };

  const rollBasic = (sides, count = 1) => {
    const { dice, total } = rollDice(count, sides);
    const label = `${count}W${sides}`;
    push({ kind: 'plain', label, detail: dice.join(' + '), value: total });
    if (onEvent) onEvent({ kind: 'roll', label, value: total });
  };

  const roll66 = () => {
    const r = rollD66();
    push({ kind: 'plain', label: t('dice.d66'), detail: `${r.tens}${r.ones}`, value: r.value });
    if (onEvent) onEvent({ kind: 'roll', label: t('dice.d66'), value: r.value });
  };

  const save = (attrKey) => {
    const r = rollSave(character[attrKey].current);
    push({
      kind: 'save',
      label: t('dice.saveVs', { attr: t(`attr.${attrKey}`) }),
      detail: `d20 = ${r.d} ≤ ${r.target}`,
      ok: r.ok,
    });
    if (onEvent) onEvent({ kind: 'save', attr: attrKey, roll: r.d, target: r.target, ok: r.ok });
  };

  return (
    <section className="panel dice-panel">
      <div className="panel-head">
        <h2>
          <Dices size={18} /> {t('dice.title')}
        </h2>
        {log.length ? (
          <button type="button" className="icon-btn" onClick={() => setLog([])} aria-label={t('dice.clearLog')}>
            <Trash2 size={15} />
          </button>
        ) : null}
      </div>

      <div className="dice-buttons">
        <button type="button" className="btn" onClick={() => rollBasic(6)}>
          {t('dice.d6')}
        </button>
        <button type="button" className="btn" onClick={roll66}>
          {t('dice.d66')}
        </button>
        <span className="dice-sep">{t('dice.save')}:</span>
        {['str', 'dex', 'wil'].map((k) => (
          <button key={k} type="button" className="btn btn-ghost" onClick={() => save(k)}>
            {k.toUpperCase()}
          </button>
        ))}
      </div>

      <ul className="dice-log">
        {log.length === 0 ? (
          <li className="dice-empty">{t('dice.emptyLog')}</li>
        ) : (
          log.map((e) => (
            <li key={e.id} className={e.kind === 'save' ? (e.ok ? 'roll-ok' : 'roll-bad') : ''}>
              <strong>{e.label}</strong>
              <span className="dice-detail">{e.detail}</span>
              {e.kind === 'save' ? (
                <span className="dice-verdict">{e.ok ? t('dice.success') : t('dice.fail')}</span>
              ) : (
                <span className="dice-verdict">{t('dice.rolled', { value: e.value })}</span>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
