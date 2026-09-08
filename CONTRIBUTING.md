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

Die Oberfläche liegt in `src/i18n/`. `de.json`, `en.json`, `fr.json`, `it.json`
und `ja.json` sind vollständig und freigeschaltet (FR/IT/JA maschinell
unterstützt — Korrekturen willkommen). **Als Gerüst (Kopie von `en.json`, noch
unübersetzt) liegt bereit:** `es.json` (Spanisch). Für jede andere Sprache legst
du analog eine `<code>.json` als Kopie von `en.json` an.

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
  der Original-Seite. Wer per PR beiträgt, ist **kein Betreiber** und wird dort
  **nicht** eingetragen — Übersetzungen und Code ändern daran nichts.
- Wer den Fork **selbst deployt**, braucht ein **eigenes** Impressum und eine
  eigene Datenschutzerklärung (deutsche Rechtspflicht bei Betrieb aus DE). Der
  Kontaktblock kommt nicht aus dem Code, sondern aus dem Repo-Secret
  `IMPRESSUM_KONTAKT` (Vorlage: `public/KONTAKT.beispiel.html`, Einrichtung in
  `.github/workflows/deploy.yml`). Ohne das Secret bricht der Deploy bewusst ab.
  Den Datenschutz-Text in `public/impressum.html` an das eigene Deployment anpassen.
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
