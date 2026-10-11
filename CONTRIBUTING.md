# Mitmachen bei Pips & Paws

Danke fürs Interesse! Beiträge sind willkommen — vor allem Übersetzungen,
Bugfixes und kleine Verbesserungen. Pips & Paws liegt nicht mehr auf GitHub;
Absprachen und Einsendungen laufen über den [Discord](https://discord.gg/s6J6JqBQ8w).

## Ablauf

1. Quelltext-Kopie anlegen und Änderungen auf einem eigenen Stand vornehmen.
2. `npm install`, `npm run dev` (Port 5173).
3. Vor dem Commit: `npm run lint` und `npm run build` müssen grün sein.
4. Änderung als Patch/Archiv über den Discord einreichen. Kurz beschreiben, was und warum.

Der Code steht unter **MIT** (`LICENSE`). Mit einer Einsendung stellst du deinen Beitrag
unter dieselbe Lizenz. Ein CLA gibt es nicht.

## Eine Sprache hinzufügen

Die Oberfläche liegt in `src/i18n/`. `de.json`, `en.json`, `fr.json`, `it.json`
und `ja.json` sind vollständig; `es.json` traegt den ursprünglichen PR von
@Salgraphics (390 Schlüssel, unverändert) und ist bewusst NICHT mit maschinellen
Übersetzungen für neuere Schlüssel aufgefüllt — die fehlenden fallen automatisch
auf Englisch zurück (siehe unten) und bleiben offen, falls @Salgraphics oder
eine andere Person mit Spanisch als Muttersprache weitermachen möchte. Wer eine
neue Sprache ergänzt, legt eine `<code>.json` als Kopie von `en.json` an.

1. **`src/i18n/<code>.json`** — die Werte übersetzen (Schlüssel unverändert lassen).
   Mit `de.json`/`en.json` abgleichen, damit keine Schlüssel fehlen. Fehlende
   oder leere Schlüssel fallen automatisch auf Englisch zurück, es geht also
   nichts kaputt, wenn noch nicht alles fertig ist.
   Platzhalter wie `{name}`, `{n}`, `{attr}` müssen im übersetzten Text bleiben.
2. **`src/i18n/index.jsx`** — die Datei importieren und in `DICTS` eintragen:
   ```js
   import fr from './fr.json';
   const DICTS = { de, en, fr };
   ```
3. **`src/i18n/index.jsx`** — in `LANGS` freischalten, sobald genug übersetzt ist:
   ```js
   export const LANGS = [
     { code: 'de', label: 'DE' },
     { code: 'en', label: 'EN' },
     { code: 'fr', label: 'FR' },
   ];
   ```
   Damit erscheint automatisch ein Umschalter-Knopf in der Kopfzeile.

Bis Schritt 2/3 erledigt sind, kostet ein Gerüst nichts — es wird nicht gebündelt.

**Regeldaten** (`src/data/*.js`: Hintergründe, Gegenstände, Zauber, Kreaturen)
tragen `{ de, en }`-Felder. Ohne eigenes Sprachfeld greift dort automatisch der
englische Text. Wer will, kann diese Felder ergänzen — das ist aber ein separater,
größerer Schritt und keine Voraussetzung dafür, die UI-Sprache freizuschalten.

## Rechtliches (bitte lesen)

- **Impressum / Datenschutz** (`public/impressum.html`) nennen den **Betreiber**
  der Original-Seite. Wer etwas beiträgt, ist **kein Betreiber** und wird dort
  **nicht** eingetragen — Übersetzungen und Code ändern daran nichts.
- Wer die Kopie **selbst deployt**, braucht ein **eigenes** Impressum und eine
  eigene Datenschutzerklärung (deutsche Rechtspflicht bei Betrieb aus DE). Der
  Kontaktblock kommt nicht aus dem Code, sondern aus der lokalen Datei
  `KONTAKT.local.html` bzw. der Variable `IMPRESSUM_KONTAKT` (Vorlage:
  `public/KONTAKT.beispiel.html`, Einsetzen via `npm run release` /
  `scripts/inject-kontakt.py`). Ohne Kontaktblock bricht der Release-Build bewusst ab.
  Den Datenschutz-Text in `public/impressum.html` an das eigene Deployment anpassen.
- Fügt eine Einsendung einen **neuen externen Dienst** hinzu (CDN, API, Font-Anbieter,
  Analytics, Fehler-Tracking …), bitte ausdrücklich erwähnen. Die
  Datenschutzerklärung muss den tatsächlichen Aufbau abbilden und wird dann
  vor der Übernahme ergänzt.

## Gestaltung ändern

Zwei Stylesheets, klare Rollen: `src/theme.css` (Classic) trägt das komplette
Layout und liegt in `@layer classic`. `src/print.css` (Druckbogen, Standard) ist
unlayered und an `html[data-skin="print"]` gebunden — es gewinnt damit für alles
Sichtbare, ohne Spezifitäts-Tricks. Regel: Layout (Grid/Flex, Abstände, Breiten)
gehört nach `theme.css`, reine Optik des Druckbogens nach `print.css`. Wer in
`theme.css` eine neue Klasse mit Verlauf, Schatten oder Radius anlegt, ergänzt in
`print.css` das flache Gegenstück. Deutsche Texte in `src/i18n/de.json` und in
`src/data/*` tragen echte Umlaute (ä/ö/ü/ß), keine Umschreibungen.

## Was gut reinpasst

Übersetzungen · Bugfixes · Barrierefreiheit · kleine UX-Verbesserungen ·
Regeldaten-Korrekturen (mit SRD-Stelle).

## Was vorher abgesprochen werden sollte

Größere Feature-Umbauten, neue Abhängigkeiten, alles, was den Multiplayer-
oder Speicher-Aufbau ändert — vorher kurz im Discord absprechen.
