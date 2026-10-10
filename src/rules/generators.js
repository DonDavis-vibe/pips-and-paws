import { rollDie } from './dice.js';
import {
  SEASONS, WEATHER, SEASONAL_EVENTS, SOCIAL_POSITION, NPC_DETAILS, ADVENTURE_SEEDS, HEX_TYPES, LANDMARKS,
  LANDMARK_DETAILS, SETTLEMENT, NAME_SEEDS, TAVERNS, TREASURE,
} from '../data/generators.js';
import { NAMES, DETAILS, BIRTHSIGNS } from '../data/tables.js';
import { SPELL_CATALOG } from '../data/items.js';

// Zufallsgeneratoren des SL nach dem Mausritter-SRD 2.3.1 (Tabellen in
// data/generators.js). Jeder Generator ist eine Liste von Feldern; ein Feld
// wuerfelt eine Tabelle und kann von frueheren Feldern abhaengen (deps), z. B.
// die Verwaltung einer Siedlung von ihrer Groesse. Ein einzelnes Feld laesst
// sich neu wuerfeln — abhaengige Felder ziehen dann nach. Texte bleiben
// zweisprachig ({ en, de }) und werden erst beim Anzeigen aufgeloest.
//
// Alle Wuerfel laufen ueber `rng(seiten)`, damit sich die Generatoren testen lassen.

const bi = (en, de = en) => ({ en, de });
const at = (table, n) => table[n - 1];
const inRange = (table, n) => table.find((r) => n >= r.min && n <= r.max) || table[table.length - 1];
const d66 = (rng) => (rng(6) - 1) * 6 + (rng(6) - 1);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const join = (parts, sep) => ({ en: parts.map((p) => p.en).join(sep), de: parts.map((p) => p.de).join(sep) });
// Fuehrender Wuerfelausdruck ("d6 packs ..." / "W6 Packungen ...") -> gewuerfelte Zahl
const rolledLead = (text, n) => ({ en: text.en.replace(/^d6\b/, String(n)), de: text.de.replace(/^W6\b/, String(n)) });

const field = (key, roll, deps = []) => ({ key, roll, deps });

// ---- Wetter & Jahreszeit ---------------------------------------------------
const weather = {
  id: 'weather',
  defaults: () => ({ season: 'spring' }),
  fieldsFor: () => [
    field('weather', (ctx, o, rng) => {
      const a = rng(6); const b = rng(6);
      const row = inRange(WEATHER[o.season], a + b);
      return { text: bi(row.en, row.de), poor: !!row.poor, rolls: [{ die: '2d6', value: a + b }] };
    }),
    field('event', (ctx, o, rng) => {
      const n = rng(6);
      const row = at(SEASONAL_EVENTS[o.season], n);
      return { text: bi(row.en, row.de), rolls: [{ die: 'd6', value: n }] };
    }),
  ],
};

// ---- Nicht-Spieler-Maus ----------------------------------------------------
const npc = {
  id: 'npc',
  defaults: () => ({}),
  fieldsFor: () => [
    field('name', (ctx, o, rng) => ({ text: bi(NAMES[rng(NAMES.length) - 1]) })),
    field('position', (ctx, o, rng) => {
      const n = rng(6);
      const row = at(SOCIAL_POSITION, n);
      const [sides, mult] = row.pay;
      const pay = rng(sides) * mult;
      return {
        text: bi(`${row.en} — payment for service: ${pay}p`, `${row.de} — Bezahlung für Dienste: ${pay} p`),
        rolls: [{ die: 'd6', value: n }],
      };
    }),
    field('birthsign', (ctx, o, rng) => {
      const n = rng(6);
      const b = at(BIRTHSIGNS, n);
      return { text: bi(`${b.sign.en} — ${b.disposition.en}`, `${b.sign.de} — ${b.disposition.de}`), rolls: [{ die: 'd6', value: n }] };
    }),
    ...['appearance', 'quirk', 'wants', 'relationship'].map((k) => field(k, (ctx, o, rng) => {
      const n = rng(20);
      const row = at(NPC_DETAILS[k], n);
      return { text: bi(row.en, row.de), rolls: [{ die: 'd20', value: n }] };
    })),
    field('trait', (ctx, o, rng) => {
      const i = d66(rng);
      return { text: bi(DETAILS[i].en, DETAILS[i].de), rolls: [{ die: 'd66', value: i + 1 }] };
    }),
  ],
};

