// Abgeleitete Zustaende eines Bogens (Mausritter 2.3, Kap. 2 "Inventory" und
// Kap. 3 "How to play"). Reine Funktionen ohne State — Spielerbogen,
// SL-Karte und Regel-Funktionen (Schaden, Proben) lesen alle hier ab.

import { ALL_SLOTS, PAW_SLOTS, BODY_SLOTS } from './character.js';

// Zustaende, die gerade wirken: im Inventar ODER ohne Platz (Ueberlast), nicht
// als geloescht markiert und nicht im Mumm-Feld (dort werden sie ignoriert).
export function activeConditions(c) {
  const grit = new Set(c.gritConditions || []);
  return Object.values(c.items || {}).filter((i) => i.type === 'condition' && !i.cleared && !grit.has(i.itemId));
}

const hasCondition = (c, key) => activeConditions(c).some((i) => i.key === key);

// Gegenstaende/Zustaende, die keinen Platz im Raster haben (Regel: Zustaende
// muessen immer genommen werden — passt keiner mehr, ist die Maus belastet).
export function overflowIds(c) {
  const placed = new Set(ALL_SLOTS.map((s) => c.inventory?.[s]?.itemId).filter(Boolean));
  const grit = new Set(c.gritConditions || []);
  return Object.keys(c.items || {}).filter((id) => !placed.has(id) && !grit.has(id));
}

// Pips (Regel S. 9): die ersten 250 stecken in den Taschen, jede weiteren 250
// brauchen einen Platz — dafuer gibt es den Pip-Beutel (fasst 250).
export const PIPS_IN_POCKETS = 250;
export const PIPS_PER_PURSE = 250;

export function pipPursesNeeded(pips) {
  const p = Math.max(0, Number(pips) || 0);
  return Math.max(0, Math.ceil((p - PIPS_IN_POCKETS) / PIPS_PER_PURSE));
}

export function pipPursesCarried(c) {
  const placed = new Set(ALL_SLOTS.map((s) => c.inventory?.[s]?.itemId).filter(Boolean));
  return Object.values(c.items || {}).filter((i) => i.key === 'pip_purse' && placed.has(i.itemId)).length;
}

// Belastet (Regel S. 8): mehr Gegenstaende/Zustaende als Plaetze. Dazu zaehlen
// hier auch Pips ohne Beutel und ein von Hand vergebener Zustand "Belastet".
export function encumbrance(c) {
  const overflow = overflowIds(c);
  const pipShort = Math.max(0, pipPursesNeeded(c.pips) - pipPursesCarried(c));
  const manual = hasCondition(c, 'encumbered');
  return { encumbered: overflow.length > 0 || pipShort > 0 || manual, overflow, pipShort, manual };
}

// Nachteil, den Zustaende einer Probe aufzwingen:
//   Verletzt -> STR/DEX, Entkraeftet -> WIL, Belastet -> alle Proben.
export function forcedDisadvantage(c, attr) {
  const reasons = [];
  if ((attr === 'str' || attr === 'dex') && hasCondition(c, 'injured')) reasons.push('injured');
  if (attr === 'wil' && hasCondition(c, 'drained')) reasons.push('drained');
  if (encumbrance(c).encumbered) reasons.push('encumbered');
  return reasons;
}

// Gewaehlter Modus + erzwungener Nachteil. Vorteil und Nachteil heben sich auf
// (die Regeln sagen dazu nichts; so bleibt ein guter Plan trotz Verletzung etwas wert).
export function effectiveSaveMode(c, attr, chosen = 'normal') {
  if (!forcedDisadvantage(c, attr).length) return chosen;
  return chosen === 'adv' ? 'normal' : 'disadv';
}

// Ruestung schuetzt nur, wenn sie angelegt ist (Pfote/Koerper) und nicht
// verbraucht (alle Nutzungspunkte markiert = zerstoert, Regel S. 8).
export function armourValue(c) {
  const worn = new Set([...PAW_SLOTS, ...BODY_SLOTS].map((s) => c.inventory?.[s]?.itemId).filter(Boolean));
  return Object.values(c.items || {})
    .filter((i) => i.type === 'armour' && worn.has(i.itemId))
    .filter((i) => !i.usage || i.usage.current < i.usage.max)
    .reduce((sum, i) => sum + (i.defense || 0), 0);
}

// Attribut auf 0 (Regel S. 10): STR -> tot, DEX -> kann sich nicht bewegen,
// WIL -> ohne Besinnung.
export function zeroStates(c) {
  return {
    dead: (c.str?.current ?? 1) <= 0,
    immobile: (c.dex?.current ?? 1) <= 0,
    insensible: (c.wil?.current ?? 1) <= 0,
  };
}
