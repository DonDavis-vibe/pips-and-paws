// Kreaturen aus dem Mausritter-SRD 2.3.1 (CC BY 4.0). Werte fuer den Kampf-Tracker;
// Wollen/Varianten sind absichtlich weggelassen (nur die Statblocks).
// dmg = groesster Angriffswuerfel als Zahl; label = voller Angriffstext.

export const CREATURES = [
  {
    key: 'cat', name: { de: 'Katze', en: 'Cat', es: 'Gato' }, hp: 15, armour: 1, dmg: 8, wil: 10,
    attack: { de: 'W6 Prankenhieb, W8 Biss', en: 'd6 swipe, d8 bite', es: 'd6 arañazo, d8 mordida' },
    note: { de: 'Kriegsbanden-Format. STR 15, DEX 15, WIL 10.', en: 'Warband scale. STR 15, DEX 15, WIL 10.', es: 'Escalado para compañías. FUE 15, DES 15, VOL 10.' },
  },
  {
    key: 'centipede', name: { de: 'Hundertfüßer', en: 'Centipede', es: 'Ciempiés' }, hp: 8, armour: 1, dmg: 6, wil: 8,
    attack: { de: 'W6 Giftbiss (Schaden auf DEX)', en: 'd6 venomous bite (damages DEX)', es: 'd6 mordisco venenoso (daña DES)' },
    note: { de: 'Kritisch: Gift wirkt, W12 Schaden auf STR.', en: 'Critical: venom takes effect, d12 STR damage.', es: 'Crítico: el veneno hace efecto, d12 de daño a FUE.' },
  },
  {
    key: 'crow', name: { de: 'Krähe', en: 'Crow', es: 'Cuervo' }, hp: 12, armour: 1, dmg: 8, wil: 15,
    attack: { de: 'W8 Schnabelhieb', en: 'd8 peck', es: 'd8 picotazo' },
    note: { de: 'Fliegt 3x so schnell, kennt zwei Lieder.', en: 'Flies 3x speed, knows two songs.', es: 'Vuela 3x mas rápido, conoce dos canciones.' },
  },
  {
    key: 'faerie', name: { de: 'Fee', en: 'Faerie', es: 'Hada' }, hp: 6, armour: 0, dmg: 8, wil: 15,
    attack: { de: 'W8 Silberrapier', en: 'd8 silver rapier', es: 'd8 estocada de plata' },
    note: { de: 'Kennt einen Zauber.', en: 'Knows one spell.', es: 'Conoce un hechizo.' },
  },
  {
    key: 'frog', name: { de: 'Frosch', en: 'Frog', es: 'Rana' }, hp: 6, armour: 1, dmg: 10, wil: 9,
    attack: { de: 'W10 Speer oder W6 Zunge', en: 'd10 spear or d6 tongue', es: 'd10 lanza o d6 lengua' },
    note: { de: 'Handelt zuerst (außer überrascht), springt 2x so weit. Kritisch: springt außer Reichweite.', en: 'Goes first unless surprised, leaps 2x. Critical: leaps out of reach.', es: 'Siempre actúa primero excepto ataques sorpresa. Salta al doble de la velocidad normal. Crítico: salta fuera de alcance.' },
  },
  {
    key: 'ghost', name: { de: 'Geist', en: 'Ghost', es: 'Fantasma' }, hp: 9, armour: 0, dmg: 8, wil: 10,
    attack: { de: 'W8 eisige Berührung (Schaden auf WIL)', en: 'd8 chilling touch (damages WIL)', es: 'd8 toque gélido (daña VOL)' },
    note: { de: 'Nur von Silber oder magischen Waffen verletzbar. Kritisch: besetzt die Kreatur.', en: 'Only harmed by silver or magic weapons. Critical: possesses the creature.', es: 'Solo puede ser dañado por plata o armas mágicas. Crítico: posee a la criatura.' },
  },
  {
    key: 'mouse', name: { de: 'Maus', en: 'Mouse', es: 'Ratón' }, hp: 3, armour: 0, dmg: 6, wil: 9,
    attack: { de: 'W6 Schwert oder W6 Bogen', en: 'd6 sword or d6 bow', es: 'd6 espada o d6 arco' },
    note: { de: 'STR 9, DEX 9, WIL 9.', en: 'STR 9, DEX 9, WIL 9.', es: 'FUE 9, DES 9, VOL 9.' },
  },
  {
    key: 'owl', name: { de: 'Eule', en: 'Owl', es: 'Búho' }, hp: 15, armour: 1, dmg: 10, wil: 15,
    attack: { de: 'W10 Biss', en: 'd10 bite', es: 'd10 mordida' },
    note: { de: 'Fliegt 3x so schnell, kennt zwei Zauber.', en: 'Flies 3x speed, knows two spells.', es: 'Vuela a 3 veces la velocidad normal. Conoce 2 hechizos.' },
  },
  {
    key: 'rat', name: { de: 'Ratte', en: 'Rat', es: 'Rata' }, hp: 3, armour: 0, dmg: 6, wil: 8,
    attack: { de: 'W6 Hackmesser', en: 'd6 cleaver', es: 'd6 machete' },
    note: { de: 'STR 12, DEX 8, WIL 8.', en: 'STR 12, DEX 8, WIL 8.', es: 'FUE 12, DES 8, VOL 8.' },
  },
  {
    key: 'snake', name: { de: 'Schlange', en: 'Snake', es: 'Serpiente' }, hp: 12, armour: 2, dmg: 8, wil: 10,
    attack: { de: 'W8 Biss', en: 'd8 bite', es: 'd8 mordida' },
    note: { de: 'Kritisch: verschlingt ganz, W4 STR-Schaden pro Runde bis Rettung.', en: 'Critical: swallow whole, d4 STR per Round until rescued.', es: 'Crítico: Tragar, 1d4 de daño a FUE por ronda, hasta ser rescatado o escapar.' },
  },
  {
    key: 'spider', name: { de: 'Spinne', en: 'Spider', es: 'Araña' }, hp: 6, armour: 1, dmg: 6, wil: 10,
    attack: { de: 'W6 Giftbiss (Schaden auf DEX)', en: 'd6 poison bite (damages DEX)', es: 'd6 mordisco venenoso (daña DES en lugar de FUE)' },
    note: { de: 'Kritisch: trägt im Netz davon.', en: 'Critical: carry away in web.', es: 'Crítico: Se lleva a la criatura atrapada en su telaraña.' },
  },
];

export const CREATURE_BY_KEY = Object.fromEntries(CREATURES.map((c) => [c.key, c]));
