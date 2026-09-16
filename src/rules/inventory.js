// Reine Funktionen fuer das Slot-Raster. Slot-Werte:
//   null                     leer
//   { itemId }               Anker eines Gegenstands
//   { itemId, cont: true }   Fortsetzungsfeld eines 2-Platz-Gegenstands

import {
  ALL_SLOTS, PAW_SLOTS, BODY_SLOTS, PACK_SLOTS,
  SLOT_PAIR_FIRST, SLOT_PAIR_SECOND, CROSS_PAIR_FIRST, CROSS_PAIR_SECOND,
  gritForLevel,
} from './character.js';

// Wohin ein neuer Gegenstand bevorzugt wandert: Waffen an die Pfoten, ein
// Pfote+Koerper-Paar (`pairKind: 'pawBody'`, siehe Leichte Ruestung) an die
// Pfoten (dort beginnt sein Anker), sonstige Ruestung an den Koerper, alles
// andere in den Rucksack. Spieler koennen danach frei umsortieren.
function preferredOrder(item) {
  if (item.pairKind === 'pawBody') return [...PAW_SLOTS, ...BODY_SLOTS, ...PACK_SLOTS];
  if (item.type === 'weapon') return [...PAW_SLOTS, ...PACK_SLOTS, ...BODY_SLOTS];
  if (item.type === 'armour') return [...BODY_SLOTS, ...PACK_SLOTS, ...PAW_SLOTS];
  return [...PACK_SLOTS, ...BODY_SLOTS, ...PAW_SLOTS];
}

// `pairKind: 'pawBody'` (Leichte Ruestung, siehe items.js + character.js) nimmt
// auf Pfoten-/Koerperfeldern das echte Pfote+Koerper-Paar (CROSS_PAIR_*), sonst
// (und im Rucksack, wo es keine Pfote/Koerper-Unterscheidung gibt) das
// gleichartige Paar (SLOT_PAIR_*).
function pairMaps(slot, pairKind) {
  if (pairKind === 'pawBody' && CROSS_PAIR_FIRST[slot] != null) {
    return { first: CROSS_PAIR_FIRST, second: CROSS_PAIR_SECOND };
  }
  return { first: SLOT_PAIR_FIRST, second: SLOT_PAIR_SECOND };
}

export function anchorFor(slot, size, pairKind) {
  if (size !== 2) return slot;
  return pairMaps(slot, pairKind).first[slot];
}

export function cellsFor(slot, size, pairKind) {
  if (size !== 2) return [slot];
  const { first, second } = pairMaps(slot, pairKind);
  const anchor = first[slot];
  const partner = second[anchor];
  return partner ? [anchor, partner] : [anchor];
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

function withItemPlaced(inventory, itemId, slot, size, pairKind) {
  const next = { ...inventory };
  const cells = cellsFor(slot, size, pairKind);
  next[cells[0]] = { itemId };
  if (cells[1]) next[cells[1]] = { itemId, cont: true };
  return next;
}

// Erster freier Ankerplatz, an den ein Gegenstand dieser Groesse passt.
export function firstFreeFit(inventory, size, order = ALL_SLOTS, pairKind) {
  for (const slot of order) {
    const cells = cellsFor(slot, size, pairKind);
    if (cells.length < size) continue;
    if (size === 2 && anchorFor(slot, size, pairKind) !== slot) continue; // nur am Paar-Anker beginnen
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

  const targetCells = cellsFor(targetSlot, size, item.pairKind);
  if (targetCells.length < size) return { ok: false, reason: 'needsTwoSlots' };

  const fromAnchor = anchorSlotOfItem(inventory, itemId);

  // Fremde Belegung der Zielfelder einsammeln
  const blockers = new Set();
  for (const c of targetCells) {
    const occ = inventory[c];
    if (occ && occ.itemId !== itemId) blockers.add(occ.itemId);
  }

  if (blockers.size === 0) {
    return { ok: true, inventory: withItemPlaced(withItemRemoved(inventory, itemId), itemId, targetSlot, size, item.pairKind) };
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
  const order = preferredOrder(item);
  const slot = firstFreeFit(character.inventory, size, order, item.pairKind)
    || firstFreeFit(character.inventory, size, ALL_SLOTS, item.pairKind);
  if (!slot) return { ok: false, reason: 'noRoom' };
  return {
    ok: true,
    character: {
      ...character,
      items: { ...character.items, [item.itemId]: item },
      inventory: withItemPlaced(character.inventory, item.itemId, slot, size, item.pairKind),
    },
  };
}

// Legt einen neuen Gegenstand auf einen BESTIMMTEN Platz (Ziehen aus der
// Tischmitte). Faellt auf den ersten freien Platz zurueck, wenn das Ziel belegt
// ist — der Gegenstand darf auf keinen Fall verloren gehen.
export function addItemAt(character, item, slot) {
  const size = item.size === 2 ? 2 : 1;
  const cells = cellsFor(slot, size, item.pairKind);
  const fits = cells.length === size && cells.every((c) => character.inventory[c] == null);
  if (!fits) return addItem(character, item);
  return {
    ok: true,
    character: {
      ...character,
      items: { ...character.items, [item.itemId]: item },
      inventory: withItemPlaced(character.inventory, item.itemId, slot, size, item.pairKind),
    },
  };
}

export function removeItem(character, itemId) {
  const items = { ...character.items };
  delete items[itemId];
  return {
    ...character,
    items,
    inventory: withItemRemoved(character.inventory, itemId),
    gritConditions: (character.gritConditions || []).filter((id) => id !== itemId),
  };
}

// Mumm/Grit (SRD §"Grit"): ein Zustand im Mumm-Feld wird ignoriert, solange er
// dort liegt — belegt dafuer einen von `gritForLevel(level)` vielen Plaetzen,
// getrennt vom normalen Inventar (SRD: "place one Condition into the Grit
// space", nicht in einen Inventarplatz). Nur Zustaende, nur wenn noch Platz
// frei ist; einmal drin, laut SRD nicht entfernbar, bis er geloescht wird
// (siehe removeItem oben + `locked` in ItemCard.jsx).
export function placeInGrit(character, itemId) {
  const item = character.items[itemId];
  if (!item || item.type !== 'condition') return { ok: false, reason: 'gritOnlyConditions' };
  const capacity = gritForLevel(character.level || 1);
  const parked = character.gritConditions || [];
  if (parked.includes(itemId)) return { ok: true, character };
  if (parked.length >= capacity) return { ok: false, reason: 'gritFull' };
  return {
    ok: true,
    character: {
      ...character,
      inventory: withItemRemoved(character.inventory, itemId),
      gritConditions: [...parked, itemId],
      // "Verletzt" im Mumm-Feld ignoriert -> nicht mehr kampfunfaehig, solange
      // es dort liegt (rules/gmActions.js setzt incapacitated beim Zufuegen).
      incapacitated: item.key === 'injured' ? false : character.incapacitated,
    },
  };
}
