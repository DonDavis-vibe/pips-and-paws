// Hintergrund-Tabelle aus dem Mausritter-SRD 2.3.1 (CC BY 4.0).
// Gekreuzt aus dem TP-Wurf (1W6, Zeile) und dem Pips-Wurf (1W6, Spalte).
//
// items: jeder Eintrag wird beim Erschaffen zu genau einem Ding (Regeln S. 7/8:
// fast alles belegt einen Inventarplatz):
//   { k }            Katalog-Gegenstand (data/items.js)
//   { k, as }        Katalog-Gegenstand mit eigenem Namen (z. B. "Dolch" als
//                    Leichte Waffe — der Katalogname bleibt darunter sichtbar)
//   { spell }        Zauberkarte aus SPELL_CATALOG
//   { hire, kind }   Miethelfer (Miethelfer-Panel, kein Inventarplatz)
//   { t }            eigener Gegenstand ohne Katalogeintrag (1 Platz)
// Deutsche Hintergrund-Namen sind eigene Uebersetzungen (PLAN.md §15.7).

const B = (de, en, es, ...items) => ({ name: { de, en, es }, items });
const K = (k) => ({ k });
const N = (k, de, en, es) => ({ k, as: { de, en, es } });
const S = (spell) => ({ spell });
const H = (kind, de, en, es) => ({ hire: { de, en, es }, kind });
const T = (de, en, es) => ({ t: { de, en, es } });

