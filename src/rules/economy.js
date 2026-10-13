// Pips ausgeben (Mausritter 2.3): Kaufen zum Listenpreis, Reparieren, und EP
// fuer selbstlos fuer die Gemeinschaft ausgegebene Pips.

import { ITEM_CATALOG } from '../data/items.js';

// Listenpreis eines Gegenstands (nur Katalogware hat einen). Versilberte Waffen
// kosten das Zehnfache (Preisliste: "Silvered weapons x10p").
export function itemPrice(item) {
  const base = ITEM_CATALOG[item?.key]?.cost;
  if (!Number.isFinite(base)) return null;
  return item.silvered ? base * 10 : base;
}

// Reparatur (S. 8): Waffen und Ruestung, 10 % des Preises je geloeschtem Punkt.
// Aufgerundet und mindestens 1 Pip, damit auch eine 1p-Waffe etwas kostet.
export function repairCost(item) {
  if (!item?.usage || item.usage.current <= 0) return null;
  if (item.type !== 'weapon' && item.type !== 'armour') return null;
  const price = itemPrice(item);
  if (price == null) return null;
  return Math.max(1, Math.ceil(price / 10));
}

export function repairItem(c, itemId) {
  const it = c.items[itemId];
  const cost = repairCost(it);
  if (cost == null) return { ok: false, reason: 'notRepairable' };
  if ((c.pips || 0) < cost) return { ok: false, reason: 'tooPoor', cost };
  return {
    ok: true,
    cost,
    character: {
      ...c,
      pips: c.pips - cost,
      items: { ...c.items, [itemId]: { ...it, usage: { ...it.usage, current: it.usage.current - 1 } } },
    },
  };
}

// S. 11: je 10 selbstlos fuer die Gemeinschaft ausgegebene Pips 1 EP.
export function xpForDonation(pips) {
  return Math.floor(Math.max(0, pips) / 10);
}

// S. 11: Schatz, der in Sicherheit gebracht wird, gibt 1 EP je Pip-Wert —
// gleichmaessig auf die Gruppe verteilt (abgerundet).
export function lootShare(total, members) {
  if (!members) return 0;
  return Math.floor(Math.max(0, total) / members);
}
