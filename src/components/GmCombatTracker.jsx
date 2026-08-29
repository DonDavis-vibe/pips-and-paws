import { useCallback, useRef, useState } from 'react';
import { Swords, Plus, Minus, RotateCcw, X, Skull, ListOrdered, HeartCrack } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { readJSON, writeJSON } from '../utils/storage.js';
import { rollDie, rollSave } from '../rules/dice.js';
import { CREATURES, CREATURE_BY_KEY } from '../data/creatures.js';
import { Field, TextInput, Stepper } from './ui.jsx';

const KEY = 'pips-paws-gm-combat';
const fresh = () => ({ round: 0, npcs: [] });
const nid = () => `n_${Math.random().toString(36).slice(2, 8)}`;

// NSC-/Kampf-Tracker fuer den Spielleiter. Rein lokal, ueberlebt einen Reload.
export default function GmCombatTracker({ onLog, onInitiative }) {
  const { t, lang } = useLang();
  const [s, setS] = useState(() => ({ ...fresh(), ...readJSON(KEY) }));
  const [addOpen, setAddOpen] = useState(false);
  const [pick, setPick] = useState('rat');
  const [customName, setCustomName] = useState('');
  const [customHp, setCustomHp] = useState(3);
  const [customDmg, setCustomDmg] = useState(6);
  const [customWil, setCustomWil] = useState(8);
  const sRef = useRef(s);
  sRef.current = s;

  const commit = useCallback((next) => {
    sRef.current = next;
    setS(next);
    writeJSON(KEY, next);
  }, []);

  const nameWithNumber = (base) => {
    const same = sRef.current.npcs.filter((n) => n.base === base);
    return same.length ? `${base} ${same.length + 1}` : base;
  };

  const addCreature = () => {
    const c = CREATURE_BY_KEY[pick];
    const base = loc(c.name, lang);
    commit({
      ...s,
      npcs: [
        ...s.npcs,
        { id: nid(), base, name: nameWithNumber(base), hp: { current: c.hp, max: c.hp }, dmg: c.dmg, armour: c.armour, wil: c.wil ?? 8, note: loc(c.note, lang), attack: loc(c.attack, lang) },
      ],
    });
    setAddOpen(false);
  };

  const addCustom = () => {
    const base = customName.trim();
    if (!base) return;
    commit({
      ...s,
      npcs: [...s.npcs, { id: nid(), base, name: nameWithNumber(base), hp: { current: customHp, max: customHp }, dmg: customDmg, armour: 0, wil: customWil, note: '', attack: `W${customDmg}` }],
    });
    setCustomName('');
    setAddOpen(false);
  };

  const patchNpc = (id, partial) =>
    commit({ ...s, npcs: s.npcs.map((n) => (n.id === id ? { ...n, ...partial } : n)) });

  const removeNpc = (id) => commit({ ...s, npcs: s.npcs.filter((n) => n.id !== id) });

  const attack = (n) => {
    const roll = rollDie(n.dmg);
    onLog('combat.log.attack', { name: n.name, roll, die: `W${n.dmg}` });
  };

  const morale = (n) => {
    const wil = n.wil ?? 8;
    const r = rollSave(wil);
    onLog('combat.log.morale', {
      name: n.name,
      roll: r.d,
      wil,
      result: t(r.ok ? 'combat.morale.hold' : 'combat.morale.flee'),
    });
  };

  return (
    <section className="panel combat-panel">
      <div className="panel-head">
        <h2>
          <Swords size={18} /> {t('combat.title')}
        </h2>
        <div className="stash-head-actions">
          <button type="button" className="btn btn-sm btn-ghost" onClick={onInitiative}>
            <ListOrdered size={14} /> {t('combat.initiative')}
          </button>
          <button type="button" className="icon-btn" onClick={() => commit(fresh())} aria-label={t('time.reset')} title={t('time.reset')}>
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div className="time-row">
        <div className="time-clock">
          <span>{t('combat.round')}</span>
          <strong>{s.round}</strong>
        </div>
        <div className="time-steppers">
          <button type="button" className="btn btn-sm" onClick={() => commit({ ...s, round: Math.max(0, s.round - 1) })} aria-label="-">
            <Minus size={14} />
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => commit({ ...s, round: s.round + 1 })}>
            <Plus size={14} /> {t('combat.round')}
          </button>
        </div>
        <button type="button" className="btn btn-sm" onClick={() => setAddOpen((v) => !v)}>
          <Plus size={14} /> {t('combat.addNpc')}
        </button>
      </div>

      {addOpen ? (
        <div className="combat-add">
          <div className="inline-roll">
            <select className="text-input" value={pick} onChange={(e) => setPick(e.target.value)}>
              {CREATURES.map((c) => (
                <option key={c.key} value={c.key}>
                  {loc(c.name, lang)} — {c.hp} TP, W{c.dmg}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-sm btn-primary" onClick={addCreature}>
              {t('combat.add')}
            </button>
          </div>
          <div className="custom-item-form">
            <Field label={t('combat.customName')}>
              <TextInput value={customName} onChange={setCustomName} />
            </Field>
            <Field label={t('res.hpShort')}>
              <Stepper value={customHp} min={1} max={200} onChange={setCustomHp} />
            </Field>
            <Field label={t('item.damage')}>
              <select className="text-input" value={customDmg} onChange={(e) => setCustomDmg(+e.target.value)}>
                {[4, 6, 8, 10, 12].map((d) => (
                  <option key={d} value={d}>W{d}</option>
                ))}
              </select>
            </Field>
            <Field label={t('combat.wil')}>
              <Stepper value={customWil} min={1} max={20} onChange={setCustomWil} />
            </Field>
            <button type="button" className="btn btn-sm" disabled={!customName.trim()} onClick={addCustom}>
              {t('combat.add')}
            </button>
          </div>
        </div>
      ) : null}

      {s.npcs.length === 0 ? (
        <p className="hint">{t('combat.empty')}</p>
      ) : (
        <div className="combat-list">
          {s.npcs.map((n) => {
            const dead = n.hp.current <= 0;
            return (
              <div key={n.id} className={`combat-npc${dead ? ' npc-dead' : ''}`}>
                <div className="combat-npc-top">
                  <strong>
                    {dead ? <Skull size={13} /> : null} {n.name}
                  </strong>
                  <button type="button" className="icon-btn" onClick={() => removeNpc(n.id)} aria-label={t('item.remove')}>
                    <X size={14} />
                  </button>
                </div>
                <div className="combat-npc-row">
                  <span className="time-dim">{t('res.hpShort')}</span>
                  <Stepper
                    value={n.hp.current}
                    min={-20}
                    max={n.hp.max}
                    onChange={(v) => patchNpc(n.id, { hp: { ...n.hp, current: v } })}
                  />
                  <span className="time-dim">/ {n.hp.max}</span>
                  {n.armour ? <span className="tag">{t('item.defense')} {n.armour}</span> : null}
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => attack(n)}>
                    {t('combat.attack')} W{n.dmg}
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => morale(n)} title={t('combat.morale.hint')}>
                    <HeartCrack size={13} /> {t('combat.morale')}
                  </button>
                </div>
                {n.attack ? <div className="time-dim combat-npc-note">{n.attack}{n.note ? ` · ${n.note}` : ''}</div> : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
