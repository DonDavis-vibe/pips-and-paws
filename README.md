# Pips & Paws

Digitaler Charakterbogen (und spaeter: Spielleiter-Dashboard mit Echtzeit-Multiplayer)
fuer das Pen-&-Paper-Rollenspiel **Mausritter**.

Status: **Solo-Charakterbogen** (M0–M3 aus [PLAN.md](PLAN.md)). Multiplayer folgt.

## Entwickeln

```bash
npm install
npm run dev
```

Dann `http://localhost:5173` aufrufen.

```bash
npm run build     # -> dist/index.html (eine portable Datei, viteSingleFile)
npm run preview
npm run lint
```

## Stack

Vite + React 19 (plain JS), `@dnd-kit` fuers Inventar-Raster, `lucide-react` fuer Icons.
Kein Backend, kein Account. Alles im `localStorage`, Export/Import als `.json`.

## Regeldaten

`src/data/*` enthaelt eine **erste Auswahl** an Gegenstaenden, Hintergruenden und
Aussehen-Tabellen. Die vollstaendigen Tabellen aus dem Mausritter-SRD sind noch
nicht eingepflegt (mit `TODO(M3)` markiert). Wirkungstexte sind zusammengefasst,
nicht woertlich uebernommen.

## Lizenz

Code: MIT (`LICENSE`).

*Pips & Paws is an independent production by [Name] and is not affiliated with Losing Games.*

*This work is based on Mausritter, a product of Losing Games and Isaac Williams, and
is licensed for use under the Creative Commons Attribution 4.0 International (CC BY 4.0) licence.*
