<div align="center">

<img src="public/logo.jpg" alt="Pips & Paws" width="300" />

# Pips &amp; Paws

**Charakterbogen · Spielleiter-Dashboard · serverloser Echtzeit-Multiplayer**
für das Pen-&-Paper-Rollenspiel **Mausritter** — alles im Browser, ohne Anmeldung.

### ▶ [dondavis-vibe.github.io/pips-and-paws](https://dondavis-vibe.github.io/pips-and-paws/)

<sub>Deutsch · Englisch · Französisch · Italienisch · Japanisch — alles bleibt lokal im Browser, kein Konto, kein Server</sub>

<sub><a href="README.md">English version →</a></sub>

</div>

<p align="center">
  <img src="docs/screenshots/character-sheet.jpg" alt="Charakterbogen" width="48%" />
  <img src="docs/screenshots/gm-dashboard.jpg" alt="SL-Dashboard" width="48%" />
</p>

---

Öffne die Seite, würfle dir eine Maus zusammen und leg los. Willst du zu mehreren
spielen, eröffnet die Spielleitung einen Raum und teilt einen Link — die Verbindung
läuft direkt zwischen den Browsern (WebRTC), ohne dass Daten über einen Server des
Betreibers laufen.

## Für Spieler:innen

- **Charakterbogen** — STR / GES / WIL (aktuell & Maximum), Trefferpunkte, Pips, EP,
  Mumm, Charakterbild und Notizen. Alles wird automatisch im Browser gesichert.
- **Charaktererschaffung nach SRD 2.3.1** — 3W6 (die zwei höchsten), TP & Pips je 1W6,
  vollständige 36er-Hintergrundtabelle mit Startausrüstung, Schwache-Maus-Regel,
  Sternzeichen · Fell · Merkmal.
- **Inventar per Drag & Drop** — zwei Pfoten, zwei Körper, sechs Rucksack; 1- und
  2-Platz-Gegenstände, Tausch, Nutzungspunkte, Zustände als Kärtchen. Jeder
  Gegenstand hat ein Symbol, das sich austauschen lässt.
- **Würfeln** — W6 und W66 als echte, taumelnde 3D-Würfel; Rettungswurf (W20 ≤
  Attribut) mit Vorteil / Nachteil. Ein Klick auf den Schadenswert einer Waffe
  würfelt den Schaden (ein- und zweihändig getrennt). Jeder Wurf landet sichtbar
  im Würfel-Panel.
- **Automatische Schadenskette nach SRD** — STR-Schaden löst sofort einen
  STR-Rettungswurf aus; misslingt er, ist die Maus verletzt und kampfunfähig, bis
  sie rastet. Bei 0 STR stirbt sie — die App löscht oder sperrt dabei nichts von
  selbst, sie sagt es nur unmissverständlich.
- **Rast-Helfer** — kurz / lang / voll, mit Rationsverbrauch und Attributs-Heilung
  nach den Regeln; jede Rast hebt auch „kampfunfähig" wieder auf.
- **Miethelfer** — aus dem SRD-Katalog anheuern (Fackelträger, Söldner, Gelehrte, …),
  Werte würfeln sich beim Anheuern selbst, Moralwürfe bleiben lokal auf dem Bogen.
- **Mehrere Mäuse pro Browser** — jede gespielte Maus landet in einer Liste, zu der
  du jederzeit zurückwechseln kannst, ganz ohne manuelles Sichern.

## Für Spielleiter:innen

- **Dashboard** — alle Helden auf einen Blick: Bild, TP, Werte, Rüstung, belegte
  Plätze, Waffen, Zustände.
- **Eingriffe pro Maus** — Schaden, Heilen, Pips, EP, Rast auslösen, Rettungswurf
  oder Initiative fordern, flüstern, Ansage an alle, Gegenstand oder Zustand geben.
- **Würfel-Panel** mit Ergebnis-Bühne, Reaktions- und Schatzwurf und einem
  Wurf-Protokoll, in dem auch die Würfe aller Spieler auftauchen.
- **Tischmitte** — gemeinsamer Loot-Ablage; Gegenstände lassen sich vorbereiten
  und vor den Spielern verstecken, bis sie „auf dem Tisch" liegen.
- **Zeit & Licht** — Zug-/Wachen-/Tag-Zähler, Fackel- und Begegnungs-Countdown,
  Alarmbanner bei Begegnung oder Vorzeichen, optionale Tageszeit-Anzeige für die Spieler.
- **NSC- & Kampf-Tracker** — Kreaturen aus dem SRD oder eigene, Angriff und
  Moralprobe per Klick, einzelne NSC für die Spieler sichtbar schalten.
- **Sitzung sichern & laden** und allgemeine Notizen.
- **Am Tisch spielen, ohne dass alle ein Gerät brauchen** — Boegen direkt im
  Dashboard anlegen oder laden, Schaden/Heilen/Rast/Gegenstände/Zustände direkt
  darauf anwenden, und den vollen Bogen im Vollbild zum Herumreichen öffnen.
