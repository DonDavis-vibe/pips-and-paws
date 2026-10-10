// Zufallstabellen aus dem Mausritter-SRD 2.3.1 (CC BY 4.0, siehe Footer) fuer
// die Generatoren des SL (components/GmGenerators.jsx, rules/generators.js).
// Erzeugt aus dem SRD-Text; die deutschen Texte sind eigene Uebersetzungen.
// Reihenfolge in jeder Tabelle = Reihenfolge der SRD (Wuerfelwert aufsteigend);
// Eintraege mit min/max stehen fuer Wuerfelbereiche (z. B. 2W6: 3-5).

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

// Wetter 2W6 je Jahreszeit; poor = schlechtes Wetter (SRD: STR-Rettungswurf oder Erschoepft beim Reisen).
export const WEATHER = {
  spring: [
    {"min": 2, "max": 2, "en": "Rain storm", "de": "Regensturm", "poor": true},
    {"min": 3, "max": 5, "en": "Drizzle", "de": "Nieselregen"},
    {"min": 6, "max": 8, "en": "Overcast", "de": "Bedeckt"},
    {"min": 9, "max": 11, "en": "Bright and sunny", "de": "Hell und sonnig"},
    {"min": 12, "max": 12, "en": "Clear and warm", "de": "Klar und warm"}
  ],
  summer: [
    {"min": 2, "max": 2, "en": "Thunder storm", "de": "Gewittersturm", "poor": true},
    {"min": 3, "max": 5, "en": "Very hot", "de": "Sehr heiß", "poor": true},
    {"min": 6, "max": 8, "en": "Clear, hot", "de": "Klar, heiß"},
    {"min": 9, "max": 11, "en": "Pleasantly sunny", "de": "Angenehm sonnig"},
    {"min": 12, "max": 12, "en": "Beautifully warm", "de": "Wunderbar warm"}
  ],
  autumn: [
    {"min": 2, "max": 2, "en": "Wild winds", "de": "Wilde Winde", "poor": true},
    {"min": 3, "max": 5, "en": "Heavy rain", "de": "Starkregen", "poor": true},
    {"min": 6, "max": 8, "en": "Cool", "de": "Kühl"},
    {"min": 9, "max": 11, "en": "Patchy rain", "de": "Vereinzelter Regen"},
    {"min": 12, "max": 12, "en": "Clear and crisp", "de": "Klar und frisch"}
  ],
  winter: [
    {"min": 2, "max": 2, "en": "Snow storm", "de": "Schneesturm", "poor": true},
    {"min": 3, "max": 5, "en": "Sleet", "de": "Graupel", "poor": true},
    {"min": 6, "max": 8, "en": "Bitter cold", "de": "Bittere Kälte", "poor": true},
    {"min": 9, "max": 11, "en": "Overcast", "de": "Bedeckt"},
    {"min": 12, "max": 12, "en": "Clear and crisp", "de": "Klar und frisch"}
  ],
};

// Jahreszeitliche Ereignisse W6.
export const SEASONAL_EVENTS = {
  spring: [
    {"en": "Flooding washes away an important landmark", "de": "Überschwemmung spült ein wichtiges Wahrzeichen fort"},
    {"en": "Mother bird, very protective of her eggs", "de": "Vogelmutter, sehr besorgt um ihre Eier"},
    {"en": "Merchant's cart sunken in a pool of mud", "de": "Der Wagen eines Händlers steckt im Schlammloch fest"},
    {"en": "Migrating butterflies, hungry for nectar", "de": "Wandernde Schmetterlinge, hungrig nach Nektar"},
    {"en": "Mice weaving wreathes of flowers to prepare for...", "de": "Mäuse flechten Blumenkränze für das ..."},
    {"en": "Wedding festival, a joyous procession", "de": "Hochzeitsfest, ein fröhlicher Umzug"}
  ],
  summer: [
    {"en": "Heat wave makes travel exhausting for next week", "de": "Eine Hitzewelle macht das Reisen die nächste Woche anstrengend"},
    {"en": "Baby bird, fallen from nest", "de": "Vogelküken, aus dem Nest gefallen"},
    {"en": "Pleasant and refreshing sun shower", "de": "Angenehmer, erfrischender Sonnenregen"},
    {"en": "Swarm of locusts destroy a settlement's crops", "de": "Heuschreckenschwarm vernichtet die Ernte einer Siedlung"},
    {"en": "Mice building elaborate costumes to prepare for...", "de": "Mäuse basteln aufwendige Kostüme für das ..."},
    {"en": "Midsummer festival, a wild dance", "de": "Mittsommerfest, ein wilder Tanz"}
  ],
  autumn: [
    {"en": "An important tree is felled by wild winds", "de": "Ein wichtiger Baum wird von wilden Winden gefällt"},
    {"en": "Mother bird, distraught from children leaving home", "de": "Vogelmutter, verzweifelt, weil die Kinder ausgezogen sind"},
    {"en": "A large patch of mushrooms emerges overnight", "de": "Über Nacht sprießt ein großes Pilzfeld"},
    {"en": "Rumors that truffles are growing nearby", "de": "Gerüchte, dass in der Nähe Trüffel wachsen"},
    {"en": "Mice carrying bundles of grain and baking pies for...", "de": "Mäuse tragen Getreidebündel und backen Kuchen für das ..."},
    {"en": "Harvest festival, a grand feast", "de": "Erntefest, ein großes Festmahl"}
  ],
  winter: [
    {"en": "Snow prevents above-ground movement for a week", "de": "Schnee verhindert eine Woche lang jede Bewegung über der Erde"},
    {"en": "Bird with a broken wing, old and grey", "de": "Vogel mit gebrochenem Flügel, alt und grau"},
    {"en": "Lost migrating duck, separated by the flock", "de": "Verirrte Zugente, von ihrem Schwarm getrennt"},
    {"en": "Travellers disappear in a fast moving storm", "de": "Reisende verschwinden in einem rasenden Sturm"},
    {"en": "Mice building an effigy of old Winter to prepare for...", "de": "Mäuse bauen eine Puppe des alten Winters für das ..."},
    {"en": "Midwinter festival, a magnificent bonfire", "de": "Mittwinterfest, ein prächtiges Freudenfeuer"}
  ],
};

// Nicht-Spieler-Maeuse. pay = [Anzahl Wuerfel-Seiten, Faktor] -> "W6 x 10 p" = [6, 10].
export const SOCIAL_POSITION = [
    {"en": "Poor", "de": "Arm", "pay": [6, 1]},
    {"en": "Common", "de": "Gewöhnlich", "pay": [6, 10]},
    {"en": "Common", "de": "Gewöhnlich", "pay": [6, 10]},
    {"en": "Burghermouse", "de": "Bürgermaus", "pay": [6, 50]},
    {"en": "Guildmouse", "de": "Zunftmaus", "pay": [4, 100]},
    {"en": "Noblemouse", "de": "Adelsmaus", "pay": [4, 1000]}
  ];

