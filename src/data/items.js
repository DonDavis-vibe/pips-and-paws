// Gegenstands-Katalog, abgeleitet aus dem offiziellen Mausritter-SRD 2.3.1
// (reference/mausritter-srd-2.3.1.md, CC BY 4.0). Wirkungstexte sind zusammengefasst.
//
// Mausritter fuehrt Waffen als generische KLASSEN (Leicht/Mittel/Schwer ...), nicht
// als Einzelwaffen — konkrete Namen sind nur Beispiele. Deutsche Begriffe sind
// eigene Uebersetzungen; ggf. an die System-Matters-Ausgabe angleichen (PLAN.md §15.7).

import { newId } from '../rules/character.js';

// type: standard | weapon | armour | spell | condition | light | ration | ammo
// size: 1 | 2 ; usage: { max } | null
export const ITEM_CATALOG = {
  // --- Waffenklassen (SRD S. "Weapons") ---
  w_improvised: {
    type: 'weapon', size: 1, damage: 'W6', usage: { max: 3 }, cost: 1,
    name: { de: 'Improvisierte Waffe', en: 'Improvised weapon', es: 'Arma improvisada' },
    effect: { de: 'W6 Schaden. Nach jedem Kampf Nutzung markieren.', en: 'd6 damage. Always mark usage after a fight.', es: 'd6 de daño. Siempre marca un uso después de un combate.' },
  },
  w_light: {
    type: 'weapon', size: 1, damage: 'W6', usage: { max: 3 }, cost: 10,
    name: { de: 'Leichte Waffe', en: 'Light weapon', es: 'Arma ligera' },
    effect: { de: 'W6. Haupt- oder Nebenpfote. Mit zwei Waffen: beide Wuerfel, besseres Ergebnis. (Nadel, Dolch, Beil)', en: 'd6. Main or off paw. Two weapons: roll both, take best. (Needle, dagger, hatchet)', es: 'd6. Pata principal / pata secundaria. Si atacas con dos armas, tira ambos dados y usa el mejor resultado.)' },
  },
  w_medium: {
    type: 'weapon', size: 1, damage: 'W6 / W8', usage: { max: 3 }, cost: 20,
    name: { de: 'Mittlere Waffe', en: 'Medium weapon'es: 'Arma mediana' },
    effect: { de: 'W6 einhaendig, W8 mit beiden Pfoten. (Schwert, Axt, Stab)', en: 'd6 one paw, d8 in both paws. (Sword, axe, staff)', es: 'Hace d6 de daño con una pata y d8 si se usa con dos patas. (Espada, hacha)' },
  },
  w_heavy: {
    type: 'weapon', size: 2, damage: 'W10', usage: { max: 3 }, cost: 40,
    name: { de: 'Schwere Waffe', en: 'Heavy weapon', es: 'Arma pesada' },
    effect: { de: 'W10. Beide Pfoten. (Mistgabel, Speer, schwerer Hammer)', en: 'd10. Both paws. (Trashhook, spear, heavy hammer)', es: 'd10. Ambas patas. (Anzuelanza, Lanza, Martillo de guerra)' },
  },
  w_light_ranged: {
    type: 'weapon', size: 1, damage: 'W6', usage: { max: 3 }, cost: 10,
    name: { de: 'Leichte Fernwaffe', en: 'Light ranged weapon', es: 'Arma ligera a distancia' },
    effect: { de: 'W6. Hauptpfote. (Schleuder, leichte Armbrust)', en: 'd6. Main paw. (Sling, hand crossbow)', es: 'd6. Pata principal. (Honda, ballesta)' },
  },
  w_heavy_ranged: {
    type: 'weapon', size: 2, damage: 'W8', usage: { max: 3 }, cost: 40,
    name: { de: 'Schwere Fernwaffe', en: 'Heavy ranged weapon', es: 'Arma pesada a distancia' },
    effect: { de: 'W8. Beide Pfoten. (Bogen, schwere Armbrust)', en: 'd8. Both paws. (Bow, heavy crossbow)', es: 'd8. Ambas patas. (Arco, ballesta pesada)' },
  },
  ammo_stones: {
    type: 'ammo', size: 1, usage: { max: 3 }, cost: 1,
    name: { de: 'Steine, Beutel', en: 'Stones, pouch', es: 'Piedras, bolsa' },
    effect: { de: 'Munition. Wird im Koerperplatz getragen.', en: 'Ammunition. Carried in a body slot.', es: 'Munición. Ocupa un espacio en cuerpo.' },
  },
  ammo_arrows: {
    type: 'ammo', size: 1, usage: { max: 3 }, cost: 5,
    name: { de: 'Pfeile, Koecher', en: 'Arrows, quiver', es: 'Flechas, carcaj' },
    effect: { de: 'Munition. Wird im Koerperplatz getragen.', en: 'Ammunition. Carried in a body slot.', es: 'Munición. Ocupa un espacio en cuerpo.' },
  },

  // --- Ruestung (SRD: beide verhindern 1 Schaden) ---
  light_armour: {
    type: 'armour', size: 2, defense: 1, usage: { max: 3 }, cost: 150,
    name: { de: 'Leichte Ruestung', en: 'Light armour', es: 'Armadura ligera' },
    effect: { de: 'Verhindert 1 Schaden. Nebenpfote + ein Koerperplatz.', en: 'Prevents 1 damage. Off paw and one body slot.', es: 'Previene 1 de daño. Pata secundaria y un espacio de cuerpo.' },
  },
  heavy_armour: {
    type: 'armour', size: 2, defense: 1, usage: { max: 3 }, cost: 500,
    name: { de: 'Schwere Ruestung', en: 'Heavy armour', es: 'Armadura pesada' },
    effect: { de: 'Verhindert 1 Schaden. Zwei Koerperplaetze.', en: 'Prevents 1 damage. Two body slots.', es: 'Previene 1 de daño. Dos espacios de cuerpo.' },
  },

  // --- Licht & Nahrung ---
  torches: {
    type: 'light', size: 1, usage: { max: 3 }, cost: 10,
    name: { de: 'Fackeln', en: 'Torches', es: 'Antorchas' },
    effect: { de: 'Spenden Licht. Nutzung alle 6 Zuege markieren.', en: 'Provide light. Mark usage every 6 Turns.', es: 'Fuente de luz. Marca un uso cada 6 turnos.' },
  },
  lantern: {
    type: 'light', size: 1, usage: { max: 3 }, cost: 50,
    name: { de: 'Laterne', en: 'Lantern', es: 'Linterna' },
    effect: { de: 'Licht. Muss mit Oel nachgefuellt werden.', en: 'Light. Must be refilled with oil.', es: 'Fuente de luz. Se debe cargar con aceite.' },
  },
  oil: {
    type: 'standard', size: 1, usage: { max: 3 }, cost: 10,
    name: { de: 'Oel, fuer Laterne', en: 'Oil, for lantern', es: 'Aceite, para linterna' },
    effect: { de: '', en: '', es: '' },
  },
  electric_lantern: {
    type: 'light', size: 1, usage: { max: 6 }, cost: 200,
    name: { de: 'Elektrische Laterne', en: 'Electric lantern', es: 'Linterna eléctrica' },
    effect: { de: 'Helles Licht, sechs Nutzungspunkte. Braucht Batterien.', en: 'Bright light, six usage dots. Needs batteries.', es: 'Luz brillante, seis casillas de uso. Necesita baterías.' },
  },
  rations: {
    type: 'ration', size: 1, usage: { max: 3 }, cost: 5,
    name: { de: 'Rationen', en: 'Rations', es: 'Raciones' },
    effect: { de: 'Eine Ration + eine Wache Rast heilt alle TP. Nutzung nach einer Mahlzeit markieren.', en: 'A ration + a Watch of rest heals all HP. Mark usage after a meal.', es: 'Comer una ración y pasar una Guardia descansando restaura todos los PG. Marca un uso después de cada comida.' },
  },

  // --- Ausruestung (SRD "Gear and prices") ---
  bedroll: { type: 'standard', size: 1, cost: 10, name: { de: 'Schlafrolle', en: 'Bedroll', es: 'Saco para dormir' }, effect: { de: '', en: '', es: '' } },
  bellows: { type: 'standard', size: 1, cost: 10, name: { de: 'Blasebalg', en: 'Bellows', es: 'Fuelle' }, effect: { de: '', en: '', es: '' } },
  bottle: { type: 'standard', size: 1, cost: 1, name: { de: 'Flasche', en: 'Bottle', es: 'Botella' }, effect: { de: '', en: '', es: '' } },
  bucket: { type: 'standard', size: 1, cost: 5, name: { de: 'Eimer', en: 'Bucket', es: 'Cubeta' }, effect: { de: '', en: '', es: '' } },
  caltrops: { type: 'standard', size: 1, usage: { max: 3 }, cost: 10, name: { de: 'Krähenfuesse, Beutel', en: 'Bolsa con semillas espinozas' }, effect: { de: '', en: '', es: '' } },
  chalk: { type: 'standard', size: 1, usage: { max: 3 }, cost: 1, name: { de: 'Kreide', en: 'Chalk', es: 'Gis' }, effect: { de: '', en: '', es: '' } },
  chisel: { type: 'standard', size: 1, cost: 5, name: { de: 'Meissel', en: 'Chisel', es: 'Cincel' }, effect: { de: '', en: '', es: '' } },
  cookpots: { type: 'standard', size: 1, cost: 10, name: { de: 'Kochtoepfe', en: 'Cookpots', es: 'Cacerolas' }, effect: { de: '', en: '', es: '' } },
  crowbar: { type: 'standard', size: 1, cost: 10, name: { de: 'Brecheisen', en: 'Crowbar', es: 'Barreta' }, effect: { de: '', en: '', es: '' } },
  drill: { type: 'standard', size: 1, cost: 10, name: { de: 'Handbohrer', en: 'Drill', es: 'Taladro' }, effect: { de: '', en: '', es: '' } },
  glue: { type: 'standard', size: 1, usage: { max: 3 }, cost: 5, name: { de: 'Leim', en: 'Glue', es: 'Pegamento' }, effect: { de: '', en: '' } },
  grease: { type: 'standard', size: 1, usage: { max: 3 }, cost: 5, name: { de: 'Schmierfett', en: 'Grease', es: 'Grasa' }, effect: { de: '', en: '' } },
  hammer: { type: 'standard', size: 1, usage: { max: 3 }, cost: 10, name: { de: 'Hammer', en: 'Hammer', es: 'Martillo' }, effect: { de: '', en: '' } },
  horn: { type: 'standard', size: 1, cost: 10, name: { de: 'Signalhorn', en: 'Horn', es: 'Cuerno' }, effect: { de: '', en: '' } },
  hourglass: { type: 'standard', size: 1, cost: 300, name: { de: 'Sanduhr', en: 'Hourglass', es: 'Reloj de arena' }, effect: { de: '', en: '' } },
  lockpicks: { type: 'standard', size: 1, usage: { max: 3 }, cost: 100, name: { de: 'Dietriche', en: 'Lockpicks', es: 'Ganzúas' }, effect: { de: '', en: '' } },
  metal_file: { type: 'standard', size: 1, usage: { max: 3 }, cost: 5, name: { de: 'Metallfeile', en: 'Metal file', es: 'Lima para metal' }, effect: { de: '', en: '' } },
  mirror: { type: 'standard', size: 1, cost: 200, name: { de: 'Spiegel', en: 'Mirror', es: 'Espejo' }, effect: { de: '', en: '' } },
  instrument: { type: 'standard', size: 1, cost: 200, name: { de: 'Musikinstrument', en: 'Musical instrument', es: 'Instrumento musical' }, effect: { de: '', en: '' } },
  net: { type: 'standard', size: 1, cost: 10, name: { de: 'Netz', en: 'Net', es: 'Red' }, effect: { de: 'Ein Ziel festsetzen.', en: 'Entangle a target.', es: 'Captura a un objetivo.' } },
  padlock: { type: 'standard', size: 1, cost: 20, name: { de: 'Vorhaengeschloss & Schluessel', en: 'Padlock and key', es: 'Candado con llave' }, effect: { de: '', en: '' } },
  perfume: { type: 'standard', size: 1, usage: { max: 3 }, cost: 50, name: { de: 'Parfum', en: 'Perfume', es: 'Perfume' }, effect: { de: '', en: '' } },
  pick: { type: 'standard', size: 1, usage: { max: 3 }, cost: 10, name: { de: 'Spitzhacke', en: 'Pick', es: 'Pico' }, effect: { de: '', en: '' } },
  loaded_dice: { type: 'standard', size: 1, cost: 5, name: { de: 'Gezinkte Wuerfel', en: 'Set of loaded dice', es: 'Set de dados cargados' }, effect: { de: '', en: '' } },
  shovel: { type: 'standard', size: 1, usage: { max: 3 }, cost: 10, name: { de: 'Schaufel', en: 'Shovel', es: 'Pala' }, effect: { de: '', en: '' } },
  tent: { type: 'standard', size: 1, usage: { max: 3 }, cost: 80, name: { de: 'Zelt', en: 'Tent', es: 'Tienda de campaña' }, effect: { de: '', en: '' } },
  waterskin: { type: 'standard', size: 1, usage: { max: 3 }, cost: 5, name: { de: 'Wasserschlauch', en: 'Waterskin', es: 'Cantimplora' }, effect: { de: '', en: '' } },
  whistle: { type: 'standard', size: 1, cost: 5, name: { de: 'Trillerpfeife', en: 'Whistle', es: 'Silbato' }, effect: { de: '', en: '' } },
  pole: { type: 'standard', size: 1, cost: 1, name: { de: 'Holzstange, 15 cm', en: 'Wooden pole, 6"', es: 'Pértiga, 15cm' }, effect: { de: '', en: '' } },
  spikes: { type: 'standard', size: 1, usage: { max: 3 }, cost: 1, name: { de: 'Holzpfloecke', en: 'Wooden spikes', es: 'Estacas de madera' }, effect: { de: '', en: '' } },
  rope: { type: 'standard', size: 1, cost: 20, name: { de: 'Seil', en: 'Rope', es: 'Cuerda' }, effect: { de: '', en: '' } },
  twine: { type: 'standard', size: 1, usage: { max: 3 }, cost: 40, name: { de: 'Bindfaden, Rolle', en: 'Twine, roll', es: 'Obillo de hilo grueso' }, effect: { de: '', en: '' } },
  thread: { type: 'standard', size: 1, usage: { max: 3 }, cost: 20, name: { de: 'Faden, Spule', en: 'Thread, spool', es: 'Bobina de hilo' }, effect: { de: '', en: '' } },
  soap: { type: 'standard', size: 1, usage: { max: 3 }, cost: 10, name: { de: 'Seife', en: 'Soap', es: 'Jabón' }, effect: { de: '', en: '' } },
  incense: { type: 'standard', size: 1, usage: { max: 3 }, cost: 20, name: { de: 'Raeucherstaebchen', en: 'Incense stick', es: 'Vara de incienso' }, effect: { de: '', en: '' } },
  fishhook: { type: 'standard', size: 1, usage: { max: 3 }, cost: 20, name: { de: 'Angelhaken', en: 'Fishing hook', es: 'Anzuelo' }, effect: { de: '', en: '' } },
  lens: { type: 'standard', size: 1, cost: 200, name: { de: 'Linse', en: 'Lens', es: 'Lente' }, effect: { de: '', en: '' } },
  disguise_kit: { type: 'standard', size: 1, usage: { max: 3 }, cost: 50, name: { de: 'Verkleidungsset', en: 'Disguise kit', es: 'Kit de disfraz' }, effect: { de: '', en: '' } },
  pip_purse: { type: 'standard', size: 1, cost: 0, name: { de: 'Pip-Beutel (250)', en: 'Pip purse (250)', es: 'Bolsa de peitas (250)' }, effect: { de: 'Fasst 250 Pips.', en: 'Holds 250 pips.', es: 'Almacena hasta 250 pepitas.'  } },
};

