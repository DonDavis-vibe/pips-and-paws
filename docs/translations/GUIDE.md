# Translating Pips & Paws

Thank you for helping! The app's texts live in `src/i18n/<code>.json` (one flat
JSON file per language, ~860 keys). English (`en.json`) is the source. **A missing
key simply falls back to English**, so a partial translation never breaks anything —
you can translate a few dozen keys and stop.

Currently: German and English complete; French, Italian and Japanese ~77 %; Spanish
~57 % (the Spanish gap is left open on purpose for a native speaker, see below).

## The quick way (with the commented template)

You do not need to understand the code. You need a text editor.

1. **Get a template.** Open a ready-made one from this folder:
   - `fr.jsonc`, `it.jsonc`, `ja.jsonc`, `es.jsonc` — only the keys that are still missing
     (or look untranslated) in that language;
   - `_new-language.jsonc` — the blank preset with **all** keys for a new language.

   Or generate a fresh one (Node 18+): `npm run i18n -- template <code>` (add `--all`
   to review a complete language), `npm run i18n -- template new` for a new language.
2. **Fill in the empty `""` values.** Every key comes with comments: where it is used,
   what the `{placeholders}` mean, the English source, the German text for comparison
   and, for the core Mausritter terms, a glossary with the existing translations.
   Skip a key by leaving it empty.
3. **Apply it:** `npm run i18n -- apply docs/translations/<file>.jsonc <code>`.
   This checks every placeholder, skips broken entries with a clear message and writes
   `src/i18n/<code>.json` (merging with what is already there).
4. **New language only:** `npm run i18n -- register <code> <LABEL>` adds it to the
   language switch (`src/i18n/index.jsx`).
5. **Look at it:** `npm run dev`, open `http://localhost:5173/?lang=<code>`.
6. **Send it in.** Pull requests are welcome; the project is no longer on GitHub-only
   workflows, so you can also hand over the changed `src/i18n/<code>.json` (or the filled
   template) in the project's Discord.

`npm run i18n -- status` shows the coverage of every language and flags placeholder
mistakes. `npm run i18n:templates` regenerates the templates in this folder.

## Rules for the text

- **Placeholders** such as `{name}`, `{n}`, `{attr}` must stay exactly as they are (the
  words around them can move). They are replaced by the app at runtime.
- **`\n`** in a value is a line break between paragraphs — keep it.
- **`[SUM]`, `[DICE]`** style markers are used by the spell texts — keep them.
- **Do not translate** product and licence names: *Pips & Paws*, *Mausritter*,
  *PenNodePaper*, *Discord*, *Ko-fi*, *MIT*, *CC BY 4.0*. The legal disclaimers in the
  footer (`footer.disclaimer1` to `4`, wording required by the Mausritter licences) stay English in every language on purpose.
- **Terms:** use one consistent word for each core term (see the glossary at the top of
  every template). If Mausritter has an official translation in your language, use its
  terms. *Hit Protection*, *Save*, *Grit*, *Watch* and *Turn* are game terms, not everyday words.
- **Tone:** friendly and plain, like the rulebook. Buttons are short and imperative; messages
  are full sentences. Use one form of address throughout.
- **Length:** the jump bar, tabs and buttons are narrow. Where a key note says "short",
  keep to about the English length.

## What this kit does not cover (yet)

The *game data* — item and spell names and effects, backgrounds, creature notes, generator
tables — is not in `src/i18n/` but in `src/data/*.js` as `{ de, en, es }` objects. French,
Italian and Japanese fall back to English there. Translating it means adding a field with
your code to those objects; if you want to take that on, ask first so the work can be split.

## Reviewing an existing language

`npm run i18n -- template <code> --all` writes every key with your current translation
pre-filled (as the value) and the English and German source above it — handy for a full
proofread. Apply it the same way.

## Handing it to a translator who does not use the repo

`npm run i18n -- package <code|new>` builds `tools/i18n/out/pips-and-paws-translation-<code>.zip`
with everything a person needs: `START-HERE.md`, the commented template, `checker.html`
(opens in any browser, checks placeholders, nothing installed or uploaded) and screenshots,
plus a ready-to-paste Discord message (`discord-message-<code>.txt`). For a language that does not exist yet, `package <code>` (e.g. `package pl`) builds a ready package with the language's name and its notes; language-specific hints (plural forms, address, dice notation ...) live in `tools/i18n/langnotes.json` and end up in the template header and `START-HERE.md`. When the filled-in file
comes back: `npm run i18n -- apply <file> <code>` (and `register` for a new language).

## Notes for maintainers

- Polish is in preparation: `docs/translations/pl.jsonc` is the blank all-keys template with the Polish notes. When the file comes back: `npm run i18n -- apply <file> pl`, then `register pl PL`.

- When you add UI texts: add the key to `en.json` and `de.json`; `fr/it/ja` may follow.
  Put new keys in a section that `tools/i18n/context.json` knows (or add one) and, for
  anything not obvious, a one-line note under `keys`, so the templates stay helpful.
- Then `npm run i18n -- status` (placeholders must match) and `npm run i18n:templates`.
- A new language also deserves an entry in `public/sitemap.xml` / `hreflang` in `index.html`
  once it is reasonably complete.