export const NPC_DETAILS = {
  appearance: [
    {"en": "Soulful eyes", "de": "Seelenvolle Augen"},
    {"en": "Bright, patched clothes", "de": "Leuchtend bunt geflickte Kleidung"},
    {"en": "Wreath of daisies", "de": "Kranz aus Gänseblümchen"},
    {"en": "Grubby clothes", "de": "Schmutzige Kleidung"},
    {"en": "Large floppy hat", "de": "Großer Schlapphut"},
    {"en": "Pockets full of seed", "de": "Taschen voller Samen"},
    {"en": "Bent twig walking stick", "de": "Verbogener Wanderstock aus einem Zweig"},
    {"en": "Carries rusted pinsword", "de": "Trägt einen rostigen Nadeldegen"},
    {"en": "Long, wild fur", "de": "Langes, wildes Fell"},
    {"en": "Very, very old", "de": "Uralt"},
    {"en": "Bandaged tail", "de": "Verbundener Schwanz"},
    {"en": "Tail tied with a bow", "de": "Schwanz mit einer Schleife"},
    {"en": "Missing an ear", "de": "Fehlendes Ohr"},
    {"en": "Long whiskers", "de": "Lange Schnurrhaare"},
    {"en": "Twinkling eyes", "de": "Funkelnde Augen"},
    {"en": "Huge, heavy black cloak", "de": "Riesiger, schwerer schwarzer Umhang"},
    {"en": "Old battle scars", "de": "Alte Kampfnarben"},
    {"en": "Very young", "de": "Sehr jung"},
    {"en": "Shaved fur", "de": "Rasiertes Fell"},
    {"en": "Braided fur", "de": "Geflochtenes Fell"}
  ],
  quirk: [
    {"en": "Constantly grooming", "de": "Putzt sich ständig"},
    {"en": "Obsessed with weather", "de": "Besessen vom Wetter"},
    {"en": "Very high energy", "de": "Extrem energiegeladen"},
    {"en": "Traveled, knowledgeable", "de": "Weit gereist, kenntnisreich"},
    {"en": "Cursed by a wizard", "de": "Von einem Zauberer verflucht"},
    {"en": "Scares easily", "de": "Schreckt leicht auf"},
    {"en": "Ashamed of past crimes", "de": "Schämt sich für frühere Verbrechen"},
    {"en": "Very competitive", "de": "Sehr ehrgeizig"},
    {"en": "Flamboyant drunkard", "de": "Ausgelassener Trinker"},
    {"en": "Extremely polite", "de": "Äußerst höflich"},
    {"en": "Unreservedly honest", "de": "Rückhaltlos ehrlich"},
    {"en": "Slow, careful speech", "de": "Spricht langsam und bedächtig"},
    {"en": "Quick, erratic speech", "de": "Spricht schnell und sprunghaft"},
    {"en": "Secret servant of a cat", "de": "Heimlicher Diener einer Katze"},
    {"en": "Raised by rats", "de": "Von Ratten aufgezogen"},
    {"en": "Outcast from home", "de": "Aus der Heimat verstoßen"},
    {"en": "Many pet insects", "de": "Viele Haustier-Insekten"},
    {"en": "Hates being outdoors", "de": "Hasst es, draußen zu sein"},
    {"en": "Local hero", "de": "Lokaler Held"},
    {"en": "Very twitchy whiskers", "de": "Sehr zuckende Schnurrhaare"}
  ],
  wants: [
    {"en": "Freedom", "de": "Freiheit"},
    {"en": "Safety", "de": "Sicherheit"},
    {"en": "Escape", "de": "Flucht"},
    {"en": "Excitement", "de": "Aufregung"},
    {"en": "Power", "de": "Macht"},
    {"en": "Meaning", "de": "Sinn"},
    {"en": "Health", "de": "Gesundheit"},
    {"en": "Wealth", "de": "Reichtum"},
    {"en": "Protection", "de": "Schutz"},
    {"en": "Love", "de": "Liebe"},
    {"en": "To protect", "de": "Etwas zu beschützen"},
    {"en": "Food", "de": "Essen"},
    {"en": "Friendship", "de": "Freundschaft"},
    {"en": "Rest", "de": "Ruhe"},
    {"en": "Knowledge", "de": "Wissen"},
    {"en": "Savagery", "de": "Wildheit"},
    {"en": "Beauty", "de": "Schönheit"},
    {"en": "Revenge", "de": "Rache"},
    {"en": "To serve", "de": "Zu dienen"},
    {"en": "Fun", "de": "Spaß"}
  ],
  relationship: [
    {"en": "Parent", "de": "Elternteil"},
    {"en": "Sibling", "de": "Geschwister"},
    {"en": "Cousin", "de": "Cousin/Cousine"},
    {"en": "Second cousin", "de": "Cousin/Cousine zweiten Grades"},
    {"en": "Grandparent", "de": "Großeltern"},
    {"en": "Related, but don't know it", "de": "Verwandt, wissen es aber nicht"},
    {"en": "Married", "de": "Verheiratet"},
    {"en": "Former lovers", "de": "Ehemalige Liebende"},
    {"en": "In love, unrequited", "de": "Verliebt, unerwidert"},
    {"en": "Drinking buddies", "de": "Saufkumpane"},
    {"en": "Debt owed", "de": "Schulden offen"},
    {"en": "Long and tumultuous", "de": "Lang und turbulent"},
    {"en": "Sworn enemies", "de": "Geschworene Feinde"},
    {"en": "Guild brothers", "de": "Zunftbrüder"},
    {"en": "Childhood friends", "de": "Kindheitsfreunde"},
    {"en": "One stole from the other", "de": "Einer hat den anderen bestohlen"},
    {"en": "Worked together", "de": "Haben zusammengearbeitet"},
    {"en": "Grew up together", "de": "Zusammen aufgewachsen"},
    {"en": "Serve the same lord", "de": "Dienen demselben Herrn"},
    {"en": "Never met before", "de": "Sind sich nie begegnet"}
  ],
};

