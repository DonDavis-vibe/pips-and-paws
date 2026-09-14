# Pips & Paws — Mausritter Multiplayer-Web-App — MVP-Plan

Stand: 2026-09-14

**Runde 2026-09-14b (Spanisch-PR #2 gemergt + Footer-Credit):** Salgraphics' zweiter
Spanisch-PR (`es`-Feld fuer Item-/Zauber-/Zustands-/Kreaturen-/Tabellen-Namen in
`data/*`) geprueft und gemergt — nicht direkt mergbar, da der PR vom Stand direkt
nach dem ersten Spanisch-PR (32bd43d) forkte, also vor der Umlaut-Normalisierung und
der Angleichung der Item-/Zauber-Namen an die offizielle Uebersetzung. Echte
Konflikte in `creatures.js`/`items.js`/`tables.js` von Hand aufgeloest (unsere
de/en-Texte behalten, ihre `es`-Werte uebernommen); dabei auch ein paar echte Fehler
aus dem PR gerade gezogen (fehlendes Komma, spanischer Text im falschen Feld,
doppelter Objekt-Key, zwei Tippfehler). `backgrounds.js`s PR-Aenderung dort komplett
verworfen — referenzierte eine nie definierte Variable (waere beim Laden der
Hintergrundtabelle sofort abgestuerzt) und keiner der Aufrufe uebergab ohnehin einen
spanischen Text. `es.json` selbst mergte sauber dazu. Danke-Vermerk fuer die
spanische Uebersetzung im Footer ergaenzt (`footer.translatorEs`, klein und verlinkt
zu [github.com/salgraphics](https://github.com/salgraphics)) — bewusst NICHT in
`es.json` selbst uebersetzt (faellt dort auf Englisch zurueck), passend zur
bestehenden Policy, keine neuen Keys maschinell nachzuziehen.

Arbeitstitel: **Pips & Paws** (siehe §15.4 — jederzeit änderbar).

**Fortschritt:** M0–M6 gebaut und verifiziert. Solo-Charakterbogen, Drag-&-Drop-Inventar, Würfeln,
Charaktererschaffung, DE/EN, **serverloser PeerJS-Multiplayer**, SL-Dashboard, **Tischmitte (M5)**
inkl. SL gibt Item/EP/Zustand. Live: <https://dondavis-vibe.github.io/pips-and-paws/>
(Repo: <https://github.com/DonDavis-vibe/pips-and-paws>, Pages-Deploy via Actions, SEO drin).
`reference/` ist nur noch lokal (nicht im Repo).

**SL-Werkzeuge:** [1] Tischmitte ✔ · [2] Zeit-/Licht-/Begegnungs-Tracker ✔ · [3] NSC-/Kampf-Tracker ✔ ·
[4] SL-Sitzung sichern/laden + allgemeine Notizen ✔ — Block abgeschlossen.
Der SL hat damit alles fürs Führen einer Runde (Werte sehen, Schaden/Heilen/EP/Zustand/Item geben,
Rettungswürfe/Initiative fordern, würfeln, Zeit & Licht & Begegnungen, NSC-Kampf, Notizen, Sitzung sichern).

**Discord-Webhook** (optional, wie in den anderen Tools): im Multiplayer-Menü einklappbar. Würfe und
Ereignisse werden in einen Discord-Kanal gespiegelt (Maus-Name als Absender, farbcodierte Embeds).
URL nur im localStorage, nicht in der Charakterdatei. SL kann den Webhook an die Runde verteilen.

**Runde 2026-09-14 (3D-Wuerfel fuer W4/W8/W10/W12 + eigener Wuerfel):** Der W6-Wuerfel aus
Runde h bekommt Geschwister. `DiceKit.jsx#PolyDie3D`: generischer Vielflaechner-Wuerfel fuer
Tetraeder (W4), Oktaeder (W8), angenaeherter Pentagon-Trapezoeder (W10) und Dodekaeder (W12) —
anders als der Wuerfel haben diese Formen keine rechten Winkel zwischen ihren Seiten, darum eine
echte Achse-Winkel-Drehung (kuerzester Drehweg zwischen zwei Flaechen-Normalen, `rotationBetween()`)
statt der einfachen rotateX/Y-90°-Logik des Wuerfels. Flaechen-Normalen: Tetraeder aus
Wuerfel-Eckpunkten, Oktaeder dual zum Wuerfel (Normalen = dessen Eckenrichtungen), Dodekaeder exakt
nach der bekannten Ikosaeder-Eckpunkt-Formel (Goldener Schnitt) — beim Testen bestaetigt: Front-Seite
per World-Space-Normalen-Check (nicht nur Bildschirm-Flaeche, die bei diesen Formen anders als beim
Wuerfel nicht zuverlaessig zwischen Vorder-/Hinterseite unterscheidet) stimmt exakt mit dem
gewuerfelten Wert ueberein. W20 bleibt bei der Zahlen-Anzeige (Ikosaeder mit 20 Dreiecken waere
nochmal ein eigenes, groesseres Stueck Arbeit). SL-Wuerfelpanel hat jetzt auch einen W4-Knopf (fehlte
bisher, obwohl die SRD ihn fuer beeintraechtigte Angriffe vorsieht). **Eigener Wuerfel**: kleines
Eingabefeld + Knopf (Spieler-Wuerfelleiste und SL-Panel) fuer eine frei getippte Seitenzahl (2-1000)
— bekannte Seitenzahlen (4/6/8/10/12) bekommen automatisch denselben 3D-Wuerfel wie die festen
Knoepfe, alles andere (W3, W100, ...) die normale Zahlen-Anzeige. Bewusst nicht angefasst: NSC-Angriffe
im Kampf-Tracker landen weiterhin nur im Log, nicht in der gemeinsamen Wuerfel-Buehne — das haette
eine groessere Umstrukturierung gebraucht (Ergebnis-State von `GmDicePanel` nach `GmDashboard`
hochziehen, damit `GmCombatTracker` mitschreiben kann), waere aber ein sinnvoller Folgeschritt.

**Runde 2026-09-12i (Pre-Push-Test: echter Multiplayer-Bug gefunden + gefixt):** Vor dem ersten Push
seit Langem einen echten Zwei-Tab-Multiplayer-Test gemacht (SL + Fern-Spieler ueber WebRTC, nicht nur
lokal), plus Rueckwaertskompatibilitaet mit einem alten Spielstand (vor Mietlinge/`incapacitated`)
und den Spanisch-Fallback fuer alle neuen Keys geprueft. Dabei einen echten Bug in der
Schadenskette gefunden: in `App.jsx`s `GM_DAMAGE`-Handler wurden `strHit`/`saveRoll`/`dead` aus der
`setCharacter`-Updater-Funktion heraus gelesen — deren Rueckgabewert wird von React aber erst beim
naechsten Commit ausgewertet, also NACH dem synchronen Code direkt danach. Ergebnis: der Rettungswurf
lief korrekt und landete korrekt im Charakter-State (STR-Abzug, "Verletzt", `incapacitated` — alles
sichtbar richtig), aber die Zusatzmeldungen (automatischer Rettungswurf im SL-Log, "kritischer
Schaden", Sterbe-Meldung) wurden nie verschickt, weil sie `saveRoll`/`dead` noch auf ihren
Anfangswerten (`null`/`false`) lasen. Fix: `applyDamage()` wird jetzt einmal direkt aufgerufen
(Ergebnis synchron verfuegbar) statt in der Updater-Funktion versteckt — genau das Muster, das
`GM_REST`/`GM_GIVE`/`GM_CONDITION` im selben Handler schon die ganze Zeit richtig gemacht haben.
Der lokale Spieler-Pfad (`GmLocalPlayers.jsx`) hatte diesen Bug nicht (nutzte bereits das sichere
Muster) — deshalb ist er beim fruehen Testen mit "Pelham" nicht aufgefallen. Sonst nichts
Kritisches gefunden: alte Spielstaende laden sauber (fehlende Felder werden normalisiert), Spanisch
faellt fuer alle neuen Begriffe (Mietlinge, `incap.*`) korrekt auf Englisch zurueck, Soundboard-
Broadcast wirft auf keiner Seite einen Fehler.

**Runde 2026-09-12h (Echter 3D-Wuerfel):** Letzter offener Post-MVP-Punkt (Wuerfel-„3D") umgesetzt —
Entscheidung mit dem Nutzer vorab geklaert: echter CSS-3D-Wuerfel statt Physik-Engine (keine neue
Abhaengigkeit, passt zum schlanken Stack) oder nur ausgebauter 2D-Optik. `DiceKit.jsx#Die3D`: ein
CSS-Transform-Wuerfel mit 6 Seiten (Pips wiederverwendet aus den bestehenden `PIP_FACES`), der sich
beim Wurf dreht und auf der gewuerfelten Seite landet — Drehung geht **immer vorwaerts** vom
aktuellen Winkel aus (nie ein Sprung zurueck) plus ein paar Zufalls-Extra-Umdrehungen furs
Taumel-Gefuehl. Eingebaut in `DiceStage`: ein echter Wuerfel fuer W6, zwei nebeneinander fuer W66
(Zehner/Einer) — andere Seitenzahlen (W8/W10/W12/W20) bleiben bei der Zahlen-Anzeige, ein
20-seitiger Pip-Wuerfel waere ein eigenes, viel groesseres Modell gewesen. Zentral in `DiceKit.jsx`
gebaut heisst: Spieler-Wuerfelleiste, SL-Wuerfelpanel und Waffenschaden-Wuerfe (alle nutzen
dieselbe `DiceStage`) profitieren automatisch, ohne Aenderung an drei Stellen.
**Zwei echte Bugs beim Bauen gefunden und gefixt** (beide beim Testen mit gezieltem Wuerfeln auf
bestimmte Werte aufgefallen, nicht beim ersten Blick): (1) `filter: drop-shadow(...)` auf demselben
Element wie `transform-style: preserve-3d` zwingt Chromium, das Element (inkl. Kinder) auf eine
flache 2D-Bitmap zu rendern — der Wuerfel war bei jeder Drehung ausser der Ruhestellung komplett
unsichtbar (0-Hoehe-Bounding-Box bei Diagnose). Fix: der Schatten sitzt jetzt auf dem aeusseren
`.die3d-scene`-Wrapper statt auf dem rotierenden `.die3d-cube`. (2) Fehlendes
`backface-visibility: hidden` auf den Wuerfelseiten liess in der Ruhestellung gelegentlich die
gegenueberliegende (nach hinten zeigende) Seite ueber der sichtbaren gemalt werden, weil beide
exakt dieselbe Bildschirmflaeche projizieren. Getestet: automatisiert per Konsole wiederholt
gewuerfelt, bis gezielt jede der sechs Seiten (inkl. der beiden zuvor kaputten
X-Achsen-Drehungen 2 und 5) getroffen wurde, Pip-Anzahl per DOM-Abfrage gegen den Wurfwert
verifiziert — sowie visuell in Classic/Druckbogen × Hell/Dunkel geprueft.

**Runde 2026-09-12g (Automatische Schadenskette):** Letzter Post-MVP-Punkt aus §12 umgesetzt.
`rules/gmActions.js#applyDamage` macht jetzt die volle SRD-Kette selbst: Schaden zuerst auf TP,
Ueberschuss auf STR (wie bisher) — neu ist, dass STR-Schaden sofort einen automatischen
STR-Rettungswurf ausloest (`rollSave` auf den bereits reduzierten Wert). Misslingt er, gibt's
kritischen Schaden: Zustand "Verletzt" wird automatisch ins Inventar gelegt und die Maus als
"kampfunfaehig" markiert (`character.incapacitated`, neues Feld — kein Zustands-Item, weil die
SRD dafuer keine eigene, platzbelegende Zustandskarte kennt). Sinkt STR auf 0, liefert
`applyDamage` `dead: true` zurueck; die App loescht dabei nichts und sperrt nichts automatisch,
sondern zeigt SL und Spieler:in eine unmissverstaendliche Meldung (Toast + Log + geteiltes
Event) — die eigentliche narrative Entscheidung bleibt am Tisch. "Kampfunfaehig" wird durch jede
Rast (kurz reicht) wieder aufgehoben (`rules/rest.js`), passend zur SRD ("bis versorgt + kurze
Rast"); zusaetzlich gibt's einen manuellen "Als versorgt markieren"-Knopf auf dem eigenen Bogen
(`ResourceBar.jsx`) fuer den Fall, dass die Gruppe das Versorgen anders abhandelt. Sichtbar als
Chip neben den Zustaenden im SL-Dashboard (`GmPlayerCard.jsx`) und als kleines Banner auf dem
Spielerbogen. Bewusst NICHT gebaut: der 6-Zug-/1-Stunde-Totzaehler fuer unversorgt
kampfunfaehige Wesen — dafuer muesste ein kampfunfaehiges Wesen an den globalen Zug-Zaehler des
SL (`GmTimeTracker`) gekoppelt werden, den nicht jede Runde nutzt; das waere ein automatischer
Tod ohne Bestaetigung, den niemand explizit wollte. Getestet ueber die lokale SL-Spielerkarte
(Schaden bis knapp unter Todesschwelle → Verletzt+Kampfunfaehig, dann kurze Rast → nur
Kampfunfaehig faellt weg, Verletzt bleibt; dann toedlicher Treffer → STR 0, Sterbe-Meldung in
Toast, Log und geteiltem Event, nichts gesperrt). Neue i18n-Keys in DE/EN/FR/IT/JA (nicht ES,
siehe Policy oben).

**Runde 2026-09-12f (Item-/Zauber-Namen an offizielle Uebersetzung angeglichen):** §15.7 geklaert.
Drei System-Matters-PDFs direkt von system-matters.de geladen und per `pdftotext` ausgelesen
(Schnellstarter, Referenzbogen, Spielrundenbogen) — daraus liessen sich einige Begriffe konkret
belegen, die von unseren eigenen Uebersetzungen abwichen: Waffenklasse "Mittelschwere Waffe" statt
"Mittlere Waffe", "Leichte/Schwere Fernkampfwaffe" statt "...Fernwaffe" (`data/items.js`,
Kommentar in `rules/dice.js` mitgezogen), Zauber "Genesung" statt "Heilung" fuer Heal (inkl.
Fundort in `data/backgrounds.js`). Bei der Gelegenheit auch die drei abweichenden Zustandsnamen
korrigiert, die in denselben Quellen auftauchten (nicht Teil der urspruenglichen Frage, aber
eindeutig belegt): "Aengstlich" statt "Veraengstigt" (Frightened), "Entkraeftet" statt
"Ausgelaugt" (Drained), "Belastet" statt "Ueberladen" (Encumbered) — inkl. der Zauber-Wirkungstexte,
die den alten Zustandsnamen als Text zitierten (Furcht, Wiederherstellen). Fuer die restlichen
Zauber ohne belegte offizielle Entsprechung (Feuerball, Magisches Geschoss, Finsternis, Licht,
Unsichtbarer Ring, Oeffnen, Schmiere, Wachsen, Unsichtbarkeit, Katzenminze, Verstanden werden)
blieb die eigene Uebersetzung stehen — nichts geraten, nur belegte Begriffe uebernommen. Fund am
Rande, bewusst NICHT umgesetzt: die offizielle Waehrung heisst auf Deutsch "Kerne", nicht "Pips" —
eine Aenderung dort wuerde quer durchs UI (Ressourcen-Label, Hinweistexte) und in den App-Namen
selbst hineinreichen ("Pips & Paws"-Wortspiel), das ist eine groessere Entscheidung als eine
Item-Namens-Angleichung und bleibt offen, bis das explizit gewuenscht wird. Ebenso nicht angefasst:
"Trefferschutzpunkte (TP)" als offizieller Vollbegriff fuer HP statt unserem "Trefferpunkte" —
gleiche Kategorie groesserer, UI-weiter Umbenennung.

**Runde 2026-09-12e (Mietlinge + Ruestungs-Text-Fix):** Die zwei letzten offenen Discord-Punkte
abgearbeitet. **Miethelfer** (`rules/hirelings.js`, `HirelingsPanel.jsx`): eigenes Panel auf dem
Spielerbogen, SRD-Katalog mit 9 Typen + Tageslohn als Vorschlag, TP (W6) und STR/DEX/WIL (je 2W6)
werden beim Anheuern sofort ausgewuerfelt und bleiben danach frei editierbar (Stepper wie ueberall
sonst), Moral-Rettungswurf (WIL-Save, SRD: bei Misserfolg flieht der Mietling) landet lokal im
Wuerfel-Panel — bewusst nicht an GM/Discord gemeldet, das ist Sache der Spielerin. Kein eigenes
Inventarraster (die SRD gaebe ihnen 6 Plaetze wie einer Maus, das haette den Bogen gesprengt) —
Ausruestung kommt in die Notiz. **Ruestungs-Platzmodell** (§11.7): beim genaueren Hinsehen war die
"saubere" Lösung (echtes Pfote+Koerper-Paar fuer Leichte Ruestung) ein groesserer Eingriff in den
Kern von Drag & Drop, nicht der erhoffte Fuenf-Minuten-Fix — stattdessen den Effekt-Text beider
Ruestungen ehrlich an das angepasst, was das Platzmodell tatsaechlich zulaesst (irgendein
gleichartiges Paar), Abweichung von der SRD in §11.7 dokumentiert.

**Runde 2026-09-12d (Post-MVP-Bestandsaufnahme + Mehrere Maeuse):** Nachgefragt, was aus der
"Post-MVP"-Liste (§12) noch fehlt: **Party-Uebersicht** ✔ und **Discord-Webhook** ✔ waren
laengst erledigt (nur hier nicht abgehakt). Neu gebaut: **Mehrere Maeuse pro Browser**
(`useCharacterRoster.js`, `RosterModal.jsx`) — jede je aktive Maus wird automatisch in eine
Liste gespiegelt (kein manuelles Sichern noetig), ein Knopf "Meine Maeuse" (erscheint erst ab
der zweiten Maus) zeigt die jeweils ANDEREN mit Laden/Entfernen. Bewusst nicht angefasst:
**automatische Schadenskette** (SRD: nach STR-Schaden ist ein STR-Save faellig, bei Fehlschlag
gibt's die Injured-Condition + Incapacitated-Status + 6-Turn-Totzaehler bis zum Tod ohne
Versorgung) — das ist ein groesserer Zustandsautomat, kein "schnelles" Feature, bleibt offen.
Ebenso offen und bewusst NICHT "mal eben": Wuerfel-„3D" und ein Karten-/Battlemap-Modul —
beides eigene groessere Bausteine. Supabase/echte DB bleibt aus Prinzip aussen vor (§1).

**Runde 2026-09-12c (i18n-Policy: ES bleibt offen):** Version auf 0.2.0 hochgezaehlt
(`src/config.js`, `package.json`) — laengst faellig nach all den Runden seit 0.1.0. Beim
Nachfragen zum Stand der spanischen Uebersetzung stellte sich heraus: die 38 Schluessel, die seit
Salgraphics' PR #1 (lokale Spieler, Soundboard, Gruppenuebersicht, Skin-Umschalter) dazukamen,
hatte ich selbst maschinell ins Spanische nachgezogen, obwohl @Salgraphics eigentlich weiter
mituebersetzen wollte. `es.json` ist jetzt wieder exakt auf Salgraphics' PR-Stand (390 Schluessel,
0 veraendert) — neuere Schluessel fallen bewusst auf Englisch zurueck (`t()` kann das eh schon),
statt vorschnell maschinell aufgefuellt zu werden. Policy ab jetzt: bei neuen Features DE/EN/FR/
IT/JA wie bisher pflegen, ES aber NICHT automatisch mitziehen — die Luecke bleibt fuer eine
muttersprachliche Uebersetzung offen. READMEs + CONTRIBUTING.md entsprechend klargestellt.

**Runde 2026-09-12b (Offline-Tisch, Soundboard, Gruppenuebersicht):** Drei Ergaenzungen
fuers gemeinsame Spielen am Tisch. **Lokale Spieler** (`src/useLocalPlayers.js`,
`GmLocalPlayers.jsx`): der SL legt im Dashboard eigene Boegen an oder laedt sie (fuer
Mitspieler ohne eigenes Geraet), wendet Schaden/Heilen/Rast/Item/Zustand direkt darauf an
(`rules/gmActions.js` — dieselben reinen Funktionen wie beim Fern-Spieler-Pfad in App.jsx)
und kann den vollen Bogen zum Herumreichen im Vollbild oeffnen ("Bogen oeffnen" ersetzt
das ganze Dashboard, "Zurueck zum SL-Dashboard"-Leiste). **Soundboard** (`GmSoundboard.jsx`,
`utils/sound.js`, `utils/customSounds.js`): eingebaute Kurz-Effekte (Erfolg/Fehlschlag/
Krit/Patzer/Glocke) sind kurze CC0-Sounds von Kenney (kenney.nl, gemeinfrei —
siehe `src/assets/sfx/CREDITS.txt`); ursprünglich als Web-Audio-Synthese gebaut,
dann auf Nutzerfeedback ("klingen nicht gut") durch generische UI-Sounds
("Interface Sounds") ersetzt, dann nochmal auf Feedback ("passen nicht zur
Spielrunde") durch gezupfte Saiten aus "Music Jingles" — auf-/absteigende
Notenfolgen fuer Erfolg/Krit/Fehlschlag/Patzer, thematisch naeher an
Mausritters Ton als Software-Pieptoene. Die Glocke bleibt ein echter
Gong-Anschlag aus "Interface Sounds". Fuer Ambient-/Musikdateien bleibt
es bei "SL laedt eigene hoch" (IndexedDB, lokal, geht beim Abspielen nur direkt per
WebRTC an aktuell Verbundene — wie der Discord-Webhook) — deren Lizenzen sind so gut
wie nie wirklich frei (siehe z. B. htbah-tool), die will ich nicht ins Repo legen. Lautstaerke: SL-Pegel pro Sound x eigener Geraete-Pegel (neuer Regler in
der Kopfzeile, `VolumeControl.jsx`). **Gruppenuebersicht** (`PartyGroup.jsx`, Protokoll
`T_GROUP`): der SL teilt optional ("Gruppenuebersicht mit Spielern teilen") eine kompakte
Sicht der Spieler aufeinander — Name, TP-Balken, Zustaende, keine Attribute/Inventar.
Broadcast bei jeder Bogen-Aenderung (debounced), analog zu NSC-Sichtbarkeit/Runden-Log.

**Runde 2026-09-12 (Druckbogen-Design):** Reaktion auf die Kritik „sieht aus wie jedes KI-Produkt".
Neues Standard-Design **Druckbogen** (`src/print.css`): Tusche auf Papier, 3px-Linien mit Tusche-Filter
(SVG `feTurbulence`+`feDisplacementMap` auf Pseudo-Elementen, Inhalt bleibt scharf), asymmetrische
„handgezeichnete" Radien, flache Schmuckfarben (Rosé/Oliv/Schiefer/Senf) als Kopfleisten, harte
Versatzschatten statt Weichzeichner, Schriften Eczar/Newsreader/Archivo/Caveat (Handschrift für
Randnotizen), liniertes Notizpapier, Dunkelmodus als Negativdruck. Gezeichnete SVG-Vignetten
(`src/components/Art.jsx`: Maus, Ritter-Platzhalter, Truhe, Laterne, Würfel+Feder) ersetzen im
Druckbogen Wappen-Foto, Platzhalter und KI-Vignetten; Favicon = gezeichnete Maus. Das alte Design bleibt
als **Classic** (`theme.css` in `@layer classic`, trägt weiter das ganze Layout), Umschalter (Pinsel) in
der Kopfzeile, `data-skin` auf `<html>`, gemerkt unter `pips-paws-skin`. Nebenbei: `de.json` und die
deutschen Regeldaten tragen jetzt echte Umlaute statt ae/oe/ue.

**Runde 2026-09-08 (Sprachen + SEO + README):** UI-Übersetzungen FR/IT/JA komplett (je 387 Keys,
maschinell unterstützt), in `LANGS`/`DICTS` freigeschaltet — App jetzt DE/EN/FR/IT/JA, nur `es.json`
noch Gerüst. `?lang=xx` als Einmal-Schalter (Vorrang bei detectLang, danach aus der URL entfernt +
als Präferenz gespeichert). `<html lang>` und `<title>`/`<meta description>` wechseln per JS mit der
Sprache (`meta.title`/`meta.description` je Sprache). SEO: hreflang-Alternates + `og:locale:alternate`
für fr/it/ja, JSON-LD `inLanguage` erweitert, mehrsprachiger `<noscript>`-Block, Keywords um FR/IT/JA-
Begriffe ergänzt, `sitemap.xml` mit hreflang. README auf Englisch (`README.md`), deutsche Fassung als
`README.de.md`, echte Screenshots (`docs/screenshots/`, headless über Edge gerendert). Attributskarte:
zweistellige AKTUELL-Zahl überlappt nicht mehr das Plus.

**Runde 2026-09-06 (Discord-Feedback + Feinschliff):** Attributwert kann nicht mehr übers Maximum;
Zustände im Raster deutlich auffälliger; SL-Alarmbanner bei Begegnung/Vorzeichen; Tageszeit optional
für Spieler sichtbar; Gegenstände in der Tischmitte verstecken (verlassen den SL-Rechner nicht);
Rast per SL auslösbar + „Rast nur durch mich"; Karten aus der Tischmitte auf Wunschplatz ins Raster
ziehen; Klick auf Schadens-Chip würfelt (ein-/zweihändig getrennt); NSC für Spieler sichtbar schalten
(nur Name); Symbol-Auswahl für Gegenstände (88 Lucide-Icons, ~60 Katalog-Standards); SL bekommt ein
vollwertiges Würfel-Panel mit Wurf-Protokoll inkl. Spieler-Würfen; Würfelbereich ab 1180px klebende
zweite Spalte (Bogen + Dashboard); Reconnect-Fix (Spieler schickt Bogen nach Host-Neustart erneut);
neues Wappen (Gold-Holzschnitt, W20-Schild) als Marke/Icon/Social-Card; Verlies-Foto als
Dunkelmodus-Hintergrund, Holztisch-Foto als Hellmodus-Hintergrund (statt Papierkorn); Holzschnitt-
Vignetten in den Leerzuständen (keine Maus verbunden, leere Tischmitte, Wizard-Start).

**Runde 2026-08-30:** eigenes Wappen-Logo aus KI-Holzschnitt (Ritter-Maus) + neue Social-Card;
Charakterbilder (Upload, Platzhalter, Sync zum SL, im SL-Dashboard sichtbar); geteiltes Runden-Log
im Multiplayer (SL schaltet frei, Host spiegelt an alle Spieler, Spieler-Panel einklappbar);
einklappbare Panels auf Bogen + Dashboard (Zustand pro Panel gemerkt); Hell/Dunkel-Schalter
(System/Hell/Dunkel, `data-theme`, Inline-Skript gegen Flackern); SL-Helfer: Vorteil/Nachteil beim
Rettungswurf, Rast-Helfer, Reaktions-/Schatz-/Moralwurf; Würfeltool-Optik (SVG-Glyphen, Taumel-
Animation, Ergebnis-Bühne); InfoHint per Portal (nicht mehr von Panels abgeschnitten); kleines
Maus-Icon am Bogen-Kopf. `img/` nur lokal (bis auf die Holzschnitt-Quelle).

**Hilfetexte:** [A] Hilfe-Modal (`?` in der Kopfzeile + Footer-Link) mit sieben Abschnitten (Was ist das,
Speicherung & Datenschutz, Charakterbogen, Inventar, Multiplayer, SL-Werkzeuge, Regeln & Lizenz),
zweisprachig. [B] Bessere Leerzustände: Inventar-Hinweis wenn nichts dabei ist, ausführlicheres
Würfel-Log / „keine Maus verbunden" / leere Tischmitte. [C] Inline-`(i)`-Aufklapper an Rettungswurf,
Pips, EP/Mumm und Nutzungspunkten (`InfoHint` in `ui.jsx`).

**Optik-Überarbeitung** (nur CSS/Fonts, keine Struktur-/Logikänderung): Bricolage-Grotesque-Display +
Fraunces-Serif (mit vollständigem Fallback-Stack für den `file://`-Release), abgestuftes Schatten- und
Farbsystem mit zweitem Akzent (Grün) und Gold, Papier-Grain + Verlaufs-Hintergrund, Panels mit
Akzentleiste/Tiefe/Einblendung, überarbeitete Attribut-/Ressourcen-Blöcke, HP-Leiste mit Verlauf,
Inventar-Slots im Raster-Look mit deutlicherem Drop-Zustand, Pill-Buttons, animierte Toasts/Modals,
GM-Karten mit Hover-Lift. `prefers-reduced-motion` respektiert. Build + Lint grün.

---

## 1. Kernentscheidungen (TL;DR)

| Frage | Entscheidung | Begründung |
|---|---|---|
| Echtzeit-Technik | **WebRTC / PeerJS, serverlos** — nicht Firebase/Supabase | Deckt sich mit dem Konzept ("keine Zwangsregistrierung, nur Session-Links") und mit der Hausarchitektur der Referenzprojekte (`coc-tool`, `demonslayer`, `htbah-tool`). Keine Serverkosten, kein Backend-Betrieb, kein DSGVO-Datenspeicher. |
| Autoritätsmodell | **Spielleiter-Client ist Host & Autorität** | Ein Peer hält den maßgeblichen Stand (Shared Stash, wer verbunden ist), Spieler pushen ihren eigenen Bogen. Gleiches Muster wie `coc-tool` (`useMultiplayer.js`). |
| Frontend | **Vite + React 19 + plain JS** (kein TypeScript), `oxlint` | Exakt der Stack von `coc-tool` — das neueste Referenzprojekt. |
| Icons | `lucide-react` | Wie `coc-tool`. Keine Original-Artworks von Mausritter (Lizenz). |
| Drag & Drop | `@dnd-kit/core` + eigenes Slot-Raster | Kein fertiges Grid-Inventar-Paket nötig; das Raster ist klein und fix. |
| Build/Deploy | **GitHub Pages**, zusätzlich `vite-plugin-singlefile` für eine portable `index.html` | Wie `coc-tool`. |
| Accounts | **keine** | Raum-Code (4 Zeichen) + `?join=CODE`-Link. |
| Sprachen | **zweisprachig DE + EN** von Anfang an, eigener Mini-`t()`-Helfer (kein i18next) | Mausritter wird in beiden Sprachen gespielt. Umschalter in der Kopfzeile, Default aus `navigator.language`, in `localStorage` gemerkt. |
| Regeltreue | **Mausritter-SRD ohne Hausregeln** | Keine `str`-Sperre für Rucksack-Slots o.Ä. — alle 6 Pack-Slots immer nutzbar. |

**Abgrenzung zu Firebase/Supabase:** Diese wären nötig, wenn die App *ohne* dass jemand "hostet" funktionieren müsste (persistente Räume, asynchrones Spiel, Web-ohne-Tab-offen). Für einen klassischen Spielabend am Tisch/Discord ist der serverlose Ansatz einfacher, billiger und passt zur bestehenden Codebasis. Ein späterer Umstieg bleibt möglich (siehe §12, Abstraktionsschicht in `useMultiplayer`).

---

## 2. Tech-Stack im Detail

```
vite@5             Build & Dev-Server
react@19 / react-dom@19
peerjs@1.5         WebRTC-Signalling + DataConnection
@dnd-kit/core      Drag & Drop für das Inventar-Raster
@dnd-kit/utilities
lucide-react       Icons
oxlint             Linting (devDep)
vite-plugin-singlefile   portable Einzel-HTML für den Release
```

Kein State-Management-Paket. Ein `character`-Objekt im `useState` des Wurzel-Components, gespiegelt in `localStorage` — identisch zu `coc-tool`/`demonslayer` (`appData`-Muster).

Öffentliche Infrastruktur, die genutzt wird (kostenlos, kein Account):
- PeerJS Cloud Broker (nur Signalling — es fließen keine Spieldaten darüber)
- Google STUN-Server (`stun.l.google.com:19302` u.a.)
- optional: eigener TURN-Server als `localStorage`-Eintrag für striktes NAT (wie in den Referenzen)

---

## 3. Projektstruktur

```
mausritter/
  index.html
  vite.config.js
  package.json
  .oxlintrc.json
  .claude/launch.json          # dev auf :5173, preview auf :4173
  PLAN.md                      # dieses Dokument
  LICENSE                      # MIT für den Code
  README.md
  src/
    main.jsx
    App.jsx                    # Wurzel: hält character, Routing Player/GM-Ansicht
    index.css
    theme.css                  # eigene Optik (keine Mausritter-Assets)
    i18n/
      index.js                 # winziger t(key) + useLang() (kein i18next)
      de.json                  # UI-Strings deutsch
      en.json                  # UI-Strings englisch
    data/
      backgrounds.js           # Hintergrund-Tabelle aus dem SRD (name_de/name_en, Start-Ausrüstung)
      items.js                 # Start-Items, Waffen, Rüstung, Standard-Ausrüstung (Felder je Sprache)
      spells.js                # Zauber-Liste (SRD)
      conditions.js            # Zustände (nehmen Inventar-Slots)
      tables.js                # Namen, Fellmuster, Geburtszeichen für den Wizard
    rules/
      character.js             # blankCharacter(), Ableitungen (HP-Max)
      inventory.js             # reine Funktionen: passt Item in Slot? Slot-Belegung, Umzug
      dice.js                  # W6, W66, Wurf-mit-Ergebnis, Save-Wurf (W20 ≤ Attribut)
    multiplayer/
      useMultiplayer.js        # PeerJS-Hook (Host/Join/Reconnect/Protokoll)
      protocol.js              # Nachrichtentypen als Konstanten + Validierung
    components/
      CharacterSheet.jsx       # die Spieler-Ansicht
      InventoryGrid.jsx        # das Slot-Raster (Pfoten/Körper/Rucksack)
      ItemCard.jsx             # ein Item-Kärtchen (1 oder 2 Slots breit, Usage-Dots)
      SharedStash.jsx          # geteilte Tischmitte
      AttributeBox.jsx
      HpPipsBar.jsx
      DiceRoller.jsx / DiceResult.jsx
      CharacterWizard.jsx      # Charaktererschaffung (SRD-Ablauf)
      MultiplayerModal.jsx     # hosten / beitreten / Link kopieren / TURN
      ConnectionBadge.jsx
      GmDashboard.jsx          # kompakte Übersicht aller Spieler
      GmPlayerCard.jsx
    utils/
      storage.js               # localStorage/sessionStorage-Wrapper (try/catch)
      exportImport.js          # Charakter & Session als .json
```

---

## 4. Datenmodell

### 4.1 Charakter

```js
{
  schemaVersion: 1,
  id: "c_ab12cd",              // stabile ID (für GM-Dashboard-Zuordnung, Item-Transfer)
  name: "",
  playerName: "",
  background: "",              // Herkunft
  appearance: "",              // Fellmuster / Aussehen
  birthsign: "",               // Geburtszeichen (SRD-Tabelle) — optionaler Flavor
  disposition: "",             // Wesenszug

  // Attribute: Max = Startwert, Current = aktueller (Schaden senkt Current)
  str:  { max: 10, current: 10 },
  dex:  { max: 10, current: 10 },
  wil:  { max: 10, current: 10 },

  hp:   { max: 4, current: 4 },
  pips: 0,                     // Silber-Pips (Währung) — getrennt von xp
  xp:   0,                     // Erfahrung (1 XP je erbeutetem Pip); Stufe steigt an SRD-Schwellen
  level: 1,
  grit: 0,                     // "Mut"/Advancement-Zähler

  inventory: {
    paw_left:  null | ItemRef,
    paw_right: null | ItemRef,
    body_1:    null | ItemRef,
    body_2:    null | ItemRef,
    pack_1..6: null | ItemRef
  },

  notes: ""
}
```

**Regel-Hinweise:**
- `hp.max` beim Wizard aus 1W6 gewürfelt, danach editierbar.
- **Alle 6 Pack-Slots sind immer nutzbar** (SRD). Keine `str`-Sperre. Belastung/Encumbrance entsteht in Mausritter dadurch, dass Slots durch Zustände (Fatigue u.Ä.) belegt werden — nicht durch eine Slot-Sperre.
- Zwei-Hand-Waffen belegen `paw_left` **und** `paw_right` (Item mit `size: 2`, Achse „paws").
- Save = **W20 ≤ Attribut-Current** (`d20 <= attr` → Erfolg).

### 4.2 Item

Items liegen **nicht** verschachtelt im Charakter, sondern in einer flachen `Map` pro Client (`itemsById`), der Charakter referenziert nur per ID. Das macht den Transfer zwischen Spieler und Stash konfliktfrei.

```js
ItemRef = { itemId: "i_x92" }

Item = {
  itemId: "i_x92",
  key: "torch",                    // stabiler Verweis auf data/items.js (Katalog-Item) oder null (Custom)
  name:   { de: "Fackel", en: "Torch" },
  type: "standard" | "weapon" | "armour" | "spell" | "condition" | "light" | "ration",
  size: 1 | 2,                     // belegte Slots
  axis: "any" | "paws" | "body",   // wo darf es liegen (2er-Items brauchen 2 gleiche benachbarte)
  usage: { max: 3, current: 0 },   // Nutzungspunkte (Rationen, Fackeln, Munition, Zauber)
  damage: "d6" | "d6/d8" | null,   // Waffen
  defense: 1 | 2 | null,           // Rüstung
  effect: { de: "", en: "" },      // Wirkungstext (eigene Zusammenfassung, nicht wörtlich SRD)
  cleared: false,                  // Zustände: durchgestrichen/erledigt
  origin: "start" | "wizard" | "stash" | "gm"
}
```

Ein Item trägt beide Sprachen mit sich. So bleibt der Text auch dann korrekt, wenn GM und Spieler die App auf unterschiedliche Sprachen gestellt haben — jede Seite rendert `name[lang]`. Bei Custom-Items ohne Übersetzung wird auf die vorhandene Sprache zurückgefallen.

Zustände (`type: "condition"`) sind ganz normale Items, die einen Slot belegen — das ist die Mausritter-Kernmechanik und der Grund, warum das Raster-Inventar überhaupt Sinn ergibt.

### 4.3 Shared Stash (GM-autoritativ)

```js
stash = {
  items: [ Item, ... ],       // volle Item-Objekte, keine Refs
  updatedAt: 1724800000000
}
```

### 4.4 Session (nur GM, für Speichern/Laden)

```js
{
  schemaVersion: 1,
  roomCode: "K7QF",
  stash,
  gmNotes: "",
  playerNotes: { [characterId]: "geheime SL-Notiz" }   // lokal, nie an Spieler
}
```

---

## 5. Komponentenbaum

```
App
├─ ConnectionBadge                    (immer sichtbar sobald MP aktiv)
├─ MultiplayerModal                   (hosten / beitreten / ?join-Link / TURN)
│
├─ [role !== 'gm']  CharacterSheet
│   ├─ CharacterWizard                (nur wenn Bogen leer)
│   ├─ Kopf: Name, Herkunft, Aussehen
│   ├─ AttributeBox ×3  (STR/DEX/WIL, max + current, Save-Wurf-Knopf)
│   ├─ HpPipsBar
│   ├─ DndContext
│   │   ├─ InventoryGrid              (paws / body / pack, blockierte Slots markiert)
│   │   │   └─ ItemCard ×n
│   │   └─ SharedStash                (dieselbe DndContext — Ziehen sheet↔stash)
│   │       └─ ItemCard ×n
│   ├─ DiceRoller / DiceResult
│   └─ Notizen
│
└─ [role === 'gm']  GmDashboard
    ├─ Raum-Code + Einladungslink + Status
    ├─ SharedStash                    (GM kann Loot anlegen / entfernen)
    ├─ Live-Log (Würfe, Beitritte, Transfers)
    └─ GmPlayerCard ×n
        ├─ Name, Herkunft
        ├─ HP-Balken, STR/DEX/WIL (current/max), Pips
        ├─ Zustände (hervorgehoben)
        ├─ ausklappbar: volles Inventar
        ├─ geheime SL-Notiz (lokal)
        └─ Aktionen: Schaden, Heilen, Pips geben, Save fordern, Item schicken, flüstern
```

---

## 5a. Zweisprachigkeit (DE / EN)

Leichtgewichtig, ohne `i18next`:

- `i18n/de.json` + `i18n/en.json` — flache Key→String-Maps für alle UI-Texte.
- `i18n/index.js`: `const t = (key, vars) => interpolate(dict[lang][key] ?? dict.en[key] ?? key, vars)` plus ein `LangContext` + `useLang()`-Hook. Sprache in `localStorage` (`mausritter-lang`), Default aus `navigator.language`.
- Umschalter (DE | EN) in der Kopfzeile, immer sichtbar.
- **Spieldaten** (`data/items.js`, `backgrounds.js`, `spells.js`, `conditions.js`, `tables.js`) tragen `{ de, en }`-Felder direkt im Datensatz — nicht in den JSON-Dicts. Gerendert wird `feld[lang]` mit Fallback auf die andere Sprache.
- **Items im Multiplayer** tragen beide Sprachen mit sich (§4.2), damit GM (z.B. EN) und Spieler (z.B. DE) jeweils ihre Sprache sehen.
- Würfel-/Log-Nachrichten werden als **strukturierte Events** verschickt (`{ kind: 'save', attr: 'str', ok: true }`), nicht als fertiger Text — jede Seite formatiert sie in ihrer Sprache. Freitext (Flüstern, Ansagen, Notizen) bleibt wie eingegeben.

Aufwand: überschaubar, wenn von Beginn an konsequent `t()` statt Literale genutzt wird. Nachträglich einzuziehen wäre teuer — daher schon in M0.

---

## 6. Multiplayer-Architektur

### 6.1 Prinzip (aus `coc-tool/useMultiplayer.js` übernommen)

- **GM** ruft `hostSession()` → `new Peer(ROOM_PREFIX + code)`. Feste Peer-ID = Raum-Code, damit Spieler gezielt verbinden.
- **Spieler** ruft `joinSession(code)` → `new Peer()` (zufällige ID) → `peer.connect(ROOM_PREFIX + code)`.
- `ROOM_PREFIX = "mausritter-"` gegen Kollisionen auf dem öffentlichen Broker.
- **sessionStorage** merkt sich `{ role, roomCode }` → Reload mitten in der Runde stellt die Verbindung automatisch wieder her.
- **Reconnect mit exponentiellem Backoff** für beide Seiten (2s→30s, max 8 Versuche).
- `?join=CODE` in der URL → automatischer Beitritt, Parameter wird danach aus der URL entfernt.
- Optionaler TURN-Server aus `localStorage` für striktes NAT.

### 6.2 Datenflüsse

| Datum | Autorität | Fluss |
|---|---|---|
| Eigener Charakterbogen | jeweiliger Spieler | Spieler → GM bei jeder Änderung (`state`) |
| Shared Stash | GM | GM → alle (`stash`) — Full-Replace nach jeder Änderung |
| Würfe / Ereignisse | Absender | Spieler → GM (`event`, strukturiert); GM formatiert in seiner Sprache im Live-Log |
| GM-Aktionen (Schaden, Save fordern …) | GM | GM → Spieler (`gmCommand`) |
| Item-Transfer | GM vermittelt | Request/Confirm, siehe §8 |

Der GM sendet den Spielern **nicht** die Bögen der anderen Spieler im MVP (Datensparsamkeit + weniger Traffic). Eine schlanke Party-Übersicht für Spieler (nur Name + HP-Balken) ist ein einfacher Post-MVP-Zusatz — Muster `sendeGruppenliste()` aus `demonslayer`.

### 6.3 Nachrichtenprotokoll (`multiplayer/protocol.js`)

```js
// Spieler → GM
{ t: 'state',   character, items }                // kompletter Bogen + itemsById-Map (klein genug)
{ t: 'event',   ev }                              // strukturiertes Log-Event, z.B. { kind:'save', attr:'str', roll:7, ok:true }
{ t: 'say',     text }                            // Freitext (Flüstern an SL) — wird verbatim gezeigt
{ t: 'stash/drop',    item }                      // "ich lege dieses Item in die Mitte"
{ t: 'stash/take-req', itemId }                   // "ich möchte dieses Item nehmen"

// GM → Spieler
{ t: 'stash',        items }                      // Full-Replace des Stash
{ t: 'stash/take-ok', item }                      // Bestätigung: Item gehört jetzt dir
{ t: 'stash/take-no', itemId, reason }            // schon weg / abgelehnt
{ t: 'gmCommand', cmd: 'damage',  amount, target: 'hp'|'str'|'dex'|'wil', source }
{ t: 'gmCommand', cmd: 'heal',    amount, target }
{ t: 'gmCommand', cmd: 'pips',    amount }
{ t: 'gmCommand', cmd: 'save',    attr: 'str'|'dex'|'wil', reason }
{ t: 'gmCommand', cmd: 'give',    item }          // GM schiebt Item direkt in den Bogen
{ t: 'gmCommand', cmd: 'whisper', text }
{ t: 'gmCommand', cmd: 'broadcast', text }
```

Alle eingehenden Nachrichten werden gegen eine Whitelist der Typen geprüft; Freitext wird beim Rendern escaped (kein `dangerouslySetInnerHTML` mit Fremddaten — vgl. `sichererHtml()` in `demonslayer`).

---

## 7. Drag & Drop

- **Ein** `DndContext` umschließt InventoryGrid **und** SharedStash, damit direkt zwischen beiden gezogen werden kann.
- **Droppables**: jeder Slot (`paw_left`, `body_1`, `pack_3`, …) + eine Stash-Dropzone.
- **Draggables**: `ItemCard` mit `id = itemId`.
- **`onDragEnd`** ruft eine reine Funktion `rules/inventory.js#tryMove(state, itemId, fromSlot, toSlot)`:
  - passt `axis`? (Waffe darf nicht in Body-Slot einer Rüstung usw. — bzw. locker: `any` überall)
  - `size: 2` → prüft, ob der Partnerschlitz frei/kompatibel ist (`paw_left`+`paw_right`, `body_1`+`body_2`, `pack_1`+`pack_2` …)
  - belegt? → **Tausch** (swap) statt Ablehnen, wenn beide 1 Slot groß sind
- Visuelles Feedback: gültige Slots hervorheben (`useDroppable().isOver`).
- Touch: `@dnd-kit` `PointerSensor` + `TouchSensor` mit kleinem Aktivierungs-Delay (Tablet am Spieltisch).
- **2-Slot-Items** werden als ein Kärtchen über zwei Zellen gerendert (CSS `grid-column: span 2`).

`ItemCard` zeigt: Name, Typ-Icon, Usage-Dots (klickbar zum Ab-/Anhaken), bei Waffen Schaden, bei Rüstung Verteidigung, `effect` als Tooltip/Aufklapper. Zustände: rote Umrandung; "erledigt" = durchgestrichen.

---

## 8. Item-Transfer Spieler ↔ Stash ↔ Spieler

Kritisch, weil zwei Clients dasselbe Item nicht doppelt halten dürfen. Lösung: **GM ist Schiedsrichter**, Request/Confirm (analog `submitBoardCard` → `addBoardCard` in `coc-tool`).

**Ablegen (Spieler → Stash):**
1. Spieler zieht Item in die Stash-Dropzone.
2. Client entfernt Item *optimistisch* aus dem Bogen, merkt es als "pending-drop".
3. `stash/drop {item}` an GM.
4. GM hängt Item an `stash.items`, broadcastet `stash {items}`.
5. Spieler sieht sein Item im Stash ankommen → "pending" aufgelöst. (Timeout 5s → zurücklegen.)

**Nehmen (Stash → Spieler):**
1. Spieler zieht Stash-Item auf einen freien Slot.
2. Client rendert Slot als "reserviert", `stash/take-req {itemId}` an GM.
3. GM prüft: Item noch im Stash?
   - ja → aus `stash.items` entfernen, `stash/take-ok {item}` an genau diesen Spieler, `stash {items}` an alle.
   - nein → `stash/take-no {itemId, reason:'gone'}`.
4. Spieler: bei `take-ok` Item in den reservierten Slot schreiben; bei `take-no` Reservierung lösen + Toast.

**GM legt Loot an:** direkt lokal in `stash.items`, broadcast. **GM gibt Item gezielt:** `gmCommand cmd:'give'` → landet im ersten freien passenden Slot des Spielers (oder als "nicht verstaut"-Overflow, das der Spieler dann einräumt).

---

## 9. GM-Dashboard

- Kompakte Karten (`GmPlayerCard`), eine pro verbundenem Spieler, sortiert nach Beitritt.
- Immer sichtbar: Name, Herkunft, **HP-Balken** (grün/gelb/rot), STR/DEX/WIL als `current/max` (rot wenn `current < max`), Pips, **Zustände als Chips** (das ist die wichtigste "auf einen Blick"-Info in Mausritter).
- Ausklappbar: vollständiges Inventar, Notizen.
- Pro Karte geheime SL-Notiz — nur `localStorage`, wird nie gesendet.
- Aktionsknöpfe → `gmCommand`: Schaden (mit Ziel HP/STR/DEX/WIL), Heilen, Pips ±, Save fordern, Item schicken, Flüstern. Plus "Ansage an alle".
- Live-Log: Würfe, Beitritte/Abgänge, Stash-Transfers, GM-Aktionen. Max 200 Einträge (wie `coc-tool`).
- Verbindungszustand des Raums (🟢/🔴) wie in den Referenzen.

Der GM hat **keinen** eigenen Charakterbogen (Rolle ist exklusiv). Wechsel Solo→GM→Solo möglich, solange keine Spieler verbunden sind.

---

## 10. Persistenz

| Was | Wo | Lebensdauer |
|---|---|---|
| Eigener Charakter | `localStorage` `mausritter-character-v1` | dauerhaft, Autosave bei jeder Änderung |
| Rolle + Raum-Code | `sessionStorage` | Tab-Lebensdauer (Reload-Schutz) |
| Empfangene Handouts/Loot-Historie | — (nicht im MVP) | — |
| TURN-Server-Konfig | `localStorage` | dauerhaft |
| GM-Session (Stash, Notizen) | Datei-Export `.json` + Autosave in `localStorage` | dauerhaft / manuell |
| Geheime SL-Notizen | `localStorage` beim GM | dauerhaft |

Alle Storage-Zugriffe in `try/catch` (privater Modus). `beforeunload`-Warnung, wenn Bogen Daten hat **oder** eine Session läuft (wie `coc-tool`).

Export/Import: einzelner Charakter als `.json` (zum Mitnehmen an anderes Gerät), GM-Session als `.json`.

---

## 11. Regeltreue & geklärte Punkte

Entscheidung: **so nah am Mausritter-SRD wie möglich, keine Hausregeln.**

1. **`pips` und `xp` getrennt** (geklärt). *Pips* = Silber/Geld, *XP* = Erfahrung (1 XP je erbeutetem Pip Schatz, Stufenaufstieg an den SRD-Schwellen). UI zeigt beide klein nebeneinander.

2. **Rucksack: alle 6 Pack-Slots immer nutzbar** (geklärt — keine `str`-Sperre). Belastung entsteht regelkonform dadurch, dass Zustände Slots belegen.

3. **Attribut-Schaden / Tod.** ✔ Automatisiert, siehe Runde 2026-09-12g.
   SRD: Schaden trifft erst HP, Überschuss trifft STR, dann STR-Save gegen Tod; DEX/WIL-Schaden aus speziellen Quellen. `applyDamage` (`rules/gmActions.js`) macht HP→STR→automatischer Save→Verletzt+Kampfunfähig bei Fehlschlag→`dead`-Flag bei STR 0 komplett selbst. Nicht automatisiert (bewusst): der 6-Zug-Totzähler für unversorgt Kampfunfähige — der Tod selbst bleibt eine von SL/Gruppe bestätigte Entscheidung, nichts wird automatisch gelöscht oder gesperrt. DEX/WIL-Schaden aus Spezialquellen bleibt manuell wie bisher (kein generischer Trigger dafür in der SRD).

4. **Attribut-Erzeugung im Wizard: 3W6 der Reihe nach** (geklärt — Point-Buy passt nicht zu Mausritters OSR-Design). Der Wizard würfelt sichtbar STR, DEX, WIL (je 3W6), dann HP (1W6) und Pips; „neu würfeln" als Ganzes ist erlaubt, einzelne Werte nicht frei schiebbar. Save = **W20 ≤ Attribut-Current**.

5. **Zauber** als Items mit Usage-Dots (3), die sich bei „Miscast" füllen — SRD-konform über die generische `usage`-Mechanik.

6. **Hintergrund-Tabelle:** ✔ erledigt — vollständige 36er-Tabelle aus dem SRD 2.3.1 in `data/backgrounds.js`,
   indiziert als `TABLE[TP-Wurf][Pips-Wurf]`. Attribute = 3W6, zwei höchste behalten (Wert 2–12), danach ein Tausch.
   Startausrüstung: Fackeln + Rationen + 2 Hintergrund-Items + Waffe; schwache Maus (höchstes Attribut ≤9 / ≤7)
   bekommt Extra-Items. XP-Schwellen 0/1000/3000/6000/+5000, Grit nach Stufe.

7. **Rüstungs-Platzmodell vereinfacht** (bewusste Abweichung, 2026-09-12). SRD: Leichte Rüstung belegt
   „Nebenpfote + ein Körperplatz" (ein echtes Pfote+Körper-Paar), Schwere Rüstung „zwei Körperplätze".
   Das Platzmodell hier (`SLOT_PAIR_FIRST`/`SLOT_PAIR_SECOND` in `rules/character.js`) ist rein
   slot-basiert und kennt nur Paare *derselben* Art (zwei Pfoten, zwei Körper, zwei Rucksack) — für
   jeden 2-Platz-Gegenstand im Spiel, nicht nur Rüstung. Ein echtes Pfote+Körper-Paar bräuchte ein
   item-abhängiges Modell (jeder Slot müsste wissen, WAS gerade draufgezogen wird) und würde
   `cellsFor`/`anchorFor`/`firstFreeFit`/`tryMove` in `rules/inventory.js` anfassen — den Kern von
   Drag & Drop, schon mehrfach die fummeligste Ecke der App. Für den MVP bewusst nicht angetastet;
   `data/items.js` beschreibt bei beiden Rüstungen jetzt ehrlich, was die App tatsächlich zulässt
   (irgendein gleichartiges Paar), statt eine Kombination zu versprechen, die sich nicht draufziehen
   lässt. Ein echtes Pfote+Körper-Paar bleibt ein möglicher, aber größerer Post-MVP-Umbau.

---

## 12. Meilensteine

### M0 — Gerüst (½–1 Tag)
- Vite+React+oxlint Projekt, `.claude/launch.json`, `vite.config.js` mit singlefile.
- `blankCharacter()`, `localStorage`-Autosave, leeres `App.jsx` mit Player/GM-Umschaltung.
- `i18n/` mit `t()` + `useLang()`, `de.json`/`en.json`-Stubs, Sprachumschalter in der Kopfzeile.
- LICENSE (MIT), README-Stub, Footer mit den Pflicht-Disclaimern (§13) — beide Sprachen.

### M1 — Charakterbogen solo (2–3 Tage)
- `AttributeBox`, `HpPipsBar` (Pips + XP getrennt), Kopfdaten, Notizen.
- `InventoryGrid` mit statischem Raster, `ItemCard`, Usage-Dots.
- `DiceRoller`: W6, W66, Save-Wurf (`d20 <= attr`), Ergebnis-Panel + lokales Log.
- `data/items.js` (zweisprachig), `data/backgrounds.js`, `data/conditions.js`.

### M2 — Drag & Drop (1–2 Tage)
- `@dnd-kit` DndContext, Slots als Droppables, `rules/inventory.js#tryMove` (axis, size 2, swap).
- Touch-Sensoren, visuelles Feedback.

### M3 — Charaktererschaffung (1–2 Tage)
- `CharacterWizard`: Attribute 3W6 der Reihe nach, HP 1W6, Pips, Hintergrund aus der SRD-Tabelle (→ Start-Items + Pips), Name/Fellmuster/Geburtszeichen aus `data/tables.js` (beide Sprachen).
- „Beispiel-Maus laden" zum schnellen Ausprobieren.
- SRD-Indexierung der Hintergrund-Tabelle hier verifizieren (§11.6).

### M4 — Multiplayer-Kern (2–3 Tage)
- `useMultiplayer.js` von `coc-tool` adaptieren: Host/Join/Reconnect/sessionStorage/`?join`.
- `MultiplayerModal`, `ConnectionBadge`.
- Spieler `state`-Push (debounced ~300 ms), GM sammelt `players`.
- `GmDashboard` + `GmPlayerCard` (read-only Anzeige), Live-Log.

### M5 — Shared Stash + Transfer (2 Tage)
- `SharedStash`-Komponente in dieselbe DndContext.
- Protokoll `stash/*`, Request/Confirm-Flow (§8), optimistische Updates + Timeouts.
- GM: Loot anlegen/entfernen.

### M6 — GM-Aktionen + Politur (2–3 Tage)
- `gmCommand`: Schaden/Heilen/Pips/Save/Give/Whisper/Broadcast + Empfangs-Handler beim Spieler (Toast, Save-Wurf vorausgewählt).
- Geheime SL-Notizen, GM-Session Export/Import.
- `beforeunload`-Schutz, Fehlerdiagnose bei gescheiterter Verbindung (ICE-Auswertung wie `demonslayer`).
- Übersetzungen `de.json`/`en.json` vollständig durchziehen, `data/*` beide Sprachen füllen, README mit Screenshots (DE + EN).

**Post-MVP:** ~~Party-Übersicht für Spieler~~ ✔, ~~Discord-Webhook~~ ✔, ~~mehrere Charaktere pro Browser~~ ✔, ~~automatische Schadenskette~~ ✔ (Runde 2026-09-12g), ~~Würfel-„3D"~~ ✔ (Runde 2026-09-12h) — offen bleiben ein Karten-/Battlemap-Modul (`battlemap.js` aus `demonslayer` ist bewusst systemunabhängig) und eine Verbindung über echte DB (Supabase) hinter dem `useMultiplayer`-Interface.

---

## 13. Lizenz & Pflichttexte

**Code:** MIT (`LICENSE`).

**Footer / Impressum der App — wörtlich einzubauen (englisch, unabhängig von der UI-Sprache):**

> *Pips & Paws is an independent production by DonDavis and is not affiliated with Losing Games.*
>
> *This work is based on Mausritter, a product of Losing Games and Isaac Williams, and is licensed for use under the Creative Commons Attribution 4.0 International (CC BY 4.0) licence.*

- Tool-Namen final festlegen (Arbeitstitel: **Pips & Paws** — greift die zwei Kernmechaniken auf: Pips als Währung, Paws als Inventar-Slots; funktioniert in DE und EN, braucht „Mausritter" nicht im Namen).
- **Keine** offiziellen Logos (Mausritter, Losing Games, Games Omnivorous).
- **Keine** Original-Artworks/Illustrationen — nur eigene Icons / `lucide-react` / frei lizenzierte Assets.
- „Compatible with Mausritter"-Logo darf verwendet werden (von mausritter.com/third-party), muss aber nicht.
- Wirkungstexte in `data/*` **zusammenfassen, nicht wörtlich kopieren** (gleiche Praxis wie in den Referenzprojekten).

---

## 14. Testansatz

Wie in den Referenzprojekten: **kein Test-Framework im MVP.** Verifikation =
- `npm run dev`, im Browser öffnen, Konsole auf Fehler prüfen, die geänderte Funktion tatsächlich anklicken.
- Multiplayer: zwei Browserfenster (eins GM, eins Spieler), bei Bedarf ein drittes.
- `npm run lint` (oxlint) muss sauber sein.
- Reine Funktionen in `rules/` (`tryMove`, `save`, HP-Ableitung) sind so geschnitten, dass später Vitest-Unit-Tests ohne Umbau andocken können — falls gewünscht, ist ein kleines `rules/*.test.js`-Set der erste sinnvolle Testschritt.

---

## 15. Entscheidungen

**Geklärt (2026-08-28):**
1. `pips` und `xp` getrennt führen. ✔
2. Keine `str`-Sperre für Pack-Slots — strikt nach SRD. ✔
3. Attribut-Erzeugung: 3W6 der Reihe nach. ✔
4. Arbeitstitel **Pips & Paws** — später änderbar. ✔
5. Zweisprachig DE + EN von Anfang an. ✔

**Noch offen (spätestens vor M4 / Deploy):**
6. Repo-Ziel: eigenes GitHub-Repo unter welchem Owner? Bestimmt die `?join`-Basis-URL und das GitHub-Pages-Ziel.
7. ~~Deutsche Item-/Zauber-Namen: an die offizielle System-Matters-Übersetzung anlehnen~~ ✔ erledigt, siehe Runde 2026-09-12f.