export const CATALOG_KEYS = Object.keys(ITEM_CATALOG);

// Zustaende (SRD): belegen einen Inventarplatz, bis die "clear"-Bedingung erfuellt ist.
export const CONDITION_CATALOG = {
  exhausted: {
    name: { de: 'Erschoepft', en: 'Exhausted', es: 'Cansado' },
    effect: { de: 'Belegt einen Inventarplatz. Fuer Maeuse ohne Rast oder als Folge koerperlicher Anstrengung.', en: 'Takes an inventory slot. For mice who go without rest, or as a consequence of physical exertion.', es: 'Usa un espacio en el inventario. Para ratones que no descansaron o como consecuencia del agotamiento físico.' },
    clear: { de: 'Nach einer langen Rast', en: 'After a long rest', es: 'Con un descanso largo' },
  },
  frightened: {
    name: { de: 'Veraengstigt', en: 'Frightened', es: 'Asustado' },
    effect: { de: 'WIL-Rettungswurf noetig, um sich der Quelle der Angst zu naehern.', en: 'WIL save to approach the source of fear.', es: 'Salvación de VOL para acercarse a la fuente del miedo.' },
    clear: { de: 'Nach einer kurzen Rast', en: 'After a short rest', es: 'Tras un descanso corto' },
  },
  hungry: {
    name: { de: 'Hungrig', en: 'Hungry', es: 'Hambriento' },
    effect: { de: 'Belegt einen Platz. Entsteht, wenn die Maus einen Tag lang keine Ration isst.', en: 'Takes a slot. Gained if the mouse goes a day without eating a ration.', es: 'Ocupa un espacio. Cuando un ratón pasa un día completo sin comer.' },
    clear: { de: 'Nach einer Mahlzeit', en: 'After a meal', es: 'Comiendo una ración' },
  },
  injured: {
    name: { de: 'Verletzt', en: 'Injured', es: 'Herido' },
    effect: { de: 'Nachteil auf STR- und DEX-Rettungswuerfe. Bei kritischem Schaden oder schwerer Verletzung.', en: 'Disadvantage on STR & DEX saves. From critical damage or serious injury.', es: 'Desventaja en tiradas de FUE y DES. Por daño crítico o herida física grave.' },
    clear: { de: 'Nach einer vollen Rast', en: 'After a full rest', es: 'Después de un descanso completo' },
  },
  drained: {
    name: { de: 'Ausgelaugt', en: 'Drained', es: 'Agotado' },
    effect: { de: 'Nachteil auf WIL-Rettungswuerfe. Folge eines misslungenen Zaubers.', en: 'Disadvantage on WIL saves. From a failed spellcast.', es: 'Desventaja en tiradas de VOL. Por haber fallado un hechizo.' },
    clear: { de: 'Nach einer vollen Rast', en: 'After a full rest', es: 'Después de un descanso completo' },
  },
  encumbered: {
    name: { de: 'Ueberladen', en: 'Encumbered', es: 'Sobrecargado' },
    effect: { de: 'Nachteil auf ALLE Rettungswuerfe, kein Rennen. Wenn mehr getragen wird als Plaetze frei sind.', en: 'Disadvantage on ALL saves, cannot run. When carrying more than your slots allow.', es: 'Desventaja en TODAS las tiradas, no puedes correr. Como resultado de llevar mas objetos de los que caben en tu inventario.' },
    clear: { de: 'Sobald genug Platz frei ist', en: 'Once enough slots are free', es: 'Una vez que has liberado espacio en el inventario' },
  },
};

