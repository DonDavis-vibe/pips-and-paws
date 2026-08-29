// Kreaturen aus dem Mausritter-SRD 2.3.1 (CC BY 4.0). Werte fuer den Kampf-Tracker;
// Wollen/Varianten sind absichtlich weggelassen (nur die Statblocks).
// dmg = groesster Angriffswuerfel als Zahl; label = voller Angriffstext.

export const CREATURES = [
  {
    key: 'cat', name: { de: 'Katze', en: 'Cat' }, hp: 15, armour: 1, dmg: 8,
    attack: { de: 'W6 Prankenhieb, W8 Biss', en: 'd6 swipe, d8 bite' },
    note: { de: 'Kriegsbanden-Format. STR 15, DEX 15, WIL 10.', en: 'Warband scale. STR 15, DEX 15, WIL 10.' },
  },
  {
    key: 'centipede', name: { de: 'Hundertfuesser', en: 'Centipede' }, hp: 8, armour: 1, dmg: 6,
    attack: { de: 'W6 Giftbiss (Schaden auf DEX)', en: 'd6 venomous bite (damages DEX)' },
    note: { de: 'Kritisch: Gift wirkt, W12 Schaden auf STR.', en: 'Critical: venom takes effect, d12 STR damage.' },
  },
  {
    key: 'crow', name: { de: 'Kraehe', en: 'Crow' }, hp: 12, armour: 1, dmg: 8,
    attack: { de: 'W8 Schnabelhieb', en: 'd8 peck' },
    note: { de: 'Fliegt 3x so schnell, kennt zwei Lieder.', en: 'Flies 3x speed, knows two songs.' },
  },
  {
    key: 'faerie', name: { de: 'Fee', en: 'Faerie' }, hp: 6, armour: 0, dmg: 8,
    attack: { de: 'W8 Silberrapier', en: 'd8 silver rapier' },
    note: { de: 'Kennt einen Zauber.', en: 'Knows one spell.' },
  },
  {
    key: 'frog', name: { de: 'Frosch', en: 'Frog' }, hp: 6, armour: 1, dmg: 10,
    attack: { de: 'W10 Speer oder W6 Zunge', en: 'd10 spear or d6 tongue' },
    note: { de: 'Handelt zuerst (ausser ueberrascht), springt 2x so weit. Kritisch: springt ausser Reichweite.', en: 'Goes first unless surprised, leaps 2x. Critical: leaps out of reach.' },
  },
  {
    key: 'ghost', name: { de: 'Geist', en: 'Ghost' }, hp: 9, armour: 0, dmg: 8,
    attack: { de: 'W8 eisige Beruehrung (Schaden auf WIL)', en: 'd8 chilling touch (damages WIL)' },
    note: { de: 'Nur von Silber oder magischen Waffen verletzbar. Kritisch: besetzt die Kreatur.', en: 'Only harmed by silver or magic weapons. Critical: possesses the creature.' },
  },
  {
    key: 'mouse', name: { de: 'Maus', en: 'Mouse' }, hp: 3, armour: 0, dmg: 6,
    attack: { de: 'W6 Schwert oder W6 Bogen', en: 'd6 sword or d6 bow' },
    note: { de: 'STR 9, DEX 9, WIL 9.', en: 'STR 9, DEX 9, WIL 9.' },
  },
  {
    key: 'owl', name: { de: 'Eule', en: 'Owl' }, hp: 15, armour: 1, dmg: 10,
    attack: { de: 'W10 Biss', en: 'd10 bite' },
    note: { de: 'Fliegt 3x so schnell, kennt zwei Zauber.', en: 'Flies 3x speed, knows two spells.' },
  },
  {
    key: 'rat', name: { de: 'Ratte', en: 'Rat' }, hp: 3, armour: 0, dmg: 6,
    attack: { de: 'W6 Hackmesser', en: 'd6 cleaver' },
    note: { de: 'STR 12, DEX 8, WIL 8.', en: 'STR 12, DEX 8, WIL 8.' },
  },
  {
    key: 'snake', name: { de: 'Schlange', en: 'Snake' }, hp: 12, armour: 2, dmg: 8,
    attack: { de: 'W8 Biss', en: 'd8 bite' },
    note: { de: 'Kritisch: verschlingt ganz, W4 STR-Schaden pro Runde bis Rettung.', en: 'Critical: swallow whole, d4 STR per Round until rescued.' },
  },
  {
    key: 'spider', name: { de: 'Spinne', en: 'Spider' }, hp: 6, armour: 1, dmg: 6,
    attack: { de: 'W6 Giftbiss (Schaden auf DEX)', en: 'd6 poison bite (damages DEX)' },
    note: { de: 'Kritisch: traegt im Netz davon.', en: 'Critical: carry away in web.' },
  },
];

export const CREATURE_BY_KEY = Object.fromEntries(CREATURES.map((c) => [c.key, c]));
