// Licht (Mausritter 2.3, S. 8/9): Fackeln und Laternen markieren alle 6 Zuege
// eine Nutzung. Eine Lichtquelle "brennt" (`lit`), solange die Spielerin sie
// angezuendet hat; der Zeit-Tracker des SL loest alle 6 Zuege `burnLights` aus.
// Ist der letzte Punkt markiert, geht sie aus (Laterne: Oel nachfuellen,
// elektrische Laterne: Batterien).

export function litLights(c) {
  return Object.values(c.items || {}).filter((i) => i.type === 'light' && i.lit);
}

export function burnLights(c) {
  const burned = [];
  const items = { ...c.items };
  for (const it of litLights(c)) {
    if (!it.usage) continue;
    const current = Math.min(it.usage.max, it.usage.current + 1);
    const out = current >= it.usage.max;
    items[it.itemId] = { ...it, usage: { ...it.usage, current }, lit: !out };
    burned.push({ item: items[it.itemId], out });
  }
  return { character: burned.length ? { ...c, items } : c, burned };
}
