// Abenteuerort-Werkzeugkasten aus dem Mausritter-SRD 2.3.1 (CC BY 4.0, siehe
// Footer): Thema eines Ortes und zufaelliges Bestuecken von Raeumen. Genutzt von
// rules/generators.js. Die deutschen Texte sind eigene Uebersetzungen.
// Jede Tabelle ist eine Liste in SRD-Reihenfolge; Eintrag = [englisch, deutsch].

const rows = (list) => list.map(([en, de]) => ({ en, de }));

// d20
export const CONSTRUCTION = rows([
  ['Ancient bat cult temple', 'Uralter Tempel eines Fledermauskults'],
  ['Long-abandoned watchtower', 'Lange verlassener Wachturm'],
  ['Noblemouse’s country manor', 'Landsitz einer Adelsmaus'],
  ['Hidden winter storehouse', 'Verstecktes Winterlager'],
  ['Burial site of ancient mice', 'Grabstätte uralter Mäuse'],
  ['Warren dug by rabbits or foxes', 'Von Kaninchen oder Füchsen gegrabener Bau'],
  ['Human house or other building', 'Menschenhaus oder anderes Gebäude'],
  ['Sewer or drainage pipes', 'Kanalisation oder Abflussrohre'],
  ['Claustrophobic ant-dug tunnels', 'Beklemmend enge, von Ameisen gegrabene Tunnel'],
  ['Massive tree, carved out by mice', 'Riesiger Baum, von Mäusen ausgehöhlt'],
  ['Wizard’s tower', 'Turm eines Zauberers'],
  ['Settlement’s grain mill', 'Getreidemühle einer Siedlung'],
  ['Rat King’s nest', 'Nest des Rattenkönigs'],
  ['Skeleton of a great beast', 'Skelett eines großen Tiers'],
  ['Witch’s academy', 'Akademie einer Hexe'],
  ['Gatehouse to faerie realm', 'Torhaus zum Feenreich'],
  ['Deep mine', 'Tiefe Mine'],
  ['Bandit’s hideout', 'Banditenversteck'],
  ['Natural cave', 'Natürliche Höhle'],
  ['Mouse settlement', 'Mäusesiedlung'],
]);

// d12
export const RUINATION = rows([
  ['Flooding', 'Überflutung'],
  ['Magical mishap', 'Magisches Missgeschick'],
  ['Age and rot', 'Alter und Fäulnis'],
  ['Human destruction', 'Zerstörung durch Menschen'],
  ['Overrun by mold', 'Von Schimmel überwuchert'],
  ['Shifted between realms', 'Zwischen die Reiche verschoben'],
  ['Attacked by great beast', 'Von einem großen Tier angegriffen'],
  ['Disastrous storm', 'Verheerender Sturm'],
  ['Haunting spirits', 'Spukende Geister'],
  ['Mysterious abandonment', 'Rätselhaft verlassen'],
  ['Internal warfare', 'Innerer Krieg'],
  ['Disease', 'Seuche'],
]);

// d10
export const INHABITANTS = rows([
  ['Mice, driven mad or desperate', 'Mäuse, wahnsinnig oder verzweifelt'],
  ['Mice, magically altered', 'Mäuse, magisch verändert'],
  ['Rat bandits', 'Rattenbanditen'],
  ['Creatures from a distant land', 'Kreaturen aus einem fernen Land'],
  ['Original residents, strangely twisted', 'Die ursprünglichen Bewohner, seltsam verdreht'],
  ['Ghostly spirits', 'Geisterhafte Seelen'],
  ['Faerie advance guard', 'Vorhut der Feen'],
  ['Foul-tempered snake', 'Schlecht gelaunte Schlange'],
  ['Infestation of insects', 'Insektenplage'],
  ['Cat lord and their servants', 'Katzenfürst und seine Diener'],
]);

// d8
export const SEEKING = rows([
  ['A safe place to live or hide', 'Ein sicherer Ort zum Leben oder Verstecken'],
  ['Cache of fine food', 'Ein Vorrat feiner Speisen'],
  ['Lost family or friend', 'Verlorene Familie oder Freunde'],
  ['Ancient, valuable artworks', 'Uralte, wertvolle Kunstwerke'],
  ['The last scraps in a picked-over ruin', 'Die letzten Reste in einer geplünderten Ruine'],
  ['Rare alchemical mushrooms', 'Seltene alchemistische Pilze'],
  ['Strange and powerful spell', 'Ein seltsamer, mächtiger Zauber'],
  ['Vast horde of pips', 'Ein riesiger Hort an Pips'],
]);

