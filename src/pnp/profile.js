import pkg from '../../package.json';
import { CREATURES } from '../data/creatures.js';
import { FX_KINDS } from '../utils/sound.js';
import { loc } from '../i18n/index.jsx';
import { PROTOCOL } from './client.js';

export const DICE_SIDES = ['4', '6', '8', '10', '12'];

// Was Pips & Paws von PenNodePaper empfangen kann und wie ein Mausritter-Bogen
// aufgebaut ist. PenNodePaper baut daraus sein Formular, validiert Eingaben und
// briefet die KI (Beschreibungen sind deshalb englisch + knapp, Beschriftungen
// folgen der Sprache des SL).
export function buildProfile(t, lang) {
  const text = (key, label, group, extra) => ({ key, label, type: 'text', group, ...extra });
  const longtext = (key, label, group, extra) => ({ key, label, type: 'longtext', group, ...extra });
  const num = (key, label, group, extra) => ({ key, label, type: 'number', group, ...extra });
  const tags = (key, label, group) => ({ key, label, type: 'tags', group });

  const stats = t('pnp.group.stats');
  const person = t('pnp.group.person');
  const gear = t('pnp.group.gear');

  const presets = CREATURES.map((c) => ({
    id: c.key,
    label: loc(c.name, lang),
    values: {
      hp: c.hp, armour: c.armour, dmg: String(c.dmg), wil: c.wil, attack: loc(c.attack, lang),
    },
    ranges: { hp: [Math.max(1, c.hp - 3), c.hp + 3] },
    help: loc(c.note, lang),
  }));

  return {
    id: 'pips-and-paws',
    name: 'Pips & Paws (Mausritter)',
    version: pkg.version,
    protocol: PROTOCOL,
    push: {
      handout: { text: true, image: true, toPlayer: true },
      scene: { grids: ['square'], tokens: true },
      character: {},
      music_cue: { tracks: true, mood: true },
    },
    provides: { party: true },
    requests: ['tracks', 'party'],
    images: { maxBytes: 8000000, formats: ['png', 'jpg', 'webp'] },
    characters: {
      roles: [
        {
          id: 'creature',
          label: t('pnp.role.creature'),
          description: 'A creature or opponent of the Mausritter combat tracker (hit protection, armour, one attack die, WIL for morale). Mausritter has no full sheets for monsters: keep it to the stat block; special abilities go into "special". NPCs without combat relevance may keep the defaults.',
          for: ['enemy', 'npc'],
          fields: [
            num('hp', t('res.hp'), stats, { min: 1, max: 200, default: 3, help: 'Hit protection (HP). Mice have 1-6, a cat 15.' }),
            num('armour', t('item.defense'), stats, { min: 0, max: 3, default: 0, help: 'Armour value 0-3, subtracted from incoming damage.' }),
            {
              key: 'dmg', label: t('item.damage'), type: 'select', group: stats, default: '6',
              options: DICE_SIDES.map((s) => ({ value: s, label: `${t('dice.dieLetter')}${s}` })),
              help: 'Largest attack die. Rolled by the "Attack" button of the combat tracker.',
            },
            num('wil', t('attr.wil'), stats, { min: 1, max: 20, default: 8, help: 'WIL for the morale save (d20 at or under = holds).' }),
            num('str', t('attr.str'), stats, { min: 1, max: 20, help: 'Optional. Shown in the note only.' }),
            num('dex', t('attr.dex'), stats, { min: 1, max: 20, help: 'Optional. Shown in the note only.' }),
            text('attack', t('combat.attack'), stats, { help: 'Attack description, e.g. "d6 swipe, d8 bite".' }),
            longtext('special', t('pnp.field.special'), stats, { help: 'Critical effects and special abilities, e.g. "Flies 3x speed, knows two spells".' }),
          ],
          presets,
        },
        {
          id: 'pc',
          label: t('pnp.role.pc'),
          description: 'The sheet of a connected mouse (read-only: public fields, no notes).',
          for: ['pc'],
          portrait: true,
          fields: [
            text('background', t('sheet.background'), person),
            text('birthsign', t('sheet.birthsign'), person),
            text('disposition', t('sheet.disposition'), person),
            text('coat', t('sheet.coat'), person),
            text('detail', t('sheet.detail'), person),
            num('level', t('res.level'), stats),
            num('hpCurrent', t('res.hp'), stats),
            num('hpMax', `${t('res.hp')} ${t('attr.max')}`, stats),
            num('str', t('attr.str'), stats),
            num('strMax', `${t('attr.str')} ${t('attr.max')}`, stats),
            num('dex', t('attr.dex'), stats),
            num('dexMax', `${t('attr.dex')} ${t('attr.max')}`, stats),
            num('wil', t('attr.wil'), stats),
            num('wilMax', `${t('attr.wil')} ${t('attr.max')}`, stats),
            num('pips', t('res.pips'), gear),
            tags('conditions', t('inv.tab.condition'), stats),
            tags('items', t('inv.title'), gear),
            tags('hirelings', t('hirelings.title'), gear),
          ],
        },
      ],
    },
  };
}

// Musik-Stichworte -> eingebaute Effekte. Die Effekte sind kurz (kein Loop);
// laengere Musik/Ambient kommt aus den eigenen Uploads des SL (siehe GmSoundboard).
const MOODS = [
  [/triumph|victor|sieg|celebrat|feier|fanfare|festiv/, 'fanfare'],
  [/tens|suspens|dread|ominous|unheimlich|bedroh|danger|gefahr|boss|climax|finale|horror|creep/, 'dramatic'],
  [/battle|combat|fight|kampf|action|duel/, 'blade'],
  [/treasure|schatz|coin|m(ü|ue)nz|market|markt|merchant|h(ä|ae)ndler|shop/, 'coins'],
  [/door|t(ü|ue)r|enter|betret|tavern|inn\b|kneipe|wirtshaus|taverne/, 'door'],
  [/trap|falle|lock|riegel|prison|gef(ä|ae)ngnis/, 'bolt'],
  [/bell|glocke|alarm|warn|announce|ansage|calm|ruhig|peace/, 'bell'],
];

export function fxForMood(mood) {
  const m = String(mood || '').toLowerCase();
  const hit = MOODS.find(([re]) => re.test(m));
  return hit ? hit[1] : null;
}

export const isFxKind = (id) => FX_KINDS.includes(id);
