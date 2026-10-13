import { useState } from 'react';
import { Dices, Plus, Trash2, UserPlus, Undo2, X } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import Panel from './Panel.jsx';
import { Stepper } from './ui.jsx';
import {
  HIRELING_CATALOG, HIRELING_SLOTS, newHireling, withHirelingInventory, hirelingAddItem, hirelingRemoveItem,
} from '../rules/hirelings.js';
import { addItem, removeItem } from '../rules/inventory.js';
import { itemLabel } from '../data/items.js';
import AddItemMenu from './AddItemMenu.jsx';

const SLOT_SHORT = { paw_left: 'P1', paw_right: 'P2', body_1: 'K1', body_2: 'K2', pack_1: 'R1', pack_2: 'R2' };

// Inventar eines Miethelfers (Regel S. 14: 6 Plaetze — 2 Pfoten, 2 Koerper,
// 2 Rucksack). Uebergeben/Zuruecknehmen tauscht mit dem Inventar der Maus.
function HirelingInventory({ hireling, character, setCharacter, notify }) {
  const { t, lang } = useLang();
  const h = withHirelingInventory(hireling);
  const name = (it) => itemLabel(it, loc(it?.name, lang));
  const mouseItems = Object.values(character.items || {}).filter((i) => i.type !== 'condition');

  const setHireling = (c, next) => ({ ...c, hirelings: (c.hirelings || []).map((x) => (x.id === h.id ? next : x)) });

  const give = (itemId) => {
    const item = character.items[itemId];
    if (!item) return;
    const res = hirelingAddItem(h, item);
    if (!res.ok) { notify?.(t('hirelings.invFull'), 'warn'); return; }
    setCharacter((c) => setHireling(removeItem(c, itemId), res.hireling));
  };

  const takeBack = (itemId) => {
    const item = h.items[itemId];
    const res = addItem(character, item);
    if (!res.ok) { notify?.(t('inv.noRoom'), 'warn'); return; }
    setCharacter((c) => setHireling(addItem(c, item).character, hirelingRemoveItem(h, itemId)));
  };

  const addNew = (item) => {
    const res = hirelingAddItem(h, item);
    if (!res.ok) { notify?.(t('hirelings.invFull'), 'warn'); return; }
    setCharacter((c) => setHireling(c, res.hireling));
  };

  const toggleDot = (it, i) => {
    const next = { ...it, usage: { ...it.usage, current: i < it.usage.current ? i : i + 1 } };
    setCharacter((c) => setHireling(c, { ...h, items: { ...h.items, [it.itemId]: next } }));
  };

  const used = HIRELING_SLOTS.filter((sl) => h.inventory[sl]).length;

  return (
    <div className="hireling-inv">
      <div className="hireling-inv-head">
        <span className="attr-cap">{t('hirelings.inventory', { n: used })}</span>
        <select
          className="text-input"
          value=""
          onChange={(e) => { if (e.target.value) give(e.target.value); }}
          aria-label={t('hirelings.give')}
        >
          <option value="">{t('hirelings.give')}</option>
          {mouseItems.map((it) => <option key={it.itemId} value={it.itemId}>{name(it)}</option>)}
        </select>
        <AddItemMenu onAdd={addNew} triggerClass="btn btn-sm btn-ghost" triggerLabel={t('hirelings.addNew')} />
      </div>
      <div className="hireling-inv-grid">
        {HIRELING_SLOTS.map((sl) => {
          const v = h.inventory[sl];
          const it = v ? h.items[v.itemId] : null;
          return (
            <div key={sl} className={`hireling-slot${it ? ' filled' : ''}`}>
              <span className="gm-inv-pos">{SLOT_SHORT[sl]}</span>
              {v?.cont ? <span className="time-dim">↑</span> : it ? (
                <>
                  <span className="hireling-item-name">{name(it)}</span>
                  {it.usage ? (
                    <span className="usage-dots">
                      {Array.from({ length: it.usage.max }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`dot${i < it.usage.current ? ' dot-on' : ''}`}
                          onClick={() => toggleDot(it, i)}
                          aria-label={`${t('item.uses')} ${i + 1}`}
                        />
                      ))}
                    </span>
                  ) : null}
                  <button type="button" className="icon-btn" onClick={() => takeBack(it.itemId)} title={t('hirelings.takeBack')} aria-label={t('hirelings.takeBack')}>
                    <Undo2 size={13} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn item-del"
                    onClick={() => setCharacter((c) => setHireling(c, hirelingRemoveItem(h, it.itemId)))}
                    aria-label={t('item.remove')}
                  >
                    <X size={13} />
                  </button>
                </>
              ) : <span className="slot-empty">{t('inv.empty')}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
// Jeder hat ein eigenes Inventar mit 6 Plaetzen (HirelingInventory oben).
export default function HirelingsPanel({ hirelings, onChange, onMoraleSave, character, setCharacter, notify }) {
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

              {character && setCharacter ? (
                <HirelingInventory hireling={h} character={character} setCharacter={setCharacter} notify={notify} />
              ) : null}

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