// d6
export const SECRET = rows([
  ['Monolith humming with arcane energy', 'Monolith, der vor arkaner Energie summt'],
  ['Preserved precursor beast', 'Konserviertes Tier aus uralter Zeit'],
  ['Signs of human experimentation', 'Spuren menschlicher Experimente'],
  ['Forgotten grave of an ancient queen', 'Vergessenes Grab einer uralten Königin'],
  ['Path into the veins of the earth', 'Pfad in die Adern der Erde'],
  ['Portal to faerie realm', 'Portal ins Feenreich'],
]);

// d6: Raumtyp (1-2 leer)
export const ROOM_TYPES = [
  { min: 1, max: 2, key: 'empty', en: 'Empty', de: 'Leer' },
  { min: 3, max: 3, key: 'obstacle', en: 'Obstacle', de: 'Hindernis' },
  { min: 4, max: 4, key: 'trap', en: 'Trap', de: 'Falle' },
  { min: 5, max: 5, key: 'puzzle', en: 'Puzzle', de: 'Rätsel' },
  { min: 6, max: 6, key: 'lair', en: 'Lair', de: 'Lager' },
];

// SRD-Tabellen "Room has a creature?" / "Room has treasure?": ein Raumtyp hat die
// Kreatur bzw. den Schatz bei einem W6-Wurf <= Wert (die X-Spalten der Tabellen).
export const CREATURE_ON = { empty: 3, obstacle: 2, trap: 1, puzzle: 1, lair: 5 };
export const TREASURE_ON = { empty: 1, obstacle: 1, trap: 2, puzzle: 5, lair: 4 };

// d6
export const LAIRS = rows([
  ['Temporary encampment', 'Provisorisches Lager'],
  ['Recently taken from another creature', 'Kürzlich einer anderen Kreatur abgenommen'],
  ['Built by mice to hold the creature', 'Von Mäusen gebaut, um die Kreatur festzuhalten'],
  ['Protecting young', 'Schützt den Nachwuchs'],
  ['Permanent home, newly settled', 'Dauerhaftes Zuhause, frisch bezogen'],
  ['Permanent home, comfortably appointed', 'Dauerhaftes Zuhause, gemütlich eingerichtet'],
]);

// d20
export const EMPTY_ROOMS = rows([
  ['Abandoned insect nest', 'Verlassenes Insektennest'],
  ['Cluster of mushrooms', 'Pilzgruppe'],
  ['Collapsed wall or ceiling', 'Eingestürzte Wand oder Decke'],
  ['Dried bug shells on the walls', 'Getrocknete Käferpanzer an den Wänden'],
  ['Furniture made of repurposed trash', 'Möbel aus wiederverwertetem Müll'],
  ['Huge drawing of bat face on wall', 'Riesige Zeichnung eines Fledermausgesichts an der Wand'],
  ['Mess of tables and chairs', 'Wirrwarr aus Tischen und Stühlen'],
  ['Newspaper clipping wallpaper', 'Tapete aus Zeitungsausschnitten'],
  ['Overgrown with moss', 'Von Moos überwuchert'],
  ['Painted mural, now faded', 'Wandgemälde, inzwischen verblasst'],
  ['Platforms hanging over rapidly flowing water', 'Plattformen über reißendem Wasser'],
  ['Roots bursting out of walls/floor/ceiling', 'Wurzeln brechen aus Wänden, Boden und Decke'],
  ['Rotting pile of acorns', 'Verrottender Eichelhaufen'],
  ['Scattering of animal teeth', 'Verstreute Tierzähne'],
  ['Shiny candy-wrapper banners', 'Glänzende Banner aus Bonbonpapier'],
  ['Snake skull doorway', 'Türöffnung aus einem Schlangenschädel'],
  ['Steady drip of water from ceiling', 'Stetes Tropfen von der Decke'],
  ['Stern statue of an ancient mouse', 'Strenge Statue einer uralten Maus'],
  ['Uneven and deeply cracked floor', 'Unebener, tief gesprungener Boden'],
  ['White quartz altar', 'Altar aus weißem Quarz'],
]);

