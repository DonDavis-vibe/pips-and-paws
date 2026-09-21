import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useLang, loc } from '../i18n/index.jsx';
import {
  PAW_SLOTS, BODY_SLOTS, PACK_SLOTS, GRIT_SLOT_PREFIX, gritForLevel,
} from '../rules/character.js';
import { cellsFor, anchorSlotOfItem } from '../rules/inventory.js';
import ItemCard from './ItemCard.jsx';
import { InfoHint } from './ui.jsx';
import SortableItem from './SortableItem.jsx';

export const GROUP_ORDER_KEY = 'pips-paws-inv-group-order';
export const DEFAULT_GROUP_ORDER = ['paws', 'body', 'pack'];

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

// Leeres Mumm-Feld: Drop-Ziel fuer einen Zustand (siehe CharacterSheet.jsx
// onDragEnd -> placeInGrit). Eigenes Praefix statt eines echten Inventar-
// Slots, weil Kapazitaet variabel ist (0-3 je nach Stufe).
function GritEmptySlot({ index }) {
  const { t } = useLang();
  const { setNodeRef, isOver } = useDroppable({ id: `${GRIT_SLOT_PREFIX}${index}` });
  return (
    <div ref={setNodeRef} className={`inv-slot${isOver ? ' slot-over' : ''}`}>
      <span className="slot-empty">{t('inv.empty')}</span>
    </div>
  );
}

// Zustand, der im Mumm-Feld liegt und dort ignoriert wird (SRD §"Grit"). Kann
// nicht weggezogen werden — erst wenn er geloescht ist (`cleared`, per Klick
// auf der Karte), gibt's den Loeschen-Knopf.
function GritFilledSlot({ item, onItemChange, onItemRemove }) {
  return (
    <div className="inv-slot slot-filled">
      <ItemCard
        item={item}
        onChange={onItemChange}
        onRemove={item.cleared ? () => onItemRemove(item.itemId) : undefined}
        locked
      />
    </div>
  );
}

function GritGroup({ character, onItemChange, onItemRemove }) {
  const { t } = useLang();
  const capacity = gritForLevel(character.level || 1);
  if (capacity === 0) return null;
  const parked = character.gritConditions || [];
  const cells = Array.from({ length: capacity }, (_, i) => {
    const itemId = parked[i];
    const item = itemId ? character.items[itemId] : null;
    return item ? (
      <GritFilledSlot key={itemId} item={item} onItemChange={onItemChange} onItemRemove={onItemRemove} />
    ) : (
      <GritEmptySlot key={`empty-${i}`} index={i} />
    );
  });

  return (
    <div className="inv-group">
      <div className="inv-group-title">
        {t('res.grit')}
        <InfoHint text={t('hint.grit')} />
      </div>
      <div className="inv-cells">{cells}</div>
    </div>
  );
}

// `groupOrder`: vom Elternteil verwaltete Reihenfolge (siehe useOrder in
// CharacterSheet.jsx) — lebt bewusst NICHT hier drin. Das Umsortieren teilt
// sich den ohnehin vorhandenen DndContext ums Inventar (Karten aus der
// Tischmitte, zwischen Feldern); ein zweiter, hier verschachtelter
// DndContext wuerde dessen Drag-Ziele kapern und Tischmitte->Inventar bricht.
export default function InventoryGrid({
  character, onItemChange, onItemRemove, onItemStash, onRollDamage, groupOrder,
}) {
  const { t, lang } = useLang();
  const { inventory, items } = character;
  const shared = {
    inventory, items, onItemChange, onItemRemove, onItemStash, onRollDamage, lang,
  };
  const isEmpty = Object.keys(items || {}).length === 0;

  const GROUPS = {
    paws: { title: t('inv.paws'), slots: PAW_SLOTS },
    body: { title: t('inv.body'), slots: BODY_SLOTS },
    pack: { title: t('inv.pack'), slots: PACK_SLOTS },
  };
  const order = groupOrder || DEFAULT_GROUP_ORDER;

  return (
    <div className="inventory">
      {isEmpty ? <p className="hint inv-empty-hint">{t('inv.emptyHint')}</p> : null}
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        {order.map((key) => (
          <SortableItem key={key} id={key} className="sortable-item-inv-group">
            <Group title={GROUPS[key].title} slots={GROUPS[key].slots} {...shared} />
          </SortableItem>
        ))}
      </SortableContext>
      <GritGroup character={character} onItemChange={onItemChange} onItemRemove={onItemRemove} />
    </div>
  );
}
