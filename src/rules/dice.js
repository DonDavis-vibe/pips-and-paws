// Reine Wuerfel-Funktionen. Kein DOM, kein State.

export function rollDie(sides = 6) {
  return 1 + Math.floor(Math.random() * sides);
}

export function rollDice(count, sides = 6) {
  const dice = Array.from({ length: count }, () => rollDie(sides));
  return { dice, total: dice.reduce((a, b) => a + b, 0) };
}

// Mausritter-Attributwurf: 3W6, die zwei hoechsten behalten (Wert 2–12).
export function rollAttribute() {
  const dice = [rollDie(6), rollDie(6), rollDie(6)].sort((a, b) => a - b);
  return { dice, kept: [dice[1], dice[2]], value: dice[1] + dice[2] };
}

// W66: zwei W6 als Zehner/Einer gelesen (11..66).
export function rollD66() {
  const tens = rollDie(6);
  const ones = rollDie(6);
  return { tens, ones, value: tens * 10 + ones };
}

// Mausritter-Rettungswurf: W20, Wurf <= Attributwert ist ein Erfolg.
// mode: 'normal' | 'adv' (Vorteil: 2W20, niedrigeren nehmen)
//                | 'disadv' (Nachteil: 2W20, hoeheren nehmen)
export function rollSave(attrValue, mode = 'normal') {
  const a = rollDie(20);
  const b = mode === 'normal' ? null : rollDie(20);
  const d = b == null ? a : mode === 'adv' ? Math.min(a, b) : Math.max(a, b);
  return {
    d,
    dice: b == null ? [a] : [a, b],
    mode,
    target: attrValue,
    ok: d <= attrValue,
    nat1: d === 1,
    nat20: d === 20,
  };
}

// NSC-Reaktion: 2W6 (Mausritter GM-Screen / SRD).
const REACTION_BY_TOTAL = {
  2: 'hostile',
  3: 'unfriendly', 4: 'unfriendly', 5: 'unfriendly',
  6: 'unsure', 7: 'unsure', 8: 'unsure',
  9: 'talkative', 10: 'talkative', 11: 'talkative',
  12: 'helpful',
};

// Schadenswuerfel einer Waffe aus ihrem Anzeigetext ableiten ("W6", "W6 / W8",
// "W10"). Bewusst aus dem String, damit auch alte Spielstaende und Gegenstaende
// von aelteren Mitspielern funktionieren.
//   1 Zahl  -> eine Option (Hand egal)
//   2 Zahlen-> einhaendig / zweihaendig (Mausritter: mittlere Waffe W6 / W8)
export function weaponDamageOptions(item) {
  const nums = (String(item?.damage || '').match(/\d+/g) || []).map(Number).filter((n) => n > 0);
  if (nums.length === 0) return [];
  if (nums.length === 1) return [{ sides: nums[0], hands: null }];
  return [
    { sides: nums[0], hands: 'one' },
    { sides: nums[1], hands: 'two' },
  ];
}

export function rollReaction() {
  const a = rollDie(6);
  const b = rollDie(6);
  const total = a + b;
  return { dice: [a, b], total, key: REACTION_BY_TOTAL[total] };
}

// Schatz-Tabelle (W20) vom Mausritter GM-Screen.
export function rollTreasure() {
  const d = rollDie(20);
  const fixed = { 1: 'magicSword', 2: 'randomSpell', 3: 'trinket', 4: 'valuable', 5: 'unusual' };
  if (fixed[d]) return { d, key: fixed[d] };
  if (d <= 8) return { d, key: 'large' };
  if (d <= 10) return { d, key: 'useful' };
  if (d === 11) return { d, key: 'pips', pips: rollDie(6) * 100 };
  if (d <= 14) return { d, key: 'pips', pips: rollDie(6) * 50 };
  if (d <= 17) return { d, key: 'pips', pips: rollDie(6) * 10 };
  return { d, key: 'pips', pips: rollDie(6) * 5 };
}