// Abenteuer-Ideen, 36 Zeilen = d66 (11-16, 21-26, ... 61-66, Reihenfolge der SRD).
export const ADVENTURE_SEEDS = [
    {"d66": 11, "creature": {"en": "Fishermouse", "de": "Fischermaus"}, "problem": {"en": "Have been accused of a crime", "de": "Wurde eines Verbrechens beschuldigt"}, "complication": {"en": "A player's hireling is responsible", "de": "Der Mietling eines Spielers ist verantwortlich"}},
    {"d66": 12, "creature": {"en": "Unruly family", "de": "Ungebärdige Familie"}, "problem": {"en": "Looking for a new home", "de": "Sucht ein neues Zuhause"}, "complication": {"en": "Need to cross a river", "de": "Muss einen Fluss überqueren"}},
    {"d66": 13, "creature": {"en": "Wizard", "de": "Zauberer"}, "problem": {"en": "Is being followed", "de": "Wird verfolgt"}, "complication": {"en": "Antagonist is their own shadow", "de": "Der Gegenspieler ist der eigene Schatten"}},
    {"d66": 14, "creature": {"en": "Roach wrangler", "de": "Schabenhirte"}, "problem": {"en": "Discovered a strange artifact", "de": "Hat ein seltsames Artefakt entdeckt"}, "complication": {"en": "They have amnesia", "de": "Hat Gedächtnisverlust"}},
    {"d66": 15, "creature": {"en": "Farmer", "de": "Bauer/Bäuerin"}, "problem": {"en": "Experienced an unsettling omen", "de": "Hat ein beunruhigendes Omen erlebt"}, "complication": {"en": "The antagonist is in disguise", "de": "Der Gegenspieler ist verkleidet"}},
    {"d66": 16, "creature": {"en": "Burghermaster", "de": "Bürgermeister"}, "problem": {"en": "Want to assassinate a rival", "de": "Will einen Rivalen ermorden"}, "complication": {"en": "Player mouse's home is involved", "de": "Das Zuhause einer Spielermaus ist beteiligt"}},
    {"d66": 21, "creature": {"en": "Forager", "de": "Sammler"}, "problem": {"en": "Want to retrieve lost treasure", "de": "Will verlorenen Schatz bergen"}, "complication": {"en": "It is protected by strange beasts", "de": "Er wird von seltsamen Bestien beschützt"}},
    {"d66": 22, "creature": {"en": "Shopkeeper", "de": "Ladenbesitzer"}, "problem": {"en": "Home has been destroyed", "de": "Das Zuhause wurde zerstört"}, "complication": {"en": "Antagonist is their closest friend", "de": "Der Gegenspieler ist der engste Freund"}},
    {"d66": 23, "creature": {"en": "Traveling merchant", "de": "Fahrender Händler"}, "problem": {"en": "Most valued possession was stolen", "de": "Das wertvollste Besitztum wurde gestohlen"}, "complication": {"en": "They are the true antagonist", "de": "Er selbst ist der wahre Gegenspieler"}},
    {"d66": 24, "creature": {"en": "Pigeon rider", "de": "Taubenreiter"}, "problem": {"en": "Has been kidnapped", "de": "Wurde entführt"}, "complication": {"en": "Player mouse's friend is involved", "de": "Der Freund einer Spielermaus ist beteiligt"}},
    {"d66": 25, "creature": {"en": "Ale brewer", "de": "Bierbrauer"}, "problem": {"en": "Has been exiled from settlement", "de": "Wurde aus der Siedlung verbannt"}, "complication": {"en": "They've been framed", "de": "Wurde hereingelegt"}},
    {"d66": 26, "creature": {"en": "Herbalist", "de": "Kräuterkundiger"}, "problem": {"en": "Searching for a rare cure", "de": "Sucht ein seltenes Heilmittel"}, "complication": {"en": "It's very urgent", "de": "Es ist sehr dringend"}},
    {"d66": 31, "creature": {"en": "Message runner", "de": "Botenläufer"}, "problem": {"en": "Have lost their way", "de": "Haben sich verirrt"}, "complication": {"en": "They have vital information", "de": "Er hat entscheidende Informationen"}},
    {"d66": 32, "creature": {"en": "Vagrant", "de": "Landstreicher"}, "problem": {"en": "Have had all their food stolen", "de": "Haben ihr ganzes Essen gestohlen bekommen"}, "complication": {"en": "The antagonist had a good reason", "de": "Der Gegenspieler hatte einen guten Grund"}},
    {"d66": 33, "creature": {"en": "Test subject", "de": "Versuchstier"}, "problem": {"en": "Are on the run from humans", "de": "Sind auf der Flucht vor Menschen"}, "complication": {"en": "They're being tracked by a chip", "de": "Sie werden per Chip aufgespürt"}},
    {"d66": 34, "creature": {"en": "Tin miner", "de": "Zinnbergmann"}, "problem": {"en": "Have been waylaid by bandits", "de": "Wurden von Banditen überfallen"}, "complication": {"en": "The antagonist is very drunk", "de": "Der Gegenspieler ist sehr betrunken"}},
    {"d66": 35, "creature": {"en": "Baker", "de": "Bäcker"}, "problem": {"en": "Have eaten a poisonous berry", "de": "Haben eine giftige Beere gegessen"}, "complication": {"en": "Antagonist is a family member", "de": "Der Gegenspieler ist ein Familienmitglied"}},
    {"d66": 36, "creature": {"en": "Hedge knight", "de": "Heckenritter"}, "problem": {"en": "Family member is missing", "de": "Ein Familienmitglied wird vermisst"}, "complication": {"en": "They're dying", "de": "Er liegt im Sterben"}},
    {"d66": 41, "creature": {"en": "Tax collector", "de": "Steuereintreiber"}, "problem": {"en": "Have lost of a lot of pips", "de": "Haben viele Pips verloren"}, "complication": {"en": "They're very drunk", "de": "Sie sind sehr betrunken"}},
    {"d66": 42, "creature": {"en": "Matriarch", "de": "Matriarchin"}, "problem": {"en": "Has been accused of murder", "de": "Wurde des Mordes beschuldigt"}, "complication": {"en": "Antagonist is a shape-shifter", "de": "Der Gegenspieler ist ein Gestaltwandler"}},
    {"d66": 43, "creature": {"en": "Prospector", "de": "Prospektor"}, "problem": {"en": "Pack tortoise is stuck", "de": "Die Packschildkröte steckt fest"}, "complication": {"en": "They're much richer than they look", "de": "Sie sind viel reicher, als sie aussehen"}},
    {"d66": 44, "creature": {"en": "Tunnellers Guild boss", "de": "Boss der Tunnelgräberzunft"}, "problem": {"en": "Has been murdered", "de": "Wurde ermordet"}, "complication": {"en": "Player mouse's rival is involved", "de": "Der Rivale einer Spielermaus ist beteiligt"}},
    {"d66": 45, "creature": {"en": "Noblemouse", "de": "Adelsmaus"}, "problem": {"en": "Their home is under attack", "de": "Ihr Zuhause wird angegriffen"}, "complication": {"en": "Antagonist wants retribution", "de": "Der Gegenspieler will Vergeltung"}},
    {"d66": 46, "creature": {"en": "Rat bandit", "de": "Rattenbandit"}, "problem": {"en": "Want to steal from a rival", "de": "Will einen Rivalen bestehlen"}, "complication": {"en": "A ghost is haunting the location", "de": "Ein Geist spukt am Ort"}},
    {"d66": 51, "creature": {"en": "Queen bee", "de": "Bienenkönigin"}, "problem": {"en": "Traveling to a new home", "de": "Reist in ein neues Zuhause"}, "complication": {"en": "Their followers disagree", "de": "Ihre Gefolgsleute sind uneins"}},
    {"d66": 52, "creature": {"en": "Ant army officer", "de": "Offizier der Ameisenarmee"}, "problem": {"en": "Is hunted by enemies", "de": "Wird von Feinden gejagt"}, "complication": {"en": "They are badly injured", "de": "Sie sind schwer verletzt"}},
    {"d66": 53, "creature": {"en": "Owl sorcerer", "de": "Eulenzauberer"}, "problem": {"en": "Want to retrieve a rare spell", "de": "Will einen seltenen Zauber beschaffen"}, "complication": {"en": "It is deep in a cave", "de": "Er liegt tief in einer Höhle"}},
    {"d66": 54, "creature": {"en": "Cat lord", "de": "Katzenfürst"}, "problem": {"en": "Want to be entertained", "de": "Will unterhalten werden"}, "complication": {"en": "They've trapped the player mice", "de": "Er hat die Spielermäuse in eine Falle gelockt"}},
    {"d66": 55, "creature": {"en": "Duckling", "de": "Entenküken"}, "problem": {"en": "Has lost their mother", "de": "Hat die Mutter verloren"}, "complication": {"en": "Need to get to an island", "de": "Muss auf eine Insel gelangen"}},
    {"d66": 56, "creature": {"en": "Giant millipede", "de": "Riesentausendfüßer"}, "problem": {"en": "Want somewhere warm to sleep", "de": "Will einen warmen Schlafplatz"}, "complication": {"en": "Need item carried by a player mouse", "de": "Braucht einen Gegenstand, den eine Spielermaus trägt"}},
    {"d66": 61, "creature": {"en": "Lilliputian ambassador", "de": "Liliputanischer Botschafter"}, "problem": {"en": "Want to reach the mouse queen", "de": "Will zur Mäusekönigin"}, "complication": {"en": "They don't understand local customs", "de": "Sie verstehen die örtlichen Bräuche nicht"}},
    {"d66": 62, "creature": {"en": "Trapped ghost", "de": "Gefangener Geist"}, "problem": {"en": "Want to find their true love", "de": "Will die wahre Liebe finden"}, "complication": {"en": "They can't leave their current location", "de": "Sie können ihren jetzigen Ort nicht verlassen"}},
    {"d66": 63, "creature": {"en": "Faerie envoy", "de": "Feenbote"}, "problem": {"en": "Want to kidnap a mouse", "de": "Will eine Maus entführen"}, "complication": {"en": "A player mouse is their target", "de": "Eine Spielermaus ist ihr Ziel"}},
    {"d66": 64, "creature": {"en": "Swarm of midges", "de": "Mückenschwarm"}, "problem": {"en": "Want to steal from a player mouse", "de": "Will eine Spielermaus bestehlen"}, "complication": {"en": "Antagonist is unusually skilled", "de": "Der Gegenspieler ist ungewöhnlich geschickt"}},
    {"d66": 65, "creature": {"en": "Grandmother spider", "de": "Großmutter Spinne"}, "problem": {"en": "Has lost an ancient treasure", "de": "Hat einen uralten Schatz verloren"}, "complication": {"en": "They've eaten it", "de": "Sie haben ihn gefressen"}},
    {"d66": 66, "creature": {"en": "Baby bird", "de": "Vogelküken"}, "problem": {"en": "Cannot get home", "de": "Findet nicht nach Hause"}, "complication": {"en": "Need to climb a tree", "de": "Muss auf einen Baum klettern"}}
  ];

