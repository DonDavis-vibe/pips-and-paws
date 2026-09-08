// Symbol-Pool fuer Gegenstandskarten.
//
// Gespeichert wird am Gegenstand nur der Schluessel (item.icon = 'rope'), nie das
// Symbol selbst — das haelt Spielstaende klein und die Multiplayer-Nachrichten
// schlank (im Gegensatz zu hochgeladenen Bildern).
//
// Aufloesung in dieser Reihenfolge (siehe iconForItem):
//   1. item.icon        — von Hand gewaehlt (Spieler oder SL)
//   2. Katalog-Standard — DEFAULT_BY_CATALOG, ueber item.key (Katalogschluessel)
//   3. Typ-Symbol       — Waffe/Ruestung/Zauber/... als letzte Rueckfallebene
//
// Alle Namen stammen aus lucide-react (ISC-Lizenz) und sind gegen das
// installierte Paket geprueft — kein Mausritter-Artwork, keine Verlagsgrafik.

import {
  Swords, Sword, Axe, Hammer, Shield, ShieldHalf, Target, Crosshair, Anvil,
  Wrench, Pickaxe, Shovel, Scissors, Drill, Brush, Ruler, Pencil, Magnet,
  Flame, Lamp, Lightbulb, Fuel, Zap, Sparkle, Sparkles, WandSparkles,
  Apple, Utensils, Soup, Wine, Milk, Carrot, Egg,
  Package, Backpack, Box, FlaskConical, Cylinder, Wallet, Coins, Gem,
  Cable, Link, Lock, KeyRound, Grab,
  Star, Moon, Ghost, Eye, EyeOff, Skull, Heart, Bandage, Thermometer, Droplet, HeartCrack,
  Leaf, PawPrint, Rat, Bird, Bug, Fish, Snail, Shell, Mountain, Wind, Waves, Trees,
  Scroll, BookOpen, Map, Compass, Feather, Bone, Bell, Megaphone, Music, Hourglass,
  Tent, Bed, Bath, Glasses, VenetianMask, Dices, Umbrella, Footprints, TriangleAlert,
} from 'lucide-react';

// Gruppen nur fuer die Darstellung im Auswahlfenster.
export const ICON_GROUPS = [
  {
    key: 'combat',
    icons: { swords: Swords, sword: Sword, axe: Axe, shield: Shield, shieldHalf: ShieldHalf, target: Target, crosshair: Crosshair, skull: Skull },
  },
  {
    key: 'tools',
    icons: { hammer: Hammer, wrench: Wrench, pickaxe: Pickaxe, shovel: Shovel, scissors: Scissors, drill: Drill, anvil: Anvil, brush: Brush, ruler: Ruler, pencil: Pencil, magnet: Magnet },
  },
  {
    key: 'light',
    icons: { flame: Flame, lamp: Lamp, lightbulb: Lightbulb, fuel: Fuel, zap: Zap, spark: Sparkle },
  },
  {
    key: 'food',
    icons: { apple: Apple, utensils: Utensils, soup: Soup, wine: Wine, milk: Milk, carrot: Carrot, egg: Egg },
  },
  {
    key: 'container',
    icons: { package: Package, backpack: Backpack, box: Box, flask: FlaskConical, cylinder: Cylinder, wallet: Wallet, coins: Coins, gem: Gem },
  },
  {
    key: 'binding',
    icons: { rope: Cable, link: Link, lock: Lock, key: KeyRound, grab: Grab },
  },
  {
    key: 'magic',
    icons: { sparkles: Sparkles, wand: WandSparkles, star: Star, moon: Moon, ghost: Ghost, eye: Eye, eyeOff: EyeOff },
  },
  {
    key: 'nature',
    icons: { leaf: Leaf, paw: PawPrint, rat: Rat, bird: Bird, bug: Bug, fish: Fish, snail: Snail, shell: Shell, mountain: Mountain, wind: Wind, waves: Waves, trees: Trees },
  },
  {
    key: 'body',
    icons: { heart: Heart, bandage: Bandage, thermometer: Thermometer, droplet: Droplet, heartCrack: HeartCrack, warning: TriangleAlert, footprints: Footprints, bone: Bone },
  },
  {
    key: 'gear',
    icons: { scroll: Scroll, book: BookOpen, map: Map, compass: Compass, feather: Feather, bell: Bell, horn: Megaphone, music: Music, hourglass: Hourglass, tent: Tent, bed: Bed, bath: Bath, glasses: Glasses, mask: VenetianMask, dice: Dices, umbrella: Umbrella },
  },
];

