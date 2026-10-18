// Das gemeinsame Lager ("Tischmitte", z. B. ein Karren oder eine Truhe):
// optional mit einstellbarer Platzzahl. Ein 2-Platz-Gegenstand zaehlt doppelt.
// capacity 0 = unbegrenzt. Gilt fuer Ablegen durch Spieler; der SL darf auch
// ueber die Grenze hinaus Beute hineinlegen (die Anzeige wird dann rot).

export const itemSlots = (item) => (item?.size === 2 ? 2 : 1);

export const stashUsed = (items) => (items || []).reduce((n, i) => n + itemSlots(i), 0);

export const stashHasRoom = (used, item, capacity) => !capacity || used + itemSlots(item) <= capacity;

export const normalizeStashCfg = (cfg) => ({
  name: typeof cfg?.name === 'string' ? cfg.name.trim().slice(0, 40) : '',
  capacity: Math.max(0, Math.min(99, Math.floor(Number(cfg?.capacity) || 0))),
});
