import { useState } from 'react';
import { Crown, Dices, Plus, X } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { readJSON, writeJSON } from '../utils/storage.js';
import { FACTION_PRESETS } from '../data/factions.js';
import { currentGoal, isDone, relevantOf, rollFaction } from '../rules/factions.js';
import { Stepper } from './ui.jsx';
import Panel from './Panel.jsx';

const KEY = 'pips-paws-gm-factions'; // gm- -> Teil der exportierten SL-Sitzung

const uid = () => Math.random().toString(36).slice(2, 9);
const newGoal = (text = '', max = 3) => ({ id: uid(), text, max, progress: 0 });
const blankFaction = () => ({
  id: uid(), name: '', resources: [], goals: [newGoal()], rel: null, current: null, last: null,
});

function fromPreset(p, lang) {
  return {
    id: uid(),
    name: loc(p.name, lang),
    resources: p.resources.map((r) => loc(r, lang)),
    goals: p.goals.map((g) => newGoal(loc(g, lang), g.max)),
    rel: null,
    current: null,
    last: null,
  };
}

// Fraktionen-Tracker nach SRD: Ressourcen, Ziele mit Fortschrittsmarken und der
// W6-Wurf "zwischen den Sitzungen". Alles bleibt beim SL (Teil der SL-Sitzung).
export default function GmFactions({ notify }) {
  const { t, lang } = useLang();
  const [factions, setFactions] = useState(() => {
    const saved = readJSON(KEY);
    return Array.isArray(saved) ? saved : [];
  });
  const [rival, setRival] = useState({}); // transient: Abzug durch Rivalen je Fraktion
  const [preset, setPreset] = useState('');

  const commit = (next) => {
    setFactions(next);
    writeJSON(KEY, next);
  };
  const patch = (id, fn) => commit(factions.map((f) => (f.id === id ? fn(f) : f)));
  const patchGoal = (fid, gid, fn) => patch(fid, (f) => ({ ...f, goals: f.goals.map((g) => (g.id === gid ? fn(g) : g)) }));

  const describe = (r) => {
    if (!r) return t('fac.noGoal');
    const mods = `${r.die}${r.rel ? ` + ${r.rel}` : ''}${r.rival ? ` − ${r.rival}` : ''} = ${r.total}`;
    const gain = r.gain ? t('fac.gain', { n: r.gain }) : t('fac.noGain');
    return `${r.goalText || t('fac.unnamedGoal')}: ${mods} → ${gain}${r.completed ? ` — ${t('fac.completed')}` : ''}`;
  };

  const rollOne = (f) => {
    const out = rollFaction(f, rival[f.id] || 0);
    const last = describe(out.roll);
    if (out.roll?.completed) notify?.(t('fac.completedNotify', { name: f.name || t('fac.unnamed') }), 'ok');
    return { ...out.faction, last, lastDone: !!out.roll?.completed };
  };

  const rollAll = () => commit(factions.map(rollOne));

  const addPreset = () => {
    const p = FACTION_PRESETS.find((x) => x.id === preset);
    commit([...factions, p ? fromPreset(p, lang) : blankFaction()]);
    setPreset('');
  };

  const remove = (f) => {
    if (!window.confirm(t('fac.removeConfirm', { name: f.name || t('fac.unnamed') }))) return;
    commit(factions.filter((x) => x.id !== f.id));
  };

  return (
    <Panel id="gm-factions" icon={Crown} title={t('fac.title')}>
      <p className="hint">{t('fac.hint')}</p>

      <div className="fac-add">
        <select className="text-input" value={preset} onChange={(e) => setPreset(e.target.value)} aria-label={t('fac.preset')}>
          <option value="">{t('fac.blank')}</option>
          {FACTION_PRESETS.map((p) => <option key={p.id} value={p.id}>{loc(p.name, lang)}</option>)}
        </select>
        <button type="button" className="btn btn-sm" onClick={addPreset}><Plus size={14} /> {t('fac.add')}</button>
        {factions.length ? (
          <button type="button" className="btn btn-sm btn-primary" onClick={rollAll}>
            <Dices size={14} /> {t('fac.rollAll')}
          </button>
        ) : null}
      </div>

      {factions.length === 0 ? <p className="hint">{t('fac.empty')}</p> : null}

      {factions.map((f) => {
        const cur = currentGoal(f);
        return (
          <div key={f.id} className="fac-card">
            <div className="fac-head">
              <input
                className="text-input fac-name"
                value={f.name}
                placeholder={t('fac.namePlaceholder')}
                aria-label={t('fac.name')}
                onChange={(e) => patch(f.id, (x) => ({ ...x, name: e.target.value }))}
              />
              {f.resources.length >= 3 ? <span className="tag" title={t('fac.warbandHint')}>{t('fac.warband')}</span> : null}
              <button type="button" className="icon-btn" onClick={() => remove(f)} aria-label={t('fac.remove')} title={t('fac.remove')}>
                <X size={15} />
              </button>
            </div>

            <div className="fac-section">{t('fac.resources')}</div>
            <div className="fac-chips">
              {f.resources.map((r, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <span key={i} className="fac-chip">
                  {r}
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={t('fac.removeResource')}
                    onClick={() => patch(f.id, (x) => ({ ...x, resources: x.resources.filter((_, j) => j !== i), rel: null }))}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                className="text-input fac-chip-input"
                placeholder={t('fac.addResource')}
                aria-label={t('fac.addResource')}
                onKeyDown={(e) => {
                  const v = e.currentTarget.value.trim();
                  if (e.key !== 'Enter' || !v) return;
                  e.currentTarget.value = '';
                  patch(f.id, (x) => ({ ...x, resources: [...x.resources, v], rel: null }));
                }}
              />
            </div>

            <div className="fac-section">{t('fac.goals')}</div>
            {f.goals.map((g) => (
              <div key={g.id} className={`fac-goal${isDone(g) ? ' done' : ''}`}>
                <input
                  type="radio"
                  name={`cur-${f.id}`}
                  checked={cur?.id === g.id}
                  disabled={isDone(g)}
                  onChange={() => patch(f.id, (x) => ({ ...x, current: g.id }))}
                  aria-label={t('fac.setCurrent')}
                  title={t('fac.setCurrent')}
                />
                <input
                  className="text-input fac-goal-text"
                  value={g.text}
                  placeholder={t('fac.goalPlaceholder')}
                  aria-label={t('fac.goal')}
                  onChange={(e) => patchGoal(f.id, g.id, (x) => ({ ...x, text: e.target.value }))}
                />
                <span className="fac-dots" role="group" aria-label={t('fac.progress')}>
                  {Array.from({ length: g.max }, (_, i) => (
                    <button
                      // eslint-disable-next-line react/no-array-index-key
                      key={i}
                      type="button"
                      className={`fac-dot${i < g.progress ? ' on' : ''}`}
                      aria-pressed={i < g.progress}
                      aria-label={`${i + 1}/${g.max}`}
                      onClick={() => patchGoal(f.id, g.id, (x) => ({ ...x, progress: x.progress === i + 1 ? i : i + 1 }))}
                    />
                  ))}
                </span>
                <Stepper
                  value={g.max}
                  min={1}
                  max={8}
                  label={t('fac.marks')}
                  onChange={(n) => patchGoal(f.id, g.id, (x) => ({ ...x, max: n, progress: Math.min(x.progress, n) }))}
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={t('fac.removeGoal')}
                  onClick={() => patch(f.id, (x) => ({ ...x, goals: x.goals.filter((y) => y.id !== g.id) }))}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => patch(f.id, (x) => ({ ...x, goals: [...x.goals, newGoal()] }))}>
              <Plus size={13} /> {t('fac.addGoal')}
            </button>

            <div className="fac-roll">
              <span className="gen-bonus" title={t('fac.relHint')}>
                {t('fac.relevant')}
                <Stepper
                  value={relevantOf(f)}
                  min={0}
                  max={20}
                  label={t('fac.relevant')}
                  onChange={(n) => patch(f.id, (x) => ({ ...x, rel: n }))}
                />
              </span>
              <span className="gen-bonus" title={t('fac.rivalHint')}>
                {t('fac.rival')}
                <Stepper
                  value={rival[f.id] || 0}
                  min={0}
                  max={20}
                  label={t('fac.rival')}
                  onChange={(n) => setRival((r) => ({ ...r, [f.id]: n }))}
                />
              </span>
              <button type="button" className="btn btn-sm btn-primary" disabled={!cur} onClick={() => commit(factions.map((x) => (x.id === f.id ? rollOne(x) : x)))}>
                <Dices size={14} /> {t('fac.roll')}
              </button>
            </div>
            {f.last ? <p className={`fac-last${f.lastDone ? ' done' : ''}`}>{f.last}</p> : null}
            {f.lastDone ? <p className="hint">{t('fac.newResourceHint')}</p> : null}
          </div>
        );
      })}
    </Panel>
  );
}
