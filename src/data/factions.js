// Beispiel-Fraktionen aus dem Mausritter-SRD 2.3.1 (CC BY 4.0, siehe Footer) fuer
// den Fraktionen-Tracker des SL (components/GmFactions.jsx). Die deutschen Texte
// sind eigene Uebersetzungen. goals: [Text, Fortschrittsmarken].

const f = (id, name, resources, goals) => ({
  id,
  name: { en: name[0], de: name[1] },
  resources: resources.map(([en, de]) => ({ en, de })),
  goals: goals.map(([en, de, max]) => ({ en, de, max })),
});

export const FACTION_PRESETS = [
  f('cat-lord', ['Cat lord', 'Katzenfürst'], [
    ['Terrifying presence', 'Furchteinflößende Präsenz'],
    ['Hired mercenaries and bandits', 'Angeheuerte Söldner und Banditen'],
    ['Exorbitant wealth', 'Unermesslicher Reichtum'],
  ], [
    ['Raise bribes from settlement', 'Bestechungsgelder von einer Siedlung eintreiben', 3],
    ['Kidnap mouse servants', 'Mäusediener entführen', 3],
    ['Subjugate a settlement', 'Eine Siedlung unterwerfen', 5],
  ]),
  f('noblemouse', ['Noblemouse', 'Adelsmaus'], [
    ['Ambitious knights', 'Ehrgeizige Ritter'],
    ['Tricky legal advocates', 'Gewiefte Rechtsberater'],
    ['Stocked storehouses', 'Gefüllte Vorratslager'],
  ], [
    ['Raise tax revenue', 'Steuereinnahmen erhöhen', 2],
    ['Acquire new land rights', 'Neue Landrechte erwerben', 3],
    ['Establish new settlement', 'Neue Siedlung gründen', 5],
  ]),
  f('tunnellers', ['Tunnellers guild', 'Gilde der Tunnelgräber'], [
    ['Rough-pawed work gangs', 'Raupfotige Arbeitertrupps'],
    ['Solidarity with working mice', 'Solidarität mit den arbeitenden Mäusen'],
  ], [
    ['Intimidate tax collector', 'Steuereintreiber einschüchtern', 2],
    ['Destroy noblemouse’s manor', 'Das Herrenhaus der Adelsmaus zerstören', 3],
    ['Establish free settlement', 'Freie Siedlung gründen', 5],
  ]),
  f('rat-bandits', ['Rat bandits', 'Rattenbanditen'], [
    ['Ruthless gang', 'Skrupellose Bande'],
    ['Secret hideout', 'Geheimes Versteck'],
  ], [
    ['Dominate a trade route', 'Eine Handelsroute beherrschen', 2],
    ['Establish protection racket', 'Schutzgelderpressung aufbauen', 3],
    ['Capture a fortress', 'Eine Festung erobern', 4],
  ]),
  f('faerie-queen', ['Faerie queen', 'Feenkönigin'], [
    ['Hidden roads and portals', 'Verborgene Wege und Portale'],
    ['Shapeshifting agents', 'Gestaltwandelnde Agenten'],
    ['Endless illusory silver', 'Endloses Trugsilber'],
  ], [
    ['Kidnap mice', 'Mäuse entführen', 2],
    ['Trick mice out of legal standing', 'Mäuse um ihren Rechtsstatus bringen', 3],
    ['Lead settlement into Fae lands', 'Eine Siedlung ins Feenland führen', 5],
  ]),
  f('owl-sorcerer', ['Owl sorcerer', 'Eulenzauberer'], [
    ['Powerful magic', 'Mächtige Magie'],
    ['Speed and fury', 'Geschwindigkeit und Zorn'],
    ['Magical servants', 'Magische Diener'],
  ], [
    ['Take scrying tower from crows', 'Den Wahrsageturm den Krähen abnehmen', 3],
    ['Locate leyline vortex', 'Den Ley-Linien-Wirbel finden', 4],
    ['Harness the vortex’s power', 'Die Kraft des Wirbels nutzbar machen', 5],
  ]),
  f('snakes', ['Clutch of snakes', 'Natternbrut'], [
    ['Silent slithering serial killers', 'Lautlose, gleitende Serienmörder'],
    ['Chilling calling cards', 'Schaurige Visitenkarten'],
  ], [
    ['Assassinate a settlement elder', 'Einen Siedlungsältesten ermorden', 3],
    ['Assassinate a noblemouse', 'Eine Adelsmaus ermorden', 4],
    ['Assassinate the queen', 'Die Königin ermorden', 5],
  ]),
  f('cultists', ['Cultists', 'Kultisten'], [
    ['Poorly-understood eldritch power', 'Kaum verstandene unheimliche Macht'],
    ['Clandestine insiders', 'Geheime Eingeweihte'],
  ], [
    ['Recruit vulnerable mice', 'Verletzliche Mäuse anwerben', 3],
    ['Steal powerful artifact', 'Mächtiges Artefakt stehlen', 3],
    ['Summon ancient god', 'Uralten Gott beschwören', 5],
  ]),
  f('frog-prince', ['Frog prince', 'Froschprinz'], [
    ['Chivalric knights', 'Ritterliche Ritter'],
    ['Hidden fortress', 'Verborgene Festung'],
  ], [
    ['Hold joust to choose a champion', 'Ein Turnier ausrichten, um einen Champion zu wählen', 3],
    ['Kidnap mouse historian', 'Mäusehistoriker entführen', 3],
    ['Find the Mug of Truth', 'Den Becher der Wahrheit finden', 6],
  ]),
  f('crows', ['Coven of crows', 'Krähenzirkel'], [
    ['Cunning corvid crones', 'Gerissene Rabenweiber'],
    ['Cawing song magic', 'Krächzende Gesangsmagie'],
    ['Soaring scrying tower', 'Aufragender Wahrsageturm'],
  ], [
    ['Kidnap a mouse farmer', 'Eine Bauernmaus entführen', 2],
    ['Capture a weather spirit', 'Einen Wettergeist einfangen', 4],
    ['Create weather machine', 'Eine Wettermaschine bauen', 5],
  ]),
];
