// Gegenstands-Katalog, abgeleitet aus dem offiziellen Mausritter-SRD 2.3.1
// (reference/mausritter-srd-2.3.1.md, CC BY 4.0). Wirkungstexte sind zusammengefasst.
//
// Mausritter fuehrt Waffen als generische KLASSEN (Leicht/Mittel/Schwer ...), nicht
// als Einzelwaffen — konkrete Namen sind nur Beispiele. Deutsche Begriffe sind an die
// offizielle System-Matters-Ausgabe angeglichen, wo deren Terminologie greifbar war
// (Schnellstarter/Referenzbogen/Spielrundenbogen); sonst eigene Uebersetzung. Siehe PLAN.md §15.7.

import { newId } from '../rules/character.js';

// type: standard | weapon | armour | spell | condition | light | ration | ammo
// size: 1 | 2 ; usage: { max } | null
export const ITEM_CATALOG = {
  // --- Waffenklassen (SRD S. "Weapons") ---
  w_improvised: {
    type: 'weapon', size: 1, damage: 'W6', usage: { max: 3 }, cost: 1,
    name: { de: 'Improvisierte Waffe', en: 'Improvised weapon' },
    effect: { de: 'W6 Schaden. Nach jedem Kampf Nutzung markieren.', en: 'd6 damage. Always mark usage after a fight.' },
  },
  w_light: {
    type: 'weapon', size: 1, damage: 'W6', usage: { max: 3 }, cost: 10,
    name: { de: 'Leichte Waffe', en: 'Light weapon' },
    effect: { de: 'W6. Haupt- oder Nebenpfote. Mit zwei Waffen: beide Würfel, besseres Ergebnis. (Nadel, Dolch, Beil)', en: 'd6. Main or off paw. Two weapons: roll both, take best. (Needle, dagger, hatchet)' },
  },
  w_medium: {
    type: 'weapon', size: 1, damage: 'W6 / W8', usage: { max: 3 }, cost: 20,
    name: { de: 'Mittelschwere Waffe', en: 'Medium weapon' },
    effect: { de: 'W6 einhändig, W8 mit beiden Pfoten. (Schwert, Axt, Stab)', en: 'd6 one paw, d8 in both paws. (Sword, axe, staff)' },
  },
  w_heavy: {
    type: 'weapon', size: 2, damage: 'W10', usage: { max: 3 }, cost: 40,
    name: { de: 'Schwere Waffe', en: 'Heavy weapon' },
    effect: { de: 'W10. Beide Pfoten. (Mistgabel, Speer, schwerer Hammer)', en: 'd10. Both paws. (Trashhook, spear, heavy hammer)' },
  },
  w_light_ranged: {
    type: 'weapon', size: 1, damage: 'W6', usage: { max: 3 }, cost: 10,
    name: { de: 'Leichte Fernkampfwaffe', en: 'Light ranged weapon' },
    effect: { de: 'W6. Hauptpfote. (Schleuder, leichte Armbrust)', en: 'd6. Main paw. (Sling, hand crossbow)' },
  },
  w_heavy_ranged: {
    type: 'weapon', size: 2, damage: 'W8', usage: { max: 3 }, cost: 40,
    name: { de: 'Schwere Fernkampfwaffe', en: 'Heavy ranged weapon' },
    effect: { de: 'W8. Beide Pfoten. (Bogen, schwere Armbrust)', en: 'd8. Both paws. (Bow, heavy crossbow)' },
  },
  ammo_stones: {
    type: 'ammo', size: 1, usage: { max: 3 }, cost: 1,
    name: { de: 'Steine, Beutel', en: 'Stones, pouch' },
    effect: { de: 'Munition. Wird im Körperplatz getragen.', en: 'Ammunition. Carried in a body slot.' },
  },
  ammo_arrows: {
    type: 'ammo', size: 1, usage: { max: 3 }, cost: 5,
    name: { de: 'Pfeile, Köcher', en: 'Arrows, quiver' },
    effect: { de: 'Munition. Wird im Körperplatz getragen.', en: 'Ammunition. Carried in a body slot.' },
  },

  // --- Ruestung (SRD: beide verhindern 1 Schaden) ---
  // Laut SRD belegt Leichte Ruestung eigentlich "Nebenpfote + ein Koerperplatz"
  // (ein echtes Pfote+Koerper-Paar). Das Platzmodell hier kennt nur Paare
  // derselben Art (zwei Pfoten, zwei Koerper, zwei Rucksack — SLOT_PAIR_FIRST/
  // SECOND in rules/character.js), darum beschreibt der Text bewusst das, was
  // die App tatsaechlich tut, statt eine Kombination zu versprechen, die sich
  // nicht draufziehen laesst. Siehe PLAN.md §11.7.
  light_armour: {
    type: 'armour', size: 2, defense: 1, usage: { max: 3 }, cost: 150,
    name: { de: 'Leichte Rüstung', en: 'Light armour' },
    effect: { de: 'Verhindert 1 Schaden. Belegt zwei benachbarte Plätze derselben Art (z. B. beide Pfoten, beide Körper oder zwei Rucksackplätze).', en: 'Prevents 1 damage. Takes up two adjacent slots of the same kind (e.g. both paws, both body, or two pack slots).' },
  },
  heavy_armour: {
    type: 'armour', size: 2, defense: 1, usage: { max: 3 }, cost: 500,
    name: { de: 'Schwere Rüstung', en: 'Heavy armour' },
    effect: { de: 'Verhindert 1 Schaden. Belegt zwei benachbarte Plätze derselben Art.', en: 'Prevents 1 damage. Takes up two adjacent slots of the same kind.' },
  },

  // --- Licht & Nahrung ---
  torches: {
    type: 'light', size: 1, usage: { max: 3 }, cost: 10,
    name: { de: 'Fackeln', en: 'Torches' },
    effect: { de: 'Spenden Licht. Nutzung alle 6 Züge markieren.', en: 'Provide light. Mark usage every 6 Turns.' },
  },
  lantern: {
    type: 'light', size: 1, usage: { max: 3 }, cost: 50,
    name: { de: 'Laterne', en: 'Lantern' },
    effect: { de: 'Licht. Muss mit Öl nachgefüllt werden.', en: 'Light. Must be refilled with oil.' },
  },
  oil: {
    type: 'standard', size: 1, usage: { max: 3 }, cost: 10,
    name: { de: 'Öl, für Laterne', en: 'Oil, for lantern' },
    effect: { de: '', en: '' },
  },
  electric_lantern: {
    type: 'light', size: 1, usage: { max: 6 }, cost: 200,
    name: { de: 'Elektrische Laterne', en: 'Electric lantern' },
    effect: { de: 'Helles Licht, sechs Nutzungspunkte. Braucht Batterien.', en: 'Bright light, six usage dots. Needs batteries.' },
  },
  rations: {
    type: 'ration', size: 1, usage: { max: 3 }, cost: 5,
    name: { de: 'Rationen', en: 'Rations' },
    effect: { de: 'Eine Ration + eine Wache Rast heilt alle TP. Nutzung nach einer Mahlzeit markieren.', en: 'A ration + a Watch of rest heals all HP. Mark usage after a meal.' },
  },

  // --- Ausruestung (SRD "Gear and prices") ---
  bedroll: { type: 'standard', size: 1, cost: 10, name: { de: 'Schlafrolle', en: 'Bedroll' }, effect: { de: '', en: '' } },
  bellows: { type: 'standard', size: 1, cost: 10, name: { de: 'Blasebalg', en: 'Bellows' }, effect: { de: '', en: '' } },
  bottle: { type: 'standard', size: 1, cost: 1, name: { de: 'Flasche', en: 'Bottle' }, effect: { de: '', en: '' } },
  bucket: { type: 'standard', size: 1, cost: 5, name: { de: 'Eimer', en: 'Bucket' }, effect: { de: '', en: '' } },
  caltrops: { type: 'standard', size: 1, usage: { max: 3 }, cost: 10, name: { de: 'Krähenfüße, Beutel', en: 'Caltrops, bag' }, effect: { de: '', en: '' } },
  chalk: { type: 'standard', size: 1, usage: { max: 3 }, cost: 1, name: { de: 'Kreide', en: 'Chalk' }, effect: { de: '', en: '' } },
  chisel: { type: 'standard', size: 1, cost: 5, name: { de: 'Meissel', en: 'Chisel' }, effect: { de: '', en: '' } },
  cookpots: { type: 'standard', size: 1, cost: 10, name: { de: 'Kochtöpfe', en: 'Cookpots' }, effect: { de: '', en: '' } },
  crowbar: { type: 'standard', size: 1, cost: 10, name: { de: 'Brecheisen', en: 'Crowbar' }, effect: { de: '', en: '' } },
  drill: { type: 'standard', size: 1, cost: 10, name: { de: 'Handbohrer', en: 'Drill' }, effect: { de: '', en: '' } },
  glue: { type: 'standard', size: 1, usage: { max: 3 }, cost: 5, name: { de: 'Leim', en: 'Glue' }, effect: { de: '', en: '' } },
  grease: { type: 'standard', size: 1, usage: { max: 3 }, cost: 5, name: { de: 'Schmierfett', en: 'Grease' }, effect: { de: '', en: '' } },
  hammer: { type: 'standard', size: 1, usage: { max: 3 }, cost: 10, name: { de: 'Hammer', en: 'Hammer' }, effect: { de: '', en: '' } },
  horn: { type: 'standard', size: 1, cost: 10, name: { de: 'Signalhorn', en: 'Horn' }, effect: { de: '', en: '' } },
  hourglass: { type: 'standard', size: 1, cost: 300, name: { de: 'Sanduhr', en: 'Hourglass' }, effect: { de: '', en: '' } },
  lockpicks: { type: 'standard', size: 1, usage: { max: 3 }, cost: 100, name: { de: 'Dietriche', en: 'Lockpicks' }, effect: { de: '', en: '' } },
  metal_file: { type: 'standard', size: 1, usage: { max: 3 }, cost: 5, name: { de: 'Metallfeile', en: 'Metal file' }, effect: { de: '', en: '' } },
  mirror: { type: 'standard', size: 1, cost: 200, name: { de: 'Spiegel', en: 'Mirror' }, effect: { de: '', en: '' } },
  instrument: { type: 'standard', size: 1, cost: 200, name: { de: 'Musikinstrument', en: 'Musical instrument' }, effect: { de: '', en: '' } },
  net: { type: 'standard', size: 1, cost: 10, name: { de: 'Netz', en: 'Net' }, effect: { de: 'Ein Ziel festsetzen.', en: 'Entangle a target.' } },
  padlock: { type: 'standard', size: 1, cost: 20, name: { de: 'Vorhängeschloss & Schlüssel', en: 'Padlock and key' }, effect: { de: '', en: '' } },
  perfume: { type: 'standard', size: 1, usage: { max: 3 }, cost: 50, name: { de: 'Parfum', en: 'Perfume' }, effect: { de: '', en: '' } },
  pick: { type: 'standard', size: 1, usage: { max: 3 }, cost: 10, name: { de: 'Spitzhacke', en: 'Pick' }, effect: { de: '', en: '' } },
  loaded_dice: { type: 'standard', size: 1, cost: 5, name: { de: 'Gezinkte Würfel', en: 'Set of loaded dice' }, effect: { de: '', en: '' } },
  shovel: { type: 'standard', size: 1, usage: { max: 3 }, cost: 10, name: { de: 'Schaufel', en: 'Shovel' }, effect: { de: '', en: '' } },
  tent: { type: 'standard', size: 1, usage: { max: 3 }, cost: 80, name: { de: 'Zelt', en: 'Tent' }, effect: { de: '', en: '' } },
  waterskin: { type: 'standard', size: 1, usage: { max: 3 }, cost: 5, name: { de: 'Wasserschlauch', en: 'Waterskin' }, effect: { de: '', en: '' } },
  whistle: { type: 'standard', size: 1, cost: 5, name: { de: 'Trillerpfeife', en: 'Whistle' }, effect: { de: '', en: '' } },
  pole: { type: 'standard', size: 1, cost: 1, name: { de: 'Holzstange, 15 cm', en: 'Wooden pole, 6"' }, effect: { de: '', en: '' } },
  spikes: { type: 'standard', size: 1, usage: { max: 3 }, cost: 1, name: { de: 'Holzpflöcke', en: 'Wooden spikes' }, effect: { de: '', en: '' } },
  rope: { type: 'standard', size: 1, cost: 20, name: { de: 'Seil', en: 'Rope' }, effect: { de: '', en: '' } },
  twine: { type: 'standard', size: 1, usage: { max: 3 }, cost: 40, name: { de: 'Bindfaden, Rolle', en: 'Twine, roll' }, effect: { de: '', en: '' } },
  thread: { type: 'standard', size: 1, usage: { max: 3 }, cost: 20, name: { de: 'Faden, Spule', en: 'Thread, spool' }, effect: { de: '', en: '' } },
  soap: { type: 'standard', size: 1, usage: { max: 3 }, cost: 10, name: { de: 'Seife', en: 'Soap' }, effect: { de: '', en: '' } },
  incense: { type: 'standard', size: 1, usage: { max: 3 }, cost: 20, name: { de: 'Räucherstäbchen', en: 'Incense stick' }, effect: { de: '', en: '' } },
  fishhook: { type: 'standard', size: 1, usage: { max: 3 }, cost: 20, name: { de: 'Angelhaken', en: 'Fishing hook' }, effect: { de: '', en: '' } },
  lens: { type: 'standard', size: 1, cost: 200, name: { de: 'Linse', en: 'Lens' }, effect: { de: '', en: '' } },
  disguise_kit: { type: 'standard', size: 1, usage: { max: 3 }, cost: 50, name: { de: 'Verkleidungsset', en: 'Disguise kit' }, effect: { de: '', en: '' } },
  pip_purse: { type: 'standard', size: 1, cost: 0, name: { de: 'Pip-Beutel (250)', en: 'Pip purse (250)' }, effect: { de: 'Fasst 250 Pips.', en: 'Holds 250 pips.' } },
};

