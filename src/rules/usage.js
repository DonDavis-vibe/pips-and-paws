// Nutzung nach dem Kampf (Mausritter 2.3, S. 8/9): fuer jede Waffe, Ruestung
// und Munition, die im Kampf benutzt wurde, W6 wuerfeln — bei 4-6 eine Nutzung
// markieren. Improvisierte und versilberte Waffen markieren immer, magische
// Schwerter nur bei einer 6 (S. 39). Alle Punkte markiert =
// verbraucht/zerstoert (Reparatur: 10 % des Preises je Punkt).

import { rollDie } from './dice.js';
import { PAW_SLOTS, BODY_SLOTS } from './character.js';

const ALWAYS_MARK = new Set(['w_improvised']);

// Vorschlag, was im Kampf benutzt wurde: Waffen in den Pfoten, angelegte
// Ruestung, Munition an Pfote/Koerper. Die Spielerin kann abwaehlen.
export function afterFightCandidates(c) {
  const ids = new Set();
  for (const s of [...PAW_SLOTS, ...BODY_SLOTS]) {
    const v = c.inventory?.[s];
    if (!v || v.cont) continue;
    const it = c.items?.[v.itemId];
    if (!it?.usage || it.usage.current >= it.usage.max) continue;
    if (it.type === 'armour' || it.type === 'ammo' || (it.type === 'weapon' && PAW_SLOTS.includes(s))) ids.add(it.itemId);
  }
  return [...ids];
}

export function rollAfterFight(c, ids, rng = rollDie) {
  const items = { ...c.items };
  const results = ids.map((id) => {
    const it = items[id];
    if (!it?.usage) return null;
    const always = ALWAYS_MARK.has(it.key) || !!it.silvered;
    const roll = always ? null : rng(6);
    const marked = always || (it.magic ? roll === 6 : roll >= 4);
    const current = marked ? Math.min(it.usage.max, it.usage.current + 1) : it.usage.current;
    items[id] = { ...it, usage: { ...it.usage, current } };
    return { itemId: id, roll, marked, always, depleted: current >= it.usage.max };
  }).filter(Boolean);
  return { character: { ...c, items }, results };
}