// d8
export const OBSTACLES = rows([
  ['Locked door. Key can be found in another room. Knocking the door down takes time and makes noise.',
    'Verschlossene Tür. Der Schlüssel liegt in einem anderen Raum. Die Tür einzuschlagen dauert und macht Lärm.'],
  ['Steep climb. Without special equipment, mice risk exhaustion or falling.',
    'Steiler Aufstieg. Ohne Spezialausrüstung droht Erschöpfung oder ein Sturz.'],
  ['Room with an exit in the centre of the roof, 6" away from any wall.',
    'Raum mit einem Ausgang in der Mitte der Decke, 15 cm von jeder Wand entfernt.'],
  ['Device that creates a high-pitched scream. Each Turn spent here or in adjacent rooms gives the Frightened Condition.',
    'Gerät, das einen gellenden Schrei erzeugt. Jeder Zug hier oder in Nachbarräumen gibt den Zustand Ängstlich.'],
  ['Caved-in section of tunnel, leaving a gap too small to crawl through.',
    'Eingestürzter Tunnelabschnitt, die Lücke ist zu klein zum Durchkriechen.'],
  ['Tunnel completely filled with water.', 'Tunnel, vollständig mit Wasser gefüllt.'],
  ['Wide, deep puddle of mud blocking the way. Gives an Exhausted Condition per 6" traveled.',
    'Breite, tiefe Schlammpfütze versperrt den Weg. Gibt je 15 cm Strecke einen Zustand Erschöpft.'],
  ['Long, smooth, upwards sloping metal or plastic tube.',
    'Lange, glatte, nach oben ansteigende Röhre aus Metall oder Plastik.'],
]);

// d8
export const TRAPS = rows([
  ['Large stone door, chiseled loose from frame. Device behind the door tips it forward when handle is turned.',
    'Große Steintür, aus dem Rahmen gemeißelt. Ein Mechanismus dahinter kippt sie nach vorn, wenn der Griff gedreht wird.'],
  ['Long hallway flooded with water, electrified by large battery in an alcove.',
    'Langer, überfluteter Gang, von einer großen Batterie in einer Nische unter Strom gesetzt.'],
  ['Dark room filled with noxious, explosive gas. Distinct smell of rotten eggs. d20 damage if ignited.',
    'Dunkler Raum voller giftigem, explosivem Gas. Deutlicher Geruch nach faulen Eiern. W20 Schaden, wenn es sich entzündet.'],
  ['Thin thread stretched across deadly fall. Safe if traveling slowly, one at a time.',
    'Dünner Faden über einem tödlichen Abgrund. Sicher, wenn man langsam und einzeln geht.'],
  ['Pit blocking the way. A snake is asleep at the bottom.',
    'Grube versperrt den Weg. Am Grund schläft eine Schlange.'],
  ['Door with three handles in the shape of mushrooms, one safe, the others poison. Poison handles deal d12 magical damage.',
    'Tür mit drei pilzförmigen Griffen, einer sicher, die anderen vergiftet. Giftige Griffe verursachen W12 magischen Schaden.'],
  ['Circle of enchanted mushrooms, with a young mouse inside. Those within try desperately to get others to enter.',
    'Ring verzauberter Pilze mit einer jungen Maus darin. Wer darin steht, versucht verzweifelt, andere hineinzulocken.'],
  ['Floor is covered in sticky glue. Requires a STR save to break a foot loose.',
    'Der Boden ist mit klebrigem Leim bedeckt. Einen Fuß zu lösen verlangt einen STR-Rettungswurf.'],
]);

// d6
export const PUZZLES = rows([
  ['Room with a floor made of an electrified copper plate. A piece of valuable treasure sits in the centre.',
    'Raum mit einem Boden aus einer elektrisch geladenen Kupferplatte. In der Mitte liegt ein wertvoller Schatz.'],
  ['Three feeding bottles with different-colored liquid inside. Each is inert individually but powerful/dangerous when mixed.',
    'Drei Trinkflaschen mit verschiedenfarbigen Flüssigkeiten. Einzeln harmlos, gemischt mächtig oder gefährlich.'],
  ['A crystal, a magic sword embedded inside. The crystal is very hard, but will dissolve in stomach acid.',
    'Ein Kristall mit einem magischen Schwert darin. Der Kristall ist sehr hart, löst sich aber in Magensäure auf.'],
  ['Treasure is at the bottom of deep well.', 'Der Schatz liegt auf dem Grund eines tiefen Brunnens.'],
  ['Large smooth steel bowl, upside down. Treasure taped to the inside ceiling of the bowl.',
    'Große glatte Stahlschüssel, umgedreht. Der Schatz klebt innen an der Decke der Schüssel.'],
  ['Baited mousetrap. The lever is wired to a stone in the wall and will collapse the corridor if triggered.',
    'Mausefalle mit Köder. Der Bügel ist mit einem Stein in der Wand verdrahtet und lässt den Gang einstürzen, wenn er auslöst.'],
]);