export const CATALOG_KEYS = Object.keys(ITEM_CATALOG);

// Zustaende (SRD): belegen einen Inventarplatz, bis die "clear"-Bedingung erfuellt ist.
export const CONDITION_CATALOG = {
  exhausted: {
    name: { de: 'Erschöpft', en: 'Exhausted' },
    effect: { de: 'Belegt einen Inventarplatz. Für Mäuse ohne Rast oder als Folge körperlicher Anstrengung.', en: 'Takes an inventory slot. For mice who go without rest, or as a consequence of physical exertion.' },
    clear: { de: 'Nach einer langen Rast', en: 'After a long rest' },
  },
  frightened: {
    name: { de: 'Ängstlich', en: 'Frightened' },
    effect: { de: 'WIL-Rettungswurf nötig, um sich der Quelle der Angst zu nähern.', en: 'WIL save to approach the source of fear.' },
    clear: { de: 'Nach einer kurzen Rast', en: 'After a short rest' },
  },
  hungry: {
    name: { de: 'Hungrig', en: 'Hungry' },
    effect: { de: 'Belegt einen Platz. Entsteht, wenn die Maus einen Tag lang keine Ration isst.', en: 'Takes a slot. Gained if the mouse goes a day without eating a ration.' },
    clear: { de: 'Nach einer Mahlzeit', en: 'After a meal' },
  },
  injured: {
    name: { de: 'Verletzt', en: 'Injured' },
    effect: { de: 'Nachteil auf STR- und DEX-Rettungswürfe. Bei kritischem Schaden oder schwerer Verletzung.', en: 'Disadvantage on STR & DEX saves. From critical damage or serious injury.' },
    clear: { de: 'Nach einer vollen Rast', en: 'After a full rest' },
  },
  drained: {
    name: { de: 'Entkräftet', en: 'Drained' },
    effect: { de: 'Nachteil auf WIL-Rettungswürfe. Folge eines misslungenen Zaubers.', en: 'Disadvantage on WIL saves. From a failed spellcast.' },
    clear: { de: 'Nach einer vollen Rast', en: 'After a full rest' },
  },
  encumbered: {
    name: { de: 'Belastet', en: 'Encumbered' },
    effect: { de: 'Nachteil auf ALLE Rettungswürfe, kein Rennen. Wenn mehr getragen wird als Plätze frei sind.', en: 'Disadvantage on ALL saves, cannot run. When carrying more than your slots allow.' },
    clear: { de: 'Sobald genug Platz frei ist', en: 'Once enough slots are free' },
  },
};

