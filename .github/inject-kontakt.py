#!/usr/bin/env python3
"""Setzt den Kontaktblock aus dem Secret IMPRESSUM_KONTAKT ins Impressum ein.

Laeuft ausschliesslich im Deployment. Im Repo steht an den Kontakt-Stellen nur
ein Platzhalter zwischen <!--KONTAKT:START--> / <!--KONTAKT:END-->, damit Name,
Anschrift und E-Mail nicht in Klons, Forks oder der Git-History landen.

Bricht mit Exit-Code 1 ab, wenn das Secret fehlt oder nicht die erwartete Anzahl
Platzhalter gefunden wird.

--- PRO PROJEKT ANPASSEN ---
"""
ZIEL_PFAD = "dist/impressum.html"   # Build-Ausgabe (vite kopiert public/ nach dist/)
ERWARTET = 2                        # Anzahl der <!--KONTAKT:START-->-Bloecke in ZIEL_PFAD
# ---------------------------

import os
import re
import sys
from pathlib import Path

ZIEL = Path(ZIEL_PFAD)
MARKER = re.compile(r"<!--KONTAKT:START-->.*?<!--KONTAKT:END-->", re.DOTALL)

kontakt = os.environ.get("IMPRESSUM_KONTAKT", "").strip()
if not kontakt:
    sys.exit("FEHLER: Secret IMPRESSUM_KONTAKT ist nicht gesetzt oder leer.")
if not ZIEL.exists():
    sys.exit(f"FEHLER: {ZIEL} nicht gefunden.")

html = ZIEL.read_text(encoding="utf-8")
treffer = len(MARKER.findall(html))
if treffer != ERWARTET:
    sys.exit(f"FEHLER: {treffer} Kontakt-Platzhalter in {ZIEL} gefunden, erwartet {ERWARTET}.")

# Funktions-Replacement: keine Sonderbehandlung von \1, \g<> etc. im Secret-Text
neu = MARKER.sub(lambda _m: kontakt, html)
ZIEL.write_text(neu, encoding="utf-8")
print(f"Kontaktblock an {treffer} Stellen in {ZIEL} eingesetzt.")
