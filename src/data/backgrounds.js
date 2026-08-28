// Hintergrund-Tabelle aus dem Mausritter-SRD 2.3.1 (CC BY 4.0).
// Gekreuzt aus dem TP-Wurf (1W6, Zeile) und dem Pips-Wurf (1W6, Spalte).
//
// items: Eintraege sind entweder { k: '<Katalogschluessel>' } (aus data/items.js)
// oder { t: { de, en } } fuer Dinge ohne eigenen Katalogeintrag (Zauber, Mietlinge, Kuriosa).
// Deutsche Hintergrund-Namen sind eigene Uebersetzungen (PLAN.md §15.7).

const B = (de, en, ...items) => ({ name: { de, en }, items });
const K = (k) => ({ k });
const T = (de, en) => ({ t: { de, en } });

// TABLE[hp][pips]
export const BACKGROUND_TABLE = {
  1: {
    1: B('Versuchstier', 'Test subject', T('Zauber: Magisches Geschoss', 'Spell: Magic missile'), K('heavy_armour')),
    2: B('Kuechensammler', 'Kitchen forager', K('light_armour'), K('cookpots')),
    3: B('Kaefigbewohner', 'Cage dweller', T('Zauber: Verstanden werden', 'Spell: Be understood'), T('Flasche Milch', 'Bottle of milk')),
    4: B('Heckenhexe', 'Hedge witch', T('Zauber: Heilung', 'Spell: Heal'), K('incense')),
    5: B('Lederhandwerker', 'Leatherworker', K('light_armour'), T('Schere', 'Shears')),
    6: B('Straßenschlaeger', 'Street tough', K('w_light'), T('Flasche Kaffee', 'Flask of coffee')),
  },
  2: {
    1: B('Bettelpriester', 'Mendicant priest', T('Zauber: Wiederherstellen', 'Spell: Restore'), T('Heiliges Symbol', 'Holy symbol')),
    2: B('Kaeferhirte', 'Beetleherd', T('Mietling: Treuer Kaefer', 'Hireling: Loyal beetle'), K('pole')),
    3: B('Bierbrauer', 'Ale brewer', T('Mietling: Betrunkener Fackeltraeger', 'Hireling: Drunken torchbearer'), T('Faesschen Bier', 'Small barrel of ale')),
    4: B('Fischermaus', 'Fishermouse', K('net'), K('w_light')),
    5: B('Schmied', 'Blacksmith', K('w_medium'), K('metal_file')),
    6: B('Drahtzieher', 'Wireworker', T('Draht, Spule', 'Wire, spool'), K('electric_lantern')),
  },
  3: {
    1: B('Holzfaeller', 'Woodcutter', K('w_medium'), K('twine')),
    2: B('Fledermauskultist', 'Bat cultist', T('Zauber: Finsternis', 'Spell: Darkness'), T('Beutel Fledermauszaehne', 'Bag of bat teeth')),
    3: B('Zinnbergmann', 'Tin miner', K('w_medium'), K('lantern')),
    4: B('Muellsammler', 'Trash collector', K('w_heavy'), K('mirror')),
    5: B('Wandlaeufer', 'Wall rover', K('fishhook'), K('thread')),
    6: B('Haendler', 'Merchant', T('Mietling: Packratte', 'Hireling: Pack rat'), T('20-Pip-Schuldschein eines Adligen', '20p IOU from a noblemouse')),
  },
  4: {
    1: B('Floßbesatzung', 'Raft crew', K('w_medium'), K('spikes')),
    2: B('Wurmbaendiger', 'Worm wrangler', K('pole'), K('soap')),
    3: B('Spatzenreiter', 'Sparrow rider', K('fishhook'), T('Schutzbrille', 'Goggles')),
    4: B('Kanalfuehrer', 'Sewer guide', K('metal_file'), K('thread')),
    5: B('Gefaengniswache', 'Prison guard', T('Kette, 15 cm', 'Chain, 6"'), K('w_heavy')),
    6: B('Pilzbauer', 'Fungus farmer', T('Getrockneter Pilz (wie Rationen)', 'Dried mushroom (as rations)'), T('Sporenmaske', 'Spore mask')),
  },
  5: {
    1: B('Dammbauer', 'Dam builder', K('shovel'), K('spikes')),
    2: B('Kartograf', 'Cartographer', T('Feder & Tinte', 'Quill & ink'), T('Kompass', 'Compass')),
    3: B('Fallendieb', 'Trap thief', T('Kaeselaib', 'Block of cheese'), K('glue')),
    4: B('Landstreicher', 'Vagabond', K('tent'), T('Zweifelhafte Schatzkarte', 'Treasure map, dubious')),
    5: B('Getreidebauer', 'Grain farmer', K('w_heavy'), K('whistle')),
    6: B('Botenlaeufer', 'Message runner', K('bedroll'), T('Versiegelte Dokumente', 'Documents, sealed')),
  },
  6: {
    1: B('Troubadour', 'Troubadour', K('instrument'), K('disguise_kit')),
    2: B('Gluecksspieler', 'Gambler', K('loaded_dice'), K('mirror')),
    3: B('Saftzapfer', 'Sap tapper', K('bucket'), K('spikes')),
    4: B('Imker', 'Bee keeper', T('Glas Honig', 'Jar of honey'), K('net')),
    5: B('Bibliothekar', 'Librarian', T('Fetzen eines obskuren Buches', 'Scrap of obscure book'), T('Feder & Tinte', 'Quill & ink')),
    6: B('Verarmter Adelsmaus', 'Pauper noblemouse', T('Filzhut', 'Felt hat'), K('perfume')),
  },
};

export function backgroundAt(hp, pips) {
  const row = BACKGROUND_TABLE[Math.min(6, Math.max(1, hp))];
  return row[Math.min(6, Math.max(1, pips))];
}

export function allBackgrounds() {
  const out = [];
  for (let hp = 1; hp <= 6; hp += 1) {
    for (let pips = 1; pips <= 6; pips += 1) {
      out.push({ hp, pips, ...BACKGROUND_TABLE[hp][pips] });
    }
  }
  return out;
}