export const HEX_TYPES = [
    {"min": 1, "max": 2, "key": "countryside", "en": "Countryside", "de": "Landschaft"},
    {"min": 3, "max": 4, "key": "forest", "en": "Forest", "de": "Wald"},
    {"min": 5, "max": 5, "key": "river", "en": "River", "de": "Fluss"},
    {"min": 6, "max": 6, "key": "town", "en": "Human town", "de": "Menschenstadt"}
  ];

export const LANDMARKS = {
  countryside: [
    {"en": "Anthill", "de": "Ameisenhügel"},
    {"en": "Beech, lightning split", "de": "Buche, vom Blitz gespalten"},
    {"en": "Bone-white tree", "de": "Knochenweißer Baum"},
    {"en": "Cow skeleton", "de": "Kuhskelett"},
    {"en": "Field of flowers", "de": "Blumenfeld"},
    {"en": "Field of wheat", "de": "Weizenfeld"},
    {"en": "Hedge row", "de": "Hecke"},
    {"en": "Hollow tree stump", "de": "Hohler Baumstumpf"},
    {"en": "Huge flat rock", "de": "Riesiger flacher Fels"},
    {"en": "Lily-lined pond", "de": "Teich mit Seerosen"},
    {"en": "Massive fallen tree", "de": "Gewaltiger umgestürzter Baum"},
    {"en": "Old craggy oak", "de": "Alte, zerfurchte Eiche"},
    {"en": "Old farmhouse", "de": "Altes Bauernhaus"},
    {"en": "Quiet dirt road", "de": "Ruhiger Feldweg"},
    {"en": "Rabbit warren", "de": "Kaninchenbau"},
    {"en": "Sparrow nest", "de": "Sperlingsnest"},
    {"en": "Stand of pine trees", "de": "Kiefernwäldchen"},
    {"en": "Steep hill", "de": "Steiler Hügel"},
    {"en": "Stone wall", "de": "Steinmauer"},
    {"en": "Tangle of fig roots", "de": "Gewirr aus Feigenwurzeln"}
  ],
  forest: [
    {"en": "Abandoned shack", "de": "Verlassene Hütte"},
    {"en": "Bright clearing", "de": "Helle Lichtung"},
    {"en": "Cascading waterfalls", "de": "Rauschende Wasserfälle"},
    {"en": "Cliff face", "de": "Felswand"},
    {"en": "Cold, fresh spring", "de": "Kalte, frische Quelle"},
    {"en": "Dense underbrush", "de": "Dichtes Unterholz"},
    {"en": "Face in ancient oak", "de": "Gesicht in einer uralten Eiche"},
    {"en": "Fox hole", "de": "Fuchsbau"},
    {"en": "Grove of ferns", "de": "Farnhain"},
    {"en": "Hollow tree stump", "de": "Hohler Baumstumpf"},
    {"en": "Huge pine tree", "de": "Riesige Kiefer"},
    {"en": "Human walking track", "de": "Menschenpfad"},
    {"en": "Human-made clearing", "de": "Von Menschen gerodete Lichtung"},
    {"en": "Meandering brook", "de": "Mäandernder Bach"},
    {"en": "Overgrown ruins", "de": "Überwucherte Ruinen"},
    {"en": "Ring of stones", "de": "Steinkreis"},
    {"en": "Rocky outcropping", "de": "Felsvorsprung"},
    {"en": "Sunken hollow", "de": "Eingesunkene Mulde"},
    {"en": "Tangle of roots", "de": "Wurzelgewirr"},
    {"en": "Termite-riddled tree", "de": "Von Termiten zerfressener Baum"}
  ],
  river: [
    {"en": "Canal lock", "de": "Kanalschleuse"},
    {"en": "Converging tributaries", "de": "Zusammenfließende Nebenflüsse"},
    {"en": "Draping willow", "de": "Hängende Weide"},
    {"en": "Eroded riverbank", "de": "Ausgewaschenes Flussufer"},
    {"en": "Fallen tree crossing", "de": "Umgestürzter Baum als Übergang"},
    {"en": "High waterfall", "de": "Hoher Wasserfall"},
    {"en": "Huge boulder", "de": "Riesiger Felsbrocken"},
    {"en": "Huge concrete dam", "de": "Riesiger Betondamm"},
    {"en": "Isolated island", "de": "Einsame Insel"},
    {"en": "Muddy flats", "de": "Schlammbänke"},
    {"en": "Rocky rapids", "de": "Felsige Stromschnellen"},
    {"en": "Row of dead trees", "de": "Reihe toter Bäume"},
    {"en": "Silty dam", "de": "Verschlammter Damm"},
    {"en": "Stepping-stones", "de": "Trittsteine"},
    {"en": "Stone bridge", "de": "Steinbrücke"},
    {"en": "Stony shallows", "de": "Steiniges Flachwasser"},
    {"en": "Submerged trash", "de": "Versunkener Müll"},
    {"en": "Sunken barge", "de": "Gesunkener Lastkahn"},
    {"en": "Twisted roots", "de": "Verdrehte Wurzeln"},
    {"en": "Wooden bridge", "de": "Holzbrücke"}
  ],
  town: [
    {"en": "Abandoned car", "de": "Verlassenes Auto"},
    {"en": "Apartment balcony", "de": "Wohnungsbalkon"},
    {"en": "Blackberry hedge", "de": "Brombeerhecke"},
    {"en": "Busy road", "de": "Belebte Straße"},
    {"en": "Drainpipe outlet", "de": "Abflussrohr-Mündung"},
    {"en": "Dumped furniture", "de": "Weggeworfene Möbel"},
    {"en": "Greenhouse", "de": "Gewächshaus"},
    {"en": "Mouse ruins", "de": "Mäuseruinen"},
    {"en": "Newly built house", "de": "Neu gebautes Haus"},
    {"en": "Overgrown garden bed", "de": "Überwucherte Gartenbeet"},
    {"en": "Pigeon nest", "de": "Taubennest"},
    {"en": "Pile of trash", "de": "Müllhaufen"},
    {"en": "Rocky riverbed", "de": "Felsiges Flussbett"},
    {"en": "Shopping trolley", "de": "Einkaufswagen"},
    {"en": "Stagnant pond", "de": "Stehender Tümpel"},
    {"en": "Steel bridge", "de": "Stahlbrücke"},
    {"en": "Trash-filled skip", "de": "Müllcontainer"},
    {"en": "Tree-lined footpath", "de": "Baumgesäumter Fußweg"},
    {"en": "Underground car park", "de": "Tiefgarage"},
    {"en": "Woodshed", "de": "Holzschuppen"}
  ],
};

