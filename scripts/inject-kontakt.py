#!/usr/bin/env python3
"""Setzt den Kontaktblock ins Impressum des Builds (dist/) ein.

Quelle des Blocks: Umgebungsvariable IMPRESSUM_KONTAKT oder, falls nicht gesetzt,
die lokale Datei KONTAKT.local.html im Projektroot (gitignored, Vorlage:
public/KONTAKT.beispiel.html). Im Repo steht an den Kontakt-Stellen nur ein
Platzhalter zwischen <!--KONTAKT:START--> / <!--KONTAKT:END-->, damit Name,
Anschrift und E-Mail nicht in Klons, Forks oder der Git-History landen.

Aufruf normalerweise ueber scripts/build-release.sh. Bricht mit Exit-Code 1 ab,
wenn der Kontaktblock fehlt oder nicht die erwartete Anzahl Platzhalter gefunden
wird.

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

QUELLE = Path(__file__).resolve().parent.parent / "KONTAKT.local.html"

kontakt = os.environ.get("IMPRESSUM_KONTAKT", "").strip()
if not kontakt and QUELLE.exists():
    kontakt = QUELLE.read_text(encoding="utf-8").strip()
if not kontakt:
    sys.exit("FEHLER: Weder IMPRESSUM_KONTAKT noch KONTAKT.local.html vorhanden/gefuellt.")
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
