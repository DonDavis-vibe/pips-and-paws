# Pips & Paws

Digitaler Charakterbogen, Spielleiter-Dashboard und **Echtzeit-Multiplayer** fuer das
Pen-&-Paper-Rollenspiel **Mausritter** — alles im Browser, ohne Anmeldung.

**▶ Web-App: <https://dondavis-vibe.github.io/pips-and-paws/>**

## Was drin ist

- **Charakterbogen** — Attribute (aktuell/max), Trefferpunkte / Pips / EP / Mumm,
  Charakterbild (Upload mit Platzhalter), Notizen. Wuerfeln mit W6, W66 und
  Rettungswurf (W20 ≤ Attribut) inkl. Vorteil/Nachteil. Rast-Helfer (kurz/lang/voll).
- **Drag-and-Drop-Inventar** — Pfoten / Koerper / Rucksack, 1- und 2-Platz-Gegenstaende,
  Tausch, Nutzungspunkte, Zustaende als Kaertchen
- **Charaktererschaffung** nach SRD 2.3.1 — 3W6 (zwei hoechste), Trefferpunkte/Pips je 1W6,
  vollstaendige 36er-Hintergrundtabelle, Startausruestung, Schwache-Maus-Regel,
  Sternzeichen / Fell / Merkmal
- **Serverloser Multiplayer** (WebRTC/PeerJS) — SL eroeffnet einen Raum, Spieler treten
  per 4-Zeichen-Code oder `?join`-Link bei. Reconnect, Reload-Wiederherstellung.
  Geteiltes Runden-Log: der SL schaltet es frei, dann sehen alle Spieler die Wuerfe
  und Ereignisse der Runde.
- **SL-Dashboard** — alle Helden auf einen Blick (Bild, TP, Werte, Ruestung, belegte
  Plaetze, Waffen, Zustaende), Aktionen (Schaden / Heilen / Pips / EP / Rettungswurf
  oder Initiative fordern / Fluestern / Ansage / Item / Zustand geben), SL-Wuerfel-
  bereich mit Reaktions- und Schatzwurf, Live-Protokoll
- **SL-Werkzeuge** — gemeinsame Tischmitte (Loot schieben), Zeit-/Licht-/Begegnungs-Tracker,
  NSC-/Kampf-Tracker mit Moralprobe, SL-Sitzung sichern/laden, allgemeine Notizen
- **Optionaler Discord-Webhook** — spiegelt Wuerfe und Ereignisse in einen Kanal
- **Bedienung** — einklappbare Panels (Zustand gemerkt), Hell-/Dunkel-Schalter,
  zweisprachig DE / EN, Persistenz im `localStorage`, JSON-Export/-Import

## Entwickeln

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/index.html (eine portable Datei, viteSingleFile)
npm run preview
npm run lint        # oxlint
```

Push auf `main` deployt via GitHub Actions auf GitHub Pages.

## Stack

Vite + React 19 (plain JS), `@dnd-kit` fuers Inventar-Raster, `peerjs` fuer den
Multiplayer, `lucide-react` fuer Icons. Kein Backend, kein Account.

## Regeldaten

`src/data/*` ist aus dem offiziellen **Mausritter SRD 2.3.1** abgeleitet
(`reference/mausritter-srd-2.3.1.md`, CC BY 4.0). Wirkungstexte sind zusammengefasst,
nicht woertlich uebernommen. Die freien PDFs unter `reference/` liegen nur lokal
(Artwork nicht CC BY, per `.gitignore` ausgeschlossen).

Logo, Social-Card und Bild-Platzhalter sind aus einer eigenen KI-Generierung
abgeleitet (`img/logo-source.jpeg`), kein offizielles Mausritter-Artwork und kein
Verlagslogo. `img/` ist sonst ein lokaler Arbeitsordner (gitignored).

## Rechtliches

[Impressum &amp; Datenschutzerklärung](https://dondavis-vibe.github.io/pips-and-paws/impressum.html)
(eine Seite, `public/impressum.html`, im Footer verlinkt). Der Datenschutz-Teil
beschreibt den tatsächlichen technischen Aufbau — bei Änderungen an externen
Diensten oder gespeicherten Schlüsseln anpassen.

## Lizenz

Code: MIT (`LICENSE`).

*Pips & Paws is an independent production by DonDavis and is not affiliated with Losing Games.*

*This work is based on Mausritter, a product of Losing Games and Isaac Williams, and
is licensed for use under the Creative Commons Attribution 4.0 International (CC BY 4.0) licence.*
