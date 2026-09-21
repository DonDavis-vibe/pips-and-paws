import { useMemo, useState } from 'react';
import { readJSON, writeJSON } from './utils/storage.js';

// Merkt sich eine vom Spieler frei gewaehlte Reihenfolge (Panels auf dem
// Bogen, Pfoten/Koerper/Rucksack im Inventar) unter `key` in localStorage.
// `defaultOrder` ist die volle, feste Liste aller moeglichen IDs; `visible`
// filtert sie auf das, was gerade tatsaechlich angezeigt wird (z. B. nur
// Panels mit Daten). Neue IDs, die der gespeicherten Reihenfolge noch fehlen
// (Update brachte ein neues Panel), fallen an ihre Default-Position zurueck,
// statt zu verschwinden oder ganz vorne aufzutauchen.
export function useOrder(key, defaultOrder, visible) {
  const [saved, setSaved] = useState(() => {
    const stored = readJSON(key);
    return Array.isArray(stored) ? stored.filter((id) => defaultOrder.includes(id)) : [];
  });

  const order = useMemo(() => {
    const known = new Set(saved);
    const merged = [...saved, ...defaultOrder.filter((id) => !known.has(id))];
    return merged.filter((id) => visible.includes(id));
  }, [saved, defaultOrder, visible]);

  const reorder = (activeId, overId) => {
    if (activeId === overId) return;
    setSaved((prev) => {
      const base = prev.length ? prev : defaultOrder;
      const from = base.indexOf(activeId);
      const to = base.indexOf(overId);
      if (from === -1 || to === -1) return prev;
      const next = base.slice();
      next.splice(from, 1);
      next.splice(to, 0, activeId);
      writeJSON(key, next);
      return next;
    });
  };

  return { order, reorder };
}
