// Reine Funktionen fuer SL-Eingriffe auf einen Charakter (Schaden, Heilen,
// Pips, EP, Gegenstand geben, Zustand geben). Rast liegt bereits in rest.js.
//
// Zwei Abnehmer nutzen dieselbe Logik: der Spieler-Client wendet eingehende
// GM_*-Befehle darauf an (App.jsx), und das SL-Dashboard wendet sie direkt auf
// einen lokalen (offline) Spielerbogen an (GmDashboard/GmLocalPlayers) — ohne
// Umweg ueber die Leitung. So bleibt "was ein Schaden bewirkt" an einer Stelle.

import { addItem, addItemAt, firstFreeFit } from './inventory.js';
import { levelForXp, gritForLevel } from './character.js';
import { makeCondition } from '../data/items.js';
import { rollSave } from './dice.js';

// Schaden auf TP; reicht das nicht, geht der Rest auf STR (SRD-Ueberschussregel).
// Bei STR-Schaden verlangt die SRD sofort einen STR-Rettungswurf (auf den
// bereits reduzierten Wert): misslingt er, gibt's kritischen Schaden — Zustand
// "Verletzt" + kampfunfaehig (character.incapacitated), bis eine Rast erfolgt
// (rules/rest.js). Sinkt STR auf 0, ist die Maus tot (`dead: true` im
// Rueckgabewert — der Aufrufer entscheidet, wie er das anzeigt, hier wird
// nichts geloescht oder gesperrt).
export function applyDamage(character, amount) {
  let hpCur = character.hp.current - amount;
  let strCur = character.str.current;
  let strHit = 0;
  if (hpCur < 0) {
    strHit = -hpCur;
    strCur = Math.max(0, strCur - strHit);
    hpCur = 0;
  }

  let next = {
    ...character,
    hp: { ...character.hp, current: hpCur },
    str: { ...character.str, current: strCur },
  };

  let saveRoll = null;
  let injuredOk = null;
  if (strHit > 0) {
    saveRoll = rollSave(strCur);
    if (!saveRoll.ok) {
      const { character: withCond, ok } = applyCondition({ ...next, incapacitated: true }, 'injured');
      next = withCond;
      injuredOk = ok;
    }
  }

  return { character: next, strHit, saveRoll, injuredOk, dead: strCur <= 0 };
}

export function applyHeal(character, amount) {
  return {
    ...character,
    hp: { ...character.hp, current: Math.min(character.hp.max, character.hp.current + amount) },
  };
}

export function applyPips(character, amount) {
  return { ...character, pips: Math.max(0, character.pips + amount) };
}

// Gibt zusaetzlich before/after-Stufe zurueck, damit der Aufrufer bei einem
// Stufenaufstieg eine eigene Meldung anhaengen kann.
export function applyXp(character, amount) {
  const before = levelForXp(character.xp || 0);
  const xp = Math.max(0, (character.xp || 0) + amount);
  const level = levelForXp(xp);
  return { character: { ...character, xp, level, grit: gritForLevel(level) }, before, after: level };
}

// Legt einen Gegenstand ins Inventar (auf Wunschplatz, falls angegeben und frei).
// ok:false = kein Platz mehr — der Aufrufer entscheidet, was dann passiert
// (z. B. beim Fern-Spieler: zurueck in die Tischmitte legen).
export function applyGive(character, item, wantSlot) {
  if (!firstFreeFit(character.inventory, item.size === 2 ? 2 : 1)) return { character, ok: false };
  const next = (wantSlot ? addItemAt(character, item, wantSlot) : addItem(character, item)).character || character;
  return { character: next, ok: true };
}

// `cond` optional: derselbe (bereits erzeugte) Zustand kann so zweimal
// geprueft/angewandt werden (Platz-Check gegen alten State, Anwendung gegen
// frischen State), ohne dass dabei zwei verschiedene Zustands-Instanzen mit
// unterschiedlicher itemId entstehen.
export function applyCondition(character, key, cond = makeCondition(key)) {
  if (!firstFreeFit(character.inventory, 1)) return { character, ok: false, cond };
  return { character: addItem(character, cond).character || character, ok: true, cond };
}