// TABLE[hp][pips]
export const BACKGROUND_TABLE = {
  1: {
    1: B('Versuchstier', 'Test subject', 'Ratón de laboratorio', S('magic_missile'), N('heavy_armour', 'Bleimantel', 'Lead coat', 'Abrigo de plomo')),
    2: B('Küchensammler', 'Kitchen forager', 'forrajeador', N('light_armour', 'Schild & Wams', 'Shield & jerkin', 'Escudo y jubón'), K('cookpots')),
    3: B('Käfigbewohner', 'Cage dweller','Habitante de las jaulas', S('be_understood'), T('Flasche Milch', 'Bottle of milk')),
    4: B('Heckenhexe', 'Hedge witch', 'Curandero del arbusto', S('heal'), K('incense')),
    5: B('Lederhandwerker', 'Leatherworker','Curtidor', N('light_armour', 'Schild & Wams', 'Shield & jerkin', 'Escudo y jubón'), T('Schere', 'Shears', 'Tijeras')),
    6: B('Straßenschläger', 'Street tough','Ratón callejero', N('w_light', 'Dolch', 'Dagger', 'Daga'), T('Flasche Kaffee', 'Flask of coffee', 'Petaca de café')),
  },
  2: {
    1: B('Bettelpriester', 'Mendicant priest','Sacerdote mendicante', S('restore'), T('Heiliges Symbol', 'Holy symbol', 'Símbolo sagrado')),
    2: B('Käferhirte', 'Beetleherd','Pastor de escarabajos', H('', 'Treuer Käfer', 'Loyal beetle', 'Escarabajo fiel'), K('pole')),
    3: B('Bierbrauer', 'Ale brewer','Cervecero', H('torchbearer', 'Betrunkener Fackelträger', 'Drunken torchbearer', 'Portaantorchas borracho'), T('Fässchen Bier', 'Small barrel of ale', 'Barril de cerveza pequeño')),
    4: B('Fischermaus', 'Fishermouse','Pescador', K('net'), N('w_light', 'Nadel', 'Needle', 'Aguja')),
    5: B('Schmied', 'Blacksmith','Herrero', N('w_medium', 'Hammer', 'Hammer', 'Martillo'), K('metal_file')),
    6: B('Drahtzieher', 'Wireworker','Cableador', T('Draht, Spule', 'Wire, spool', 'Rollo de cable'), K('electric_lantern')),
  },
  3: {
    1: B('Holzfäller', 'Woodcutter','Leñador', N('w_medium', 'Axt', 'Axe', 'Hacha'), K('twine')),
    2: B('Fledermauskultist', 'Bat cultist','Sectario del Murciélago', S('darkness'), T('Beutel Fledermauszähne', 'Bag of bat teeth', 'Bolsa con dientes de murciélago')),
    3: B('Zinnbergmann', 'Tin miner','Minero de latón', N('w_medium', 'Spitzhacke', 'Pickaxe', 'Pico'), K('lantern')),
    4: B('Müllsammler', 'Trash collector','Recolector de basura', N('w_heavy', 'Müllhaken', 'Trashhook', 'Anzuelanza'), K('mirror')),
    5: B('Wandläufer', 'Wall rover','Trepamuros', K('fishhook'), K('thread')),
    6: B('Händler', 'Merchant','Mercader', H('labourer', 'Packratte', 'Pack rat', 'Rata montera'), T('20-Pip-Schuldschein eines Adligen', '20p IOU from a noblemouse', 'Pagaré de un ratón noble (20 p.)')),
  },
  4: {
    1: B('Floßbesatzung', 'Raft crew','Balsero', N('w_medium', 'Hammer', 'Hammer', 'Martillo'), K('spikes')),
    2: B('Wurmbändiger', 'Worm wrangler','Domador de gusanos', K('pole'), K('soap')),
    3: B('Spatzenreiter', 'Sparrow rider','Jinete de gorrión', K('fishhook'), T('Schutzbrille', 'Goggles', 'Gafas protectoras')),
    4: B('Kanalführer', 'Sewer guide','Guía de alcantarillas', K('metal_file'), K('thread')),
    5: B('Gefängniswache', 'Prison guard','Guardia de prisión', T('Kette, 15 cm', 'Chain, 6"', 'Cadena, 15 cm'), N('w_heavy', 'Speer', 'Spear', 'Lanza')),
    6: B('Pilzbauer', 'Fungus farmer','Jardinero de hongos', N('rations', 'Getrockneter Pilz', 'Dried mushroom', 'Hongos secos'), T('Sporenmaske', 'Spore mask', 'Máscara antiesporas')),
  },
  5: {
    1: B('Dammbauer', 'Dam builder','Constructor de presas', K('shovel'), K('spikes')),
    2: B('Kartograf', 'Cartographer','Cartógrafo', T('Feder & Tinte', 'Quill & ink', 'Pluma y tintero'), T('Kompass', 'Compass')),
    3: B('Fallendieb', 'Trap thief','Ladrón trampero', T('Käselaib', 'Block of cheese', 'cuña de queso'), K('glue')),
    4: B('Landstreicher', 'Vagabond','Vagabundo', K('tent'), T('Zweifelhafte Schatzkarte', 'Treasure map, dubious', 'Mapa del tesoro, no fiable')),
    5: B('Getreidebauer', 'Grain farmer','Agricultor de grano', N('w_heavy', 'Speer', 'Spear', 'Lanza'), K('whistle')),
    6: B('Botenläufer', 'Message runner','Mensajero', K('bedroll'), T('Versiegelte Dokumente', 'Documents, sealed', 'Documentos, sellados')),
  },
  6: {
    1: B('Troubadour', 'Troubadour','Trovador', K('instrument'), K('disguise_kit')),
    2: B('Glücksspieler', 'Gambler','Tahúr', K('loaded_dice'), K('mirror')),
    3: B('Saftzapfer', 'Sap tapper','Extractor de savia', K('bucket'), K('spikes')),
    4: B('Imker', 'Bee keeper','Apicultor', T('Glas Honig', 'Jar of honey', 'Frasco de miel'), K('net')),
    5: B('Bibliothekar', 'Librarian','Bibliotecario', T('Fetzen eines obskuren Buches', 'Scrap of obscure book', 'Fragmento de libro oscuro'), T('Feder & Tinte', 'Quill & ink', 'Pluma y tintero')),
    6: B('Verarmte Adelsmaus', 'Pauper noblemouse','Noble empobrecido', T('Filzhut', 'Felt hat', 'Sombrero de fieltro'), K('perfume')),
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
