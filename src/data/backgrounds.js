// Hintergrund-Tabelle aus dem Mausritter-SRD 2.3.1 (CC BY 4.0).
// Gekreuzt aus dem TP-Wurf (1W6, Zeile) und dem Pips-Wurf (1W6, Spalte).
//
// items: Eintraege sind entweder { k: '<Katalogschluessel>' } (aus data/items.js)
// oder { t: { de, en } } fuer Dinge ohne eigenen Katalogeintrag (Zauber, Mietlinge, Kuriosa).
// Deutsche Hintergrund-Namen sind eigene Uebersetzungen (PLAN.md §15.7).

const B = (de, en, es, ...items) => ({ name: { de, en, es }, items });
const K = (k) => ({ k });
const T = (de, en, es) => ({ t: { de, en, es } });

// TABLE[hp][pips]
export const BACKGROUND_TABLE = {
  1: {
    1: B('Versuchstier', 'Test subject', T('Zauber: Magisches Geschoss', 'Spell: Magic missile', 'Hechizo: Proyectil mágico'), K('heavy_armour')),
    2: B('Kuechensammler', 'Kitchen forager', 'forrajeador', K('light_armour'), K('cookpots')),
    3: B('Kaefigbewohner', 'Cage dweller','Habitante de las jaulas', T('Zauber: Verstanden werden', 'Spell: Be understood', 'Hechizo: Comprensión'), T('Flasche Milch', 'Bottle of milk')),
    4: B('Heckenhexe', 'Hedge witch', 'Curandero del arbusto', T('Zauber: Genesung', 'Spell: Heal', 'Hechizo: Curar'), K('incense')),
    5: B('Lederhandwerker', 'Leatherworker','Curtidor', K('light_armour'), T('Schere', 'Shears', 'Tijeras')),
    6: B('Straßenschlaeger', 'Street tough','Ratón callejero', K('w_light'), T('Flasche Kaffee', 'Flask of coffee', 'Petaca de café')),
  },
  2: {
    1: B('Bettelpriester', 'Mendicant priest','Sacerdote mendicante', T('Zauber: Wiederherstellen', 'Spell: Restore', 'Hechizo: Restaurar'), T('Heiliges Symbol', 'Holy symbol', 'Símbolo sagrado')),
    2: B('Kaeferhirte', 'Beetleherd','Pastor de escarabajos', T('Mietling: Treuer Kaefer', 'Hireling: Loyal beetle', 'Ayudante: Escarabajo fiel'), K('pole')),
    3: B('Bierbrauer', 'Ale brewer','Cervecero', T('Mietling: Betrunkener Fackeltraeger', 'Hireling: Drunken torchbearer', 'Ayudante: Portaantorchas borracho'), T('Faesschen Bier', 'Small barrel of ale', 'Barril de cerveza pequeño')),
    4: B('Fischermaus', 'Fishermouse','Pescador', K('net'), K('w_light')),
    5: B('Schmied', 'Blacksmith','Herrero', K('w_medium'), K('metal_file')),
    6: B('Drahtzieher', 'Wireworker','Cableador', T('Draht, Spule', 'Wire, spool', 'Rollo de calbe'), K('electric_lantern')),
  },
  3: {
    1: B('Holzfaeller', 'Woodcutter','Leñador', K('w_medium'), K('twine')),
    2: B('Fledermauskultist', 'Bat cultist','Sectario del Murciélago', T('Zauber: Finsternis', 'Spell: Darkness', 'Hechizo: Oscuridad'), T('Beutel Fledermauszaehne', 'Bag of bat teeth', 'Bolsa con dientes de murciélago')),
    3: B('Zinnbergmann', 'Tin miner','Minero de latón', K('w_medium'), K('lantern')),
    4: B('Muellsammler', 'Trash collector','Recolector de basura', K('w_heavy'), K('mirror')),
    5: B('Wandlaeufer', 'Wall rover','Trepamuros', K('fishhook'), K('thread')),
    6: B('Haendler', 'Merchant','Mercader', T('Mietling: Packratte', 'Hireling: Pack rat', 'Ayudante: Rata montera'), T('20-Pip-Schuldschein eines Adligen', '20p IOU from a noblemouse', 'Pagaré de un ratón noble (20 p.)')),
  },
  4: {
    1: B('Floßbesatzung', 'Raft crew','Balsero', K('w_medium'), K('spikes')),
    2: B('Wurmbaendiger', 'Worm wrangler','Domador de gusanos', K('pole'), K('soap')),
    3: B('Spatzenreiter', 'Sparrow rider','Jinete de gorrión', K('fishhook'), T('Schutzbrille', 'Goggles', 'Gafas protectoras')),
    4: B('Kanalfuehrer', 'Sewer guide','Guía de alcantarillas', K('metal_file'), K('thread')),
    5: B('Gefaengniswache', 'Prison guard','Guardia de prisión', T('Kette, 15 cm', 'Chain, 6"', 'Cadena, 15 cm'), K('w_heavy')),
    6: B('Pilzbauer', 'Fungus farmer','Jardinero de hongos', T('Getrockneter Pilz (wie Rationen)', 'Dried mushroom (as rations)', 'Hongos secos (como ración)'), T('Sporenmaske', 'Spore mask', 'Máscara antiesporas')),
  },
  5: {
    1: B('Dammbauer', 'Dam builder','Constructor de presas', K('shovel'), K('spikes')),
    2: B('Kartograf', 'Cartographer','Cartógrafo', T('Feder & Tinte', 'Quill & ink', 'Pluma y tintero'), T('Kompass', 'Compass')),
    3: B('Fallendieb', 'Trap thief','Ladrón trampero', T('Kaeselaib', 'Block of cheese', 'cuña de queso'), K('glue')),
    4: B('Landstreicher', 'Vagabond','Vagabundo', K('tent'), T('Zweifelhafte Schatzkarte', 'Treasure map, dubious', 'Mapa del tesoro, no fiable')),
    5: B('Getreidebauer', 'Grain farmer','Agricultor de grano', K('w_heavy'), K('whistle')),
    6: B('Botenlaeufer', 'Message runner','Mensajero', K('bedroll'), T('Versiegelte Dokumente', 'Documents, sealed', 'Documentss, sellados')),
  },
  6: {
    1: B('Troubadour', 'Troubadour','Trovador', K('instrument'), K('disguise_kit')),
    2: B('Gluecksspieler', 'Gambler','Tahúr', K('loaded_dice'), K('mirror')),
    3: B('Saftzapfer', 'Sap tapper','Extractor de savia', K('bucket'), K('spikes')),
    4: B('Imker', 'Bee keeper','Apicultor', T('Glas Honig', 'Jar of honey', 'Frasco de miel'), K('net')),
    5: B('Bibliothekar', 'Librarian','Bibliotecario', T('Fetzen eines obskuren Buches', 'Scrap of obscure book', 'Fragmento de libro oscuro'), T('Feder & Tinte', 'Quill & ink', 'Pluma y tintero')),
    6: B('Verarmter Adelsmaus', 'Pauper noblemouse','Noble empobrecido', T('Filzhut', 'Felt hat', 'Sombrero de fieltro'), K('perfume')),
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
