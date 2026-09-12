// Miethelfer (SRD "Recruiting help — Hirelings"). Bewusst schlank: Name, Art,
// TP/STR/GES/WIL, Tageslohn, Moral-Rettungswurf — kein eigenes Inventarraster
// (die SRD gibt ihnen 6 Plaetze wie einer Maus, das wuerde den Bogen aber
// sprengen; wer das braucht, traegt es in die Notiz ein).

import { rollDie, rollDice } from './dice.js';
import { newId } from './character.js';

// SRD-Empfehlungstabelle: Typ -> Tageslohn in Pips. Reine Vorbelegung beim
// Anlegen — Name/Lohn bleiben danach frei editierbar.
export const HIRELING_CATALOG = [
  { key: 'torchbearer', wage: 1, name: { de: 'Fackelträger', en: 'Torchbearer', fr: 'Porteur de torche', it: 'Portatore di torcia', ja: '松明持ち' } },
  { key: 'labourer', wage: 2, name: { de: 'Tagelöhner', en: 'Labourer', fr: 'Ouvrier', it: 'Manovale', ja: '労働者' } },
  { key: 'tunneler', wage: 5, name: { de: 'Tunnelgräber', en: 'Tunnel digger', fr: 'Creuseur de tunnel', it: 'Scavatore di gallerie', ja: '坑道掘り' } },
  { key: 'blacksmith', wage: 8, name: { de: 'Waffenschmied', en: 'Armourer/blacksmith', fr: 'Armurier/forgeron', it: 'Armaiolo/fabbro', ja: '鍛冶屋' } },
  { key: 'guide', wage: 10, name: { de: 'Ortskundiger Führer', en: 'Local guide', fr: 'Guide local', it: 'Guida locale', ja: '道案内' } },
  { key: 'mercenary', wage: 10, name: { de: 'Söldner', en: 'Mouse-at-arms', fr: 'Mercenaire', it: 'Mercenario', ja: '傭兵' } },
  { key: 'scholar', wage: 20, name: { de: 'Gelehrter', en: 'Scholar', fr: 'Érudit', it: 'Studioso', ja: '学者' } },
  { key: 'knight', wage: 25, name: { de: 'Ritter', en: 'Knight', fr: 'Chevalier', it: 'Cavaliere', ja: '騎士' } },
  { key: 'interpreter', wage: 30, name: { de: 'Dolmetscher', en: 'Interpreter', fr: 'Interprète', it: 'Interprete', ja: '通訳' } },
];

// SRD: "Typical hirelings will have: d6 hp, STR 2d6, DEX 2d6, WIL 2d6".
export function rollHirelingStats() {
  return {
    hp: rollDie(6),
    str: rollDice(2, 6).total,
    dex: rollDice(2, 6).total,
    wil: rollDice(2, 6).total,
  };
}

export function newHireling(catalogKey = '') {
  const r = rollHirelingStats();
  const cat = HIRELING_CATALOG.find((h) => h.key === catalogKey);
  return {
    id: newId('h'),
    name: '',
    kind: catalogKey,
    wage: cat?.wage ?? 0,
    hp: { current: r.hp, max: r.hp },
    str: { current: r.str, max: r.str },
    dex: { current: r.dex, max: r.dex },
    wil: { current: r.wil, max: r.wil },
    note: '',
  };
}
