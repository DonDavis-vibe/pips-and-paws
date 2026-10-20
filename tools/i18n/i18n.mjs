#!/usr/bin/env node
// Translation kit for Pips & Paws — no dependencies, Node 18+.
//
//   node tools/i18n/i18n.mjs status                 coverage + problems per language
//   node tools/i18n/i18n.mjs template <lang>        write a commented template (missing + suspicious keys)
//   node tools/i18n/i18n.mjs template <lang> --all  ... with every key (to review a whole language)
//   node tools/i18n/i18n.mjs template new           the blank preset for a NEW language (all keys, empty)
//   node tools/i18n/i18n.mjs register <code> [LABEL] add a new language to src/i18n/index.jsx (import, DICTS, language switch)
//   node tools/i18n/i18n.mjs templates              regenerate the committed templates in docs/translations/
//   node tools/i18n/i18n.mjs package <lang|new>     build a zip to hand to a translator (template + checker + guide + screenshots)
//   node tools/i18n/i18n.mjs apply <file> <lang>    merge a filled-in template into src/i18n/<lang>.json
//
// The UI texts live in src/i18n/<code>.json. English (en.json) is the source;
// missing keys fall back to English at runtime, so a partial translation is fine.
// The template is JSON with // comments: context, placeholders, reference
// translations and the English source above every key. `apply` ignores the
// comments, checks the {placeholders} and writes the language file.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const I18N = path.join(ROOT, 'src', 'i18n');
const OUT = path.join(ROOT, 'docs', 'translations');
const SRC_REF = 'en';
const SECOND_REF = 'de'; // shown next to English: the most complete second language

const ctx = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'i18n', 'context.json'), 'utf8'));
const notesFile = path.join(ROOT, 'tools', 'i18n', 'langnotes.json');
const langNotes = fs.existsSync(notesFile) ? JSON.parse(fs.readFileSync(notesFile, 'utf8')) : {};
// 'new' = the blank preset; any other code without a src/i18n/<code>.json is a new language too.
const isNewLang = (lang) => lang === 'new' || !fs.existsSync(path.join(I18N, `${lang}.json`));
const languageName = (code) => { try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || code; } catch { return code; } };

