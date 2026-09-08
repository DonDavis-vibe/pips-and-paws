// Rast nach Mausritter-SRD:
//   Kurz  (1 Zug)   : W6+1 TP zurueck
//   Lang  (1 Wache) : Ration essen, alle TP zurueck; sind sie voll, W6 auf einen Wert
//   Voll  (1 Woche) : alle TP und alle Werte voll
//
// Reine Funktionen, damit Spielerseite (RestControls) und SL-Befehl (GM_REST)
// exakt dieselbe Rechnung benutzen.

import { rollDie } from './dice.js';

export const REST_KINDS = ['short', 'long', 'full'];

function findRationId(items) {
  return Object.keys(items || {}).find((k) => {
    const it = items[k];
    return it.type === 'ration' && it.usage && it.usage.current < it.usage.max;
  });
}

function consumeRation(items) {
  const rid = findRationId(items);
  if (!rid) return items;
  const it = items[rid];
  return { ...items, [rid]: { ...it, usage: { ...it.usage, current: it.usage.current + 1 } } };
}

// -> { character, msg: { key, vars } }  (msg wird vom Aufrufer durch t() geschickt)
export function applyRest(character, kind) {
  const c = character;

  if (kind === 'short') {
    const heal = rollDie(6) + 1;
    return {
      character: { ...c, hp: { ...c.hp, current: Math.min(c.hp.max, c.hp.current + heal) } },
      msg: { key: 'rest.log.short', vars: { n: heal } },
    };
  }

  if (kind === 'full') {
    return {
      character: {
        ...c,
        hp: { ...c.hp, current: c.hp.max },
        str: { ...c.str, current: c.str.max },
        dex: { ...c.dex, current: c.dex.max },
        wil: { ...c.wil, current: c.wil.max },
      },
      msg: { key: 'rest.log.full', vars: {} },
    };
  }

  // Lange Rast
  const hasRation = !!findRationId(c.items || {});
  const needHp = c.hp.current < c.hp.max;
  const gap = needHp
    ? null
    : ['str', 'dex', 'wil'].map((k) => ({ k, d: c[k].max - c[k].current })).sort((a, b) => b.d - a.d)[0];
  const attrAmt = gap && gap.d > 0 ? Math.min(rollDie(6), gap.d) : 0;

  const next = { ...c, items: consumeRation(c.items || {}) };
  if (needHp) next.hp = { ...c.hp, current: c.hp.max };
  else if (attrAmt > 0) next[gap.k] = { ...c[gap.k], current: Math.min(c[gap.k].max, c[gap.k].current + attrAmt) };

  let msg;
  if (needHp) msg = { key: 'rest.log.long', vars: {} };
  else if (attrAmt > 0) msg = { key: 'rest.log.longAttr', vars: { n: attrAmt, attrKey: gap.k } };
  else msg = { key: 'rest.log.longFull', vars: {} };

  return { character: next, msg, noRation: !hasRation };
}