// Zauber (SRD "List of spells", 2W8). Effekt/Aufladung zusammengefasst.
export const SPELL_CATALOG = {
  fireball: { name: { de: 'Feuerball', en: 'Fireball' }, effect: { de: 'Feuerball bis 24". [SUMME]+[WUERFEL] Schaden an allen im Umkreis von 6".', en: 'Fireball up to 24". [SUM]+[DICE] damage to all within 6".' } },
  heal: { name: { de: 'Genesung', en: 'Heal' }, effect: { de: 'Heilt [SUMME] STR-Schaden und entfernt "Verletzt".', en: 'Heal [SUM] STR damage and remove the Injured Condition.' } },
  magic_missile: { name: { de: 'Magisches Geschoss', en: 'Magic Missile' }, effect: { de: '[SUMME]+[WUERFEL] Schaden an einer sichtbaren Kreatur.', en: '[SUM]+[DICE] damage to a creature within sight.' } },
  fear: { name: { de: 'Furcht', en: 'Fear' }, effect: { de: 'Gibt [WUERFEL] Kreaturen "Ängstlich".', en: 'Give the Frightened Condition to [DICE] creatures.' } },
  darkness: { name: { de: 'Finsternis', en: 'Darkness' }, effect: { de: 'Kugel reiner Dunkelheit ([SUMME] x 2" Durchmesser) für [WUERFEL] Züge.', en: '[SUM] x 2" sphere of pure darkness for [DICE] Turns.' } },
  restore: { name: { de: 'Wiederherstellen', en: 'Restore' }, effect: { de: 'Entfernt "Erschöpft" oder "Ängstlich" von [WUERFEL]+1 Kreaturen.', en: 'Remove Exhausted or Frightened from [DICE]+1 creatures.' } },
  be_understood: { name: { de: 'Verstanden werden', en: 'Be Understood' }, effect: { de: 'Macht dich [WUERFEL] Kreaturen einer anderen Art für [WUERFEL] Züge verständlich.', en: 'Make your meaning clear to [DICE] creatures of another species for [DICE] Turns.' } },
  ghost_beetle: { name: { de: 'Geisterkäfer', en: 'Ghost Beetle' }, effect: { de: 'Illusorischer Käfer, trägt 6 Inventarplätze, für [WUERFEL] x 6 Züge.', en: 'Illusory beetle carrying 6 inventory slots for [DICE] x 6 Turns.' } },
  light: { name: { de: 'Licht', en: 'Light' }, effect: { de: '[WUERFEL] Kreaturen: WIL-Rettungswurf oder betäubt. Oder: Fackellicht für [SUMME] Züge.', en: '[DICE] creatures WIL save or stunned. Or: torch-bright light for [SUM] Turns.' } },
  invisible_ring: { name: { de: 'Unsichtbarer Ring', en: 'Invisible Ring' }, effect: { de: 'Unsichtbarer, unbeweglicher Kraftring ([WUERFEL] x 6") für [WUERFEL] Züge.', en: 'Invisible, immovable ring of force ([DICE] x 6") for [DICE] Turns.' } },
  knock: { name: { de: 'Öffnen', en: 'Knock' }, effect: { de: 'Öffnet Tür/Behälter wie ein Rettungswurf mit STR 10 + [WUERFEL] x 4.', en: 'Open a door/container as a Save with STR 10 + [DICE] x 4.' } },
  grease: { name: { de: 'Schmiere', en: 'Grease' }, effect: { de: '[WUERFEL] x 6" Fläche mit rutschigem, brennbarem Fett. DEX-Rettungswurf oder hinfallen.', en: '[DICE] x 6" area of slippery, flammable grease. DEX save or fall prone.' } },
  grow: { name: { de: 'Wachsen', en: 'Grow' }, effect: { de: 'Vergrössert eine Kreatur auf das [WUERFEL]+1-fache für 1 Zug.', en: 'Grow a creature to [DICE]+1 times its size for 1 Turn.' } },
  invisibility: { name: { de: 'Unsichtbarkeit', en: 'Invisibility' }, effect: { de: 'Kreatur unsichtbar für [WUERFEL] Züge. Bewegung verkürzt um 1 Zug.', en: 'Creature invisible for [DICE] Turns. Movement reduces duration by 1 Turn.' } },
  catnip: { name: { de: 'Katzenminze', en: 'Catnip' }, effect: { de: 'Macht einen Gegenstand für [WUERFEL] Züge zum unwiderstehlichen Katzen-Köder.', en: 'Turn an object into an irresistible cat lure for [DICE] Turns.' } },
};

