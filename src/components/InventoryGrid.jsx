import { useDroppable } from '@dnd-kit/core';
import { useLang, loc } from '../i18n/index.jsx';
import { PAW_SLOTS, BODY_SLOTS, PACK_SLOTS } from '../rules/character.js';
import { cellsFor, anchorSlotOfItem } from '../rules/inventory.js';
import ItemCard from './ItemCard.jsx';

function Slot({ slot, item, onChange, onRemove, onStash, onRollDamage, wide }) {
  const { t } = useLang();
  const { setNodeRef, isOver } = useDroppable({ id: slot });
  return (
    <div
      ref={setNodeRef}
      className={`inv-slot${isOver ? ' slot-over' : ''}${wide ? ' slot-wide' : ''}${item ? ' slot-filled' : ''}`}
    >
      {item ? (
        <ItemCard item={item} onChange={onChange} onRemove={onRemove} onStash={onStash} onRollDamage={onRollDamage} />
      ) : (
        <span className="slot-empty">{t('inv.empty')}</span>
      )}
    </div>
  );
}

// Zweites Feld eines Paar-Gegenstands, dessen Anker in einer ANDEREN Gruppe
// sitzt (z. B. Leichte Ruestung: Anker auf einer Pfote, dieses Feld auf einem
// Koerperplatz — siehe `pairKind: 'pawBody'` in items.js/character.js). Kein
// eigener Drop-Ziel: wie beim gleichartigen Paar gehoert das Feld dem Anker.
function LinkedSlot({ item, lang }) {
  const { t } = useLang();
  return (
    <div className="inv-slot slot-linked" title={t('inv.linkedBy', { name: loc(item?.name, lang) })}>
      <span className="slot-linked-mark" aria-hidden="true">↑</span>
    </div>
  );
}

function Group({ title, slots, inventory, items, onItemChange, onItemRemove, onItemStash, onRollDamage, lang }) {
  const cells = [];
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    const val = inventory[slot];

    if (val?.cont) {
      const anchorSlot = anchorSlotOfItem(inventory, val.itemId);
      if (slots.includes(anchorSlot)) continue; // selbe Gruppe: von der breiten Anker-Karte mitbelegt
      cells.push(<LinkedSlot key={slot} item={items[val.itemId]} lang={lang} />);
      continue;
    }

    const item = val ? items[val.itemId] : null;
    // "wide" (zwei Spalten dieser Gruppe) nur, wenn das gepaarte Feld auch
    // WIRKLICH in dieser Gruppe liegt — bei einem gruppenuebergreifenden Paar
    // (Pfote+Koerper) bleibt die Karte einspaltig, das andere Feld ist eine
    // LinkedSlot in der jeweils anderen Gruppe.
    const pairCells = item?.size === 2 ? cellsFor(slot, 2, item.pairKind) : null;
    const wide = !!pairCells && pairCells.length === 2 && slots.includes(pairCells[1]);
    cells.push(
      <Slot
        key={slot}
        slot={slot}
        item={item}
        wide={wide}
        onChange={(next) => onItemChange(next)}
        onRemove={() => onItemRemove(val.itemId)}
        onStash={onItemStash && item ? onItemStash : undefined}
        onRollDamage={onRollDamage}
      />,
    );
    if (wide) i += 1; // das gepaarte Feld in DERSELBEN Gruppe ueberspringen
  }

  return (
    <div className="inv-group">
      <div className="inv-group-title">{title}</div>
      <div className="inv-cells">{cells}</div>
    </div>
  );
}

export default function InventoryGrid({ character, onItemChange, onItemRemove, onItemStash, onRollDamage }) {
  const { t, lang } = useLang();
  const { inventory, items } = character;
  const shared = {
    inventory, items, onItemChange, onItemRemove, onItemStash, onRollDamage, lang,
  };
  const isEmpty = Object.keys(items || {}).length === 0;
  return (
    <div className="inventory">
      {isEmpty ? <p className="hint inv-empty-hint">{t('inv.emptyHint')}</p> : null}
      <Group title={t('inv.paws')} slots={PAW_SLOTS} {...shared} />
      <Group title={t('inv.body')} slots={BODY_SLOTS} {...shared} />
      <Group title={t('inv.pack')} slots={PACK_SLOTS} {...shared} />
    </div>
  );
}
