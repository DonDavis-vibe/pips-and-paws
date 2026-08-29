import { useState } from 'react';
import { Dices, Trash2 } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { rollDice, rollD66, rollSave } from '../rules/dice.js';
import { shareRoll, shareSave } from '../utils/discord.js';
import { RollButton, DiceStage } from './DiceKit.jsx';

const SAVE_MODES = ['disadv', 'normal', 'adv'];

export default function DiceRoller({ character, onEvent }) {
  const { t } = useLang();
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);
  const [saveMode, setSaveMode] = useState('normal');

  const record = (logEntry, stage) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setResult({ id, ...stage });
    setLog((prev) => [{ id, ...logEntry }, ...prev].slice(0, 20));
  };

  const who = character.name || t('app.title');

  const rollD6 = () => {
    const { total } = rollDice(1, 6);
    record(
      { label: t('dice.d6'), verdict: t('dice.rolled', { value: total }) },
      { label: t('dice.d6'), value: total, max: 6 },
    );
    if (onEvent) onEvent({ kind: 'roll', label: '1W6', value: total });
    shareRoll(who, '1W6', total, '');
  };

  const roll66 = () => {
    const r = rollD66();
    record(
      { label: t('dice.d66'), verdict: t('dice.rolled', { value: r.value }) },
      {
        label: t('dice.d66'),
        value: r.value,
        max: 66,
        parts: [
          { value: r.tens, label: t('dice.tens') },
          { value: r.ones, label: t('dice.ones') },
        ],
      },
    );
    if (onEvent) onEvent({ kind: 'roll', label: t('dice.d66'), value: r.value });
    shareRoll(who, t('dice.d66'), r.value, '');
  };

  const save = (attrKey) => {
    const r = rollSave(character[attrKey].current, saveMode);
    const attr = t(`attr.${attrKey}`);
    const tone = r.nat1 ? 'crit-good' : r.nat20 ? 'crit-bad' : r.ok ? 'ok' : 'bad';
    const verdict = (r.nat1 && t('dice.nat1')) || (r.nat20 && t('dice.nat20'))
      || (r.ok ? t('dice.success') : t('dice.fail'));
    const modeTag = saveMode === 'normal' ? '' : ` (${t(`dice.mode.${saveMode}`)})`;
    const parts = r.dice.length === 2
      ? [
        { value: r.dice[0], label: t('dice.roll') },
        { value: r.dice[1], label: t('dice.roll') },
        { value: `≤ ${r.target}`, label: t('dice.target') },
      ]
      : [
        { value: r.d, label: t('dice.roll') },
        { value: `≤ ${r.target}`, label: t('dice.target') },
      ];
    record(
      {
        label: `${t('dice.saveVs', { attr })}${modeTag}`,
        verdict: `${r.d} · ${r.ok ? t('dice.success') : t('dice.fail')}`,
        ok: r.ok,
        tone,
      },
      { label: `${t('dice.saveVs', { attr })}${modeTag}`, value: r.d, max: 20, tone, verdict, parts },
    );
    if (onEvent) onEvent({ kind: 'save', attr: attrKey, roll: r.d, target: r.target, ok: r.ok, mode: saveMode });
    shareSave(who, `${attr}${modeTag}`, r.d, r.target, r.ok);
  };

  return (
    <section className="panel dice-panel">
      <div className="panel-head">
        <h2>
          <Dices size={18} /> {t('dice.title')}
        </h2>
        {log.length ? (
          <button
            type="button"
            className="icon-btn"
            onClick={() => { setLog([]); setResult(null); }}
            aria-label={t('dice.clearLog')}
          >
            <Trash2 size={15} />
          </button>
        ) : null}
      </div>

      <DiceStage result={result} idleIcon={<Dices size={24} />} idleText={t('dice.stageIdle')} />

      <div className="dice-buttons">
        <RollButton sides={6} label={t('dice.d6')} kind="basic" onRoll={rollD6} />
        <RollButton d66 label={t('dice.d66')} kind="basic" onRoll={roll66} />
        <span className="dice-sep">{t('dice.save')}</span>
        {['str', 'dex', 'wil'].map((k) => (
          <RollButton
            key={k}
            sides={20}
            label={k.toUpperCase()}
            kind="save"
            title={t('dice.saveVs', { attr: t(`attr.${k}`) })}
            onRoll={() => save(k)}
          />
        ))}
      </div>

      <div className="save-mode" role="group" aria-label={t('dice.mode.label')}>
        {SAVE_MODES.map((m) => (
          <button
            key={m}
            type="button"
            className={`save-mode-btn${saveMode === m ? ' is-active' : ''}${m !== 'normal' ? ` save-mode-${m}` : ''}`}
            aria-pressed={saveMode === m}
            onClick={() => setSaveMode(m)}
          >
            {t(`dice.mode.${m}`)}
          </button>
        ))}
      </div>

      {log.length === 0 ? (
        <p className="hint dice-hint">{t('dice.emptyLog')}</p>
      ) : (
        <ul className="dice-log">
          {log.map((e) => (
            <li
              key={e.id}
              className={`${e.ok === true ? 'roll-ok' : e.ok === false ? 'roll-bad' : ''}${
                e.tone === 'crit-good' ? ' roll-crit-good' : e.tone === 'crit-bad' ? ' roll-crit-bad' : ''
              }`}
            >
              <strong>{e.label}</strong>
              <span className="dice-verdict">{e.verdict}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