const readDict = (lang) => {
  const file = path.join(I18N, `${lang}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
};
const languages = () => fs.readdirSync(I18N).filter((f) => /^[a-z]{2,3}(-[A-Za-z]+)?\.json$/.test(f)).map((f) => f.replace('.json', '')).sort();
const placeholders = (s) => [...new Set([...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
const sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
// Keys whose text is legal/technical and meant to stay English everywhere.
const KEEP_ENGLISH = new Set(['footer.disclaimer1', 'footer.disclaimer2']);
// A value identical to English is only suspicious when it is real prose.
const looksUntranslated = (key, en, val) => val === en && /[a-z]{4}/.test(en) && !KEEP_ENGLISH.has(key) && !/^[A-Z0-9 ./:&+-]+$/.test(en);

// --- where is a key used? (static scan of src/) -------------------------------
function usageMap(keys) {
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'assets' && e.name !== 'i18n') walk(p); } else if (/\.(jsx?|mjs)$/.test(e.name)) files.push(p);
    }
  };
  walk(path.join(ROOT, 'src'));
  const keySet = new Set(keys);
  const used = new Map();
  const add = (key, file) => { if (!used.has(key)) used.set(key, new Set()); used.get(key).add(path.basename(file)); };
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/['"`]([a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+)['"`]/g)) if (keySet.has(m[1])) add(m[1], file);
    // dynamic keys: t(`nav.${id}`) -> every key below "nav."
    for (const m of text.matchAll(/`([a-z][A-Za-z0-9.]*)\.\$\{/g)) {
      const prefix = `${m[1]}.`;
      for (const k of keys) if (k.startsWith(prefix)) add(k, file);
    }
  }
  return used;
}

// --- sections ---------------------------------------------------------------------
function sectionOf(key) {
  const parts = key.split('.');
  for (let n = Math.min(3, parts.length - 1); n >= 1; n -= 1) {
    const id = parts.slice(0, n).join('.');
    if (ctx.sections[id]) return { id, ...ctx.sections[id] };
  }
  return { id: parts[0], title: parts[0], note: '' };
}

function lengthHint(key, en) {
  if (key.startsWith('help.') || key.startsWith('hint.') || en.length > 80) return '';
  if (en.length <= 14 && !/\{/.test(en)) return 'Short UI text (button/label): keep it about as short as the English.';
  return '';
}

// --- status -------------------------------------------------------------------------
function analyse(lang, en) {
  const dict = readDict(lang);
  const res = { lang, missing: [], untranslated: [], badPlaceholders: [], unknown: [], empty: [] };
  // Words that are the same in English and German are usually international (Discord, Fanfare): not suspicious.
  const de = lang === SECOND_REF ? null : readDict(SECOND_REF);
  if (!dict) { res.missing = Object.keys(en); return res; }
  for (const key of Object.keys(en)) {
    if (!(key in dict)) { res.missing.push(key); continue; }
    const v = dict[key];
    if (typeof v !== 'string' || v.trim() === '') { res.empty.push(key); continue; }
    if (lang !== SRC_REF) {
      if (!sameSet(placeholders(en[key]), placeholders(v))) res.badPlaceholders.push(key);
      if (looksUntranslated(key, en[key], v) && !(de && de[key] === en[key])) res.untranslated.push(key);
    }
  }
  for (const key of Object.keys(dict)) if (!(key in en)) res.unknown.push(key);
  return res;
}

function cmdStatus() {
  const en = readDict(SRC_REF);
  const total = Object.keys(en).length;
  let errors = 0;
  console.log(`English source: ${total} keys\n`);
  console.log('lang  done    missing  same-as-EN  placeholder-errors  unknown-keys');
  for (const lang of languages()) {
    if (lang === SRC_REF) continue;
    const a = analyse(lang, en);
    const missing = a.missing.length + a.empty.length;
    const pct = (((total - missing) / total) * 100).toFixed(0).padStart(3);
    console.log(`${lang.padEnd(5)} ${pct}%   ${String(missing).padStart(7)}  ${String(a.untranslated.length).padStart(10)}  ${String(a.badPlaceholders.length).padStart(18)}  ${String(a.unknown.length).padStart(12)}`);
    for (const k of a.badPlaceholders) console.log(`      ! placeholders differ: ${k}  (EN ${placeholders(en[k]).map((p) => `{${p}}`).join(' ') || '-'})`);
    for (const k of a.unknown) console.log(`      ! key not in en.json: ${k}`);
    errors += a.badPlaceholders.length + a.unknown.length;
  }
  console.log('\n"missing" falls back to English at runtime; "same-as-EN" may be fine (names, numbers) or untranslated.');
  console.log('Next: node tools/i18n/i18n.mjs template <lang>');
  process.exitCode = errors ? 1 : 0;
}

// --- template -------------------------------------------------------------------------
async function glossaryLines(lang, dicts) {
  const refLangs = [...new Set([SRC_REF, SECOND_REF, ...languages().filter((l) => l !== lang)])].filter((l) => dicts[l]).slice(0, 5);
  const lines = [];
  for (const g of ctx.glossary) {
    const keys = [g.key, ...(g.also || [])];
    const parts = refLangs.map((l) => {
      const vals = keys.map((k) => dicts[l][k]).filter(Boolean);
      return vals.length ? `${l.toUpperCase()}: ${vals.join(' / ')}` : null;
    }).filter(Boolean);
    lines.push(`//   ${g.term}${g.note ? ` — ${g.note}` : ''}`);
    if (parts.length) lines.push(`//     ${parts.join('   ')}`);
  }
  // Condition and spell names live in src/data/items.js (de/en/es only so far).
  try {
    const items = await import(pathToFileURL(path.join(ROOT, 'src', 'data', 'items.js')).href);
    lines.push('//   Conditions (names are in src/data/items.js, not in the UI file; shown for reference):');
    for (const c of Object.values(items.CONDITION_CATALOG)) lines.push(`//     EN: ${c.name.en}   DE: ${c.name.de}${c.name.es ? `   ES: ${c.name.es}` : ''}`);
  } catch { /* glossary stays shorter */ }
  return lines;
}

async function cmdTemplate(lang, all) {
  if (!lang) { console.error('usage: template <lang> [--all]'); process.exit(2); }
  const isNew = isNewLang(lang);
  if (isNew) all = true;
  const en = readDict(SRC_REF);
  const dicts = Object.fromEntries(languages().map((l) => [l, readDict(l)]));
  const mine = isNew ? {} : (dicts[lang] || {});
  const a = isNew ? { missing: Object.keys(en), empty: [], untranslated: [], badPlaceholders: [] } : analyse(lang, en);
  const code = lang === 'new' ? '<code>' : lang;
  const wanted = new Set(all ? Object.keys(en) : [...a.missing, ...a.empty, ...a.untranslated, ...a.badPlaceholders]);
  const usage = usageMap(Object.keys(en));
  // Group by section (first appearance order) so the file reads topic by topic.
  const order = [];
  Object.keys(en).forEach((k) => { const id = sectionOf(k).id; if (!order.includes(id)) order.push(id); });
  const keys = Object.keys(en).filter((k) => wanted.has(k))
    .sort((a, b) => order.indexOf(sectionOf(a).id) - order.indexOf(sectionOf(b).id));
  const out = [];
  const w = (s = '') => out.push(s);

  w(lang === 'new' ? '// Pips & Paws — blank translation preset for a NEW language' : isNew ? `// Pips & Paws — translation template for ${languageName(lang)} ("${lang}", new language, all keys)` : `// Pips & Paws — translation template for "${lang}"`);
  w(`// Generated ${new Date().toISOString().slice(0, 10)} by tools/i18n/i18n.mjs — ${keys.length} of ${Object.keys(en).length} keys${all ? ' (all keys)' : ' (missing, empty, identical-to-English or broken)'}.`);
  w('//');
  w('// HOW TO USE');
  w(`//  1. Fill in the empty "" values below. Leave a value empty to skip a key — it falls back to English.`);
  w('//  2. Keep every {placeholder} exactly as written (same name, braces included). Words around it can move.');
  w('//  3. Keep line breaks as \\n, keep [SQUARE_BRACKET] markers, keep product and licence names (Pips & Paws, Mausritter, PenNodePaper, MIT, CC BY 4.0).');
  w('//  4. Lines starting with // are comments for you; they are ignored.');
  w(`//  5. Check:  node tools/i18n/i18n.mjs apply ${lang === 'new' ? '<this file>' : path.relative(ROOT, path.join(OUT, `${lang}.jsonc`))} ${code}`);
  w('//     That writes src/i18n/' + code + '.json (use the two-letter language code, e.g. pl). Then run the app (npm run dev) with ?lang=' + code + ' to see your text in place.');
  w('//  New language? Also see docs/translations/GUIDE.md (register it in src/i18n/index.jsx).');
  w('//');
  w('// STYLE');
  w('//  - Mausritter is a gentle, slightly whimsical game about brave little mice. Plain, friendly wording; no slang.');
  w('//  - Use one form of address consistently (informal "you" is used in the existing languages).');
  w('//  - Button labels: short, imperative, no full stop. Messages: full sentences.');
  w('//  - If your language has an official Mausritter translation, use its terms for the glossary below.');
  w('//');
  if ((langNotes[lang] || []).length) {
    w(`// NOTES FOR ${languageName(lang).toUpperCase()}`);
    for (const n of langNotes[lang]) w(`//  - ${n}`);
    w('//');
  }
  w('// GLOSSARY — existing translations of core terms (stay consistent with them)');
  for (const l of await glossaryLines(lang, dicts)) w(l);
  w('//');
  w('// PLACEHOLDERS — what the {names} stand for');
  const usedPh = new Set(keys.flatMap((k) => placeholders(en[k])));
  for (const p of [...usedPh].sort()) w(`//   {${p}} = ${ctx.placeholders[p] || '(see the key note)'}`);
  w('');
  w('{');

  let lastSection = '';
  keys.forEach((key, i) => {
    const sec = sectionOf(key);
    if (sec.id !== lastSection) {
      lastSection = sec.id;
      w('');
      w(`  // ═══ ${sec.title} (${sec.id}.*) ${'═'.repeat(Math.max(2, 52 - sec.title.length - sec.id.length))}`);
      if (sec.note) w(`  // ${sec.note}`);
    }
    w('');
    const files = usage.get(key);
    if (files) w(`  // Used in: ${[...files].sort().join(', ')}`);
    const hint = ctx.keys[key] || '';
    if (hint) w(`  // NOTE: ${hint}`);
    const lh = lengthHint(key, en[key]);
    if (lh) w(`  // ${lh}`);
    const ph = placeholders(en[key]);
    if (ph.length) w(`  // Placeholders: ${ph.map((p) => `{${p}}`).join(' ')}`);
    w(`  // EN: ${JSON.stringify(en[key])}`);
    if (SECOND_REF !== lang && dicts[SECOND_REF]?.[key]) w(`  // ${SECOND_REF.toUpperCase()}: ${JSON.stringify(dicts[SECOND_REF][key])}`);
    if (mine[key] && mine[key] !== en[key]) w(`  // current ${lang.toUpperCase()}: ${JSON.stringify(mine[key])}`);
    else if (mine[key] && mine[key] === en[key]) w(`  // current ${lang.toUpperCase()} is identical to English — translate it or confirm it should stay.`);
    const prefill = all && mine[key] ? JSON.stringify(mine[key]) : '""';
    w(`  ${JSON.stringify(key)}: ${prefill}${i < keys.length - 1 ? ',' : ''}`);
  });
  w('}');
  w('');

  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, lang === 'new' ? '_new-language.jsonc' : `${lang}.jsonc`);
  fs.writeFileSync(file, out.join('\n'), 'utf8');
  console.log(`Wrote ${path.relative(ROOT, file)} (${keys.length} keys).`);
}

// --- apply ------------------------------------------------------------------------------
// Parses our own template format: // comment lines are dropped, the rest is JSON.
function parseTemplate(text) {
  const body = text.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  try { return JSON.parse(body.replace(/,(\s*})/g, '$1')); } catch (e) { throw new Error(`Template is not valid JSON after removing comments: ${e.message}`); }
}

function cmdApply(file, lang) {
  if (!file || !lang) { console.error('usage: apply <template.jsonc> <lang>'); process.exit(2); }
  const en = readDict(SRC_REF);
  const incoming = parseTemplate(fs.readFileSync(path.resolve(file), 'utf8'));
  const existing = readDict(lang) || {};
  const merged = { ...existing };
  let added = 0; let updated = 0; const problems = [];
  for (const [key, val] of Object.entries(incoming)) {
    if (!(key in en)) { problems.push(`unknown key (not in en.json): ${key}`); continue; }
    if (typeof val !== 'string' || val.trim() === '') continue;
    if (!sameSet(placeholders(en[key]), placeholders(val))) {
      problems.push(`${key}: placeholders ${placeholders(val).map((p) => `{${p}}`).join(' ') || '(none)'} do not match English ${placeholders(en[key]).map((p) => `{${p}}`).join(' ') || '(none)'}`);
      continue;
    }
    if (key in merged) { if (merged[key] !== val) updated += 1; } else added += 1;
    merged[key] = val;
  }
  // keep the key order of en.json so diffs stay small
  const ordered = {};
  for (const key of Object.keys(en)) if (key in merged) ordered[key] = merged[key];
  for (const key of Object.keys(merged)) if (!(key in ordered)) ordered[key] = merged[key];
  fs.writeFileSync(path.join(I18N, `${lang}.json`), `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
  console.log(`${lang}.json: ${added} added, ${updated} changed, ${Object.keys(ordered).length} of ${Object.keys(en).length} keys translated.`);
  if (problems.length) {
    console.log(`\n${problems.length} entries were skipped:`);
    for (const p of problems) console.log(`  - ${p}`);
    process.exitCode = 1;
  }
  if (!languages().includes(lang)) console.log('');
  const idx = fs.readFileSync(path.join(I18N, 'index.jsx'), 'utf8');
  if (!new RegExp(`import ${lang} from`).test(idx)) {
    console.log(`\nNew language: run  node tools/i18n/i18n.mjs register ${lang} ${lang.toUpperCase()}  to add it to the language switch.`);
  }
}

async function cmdTemplates() {
  const en = readDict(SRC_REF);
  for (const lang of languages()) {
    if (lang === SRC_REF || lang === SECOND_REF) continue;
    const a = analyse(lang, en);
    const file = path.join(OUT, `${lang}.jsonc`);
    if (a.missing.length + a.empty.length + a.untranslated.length + a.badPlaceholders.length === 0) { fs.rmSync(file, { force: true }); continue; }
    await cmdTemplate(lang, false);
  }
  await cmdTemplate('new', true);
}

// Adds a language to src/i18n/index.jsx: import line, DICTS entry and a switch button.
function cmdRegister(code, labelArg) {
  if (!/^[a-z]{2,3}$/.test(code || '')) { console.error('usage: register <two-letter-code> [LABEL]'); process.exit(2); }
  if (!fs.existsSync(path.join(I18N, `${code}.json`))) { console.error(`src/i18n/${code}.json does not exist yet — run apply first.`); process.exit(2); }
  const file = path.join(I18N, 'index.jsx');
  let src = fs.readFileSync(file, 'utf8');
  if (new RegExp(`import ${code} from`).test(src)) { console.log(`${code} is already registered.`); return; }
  const label = (labelArg || code).toUpperCase();
  src = src.replace(/(import \w+ from '\.\/\w+\.json';\n)(?!import \w+ from '\.\/\w+\.json';)/, `$1import ${code} from './${code}.json';\n`);
  src = src.replace(/const DICTS = \{ ([^}]*) \};/, (_m, list) => `const DICTS = { ${list}, ${code} };`);
  src = src.replace(/(\n  \{ code: '\w+', label: '[^']*' \},)(\n\];)/, `$1\n  { code: '${code}', label: '${label}' },$2`);
  fs.writeFileSync(file, src, 'utf8');
  console.log(`Registered ${code} (${label}) in src/i18n/index.jsx. Check: npm run dev, then open ?lang=${code}.`);
}

// Builds tools/i18n/out/pips-and-paws-translation-<lang>.zip for someone without the repo:
// the commented template, a browser-based checker (no install), a short guide and screenshots.
async function cmdPackage(lang) {
  if (!lang) { console.error('usage: package <lang|new>'); process.exit(2); }
  const isNew = isNewLang(lang);
  const blank = lang === 'new';
  await cmdTemplate(lang, false);
  const en = readDict(SRC_REF);
  const name = blank ? 'new-language' : lang;
  const outRoot = path.join(ROOT, 'tools', 'i18n', 'out');
  const dir = path.join(outRoot, `pips-and-paws-translation-${name}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'screenshots'), { recursive: true });

  const template = path.join(OUT, blank ? '_new-language.jsonc' : `${lang}.jsonc`);
  const count = (fs.readFileSync(template, 'utf8').match(/^ {2}"[^"]+": /gm) || []).length;
  fs.copyFileSync(template, path.join(dir, `translate-${name}.jsonc`));

  const table = Object.fromEntries(Object.entries(en).map(([k, v]) => [k, { ph: placeholders(v), en: v }]));
  const html = fs.readFileSync(path.join(ROOT, 'tools', 'i18n', 'checker.template.html'), 'utf8')
    .replace('__LANG__', blank ? 'new language' : lang)
    .replace('__EN__', JSON.stringify(table).replace(/</g, '\\u003c'));
  fs.writeFileSync(path.join(dir, 'checker.html'), html, 'utf8');

  const shots = path.join(ROOT, 'docs', 'screenshots');
  if (fs.existsSync(shots)) for (const f of fs.readdirSync(shots)) fs.copyFileSync(path.join(shots, f), path.join(dir, 'screenshots', f));

  const langName = blank ? 'your language' : languageName(lang);
  const a = isNew ? null : analyse(lang, en);
  const extra = (langNotes[lang] || []).map((n) => `   - ${n}`).join('\n');
  const guide = `# Translating Pips & Paws into ${langName}

Pips & Paws is a free, browser-based helper for the tabletop game **Mausritter** (brave little mice
adventuring in a big dangerous world): character sheet, dice, game master tools. You are helping to make
its interface speak ${langName}. No programming needed — just a text editor.

Live app to look around: https://mausritter.redneck-design.de/  (the screenshots folder shows the main screens)

## What is in this package
- \`translate-${name}.jsonc\` — the file you edit (${count} texts${isNew ? ', all of them' : ', only the ones still missing'}).
- \`checker.html\` — double-click to open in your browser; checks your file (nothing is uploaded).
- \`screenshots/\` — what the app looks like, for context.

## How to do it (roughly ${Math.max(1, Math.round(count / 80))}–${Math.max(2, Math.round(count / 40))} hours, in as many sittings as you like)
1. Open \`translate-${name}.jsonc\` in any text editor (VS Code, Notepad++, Sublime — not Word).
2. Fill in the empty \`""\` values. Above each one you find: where it is used, what the {placeholders}
   mean, the English text and the German text. At the top there is a glossary of the core game terms.
   If you leave a value empty, that text just stays English — skipping is fine.
3. Rules for the text:
   - Keep every \`{placeholder}\` exactly as written (words around it may move).
   - Keep \`\\n\` (a line break) and \`[SQUARE BRACKET]\` markers.
   - Do not translate: Pips & Paws, Mausritter, PenNodePaper, Discord, MIT, CC BY 4.0.
   - Friendly, plain wording like the rulebook; buttons short, messages full sentences; one form of "you".
   - If Mausritter exists in ${langName}, use the official game terms.
${extra ? `\n   Notes for ${langName}:\n${extra}\n` : ''}4. Open \`checker.html\` in your browser, choose your file, fix anything it reports.
5. Send the file back (the \`.jsonc\` you edited is perfect). Partial is welcome — send what you have,
   we can add the rest later.

Thank you! Questions? Just ask in the Discord.
`;
  fs.writeFileSync(path.join(dir, 'START-HERE.md'), guide, 'utf8');

  const zip = path.join(outRoot, `pips-and-paws-translation-${name}.zip`);
  fs.rmSync(zip, { force: true });
  try {
    execFileSync('zip', ['-r', '-q', path.basename(zip), path.basename(dir)], { cwd: outRoot });
  } catch {
    execFileSync('python3', ['-m', 'zipfile', '-c', zip, dir], { cwd: outRoot });
  }
  const msg = `Hi! Thanks for offering to help translate Pips & Paws (a free Mausritter helper app) into ${langName} 🐭
I put everything in the attached zip: unzip it and read START-HERE.md — it's a text file with the texts to fill in (${count} of them, mostly short UI labels) plus a checker you open in your browser. Partial work is fine, you can stop and send what you have any time. If anything is unclear, just ask here.`;
  fs.writeFileSync(path.join(outRoot, `discord-message-${name}.txt`), `${msg}\n`, 'utf8');
  console.log(`Built ${path.relative(ROOT, zip)} (${Math.round(fs.statSync(zip).size / 1024)} KB, ${count} texts).`);
  console.log(`Message to send: ${path.relative(ROOT, path.join(outRoot, `discord-message-${name}.txt`))}`);
  void a;
}

const [cmd, a1, a2, a3] = process.argv.slice(2);
if (cmd === 'status') cmdStatus();
else if (cmd === 'templates') await cmdTemplates();
else if (cmd === 'template') await cmdTemplate(a1, [a2, a3].includes('--all'));
else if (cmd === 'apply') cmdApply(a1, a2);
else if (cmd === 'register') cmdRegister(a1, a2);
else if (cmd === 'package') await cmdPackage(a1);
else {
  console.log('Pips & Paws translation kit\n  status\n  template <lang> [--all]\n  template new\n  templates\n  apply <template.jsonc> <lang>\n  register <code> [LABEL]\n  package <lang|new>');
  process.exitCode = cmd ? 2 : 0;
}
