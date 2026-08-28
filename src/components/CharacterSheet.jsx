import { useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { User, Backpack } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { Field, TextInput } from './ui.jsx';
import AttributeBox from './AttributeBox.jsx';
import ResourceBar from './ResourceBar.jsx';
import InventoryGrid from './InventoryGrid.jsx';
import ItemCard from './ItemCard.jsx';
import AddItemMenu from './AddItemMenu.jsx';
import DiceRoller from './DiceRoller.jsx';
import { tryMove, addItem, removeItem } from '../rules/inventory.js';
import { rollSave } from '../rules/dice.js';

export default function CharacterSheet({ character, setCharacter, notify, onEvent }) {
  const { t } = useLang();
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  const patch = (partial) => setCharacter((c) => ({ ...c, ...partial }));

  const onItemChange = (next) =>
    setCharacter((c) => ({ ...c, items: { ...c.items, [next.itemId]: next } }));

  const onItemRemove = (itemId) => setCharacter((c) => removeItem(c, itemId));

  const onAdd = (item) => {
    setCharacter((c) => {
      const res = addItem(c, item);
      if (!res.ok) {
        notify(t(`inv.${res.reason}`), 'warn');
        return c;
      }
      return res.character;
    });
  };

  const onDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    setCharacter((c) => {
      const res = tryMove(c.inventory, c.items, active.id, over.id);
      if (!res.ok) {
        notify(t(`inv.${res.reason}`), 'warn');
        return c;
      }
      return { ...c, inventory: res.inventory };
    });
  };

  const onSave = (attrKey) => {
    const r = rollSave(character[attrKey].current);
    notify(
      `${t('dice.saveVs', { attr: t(`attr.${attrKey}`) })} — d20 ${r.d} ≤ ${r.target} · ${r.ok ? t('dice.success') : t('dice.fail')}`,
      r.ok ? 'ok' : 'bad',
    );
    if (onEvent) onEvent({ kind: 'save', attr: attrKey, roll: r.d, target: r.target, ok: r.ok });
  };

  const activeItem = activeId ? character.items[activeId] : null;

  return (
    <div className="sheet">
      <section className="panel">
        <div className="panel-head">
          <h2>
            <User size={18} /> {t('sheet.identity')}
          </h2>
        </div>
        <div className="identity-grid">
          <Field label={t('sheet.name')}>
            <TextInput value={character.name} onChange={(v) => patch({ name: v })} />
          </Field>
          <Field label={t('sheet.player')}>
            <TextInput value={character.playerName} onChange={(v) => patch({ playerName: v })} />
          </Field>
          <Field label={t('sheet.background')}>
            <TextInput value={character.background} onChange={(v) => patch({ background: v })} />
          </Field>
          <Field label={t('sheet.birthsign')}>
            <TextInput value={character.birthsign} onChange={(v) => patch({ birthsign: v })} />
          </Field>
          <Field label={t('sheet.disposition')}>
            <TextInput value={character.disposition} onChange={(v) => patch({ disposition: v })} />
          </Field>
          <Field label={t('sheet.coat')}>
            <TextInput value={character.coat} onChange={(v) => patch({ coat: v })} />
          </Field>
          <Field label={t('sheet.detail')}>
            <TextInput value={character.detail} onChange={(v) => patch({ detail: v })} />
          </Field>
        </div>
      </section>

      <section className="panel">
        <div className="attr-grid">
          <AttributeBox attrKey="str" labelKey="attr.str" value={character.str}
            onChange={(v) => patch({ str: v })} onSave={onSave} />
          <AttributeBox attrKey="dex" labelKey="attr.dex" value={character.dex}
            onChange={(v) => patch({ dex: v })} onSave={onSave} />
          <AttributeBox attrKey="wil" labelKey="attr.wil" value={character.wil}
            onChange={(v) => patch({ wil: v })} onSave={onSave} />
        </div>
        <ResourceBar character={character} patch={patch} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>
            <Backpack size={18} /> {t('inv.title')}
          </h2>
          <AddItemMenu onAdd={onAdd} />
        </div>
        <DndContext
          sensors={sensors}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={onDragEnd}
        >
          <InventoryGrid character={character} onItemChange={onItemChange} onItemRemove={onItemRemove} />
          <DragOverlay>{activeItem ? <ItemCard item={activeItem} overlay /> : null}</DragOverlay>
        </DndContext>
      </section>

      <DiceRoller character={character} onEvent={onEvent} />

      <section className="panel">
        <div className="panel-head">
          <h2>{t('sheet.notes')}</h2>
        </div>
        <textarea
          className="notes"
          rows={4}
          placeholder={t('sheet.notesPlaceholder')}
          value={character.notes}
          onChange={(e) => patch({ notes: e.target.value })}
        />
      </section>
    </div>
  );
}
