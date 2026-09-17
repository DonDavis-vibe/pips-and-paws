import { useEffect, useRef, useState } from 'react';
import { Dices, Trash2, Dice6 } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { rollDice, rollD66, rollSave } from '../rules/dice.js';
import { shareRoll, shareSave } from '../utils/discord.js';
import { RollButton, DiceStage } from './DiceKit.jsx';
import Panel from './Panel.jsx';

const SAVE_MODES = ['disadv', 'normal', 'adv'];

// external: ein Wurf, der woanders auf dem Bogen ausgeloest wurde (Waffenschaden,
// Rettungswurf ueber die Attributs-Box). Er soll hier erscheinen und nicht nur
// kurz als Meldung aufblitzen.
export default function DiceRoller({ character, onEvent, external }) {
  const { t } = useLang();
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);
  const [saveMode, setSaveMode] = useState('normal');
  const [customSides, setCustomSides] = useState('');
  const lastExternalRef = useRef(null);

  const record = (logEntry, stage) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setResult({ id, ...stage });
    setLog((prev) => [{ id, ...logEntry }, ...prev].slice(0, 20));
  };

  useEffect(() => {
    if (!external || external.id === lastExternalRef.current) return;
    lastExternalRef.current = external.id;
    setResult({ ...external.stage, id: external.id });
    setLog((prev) => [{ id: external.id, ...external.logEntry }, ...prev].slice(0, 20));
  }, [external]);

  const who = character.name || t('app.title');

  const rollD6 = () => {
    const { total } = rollDice(1, 6);
    record(
      { label: t('dice.d6'), verdict: t('dice.rolled', { value: total }) },
      { label: t('dice.d6'), value: total, max: 6, die: 6 },
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

  // Eigener Wuerfel mit frei eingegebener Seitenzahl — fuer alles, was nicht
  // schon einen Knopf hat (W3, W100, ...). Bewusst OHNE `die`-Flag, auch bei
  // Seitenzahlen wie 6/8/10/12: die Buehne zeigt fuer diese Wuerfel nur die
  // Zahl, den 3D-Wuerfel gibt es nur bei den festen Knoepfen, siehe DiceStage.
  const rollCustom = (e) => {
    e.preventDefault();
    const sides = parseInt(customSides, 10);
    if (!Number.isFinite(sides) || sides < 2 || sides > 1000) return;
    const { total } = rollDice(1, sides);
    const label = `${t('dice.dieLetter')}${sides}`;
    record(
      { label, verdict: t('dice.rolled', { value: total }) },
      { label, value: total, max: sides },
    );
    if (onEvent) onEvent({ kind: 'roll', label, value: total });
    shareRoll(who, label, total, '');
  };

  const save = (attrKey) => {
    const r = rollSave(character[attrKey].current, saveMode);
    const attr = t(`attr.${attrKey}`);
    const tone = r.ok ? 'ok' : 'bad';
    const verdict = r.ok ? t('dice.success') : t('dice.fail');
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
    <Panel
      id="dice"
      icon={Dices}
      title={t('dice.title')}
      className="dice-panel"
      right={log.length ? (
        <button
          type="button"
          className="icon-btn"
          onClick={() => { setLog([]); setResult(null); }}
          aria-label={t('dice.clearLog')}
        >
          <Trash2 size={15} />
        </button>
      ) : null}
    >
      <DiceStage result={result} idleIcon={<Dices size={24} />} idleText={t('dice.stageIdle')} />

      <div className="dice-buttons">
        <RollButton sides={6} label={t('dice.d6')} kind="basic" onRoll={rollD6} />
        <RollButton d66 label={t('dice.d66')} kind="basic" onRoll={roll66} />
        <span className="dice-sep">{t('dice.save')}</span>
        {['str', 'dex', 'wil'].map((k) => (
          <RollButton
            key={k}
            sides={20}
            label={t(`attr.abbr.${k}`)}
            kind="save"
            title={t('dice.saveVs', { attr: t(`attr.${k}`) })}
            onRoll={() => save(k)}
          />
        ))}
      </div>

      <form className="dice-custom" onSubmit={rollCustom}>
        <Dice6 size={15} className="dice-custom-icon" aria-hidden="true" />
        <input
          type="number"
          min="2"
          max="1000"
          inputMode="numeric"
          className="dice-custom-input"
          placeholder={t('dice.customPlaceholder')}
          value={customSides}
          onChange={(e) => setCustomSides(e.target.value)}
          aria-label={t('dice.customLabel')}
        />
        <button type="submit" className="btn btn-sm" disabled={!customSides}>
          {t('dice.customRoll')}
        </button>
      </form>

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
              className={e.ok === true ? 'roll-ok' : e.ok === false ? 'roll-bad' : ''}
            >
              <strong>{e.label}</strong>
              <span className="dice-verdict">{e.verdict}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