// ---- Abenteuer-Idee --------------------------------------------------------
// Standard: EIN d66-Wurf, quer gelesen. split = jede Spalte einzeln wuerfeln.
const seed = {
  id: 'seed',
  defaults: () => ({ split: false }),
  fieldsFor: () => ['creature', 'problem', 'complication'].map((k) => field(k, (ctx, o, rng, single) => {
    let i;
    if (single || o.split) i = d66(rng);
    else { if (ctx.__row === undefined) ctx.__row = d66(rng); i = ctx.__row; }
    const row = ADVENTURE_SEEDS[i][k];
    return { text: bi(row.en, row.de), rolls: [{ die: 'd66', value: ADVENTURE_SEEDS[i].d66 }] };
  })),
};

// ---- Hex -------------------------------------------------------------------
const hex = {
  id: 'hex',
  defaults: () => ({}),
  fieldsFor: () => [
    field('type', (ctx, o, rng) => {
      const n = rng(6);
      const row = inRange(HEX_TYPES, n);
      return { text: bi(row.en, row.de), raw: row.key, rolls: [{ die: 'd6', value: n }] };
    }),
    field('landmark', (ctx, o, rng) => {
      const n = rng(20);
      const row = at(LANDMARKS[ctx.type.raw], n);
      return { text: bi(row.en, row.de), rolls: [{ die: 'd20', value: n }] };
    }, ['type']),
    field('detail', (ctx, o, rng) => {
      const g = rng(6);
      if (g === 1) {
        const row = LANDMARK_DETAILS[1][0];
        return { text: bi(row.en, row.de), flag: 'settlement', rolls: [{ die: 'd6', value: 1 }] };
      }
      const e = rng(8);
      const row = at(LANDMARK_DETAILS[g], e);
      return { text: bi(row.en, row.de), rolls: [{ die: 'd6', value: g }, { die: 'd8', value: e }] };
    }),
  ],
};

// ---- Siedlung --------------------------------------------------------------
const rollList = (table, n, rng) => Array.from({ length: n }, () => at(table, rng(20))).map((r) => bi(r.en, r.de));
const settlement = {
  id: 'settlement',
  defaults: () => ({}),
  fieldsFor: () => [
    field('size', (ctx, o, rng) => {
      const a = rng(6); const b = rng(6);
      const n = Math.min(a, b);
      const row = at(SETTLEMENT.size, n);
      return { text: bi(row.en, row.de), raw: n, rolls: [{ die: '2d6', value: `${a}/${b} → ${n}` }] };
    }),
    field('governance', (ctx, o, rng) => {
      const n = rng(6);
      const total = n + ctx.size.raw;
      const row = inRange(SETTLEMENT.governance, total);
      return { text: bi(row.en, row.de), rolls: [{ die: 'd6', value: `${n}+${ctx.size.raw}` }] };
    }, ['size']),
    field('inhabitants', (ctx, o, rng) => {
      const n = rng(20);
      const row = at(SETTLEMENT.inhabitants, n);
      return { text: bi(row.en, row.de), rolls: [{ die: 'd20', value: n }] };
    }),
    // Staedte (Stufe 6) haben zwei Besonderheiten, Staedte und Grossstaedte zwei Gewerbe.
    field('feature', (ctx, o, rng) => ({ text: join(rollList(SETTLEMENT.feature, ctx.size.raw === 6 ? 2 : 1, rng), '; ') }), ['size']),
    field('industry', (ctx, o, rng) => ({ text: join(rollList(SETTLEMENT.industry, ctx.size.raw >= 5 ? 2 : 1, rng), '; ') }), ['size']),
    field('event', (ctx, o, rng) => {
      const n = rng(20);
      const row = at(SETTLEMENT.event, n);
      return { text: bi(row.en, row.de), rolls: [{ die: 'd20', value: n }] };
    }),
    field('name', (ctx, o, rng) => {
      const startCol = rng(2) === 1 ? 'startA' : 'startB';
      const endCol = rng(2) === 1 ? 'endA' : 'endB';
      const s = at(NAME_SEEDS[startCol], rng(12));
      const e = at(NAME_SEEDS[endCol], rng(12));
      return { text: bi(cap(`${s.en}${e.en}`), cap(`${s.de}${e.de}`)) };
    }),
    // Weiler und groesser haben ein Gasthaus.
    field('tavern', (ctx, o, rng) => {
      if (ctx.size.raw < 3) return null;
      const a = at(TAVERNS.a, rng(12));
      const b = at(TAVERNS.b, rng(12));
      const meal = at(TAVERNS.meal, rng(12));
      return {
        text: bi(`The ${a.en} ${b.en} — specialty: ${meal.en}`, `Zum ${a.de} ${b.de} — Spezialität: ${meal.de}`),
      };
    }, ['size']),
  ],
};

