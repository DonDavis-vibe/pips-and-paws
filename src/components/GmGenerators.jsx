import { useState } from 'react';
import { Wand2, Dices, Copy, NotebookPen, FileText, Landmark } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { readJSON, writeJSON } from '../utils/storage.js';
import { emitGm } from '../utils/gmBus.js';
import { GENERATORS, SEASONS, runGenerator, rerollField } from '../rules/generators.js';
import { Stepper } from './ui.jsx';
import Panel from './Panel.jsx';

const KEY = 'pips-paws-gm-generators'; // Auswahl + Optionen (gm- -> Teil der SL-Sitzung)

// Wuerfelangabe fuers Anzeigen: "d20" -> "W20" (je nach Sprache), Wert dahinter.
const diceText = (r, letter) => `${r.die.replace(/d/g, letter)} ${r.value}`;

function resultTitle(result, t) {
  if (result.id === 'weather') return `${t('gen.g.weather')} — ${t(`gen.season.${result.opts.season}`)}`;
  return t(`gen.g.${result.id}`);
}

function labelFor(key, t) {
  const m = /^([tr])(\d+)$/.exec(key);
  if (m) return t(m[1] === 't' ? 'gen.f.treasure' : 'gen.f.room', { n: Number(m[2]) + 1 });
  return t(`gen.f.${key}`);
}

// Ergebnis als Klartext (Zwischenablage, Notizen, Handout)
function resultText(result, lang, t) {
  const lines = result.order
    .filter((k) => result.fields[k])
    .map((k) => `${labelFor(k, t)}: ${loc(result.fields[k].text, lang)}`);
  return lines.join('\n');
}

// Zufallsgeneratoren nach SRD (Wetter & Jahreszeit, NSC, Abenteuer-Idee, Hex,
// Siedlung, Schatz). Ergebnisse bleiben im Panel; jede Zeile laesst sich einzeln
// neu wuerfeln, das Ganze kopieren oder in die Notizen / Handout-Bibliothek legen.
export default function GmGenerators({ notify }) {
  const { t, lang } = useLang();
  const [state, setState] = useState(() => ({ active: 'weather', season: 'spring', split: false, bonus: 0, rooms: 6, ...readJSON(KEY) }));
  const [results, setResults] = useState({});
  const letter = t('dice.dieLetter');

  const save = (patch) => setState((prev) => {
    const next = { ...prev, ...patch };
    writeJSON(KEY, { active: next.active, season: next.season, split: next.split, bonus: next.bonus, rooms: next.rooms });
    return next;
  });

  const currentOpts = (id) => {
    if (id === 'weather') return { season: state.season };
    if (id === 'seed') return { split: state.split };
    if (id === 'treasure') return { bonus: state.bonus };
    if (id === 'rooms') return { rooms: state.rooms };
    return {};
  };

  const roll = (id = state.active) => setResults((prev) => ({ ...prev, [id]: runGenerator(id, currentOpts(id)) }));
  const reroll = (id, key) => setResults((prev) => ({ ...prev, [id]: rerollField(prev[id], key) }));

  const result = results[state.active];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${resultTitle(result, t)}\n${resultText(result, lang, t)}`);
      notify?.(t('gen.copied'), 'ok');
    } catch {
      notify?.(t('gen.copyFailed'), 'bad');
    }
  };
  const toNotes = () => {
    emitGm('notes:append', `${resultTitle(result, t)}\n${resultText(result, lang, t)}`);
    notify?.(t('gen.addedNotes'), 'ok');
  };
  const toHandout = () => {
    emitGm('handout:add', { title: resultTitle(result, t), text: resultText(result, lang, t) });
    notify?.(t('gen.addedHandout'), 'ok');
  };
  const settlementFromHex = () => {
    save({ active: 'settlement' });
    roll('settlement');
  };

  return (
    <Panel id="gm-generators" icon={Wand2} title={t('gen.title')}>
      <p className="hint">{t('gen.hint')}</p>

      <div className="gen-tabs" role="tablist">
        {GENERATORS.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={state.active === g.id}
            className={`map-tab${state.active === g.id ? ' active' : ''}`}
            onClick={() => save({ active: g.id })}
          >
            {t(`gen.g.${g.id}`)}
          </button>
        ))}
      </div>

      <div className="gen-opts">
        {state.active === 'weather' ? (
          <select className="text-input" value={state.season} onChange={(e) => { save({ season: e.target.value }); }} aria-label={t('gen.season')}>
            {SEASONS.map((s) => <option key={s} value={s}>{t(`gen.season.${s}`)}</option>)}
          </select>
        ) : null}
        {state.active === 'seed' ? (
          <label className="gm-share-log">
            <input type="checkbox" checked={state.split} onChange={(e) => save({ split: e.target.checked })} />
            {t('gen.split')}
          </label>
        ) : null}
        {state.active === 'treasure' ? (
          <span className="gen-bonus" title={t('gen.bonusHint')}>
            {t('gen.bonus')}
            <Stepper value={state.bonus} min={0} max={4} label={t('gen.bonus')} onChange={(n) => save({ bonus: n })} />
          </span>
        ) : null}
        {state.active === 'rooms' ? (
          <span className="gen-bonus">
            {t('gen.roomCount')}
            <Stepper value={state.rooms} min={1} max={20} label={t('gen.roomCount')} onChange={(n) => save({ rooms: n })} />
          </span>
        ) : null}
        <button type="button" className="btn btn-sm btn-primary" onClick={() => roll()}>
          <Dices size={14} /> {t('gen.roll')}
        </button>
      </div>
      {state.active === 'treasure' ? <p className="hint">{t('gen.bonusHint')}</p> : null}

      {result ? (
        <div className="gen-result">
          <div className="gen-title">{resultTitle(result, t)}</div>
          {result.order.filter((k) => result.fields[k]).map((k) => {
            const f = result.fields[k];
            return (
              <div key={k} className="gen-line">
                <span className="gen-label">{labelFor(k, t)}</span>
                <span className="gen-text">
                  {loc(f.text, lang)}
                  {f.poor ? <span className="tag gen-poor" title={t('gen.poorHint')}>{t('gen.poor')}</span> : null}
                  {f.flag === 'settlement' ? (
                    <button type="button" className="btn btn-sm btn-ghost" onClick={settlementFromHex}>
                      <Landmark size={13} /> {t('gen.toSettlement')}
                    </button>
                  ) : null}
                </span>
                <span className="gen-dice">{(f.rolls || []).map((r) => diceText(r, letter)).join(' · ')}</span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => reroll(result.id, k)}
                  aria-label={t('gen.reroll')}
                  title={t('gen.reroll')}
                >
                  <Dices size={14} />
                </button>
              </div>
            );
          })}
          {result.id === 'weather' && result.fields.weather?.poor ? <p className="hint">{t('gen.poorHint')}</p> : null}
          <div className="gen-actions">
            <button type="button" className="btn btn-sm btn-ghost" onClick={copy}><Copy size={13} /> {t('gen.copy')}</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={toNotes}><NotebookPen size={13} /> {t('gen.toNotes')}</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={toHandout}><FileText size={13} /> {t('gen.toHandout')}</button>
          </div>
        </div>
      ) : (
        <p className="hint">{t('gen.empty')}</p>
      )}
    </Panel>
  );
}