// Landmark-Details: erst W6 (Gruppe), dann W8 (Eintrag). Gruppe 1 = Maeusesiedlung (-> Siedlungs-Generator).
export const LANDMARK_DETAILS = {
  1: [
    {"en": "Mouse settlement...", "de": "Mäusesiedlung ..."}
  ],
  2: [
    {"en": "Small mouse farm (What threatens their crops?)", "de": "Kleiner Mäusebauernhof (Was bedroht die Ernte?)"},
    {"en": "Noblemouse's castle (What does it defend against?)", "de": "Schloss einer Adelsmaus (Wovor schützt es?)"},
    {"en": "Friendly mouse roadhouse (What is in the basement?)", "de": "Freundliches Mäuse-Gasthaus (Was liegt im Keller?)"},
    {"en": "Mouse hunting lodge (What is their quarry?)", "de": "Mäuse-Jagdhütte (Was ist ihre Beute?)"},
    {"en": "Mining outpost (What have they uncovered?)", "de": "Bergbau-Außenposten (Was haben sie freigelegt?)"},
    {"en": "Mouse hermit's hut (Why do they shun society?)", "de": "Hütte eines Mäuse-Einsiedlers (Warum meidet er die Gesellschaft?)"},
    {"en": "Natural caves (What is living here?)", "de": "Natürliche Höhlen (Was lebt hier?)"},
    {"en": "Hedge-knight's tower (What is their quest?)", "de": "Turm eines Heckenritters (Was ist seine Queste?)"}
  ],
  3: [
    {"en": "Songbird's nest (What sad tales do they sing of?)", "de": "Nest eines Singvogels (Welche traurigen Geschichten singt er?)"},
    {"en": "Tribe of huge, peaceful beasts (What do they fear?)", "de": "Stamm riesiger, friedlicher Bestien (Was fürchten sie?)"},
    {"en": "Rat bandit hideout (Who do they prey on?)", "de": "Versteck von Rattenbanditen (Wen jagen sie?)"},
    {"en": "Crow coven's spire (What spells do they caw?)", "de": "Turmspitze eines Krähenzirkels (Welche Zauber krächzen sie?)"},
    {"en": "Hive of insects (What do they hunger for?)", "de": "Insektenstock (Wonach hungert er?)"},
    {"en": "Den of a great predator (What treasure do they guard?)", "de": "Bau eines großen Raubtiers (Welchen Schatz bewacht es?)"},
    {"en": "Frog fortress (What lies hidden in the dungeon?)", "de": "Froschfestung (Was liegt im Verlies verborgen?)"},
    {"en": "Mouse wizard's tower (What is spell almost finished?)", "de": "Turm eines Mäusezauberers (Welcher Zauber ist fast fertig?)"}
  ],
  4: [
    {"en": "Dangerous natural feature (How can it be avoided?)", "de": "Gefährliche Naturerscheinung (Wie lässt sie sich umgehen?)"},
    {"en": "Lonely shrine (Who maintains it? What do they worship?)", "de": "Einsamer Schrein (Wer pflegt ihn? Was beten sie an?)"},
    {"en": "Noblemouse's manor (Why was it abandoned?)", "de": "Herrenhaus einer Adelsmaus (Warum wurde es verlassen?)"},
    {"en": "Abandoned settlement (What clues did they leave?)", "de": "Verlassene Siedlung (Welche Hinweise haben sie hinterlassen?)"},
    {"en": "Ruined watchtower (What did it guard from?)", "de": "Verfallener Wachturm (Wovor hat er gewacht?)"},
    {"en": "Natural feature, peaceful and safe (Who gathers here?)", "de": "Naturerscheinung, friedlich und sicher (Wer versammelt sich hier?)"},
    {"en": "Natural feature, out of place (How did it form?)", "de": "Naturerscheinung, fehl am Platz (Wie ist sie entstanden?)"},
    {"en": "Rickety bridge (What does it cross over?)", "de": "Wackelige Brücke (Worüber führt sie?)"}
  ],
  5: [
    {"en": "Ancient bat cult temple (What was summoned?)", "de": "Uralter Tempel eines Fledermauskults (Was wurde beschworen?)"},
    {"en": "Faerie ring (What business do the faeries have here?)", "de": "Feenring (Was haben die Feen hier zu schaffen?)"},
    {"en": "Beetle graveyard (What do the ghosts want?)", "de": "Käferfriedhof (Was wollen die Geister?)"},
    {"en": "Mouse witch's hut (What does she brew?)", "de": "Hütte einer Mäusehexe (Was braut sie?)"},
    {"en": "Small, deep pond (What is at the bottom?)", "de": "Kleiner, tiefer Teich (Was liegt auf dem Grund?)"},
    {"en": "Out-of-season plantlife (Why are they growing here?)", "de": "Pflanzen außerhalb der Jahreszeit (Warum wachsen sie hier?)"},
    {"en": "Owl sorcerer's nest (What are they searching for?)", "de": "Nest eines Eulenzauberers (Wonach sucht er?)"},
    {"en": "Strange magical anomaly (Why is it spreading?)", "de": "Seltsame magische Anomalie (Warum breitet sie sich aus?)"}
  ],
  6: [
    {"en": "Crashed Lilliputian airship (How can it be repaired?)", "de": "Abgestürztes liliputanisches Luftschiff (Wie lässt es sich reparieren?)"},
    {"en": "Humming stone (What happens when touched?)", "de": "Summender Stein (Was passiert bei Berührung?)"},
    {"en": "Completely lifeless (What disaster has occurred?)", "de": "Völlig leblos (Welche Katastrophe hat sich ereignet?)"},
    {"en": "Regularly used by humans (What do they do here?)", "de": "Wird regelmäßig von Menschen genutzt (Was tun sie hier?)"},
    {"en": "Damaged by humans (What have they done?)", "de": "Von Menschen beschädigt (Was haben sie getan?)"},
    {"en": "Ancient ruins of a past civilisation (Who built this?)", "de": "Uralte Ruinen einer vergangenen Zivilisation (Wer hat das gebaut?)"},
    {"en": "Cat lord's hunting ground (What trophies remain?)", "de": "Jagdgebiet eines Katzenfürsten (Welche Trophäen sind geblieben?)"},
    {"en": "Repurposed human construction (How is it used?)", "de": "Umfunktionierte Menschenbauten (Wie werden sie genutzt?)"}
  ],
};