// ---- Schatz ----------------------------------------------------------------
const PIP_LEAD = {
  100: [bi('Box containing', 'Kiste mit')], 50: [bi('Bag containing', 'Beutel mit')],
  10: [bi('Purse containing', 'Börse mit')], 5: [bi('Loose scattering of', 'Verstreute Handvoll von')],
};

function resolveTreasure(row, rng) {
  switch (row.kind) {
    case 'sword': {
      const cls = inRange(TREASURE.swordClass, rng(6));
      const sw = at(TREASURE.swords, rng(10));
      const cursed = rng(6) === 1;
      const base = {
        en: `${row.en}: ${sw.name.en} — ${cls.en} — ${sw.power.en}`,
        de: `${row.de}: ${sw.name.de} — ${cls.de} — ${sw.power.de}`,
      };
      if (!cursed) return base;
      const c = at(TREASURE.curses, rng(6));
      return {
        en: `${base.en}. CURSED (no power until lifted): ${c.curse.en}. Lifted by: ${c.lifted.en}`,
        de: `${base.de}. VERFLUCHT (keine Kraft, bis der Fluch gelöst ist): ${c.curse.de}. Gelöst durch: ${c.lifted.de}`,
      };
    }
    case 'spell': {
      const keys = Object.keys(SPELL_CATALOG);
      const sp = SPELL_CATALOG[keys[rng(keys.length) - 1]].name;
      return bi(`${row.en}: ${sp.en}`, `${row.de}: ${sp.de}`);
    }
    case 'pips': {
      const total = rng(6) * row.mult;
      const lead = PIP_LEAD[row.mult][0];
      return bi(`${lead.en} ${total} pips`, `${lead.de} ${total} Pips`);
    }
    default: {
      const sub = { trinket: 'trinkets', valuable: 'valuable', unusual: 'unusual', large: 'large', useful: 'useful' }[row.kind];
      const n = rng(6);
      const r = at(TREASURE[sub], n);
      const t = rolledLead(bi(r.en, r.de), rng(6));
      return bi(`${row.en.replace(/^Roll for /, '')}: ${t.en}`, `${row.de.replace(/^Würfle auf /, '')}: ${t.de}`);
    }
  }
}

const treasure = {
  id: 'treasure',
  // bonus: zusaetzliche W20 je zutreffender Frage (SRD: bis zu 4)
  defaults: () => ({ bonus: 0 }),
  fieldsFor: (o) => Array.from({ length: 2 + o.bonus }, (_, i) => field(`t${i}`, (ctx, opts, rng) => {
    const n = rng(20);
    return { text: resolveTreasure(inRange(TREASURE.main, n), rng), rolls: [{ die: 'd20', value: n }] };
  })),
};

export const GENERATORS = [weather, npc, seed, hex, settlement, treasure];
export const GENERATOR_BY_ID = Object.fromEntries(GENERATORS.map((g) => [g.id, g]));
export { SEASONS };

function compute(gen, opts, rng, prev, dirty, single) {
  const fields = gen.fieldsFor(opts);
  const out = {};
  const ctx = {};
  fields.forEach((f) => {
    const stale = !prev || !(f.key in prev) || dirty.has(f.key) || f.deps.some((d) => dirty.has(d));
    if (stale) {
      out[f.key] = f.roll(ctx, opts, rng, single === f.key);
      if (prev) dirty.add(f.key);
    } else {
      out[f.key] = prev[f.key];
    }
    ctx[f.key] = out[f.key];
  });
  return { order: fields.map((f) => f.key), fields: out };
}

export function runGenerator(id, opts, rng = rollDie) {
  const gen = GENERATOR_BY_ID[id];
  const o = { ...gen.defaults(), ...opts };
  return { id, opts: o, ...compute(gen, o, rng, null, new Set(), null) };
}

// Ein Feld neu wuerfeln; Felder, die davon abhaengen, ziehen nach.
export function rerollField(result, key, rng = rollDie) {
  const gen = GENERATOR_BY_ID[result.id];
  const dirty = new Set([key]);
  return { ...result, ...compute(gen, result.opts, rng, result.fields, dirty, key) };
}