// Zauber (SRD "List of spells", 2W8). Effekt/Aufladung zusammengefasst.
export const SPELL_CATALOG = {
  fireball: { name: { de: 'Feuerball', en: 'Fireball', es: 'Bola de fuego' }, effect: { de: 'Feuerball bis 24". [SUMME]+[WUERFEL] Schaden an allen im Umkreis von 6".', en: 'Fireball up to 24". [SUM]+[DICE] damage to all within 6".', es: 'Lanza una bola explosiva hasta 60 cm. Inflige [SUMA] + [DADOS] de daño a todas las criaturas en 15 cm de radio.' } },
  heal: { name: { de: 'Heilung', en: 'Heal', es: 'Curar' }, effect: { de: 'Heilt [SUMME] STR-Schaden und entfernt "Verletzt".', en: 'Heal [SUM] STR damage and remove the Injured Condition.', es: 'Cura [SUMA] puntos de FUE y elimina el estado Herido de una criatura.' } },
  magic_missile: { name: { de: 'Magisches Geschoss', en: 'Magic Missile', es: 'Proyectil mágico' }, effect: { de: '[SUMME]+[WUERFEL] Schaden an einer sichtbaren Kreatur.', en: '[SUM]+[DICE] damage to a creature within sight.', es: 'Inflige [SUMA] + [DADOS] de daño a una criatura a la vista.' } },
  fear: { name: { de: 'Furcht', en: 'Fear', es: 'Miedo' }, effect: { de: 'Gibt [WUERFEL] Kreaturen "Veraengstigt".', en: 'Give the Frightened Condition to [DICE] creatures.', es: 'Impone el Estado Asustado a [DADOS] criaturas.' } },
  darkness: { name: { de: 'Finsternis', en: 'Darkness', es: 'Oscuridad' }, effect: { de: 'Kugel reiner Dunkelheit ([SUMME] x 2" Durchmesser) fuer [WUERFEL] Zuege.', en: '[SUM] x 2" sphere of pure darkness for [DICE] Turns.', es: 'Crea una esfera de oscuridad pura de [SUMA x5] cm de diámetro durante [DADOS] turnos.' } },
  restore: { name: { de: 'Wiederherstellen', en: 'Restore', es: 'Restaurar' }, effect: { de: 'Entfernt "Erschoepft" oder "Veraengstigt" von [WUERFEL]+1 Kreaturen.', en: 'Remove Exhausted or Frightened from [DICE]+1 creatures.', es: 'Despeja el Estado Asustado o Cansado de [DADOS +1] criaturas.' } },
  be_understood: { name: { de: 'Verstanden werden', en: 'Be Understood', es: 'Comprensión' }, effect: { de: 'Macht dich [WUERFEL] Kreaturen einer anderen Art fuer [WUERFEL] Zuege verstaendlich.', en: 'Make your meaning clear to [DICE] creatures of another species for [DICE] Turns.', es: 'Hace que [DADOS] criaturas de otra especie entiendan tus palabras durante [DADOS] turnos.' } },
  ghost_beetle: { name: { de: 'Geisterkaefer', en: 'Ghost Beetle', es: 'Escarabajo fantasma' }, effect: { de: 'Illusorischer Kaefer, traegt 6 Inventarplaetze, fuer [WUERFEL] x 6 Zuege.', en: 'Illusory beetle carrying 6 inventory slots for [DICE] x 6 Turns.', es: 'Crea un escarabajo ilusorio que puede cargar 6 espacios de inventario durante [DADOS x6] turnos.' } },
  light: { name: { de: 'Licht', en: 'Light', es: 'Luz cegadora' }, effect: { de: '[WUERFEL] Kreaturen: WIL-Rettungswurf oder betaeubt. Oder: Fackellicht fuer [SUMME] Zuege.', en: '[DICE] creatures WIL save or stunned. Or: torch-bright light for [SUM] Turns.', es: 'Obliga a [DADOS] criaturas a pasar una salvación de VOL o quedar aturdidas. Además, puedes crear una luz que brilla como una antorcha durante [SUMA] turnos.' } },
  invisible_ring: { name: { de: 'Unsichtbarer Ring', en: 'Invisible Ring', es: 'Anillo invisible' }, effect: { de: 'Unsichtbarer, unbeweglicher Kraftring ([WUERFEL] x 6") fuer [WUERFEL] Zuege.', en: 'Invisible, immovable ring of force ([DICE] x 6") for [DICE] Turns.', es: 'Crea un círculo de fuerza de [DADOS x15] cm. Es invisible e inamovible. Dura [DADOS] turnos.' } },
  knock: { name: { de: 'Oeffnen', en: 'Knock', es: 'Apertura' }, effect: { de: 'Oeffnet Tuer/Behaelter wie ein Rettungswurf mit STR 10 + [WUERFEL] x 4.', en: 'Open a door/container as a Save with STR 10 + [DICE] x 4.', es: 'Éxito automático en una salvación de FUE para abrir puertas u objetos a una distancia de [DADOS x15] cm.' } },
  grease: { name: { de: 'Schmiere', en: 'Grease', en: 'Grasa' }, effect: { de: '[WUERFEL] x 6" Flaeche mit rutschigem, brennbarem Fett. DEX-Rettungswurf oder hinfallen.', en: '[DICE] x 6" area of slippery, flammable grease. DEX save or fall prone.', es: 'Cubre [DADOS x15] cm de diámetro con grasa resbaladiza e inflamable. Obliga a las criaturas en el área a una salvación de DES o quedar tumbadas.' } },
  grow: { name: { de: 'Wachsen', en: 'Grow', es: 'Crecimiento' }, effect: { de: 'Vergroessert eine Kreatur auf das [WUERFEL]+1-fache fuer 1 Zug.', en: 'Grow a creature to [DICE]+1 times its size for 1 Turn.', es: 'Hace crecer a una criatura hasta [DADOS +1] veces su tamaño original durante 1 turno.' } },
  invisibility: { name: { de: 'Unsichtbarkeit', en: 'Invisibility', es: 'Invisibilidad' }, effect: { de: 'Kreatur unsichtbar fuer [WUERFEL] Zuege. Bewegung verkuerzt um 1 Zug.', en: 'Creature invisible for [DICE] Turns. Movement reduces duration by 1 Turn.', es: 'Hace a una criatura invisible durante [DADOS] turnos. Si se mueve, reduce la duración en 1 turno.' } },
  catnip: { name: { de: 'Katzenminze', en: 'Catnip', es: 'Catnip' }, effect: { de: 'Macht einen Gegenstand fuer [WUERFEL] Zuege zum unwiderstehlichen Katzen-Koeder.', en: 'Turn an object into an irresistible cat lure for [DICE] Turns.', es: 'Convierte un objeto en un premio irresistible para los gatos. Dura [DADOS] turnos.' } },
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
    effect: { de: '', en: '', es: '' },
  };
  const usage = overrides.usage === null ? null : overrides.usage ?? spec.usage ?? null;

  return {
    itemId: newId('i'),
    key: spec.key ?? null,
    type: overrides.type || spec.type,
    size: overrides.size || spec.size || 1,
    name: overrides.name || spec.name,
    effect: overrides.effect || spec.effect || { de: '', en: '', es: '' },
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
    name: spec?.name || (typeof overrides.name === 'string' ? { de: overrides.name, en: overrides.name, es: overrides.name } : overrides.name) || { de: 'Zustand', en: 'Condition', es: 'Condición' },
    effect: spec?.effect || overrides.effect || { de: '', en: '', es: '' },
    clear: spec?.clear || null,
    damage: null,
    defense: null,
    usage: null,
    cleared: false,
  };
}