// Flache Nachschlagetabelle: Schluessel -> Komponente
export const ICON_BY_KEY = Object.assign({}, ...ICON_GROUPS.map((g) => g.icons));

// Standard je Katalogeintrag. Bewusst unvollstaendig: wo es keine ueberzeugende
// Entsprechung gibt, ist das Typ-Symbol ehrlicher als eine erzwungene Zuordnung.
export const DEFAULT_BY_CATALOG = {
  // Waffen & Munition
  w_improvised: 'hammer',
  w_light: 'sword',
  w_medium: 'swords',
  w_heavy: 'axe',
  w_light_ranged: 'target',
  w_heavy_ranged: 'crosshair',
  ammo_arrows: 'feather',
  ammo_stones: 'package',
  // Ruestung
  light_armour: 'shieldHalf',
  heavy_armour: 'shield',
  // Licht & Nahrung
  torches: 'flame',
  lantern: 'lamp',
  electric_lantern: 'lightbulb',
  oil: 'fuel',
  rations: 'apple',
  waterskin: 'droplet',
  // Ausruestung
  bedroll: 'bed',
  bellows: 'wind',
  bottle: 'flask',
  bucket: 'cylinder',
  chalk: 'brush',
  cookpots: 'soup',
  crowbar: 'wrench',
  drill: 'drill',
  hammer: 'hammer',
  horn: 'horn',
  hourglass: 'hourglass',
  instrument: 'music',
  lens: 'glasses',
  lockpicks: 'key',
  padlock: 'lock',
  perfume: 'sparkles',
  pick: 'pickaxe',
  pole: 'ruler',
  loaded_dice: 'dice',
  shovel: 'shovel',
  soap: 'bath',
  tent: 'tent',
  whistle: 'bell',
  rope: 'rope',
  twine: 'link',
  thread: 'link',
  fishhook: 'fish',
  disguise_kit: 'mask',
  pip_purse: 'coins',
  mirror: 'spark',
  incense: 'wind',
  // Zustaende
  exhausted: 'bed',
  frightened: 'ghost',
  hungry: 'utensils',
  injured: 'bandage',
  drained: 'droplet',
  encumbered: 'backpack',
  // Zauber
  fireball: 'flame',
  heal: 'heart',
  magic_missile: 'zap',
  fear: 'ghost',
  darkness: 'moon',
  restore: 'sparkles',
  be_understood: 'horn',
  ghost_beetle: 'bug',
  light: 'lightbulb',
  invisible_ring: 'eyeOff',
  invisibility: 'eyeOff',
  knock: 'lock',
  grow: 'mountain',
  catnip: 'leaf',
};

// Rueckfallebene nach Gegenstandstyp (deckt sich mit den Symbolen der Karte).
const BY_TYPE = {
  weapon: Swords,
  armour: Shield,
  spell: Sparkles,
  light: Flame,
  ration: Apple,
  condition: TriangleAlert,
  ammo: Feather,
  standard: Package,
};

// Welches Symbol gehoert auf diese Karte?
export function iconForItem(item) {
  if (!item) return Package;
  if (item.icon && ICON_BY_KEY[item.icon]) return ICON_BY_KEY[item.icon];
  const fromCatalog = DEFAULT_BY_CATALOG[item.key];
  if (fromCatalog && ICON_BY_KEY[fromCatalog]) return ICON_BY_KEY[fromCatalog];
  return BY_TYPE[item.type] || Package;
}