function baseFromKey(key) {
  if (ITEM_CATALOG[key]) return { ...ITEM_CATALOG[key], key, type: ITEM_CATALOG[key].type };
  if (SPELL_CATALOG[key]) return { ...SPELL_CATALOG[key], key, type: 'spell', size: 1, usage: { max: 3 } };
  return null;
}

// Erzeugt eine frische Instanz aus einem Katalog-/Zauber-Eintrag oder einen Custom-Gegenstand.
export function makeItem(key, overrides = {}) {
  const spec = baseFromKey(key) || {
    key: null,
    type: 'standard',
    size: 1,
    name: { de: overrides.nameText || 'Gegenstand', en: overrides.nameText || 'Item' },
    effect: { de: '', en: '' },
  };
  const usage = overrides.usage === null ? null : overrides.usage ?? spec.usage ?? null;

  return {
    itemId: newId('i'),
    key: spec.key ?? null,
    type: overrides.type || spec.type,
    size: overrides.size || spec.size || 1,
    name: overrides.name || spec.name,
    effect: overrides.effect || spec.effect || { de: '', en: '' },
    damage: overrides.damage ?? spec.damage ?? null,
    defense: overrides.defense ?? spec.defense ?? null,
    usage: usage ? { max: usage.max, current: usage.current ?? 0 } : null,
    cleared: false,
  };
}

export function makeCondition(key, overrides = {}) {
  const spec = CONDITION_CATALOG[key];
  return {
    itemId: newId('i'),
    key: spec ? key : null,
    type: 'condition',
    size: 1,
    name: spec?.name || (typeof overrides.name === 'string' ? { de: overrides.name, en: overrides.name } : overrides.name) || { de: 'Zustand', en: 'Condition' },
    effect: spec?.effect || overrides.effect || { de: '', en: '' },
    clear: spec?.clear || null,
    damage: null,
    defense: null,
    usage: null,
    cleared: false,
  };
}
