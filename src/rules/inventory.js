// Reine Funktionen fuer das Slot-Raster. Slot-Werte:
//   null                     leer
//   { itemId }               Anker eines Gegenstands
//   { itemId, cont: true }   Fortsetzungsfeld eines 2-Platz-Gegenstands

import { ALL_SLOTS, PAW_SLOTS, BODY_SLOTS, PACK_SLOTS, SLOT_PAIR_FIRST, SLOT_PAIR_SECOND } from './character.js';

// Wohin ein neuer Gegenstand bevorzugt wandert: Waffen an die Pfoten, Ruestung
// an den Koerper, alles andere in den Rucksack. Spieler koennen danach frei
// umsortieren (Mausritter schreibt keine Platztypen vor).
function preferredOrder(type) {
  if (type === 'weapon') return [...PAW_SLOTS, ...PACK_SLOTS, ...BODY_SLOTS];
  if (type === 'armour') return [...BODY_SLOTS, ...PACK_SLOTS, ...PAW_SLOTS];
  return [...PACK_SLOTS, ...BODY_SLOTS, ...PAW_SLOTS];
}

export function anchorFor(slot, size) {
  return size === 2 ? SLOT_PAIR_FIRST[slot] : slot;
}

export function cellsFor(slot, size) {
  if (size !== 2) return [slot];
  const first = SLOT_PAIR_FIRST[slot];
  const second = SLOT_PAIR_SECOND[first];
  return second ? [first, second] : [first];
}

export function slotsOfItem(inventory, itemId) {
  return ALL_SLOTS.filter((s) => inventory[s]?.itemId === itemId);
}

export function anchorSlotOfItem(inventory, itemId) {
  return ALL_SLOTS.find((s) => inventory[s]?.itemId === itemId && !inventory[s]?.cont) || null;
}

function withItemRemoved(inventory, itemId) {
  const next = { ...inventory };
  for (const s of ALL_SLOTS) {
    if (next[s]?.itemId === itemId) next[s] = null;
  }
  return next;
}

function withItemPlaced(inventory, itemId, slot, size) {
  const next = { ...inventory };
  const cells = cellsFor(slot, size);
  next[cells[0]] = { itemId };
  if (cells[1]) next[cells[1]] = { itemId, cont: true };
  return next;
}

// Erster freier Ankerplatz, an den ein Gegenstand dieser Groesse passt.
export function firstFreeFit(inventory, size, order = ALL_SLOTS) {
  for (const slot of order) {
    const cells = cellsFor(slot, size);
    if (cells.length < size) continue;
    if (size === 2 && SLOT_PAIR_FIRST[slot] !== slot) continue; // nur am Paar-Anker beginnen
    if (cells.every((c) => inventory[c] == null)) return cells[0];
  }
  return null;
}

// Verschiebt einen bereits im Raster liegenden Gegenstand auf targetSlot.
// Gibt { ok, inventory } oder { ok:false, reason } zurueck.
export function tryMove(inventory, items, itemId, targetSlot) {
  const item = items[itemId];
  if (!item) return { ok: false, reason: 'slotOccupied' };
  const size = item.size === 2 ? 2 : 1;

  const targetCells = cellsFor(targetSlot, size);
  if (targetCells.length < size) return { ok: false, reason: 'needsTwoSlots' };

  const fromAnchor = anchorSlotOfItem(inventory, itemId);

  // Fremde Belegung der Zielfelder einsammeln
  const blockers = new Set();
  for (const c of targetCells) {
    const occ = inventory[c];
    if (occ && occ.itemId !== itemId) blockers.add(occ.itemId);
  }

  if (blockers.size === 0) {
    return { ok: true, inventory: withItemPlaced(withItemRemoved(inventory, itemId), itemId, targetSlot, size) };
  }

  // Tausch nur, wenn genau ein 1-Platz-Gegenstand im Weg ist und wir selbst 1 Platz sind
  if (size === 1 && blockers.size === 1) {
    const otherId = [...blockers][0];
    const other = items[otherId];
    if (other && other.size !== 2 && fromAnchor) {
      let next = withItemRemoved(inventory, itemId);
      next = withItemRemoved(next, otherId);
      next = withItemPlaced(next, itemId, targetSlot, 1);
      next = withItemPlaced(next, otherId, fromAnchor, 1);
      return { ok: true, inventory: next };
    }
  }

  return { ok: false, reason: size === 2 ? 'needsTwoSlots' : 'slotOccupied' };
}

// Legt einen neuen Gegenstand ins Inventar (an den ersten passenden Platz).
export function addItem(character, item) {
  const size = item.size === 2 ? 2 : 1;
  const order = preferredOrder(item.type);
  const slot = firstFreeFit(character.inventory, size, order) || firstFreeFit(character.inventory, size);
  if (!slot) return { ok: false, reason: 'noRoom' };
  return {
    ok: true,
    character: {
      ...character,
      items: { ...character.items, [item.itemId]: item },
      inventory: withItemPlaced(character.inventory, item.itemId, slot, size),
    },
  };
}

export function removeItem(character, itemId) {
  const items = { ...character.items };
  delete items[itemId];
  return { ...character, items, inventory: withItemRemoved(character.inventory, itemId) };
}