- **Soundboard** — eingebaute Kurz-Effekte (Erfolg/Fehlschlag/Krit/Patzer/Glocke —
  freie CC0-Sounds von [Kenney.nl](https://kenney.nl/assets/interface-sounds),
  siehe `src/assets/sfx/CREDITS.txt`) plus eigene hochgeladene Ambient-/
  Musikdateien (bleiben auf dem Gerät, gehen live an die Verbundenen).

## Zusammen spielen

- **Serverloser Multiplayer** über WebRTC / PeerJS. Die Spielleitung ist der Host;
  Spieler treten per 4-Zeichen-Code oder `?join`-Link bei. Reconnect und
  Reload-Wiederherstellung sind eingebaut.
- **Geteiltes Runden-Log** — die Spielleitung schaltet es frei, dann sehen alle
  Spieler die Würfe und Ereignisse der Runde in ihrem eigenen Bogen. Würfe der
  Spieler erreichen die Spielleitung in jedem Fall.
- **Optionaler Discord-Webhook** — spiegelt Würfe und Ereignisse in einen Kanal.
  Die URL liegt nur im `localStorage`, nie in der Charakterdatei.
- **Gruppenübersicht** — der SL kann eine kompakte Sicht der Gruppe teilen (Name,
  TP, Zustände), damit Spieler sich auch untereinander sehen, nicht nur ihren
  eigenen Bogen.

## Gestaltung

Standard ist der **Druckbogen**: Tusche auf Papier, dicke handgezogene Linien,
flache Schmuckfarben, handschriftliche Randnotizen und ein Dunkelmodus als
„Negativdruck". Alle Zeichnungen (Maus, Bild-Platzhalter, Leerzustände) sind
eingebettete SVGs, keine Stock-Icons für die Marke. Das frühere App-Design bleibt
als **Klassisch** erhalten — der Pinsel-Knopf in der Kopfzeile schaltet um, die
Wahl wird gemerkt.

## Außerdem

Einklappbare Panels (Zustand gemerkt) · Hell-/Dunkel-Schalter (Klassisch mit
eigenem Hintergrundbild je Modus) · klebender Würfelbereich auf breiten
Bildschirmen · JSON-Export / -Import des Bogens · funktioniert offline aus einer
einzigen Datei.

<details>
<summary>Dunkelmodus</summary>

<img src="docs/screenshots/character-sheet-dark.jpg" alt="Charakterbogen, Dunkelmodus" width="70%" />

</details>

## Entwickeln

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/index.html  (eine portable Datei, viteSingleFile)
npm run preview
npm run lint       # oxlint
```

Push auf `main` baut und deployt über GitHub Actions auf GitHub Pages.

**Stack:** Vite + React 19 (plain JS, kein TypeScript), `@dnd-kit` fürs
Inventar-Raster, `peerjs` für den Multiplayer, `lucide-react` für Icons.
Kein Backend, kein Konto.

**Styling:** `src/theme.css` ist das klassische Design und trägt das komplette
Layout; es liegt in `@layer classic`. `src/print.css` ist der Druckbogen (Standard)
— außerhalb der Ebenen, gebunden an `html[data-skin="print"]`, und überschreibt
damit nur Farben, Ränder, Schrift und Schatten, nie den Grid-/Flex-Aufbau. Die
Strichzeichnungen liegen in `src/components/Art.jsx`.

## Mitmachen

Pull Requests sind willkommen — besonders Übersetzungen. Die Oberfläche gibt es
auf Deutsch, Englisch, Spanisch, Französisch, Italienisch und Japanisch. Spanisch
stammt von [@Salgraphics](https://github.com/Salgraphics); FR/IT/JA sind
maschinell unterstützt, Korrekturen von Muttersprachler:innen sehr willkommen.
Schlüssel, die erst nach dem Spanisch-PR dazukamen (Offline-Tisch-Modus,
Soundboard, Gruppenübersicht, der Druckbogen-Skin, Miethelfer, die Maus-Liste,
die automatische Schadenskette), bleiben in `es.json` absichtlich unübersetzt
und fallen auf Englisch zurück — die Lücke ist Absicht,
damit sie für eine muttersprachliche Übersetzung offen bleibt statt von einer
Maschine vorbelegt zu werden. Ablauf und Schritte für eine neue Sprache:
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## Regeldaten & Bilder

`src/data/*` ist aus dem offiziellen **Mausritter SRD 2.3.1** abgeleitet
(CC BY 4.0). Wirkungstexte sind zusammengefasst, nicht wörtlich übernommen. Die
freien PDFs unter `reference/` liegen nur lokal (Artwork nicht CC BY, per
`.gitignore` ausgeschlossen).

Wappen, Hintergrundbilder, Vignetten und Bild-Platzhalter sind aus eigenen
KI-Generierungen abgeleitet (Quellen in `img/`), **kein** offizielles
Mausritter-Artwork und **kein** Verlagslogo.

Die eingebauten Kurz-Effekte des SL-Soundboards (`src/assets/sfx/`) stammen aus
Kenneys ["Music Jingles"](https://kenney.nl/assets/music-jingles)- und
["Interface Sounds"](https://kenney.nl/assets/interface-sounds)-Paketen,
Lizenz [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.de) — siehe
`src/assets/sfx/CREDITS.txt`.

## Rechtliches

[Impressum &amp; Datenschutzerklärung](https://dondavis-vibe.github.io/pips-and-paws/impressum.html)
— eine Seite (`public/impressum.html`), im Footer verlinkt. Der Datenschutz-Teil
beschreibt den tatsächlichen technischen Aufbau; bei Änderungen an externen
Diensten oder gespeicherten Schlüsseln anpassen. Wer den Code forkt und selbst
betreibt, braucht ein eigenes Impressum (siehe `CONTRIBUTING.md`).

## Lizenz

Code: **MIT** (`LICENSE`).

> *Pips &amp; Paws is an independent production by DonDavis and is not affiliated with Losing Games.*
>
> *This work is based on Mausritter, a product of Losing Games and Isaac Williams, and is
> licensed for use under the Creative Commons Attribution 4.0 International (CC BY 4.0) licence.*
