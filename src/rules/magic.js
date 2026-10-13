// Zaubern nach Mausritter 2.3 (Kap. 4 "Magic"):
//  - Kraft waehlen: 1 bis zur Zahl der freien Nutzungspunkte.
//  - So viele W6 wuerfeln. Jeder Wuerfel mit 4, 5 oder 6 markiert eine Nutzung.
//  - Die Wirkung haengt an [WUERFEL] (Anzahl) und [SUMME] (Augensumme).
//  - Patzer: fuer jede 6 W6 Schaden direkt auf WIL, danach WIL-Probe — misslingt
//    sie, Zustand "Entkraeftet".
//  - Alle Punkte markiert = erschoepft, bis die Aufladebedingung erfuellt ist.
// Reine Funktion, gewuerfelt wird hier (nicht im State-Updater).

import { rollDie, rollSave } from './dice.js';
import { applyCondition } from './gmActions.js';
import { effectiveSaveMode, zeroStates } from './status.js';

export function spellUsesLeft(item) {
  if (!item?.usage) return 0;
  return Math.max(0, item.usage.max - item.usage.current);
}

export function castSpell(character, itemId, power, rng = rollDie) {
  const item = character.items[itemId];
  const left = spellUsesLeft(item);
  const p = Math.max(1, Math.min(left, Math.floor(power) || 1));
  const dice = Array.from({ length: p }, () => rng(6));
  const sum = dice.reduce((a, b) => a + b, 0);
  const marks = dice.filter((d) => d >= 4).length;
  const sixes = dice.filter((d) => d === 6).length;
  const usage = { ...item.usage, current: Math.min(item.usage.max, item.usage.current + marks) };

  let next = { ...character, items: { ...character.items, [itemId]: { ...item, usage } } };

  let wilDamage = 0;
  let wilDice = [];
  let saveRoll = null;
  let drained = false;
  let drainedOverflow = false;
  if (sixes > 0) {
    wilDice = Array.from({ length: sixes }, () => rng(6));
    wilDamage = wilDice.reduce((a, b) => a + b, 0);
    next = { ...next, wil: { ...next.wil, current: Math.max(0, next.wil.current - wilDamage) } };
    saveRoll = rollSave(next.wil.current, effectiveSaveMode(next, 'wil'));
    if (!saveRoll.ok) {
      const res = applyCondition(next, 'drained');
      next = res.character;
      drained = true;
      drainedOverflow = res.overflow;
    }
  }

  return {
    character: next,
    power: p,
    dice,
    sum,
    marks,
    sixes,
    wilDice,
    wilDamage,
    saveRoll,
    drained,
    drainedOverflow,
    depleted: usage.current >= usage.max,
    zero: zeroStates(next),
  };
}

// Setzt Wuerfelzahl und Summe in den Wirkungstext ein. Versteht die Platzhalter
// aller Sprachen ([DICE]/[WUERFEL]/[DADOS], [SUM]/[SUMME]/[SUMA]) samt Zusatz
// im Klammerinhalt (z. B. "[DADOS x15]" -> "3 x15").
export function spellEffectText(text, dice, sum) {
  return String(text || '')
    .replace(/\[(?:SUM|SUMME|SUMA)([^\]]*)\]/g, (_m, rest) => `${sum}${rest}`)
    .replace(/\[(?:DICE|WUERFEL|DADOS)([^\]]*)\]/g, (_m, rest) => `${dice}${rest}`);
}
