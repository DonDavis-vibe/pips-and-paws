// Charakter-Datenmodell + reine Ableitungen.

export const SCHEMA_VERSION = 1;

export const PAW_SLOTS = ['paw_left', 'paw_right'];
export const BODY_SLOTS = ['body_1', 'body_2'];
export const PACK_SLOTS = ['pack_1', 'pack_2', 'pack_3', 'pack_4', 'pack_5', 'pack_6'];
export const ALL_SLOTS = [...PAW_SLOTS, ...BODY_SLOTS, ...PACK_SLOTS];

// Ein 2-Platz-Gegenstand belegt immer ein festes Paar; das erste Feld ist der "Anker".
export const SLOT_PAIR_FIRST = {
  paw_left: 'paw_left',
  paw_right: 'paw_left',
  body_1: 'body_1',
  body_2: 'body_1',
  pack_1: 'pack_1',
  pack_2: 'pack_1',
  pack_3: 'pack_3',
  pack_4: 'pack_3',
  pack_5: 'pack_5',
  pack_6: 'pack_5',
};

export const SLOT_PAIR_SECOND = {
  paw_left: 'paw_right',
  body_1: 'body_2',
  pack_1: 'pack_2',
  pack_3: 'pack_4',
  pack_5: 'pack_6',
};

export function newId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function blankCharacter() {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId('c'),
    name: '',
    playerName: '',
    background: '',
    birthsign: '',
    disposition: '',
    coat: '',
    detail: '',
    str: { max: 10, current: 10 },
    dex: { max: 10, current: 10 },
    wil: { max: 10, current: 10 },
    hp: { max: 4, current: 4 },
    pips: 0,
    xp: 0,
    level: 1,
    inventory: Object.fromEntries(ALL_SLOTS.map((s) => [s, null])),
    items: {}, // itemId -> Item
    notes: '',
  };
}

// Ist der Bogen praktisch unberuehrt? -> Wizard anbieten.
export function isBlank(c) {
  if (!c) return true;
  if (c.name?.trim()) return false;
  if (Object.keys(c.items || {}).length > 0) return false;
  return ['str', 'dex', 'wil'].every((k) => c[k]?.max === 10 && c[k]?.current === 10);
}

// Defensiver Merge fuer geladene/importierte Daten (Feldstruktur kann sich aendern).
export function normalizeCharacter(raw) {
  const base = blankCharacter();
  if (!raw || typeof raw !== 'object') return base;
  const merged = { ...base, ...raw };
  merged.id = raw.id || base.id;
  for (const k of ['str', 'dex', 'wil', 'hp']) {
    merged[k] = { ...base[k], ...raw[k] };
  }
  merged.inventory = { ...base.inventory, ...raw.inventory };
  merged.items = raw.items && typeof raw.items === 'object' ? raw.items : {};
  merged.schemaVersion = SCHEMA_VERSION;
  return merged;
}

// XP -> Stufe (SRD "Level"-Tabelle: 0 / 1000 / 3000 / 6000, danach je +5000).
export const XP_THRESHOLDS = [0, 1000, 3000, 6000, 11000, 16000, 21000, 26000, 31000, 36000];

export function levelForXp(xp) {
  let lvl = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i += 1) {
    if (xp >= XP_THRESHOLDS[i]) lvl = i + 1;
  }
  return lvl;
}

// Grit je Stufe (SRD): Stufe 1 = 0, 2 = 1, 3–4 = 2, 5+ = 3.
export function gritForLevel(level) {
  if (level >= 5) return 3;
  if (level >= 3) return 2;
  if (level >= 2) return 1;
  return 0;
}
