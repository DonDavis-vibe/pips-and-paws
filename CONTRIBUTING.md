# Mitmachen bei Pips & Paws

Danke fürs Interesse! Pull Requests sind willkommen — vor allem Übersetzungen,
Bugfixes und kleine Verbesserungen.

## Ablauf

1. Repo forken, Branch anlegen.
2. `npm install`, `npm run dev` (Port 5173).
3. Vor dem Commit: `npm run lint` und `npm run build` müssen grün sein.
4. PR gegen `main` öffnen. Kurz beschreiben, was und warum.

Der Code steht unter **MIT** (`LICENSE`). Mit einem PR stellst du deinen Beitrag
unter dieselbe Lizenz. Ein CLA gibt es nicht.

## Eine Sprache hinzufügen

Die Oberfläche liegt in `src/i18n/`. `de.json` und `en.json` sind vollständig,
**`es.json` (Spanisch) ist als Kopie von `en.json` schon angelegt** und wartet
auf Übersetzung.

1. **`src/i18n/es.json`** — die Werte übersetzen (Schlüssel unverändert lassen).
   Mit `de.json`/`en.json` abgleichen, damit keine Schlüssel fehlen. Fehlende
   oder leere Schlüssel fallen automatisch auf Englisch zurück, es geht also
   nichts kaputt, wenn noch nicht alles fertig ist.
   Platzhalter wie `{name}`, `{n}`, `{attr}` müssen im übersetzten Text bleiben.
2. **`src/i18n/index.jsx`** — die Datei importieren und in `DICTS` eintragen:
   ```js
   import es from './es.json';
   const DICTS = { de, en, es };
   ```
3. **`src/i18n/index.jsx`** — in `LANGS` freischalten, sobald genug übersetzt ist:
   ```js
   export const LANGS = [
     { code: 'de', label: 'DE' },
     { code: 'en', label: 'EN' },
     { code: 'es', label: 'ES' },
   ];
   ```
   Damit erscheint automatisch ein Umschalter-Knopf in der Kopfzeile.

Für eine andere Sprache (`fr`, `it`, …) genauso: neue `<code>.json` als Kopie
von `en.json`, dann Schritte 2 und 3.

**Regeldaten** (`src/data/*.js`: Hintergründe, Gegenstände, Zauber, Kreaturen)
tragen `{ de, en }`-Felder. Ohne `es`-Feld greift dort automatisch der englische
Text. Wer will, kann diese Felder um `es` ergänzen — das ist aber ein separater,
größerer Schritt und keine Voraussetzung dafür, die UI-Sprache freizuschalten.

## Rechtliches (bitte lesen)

- **Impressum / Datenschutz** (`public/impressum.html`) nennen den **Betreiber**
  der Original-Seite. Wer per PR beiträgt, ist **kein Betreiber** und wird dort
  **nicht** eingetragen — Übersetzungen und Code ändern daran nichts.
- Wer den Fork **selbst deployt**, braucht ein **eigenes** Impressum und eine
  eigene Datenschutzerklärung (deutsche Rechtspflicht bei Betrieb aus DE). Die
  Datei `public/impressum.html` dann durch die eigenen Angaben ersetzen.
- Fügt ein PR einen **neuen externen Dienst** hinzu (CDN, API, Font-Anbieter,
  Analytics, Fehler-Tracking …), bitte im PR ausdrücklich erwähnen. Die
  Datenschutzerklärung muss den tatsächlichen Aufbau abbilden und wird dann
  vor dem Merge ergänzt.

## Was gut reinpasst

Übersetzungen · Bugfixes · Barrierefreiheit · kleine UX-Verbesserungen ·
Regeldaten-Korrekturen (mit SRD-Stelle).

## Was vorher abgesprochen werden sollte

Größere Feature-Umbauten, neue Abhängigkeiten, alles, was den Multiplayer-
oder Speicher-Aufbau ändert — vorher kurz ein Issue aufmachen.
