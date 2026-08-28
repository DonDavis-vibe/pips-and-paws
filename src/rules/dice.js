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
export function rollSave(attrValue) {
  const d = rollDie(20);
  return {
    d,
    target: attrValue,
    ok: d <= attrValue,
    nat1: d === 1,
    nat20: d === 20,
  };
}
