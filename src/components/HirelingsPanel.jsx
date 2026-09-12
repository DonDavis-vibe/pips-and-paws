import { useState } from 'react';
import { Dices, Plus, Trash2, UserPlus } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import Panel from './Panel.jsx';
import { Stepper } from './ui.jsx';
import { HIRELING_CATALOG, newHireling } from '../rules/hirelings.js';

function StatPair({ label, value, onChange }) {
  return (
    <div className="hireling-stat">
      <span className="attr-cap">{label}</span>
      <div className="hireling-stat-row">
        <Stepper value={value.current} min={0} max={value.max} label={`${label} aktuell`}
          onChange={(n) => onChange({ ...value, current: n })} />
        <span className="res-sep">/</span>
        <Stepper value={value.max} min={0} max={30} label={`${label} max`}
          onChange={(n) => onChange({ ...value, max: n, current: Math.min(value.current, n) })} />
      </div>
    </div>
  );
}

// Miethelfer: Anheuern (SRD-Katalog schlaegt Art + Tageslohn vor, W6 TP und
// je 2W6 STR/GES/WIL werden sofort ausgewuerfelt), danach frei editierbar.
// Bewusst kein eigenes Inventarraster — siehe rules/hirelings.js.
export default function HirelingsPanel({ hirelings, onChange, onMoraleSave }) {
  const { t, lang } = useLang();
  const [pick, setPick] = useState('');

  const update = (id, patch) => onChange(hirelings.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  const remove = (id) => onChange(hirelings.filter((h) => h.id !== id));
  const add = () => {
    onChange([...hirelings, newHireling(pick)]);
    setPick('');
  };

  return (
    <Panel
      id="hirelings"
      icon={UserPlus}
      title={t('hirelings.title')}
      right={(
        <div className="hireling-add">
          <select className="text-input" value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">{t('hirelings.customKind')}</option>
            {HIRELING_CATALOG.map((c) => (
              <option key={c.key} value={c.key}>
                {loc(c.name, lang)} · {c.wage}p
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-sm" onClick={add}>
            <Plus size={14} /> {t('hirelings.hire')}
          </button>
        </div>
      )}
    >
      <p className="hint">{t('hirelings.hint')}</p>

      {hirelings.length === 0 ? (
        <p className="hint">{t('hirelings.empty')}</p>
      ) : (
        <div className="hirelings-list">
          {hirelings.map((h) => (
            <div key={h.id} className="hireling-card">
              <div className="hireling-top">
                <input
                  className="text-input hireling-name"
                  value={h.name}
                  placeholder={t('hirelings.namePlaceholder')}
                  onChange={(e) => update(h.id, { name: e.target.value })}
                />
                <select
                  className="text-input hireling-kind"
                  value={h.kind}
                  onChange={(e) => update(h.id, { kind: e.target.value })}
                >
                  <option value="">{t('hirelings.customKind')}</option>
                  {HIRELING_CATALOG.map((c) => (
                    <option key={c.key} value={c.key}>{loc(c.name, lang)}</option>
                  ))}
                </select>
                <button type="button" className="icon-btn item-del" onClick={() => remove(h.id)} aria-label={t('gm.local.remove')}>
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="hireling-stats">
                <StatPair label={t('res.hpShort')} value={h.hp} onChange={(v) => update(h.id, { hp: v })} />
                <StatPair label={t('attr.abbr.str')} value={h.str} onChange={(v) => update(h.id, { str: v })} />
                <StatPair label={t('attr.abbr.dex')} value={h.dex} onChange={(v) => update(h.id, { dex: v })} />
                <StatPair label={t('attr.abbr.wil')} value={h.wil} onChange={(v) => update(h.id, { wil: v })} />
              </div>

              <div className="hireling-foot">
                <label className="hireling-wage">
                  {t('hirelings.wage')}
                  <input
                    type="number"
                    className="text-input"
                    value={h.wage}
                    min="0"
                    onChange={(e) => update(h.id, { wage: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                  />
                  {t('hirelings.wagePerDay')}
                </label>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => onMoraleSave(h)}>
                  <Dices size={13} /> {t('hirelings.moraleSave')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
