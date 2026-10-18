# Item-Bilder (Tusche-Stil)

Erzeugt die kleinen Linolschnitt-Bilder fuer Gegenstaende und Zauber
(`src/assets/ink/items/<key>.webp`, Schluessel wie in `src/data/items.js`).

1. ComfyUI ueber Pinokio starten (Modell `krea2_turbo_fp8_scaled`, 8 Schritte).
2. `python3 tools/item-art/gen.py http://127.0.0.1:<port>` — schickt jeden Eintrag aus
   `prompts.json`, holt die PNGs nach `tools/item-art/raw/` (gitignored) und ueberspringt, was es schon gibt.
   Einzelne Schluessel: `... --only torches rope`; neue Variante: `--seed-offset 1`.
3. `python3 tools/item-art/convert.py` — wandelt Schwarz-auf-Papier in transparente WebP (128 px,
   Tusche-Farbe wie die uebrigen Bilder) nach `src/assets/ink/items/`.

Die App findet die Bilder ueber `import.meta.glob`; ein Gegenstand ohne Bild zeigt sein Symbol.
