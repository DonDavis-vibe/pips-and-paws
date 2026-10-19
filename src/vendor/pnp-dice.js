/*!
 * PnpDice 0.2.0 – Würfel-Plugin für Pen-&-Paper-Webapps
 * Animierte 3D-Würfel, Würfel-Log, eigene Würfel. Keine Abhängigkeiten, keine
 * externen Aufrufe (keine CDNs, keine Webfonts). Lizenz: MIT.
 *
 *   <script src="pnp-dice.js"></script>
 *   PnpDice.mount('#wuerfel');                    // komplettes Würfel-Tool
 *   PnpDice.roll('3w20+2').then(r => r.total);    // nur werfen, 3D-Würfel über der Seite
 *
 * Aufbau der Datei:
 *   1. Sprache, Konfiguration, Ereignisse
 *   2. Würfel-Engine: Formel-Parser, Zufall, eigene Würfel, Auswertung
 *   3. 3D: Körper, Physik (vorab berechnet), Zeichnen auf Canvas, Geräusche
 *   4. Würfel-Tool (Widget im Shadow DOM) und data-pnp-roll-Bindung
 */
(function (root) {
  'use strict';

  const VERSION = '0.2.0';
  const hasDOM = typeof window !== 'undefined' && typeof document !== 'undefined';

  // =========================================================================
  // 1. Sprache, Konfiguration, Ereignisse
  // =========================================================================

  const I18N = {
    de: {
      letter: 'W',
      title: 'Würfel Tool',
      roll: 'Würfeln',
      modifier: 'Bonus/Malus',
      rolled: 'Gewürfelt',
      rolling: 'Würfel rollen …',
      lastRolls: 'Letzte Würfe',
      clear: 'Log leeren',
      empty: 'Noch keine Würfe',
      placeholder: '3w20+2',
      customDice: 'Eigene Würfel',
      newDie: 'Neuer Würfel',
      dieName: 'Name, z. B. Treffer',
      dieFaces: 'Seiten mit Komma, z. B. 💥, 💥, ⭐, –, –, –',
      dieColor: 'Farbe',
      save: 'Speichern',
      cancel: 'Abbrechen',
      remove: 'Entfernen',
      pin: 'Formel als Favorit speichern',
      sound: 'Würfelgeräusche',
      anim: '3D-Würfel',
      help: 'Hilfe zur Würfelformel',
      collapse: 'Ein-/Ausklappen',
      crit: 'Kritisch!',
      fumble: 'Patzer!',
      entryHint: 'Klicken: nochmal würfeln · Ziehen: als Text einfügen',
      quickHint: 'Klicken: würfeln · Umschalt- oder Rechtsklick: zur Formel hinzufügen',
      successes: n => (Math.abs(n) === 1 ? 'Erfolg' : 'Erfolge'),
      ago(sec, short) {
        if (sec < 2) return 'gerade eben';
        if (sec < 60) return short ? `vor ${sec} Sek` : `vor ${sec} Sekunden`;
        const m = Math.floor(sec / 60);
        if (m < 60) return short ? `vor ${m} Min` : `vor ${m} Minute${m > 1 ? 'n' : ''}`;
        const h = Math.floor(m / 60);
        return short ? `vor ${h} Std` : `vor ${h} Stunde${h > 1 ? 'n' : ''}`;
      },
      helpRows: [
        ['3w20', 'drei W20, Summe'],
        ['2w6+3', 'Summe plus 3'],
        ['4w6kh3', 'die 3 höchsten behalten (kl: niedrigste)'],
        ['2w20kh1', 'Vorteil, 2w20kl1 Nachteil'],
        ['4w6dl1', 'den niedrigsten entfernen'],
        ['3w6!', 'explodierend: Maximum würfelt nochmal'],
        ['1w20r1', 'eine 1 einmal neu würfeln (r<3 …)'],
        ['12w6>=5', 'Erfolge zählen (Würfelpool)'],
        ['4wF', 'Fudge-/FATE-Würfel'],
        ['1w%', 'Prozentwurf, wie 1w100'],
        ['2w{Name}', 'eigener Würfel'],
        ['1w[Kopf,Zahl]', 'Seiten direkt angeben'],
        ['1w20+5 # Angriff', 'mit Beschriftung'],
      ],
      helpNote: 'Statt w geht auch d. Umschalt-Klick auf einen Würfel fügt ihn der Formel hinzu, Pfeil ↑ im Feld holt die letzte Formel.',
      err: {
        empty: 'Bitte einen Wurf eingeben, z. B. 3w20+2',
        syntax: (pos, ch) => (ch ? `Unerwartetes „${ch}“ an Stelle ${pos}` : 'Die Formel endet zu früh'),
        count: 'Pro Gruppe gehen 1 bis 100 Würfel',
        sides: 'Ein Würfel braucht 1 bis 10000 Seiten',
        unknown: n => `Unbekannter Würfel „${n}“`,
        keep: 'Es können nicht mehr Würfel behalten oder entfernt werden, als geworfen werden',
        explode: 'Explodieren geht nur mit Zahlenwürfeln ab 2 Seiten',
        terms: 'Die Formel ist zu lang',
        faces: 'Ein eigener Würfel braucht mindestens 2 Seiten',
        name: 'Der Würfel braucht einen Namen',
      },
    },
    en: {
      letter: 'd',
      title: 'Dice Roller',
      roll: 'Roll',
      modifier: 'Bonus/Penalty',
      rolled: 'Rolled',
      rolling: 'Rolling …',
      lastRolls: 'Recent rolls',
      clear: 'Clear log',
      empty: 'No rolls yet',
      placeholder: '3d20+2',
      customDice: 'Custom dice',
      newDie: 'New die',
      dieName: 'Name, e.g. Hit',
      dieFaces: 'Faces, comma separated, e.g. 💥, 💥, ⭐, –, –, –',
      dieColor: 'Colour',
      save: 'Save',
      cancel: 'Cancel',
      remove: 'Remove',
      pin: 'Save formula as favourite',
      sound: 'Dice sounds',
      anim: '3D dice',
      help: 'Formula help',
      collapse: 'Collapse/expand',
      crit: 'Critical!',
      fumble: 'Fumble!',
      entryHint: 'Click: roll again · Drag: insert as text',
      quickHint: 'Click: roll · Shift or right click: add to formula',
      successes: n => (Math.abs(n) === 1 ? 'success' : 'successes'),
      ago(sec, short) {
        if (sec < 2) return 'just now';
        if (sec < 60) return short ? `${sec}s ago` : `${sec} seconds ago`;
        const m = Math.floor(sec / 60);
        if (m < 60) return short ? `${m}m ago` : `${m} minute${m > 1 ? 's' : ''} ago`;
        const h = Math.floor(m / 60);
        return short ? `${h}h ago` : `${h} hour${h > 1 ? 's' : ''} ago`;
      },
      helpRows: [
        ['3d20', 'three d20, summed'],
        ['2d6+3', 'sum plus 3'],
        ['4d6kh3', 'keep the 3 highest (kl: lowest)'],
        ['2d20kh1', 'advantage, 2d20kl1 disadvantage'],
        ['4d6dl1', 'drop the lowest'],
        ['3d6!', 'exploding: max rolls again'],
        ['1d20r1', 'reroll a 1 once (r<3 …)'],
        ['12d6>=5', 'count successes (dice pool)'],
        ['4dF', 'Fudge/FATE dice'],
        ['1d%', 'percentile, same as 1d100'],
        ['2d{Name}', 'custom die'],
        ['1d[Heads,Tails]', 'inline faces'],
        ['1d20+5 # Attack', 'with a label'],
      ],
      helpNote: 'w works as well as d. Shift-click a die to add it to the formula, arrow ↑ in the field recalls the last formula.',
      err: {
        empty: 'Please enter a roll, e.g. 3d20+2',
        syntax: (pos, ch) => (ch ? `Unexpected "${ch}" at position ${pos}` : 'The formula ends too early'),
        count: 'A group can have 1 to 100 dice',
        sides: 'A die needs 1 to 10000 sides',
        unknown: n => `Unknown die "${n}"`,
        keep: 'Cannot keep or drop more dice than are rolled',
        explode: 'Only numeric dice with 2+ sides can explode',
        terms: 'The formula is too long',
        faces: 'A custom die needs at least 2 faces',
        name: 'The die needs a name',
      },
    },
  };

  function resolveLang(lang) {
    if (lang && lang !== 'auto' && I18N[lang]) return lang;
    const nav = hasDOM && navigator.language ? navigator.language.slice(0, 2).toLowerCase() : 'de';
    return I18N[nav] ? nav : 'en';
  }
  const tr = lang => I18N[resolveLang(lang)];

  const DEFAULT_COLORS = {
    2: '#64748b', 3: '#0ea5e9', 4: '#16a34a', 6: '#f59e0b', 8: '#0891b2', 10: '#7c3aed',
    12: '#db2777', 20: '#dc2626', 100: '#6d28d9', custom: '#0d9488', fudge: '#475569',
  };
  const EXTRA_COLORS = ['#2563eb', '#ea580c', '#65a30d', '#9333ea', '#0f766e', '#be123c'];

  const config = {
    lang: 'auto',        // 'de' | 'en' | 'auto'
    animate: 'auto',     // true | false | 'auto' (respektiert prefers-reduced-motion)
    sound: false,
    volume: 0.6,
    tray: 'overlay',     // 'overlay' | Element | CSS-Selektor | Tray | false
    holdMs: null,        // Standzeit nach dem Liegenbleiben; null = Overlay 2600 ms, Container für immer
    dieSize: 38,         // größter Würfelradius in px
    maxDice: 30,         // mehr Würfel werden ausgewertet, aber nicht animiert
    showTotal: true,     // Ergebnis-Plakette über den liegenden Würfeln
    colors: Object.assign({}, DEFAULT_COLORS),
    crit: null,          // function(result) -> 'crit' | 'fumble' | null, überschreibt die Standardregel
    rng: null,           // function(max) -> 1..max, z. B. PnpDice.createRng('seed')
  };

  function configure(opts) {
    if (!opts) return config;
    for (const k of Object.keys(opts)) {
      if (k === 'colors') Object.assign(config.colors, opts.colors);
      else config[k] = opts[k];
    }
    return config;
  }

  const listeners = {};
  function on(type, fn) {
    (listeners[type] = listeners[type] || []).push(fn);
    return () => off(type, fn);
  }
  function off(type, fn) {
    const l = listeners[type];
    if (l) listeners[type] = l.filter(f => f !== fn);
  }
  function emit(type, payload) {
    (listeners[type] || []).slice().forEach(fn => {
      try { fn(payload); } catch (e) { console.error('[PnpDice]', e); }
    });
  }

  // =========================================================================
  // 2. Würfel-Engine
  // =========================================================================

  class DiceError extends Error {
    constructor(code, message, pos) {
      super(message);
      this.name = 'PnpDiceError';
      this.code = code;
      this.pos = pos;
    }
  }

  // Gleichverteilte Zahl 1..max. crypto mit Verwerfen statt Modulo, damit
  // große Würfel nicht leicht zu den kleinen Zahlen hin kippen.
  function cryptoRng(max) {
    const c = root.crypto;
    if (c && c.getRandomValues) {
      const buf = new Uint32Array(1);
      const limit = Math.floor(0x100000000 / max) * max;
      let x;
      do { c.getRandomValues(buf); x = buf[0]; } while (x >= limit);
      return (x % max) + 1;
    }
    return Math.floor(Math.random() * max) + 1;
  }

  /**
   * Zufall mit vorgegebenen Werten, in der Reihenfolge der Aufrufe: damit lässt sich ein Ergebnis, das die App schon
   * ausgewürfelt hat, mit den 3D-Würfeln zeigen (PnpDice.roll('1w100', { rng: PnpDice.fixedRng([37]) })). Jeder Wert
   * wird auf 1..max begrenzt. Sind die Werte aufgebraucht, würfelt `rest` (Standard: zufällig) weiter.
   */
  function fixedRng(values, rest) {
    const list = Array.isArray(values) ? values.slice() : [];
    const weiter = typeof rest === 'function' ? rest : cryptoRng;
    return function (max) {
      if (!list.length) return weiter(max);
      const v = Math.trunc(Number(list.shift()));
      return Math.min(max, Math.max(1, Number.isFinite(v) ? v : 1));
    };
  }

  // Reproduzierbarer Zufall (mulberry32) für Tests, Replays oder geteilte Seeds.
  function createRng(seed) {
    let a = 0;
    const s = String(seed == null ? Date.now() : seed);
    for (let i = 0; i < s.length; i++) a = Math.imul(a ^ s.charCodeAt(i), 2654435761);
    a >>>= 0;
    return function (max) {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      return Math.floor(r * max) + 1;
    };
  }

  // ---- Eigene Würfel ------------------------------------------------------

  const registry = new Map();
  const dieKey = name => String(name).toLowerCase().replace(/\s+/g, '');

  function normalizeFaces(faces, values) {
    return faces.map((f, k) => {
      let label, value;
      if (f && typeof f === 'object') {
        label = String(f.label != null ? f.label : f.value != null ? f.value : '');
        value = f.value == null ? null : Number(f.value);
      } else {
        label = String(f);
        value = /^\s*[+-]?\d+(\.\d+)?\s*$/.test(label) ? Number(label) : null;
      }
      if (values && k < values.length) value = values[k] == null ? null : Number(values[k]);
      if (value != null && !isFinite(value)) value = null;
      return { label, value };
    });
  }

  /**
   * Eigenen Würfel anmelden. Danach in Formeln als 2w{name} nutzbar.
   *   defineDie('Treffer', { faces: ['💥','💥','⭐','–','–','–'], values: [1,1,2,0,0,0], color: '#e11d48' })
   *   defineDie('Münze', ['Kopf', 'Zahl'])
   * shape erzwingt einen Körper ('d4','d6','d8','d10','d12','d20'), sonst passend zur Seitenzahl.
   */
  function defineDie(name, def) {
    const lang = config.lang;
    if (!name || !String(name).trim()) throw new DiceError('name', tr(lang).err.name);
    if (Array.isArray(def)) def = { faces: def };
    def = def || {};
    const faces = normalizeFaces(def.faces || [], def.values);
    if (faces.length < 2) throw new DiceError('faces', tr(lang).err.faces);
    const die = {
      key: dieKey(name),
      name: String(def.label || name).trim(),
      faces,
      color: def.color || null,
      textColor: def.textColor || null,
      shape: SHAPE_CFG[def.shape] ? def.shape : null,
      builtin: !!def.builtin,
      user: !!def.user,
    };
    registry.set(die.key, die);
    emit('dice', listDice());
    return die;
  }
  function removeDie(name) {
    const ok = registry.delete(dieKey(name));
    if (ok) emit('dice', listDice());
    return ok;
  }
  const getDie = name => registry.get(dieKey(name)) || null;
  const listDice = () => Array.from(registry.values());


  // ---- Parser -------------------------------------------------------------
  //
  // formel  := ['+'|'-'] term (('+'|'-') term)*  ['#' beschriftung]
  // term    := zahl | [anzahl] ('w'|'d') seiten mod*
  // seiten  := zahl | '%' | 'F' | '{' name '}' | '[' a,b,… ']'
  // mod     := ('kh'|'k'|'kl'|'dh'|'dl'|'d') [n] | '!' | 'r' [vergleich] n | vergleich n
  // vergleich := '>=' | '<=' | '>' | '<' | '='

  function parse(input, lang) {
    const E = tr(lang || config.lang).err;
    let src = String(input == null ? '' : input);
    let label = '';
    const hash = src.indexOf('#');
    if (hash >= 0) { label = src.slice(hash + 1).trim(); src = src.slice(0, hash); }

    // Leerzeichen raus, außer in {…} und […], dort gehören sie zum Namen.
    let s = '';
    let depth = 0;
    for (const ch of src) {
      if (ch === '[' || ch === '{') depth++;
      else if (ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
      if (depth === 0 && /\s/.test(ch)) continue;
      s += ch;
    }
    s = s.replace(/[−–]/g, '-');
    if (!s) throw new DiceError('empty', E.empty, 0);

    const lc = s.toLowerCase();
    let i = 0;
    const peek = (o = 0) => lc[i + o];
    const fail = () => { throw new DiceError('syntax', E.syntax(i + 1, s[i]), i); };
    const readInt = () => {
      const st = i;
      while (i < lc.length && lc[i] >= '0' && lc[i] <= '9') i++;
      return st === i ? null : parseInt(lc.slice(st, i), 10);
    };
    const readCmp = () => {
      for (const c of ['>=', '<=', '>', '<', '=']) {
        if (lc.startsWith(c, i)) { i += c.length; return c; }
      }
      return null;
    };

    function parseTerm() {
      const n = readInt();
      const c = peek();
      if (c !== 'd' && c !== 'w') {
        if (n == null) fail();
        return { type: 'const', value: n };
      }
      i++;
      const t = { type: 'dice', count: n == null ? 1 : n, sides: null, die: null, inline: null,
                  keep: null, explode: false, reroll: null, success: null };
      if (t.count < 1 || t.count > 100) throw new DiceError('count', E.count, i);
      const c2 = peek();
      if (c2 === '%') { i++; t.sides = 100; }
      else if (c2 === 'f') { i++; t.die = 'fudge'; }
      else if (c2 === '{') {
        const end = s.indexOf('}', i);
        if (end < 0) { i = s.length; fail(); }
        const name = s.slice(i + 1, end).trim();
        if (!registry.has(dieKey(name))) throw new DiceError('unknown', E.unknown(name), i);
        t.die = dieKey(name);
        i = end + 1;
      } else if (c2 === '[') {
        const end = s.indexOf(']', i);
        if (end < 0) { i = s.length; fail(); }
        const faces = s.slice(i + 1, end).split(',').map(x => x.trim()).filter(x => x !== '');
        if (faces.length < 2) throw new DiceError('faces', E.faces, i);
        t.inline = normalizeFaces(faces);
        i = end + 1;
      } else {
        const sd = readInt();
        if (sd == null) fail();
        if (sd < 1 || sd > 10000) throw new DiceError('sides', E.sides, i);
        t.sides = sd;
      }
      // Modifikatoren
      for (;;) {
        const m = peek();
        if (m === 'k' || (m === 'd' && /[hl0-9]/.test(peek(1) || ''))) {
          i++;
          let mode;
          if (peek() === 'h') { i++; mode = m === 'k' ? 'kh' : 'dh'; }
          else if (peek() === 'l') { i++; mode = m === 'k' ? 'kl' : 'dl'; }
          else mode = m === 'k' ? 'kh' : 'dl';
          const k = readInt();
          t.keep = { mode, n: k == null ? 1 : k };
          if (t.keep.n > t.count || (mode[0] === 'k' && t.keep.n < 1)) throw new DiceError('keep', E.keep, i);
        } else if (m === '!') {
          i++;
          if (t.die || t.inline || t.sides < 2) throw new DiceError('explode', E.explode, i);
          t.explode = true;
        } else if (m === 'r') {
          i++;
          const cmp = readCmp() || '=';
          const v = readInt();
          if (v == null) fail();
          t.reroll = { cmp, v };
        } else if (m === '>' || m === '<' || m === '=') {
          const cmp = readCmp();
          const v = readInt();
          if (v == null) fail();
          t.success = { cmp, v };
        } else break;
      }
      return t;
    }

    const terms = [];
    let sign = 1;
    if (peek() === '+' || peek() === '-') { sign = peek() === '-' ? -1 : 1; i++; }
    for (;;) {
      const term = parseTerm();
      term.sign = sign;
      terms.push(term);
      if (terms.length > 20) throw new DiceError('terms', E.terms, i);
      if (i >= lc.length) break;
      const c = peek();
      if (c === '+' || c === '-') { sign = c === '-' ? -1 : 1; i++; if (i >= lc.length) fail(); }
      else fail();
    }
    return { terms, label };
  }

  function formatTerm(t, lang) {
    if (t.type === 'const') return String(t.value);
    const L = tr(lang).letter;
    let sides;
    if (t.die === 'fudge') sides = 'F';
    else if (t.die) { const d = registry.get(t.die); sides = `{${d ? d.name : t.die}}`; }
    else if (t.inline) sides = `[${t.inline.map(f => f.label).join(',')}]`;
    else sides = String(t.sides);
    let s = `${t.count}${L}${sides}`;
    if (t.keep) s += t.keep.mode + t.keep.n;
    if (t.explode) s += '!';
    if (t.reroll) s += 'r' + (t.reroll.cmp === '=' ? '' : t.reroll.cmp) + t.reroll.v;
    if (t.success) s += t.success.cmp + t.success.v;
    return s;
  }

  /** Formel kanonisch ausgeben, z. B. "3W20+2" (de) oder "3d20+2" (en). */
  function format(notation, lang) {
    const ast = typeof notation === 'string' ? parse(notation, lang) : notation;
    let out = '';
    ast.terms.forEach((t, k) => {
      if (k === 0) out += t.sign < 0 ? '-' : '';
      else out += t.sign < 0 ? '-' : '+';
      out += formatTerm(t, lang);
    });
    return out;
  }

  const compare = (v, cmp, n) =>
    cmp === '>=' ? v >= n : cmp === '<=' ? v <= n : cmp === '>' ? v > n : cmp === '<' ? v < n : v === n;

  function rollGroup(term, rng, lang) {
    let die = null;
    if (term.die) {
      const d = registry.get(term.die);
      if (!d) throw new DiceError('unknown', tr(lang).err.unknown(term.die));
      die = d;
    } else if (term.inline) {
      die = { key: null, name: null, faces: term.inline, color: null, textColor: null, shape: null };
    }
    const once = () => {
      if (die) {
        const idx = rng(die.faces.length) - 1;
        const f = die.faces[idx];
        return { value: f.value, label: f.label, face: idx };
      }
      const v = rng(term.sides);
      return { value: v, label: String(v) };
    };
    const rolls = [];
    for (let k = 0; k < term.count; k++) {
      let r = once();
      if (term.reroll && r.value != null && compare(r.value, term.reroll.cmp, term.reroll.v)) {
        const old = r.value;
        r = once();
        r.rerolled = old;
      }
      r.kept = true;
      rolls.push(r);
      if (term.explode) {
        let last = r;
        for (let chain = 0; last.value === term.sides && chain < 20; chain++) {
          last.explodes = true;
          const e = once();
          e.exploded = true;
          e.kept = true;
          rolls.push(e);
          last = e;
        }
      }
    }
    if (term.keep) {
      const num = r => (r.value == null ? 0 : r.value);
      const order = rolls.map((r, idx) => idx).sort((a, b) => num(rolls[a]) - num(rolls[b]) || a - b);
      const n = rolls.length;
      const k = term.keep.n;
      let drop;
      if (term.keep.mode === 'kh') drop = order.slice(0, Math.max(0, n - k));
      else if (term.keep.mode === 'kl') drop = order.slice(Math.min(n, k));
      else if (term.keep.mode === 'dh') drop = order.slice(Math.max(0, n - k));
      else drop = order.slice(0, Math.min(n, k));
      drop.forEach(idx => { rolls[idx].kept = false; });
    }
    const kept = rolls.filter(r => r.kept);
    const symbolic = !!die && die.faces.some(f => f.value == null) && !term.success;
    const g = {
      type: 'dice', sign: term.sign, notation: formatTerm(term, lang), count: term.count,
      sides: die ? die.faces.length : term.sides, rolls, symbolic,
      die: die ? { key: die.key, name: die.name, faces: die.faces.map(f => f.label),
                   values: die.faces.map(f => f.value), color: die.color, textColor: die.textColor,
                   shape: die.shape, builtin: !!die.builtin } : null,
      keep: term.keep, explode: term.explode, reroll: term.reroll, success: term.success,
      subtotal: null, successes: null, min: 0, max: 0,
    };
    if (term.success) {
      let n = 0;
      kept.forEach(r => { r.success = r.value != null && compare(r.value, term.success.cmp, term.success.v); if (r.success) n++; });
      g.successes = n;
      g.subtotal = n;
      g.max = kept.length;
    } else if (!symbolic) {
      g.subtotal = kept.reduce((a, r) => a + (r.value || 0), 0);
      const vals = die ? die.faces.map(f => f.value || 0) : [1, term.sides];
      const keptCount = term.keep ? kept.length : term.count;
      g.min = keptCount * Math.min(...vals);
      g.max = keptCount * Math.max(...vals);
    }
    return g;
  }

  const rollText = r => {
    let t = r.label.trim() === '' ? '0' : r.label;
    if (r.explodes) t += '!';
    if (r.success) t += '✓';
    return r.kept ? t : `~~${t}~~`;
  };
  const signed = n => (n >= 0 ? `+${n}` : `${n}`);
  let idCounter = 0;

  /**
   * Formel auswerten, ohne Animation. Wirft PnpDiceError bei ungültiger Formel.
   * opts: { lang, modifier, label, rng, crit }
   */
  function evaluate(notation, opts) {
    opts = opts || {};
    const lang = resolveLang(opts.lang || config.lang);
    const ast = typeof notation === 'object' && notation && notation.terms ? notation : parse(notation, lang);
    const rngBasis = opts.rng || config.rng || cryptoRng;
    // alle Zufallswerte in der Reihenfolge merken: damit lässt sich der Wurf exakt nachspielen (replay)
    const raw = [];
    const rng = function (max) { const v = rngBasis(max); raw.push(v); return v; };
    const t = I18N[lang];
    const groups = [];
    let sum = 0, min = 0, max = 0, numeric = false, successes = null;
    const tally = {};
    for (const term of ast.terms) {
      if (term.type === 'const') {
        groups.push({ type: 'const', sign: term.sign, value: term.value });
        sum += term.sign * term.value; min += term.sign * term.value; max += term.sign * term.value;
        numeric = true;
        continue;
      }
      const g = rollGroup(term, rng, lang);
      groups.push(g);
      if (g.symbolic) {
        g.rolls.filter(r => r.kept).forEach(r => { tally[r.label] = (tally[r.label] || 0) + 1; });
      } else {
        sum += g.sign * g.subtotal;
        if (g.sign > 0) { min += g.min; max += g.max; } else { min -= g.max; max -= g.min; }
        numeric = true;
        if (g.success) successes = (successes || 0) + g.sign * g.successes;
      }
    }
    const modifier = Math.trunc(Number(opts.modifier) || 0);
    const total = numeric ? sum + modifier : null;
    const diceGroups = groups.filter(g => g.type === 'dice');
    const allSuccess = diceGroups.length > 0 && diceGroups.every(g => g.success);

    // Detailtext wie im alten Tool: "[6, 19, 20] = 45", "14 + 5 = 19", "68"
    const parts = groups.map(g => (g.type === 'const' ? String(g.value)
      : g.rolls.length > 1 ? `[${g.rolls.map(rollText).join(', ')}]` : rollText(g.rolls[0])));
    let detail = '';
    groups.forEach((g, k) => {
      if (k === 0) detail += g.sign < 0 ? '-' : '';
      else detail += g.sign < 0 ? ' - ' : ' + ';
      detail += parts[k];
    });
    const single = groups.length === 1 && diceGroups.length === 1 && diceGroups[0].rolls.length === 1;
    const tallyStr = Object.keys(tally).filter(l => l.trim()).map(l => `${tally[l]}× ${l}`).join(' · ');
    if (numeric) {
      if (!single || allSuccess) detail += ` = ${sum}`;
      if (modifier) detail += ` (${signed(modifier)}) = ${total}`;
      if (allSuccess) detail += ` ${t.successes(total)}`;
      if (tallyStr) detail += ` · ${tallyStr}`;
    } else if (tallyStr && !single) {
      detail += ` → ${tallyStr}`;
    }

    const result = {
      id: `${Date.now().toString(36)}-${(++idCounter).toString(36)}`,
      notation: format(ast, lang),
      label: opts.label != null ? String(opts.label) : ast.label,
      lang, groups, modifier, total, successes, tally, raw,
      display: numeric ? String(total) : single ? diceGroups[0].rolls[0].label : (tallyStr || '–'),
      unit: allSuccess ? t.successes(total) : '',
      detail,
      min: numeric ? min + modifier : null,
      max: numeric ? max + modifier : null,
      crit: false, fumble: false,
      timestamp: Date.now(),
    };
    result.text = `${result.label ? result.label + ' – ' : ''}${result.notation}: ${detail}`;

    const critRule = opts.crit !== undefined ? opts.crit : config.crit;
    let verdict = null;
    if (typeof critRule === 'function') verdict = critRule(result);
    else if (critRule !== false && diceGroups.length === 1) {
      const g = diceGroups[0];
      const kept = g.rolls.filter(r => r.kept && !r.exploded);
      if (!g.die && !g.success && g.sides >= 4 && kept.length) {
        if (kept.every(r => r.value === g.sides)) verdict = 'crit';
        else if (kept.every(r => r.value === 1)) verdict = 'fumble';
      }
    }
    result.crit = verdict === 'crit';
    result.fumble = verdict === 'fumble';
    return result;
  }

  // =========================================================================
  // 3. 3D-Würfel
  // =========================================================================

  // ---- Vektoren und Quaternionen ([w, x, y, z]) ----------------------------
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vlen = a => Math.hypot(a[0], a[1], a[2]);
  const norm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function qMul(a, b) {
    return [
      a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
      a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
      a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
      a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
    ];
  }
  function qNorm(q) {
    const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
  }
  function qRot(q, v) {
    const w = q[0], x = q[1], y = q[2], z = q[3];
    const tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
    return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
  }
  function qFromTo(a, b) {
    const d = dot(a, b);
    if (d < -0.999999) {
      let axis = cross([1, 0, 0], a);
      if (vlen(axis) < 1e-6) axis = cross([0, 1, 0], a);
      axis = norm(axis);
      return [0, axis[0], axis[1], axis[2]];
    }
    const c = cross(a, b);
    return qNorm([1 + d, c[0], c[1], c[2]]);
  }
  function qSlerp(a, b, t) {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    let bb = b;
    if (d < 0) { d = -d; bb = [-b[0], -b[1], -b[2], -b[3]]; }
    if (d > 0.9995) return qNorm([a[0] + (bb[0] - a[0]) * t, a[1] + (bb[1] - a[1]) * t, a[2] + (bb[2] - a[2]) * t, a[3] + (bb[3] - a[3]) * t]);
    const th = Math.acos(d), s = Math.sin(th);
    const wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s;
    return [a[0] * wa + bb[0] * wb, a[1] * wa + bb[1] * wb, a[2] * wa + bb[2] * wb, a[3] * wa + bb[3] * wb];
  }
  function randomQuat() {
    const u1 = Math.random(), u2 = Math.random() * 2 * Math.PI, u3 = Math.random() * 2 * Math.PI;
    const s1 = Math.sqrt(1 - u1), s2 = Math.sqrt(u1);
    return [s1 * Math.sin(u2), s1 * Math.cos(u2), s2 * Math.sin(u3), s2 * Math.cos(u3)];
  }
  const randomUnit = () => norm([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);

  // ---- Körper -------------------------------------------------------------
  // size: Umkreisradius in Würfelradien, font: Schriftgröße in Würfelradien.
  const SHAPE_CFG = {
    d4: { size: 1.5, font: 0.5 },
    d6: { size: 1.3, font: 0.8 },
    d8: { size: 1.38, font: 0.6 },
    d10: { size: 1.3, font: 0.5 },
    d12: { size: 1.32, font: 0.56 },
    d20: { size: 1.35, font: 0.42 },
  };
  const PHI = (1 + Math.sqrt(5)) / 2;

  function rawVerts(kind) {
    switch (kind) {
      case 'd4': return [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
      case 'd6': {
        const v = [];
        for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z]);
        return v;
      }
      case 'd8': return [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
      case 'd10': {
        // Fünfeckiges Trapezoeder. Die Spitzenhöhe folgt aus der Bedingung, dass
        // die Drachenvierecke eben sind: h = e (1 + cos36°) / (1 - cos36°).
        const e = 0.105, c36 = Math.cos(Math.PI / 5);
        const h = e * (1 + c36) / (1 - c36);
        const v = [[0, 0, h], [0, 0, -h]];
        for (let k = 0; k < 5; k++) {
          const a = k * 2 * Math.PI / 5;
          v.push([Math.cos(a), Math.sin(a), e]);
          v.push([Math.cos(a + Math.PI / 5), Math.sin(a + Math.PI / 5), -e]);
        }
        return v;
      }
      case 'd12': {
        const v = [];
        for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z]);
        for (const a of [-1, 1]) for (const b of [-1, 1]) {
          v.push([0, a / PHI, b * PHI]);
          v.push([a / PHI, b * PHI, 0]);
          v.push([a * PHI, 0, b / PHI]);
        }
        return v;
      }
      default: { // d20
        const v = [];
        for (const a of [-1, 1]) for (const b of [-1, 1]) {
          v.push([0, a, b * PHI]);
          v.push([a, b * PHI, 0]);
          v.push([a * PHI, 0, b]);
        }
        return v;
      }
    }
  }

  // Konvexe Hülle per Brute Force: jede Ebene durch drei Ecken, auf deren einer
  // Seite alle anderen liegen, ist eine Fläche. Bei höchstens 20 Ecken billig
  // und für alle Körper gleich – auch für die Drachenvierecke des W10.
  function hull(V) {
    const faces = [];
    const seen = new Set();
    const EPS = 1e-6;
    for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) for (let k = j + 1; k < V.length; k++) {
      let n = cross(sub(V[j], V[i]), sub(V[k], V[i]));
      const L = vlen(n);
      if (L < 1e-9) continue;
      n = mul(n, 1 / L);
      let d = dot(n, V[i]);
      let pos = 0, neg = 0;
      for (const v of V) { const s = dot(n, v) - d; if (s > EPS) pos++; else if (s < -EPS) neg++; }
      if (pos && neg) continue;
      if (pos) { n = mul(n, -1); d = -d; }
      const key = n.map(x => Math.round(x * 1e4)).join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      const idx = [];
      V.forEach((v, m) => { if (Math.abs(dot(n, v) - d) < EPS) idx.push(m); });
      const c = mul(idx.reduce((a, m) => add(a, V[m]), [0, 0, 0]), 1 / idx.length);
      const u = norm(sub(V[idx[0]], c));
      const w = cross(n, u);
      const ang = m => { const r = sub(V[m], c); return Math.atan2(dot(r, w), dot(r, u)); };
      idx.sort((a, b) => ang(a) - ang(b));
      faces.push({ idx, n, c, d });
    }
    return faces;
  }

  const shapeCache = {};
  function getShape(kind) {
    if (shapeCache[kind]) return shapeCache[kind];
    let V = rawVerts(kind);
    const sc = SHAPE_CFG[kind].size / Math.max(...V.map(vlen));
    V = V.map(v => mul(v, sc));
    const faces = hull(V).map(f => {
      let up;
      if (kind === 'd6') up = norm(sub(mul(add(V[f.idx[0]], V[f.idx[1]]), 0.5), f.c));
      else if (kind === 'd10') {
        // Zahl zeigt zur Spitze des Drachenvierecks
        let best = f.idx[0];
        f.idx.forEach(m => { if (vlen(sub(V[m], f.c)) > vlen(sub(V[best], f.c))) best = m; });
        up = norm(sub(V[best], f.c));
      } else up = norm(sub(V[f.idx[0]], f.c));
      // nur den Anteil in der Flächenebene behalten
      up = norm(sub(up, mul(f.n, dot(up, f.n))));
      return Object.assign(f, { up });
    });
    // Gegenüberliegende Flächen finden, damit Zahlen wie beim echten Würfel
    // paarweise N+1 ergeben (1 gegenüber 6 usw.).
    const opp = faces.map(f => {
      const j = faces.findIndex(g => dot(g.n, f.n) < -0.999);
      return j >= 0 ? j : null;
    });
    let order;
    if (kind === 'd4') order = [0, 1, 2, 3];
    else {
      const used = new Set();
      const a = [], b = [];
      faces.forEach((f, i) => {
        if (used.has(i)) return;
        used.add(i);
        a.push(i);
        if (opp[i] != null) { used.add(opp[i]); b.unshift(opp[i]); }
      });
      order = a.concat(b);
    }
    const slots = kind === 'd4' ? V.length : faces.length;
    const shape = { kind, verts: V, faces, opp: kind === 'd4' ? [null, null, null, null] : opp, order, slots,
                    font: SHAPE_CFG[kind].font };
    shapeCache[kind] = shape;
    return shape;
  }

  const SHAPE_SLOTS = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20 };
  function shapeFor(n) {
    if (SHAPE_SLOTS['d' + n]) return 'd' + n;
    if (n <= 3) return 'd6';
    if (n > 20) return 'd20';
    const kinds = Object.keys(SHAPE_SLOTS);
    return kinds.find(k => SHAPE_SLOTS[k] % n === 0) || kinds.find(k => SHAPE_SLOTS[k] >= n);
  }
  function fitLabels(list, n) {
    const out = [];
    for (let k = 0; k < n; k++) out.push(list[k % list.length]);
    return out;
  }
  function numericList(sides, n) {
    if (sides <= n) return fitLabels(Array.from({ length: sides }, (_, k) => String(k + 1)), n);
    return Array.from({ length: n }, (_, k) => String(Math.round(1 + k * (sides - 1) / (n - 1))));
  }

  function hexToRgb(hex) {
    let h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    if (isNaN(n) || h.length !== 6) return [100, 116, 139];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const luminance = rgb => (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;

  function colorForGroup(g, cfg) {
    const colors = cfg.colors || DEFAULT_COLORS;
    if (g.die) return g.die.color || (g.die.key === 'fudge' ? colors.fudge : colors.custom);
    if (colors[g.sides]) return colors[g.sides];
    return EXTRA_COLORS[g.sides % EXTRA_COLORS.length];
  }

  // Aus einem Ergebnis die einzelnen Körper machen, die geworfen werden.
  function buildSpecs(result, cfg) {
    const specs = [];
    for (const g of result.groups) {
      if (g.type !== 'dice') continue;
      const color = colorForGroup(g, cfg);
      for (const r of g.rolls) {
        let mark = null;
        if (!r.kept) mark = 'dropped';
        else if (g.success) mark = r.success ? 'success' : 'fail';
        else if (result.crit) mark = 'crit';
        else if (result.fumble) mark = 'fumble';
        const base = { color, textColor: g.die && g.die.textColor, mark };
        if (g.die) {
          const shape = (g.die.shape && SHAPE_SLOTS[g.die.shape]) ? g.die.shape : shapeFor(g.die.faces.length);
          specs.push(Object.assign({}, base, { shape, list: fitLabels(g.die.faces, SHAPE_SLOTS[shape]), value: r.label }));
        } else if (g.sides === 100) {
          const v = r.value % 100;
          const tens = Math.floor(v / 10) * 10;
          specs.push(Object.assign({}, base, { shape: 'd10', list: Array.from({ length: 10 }, (_, k) => k === 0 ? '00' : String(k * 10)),
            value: tens === 0 ? '00' : String(tens) }));
          specs.push(Object.assign({}, base, { shape: 'd10', color: cfg.colors && cfg.colors.d100units || shade(color, 0.35),
            list: Array.from({ length: 10 }, (_, k) => String(k)), value: String(v % 10), underline: true }));
        } else {
          const shape = shapeFor(g.sides);
          const slots = SHAPE_SLOTS[shape];
          specs.push(Object.assign({}, base, { shape, list: numericList(g.sides, slots), value: String(r.value),
            underline: Math.min(g.sides, slots) >= 9 }));
        }
      }
    }
    return specs;
  }
  function shade(hex, t) {
    const c = hexToRgb(hex).map(x => Math.round(x + (255 - x) * t));
    return '#' + c.map(x => x.toString(16).padStart(2, '0')).join('');
  }

  // ---- Physik ---------------------------------------------------------------
  // Der ganze Wurf wird vorab simuliert (feste Schrittweite), danach steht fest,
  // welche Fläche oben liegt. Erst dann werden die Zahlen so auf den Körper
  // gelegt, dass genau das ausgewürfelte Ergebnis oben landet. Der Zufall kommt
  // also allein aus der Engine, die Animation erzählt ihn nur nach.

  const DT = 1 / 120;

  function restTarget(shape, q) {
    // nächstliegende Ruhelage: Fläche nach oben (W4: Fläche nach unten, Spitze oben)
    let best = 0, bestZ = -Infinity;
    const d4 = shape.kind === 'd4';
    shape.faces.forEach((f, i) => {
      const z = qRot(q, f.n)[2] * (d4 ? -1 : 1);
      if (z > bestZ) { bestZ = z; best = i; }
    });
    const n = qRot(q, shape.faces[best].n);
    return qNorm(qMul(qFromTo(n, [0, 0, d4 ? -1 : 1]), q));
  }
  function lowestZ(shape, q) {
    let m = Infinity;
    for (const v of shape.verts) { const z = qRot(q, v)[2]; if (z < m) m = z; }
    return m;
  }

  function simulate(specs, W, H, R, opts) {
    const G = R * 95;
    const margin = R * 1.2;
    const n = specs.length;
    const dice = specs.map(spec => ({
      spec, shape: getShape(spec.shape), p: [0, 0, 0], v: [0, 0, 0], w: [0, 0, 0],
      q: randomQuat(), phase: 'free', frames: [], contact: false,
    }));
    const events = [];

    if (opts.static) {
      const cols = Math.max(1, Math.ceil(Math.sqrt(n * W / H)));
      const rows = Math.ceil(n / cols);
      dice.forEach((d, k) => {
        const col = k % cols, row = Math.floor(k / cols);
        d.q = restTarget(d.shape, randomQuat());
        d.p = [W / 2 + (col - (cols - 1) / 2) * R * 2.7, H / 2 + (row - (rows - 1) / 2) * R * 2.7, -lowestZ(d.shape, d.q) * R];
        d.phase = 'rest';
        d.frames.push([d.p[0], d.p[1], d.p[2], d.q[0], d.q[1], d.q[2], d.q[3]]);
      });
      return finishSim(dice, events, R, 1);
    }

    // Wurf von einer zufälligen Kante in Richtung Mitte
    const side = typeof opts.throwFrom === 'number' ? opts.throwFrom : Math.floor(Math.random() * 4);
    const target = [W * (0.35 + Math.random() * 0.3), H * (0.35 + Math.random() * 0.3)];
    const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
    const along0 = 0.3 + Math.random() * 0.4;
    dice.forEach((d, k) => {
      const col = k % cols, row = Math.floor(k / cols);
      const along = (col - (cols - 1) / 2) * R * 2.5 + (Math.random() - 0.5) * R * 0.6;
      const depth = margin + row * R * 2.5 + Math.random() * R * 0.4;
      let x, y;
      if (side === 0) { x = W * along0 + along; y = H - depth; }
      else if (side === 1) { x = W - depth; y = H * along0 + along; }
      else if (side === 2) { x = W * along0 + along; y = depth; }
      else { x = depth; y = H * along0 + along; }
      x = clamp(x, margin, W - margin);
      y = clamp(y, margin, H - margin);
      const to = [target[0] - x, target[1] - y];
      const dist = Math.hypot(to[0], to[1]) || 1;
      const jitter = (Math.random() - 0.5) * 0.5;
      const ang = Math.atan2(to[1], to[0]) + jitter;
      const speed = dist * (1.6 + Math.random() * 0.7) + R * 6;
      d.p = [x, y, R * (2 + Math.random() * 2.5)];
      d.v = [Math.cos(ang) * speed, Math.sin(ang) * speed, R * (3 + Math.random() * 5)];
      d.w = mul(randomUnit(), 10 + Math.random() * 14);
    });

    const MAX_STEPS = Math.ceil(3.4 / DT);
    const SETTLE = 0.42;
    for (let step = 0; step < MAX_STEPS; step++) {
      const t = step * DT;
      for (const d of dice) {
        if (d.phase === 'free') {
          d.v[2] -= G * DT;
          d.p = add(d.p, mul(d.v, DT));
          // dq = ½·ω·q (ω im Weltsystem)
          const dq = qMul([0, d.w[0] * 0.5 * DT, d.w[1] * 0.5 * DT, d.w[2] * 0.5 * DT], d.q);
          d.q = qNorm([d.q[0] + dq[0], d.q[1] + dq[1], d.q[2] + dq[2], d.q[3] + dq[3]]);
          d.w = mul(d.w, Math.exp(-0.35 * DT));
          const minZ = d.p[2] + lowestZ(d.shape, d.q) * R;
          d.contact = false;
          if (minZ < 0) {
            d.p[2] -= minZ;
            d.contact = true;
            const roll = mul(cross([0, 0, 1], d.v), 1 / R);
            if (d.v[2] < -R * 3) {
              const impact = -d.v[2];
              events.push({ t, i: clamp(impact / (R * 30), 0.08, 1) });
              d.v[2] = impact * 0.36;
              d.v[0] *= 0.82; d.v[1] *= 0.82;
              d.w = add(mul(d.w, 0.55), add(mul(roll, 0.45), mul(randomUnit(), impact / R * 0.3)));
            } else {
              d.v[2] = Math.max(0, d.v[2]);
            }
          } else if (minZ < R * 0.03) d.contact = true;
          if (d.contact) {
            const f = Math.exp(-2.4 * DT);
            d.v[0] *= f; d.v[1] *= f;
            const roll = mul(cross([0, 0, 1], d.v), 1 / R);
            const k = 1 - Math.exp(-10 * DT);
            d.w = add(mul(d.w, 1 - k), mul(roll, k));
          }
          walls(d, W, H, margin, events, t, R);
          const sp = Math.hypot(d.v[0], d.v[1]);
          if ((t > 0.45 && d.contact && sp < R * 1.8 && vlen(d.w) < 3.5) || t > 2.6) {
            d.phase = 'settle';
            d.t0 = t;
            d.q0 = d.q;
            d.qT = restTarget(d.shape, d.q);
            d.z0 = d.p[2];
            d.zT = -lowestZ(d.shape, d.qT) * R;
          }
        } else if (d.phase === 'settle') {
          const s = Math.min(1, (t - d.t0) / SETTLE);
          const e = 1 - Math.pow(1 - s, 3);
          const f = Math.exp(-7 * DT);
          d.v = [d.v[0] * f, d.v[1] * f, 0];
          d.p[0] += d.v[0] * DT; d.p[1] += d.v[1] * DT;
          d.p[2] = d.z0 + (d.zT - d.z0) * e;
          d.q = qSlerp(d.q0, d.qT, e);
          walls(d, W, H, margin, null, t, R);
          if (s >= 1) { d.phase = 'rest'; d.q = d.qT; d.p[2] = d.zT; }
        }
      }
      collide(dice, R, events, t);
      for (const d of dice) d.frames.push([d.p[0], d.p[1], d.p[2], d.q[0], d.q[1], d.q[2], d.q[3]]);
      if (dice.every(d => d.phase === 'rest')) break;
    }
    return finishSim(dice, events, R, dice[0].frames.length);
  }

  function walls(d, W, H, m, events, t, R) {
    const hit = (axis, lo, hi) => {
      if (d.p[axis] < lo) { d.p[axis] = lo; if (d.v[axis] < 0) bounce(axis); }
      else if (d.p[axis] > hi) { d.p[axis] = hi; if (d.v[axis] > 0) bounce(axis); }
    };
    const bounce = axis => {
      const sp = Math.abs(d.v[axis]);
      d.v[axis] = -d.v[axis] * 0.55;
      if (events && sp > R * 4) {
        events.push({ t, i: clamp(sp / (R * 40), 0.05, 0.8) });
        d.w = add(d.w, mul(randomUnit(), sp / R * 0.25));
      }
    };
    hit(0, m, W - m);
    hit(1, m, H - m);
  }

  function collide(dice, R, events, t) {
    const minD = R * 2.05;
    for (let a = 0; a < dice.length; a++) for (let b = a + 1; b < dice.length; b++) {
      const A = dice[a], B = dice[b];
      const dlt = sub(B.p, A.p);
      const dist = vlen(dlt);
      if (dist >= minD || dist < 1e-6) continue;
      const nrm = mul(dlt, 1 / dist);
      const push = (minD - dist) / 2;
      const aFix = A.phase === 'rest', bFix = B.phase === 'rest';
      if (aFix && bFix) continue;
      A.p = sub(A.p, mul(nrm, aFix ? 0 : bFix ? push * 2 : push));
      B.p = add(B.p, mul(nrm, bFix ? 0 : aFix ? push * 2 : push));
      A.p[2] = Math.max(A.p[2], 0); B.p[2] = Math.max(B.p[2], 0);
      const rel = dot(sub(A.v, B.v), nrm);
      if (rel > 0) {
        const j = rel * 0.85;
        if (!aFix) A.v = sub(A.v, mul(nrm, bFix ? 2 * j : j));
        if (!bFix) B.v = add(B.v, mul(nrm, aFix ? 2 * j : j));
        if (rel > R * 3) {
          events.push({ t, i: clamp(rel / (R * 35), 0.05, 0.9) });
          if (A.phase === 'free') A.w = add(A.w, mul(randomUnit(), rel / R * 0.3));
          if (B.phase === 'free') B.w = add(B.w, mul(randomUnit(), rel / R * 0.3));
        }
      }
    }
  }

  function finishSim(dice, events, R, steps) {
    for (const d of dice) {
      const last = d.frames[d.frames.length - 1];
      const q = [last[3], last[4], last[5], last[6]];
      const sh = d.shape;
      // Welcher Platz liegt oben? W4: die oberste Ecke, sonst die oberste Fläche.
      let top = 0, best = -Infinity;
      if (sh.kind === 'd4') sh.verts.forEach((v, i) => { const z = qRot(q, v)[2]; if (z > best) { best = z; top = i; } });
      else sh.faces.forEach((f, i) => { const z = qRot(q, f.n)[2]; if (z > best) { best = z; top = i; } });
      // Liste nach Reihenfolge auf die Plätze legen (Gegenüber ergibt N+1) …
      const labels = new Array(sh.slots);
      sh.order.forEach((slot, k) => { labels[slot] = d.spec.list[k]; });
      // … und das Ergebnis nach oben tauschen, das Gegenüber gleich mit.
      const L = String(d.spec.value);
      if (labels[top] !== L) {
        const j = labels.indexOf(L);
        if (j < 0) labels[top] = L;
        else {
          const ot = sh.opp[top], oj = sh.opp[j];
          [labels[top], labels[j]] = [labels[j], labels[top]];
          if (ot != null && oj != null && j !== ot) [labels[ot], labels[oj]] = [labels[oj], labels[ot]];
        }
      }
      d.labels = labels;
      d.top = top;
      d.rgb = hexToRgb(d.spec.color);
      d.text = d.spec.textColor || (luminance(d.rgb) > 0.62 ? '#111827' : '#ffffff');
    }
    events.sort((a, b) => a.t - b.t);
    return { dice, events, R, steps };
  }

  // ---- Zeichnen ---------------------------------------------------------------

  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const LIGHT = norm([-0.45, -0.6, 0.9]);
  const HALF = norm(add(LIGHT, [0, 0, 1]));
  const MARK_COLORS = { success: '#4ade80', crit: '#4ade80', fumble: '#f87171', fail: null, dropped: null };

  function drawLabel(ctx, text, fs, color, alpha, underline) {
    if (!text || !String(text).trim()) return;
    const len = [...String(text)].length;
    const size = fs * (len <= 1 ? 1 : len === 2 ? 0.8 : Math.max(0.42, 1.9 / len));
    ctx.globalAlpha *= alpha;
    ctx.font = `800 ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillText(text, size * 0.03, size * 0.07);
    ctx.fillStyle = color;
    ctx.fillText(text, 0, size * 0.04);
    if (underline && (text === '6' || text === '9')) ctx.fillRect(-size * 0.26, size * 0.45, size * 0.52, size * 0.08);
  }

  function drawDie(ctx, st, R, proj, cam, dpr) {
    const { d, p, q } = st;
    const sh = d.shape;
    const P = sh.verts.map(v => { const r = qRot(q, v); return [p[0] + r[0] * R, p[1] + r[1] * R, p[2] + r[2] * R]; });
    const S = P.map(w => proj(w));
    const col = d.rgb;
    for (let fi = 0; fi < sh.faces.length; fi++) {
      const f = sh.faces[fi];
      const n = qRot(q, f.n);
      const cr = qRot(q, f.c);
      const c = [p[0] + cr[0] * R, p[1] + cr[1] * R, p[2] + cr[2] * R];
      const view = sub(cam, c);
      const facing = dot(n, view) / vlen(view);
      if (facing <= 0.002) continue;
      const diff = Math.max(0, dot(n, LIGHT));
      const spec = Math.pow(Math.max(0, dot(n, HALF)), 26) * 0.42;
      const k = 0.46 + 0.6 * diff;
      ctx.beginPath();
      f.idx.forEach((vi, m) => (m ? ctx.lineTo(S[vi][0], S[vi][1]) : ctx.moveTo(S[vi][0], S[vi][1])));
      ctx.closePath();
      ctx.fillStyle = `rgb(${clamp(col[0] * k + 255 * spec, 0, 255) | 0},${clamp(col[1] * k + 255 * spec, 0, 255) | 0},${clamp(col[2] * k + 255 * spec, 0, 255) | 0})`;
      ctx.fill();
      ctx.lineWidth = Math.max(1, R * 0.045);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.stroke();

      const a = clamp((facing - 0.1) / 0.3, 0, 1);
      if (a <= 0) continue;
      const fs = R * sh.font;
      const place = (center, up, text, size) => {
        const right = cross(n, up);
        const kk = R * 0.4;
        const o = proj(center);
        const ex = proj(add(center, mul(right, kk)));
        const ey = proj(sub(center, mul(up, kk)));
        ctx.save();
        ctx.setTransform(dpr * (ex[0] - o[0]) / kk, dpr * (ex[1] - o[1]) / kk, dpr * (ey[0] - o[0]) / kk, dpr * (ey[1] - o[1]) / kk, dpr * o[0], dpr * o[1]);
        drawLabel(ctx, text, size, d.text, a, d.spec.underline);
        ctx.restore();
      };
      if (sh.kind === 'd4') {
        f.idx.forEach(vi => {
          const toV = sub(P[vi], c);
          place(add(c, mul(toV, 0.52)), norm(toV), d.labels[vi], fs);
        });
      } else {
        place(c, qRot(q, f.up), d.labels[fi], fs);
      }
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---- Geräusche (WebAudio, ohne Dateien) ------------------------------------
  const sound = {
    ctx: null, buf: null, last: 0,
    play(intensity, volume) {
      if (!hasDOM) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        if (!this.ctx) this.ctx = new AC();
        const ac = this.ctx;
        if (ac.state === 'suspended') ac.resume();
        const now = ac.currentTime;
        if (now - this.last < 0.03) return;
        this.last = now;
        if (!this.buf) {
          const len = Math.floor(ac.sampleRate * 0.06);
          this.buf = ac.createBuffer(1, len, ac.sampleRate);
          const data = this.buf.getChannelData(0);
          for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
        }
        const src = ac.createBufferSource();
        src.buffer = this.buf;
        src.playbackRate.value = 0.75 + Math.random() * 0.7;
        const bp = ac.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1600 + Math.random() * 2600;
        bp.Q.value = 1.1;
        const gain = ac.createGain();
        gain.gain.value = clamp(intensity, 0, 1) * 0.9 * volume;
        src.connect(bp).connect(gain).connect(ac.destination);
        src.start(now);
      } catch (e) { /* kein Audio, kein Problem */ }
    },
  };

  // ---- Würfelfläche -------------------------------------------------------------

  const reducedMotion = () => hasDOM && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class Tray {
    /** container: Element (Würfel rollen darin) oder null (Overlay über der ganzen Seite) */
    constructor(container, opts) {
      this.container = container || null;
      this.opts = opts || {};
      this.canvas = null;
      this.raf = 0;
      this.pending = null;
      this._onKey = e => { if (e.key === 'Escape') this.clear(); };
    }

    _ensure() {
      if (this.canvas) return;
      const c = document.createElement('canvas');
      c.className = 'pnp-dice-tray';
      c.setAttribute('aria-hidden', 'true');
      const st = c.style;
      st.pointerEvents = 'none';
      st.display = 'none';
      if (this.container) {
        if (getComputedStyle(this.container).position === 'static') this.container.style.position = 'relative';
        Object.assign(st, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', zIndex: '5' });
        this.container.appendChild(c);
      } else {
        Object.assign(st, { position: 'fixed', left: '0', top: '0', width: '100%', height: '100%', zIndex: '2147483000' });
        document.body.appendChild(c);
      }
      this.canvas = c;
      this.ctx = c.getContext('2d');
    }

    _resize() {
      const c = this.canvas;
      let W, H;
      if (this.container) { const r = this.container.getBoundingClientRect(); W = r.width; H = r.height; }
      else { W = document.documentElement.clientWidth || window.innerWidth; H = window.innerHeight; }
      W = Math.max(120, W); H = Math.max(100, H);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      this.W = W; this.H = H; this.dpr = dpr;
    }

    /** Ergebnis animieren. Promise erfüllt sich, sobald alle Würfel liegen. */
    play(result, options) {
      const o = Object.assign({}, config, this.opts, options || {});
      this.clear();
      if (!hasDOM) return Promise.resolve(result);
      let specs = buildSpecs(result, o);
      if (!specs.length) return Promise.resolve(result);
      const hidden = Math.max(0, specs.length - o.maxDice);
      specs = specs.slice(0, o.maxDice);
      this._ensure();
      this.canvas.style.display = 'block';
      this._resize();
      const { W, H } = this;
      let R = clamp(Math.min(W, H) * 0.07, 12, o.dieSize);
      R *= clamp(Math.sqrt(9 / specs.length), 0.5, 1);
      const isStatic = o.animate === 'static' || (o.animate === 'auto' && reducedMotion());
      const sim = simulate(specs, W, H, R, { static: isStatic, throwFrom: o.throwFrom });
      const hold = o.holdMs != null ? o.holdMs : this.container ? Infinity : 2600;
      const settleMs = isStatic ? 220 : (sim.steps - 1) * DT * 1000;
      if (!this.container) window.addEventListener('keydown', this._onKey);

      return new Promise(resolve => {
        this.pending = () => resolve(result);
        const start = performance.now();
        let evIdx = 0;
        const frame = now => {
          // Der rAF-Zeitstempel ist der Beginn des Frames und kann vor start liegen.
          const el = Math.max(0, now - start);
          const step = clamp(Math.floor(el / 1000 / DT), 0, sim.steps - 1);
          if (o.sound) {
            while (evIdx < sim.events.length && sim.events[evIdx].t * 1000 <= el) {
              sound.play(sim.events[evIdx].i, o.volume);
              evIdx++;
            }
          }
          const after = el - settleMs;
          if (after >= 0 && this.pending) { const p = this.pending; this.pending = null; p(); }
          let alpha = isStatic ? Math.min(1, el / 200) : 1;
          if (after > hold) alpha *= 1 - Math.min(1, (after - hold) / 450);
          try { this._draw(sim, step, alpha, after, result, o, hidden); }
          catch (err) { console.error('[PnpDice]', err); this.clear(); return; }
          if (after > hold + 450) { this.clear(); return; }
          if (hold === Infinity && after > 700) { this.raf = 0; return; }
          this.raf = requestAnimationFrame(frame);
        };
        this.raf = requestAnimationFrame(frame);
      });
    }

    clear() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      if (this.pending) { const p = this.pending; this.pending = null; p(); }
      if (this.canvas) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.style.display = 'none';
      }
      if (hasDOM) window.removeEventListener('keydown', this._onKey);
    }

    destroy() {
      this.clear();
      if (this.canvas) this.canvas.remove();
      this.canvas = null;
    }

    _draw(sim, step, alpha, after, result, o, hidden) {
      const { ctx, W, H, dpr } = this;
      const R = sim.R;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (alpha <= 0) return;
      ctx.globalAlpha = alpha;
      const cam = [W / 2, H / 2, Math.max(W, H) * 1.5];
      const proj = w => { const f = cam[2] / (cam[2] - w[2]); return [cam[0] + (w[0] - cam[0]) * f, cam[1] + (w[1] - cam[1]) * f]; };
      const settled = after >= 0;
      const fadeIn = settled ? Math.min(1, after / 300) : 0;
      const states = sim.dice.map(d => {
        const fr = d.frames[Math.min(step, d.frames.length - 1)];
        let a = 1;
        if (d.spec.mark === 'dropped') a = 1 - 0.62 * fadeIn;
        else if (d.spec.mark === 'fail') a = 1 - 0.35 * fadeIn;
        return { d, p: [fr[0], fr[1], fr[2]], q: [fr[3], fr[4], fr[5], fr[6]], a };
      });

      // Schatten und Markierungsringe auf dem Boden
      for (const s of states) {
        const z = Math.max(0, s.p[2] - R * 0.8);
        const sp = proj([s.p[0] + z * 0.35, s.p[1] + z * 0.5, 0]);
        const rad = R * 1.35 * (1 + z / (R * 8));
        const a = (0.42 / (1 + z / (R * 2.5))) * s.a;
        const g = ctx.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], rad);
        g.addColorStop(0, `rgba(0,0,0,${a})`);
        g.addColorStop(0.6, `rgba(0,0,0,${a * 0.5})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sp[0], sp[1], rad, 0, Math.PI * 2);
        ctx.fill();
        const mc = MARK_COLORS[s.d.spec.mark];
        if (mc && fadeIn > 0) {
          const c = proj([s.p[0], s.p[1], 0]);
          ctx.save();
          ctx.globalAlpha = alpha * fadeIn;
          ctx.strokeStyle = mc;
          ctx.lineWidth = R * 0.12;
          ctx.shadowColor = mc;
          ctx.shadowBlur = R * 0.6;
          ctx.beginPath();
          ctx.arc(c[0], c[1], R * (1.45 + 0.15 * (1 - fadeIn)), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
      states.sort((a, b) => a.p[2] - b.p[2]);
      for (const s of states) {
        ctx.globalAlpha = alpha * s.a;
        drawDie(ctx, s, R, proj, cam, dpr);
      }
      ctx.globalAlpha = alpha;
      if (settled && o.showTotal) this._badge(states, R, proj, result, alpha * fadeIn, hidden, fadeIn);
    }

    _badge(states, R, proj, result, a, hidden, t) {
      const { ctx, W, H } = this;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const s of states) {
        const c = proj(s.p);
        minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]);
        minY = Math.min(minY, c[1]); maxY = Math.max(maxY, c[1]);
      }
      const big = result.display + (result.unit ? ` ${result.unit}` : '');
      const sub = (result.label ? `${result.label} · ` : '') + result.notation + (hidden ? `  (+${hidden})` : '');
      const bs = clamp(R * 1.05, 20, 46), ss = clamp(R * 0.36, 11, 15);
      ctx.font = `800 ${bs}px ${FONT}`;
      const bw = ctx.measureText(big).width;
      ctx.font = `600 ${ss}px ${FONT}`;
      const sw = ctx.measureText(sub).width;
      const pad = bs * 0.42;
      const w = Math.min(W - 16, Math.max(bw, sw) + pad * 2.4);
      const h = bs + ss + pad * 1.9;
      const cx = (minX + maxX) / 2;
      let y = minY - R * 1.9 - h;
      if (y < 8) y = maxY + R * 1.9;
      y = clamp(y, 8, H - h - 8);
      const x = clamp(cx - w / 2, 8, W - w - 8);
      const sc = 0.9 + 0.1 * (1 - Math.pow(1 - t, 3));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(sc, sc);
      ctx.translate(-w / 2, -h / 2);
      roundRect(ctx, 0, 0, w, h, Math.min(16, h / 2.6));
      ctx.fillStyle = 'rgba(12,14,20,0.86)';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;
      const accent = result.crit ? '#4ade80' : result.fumble ? '#f87171' : '#fbbf24';
      ctx.strokeStyle = result.crit || result.fumble ? accent : 'rgba(255,255,255,0.14)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `800 ${bs}px ${FONT}`;
      ctx.fillStyle = accent;
      ctx.fillText(big, w / 2, pad * 0.75 + bs / 2, w - pad);
      ctx.font = `600 ${ss}px ${FONT}`;
      ctx.fillStyle = 'rgba(226,232,240,0.75)';
      ctx.fillText(sub, w / 2, pad * 1.15 + bs + ss / 2, w - pad);
      ctx.restore();
    }
  }

  let overlayTray = null;
  const trays = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  function resolveTray(t) {
    if (t === false || !hasDOM) return null;
    if (t instanceof Tray) return t;
    if (t == null || t === 'overlay' || t === true) return overlayTray || (overlayTray = new Tray(null));
    const el = typeof t === 'string' ? document.querySelector(t) : t;
    if (!el) return overlayTray || (overlayTray = new Tray(null));
    if (!trays.has(el)) trays.set(el, new Tray(el));
    return trays.get(el);
  }
  /** Eigene Würfelfläche in einem Element anlegen, z. B. einen Würfelteppich. */
  function createTray(el, opts) {
    const node = typeof el === 'string' ? document.querySelector(el) : el;
    if (node && trays.has(node)) {
      const t = trays.get(node);
      Object.assign(t.opts, opts || {});
      return t;
    }
    const t = new Tray(node, opts);
    if (node) trays.set(node, t);
    return t;
  }

  // ---- Öffentliche Wurf-Funktionen ----------------------------------------------

  function animate(result, o) {
    if (!hasDOM || o.animate === false) return Promise.resolve(result);
    try {
      const tray = resolveTray(o.tray);
      if (!tray) return Promise.resolve(result);
      return tray.play(result, o).catch(err => { console.error('[PnpDice]', err); return result; });
    } catch (err) {
      console.error('[PnpDice]', err);
      return Promise.resolve(result);
    }
  }

  /**
   * Würfeln und animieren. Liefert ein Promise mit dem Ergebnis, sobald die
   * Würfel liegen. Ereignisse: 'roll' sofort (für Netzwerk/Discord), 'settle' danach.
   * opts: { label, modifier, lang, tray, animate, sound, rng, crit, holdMs, showTotal, … }
   */
  function roll(notation, opts) {
    const o = Object.assign({}, config, opts || {});
    let result;
    try { result = evaluate(notation, o); }
    catch (e) { return Promise.reject(e); }
    if (opts && opts.source) Object.defineProperty(result, 'source', { value: opts.source, enumerable: false });
    if (opts && opts.meta) result.meta = opts.meta;
    emit('roll', result);
    return animate(result, o).then(() => { emit('settle', result); return result; });
  }

  /**
   * Ein fertiges Ergebnis zeigen, z. B. den Wurf eines Mitspielers aus dem
   * Netzwerk. Die Würfel zeigen exakt die übermittelten Werte.
   */
  function show(result, opts) {
    const o = Object.assign({}, config, opts || {});
    if (!result || !Array.isArray(result.groups)) return Promise.reject(new TypeError('PnpDice.show: kein Wurf-Ergebnis'));
    if (o.remote !== false) result.remote = true;
    emit('roll', result);
    return animate(result, o).then(() => { emit('settle', result); return result; });
  }

  // ---- Nachspielen über das Netzwerk -------------------------------------------------

  const REPLAY_MAX_NOTATION = 120;
  const REPLAY_MAX_WERTE = 500;

  /**
   * Kompakte Daten zu einem Wurf, die sich übers Netzwerk schicken lassen: { n: Formel, r: Zufallswerte, m: Bonus, l: Beschriftung }.
   * Würfe mit eigenen Würfeln (die der Empfänger nicht kennt) und zu große Würfe liefern null.
   */
  function replayData(result) {
    if (!result || !Array.isArray(result.raw) || typeof result.notation !== 'string') return null;
    if (result.notation.length > REPLAY_MAX_NOTATION || result.raw.length > REPLAY_MAX_WERTE) return null;
    // eigene Würfel kennt der Empfänger nicht; die eingebauten (Fudge) schon
    if ((result.groups || []).some(g => g && g.die && !g.die.builtin)) return null;
    const d = { n: result.notation, r: result.raw.slice() };
    if (result.modifier) d.m = result.modifier;
    if (result.label) d.l = String(result.label).slice(0, 60);
    return d;
  }

  /**
   * Aus replayData() das Ergebnis wieder aufbauen (ohne Animation). Prüft alles, denn die Daten kommen von anderen:
   * die Formel läuft durch den normalen Parser mit seinen Grenzen, die Werte müssen ganze Zahlen sein.
   * Wirft PnpDiceError bei ungültigen Daten.
   */
  function replayResult(data, opts) {
    const bad = msg => new DiceError('replay', msg);
    if (!data || typeof data !== 'object') throw bad('replay: keine Daten');
    if (typeof data.n !== 'string' || !data.n || data.n.length > REPLAY_MAX_NOTATION) throw bad('replay: ungültige Formel');
    if (!Array.isArray(data.r) || data.r.length > REPLAY_MAX_WERTE || !data.r.every(v => Number.isInteger(v) && v >= 1 && v <= 10000)) throw bad('replay: ungültige Werte');
    const modifier = Math.max(-1000, Math.min(1000, Math.trunc(Number(data.m) || 0)));
    const label = typeof data.l === 'string' ? data.l.slice(0, 60) : undefined;
    return evaluate(data.n, Object.assign({}, opts || {}, { rng: fixedRng(data.r, () => 1), modifier, label }));
  }

  /** Den Wurf eines anderen zeigen: die Würfel rollen und bleiben bei genau den übermittelten Werten liegen */
  function replay(data, opts) {
    let result;
    try { result = replayResult(data, opts); }
    catch (e) { return Promise.reject(e); }
    return show(result, opts);
  }

  // =========================================================================
  // 4. Würfel-Tool (Widget)
  // =========================================================================

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const richDetail = s => esc(s).replace(/~~(.+?)~~/g, '<s>$1</s>');

  const svg = (body, cls) => `<svg class="${cls || 'pd-ico'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${body}</svg>`;
  const ICON = {
    d4: '<path d="M12 3 21.5 19.5H2.5Z"/><path d="M12 3v16.5" opacity=".45"/>',
    d6: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    d8: '<path d="M12 2.5 21 12 12 21.5 3 12Z"/><path d="M3 12h18" opacity=".45"/>',
    d10: '<path d="M12 2.5 21 10.5 12 21.5 3 10.5Z"/><path d="m3 10.5 9 4 9-4M12 14.5v7" opacity=".45"/>',
    d12: '<path d="M12 2.5 21 9l-3.4 11H6.4L3 9Z"/><path d="M12 7l4.3 3.2-1.7 5.1H9.4l-1.7-5.1Z" opacity=".45"/>',
    d20: '<path d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5Z"/><path d="M12 7.5 17 15.5H7Z" opacity=".45"/>',
    d100: '<path d="M8 3 14 8.5 8 16 2 8.5Z"/><path d="M16 8l6 5.5-6 7.5-6-7.5Z"/>',
    custom: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/>',
    roll: '<rect x="3" y="7" width="11" height="11" rx="2.2"/><path d="M14 9.5 18.5 5.5 21 10l-4 4"/><circle cx="6.5" cy="10.5" r="1" fill="currentColor" stroke="none"/><circle cx="10.5" cy="14.5" r="1" fill="currentColor" stroke="none"/>',
    sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="m16 9.5 5 5m0-5-5 5"/>',
    cube: '<path d="M12 2.8 20 7.3v9.4L12 21.2 4 16.7V7.3Z"/><path d="M4 7.3l8 4.5 8-4.5M12 11.8v9.4"/>',
    flat: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 4l16 16" opacity=".6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
    trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12.5h10L18 7M9 7V4.5h6V7"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    wand: '<path d="m4 20 11-11M14 4v3M19.5 6.5l-2 2M20 12h-3M14 4l-1 0"/><path d="m15 9 2-2"/>',
  };
  const iconForGroup = term => {
    if (!term || term.type !== 'dice') return ICON.roll;
    if (term.die || term.inline) return term.die === 'fudge' ? ICON.d6 : ICON.custom;
    if (term.sides === 100) return ICON.d100;
    return ICON[shapeFor(term.sides)] || ICON.d20;
  };

  const WIDGET_CSS = `
:host{display:block;min-width:0;max-width:100%;--pd-a:var(--pd-accent,#fbbf24);--pd-bgc:var(--pd-bg,rgba(16,21,27,.92));--pd-sf:var(--pd-surface,rgba(255,255,255,.045));--pd-sf2:var(--pd-surface-2,rgba(255,255,255,.085));--pd-bd:var(--pd-border,rgba(255,255,255,.1));--pd-tx:var(--pd-text,#e8ecf1);--pd-mu:var(--pd-muted,#94a3b8);--pd-ok:var(--pd-success,#4ade80);--pd-bad:var(--pd-danger,#f87171);--pd-rad:var(--pd-radius,14px);color:var(--pd-tx);font-family:var(--pd-font,inherit);font-size:14px;line-height:1.35}
*,*::before,*::after{box-sizing:border-box}
button,input{font:inherit;color:inherit}
button{cursor:pointer;border:0;background:none;padding:0}
button:focus-visible,input:focus-visible{outline:2px solid var(--pd-a);outline-offset:2px}
[hidden]{display:none!important}
.pd{background:var(--pd-bgc);border:1px solid var(--pd-bd);border-radius:var(--pd-rad);box-shadow:0 12px 32px rgba(0,0,0,.35);overflow:hidden;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.pd-head{display:flex;align-items:center;gap:8px;padding:10px 12px}
.pd.open .pd-head{border-bottom:1px solid var(--pd-bd)}
.pd-title{flex:1;font-weight:800;font-size:13px;letter-spacing:.09em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pd-logo{color:var(--pd-a);display:flex}
.pd-ico{width:18px;height:18px;flex:none}
.pd-ib{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;color:var(--pd-mu);transition:background .15s,color .15s}
.pd-ib:hover{background:var(--pd-sf2);color:var(--pd-tx)}
.pd-ib.on{color:var(--pd-a)}
.pd-collapse .pd-ico{transition:transform .2s}
.pd:not(.open) .pd-collapse .pd-ico{transform:rotate(-90deg)}
.pd-body{padding:12px;display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
.pd:not(.open) .pd-body{display:none}
.pd-help{background:var(--pd-sf);border:1px solid var(--pd-bd);border-radius:10px;padding:10px 12px;font-size:12.5px;color:var(--pd-mu)}
.pd-help table{border-collapse:collapse;width:100%}
.pd-help td{padding:2px 0;vertical-align:top}
.pd-help td:first-child{padding-right:10px;white-space:nowrap}
.pd-help code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--pd-a);font-size:12px}
.pd-help p{margin:8px 0 0}
.pd-quick{display:flex;flex-wrap:wrap;gap:8px}
.pd-q{--c:#64748b;position:relative;flex:1 1 0;min-width:72px;display:flex;align-items:center;justify-content:center;gap:7px;padding:11px 10px;border-radius:10px;font-weight:700;color:#fff;background:linear-gradient(135deg,color-mix(in srgb,var(--c) 88%,#fff 12%),color-mix(in srgb,var(--c) 78%,#000 22%));box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 4px 14px color-mix(in srgb,var(--c) 28%,transparent);transition:transform .12s,filter .15s;text-shadow:0 1px 1px rgba(0,0,0,.25);user-select:none;-webkit-user-select:none}
.pd-q:hover{filter:brightness(1.1)}
.pd-q:active,.pd-q.hit{transform:scale(.95)}
.pd-quick.many{display:grid;grid-template-columns:repeat(auto-fit,minmax(36px,1fr));gap:6px}
.pd-quick.many .pd-q{flex-direction:column;gap:3px;min-width:0;padding:8px 2px;font-size:11.5px}
.pd-quick.many .pd-q .pd-ico{width:22px;height:22px}
.pd-favs .pd-q{flex:0 1 auto;padding:7px 12px;font-size:12.5px}
.pd-q.fav{background:var(--pd-sf2);color:var(--pd-tx);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 55%,transparent);text-shadow:none}
.pd-q.fav .pd-ico{color:var(--c)}
.pd-x{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;display:none;align-items:center;justify-content:center;font-size:12px;line-height:1;background:#1f2937;color:#fff;border:1px solid var(--pd-bd)}
.pd-q:hover .pd-x,.pd-chip:hover .pd-x{display:flex}
.pd-row{display:flex;gap:8px}
.pd-input{width:96px;min-width:0;flex:0 1 auto;padding:8px 10px;border-radius:9px;border:1px solid var(--pd-bd);background:rgba(0,0,0,.28);text-align:center;outline:none}
.pd-input::placeholder{color:var(--pd-mu);opacity:.7}
.pd-input.bad{border-color:var(--pd-bad)}
.pd-roll{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 12px;border-radius:9px;background:var(--pd-sf2);font-weight:700;transition:background .15s}
.pd-roll:hover{background:color-mix(in srgb,var(--pd-sf2) 70%,#fff 12%)}
.pd-pin{width:38px;border-radius:9px;background:var(--pd-sf);color:var(--pd-mu);display:flex;align-items:center;justify-content:center}
.pd-pin:hover{color:var(--pd-a)}
.pd-error{font-size:12.5px;color:var(--pd-bad);margin-top:-4px}
.pd-mod{display:flex;align-items:center;justify-content:center;gap:6px;font-size:12.5px;color:var(--pd-mu);padding:6px;border:1px solid var(--pd-bd);border-radius:9px;background:var(--pd-sf)}
.pd-mod .pd-ico{width:15px;height:15px}
.pd-mod button{width:26px;height:26px;border-radius:7px;background:var(--pd-sf2);color:var(--pd-tx);font-weight:700}
.pd-mod input{width:52px;padding:3px 4px;border-radius:7px;border:1px solid var(--pd-bd);background:rgba(0,0,0,.28);text-align:center;font-weight:700;font-size:15px;outline:none;-moz-appearance:textfield;appearance:textfield}
.pd-mod input::-webkit-inner-spin-button,.pd-mod input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.pd-mod input.pos{color:var(--pd-ok)}.pd-mod input.neg{color:var(--pd-bad)}
.pd-display{text-align:center;padding:16px 12px;border-radius:12px;border:1px solid var(--pd-bd);background:radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.06),rgba(0,0,0,.18))}
.pd-total{font-size:44px;font-weight:800;line-height:1.05;color:var(--pd-a);font-variant-numeric:tabular-nums;text-shadow:0 0 18px color-mix(in srgb,var(--pd-a) 35%,transparent);word-break:break-word}
.pd-total.small{font-size:24px}
.pd-total .pd-unit{font-size:16px;font-weight:700;margin-left:6px;opacity:.85}
.pd-total.rolling{opacity:.55;filter:blur(.4px)}
.pd-total.pop{animation:pd-pop .35s cubic-bezier(.2,1.4,.4,1)}
.pd-total.crit{color:var(--pd-ok);text-shadow:0 0 20px color-mix(in srgb,var(--pd-ok) 55%,transparent)}
.pd-total.fumble{color:var(--pd-bad);text-shadow:0 0 20px color-mix(in srgb,var(--pd-bad) 55%,transparent)}
.pd-tag{display:inline-block;margin-top:4px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:999px}
.pd-tag.crit{background:color-mix(in srgb,var(--pd-ok) 18%,transparent);color:var(--pd-ok)}
.pd-tag.fumble{background:color-mix(in srgb,var(--pd-bad) 18%,transparent);color:var(--pd-bad)}
.pd-lbl{font-weight:700;margin-top:6px}
.pd-detail{font-size:13px;margin-top:4px;color:var(--pd-tx);opacity:.85;word-break:break-word}
.pd-detail s,.pd-e-val s{opacity:.55}
.pd-time{font-size:12px;color:var(--pd-mu);margin-top:6px;min-height:1.2em}
.pd-sec{display:flex;align-items:center;justify-content:space-between;font-weight:700;font-size:13px;color:var(--pd-mu)}
.pd-sec .pd-ib{width:26px;height:26px}
.pd-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.pd-chip{--c:#0d9488;position:relative;display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:var(--pd-sf);border:1px solid color-mix(in srgb,var(--c) 45%,transparent);font-size:12.5px;font-weight:600}
.pd-chip:hover{background:var(--pd-sf2)}
.pd-chip i{width:9px;height:9px;border-radius:3px;background:var(--c);transform:rotate(45deg)}
.pd-chip small{color:var(--pd-mu);font-weight:500;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pd-chip.add{border-style:dashed;border-color:var(--pd-bd);color:var(--pd-mu)}
.pd-chip.add .pd-ico{width:14px;height:14px}
.pd-form{display:grid;grid-template-columns:1fr auto;gap:6px;margin-top:8px}
.pd-form input{padding:7px 9px;border-radius:8px;border:1px solid var(--pd-bd);background:rgba(0,0,0,.28);outline:none;min-width:0}
.pd-form input[type=color]{width:42px;padding:2px;height:34px}
.pd-form .faces{grid-column:1/-1}
.pd-form .acts{grid-column:1/-1;display:flex;gap:6px;justify-content:flex-end}
.pd-form .acts button{padding:6px 12px;border-radius:8px;background:var(--pd-sf2);font-weight:600}
.pd-form .acts button[type=submit]{background:var(--pd-a);color:#111}
.pd-log ul{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:6px;grid-template-columns:minmax(0,1fr);max-height:var(--pd-log-height,300px);overflow:auto}
.pd-entry{--c:var(--pd-a);display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;background:var(--pd-sf);border:1px solid transparent;cursor:pointer;transition:background .15s,border-color .15s}
.pd-entry:hover{background:var(--pd-sf2);border-color:var(--pd-bd)}
.pd-entry.new{animation:pd-in .3s ease-out}
.pd-e-time{font-size:11px;color:var(--pd-mu);white-space:nowrap;min-width:52px}
.pd-e-main{flex:1;min-width:0;display:flex;flex-direction:column}
.pd-e-not{font-weight:700;color:var(--c);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pd-e-lbl{font-size:11.5px;color:var(--pd-mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pd-e-val{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:700;color:var(--pd-a);text-align:right;font-size:12.5px;max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pd-entry.crit .pd-e-val{color:var(--pd-ok)}.pd-entry.fumble .pd-e-val{color:var(--pd-bad)}
.pd-empty{font-size:12.5px;color:var(--pd-mu);text-align:center;padding:6px}
@keyframes pd-pop{0%{transform:scale(.6);opacity:.3}100%{transform:scale(1);opacity:1}}
@keyframes pd-in{from{transform:translateY(-6px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.pd-total.pop,.pd-entry.new{animation:none}}
`;

  const WIDGET_DEFAULTS = {
    title: null,
    lang: null,
    quick: ['1w4', '1w6', '1w8', '1w10', '1w12', '1w20', '1w100'],
    input: true,
    modifier: true,
    modifierSticky: false,
    modifierProvider: null,     // function() -> Zahl; Bonus von außen, wenn modifier: false ist (z. B. ein eigenes Bonusfeld der App)
    display: true,              // false = die große Ergebnisanzeige im Tool ausblenden (die App zeigt das Ergebnis selbst)
    log: true,
    logLimit: 25,
    customDice: true,
    favorites: true,
    help: true,
    collapsible: true,
    collapsed: false,
    storageKey: 'pnp-dice',     // false = nichts speichern
    captureAll: true,           // auch Würfe von außerhalb (PnpDice.roll, data-pnp-roll, show) anzeigen
    tray: undefined,            // undefined = globale Einstellung
    sound: false,
    animate: true,
    onRoll: null,               // function(result) nach dem Liegenbleiben (eigene und gefangene Würfe)
  };

  class Widget {
    constructor(target, options) {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) throw new Error('PnpDice.mount: Ziel-Element nicht gefunden');
      this.o = Object.assign({}, WIDGET_DEFAULTS, options || {});
      this.lang = resolveLang(this.o.lang || config.lang);
      this.t = I18N[this.lang];
      this.state = { log: [], favs: [], dice: [], sound: !!this.o.sound, animate: this.o.animate !== false,
                     collapsed: !!this.o.collapsed };
      this._load();
      for (const d of this.state.dice) {
        try { if (!registry.has(dieKey(d.name))) defineDie(d.name, { faces: d.faces, color: d.color, user: true }); } catch (e) { /* kaputter Eintrag */ }
      }
      this.listeners = {};
      this.host = document.createElement('div');
      this.host.className = 'pnp-dice';
      el.appendChild(this.host);
      this.root = this.host.attachShadow({ mode: 'open' });
      this.root.innerHTML = `<style>${WIDGET_CSS}</style>${this._markup()}`;
      this.$ = sel => this.root.querySelector(sel);
      this._bind();
      this._renderQuick();
      this._renderCustom();
      this._renderLog();
      this._renderToggles();
      this._unsubs = [on('roll', r => this._onRoll(r)), on('settle', r => this._onSettle(r)), on('dice', () => this._renderCustom())];
      this._timer = setInterval(() => this._tick(), 1000);
    }

    // ---- Öffentliche Methoden ----
    roll(notation, extra) {
      try { parse(notation, this.lang); }
      catch (e) { this._error(e.message); return Promise.resolve(null); }
      this._error('');
      const mod = this.o.modifier ? this._takeModifier() : typeof this.o.modifierProvider === 'function' ? Math.trunc(Number(this.o.modifierProvider()) || 0) : 0;
      const opts = Object.assign({ lang: this.lang, modifier: mod, source: this, sound: this.state.sound,
                                   animate: this.state.animate ? config.animate : false }, extra || {});
      if (this.o.tray !== undefined) opts.tray = this.o.tray;
      return roll(notation, opts).catch(e => { this._error(e.message); return null; });
    }
    on(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); return this; }
    getLog() { return this.state.log.slice(); }
    clearLog() { this.state.log = []; this._save(); this._renderLog(); }
    setCollapsed(v) { this.state.collapsed = !!v; this._save(); this._renderToggles(); }
    destroy() {
      clearInterval(this._timer);
      clearInterval(this._flicker);
      clearTimeout(this._flickerStop);
      this._unsubs.forEach(u => u());
      this.host.remove();
    }

    _emit(type, payload) { (this.listeners[type] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } }); }

    // ---- Speicher ----
    _load() {
      if (!this.o.storageKey || !hasDOM) return;
      try {
        const raw = localStorage.getItem(this.o.storageKey);
        if (!raw) return;
        const s = JSON.parse(raw);
        if (Array.isArray(s.log)) this.state.log = s.log.slice(0, this.o.logLimit);
        if (Array.isArray(s.favs)) this.state.favs = s.favs.filter(x => typeof x === 'string');
        if (Array.isArray(s.dice)) this.state.dice = s.dice.filter(d => d && d.name && Array.isArray(d.faces));
        if (typeof s.sound === 'boolean') this.state.sound = s.sound;
        if (typeof s.animate === 'boolean') this.state.animate = s.animate;
        if (typeof s.collapsed === 'boolean' && this.o.collapsible) this.state.collapsed = s.collapsed;
      } catch (e) { /* privates Fenster o. Ä. */ }
    }
    _save() {
      if (!this.o.storageKey) return;
      try { localStorage.setItem(this.o.storageKey, JSON.stringify(this.state)); } catch (e) { /* voll oder gesperrt */ }
    }

    // ---- Aufbau ----
    _markup() {
      const t = this.t, o = this.o;
      const helpRows = t.helpRows.map(([c, d]) => `<tr><td><code>${esc(c)}</code></td><td>${esc(d)}</td></tr>`).join('');
      return `
<div class="pd open" part="panel">
  <div class="pd-head" part="header">
    ${o.collapsible ? `<button class="pd-ib pd-collapse" data-act="collapse" title="${esc(t.collapse)}" aria-label="${esc(t.collapse)}">${svg(ICON.chevron)}</button>` : ''}
    <span class="pd-logo">${svg(ICON.d20)}</span>
    <span class="pd-title">${esc(o.title || t.title)}</span>
    <button class="pd-ib" data-act="sound" aria-pressed="false"></button>
    <button class="pd-ib" data-act="anim" aria-pressed="false"></button>
    ${o.help ? `<button class="pd-ib" data-act="help" title="${esc(t.help)}" aria-label="${esc(t.help)}">${svg(ICON.help)}</button>` : ''}
  </div>
  <div class="pd-body" part="body">
    <div class="pd-help" hidden><table>${helpRows}</table><p>${esc(t.helpNote)}</p></div>
    <div class="pd-quick" part="quick"></div>
    <div class="pd-quick pd-favs" hidden></div>
    ${o.customDice ? `<div class="pd-custom"><div class="pd-sec"><span>${esc(t.customDice)}</span></div><div class="pd-chips"></div>
      <form class="pd-form" hidden>
        <input name="name" placeholder="${esc(t.dieName)}" maxlength="24" required>
        <input name="color" type="color" value="#0d9488" title="${esc(t.dieColor)}">
        <input class="faces" name="faces" placeholder="${esc(t.dieFaces)}" required>
        <div class="acts"><button type="button" data-act="cancel">${esc(t.cancel)}</button><button type="submit">${esc(t.save)}</button></div>
      </form></div>` : ''}
    ${o.input ? `<div class="pd-row">
      <input class="pd-input" placeholder="${esc(t.placeholder)}" aria-label="${esc(t.placeholder)}" autocomplete="off" spellcheck="false">
      ${o.favorites ? `<button class="pd-pin" data-act="pin" title="${esc(t.pin)}" aria-label="${esc(t.pin)}">${svg(ICON.star)}</button>` : ''}
      <button class="pd-roll" data-act="roll">${svg(ICON.roll)}<span>${esc(t.roll)}</span></button>
    </div><div class="pd-error" role="alert" hidden></div>` : ''}
    ${o.modifier ? `<div class="pd-mod">${svg(ICON.wand)}<span>${esc(t.modifier)}:</span>
      <button data-act="minus" aria-label="-1">−</button><input type="number" value="0" step="1" aria-label="${esc(t.modifier)}"><button data-act="plus" aria-label="+1">+</button></div>` : ''}
    <div class="pd-display" part="display" aria-live="polite"${o.display === false ? ' hidden' : ''}>
      <div class="pd-total">–</div><div class="pd-tagwrap"></div><div class="pd-lbl" hidden></div>
      <div class="pd-detail"></div><div class="pd-time"></div>
    </div>
    ${o.log ? `<div class="pd-log" part="log"><div class="pd-sec"><span>${esc(t.lastRolls)}</span>
      <button class="pd-ib" data-act="clear" title="${esc(t.clear)}" aria-label="${esc(t.clear)}">${svg(ICON.trash)}</button></div><ul></ul></div>` : ''}
  </div>
</div>`;
    }

    _bind() {
      const r = this.root;
      r.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        const unfav = e.target.closest('[data-unfav]');
        if (unfav) { e.stopPropagation(); this._unfav(unfav.dataset.unfav); return; }
        const undie = e.target.closest('[data-undie]');
        if (undie) { e.stopPropagation(); this._removeUserDie(undie.dataset.undie); return; }
        const q = e.target.closest('.pd-q');
        if (q) { this._quick(q, e.shiftKey); return; }
        const chip = e.target.closest('.pd-chip[data-die]');
        if (chip) { this._dieChip(chip, e.shiftKey); return; }
        const entry = e.target.closest('.pd-entry');
        if (entry) { const it = this.state.log.find(x => x.id === entry.dataset.id); if (it) this.roll(it.notation, { label: it.label || undefined }); return; }
        if (!b) return;
        const act = b.dataset.act;
        if (act === 'collapse') this.setCollapsed(!this.state.collapsed);
        else if (act === 'sound') { this.state.sound = !this.state.sound; this._save(); this._renderToggles(); }
        else if (act === 'anim') { this.state.animate = !this.state.animate; this._save(); this._renderToggles(); }
        else if (act === 'help') { const h = this.$('.pd-help'); h.hidden = !h.hidden; }
        else if (act === 'roll') this._rollInput();
        else if (act === 'pin') this._pin();
        else if (act === 'minus' || act === 'plus') this._stepMod(act === 'plus' ? 1 : -1);
        else if (act === 'clear') this.clearLog();
        else if (act === 'newdie') { const f = this.$('.pd-form'); f.hidden = !f.hidden; if (!f.hidden) f.name.focus(); }
        else if (act === 'cancel') { const f = this.$('.pd-form'); f.reset(); f.hidden = true; }
      });
      r.addEventListener('contextmenu', e => {
        const q = e.target.closest('.pd-q');
        const chip = e.target.closest('.pd-chip[data-die]');
        if (q || chip) { e.preventDefault(); q ? this._quick(q, true) : this._dieChip(chip, true); }
      });
      const input = this.$('.pd-input');
      if (input) {
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); this._rollInput(); }
          else if (e.key === 'ArrowUp' && this.state.log[0]) { e.preventDefault(); input.value = this.state.log[0].notation; }
        });
        input.addEventListener('input', () => { input.classList.remove('bad'); this._error(''); });
      }
      const mod = this.$('.pd-mod input');
      if (mod) mod.addEventListener('input', () => this._paintMod());
      const form = this.$('.pd-form');
      if (form) form.addEventListener('submit', e => { e.preventDefault(); this._saveDie(form); });
      r.addEventListener('dragstart', e => {
        const li = e.target.closest && e.target.closest('.pd-entry');
        if (!li) return;
        const it = this.state.log.find(x => x.id === li.dataset.id);
        if (it) e.dataTransfer.setData('text/plain', `[${this.lang === 'de' ? 'Wurf' : 'Roll'}] ${it.text.replace(/~~/g, '')}`);
      });
    }

    _renderToggles() {
      const t = this.t;
      const s = this.$('[data-act="sound"]');
      s.innerHTML = svg(this.state.sound ? ICON.sound : ICON.mute);
      s.classList.toggle('on', this.state.sound);
      s.title = t.sound; s.setAttribute('aria-label', t.sound); s.setAttribute('aria-pressed', String(this.state.sound));
      const a = this.$('[data-act="anim"]');
      a.innerHTML = svg(this.state.animate ? ICON.cube : ICON.flat);
      a.classList.toggle('on', this.state.animate);
      a.title = t.anim; a.setAttribute('aria-label', t.anim); a.setAttribute('aria-pressed', String(this.state.animate));
      const open = !(this.o.collapsible && this.state.collapsed);
      this.$('.pd').classList.toggle('open', open);
      const c = this.$('[data-act="collapse"]');
      if (c) c.setAttribute('aria-expanded', String(open));
    }

    _quickItems() {
      const items = this.o.quick.map(q => (typeof q === 'string' ? { notation: q } : Object.assign({}, q)));
      if (this.o.favorites) this.state.favs.forEach(f => items.push({ notation: f, fav: true }));
      return items;
    }
    _renderQuick() {
      const items = this._quickItems();
      const button = (it, i) => {
        let ast = null;
        try { ast = parse(it.notation, this.lang); } catch (e) { return ''; }
        const first = ast.terms.find(x => x.type === 'dice');
        const color = it.color || (first ? colorForGroup({ die: first.die ? registry.get(first.die) : first.inline ? {} : null, sides: first.sides }, config) : '#64748b');
        const label = it.label || ast.label || format(ast, this.lang);
        return `<button class="pd-q${it.fav ? ' fav' : ''}" data-i="${i}" style="--c:${esc(color)}" title="${esc(this.t.quickHint)}">${svg(iconForGroup(first))}<span>${esc(label)}</span>${it.fav ? `<span class="pd-x" data-unfav="${esc(it.notation)}" title="${esc(this.t.remove)}">×</span>` : ''}</button>`;
      };
      const quick = this.$('.pd-quick:not(.pd-favs)');
      quick.classList.toggle('many', this.o.quick.length > 3);
      quick.hidden = !this.o.quick.length;
      quick.innerHTML = items.filter(it => !it.fav).map(button).join('');
      const favs = this.$('.pd-favs');
      favs.hidden = !this.state.favs.length || !this.o.favorites;
      favs.innerHTML = items.map((it, i) => (it.fav ? button(it, i) : '')).join('');
    }
    _quick(btn, addToFormula) {
      const it = this._quickItems()[+btn.dataset.i];
      if (!it) return;
      btn.classList.add('hit');
      setTimeout(() => btn.classList.remove('hit'), 160);
      if (addToFormula && this.o.input) this._addToFormula(it.notation);
      else this.roll(it.notation, it.label ? { label: it.label } : undefined);
    }
    _addToFormula(notation) {
      const input = this.$('.pd-input');
      const add = parse(notation, this.lang);
      let ast = null;
      try { if (input.value.trim()) ast = parse(input.value, this.lang); } catch (e) { ast = null; }
      if (!ast) { input.value = format(add, this.lang); return; }
      for (const nt of add.terms) {
        const same = nt.type === 'dice' && ast.terms.find(x => x.type === 'dice' && x.sign === nt.sign && x.sides === nt.sides &&
          x.die === nt.die && !x.inline && !nt.inline && !x.keep && !x.explode && !x.reroll && !x.success &&
          !nt.keep && !nt.explode && !nt.reroll && !nt.success);
        if (same && same.count + nt.count <= 100) same.count += nt.count;
        else ast.terms.push(nt);
      }
      input.value = format(ast, this.lang) + (ast.label ? ` # ${ast.label}` : '');
      input.focus();
    }
    _rollInput() {
      const input = this.$('.pd-input');
      if (!input) return;
      const v = input.value.trim() || input.placeholder;
      try { parse(v, this.lang); } catch (e) { input.classList.add('bad'); this._error(e.message); return; }
      this.roll(v);
    }
    _pin() {
      const input = this.$('.pd-input');
      const v = input.value.trim();
      if (!v) return;
      let f;
      try { f = format(parse(v, this.lang), this.lang); } catch (e) { input.classList.add('bad'); this._error(e.message); return; }
      const ast = parse(v, this.lang);
      const full = f + (ast.label ? ` # ${ast.label}` : '');
      if (!this.state.favs.includes(full)) { this.state.favs.push(full); this._save(); this._renderQuick(); }
    }
    _unfav(n) {
      this.state.favs = this.state.favs.filter(f => f !== n);
      this._save();
      this._renderQuick();
    }

    _renderCustom() {
      const wrap = this.$('.pd-chips');
      if (!wrap) return;
      const dice = listDice().filter(d => !d.builtin);
      wrap.innerHTML = dice.map(d => `<button class="pd-chip" data-die="${esc(d.name)}" style="--c:${esc(d.color || config.colors.custom)}" title="${esc(this.t.quickHint)}"><i></i>${esc(d.name)}<small>${esc(d.faces.map(f => f.label).join(' '))}</small>${d.user ? `<span class="pd-x" data-undie="${esc(d.name)}" title="${esc(this.t.remove)}">×</span>` : ''}</button>`).join('') +
        `<button class="pd-chip add" data-act="newdie">${svg(ICON.plus)}${esc(this.t.newDie)}</button>`;
    }
    _dieChip(chip, addToFormula) {
      const n = `1${this.t.letter}{${chip.dataset.die}}`;
      if (addToFormula && this.o.input) this._addToFormula(n);
      else this.roll(n);
    }
    _saveDie(form) {
      const name = form.name.value.trim();
      const faces = form.faces.value.split(',').map(s => s.trim()).filter(Boolean);
      try {
        defineDie(name, { faces, color: form.color.value, user: true });
      } catch (e) { this._error(e.message); return; }
      this.state.dice = this.state.dice.filter(d => dieKey(d.name) !== dieKey(name));
      this.state.dice.push({ name, faces, color: form.color.value });
      this._save();
      form.reset();
      form.hidden = true;
      this._error('');
    }
    _removeUserDie(name) {
      removeDie(name);
      this.state.dice = this.state.dice.filter(d => dieKey(d.name) !== dieKey(name));
      this._save();
      this._renderCustom();
    }

    _modInput() { return this.$('.pd-mod input'); }
    _stepMod(d) { const m = this._modInput(); m.value = (parseInt(m.value, 10) || 0) + d; this._paintMod(); }
    _paintMod() {
      const m = this._modInput();
      const v = parseInt(m.value, 10) || 0;
      m.classList.toggle('pos', v > 0);
      m.classList.toggle('neg', v < 0);
    }
    _takeModifier() {
      const m = this._modInput();
      if (!m) return 0;
      const v = parseInt(m.value, 10) || 0;
      if (!this.o.modifierSticky) { m.value = 0; this._paintMod(); }
      return v;
    }

    _error(msg) {
      const e = this.$('.pd-error');
      if (!e) return;
      e.textContent = msg;
      e.hidden = !msg;
    }

    _captures(r) { return r.source === this || (this.o.captureAll && (!r.source || !(r.source instanceof Widget))); }

    _onRoll(r) {
      if (!this._captures(r)) return;
      this._current = r.id;
      const tot = this.$('.pd-total');
      tot.className = 'pd-total rolling';
      this.$('.pd-tagwrap').innerHTML = '';
      this.$('.pd-detail').textContent = this.t.rolling;
      const time = this.$('.pd-time');
      time.textContent = '';
      delete time.dataset.ts;
      const lbl = this.$('.pd-lbl');
      lbl.hidden = !r.label;
      lbl.textContent = r.label || '';
      clearInterval(this._flicker);
      const lo = r.min != null ? r.min : 1, hi = r.max != null ? r.max : 20;
      const faces = r.total == null ? [].concat(...r.groups.filter(g => g.die).map(g => g.die.faces)) : null;
      clearTimeout(this._flickerStop);
      this._flickerStop = setTimeout(() => { if (this._current === r.id) { clearInterval(this._flicker); this._showResult(r); } }, 8000);
      this._flicker = setInterval(() => {
        tot.textContent = faces && faces.length ? faces[Math.floor(Math.random() * faces.length)] : String(lo + Math.floor(Math.random() * (hi - lo + 1)));
      }, 70);
      this._emit('roll', r);
    }

    _onSettle(r) {
      if (!this._captures(r)) return;
      if (this._current === r.id) {
        clearInterval(this._flicker);
        clearTimeout(this._flickerStop);
        this._showResult(r);
      }
      if (this.o.log) this._addLog(r);
      this._emit('settle', r);
      if (typeof this.o.onRoll === 'function') { try { this.o.onRoll(r); } catch (e) { console.error(e); } }
    }

    _showResult(r) {
      const t = this.t;
      const tot = this.$('.pd-total');
      tot.className = 'pd-total pop' + (r.crit ? ' crit' : r.fumble ? ' fumble' : '') + (r.display.length > 6 ? ' small' : '');
      tot.innerHTML = esc(r.display) + (r.unit ? `<span class="pd-unit">${esc(r.unit)}</span>` : '');
      this.$('.pd-tagwrap').innerHTML = r.crit ? `<span class="pd-tag crit">${esc(t.crit)}</span>` : r.fumble ? `<span class="pd-tag fumble">${esc(t.fumble)}</span>` : '';
      const lbl = this.$('.pd-lbl');
      lbl.hidden = !r.label;
      lbl.textContent = r.label || '';
      const dice = r.groups.filter(g => g.type === 'dice');
      const n = dice.reduce((a, g) => a + g.rolls.length, 0);
      const symbol = n === 1 && dice[0].die;
      const vals = n > 1 || symbol ? ` (${dice.map(g => g.rolls.map(rollText).join(', ')).join(' | ')})` : '';
      const mod = r.modifier ? ` ${signed(r.modifier)}` : '';
      this.$('.pd-detail').innerHTML = `${esc(t.rolled)}: ${esc(r.notation)}${richDetail(vals)}${esc(mod)}`;
      const time = this.$('.pd-time');
      time.dataset.ts = r.timestamp;
      time.textContent = t.ago(0, false);
    }

    _addLog(r) {
      if (this.state.log.some(x => x.id === r.id)) return;
      const first = r.groups.find(g => g.type === 'dice');
      this.state.log.unshift({
        id: r.id, ts: r.timestamp, notation: r.notation, label: r.label || '', detail: r.detail,
        display: r.display, text: r.text, crit: r.crit, fumble: r.fumble,
        color: first ? colorForGroup(first, config) : null, remote: !!r.remote,
      });
      this.state.log = this.state.log.slice(0, this.o.logLimit);
      this._save();
      this._renderLog(r.id);
    }

    _renderLog(newId) {
      const ul = this.$('.pd-log ul');
      if (!ul) return;
      if (!this.state.log.length) { ul.innerHTML = `<li class="pd-empty">${esc(this.t.empty)}</li>`; return; }
      const now = Date.now();
      ul.innerHTML = this.state.log.map(it => `
        <li class="pd-entry${it.crit ? ' crit' : ''}${it.fumble ? ' fumble' : ''}${it.id === newId ? ' new' : ''}" data-id="${esc(it.id)}" draggable="true" title="${esc(this.t.entryHint)}" style="--c:${esc(it.color || 'var(--pd-a)')}">
          <span class="pd-e-time" data-ts="${it.ts}">${esc(this.t.ago(Math.floor((now - it.ts) / 1000), true))}</span>
          <span class="pd-e-main"><span class="pd-e-not">${esc(it.notation)}</span>${it.label ? `<span class="pd-e-lbl">${esc(it.label)}</span>` : ''}</span>
          <span class="pd-e-val" title="${esc(it.detail.replace(/~~/g, ''))}">${richDetail(it.detail)}</span>
        </li>`).join('');
    }

    _tick() {
      const now = Date.now();
      this.root.querySelectorAll('[data-ts]').forEach(el => {
        const sec = Math.floor((now - Number(el.dataset.ts)) / 1000);
        el.textContent = this.t.ago(sec, el.classList.contains('pd-e-time'));
      });
    }
  }

  function mount(target, options) { return new Widget(target, options); }

  /**
   * Alle Elemente mit data-pnp-roll="1w20+5" würfeln beim Klick.
   * Optional: data-pnp-label="Angriff", data-pnp-tray="#teppich".
   * Gibt eine Funktion zum Lösen der Bindung zurück.
   */
  function bindAttributes(scope) {
    if (!hasDOM) return () => {};
    const el = scope || document;
    const handler = e => {
      const t = e.target.closest && e.target.closest('[data-pnp-roll]');
      if (!t || !el.contains(t)) return;
      e.preventDefault();
      const opts = {};
      if (t.dataset.pnpLabel) opts.label = t.dataset.pnpLabel;
      if (t.dataset.pnpTray) opts.tray = t.dataset.pnpTray;
      roll(t.dataset.pnpRoll, opts).catch(err => console.warn('[PnpDice]', err.message));
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }

  // Eingebauter Fudge-/FATE-Würfel (4wF)
  defineDie('fudge', {
    label: 'F',
    faces: [{ label: '+', value: 1 }, { label: '+', value: 1 }, { label: ' ', value: 0 },
            { label: ' ', value: 0 }, { label: '−', value: -1 }, { label: '−', value: -1 }],
    shape: 'd6', color: DEFAULT_COLORS.fudge, builtin: true,
  });

  const PnpDice = {
    version: VERSION,
    configure, config,
    parse, format, evaluate, roll, show,
    defineDie, removeDie, getDie, listDice,
    createRng, fixedRng, createTray, mount, bindAttributes,
    replay, replayData, replayResult,
    on, off,
    i18n: I18N,
    DiceError, Tray, Widget,
    _internal: { getShape, hull, buildSpecs, simulate, shapeFor },
  };

  if (typeof module === 'object' && module && module.exports) module.exports = PnpDice;
  root.PnpDice = PnpDice;
})(typeof globalThis !== 'undefined' ? globalThis : this);
