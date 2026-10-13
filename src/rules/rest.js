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

// Zustaende, die eine Rast laut Regel abraeumt (Freigabe-Bedingung der Karte):
//   kurz  -> Aengstlich
//   lang  -> Aengstlich, Erschoepft; Hungrig, wenn dabei eine Ration gegessen wird
//   voll  -> zusaetzlich Verletzt und Entkraeftet ("removes most long-term
//            Conditions"; eine Woche mit Kost und Logis stillt auch den Hunger)
// Eigene Zustaende (Freitext) und "Belastet" bleiben — die haengen nicht an Rast.
const CLEARED_BY = {
  short: ['frightened'],
  long: ['frightened', 'exhausted'],
  full: ['frightened', 'exhausted', 'hungry', 'injured', 'drained'],
};

function clearConditions(c, keys) {
  const drop = Object.values(c.items || {}).filter((i) => i.type === 'condition' && keys.includes(i.key));
  if (!drop.length) return { character: c, cleared: [] };
  const ids = new Set(drop.map((i) => i.itemId));
  const items = Object.fromEntries(Object.entries(c.items).filter(([id]) => !ids.has(id)));
  const inventory = Object.fromEntries(
    Object.entries(c.inventory).map(([slot, v]) => [slot, v && ids.has(v.itemId) ? null : v]),
  );
  const gritConditions = (c.gritConditions || []).filter((id) => !ids.has(id));
  return { character: { ...c, items, inventory, gritConditions }, cleared: drop };
}

// -> { character, msg: { key, vars }, cleared }  (msg wird vom Aufrufer durch t() geschickt)
// `cleared`: die abgeraeumten Zustands-Karten (fuer die Meldung).
// `attr` (nur lange Rast bei vollen TP): welcher Wert die W6 bekommt — laut
// Regel waehlt die Spielerin; ohne Angabe der am staerksten geschaedigte.
// Jede Rast (auch kurz) hebt "kampfunfaehig" wieder auf (Regel: versorgt von
// Verbuendeten + kurze Rast) — das Versorgen selbst bildet die App nicht ab.
// Siehe rules/gmActions.js#applyDamage.
export function applyRest(character, kind, { attr } = {}) {
  const res = applyRestRaw(character, kind, attr);
  const keys = [...(CLEARED_BY[kind] || [])];
  if (kind === 'long' && !res.noRation) keys.push('hungry');
  const { character: next, cleared } = clearConditions(res.character, keys);
  return { ...res, character: next, cleared };
}

function applyRestRaw(c, kind, chosenAttr) {
  if (kind === 'short') {
    const heal = rollDie(6) + 1;
    return {
      character: { ...c, hp: { ...c.hp, current: Math.min(c.hp.max, c.hp.current + heal) }, incapacitated: false },
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
        incapacitated: false,
      },
      msg: { key: 'rest.log.full', vars: {} },
    };
  }

  // Lange Rast
  const hasRation = !!findRationId(c.items || {});
  const needHp = c.hp.current < c.hp.max;
  const gaps = ['str', 'dex', 'wil'].map((k) => ({ k, d: c[k].max - c[k].current }));
  const gap = needHp
    ? null
    : gaps.find((g) => g.k === chosenAttr && g.d > 0) || [...gaps].sort((a, b) => b.d - a.d)[0];
  const attrAmt = gap && gap.d > 0 ? Math.min(rollDie(6), gap.d) : 0;

  const next = { ...c, items: consumeRation(c.items || {}), incapacitated: false };
  if (needHp) next.hp = { ...c.hp, current: c.hp.max };
  else if (attrAmt > 0) next[gap.k] = { ...c[gap.k], current: Math.min(c[gap.k].max, c[gap.k].current + attrAmt) };

  let msg;
  if (needHp) msg = { key: 'rest.log.long', vars: {} };
  else if (attrAmt > 0) msg = { key: 'rest.log.longAttr', vars: { n: attrAmt, attrKey: gap.k } };
  else msg = { key: 'rest.log.longFull', vars: {} };

  return { character: next, msg, noRation: !hasRation };
}