export const SETTLEMENT = {
  // Groesse W6 (zweimal 1W6 wuerfeln, niedrigeren nehmen), Reihenfolge Farm .. Stadt
  size: [
    {"en": "Farm/manor (1-3 families)", "de": "Hof/Gutshof (1–3 Familien)"},
    {"en": "Crossroads (3-5 families)", "de": "Kreuzung (3–5 Familien)"},
    {"en": "Hamlet (50-150 mice)", "de": "Weiler (50–150 Mäuse)"},
    {"en": "Village (150-300 mice)", "de": "Dorf (150–300 Mäuse)"},
    {"en": "Town (300-1000 mice)", "de": "Stadt (300–1000 Mäuse)"},
    {"en": "City (1000+ mice)", "de": "Großstadt (über 1000 Mäuse)"}
  ],
  // Verwaltung: W6 + Groessenstufe (1-6), Bereiche 2-12
  governance: [
    {"min": 2, "max": 3, "en": "Guided by village elders", "de": "Von den Dorfältesten geführt"},
    {"min": 4, "max": 5, "en": "Administered by a knight or lower-caste lord", "de": "Verwaltet von einem Ritter oder niederen Lehnsherrn"},
    {"min": 6, "max": 7, "en": "Organised by a guild committee", "de": "Von einem Zunftausschuss organisiert"},
    {"min": 8, "max": 9, "en": "Free settlement, governed by council of burghermice", "de": "Freie Siedlung, regiert von einem Rat der Bürgermäuse"},
    {"min": 10, "max": 11, "en": "House of an upper caste noblemouse", "de": "Haus einer hochrangigen Adelsmaus"},
    {"min": 12, "max": 12, "en": "Seat of baronial power", "de": "Sitz der Baronsmacht"}
  ],
  inhabitants: [
    {"en": "Shave elaborate patterns in their fur", "de": "Rasieren kunstvolle Muster ins Fell"},
    {"en": "Intoxicated by strange plants", "de": "Berauscht von seltsamen Pflanzen"},
    {"en": "Wary of doing business with outsiders", "de": "Misstrauisch gegenüber Geschäften mit Fremden"},
    {"en": "Curious for news from afar", "de": "Neugierig auf Neuigkeiten aus der Ferne"},
    {"en": "Believe grooming their fur is bad luck", "de": "Glauben, Fellpflege bringe Unglück"},
    {"en": "Wear finely embroidered clothes", "de": "Tragen fein bestickte Kleidung"},
    {"en": "Brew honey-mead, flavoured with pungent herbs", "de": "Brauen Honigmet, gewürzt mit scharfen Kräutern"},
    {"en": "Cover their faces with long hoods", "de": "Verhüllen ihre Gesichter mit langen Kapuzen"},
    {"en": "Impoverished by a cat lord's tithes", "de": "Verarmt durch den Zehnten eines Katzenfürsten"},
    {"en": "Ceremonially crop their tails", "de": "Stutzen zeremoniell ihre Schwänze"},
    {"en": "Brave hunters of large beasts", "de": "Mutige Jäger großer Bestien"},
    {"en": "All descended from single matriarch", "de": "Alle stammen von einer einzigen Matriarchin ab"},
    {"en": "Bake delicious berry pies", "de": "Backen köstliche Beerenkuchen"},
    {"en": "Lab escapees, naive about the world", "de": "Laborflüchtlinge, naiv gegenüber der Welt"},
    {"en": "Spend their days lazing by a stream", "de": "Verbringen ihre Tage faul an einem Bach"},
    {"en": "Long-standing blood feud with another settlement", "de": "Alte Blutfehde mit einer anderen Siedlung"},
    {"en": "Dig grand tunnels, overseen by the guild", "de": "Graben große Tunnel, beaufsichtigt von der Zunft"},
    {"en": "Wear large, wide-brimmed hats", "de": "Tragen große Hüte mit breiter Krempe"},
    {"en": "Have laws and customs confusing to outsiders", "de": "Haben Gesetze und Bräuche, die Fremde verwirren"},
    {"en": "On friendly terms with a predator", "de": "Stehen auf freundlichem Fuß mit einem Raubtier"}
  ],
  feature: [
    {"en": "Maze of defensive, trap-filled tunnels", "de": "Labyrinth aus verteidigten, fallenreichen Tunneln"},
    {"en": "Exceedingly comfortable, well-appointed inn", "de": "Überaus bequemes, gut ausgestattetes Gasthaus"},
    {"en": "Shrine carved of black wood", "de": "Schrein aus schwarzem Holz"},
    {"en": "Meditative mushroom garden", "de": "Meditativer Pilzgarten"},
    {"en": "Cow skull, repurposed as a guildhouse", "de": "Kuhschädel, umgebaut zum Zunfthaus"},
    {"en": "Mess of closely packed shanties", "de": "Wirrwarr dicht gedrängter Baracken"},
    {"en": "Neat rows of hanging wooden houses", "de": "Ordentliche Reihen hängender Holzhäuser"},
    {"en": "Ornate gate, guarded by statues", "de": "Prunkvolles Tor, bewacht von Statuen"},
    {"en": "Secret bat cult temple", "de": "Geheimer Tempel eines Fledermauskults"},
    {"en": "Beetle racing rink", "de": "Käfer-Rennbahn"},
    {"en": "Storehouse, stocked with preserves", "de": "Lagerhaus voller Vorräte"},
    {"en": "Hidden riverboat dock", "de": "Verborgener Anlegesteg für Flussboote"},
    {"en": "Crumbling marble palace, built by ancient mice", "de": "Bröckelnder Marmorpalast, von uralten Mäusen erbaut"},
    {"en": "Scavenged human machine, working", "de": "Geborgene Menschenmaschine, in Betrieb"},
    {"en": "Wooden bridge connects the settlement", "de": "Holzbrücke verbindet die Siedlung"},
    {"en": "Unnervingly tall, twisting tower", "de": "Beunruhigend hoher, gewundener Turm"},
    {"en": "Beautiful flower garden", "de": "Wunderschöner Blumengarten"},
    {"en": "Pigeon rider's roost", "de": "Schlafplatz der Taubenreiter"},
    {"en": "Overgrown statue of an ancient hero", "de": "Überwucherte Statue eines uralten Helden"},
    {"en": "Spiral stairwell, leading deep underground", "de": "Wendeltreppe, die tief in die Erde führt"}
  ],
  industry: [
    {"en": "Farmers, tending to towering crops", "de": "Bauern, die turmhohe Feldfrüchte pflegen"},
    {"en": "Woodcutters, with saws and harnesses", "de": "Holzfäller mit Sägen und Geschirren"},
    {"en": "Rough and scarred fishermice, with nets and rafts", "de": "Raue, vernarbte Fischermäuse mit Netzen und Flößen"},
    {"en": "Dark and musty mushroom farm", "de": "Dunkle, muffige Pilzfarm"},
    {"en": "Grains drying on every flat surface", "de": "Getreide trocknet auf jeder ebenen Fläche"},
    {"en": "Pungent cheese, cured for years", "de": "Scharfer Käse, jahrelang gereift"},
    {"en": "Gardens of rare herbs. Drying racks are guarded", "de": "Gärten mit seltenen Kräutern. Die Trockengestelle werden bewacht"},
    {"en": "Hive of bees and their veiled keepers", "de": "Bienenstock und seine verschleierten Imker"},
    {"en": "Merchants and traders, often in need of guards", "de": "Kaufleute und Händler, oft auf der Suche nach Wachen"},
    {"en": "Stonemasons, working a nearby quarry", "de": "Steinmetze, die einen nahen Steinbruch ausbeuten"},
    {"en": "Flour mill, driven by a large water-wheel", "de": "Getreidemühle, angetrieben von einem großen Wasserrad"},
    {"en": "Deep mine for iron, silver or tin", "de": "Tiefe Mine für Eisen, Silber oder Zinn"},
    {"en": "Keep silkworms and weave fine cloth", "de": "Halten Seidenraupen und weben feines Tuch"},
    {"en": "Expert explorers of caves and tunnels", "de": "Erfahrene Erkunder von Höhlen und Tunneln"},
    {"en": "Kiln-fired pottery, glazed in cheerful colours", "de": "Im Ofen gebrannte Töpferwaren, fröhlich glasiert"},
    {"en": "Wool mill, draped in bright cloth", "de": "Wollmühle, behängt mit bunten Stoffen"},
    {"en": "Excellent school, rowdy pupils", "de": "Ausgezeichnete Schule, lärmende Schüler"},
    {"en": "Bustling, well-stocked market", "de": "Geschäftiger, gut bestückter Markt"},
    {"en": "Smelly scavenged trash pile, carefully picked over", "de": "Stinkender, geborgener Müllhaufen, sorgfältig durchsucht"},
    {"en": "Beautiful furniture of carved and polished wood", "de": "Wunderschöne Möbel aus geschnitztem, poliertem Holz"}
  ],
  event: [
    {"en": "Disaster, everyone packing to leave", "de": "Katastrophe, alle packen zum Aufbruch"},
    {"en": "Wedding, streets decked in flowers", "de": "Hochzeit, die Straßen sind mit Blumen geschmückt"},
    {"en": "Preparing for grand seasonal feast", "de": "Vorbereitungen für ein großes Jahreszeitenfest"},
    {"en": "An illness has struck", "de": "Eine Krankheit ist ausgebrochen"},
    {"en": "Storehouse has been plundered by insects", "de": "Das Lagerhaus wurde von Insekten geplündert"},
    {"en": "Market day, farmers flock to the settlement", "de": "Markttag, die Bauern strömen in die Siedlung"},
    {"en": "Mice are at each other's throats", "de": "Die Mäuse gehen sich an die Kehle"},
    {"en": "Warband forming to defeat a beast", "de": "Eine Kriegsbande formiert sich, um eine Bestie zu besiegen"},
    {"en": "Several children have gone missing", "de": "Mehrere Kinder sind verschwunden"},
    {"en": "Noblemouse makes a frivolous demand", "de": "Die Adelsmaus stellt eine alberne Forderung"},
    {"en": "Traveling theatre troupe arrives", "de": "Eine Wandertheatertruppe trifft ein"},
    {"en": "Funeral, streets thick with smoke", "de": "Beerdigung, die Straßen sind voller Rauch"},
    {"en": "Conman whips up an irrational scheme", "de": "Ein Hochstapler heckt einen unsinnigen Plan aus"},
    {"en": "Pet beetle gone mad, attacking mice", "de": "Ein Haustierkäfer ist durchgedreht und greift Mäuse an"},
    {"en": "Faerie emissary with an impossible request", "de": "Feenbote mit einer unmöglichen Bitte"},
    {"en": "Strangely quick-growing plant nearby", "de": "In der Nähe wächst eine seltsam schnell wachsende Pflanze"},
    {"en": "Valuable heirloom has a been stolen", "de": "Ein wertvolles Erbstück wurde gestohlen"},
    {"en": "Cat lord demands a heavy tithe", "de": "Ein Katzenfürst fordert einen hohen Zehnten"},
    {"en": "Coming of age ceremony for the young mice", "de": "Feier zum Erwachsenwerden der jungen Mäuse"},
    {"en": "Wizard tower arrives on tortoise-back", "de": "Ein Zaubererturm trifft auf einem Schildkrötenrücken ein"}
  ],
};

