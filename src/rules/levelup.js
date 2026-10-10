import { rollDie } from './dice.js';

// Stufenaufstieg nach SRD ("Advancement -> Level"). Ein Aufstieg betrifft
// immer GENAU EINE Stufe; hat die Maus mehrere auf einmal gewonnen, wird er
// wiederholt. `levelDone` ist die Stufe, fuer die der Aufstieg schon
// abgewickelt wurde — liegt `level` darueber, ist ein Aufstieg offen.

// Trefferwuerfel je Stufe (SRD-Tabelle): 1W6, 2W6, 3W6, ab Stufe 4 immer 4W6.
export const hitDiceForLevel = (level) => Math.min(4, Math.max(1, level));

export const levelDoneOf = (c) => (Number.isFinite(c.levelDone) ? c.levelDone : (c.level || 1));

export const pendingLevels = (c) => Math.max(0, (c.level || 1) - levelDoneOf(c));

// Wuerfelt den naechsten Aufstieg. Reine Funktion (der Wurf geschieht hier, nicht
// im State-Updater): liefert `patch` fuer den Bogen und einen `report` fuers Anzeigen.
//  - Attribute: je STR/DEX/WIL 1W20; liegt das Ergebnis UEBER dem Wert, +1.
//    (SRD: "higher than the attribute's current value" — wir vergleichen mit dem
//    Maximum, dem eigentlichen Wert; ein verletzter Wert soll nicht schneller
//    steigen. Der Aufstieg hebt Maximum und aktuellen Wert um 1.)
//  - TP: Trefferwuerfel der neuen Stufe; liegt die Summe ueber den TP, ersetzt sie
//    die TP, sonst +1.
export function rollLevelUp(character, rng = rollDie) {
  const level = levelDoneOf(character) + 1;
  const attrs = ['str', 'dex', 'wil'].map((key) => {
    const a = character[key];
    const roll = rng(20);
    const up = roll > a.max;
    return { key, roll, before: a.max, after: up ? a.max + 1 : a.max, up };
  });
  const count = hitDiceForLevel(level);
  const dice = Array.from({ length: count }, () => rng(6));
  const total = dice.reduce((s, v) => s + v, 0);
  const replaced = total > character.hp.max;
  const newMax = replaced ? total : character.hp.max + 1;
  const hp = { max: newMax, current: Math.min(newMax, character.hp.current + (newMax - character.hp.max)) };

  const patch = { levelDone: level, hp };
  attrs.forEach((a) => {
    const old = character[a.key];
    patch[a.key] = a.up ? { max: old.max + 1, current: Math.min(old.max + 1, old.current + 1) } : old;
  });
  return {
    patch,
    report: {
      level, attrs, hd: { count, dice, total, before: character.hp.max, after: newMax, replaced },
    },
  };
}
