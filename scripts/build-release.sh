#!/usr/bin/env bash
# Baut die Seite fuer den eigenen Webserver (https://mausritter.redneck-design.de/).
# Ergebnis: dist/ -> Inhalt manuell auf den Server hochladen.
#
# Voraussetzung: KONTAKT.local.html im Projektroot (Vorlage: public/KONTAKT.beispiel.html)
# oder die Umgebungsvariable IMPRESSUM_KONTAKT. Ohne Kontaktblock bricht der Build ab.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run lint
npm run build
python3 scripts/inject-kontakt.py

echo "Fertig: dist/ ist bereit zum Hochladen."