// Namensbausteine W12: Anfang A/B + Ende A/B (die deutschen Bausteine sind eigene, keine 1:1-Uebersetzung).
export const NAME_SEEDS = {
  startA: [
    {"en": "Oaks", "de": "Eichen"},
    {"en": "Berry", "de": "Beeren"},
    {"en": "Willow", "de": "Weiden"},
    {"en": "Stump", "de": "Stumpf"},
    {"en": "Pine", "de": "Kiefern"},
    {"en": "Moon", "de": "Mond"},
    {"en": "Green", "de": "Grün"},
    {"en": "Black", "de": "Schwarz"},
    {"en": "Stone", "de": "Stein"},
    {"en": "Hill", "de": "Hügel"},
    {"en": "Fig", "de": "Feigen"},
    {"en": "Apple", "de": "Apfel"}
  ],
  startB: [
    {"en": "Swamp", "de": "Sumpf"},
    {"en": "Owl", "de": "Eulen"},
    {"en": "Fox", "de": "Fuchs"},
    {"en": "Acorn", "de": "Eichel"},
    {"en": "Copper", "de": "Kupfer"},
    {"en": "Robber", "de": "Räuber"},
    {"en": "Colby", "de": "Colby"},
    {"en": "Drain", "de": "Abfluss"},
    {"en": "Rose", "de": "Rosen"},
    {"en": "Copper", "de": "Kupfer"},
    {"en": "Friend", "de": "Freund"},
    {"en": "Trunk", "de": "Stamm"}
  ],
  endA: [
    {"en": "thorpe", "de": "dorf"},
    {"en": "ville", "de": "ville"},
    {"en": "mill", "de": "mühle"},
    {"en": "dale", "de": "tal"},
    {"en": "grove", "de": "hain"},
    {"en": "town", "de": "stadt"},
    {"en": "vale", "de": "aue"},
    {"en": "seed", "de": "saat"},
    {"en": "ashe", "de": "esch"},
    {"en": "bush", "de": "busch"},
    {"en": "stitch", "de": "stich"},
    {"en": "shine", "de": "schein"}
  ],
  endB: [
    {"en": "stand", "de": "stand"},
    {"en": "hill", "de": "hügel"},
    {"en": "tower", "de": "turm"},
    {"en": "farm", "de": "hof"},
    {"en": "bridge", "de": "brücke"},
    {"en": "gate", "de": "tor"},
    {"en": "creek", "de": "bach"},
    {"en": "pond", "de": "teich"},
    {"en": "nest", "de": "nest"},
    {"en": "ford", "de": "furt"},
    {"en": "grave", "de": "grab"},
    {"en": "burn", "de": "born"}
  ],
};

// Gasthaeuser W12. Deutsch: "Zum {a} {b}" (A steht schon im Dativ, B sind maennliche Nomen).
export const TAVERNS = {
  a: [
    {"en": "White", "de": "Weißen"},
    {"en": "Green", "de": "Grünen"},
    {"en": "Black", "de": "Schwarzen"},
    {"en": "Red", "de": "Roten"},
    {"en": "Silver", "de": "Silbernen"},
    {"en": "Crooked", "de": "Krummen"},
    {"en": "Friendly", "de": "Freundlichen"},
    {"en": "Hidden", "de": "Versteckten"},
    {"en": "Wiley", "de": "Schlauen"},
    {"en": "Glass", "de": "Gläsernen"},
    {"en": "Thorny", "de": "Dornigen"},
    {"en": "Broken", "de": "Zerbrochenen"}
  ],
  b: [
    {"en": "Beetle", "de": "Käfer"},
    {"en": "Fox", "de": "Fuchs"},
    {"en": "Wedge", "de": "Keil"},
    {"en": "Kernel", "de": "Kern"},
    {"en": "Rat", "de": "Rattenschwanz"},
    {"en": "Cheese", "de": "Käse"},
    {"en": "Eagle", "de": "Adler"},
    {"en": "Worm", "de": "Wurm"},
    {"en": "Bee", "de": "Bienenstock"},
    {"en": "Lantern", "de": "Lampion"},
    {"en": "Rose", "de": "Rosendorn"},
    {"en": "Knight", "de": "Ritter"}
  ],
  meal: [
    {"en": "Spiced baked carrot", "de": "Gewürzte gebackene Karotte"},
    {"en": "Boiled worm broth", "de": "Gekochte Wurmbrühe"},
    {"en": "Blackberry pie", "de": "Brombeerkuchen"},
    {"en": "Pungent aged cheese", "de": "Scharfer gereifter Käse"},
    {"en": "Barley porridge", "de": "Gerstenbrei"},
    {"en": "Thick river-fish steak", "de": "Dickes Flussfisch-Steak"},
    {"en": "Baked apple", "de": "Bratapfel"},
    {"en": "Fried, crumbed insect legs", "de": "Frittierte, panierte Insektenbeine"},
    {"en": "Fresh buttered bread", "de": "Frisches Butterbrot"},
    {"en": "Scavenged candy", "de": "Geborgene Süßigkeit"},
    {"en": "Honey-roasted seeds", "de": "Honiggeröstete Samen"},
    {"en": "Mushroom stew", "de": "Pilzeintopf"}
  ],
};

