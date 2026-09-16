// Charakter-Datenmodell + reine Ableitungen.

export const SCHEMA_VERSION = 1;

export const PAW_SLOTS = ['paw_left', 'paw_right'];
export const BODY_SLOTS = ['body_1', 'body_2'];
export const PACK_SLOTS = ['pack_1', 'pack_2', 'pack_3', 'pack_4', 'pack_5', 'pack_6'];
export const ALL_SLOTS = [...PAW_SLOTS, ...BODY_SLOTS, ...PACK_SLOTS];

// Ein 2-Platz-Gegenstand belegt standardmaessig ein festes Paar derselben Art
// (zwei Pfoten, zwei Koerper oder zwei Rucksack); das erste Feld ist der
// "Anker". Gilt fuer alle 2-Platz-Gegenstaende ohne eigenes `pairKind`.
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

// Item-abhaengige Ausnahme fuer `pairKind: 'pawBody'` (siehe items.js,
// Leichte Ruestung): die SRD gibt ihr ein echtes Pfote+Koerper-Paar statt
// zweier gleichartiger Plaetze. Zeilenweise gepaart wie auf dem offiziellen
// Blatt (Hauptpfote+Koerper, Nebenpfote+Koerper) — welche Pfote gerade
// "Nebenpfote" ist, legt die Spielerin am Tisch fest, beide Zeilen sind
// gleichwertig nutzbar. Greift nur auf diesen vier Feldern; im Rucksack
// bleibt es beim gleichartigen Paar (SLOT_PAIR_FIRST/SECOND), da es dort
// keine Pfote/Koerper-Unterscheidung gibt. Siehe PLAN.md §11.7.
export const CROSS_PAIR_FIRST = {
  paw_left: 'paw_left',
  body_1: 'paw_left',
  paw_right: 'paw_right',
  body_2: 'paw_right',
};

export const CROSS_PAIR_SECOND = {
  paw_left: 'body_1',
  paw_right: 'body_2',
};

export function newId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function blankCharacter() {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId('c'),
    name: '',
    portrait: '',
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
    hirelings: [], // siehe rules/hirelings.js — kein eigenes Inventarraster
    // Mumm/Grit (SRD §"Grit"): itemIds von Zustaenden, die im Mumm-Feld liegen
    // und dort ignoriert werden — siehe gritForLevel() unten + rules/inventory.js
    // #placeInGrit. Eigene Liste statt `inventory`-Slot, weil das Mumm-Feld ein
    // separater Bereich mit variabler Kapazitaet (0-3, je nach Stufe) ist, keine
    // feste Anzahl Plaetze wie Pfoten/Koerper/Rucksack.
    gritConditions: [],
    // Kritischer Schaden (SRD: misslungener STR-Rettungswurf nach STR-Schaden)
    // macht kampfunfaehig, bis versorgt + gerastet wird. Kein Zustands-Item
    // (die SRD kennt dafuer keine Zustandskarte, die einen Platz belegt) —
    // eigenes Flag, siehe rules/gmActions.js#applyDamage + rules/rest.js.
    incapacitated: false,
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
    // Aktueller Wert kann nie ueber dem Maximum liegen (repariert alte Staende).
    merged[k].current = Math.min(merged[k].current, merged[k].max);
  }
  merged.inventory = { ...base.inventory, ...raw.inventory };
  merged.items = raw.items && typeof raw.items === 'object' ? raw.items : {};
  merged.hirelings = Array.isArray(raw.hirelings) ? raw.hirelings : [];
  merged.gritConditions = Array.isArray(raw.gritConditions) ? raw.gritConditions : [];
  merged.incapacitated = !!raw.incapacitated;
  merged.portrait = typeof raw.portrait === 'string' ? raw.portrait : '';
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

// Droppable-IDs der Mumm-Feld-Plaetze (rules/inventory.js#placeInGrit,
// InventoryGrid.jsx). Eigenes Praefix, damit CharacterSheet.jsx#onDragEnd
// eine Ablage dort von einer normalen Inventar-Verschiebung unterscheiden kann.
export const GRIT_SLOT_PREFIX = 'grit_slot_';
