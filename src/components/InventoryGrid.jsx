import { useDroppable } from '@dnd-kit/core';
import { useLang } from '../i18n/index.jsx';
import { PAW_SLOTS, BODY_SLOTS, PACK_SLOTS } from '../rules/character.js';
import ItemCard from './ItemCard.jsx';

function Slot({ slot, item, onChange, onRemove, wide }) {
  const { t } = useLang();
  const { setNodeRef, isOver } = useDroppable({ id: slot });
  return (
    <div
      ref={setNodeRef}
      className={`inv-slot${isOver ? ' slot-over' : ''}${wide ? ' slot-wide' : ''}${item ? ' slot-filled' : ''}`}
    >
      {item ? (
        <ItemCard item={item} onChange={onChange} onRemove={onRemove} />
      ) : (
        <span className="slot-empty">{t('inv.empty')}</span>
      )}
    </div>
  );
}

function Group({ title, slots, inventory, items, onItemChange, onItemRemove }) {
  const cells = [];
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    const val = inventory[slot];
    if (val?.cont) continue; // Fortsetzungsfeld eines 2-Platz-Gegenstands
    const item = val ? items[val.itemId] : null;
    const wide = item?.size === 2;
    cells.push(
      <Slot
        key={slot}
        slot={slot}
        item={item}
        wide={wide}
        onChange={(next) => onItemChange(next)}
        onRemove={() => onItemRemove(val.itemId)}
      />,
    );
    if (wide) i += 1; // das gepaarte Feld ueberspringen
  }

  return (
    <div className="inv-group">
      <div className="inv-group-title">{title}</div>
      <div className="inv-cells">{cells}</div>
    </div>
  );
}

export default function InventoryGrid({ character, onItemChange, onItemRemove }) {
  const { t } = useLang();
  const { inventory, items } = character;
  return (
    <div className="inventory">
      <Group title={t('inv.paws')} slots={PAW_SLOTS} inventory={inventory} items={items}
        onItemChange={onItemChange} onItemRemove={onItemRemove} />
      <Group title={t('inv.body')} slots={BODY_SLOTS} inventory={inventory} items={items}
        onItemChange={onItemChange} onItemRemove={onItemRemove} />
      <Group title={t('inv.pack')} slots={PACK_SLOTS} inventory={inventory} items={items}
        onItemChange={onItemChange} onItemRemove={onItemRemove} />
    </div>
  );
}
