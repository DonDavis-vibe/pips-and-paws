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
import { armourValue, effectiveSaveMode, zeroStates } from './status.js';

// Schaden nach Regel S. 10: erst auf TP, der Rest auf das Zielattribut (meist
// STR; manche Kreaturen treffen DEX oder WIL, z. B. Spinne oder Geist). Danach
// sofort eine Probe auf dieses Attribut (auf den schon gesenkten Wert, Nachteil
// durch Zustaende eingerechnet). Misslingt sie, gibt's kritischen Schaden:
// bei STR Zustand "Verletzt" + kampfunfaehig; bei DEX/WIL hat die Kreatur eine
// eigene Kritisch-Wirkung (steht im Werteblock, der SL setzt sie um) —
// `crit` meldet das nur. Attribut auf 0: STR tot, DEX bewegungsunfaehig, WIL
// ohne Besinnung (`zero`). Mit `armour: true` zieht die angelegte Ruestung ab.
// Geloescht oder gesperrt wird hier nichts, der Aufrufer zeigt es nur an.
export function applyDamage(character, amount, { attr = 'str', armour = false } = {}) {
  const key = ['str', 'dex', 'wil'].includes(attr) ? attr : 'str';
  const absorbed = armour ? Math.min(Math.max(0, amount), armourValue(character)) : 0;
  const dealt = Math.max(0, amount - absorbed);
  let hpCur = character.hp.current - dealt;
  let attrCur = character[key].current;
  let attrHit = 0;
  if (hpCur < 0) {
    attrHit = -hpCur;
    attrCur = Math.max(0, attrCur - attrHit);
    hpCur = 0;
  }

  let next = {
    ...character,
    hp: { ...character.hp, current: hpCur },
    [key]: { ...character[key], current: attrCur },
  };

  let saveRoll = null;
  let crit = false;
  let injuredOverflow = false;
  // Bei 0 entscheidet nichts mehr eine Probe (STR 0 = tot, siehe zeroStates).
  if (attrHit > 0 && attrCur > 0) {
    saveRoll = rollSave(attrCur, effectiveSaveMode(next, key));
    if (!saveRoll.ok) {
      crit = true;
      if (key === 'str') {
        const res = applyCondition({ ...next, incapacitated: true }, 'injured');
        next = res.character;
        injuredOverflow = res.overflow;
      }
    }
  }

  const zero = zeroStates(next);
  return {
    character: next,
    attr: key,
    dealt,
    absorbed,
    attrHit,
    // Altname, damit bestehende Aufrufer weiter "STR-Anteil" lesen koennen.
    strHit: key === 'str' ? attrHit : 0,
    saveRoll,
    crit,
    injuredOverflow,
    zero,
    dead: zero.dead,
  };
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
// Regel S. 8: Zustaende muessen immer genommen werden. Ist kein Platz frei,
// liegt der Zustand ohne Platz beim Bogen (`overflow`) und die Maus ist
// belastet (rules/status.js#encumbrance), bis Platz geschaffen wird.
export function applyCondition(character, key, cond = makeCondition(key)) {
  if (firstFreeFit(character.inventory, 1)) {
    return { character: addItem(character, cond).character || character, ok: true, overflow: false, cond };
  }
  return {
    character: { ...character, items: { ...character.items, [cond.itemId]: cond } },
    ok: true,
    overflow: true,
    cond,
  };
}