export const TREASURE = {
  // Haupttabelle W20; kind verweist auf die Untertabellen bzw. "pips" (W6 x mult Pips)
  main: [
    {"min": 1, "max": 1, "kind": "sword", "en": "Magic sword", "de": "Magisches Schwert"},
    {"min": 2, "max": 2, "kind": "spell", "en": "Random spell", "de": "Zufälliger Zauber"},
    {"min": 3, "max": 3, "kind": "trinket", "en": "Roll for Trinket", "de": "Würfle auf Kleinod"},
    {"min": 4, "max": 4, "kind": "valuable", "en": "Roll for Valuable treasure", "de": "Würfle auf Wertvolles"},
    {"min": 5, "max": 5, "kind": "unusual", "en": "Roll for Unusual treasure", "de": "Würfle auf Ungewöhnliches"},
    {"min": 6, "max": 8, "kind": "large", "en": "Roll for Large treasure", "de": "Würfle auf Großes"},
    {"min": 9, "max": 10, "kind": "useful", "en": "Roll for Useful treasure", "de": "Würfle auf Nützliches"},
    {"min": 11, "max": 11, "kind": "pips", "en": "Box containing d6 x 100 pips", "de": "Kiste mit W6 × 100 Pips", "mult": 100},
    {"min": 12, "max": 14, "kind": "pips", "en": "Bag containing d6 x 50 pips", "de": "Beutel mit W6 × 50 Pips", "mult": 50},
    {"min": 15, "max": 17, "kind": "pips", "en": "Purse containing d6 x 10 pips", "de": "Börse mit W6 × 10 Pips", "mult": 10},
    {"min": 18, "max": 20, "kind": "pips", "en": "Loose scattering of d6 x 5 pips", "de": "Verstreute Handvoll von W6 × 5 Pips", "mult": 5}
  ],
  trinkets: [
    {"en": "Ghost lantern (casts a light that banishes ghosts)", "de": "Geisterlaterne (wirft ein Licht, das Geister vertreibt)"},
    {"en": "Speaking shells (one speaks what the other hears)", "de": "Sprechmuscheln (die eine spricht, was die andere hört)"},
    {"en": "Breathing straw (tube that always contains air)", "de": "Atemstroh (Röhrchen, das stets Luft enthält)"},
    {"en": "Bat cultist's dagger (grants passage into sanctum)", "de": "Dolch eines Fledermauskultisten (verschafft Zutritt zum Heiligtum)"},
    {"en": "Magic beans (grow fully in d6 Turns)", "de": "Zauberbohnen (wachsen in W6 Zügen vollständig aus)"},
    {"en": "Working human device (make up something fun)", "de": "Funktionierendes Menschengerät (denk dir etwas Lustiges aus)"}
  ],
  valuable: [
    {"en": "Wheel of fine aged cheese (100p)", "de": "Rad feinen, gereiften Käses (100 p)"},
    {"en": "Silver chain (2 slots, 500p)", "de": "Silberkette (2 Plätze, 500 p)"},
    {"en": "Jeweled pendant (400p)", "de": "Juwelenanhänger (400 p)"},
    {"en": "Gold ring (500p)", "de": "Goldring (500 p)"},
    {"en": "Polished diamond (1000p)", "de": "Polierter Diamant (1000 p)"},
    {"en": "String of pearls (2 slots, 1500p)", "de": "Perlenkette (2 Plätze, 1500 p)"}
  ],
  large: [
    {"en": "Oversized silver spoon (2 slots, 300p)", "de": "Übergroßer Silberlöffel (2 Plätze, 300 p)"},
    {"en": "Ivory comb (4 slots, 400p)", "de": "Elfenbeinkamm (4 Plätze, 400 p)"},
    {"en": "Huge bottle of fine brandy (4 slots, 500p)", "de": "Riesige Flasche feinen Branntweins (4 Plätze, 500 p)"},
    {"en": "Ancient mouse statue (4 slots, 500p)", "de": "Uralte Mäusestatue (4 Plätze, 500 p)"},
    {"en": "Ancient mouse throne (6 slots, 1000p)", "de": "Uralter Mäusethron (6 Plätze, 1000 p)"},
    {"en": "Giant golden wristwatch (4 slots, 1000p)", "de": "Riesige goldene Armbanduhr (4 Plätze, 1000 p)"}
  ],
  unusual: [
    {"en": "Bundle of pungent herbs (200p to an apothecary)", "de": "Bündel scharfer Kräuter (200 p beim Apotheker)"},
    {"en": "Odd-coloured dried mushrooms (200p to a witch)", "de": "Seltsam gefärbte Trockenpilze (200 p bei einer Hexe)"},
    {"en": "Eerily glowing stone (300p to a wizard)", "de": "Unheimlich leuchtender Stein (300 p bei einem Zauberer)"},
    {"en": "Heirloom of sentimental value to a noblemouse", "de": "Erbstück mit Gefühlswert für eine Adelsmaus"},
    {"en": "Legal documents granting land rights to the holder", "de": "Urkunden, die dem Inhaber Landrechte gewähren"},
    {"en": "Treasure map", "de": "Schatzkarte"}
  ],
  useful: [
    {"en": "d6 packs of rations, well preserved", "de": "W6 Packungen gut haltbare Rationen"},
    {"en": "d6 bundles of torches", "de": "W6 Bündel Fackeln"},
    {"en": "Mundane weapon", "de": "Gewöhnliche Waffe"},
    {"en": "Mundane armour", "de": "Gewöhnliche Rüstung"},
    {"en": "Mundane utility item", "de": "Gewöhnliches Gebrauchsgut"},
    {"en": "Lost mouse, willing to help", "de": "Verirrte Maus, hilfsbereit"}
  ],
  // Waffenklasse W6 des magischen Schwerts
  swordClass: [
    {"min": 1, "max": 4, "en": "Medium (d6 one paw/d8 both paws)", "de": "Mittel (W6 einpfotig / W8 beidpfotig)"},
    {"min": 5, "max": 5, "en": "Light (d6 one paw, can be dual-wielded)", "de": "Leicht (W6 einpfotig, mit zwei Waffen führbar)"},
    {"min": 6, "max": 6, "en": "Heavy (d10 both paws)", "de": "Schwer (W10 beidpfotig)"}
  ],
  // Magische Schwerter W10
  swords: [
    {"name": {"en": "Wrought iron", "de": "Schmiedeeisen"}, "power": {"en": "While wielded: You roll critical damage Saves with Advantage", "de": "Solange geführt: Du würfelst Rettungswürfe gegen kritischen Schaden mit Vorteil"}},
    {"name": {"en": "Intricate Fae design", "de": "Filigranes Feen-Design"}, "power": {"en": "While wielded: You may disguise yourself as any mouse-sized creature", "de": "Solange geführt: Du kannst dich als beliebiges mausgroßes Wesen verkleiden"}},
    {"name": {"en": "Rusty nail", "de": "Rostiger Nagel"}, "power": {"en": "Critical damage: Give a Frightened Condition", "de": "Kritischer Schaden: Verursacht den Zustand Ängstlich"}},
    {"name": {"en": "Snake fang", "de": "Schlangenzahn"}, "power": {"en": "Critical damage: Deal d6 additional damage to DEX", "de": "Kritischer Schaden: Zusätzlich W6 Schaden auf DEX"}},
    {"name": {"en": "Toy soldier's sabre", "de": "Säbel eines Spielzeugsoldaten"}, "power": {"en": "While wielded: If you lead a warband, they have +1 Armour", "de": "Solange geführt: Führst du eine Kriegsbande an, hat sie +1 Rüstung"}},
    {"name": {"en": "Water-worn glass", "de": "Vom Wasser geschliffenes Glas"}, "power": {"en": "While wielded: You can hold breath underwater for 1 Turn", "de": "Solange geführt: Du kannst 1 Zug lang unter Wasser die Luft anhalten"}},
    {"name": {"en": "Wolf tooth", "de": "Wolfszahn"}, "power": {"en": "Critical damage: Your next attack is Enhanced", "de": "Kritischer Schaden: Dein nächster Angriff ist verstärkt"}},
    {"name": {"en": "Silver sewing needle", "de": "Silberne Nähnadel"}, "power": {"en": "Critical damage: Clear all usage dots from a non-spell item in your inventory", "de": "Kritischer Schaden: Lösche alle Nutzungspunkte eines Gegenstands (kein Zauber) in deinem Inventar"}},
    {"name": {"en": "Thorny rose stem", "de": "Dornenstiel einer Rose"}, "power": {"en": "Critical damage: Remove a Condition", "de": "Kritischer Schaden: Entferne einen Zustand"}},
    {"name": {"en": "Congealed shadow", "de": "Geronnener Schatten"}, "power": {"en": "While wielded: You are invisible when standing perfectly still", "de": "Solange geführt: Du bist unsichtbar, wenn du völlig still stehst"}}
  ],
  // Fluch W6 (1 von 6 magischen Schwertern ist verflucht) + wodurch er sich loest
  curses: [
    {"curse": {"en": "Roll critical damage saves with Disadvantage", "de": "Rettungswürfe gegen kritischen Schaden mit Nachteil"}, "lifted": {"en": "Making a selfless sacrifice in a life or death situation", "de": "Ein selbstloses Opfer in einer Situation auf Leben und Tod bringen"}},
    {"curse": {"en": "When you gain an Exhausted Condition, gain another", "de": "Erhältst du den Zustand Erschöpft, erhältst du einen weiteren"}, "lifted": {"en": "Trading places with a poor farmer for a season", "de": "Eine Saison lang mit einem armen Bauern den Platz tauschen"}},
    {"curse": {"en": "Make a WIL save to not attack when threatened", "de": "Bei Bedrohung ein WIL-Rettungswurf, um nicht anzugreifen"}, "lifted": {"en": "Making lasting peace with a mortal enemy", "de": "Dauerhaften Frieden mit einem Todfeind schließen"}},
    {"curse": {"en": "Reaction rolls are made with -1 modifier", "de": "Reaktionswürfe mit Modifikator −1"}, "lifted": {"en": "Giving away everything you own, no cheating", "de": "Alles hergeben, was du besitzt, ohne zu schummeln"}},
    {"curse": {"en": "If you see an ally take damage, take a Frightened Condition", "de": "Siehst du, wie ein Verbündeter Schaden nimmt, erhältst du den Zustand Ängstlich"}, "lifted": {"en": "Fulfilling a mouse's dying wish", "de": "Den letzten Wunsch einer sterbenden Maus erfüllen"}},
    {"curse": {"en": "Spells cast in your presence always mark usage", "de": "In deiner Nähe gewirkte Zauber markieren immer Nutzung"}, "lifted": {"en": "Destroying an owl sorcerer's source of power", "de": "Die Kraftquelle eines Eulenzauberers zerstören"}}
  ],
};
