// Portiert aus DonDavis-vibe/Dungeonslayers-pnp-tools (battlemap.js, MIT) — unveraendert bis auf den Export.
// ============================================================================
// BattleMap — wiederverwendbares Karten-Modul für Pen-&-Paper-Tools
// ============================================================================
//
// Bewusst OHNE Kenntnis irgendeines Regelsystems: Das Modul zeichnet eine Karte
// mit Raster und Figuren, verwaltet Zoom und Verschiebung und meldet jede
// Änderung über einen Rückruf. Wie die Änderungen übertragen werden (WebRTC,
// WebSocket, gar nicht) entscheidet die einbettende Anwendung.
//
// Verwendung:
//     const map = BattleMap.create(canvasElement, {
//         onChange: zustand => verbindung.send(zustand),   // optional
//         einheit: 1, einheitName: 'm'                     // 1 Feld = 1 Meter
//     });
//     map.setBild(dataUrl);
//     map.addFigur({ id: 'p1', name: 'Thorin', farbe: '#1b1714', x: 3, y: 4 });
//     map.applyState(vomNetzwerkEmpfangenerZustand);
//
// Koordinaten sind IMMER Rasterfelder (Fließkomma), nie Pixel. Damit bleibt der
// Zustand unabhängig von Bildschirmgröße und Zoomstufe.
// ============================================================================

export const BattleMap = (() => {

    const STANDARD = {
        rasterGroesse: 50,      // Pixel je Feld auf dem Originalbild
        rasterVersatzX: 0,
        rasterVersatzY: 0,
        rasterSichtbar: true,
        rasterFarbe: 'rgba(212,162,76,0.30)',  // Rasterlinien — vom SL umstellbar
        einheit: 1,             // wie viele Einheiten ein Feld entspricht
        einheitName: 'm',
        einrasten: true
    };

    const FIGUR_RADIUS = 0.42;  // in Feldern

    // Liegt ein Feld in einem Nebel-/Aufgedeckt-Bereich? Rein rechnerisch, ohne
    // Zustand — daher auf Modulebene, damit auch `fuerSpieler` sie nutzen kann.
    function bereichEnthaelt(bereich, fx, fy) {
        if (bereich.art === 'kreis') {
            return Math.hypot(fx - bereich.x, fy - bereich.y) <= bereich.r;
        }
        return fx >= bereich.x && fx <= bereich.x + bereich.b &&
               fy >= bereich.y && fy <= bereich.y + bereich.h;
    }

    // Einen gespeicherten Kartenzustand für die Spieler aufbereiten, OHNE ihn in
    // eine Leinwand zu laden — nötig für Karten, die der Spielleiter gerade nicht
    // offen hat. Gleiche Regeln wie die Instanzmethode `getStateFuerSpieler`:
    // verdeckte Figuren fallen weg, Gegner im unaufgedeckten Nebel ebenso, und
    // noch nicht freigegebene Nebelbereiche werden nicht mitgeschickt.
    function fuerSpieler(zustand) {
        const z = JSON.parse(JSON.stringify(zustand || {}));
        if (!z.nebel) z.nebel = { aktiv: false, aufgedeckt: [], entwurf: [] };
        z.nebel.entwurf = [];
        const nebelAktiv = !!z.nebel.aktiv;
        const aufgedeckt = z.nebel.aufgedeckt || [];
        const imNebel = (fx, fy) => nebelAktiv && !aufgedeckt.some(b => bereichEnthaelt(b, fx, fy));
        z.figuren = (z.figuren || []).filter(f => {
            if (f.verdeckt) return false;
            if (f.besitzer !== 'sl') return true;
            return !imNebel(f.x, f.y);
        });
        return z;
    }

    function create(canvas, optionen = {}) {
        const ctx = canvas.getContext('2d');

        const zustand = {
            bild: null,                 // Data-URL
            raster: Object.assign({}, STANDARD, optionen),
            figuren: [],                // {id, name, farbe, x, y, groesse, besitzer, verdeckt}
            formen: [],                 // {id, art, punkte:[{x,y}], farbe, radius}
            // Nebel des Krieges: Ist er aktiv, liegt die ganze Karte unter einer
            // Decke. `aufgedeckt` sind die freigegebenen Bereiche, die auch die
            // Spieler sehen; `entwurf` sind vorbereitete Bereiche, die erst nach
            // dem Freigeben durch den Spielleiter sichtbar werden.
            // Bereiche: {art:'rechteck', x, y, b, h} oder {art:'kreis', x, y, r}
            nebel: { aktiv: false, aufgedeckt: [], entwurf: [] }
        };

        // 'zeigen' | 'messen' | 'malen' | 'radieren' | 'nebel-auf' | 'nebel-zu'
        let werkzeug = 'zeigen';
        let malArt = 'freihand';     // 'freihand' | 'linie' | 'kreis' | 'rechteck'
        let nebelForm = 'rechteck';  // Form fürs Auf- und Zudecken
        let malFarbe = '#a3342b';

        // Die Leinwand nimmt ihre Farben aus dem Stylesheet (--karte-*), damit
        // sie den Papier- bzw. Nachtmodus mitmacht. Faellt eine Variable aus,
        // bleiben die Papierwerte stehen — das Modul funktioniert also auch
        // ohne die Anwendung drumherum.
        const FARB_ERSATZ = {
            blatt: '#f3eee2', tinte: '#1b1714', stempel: '#a3342b', mess: '#3f6b2e',
            raster: 'rgba(27,23,20,0.18)', schleier: 'rgba(27,23,20,0.10)',
            beschriftung: 'rgba(243,238,226,0.92)', umriss: 'rgba(27,23,20,0.7)',
            nebelVoll: '#b7afa0', nebelHalb: 'rgba(150,142,128,0.66)'
        };
        const farbe = Object.assign({}, FARB_ERSATZ);
        function farbenLesen() {
            try {
                const stil = getComputedStyle(document.documentElement);
                Object.keys(FARB_ERSATZ).forEach(k => {
                    const v = stil.getPropertyValue('--karte-' + k).trim();
                    farbe[k] = v || FARB_ERSATZ[k];
                });
            } catch (e) { /* Ersatzwerte behalten */ }
        }
        farbenLesen();
        let entwurf = null;          // Form, die gerade gezogen wird

        const ansicht = { zoom: 1, x: 0, y: 0 };   // Verschiebung in Bildschirmpixeln
        let bildObjekt = null;
        let messModus = false;                     // fürs Bedienen ohne Tastatur
        // Muss eine Bewegung erst bestätigt werden? Dann landet sie zunächst als
        // Vorschlag in figur.geplantX/geplantY, statt die Figur direkt zu setzen.
        let bestaetigungNoetig = !!optionen.bestaetigungNoetig;
        // Spieler sehen den Nebel deckend, der Spielleiter halbdurchsichtig
        let nebelDeckend = !!optionen.nebelDeckend;
        const onZugVorschlag = optionen.onZugVorschlag || (() => {});
        // Figurenbilder liegen bewusst NEBEN dem Zustand: Sie ändern sich selten,
        // während der Zustand bei jeder Bewegung übertragen wird.
        const figurBilder = {};    // id -> Image
        const figurBildQuellen = {};
        let messung = null;                        // {vonX, vonY, zuX, zuY}
        let ziehen = null;
        let nurEigene = null;                      // Besitzer-Kennung für Spieler
        const onChange = optionen.onChange || (() => {});
        const onLokaleFigur = optionen.onLokaleFigur || (() => {});

        // --- Umrechnungen ---------------------------------------------------

        function feldZuBildschirm(fx, fy) {
            const r = zustand.raster;
            return {
                x: (fx * r.rasterGroesse + r.rasterVersatzX) * ansicht.zoom + ansicht.x,
                y: (fy * r.rasterGroesse + r.rasterVersatzY) * ansicht.zoom + ansicht.y
            };
        }

        function bildschirmZuFeld(px, py) {
            const r = zustand.raster;
            return {
                x: ((px - ansicht.x) / ansicht.zoom - r.rasterVersatzX) / r.rasterGroesse,
                y: ((py - ansicht.y) / ansicht.zoom - r.rasterVersatzY) / r.rasterGroesse
            };
        }

        function zeigerPosition(ereignis) {
            const rechteck = canvas.getBoundingClientRect();
            return { x: ereignis.clientX - rechteck.left, y: ereignis.clientY - rechteck.top };
        }

        function figurAn(px, py) {
            const feld = bildschirmZuFeld(px, py);
            // Von hinten suchen, damit die oberste Figur zuerst greift
            for (let i = zustand.figuren.length - 1; i >= 0; i--) {
                const f = zustand.figuren[i];
                const radius = FIGUR_RADIUS * (f.groesse || 1);
                const dx = feld.x - f.x, dy = feld.y - f.y;
                if (dx * dx + dy * dy <= radius * radius) return f;
            }
            return null;
        }

        function darfBewegen(figur) {
            if (!nurEigene) return true;               // Spielleiter darf alles
            return figur.besitzer === nurEigene;
        }

        // --- Zeichnen -------------------------------------------------------

        function anpassenAnGroesse() {
            const dpr = window.devicePixelRatio || 1;
            const breite = canvas.clientWidth, hoehe = canvas.clientHeight;
            if (canvas.width !== breite * dpr || canvas.height !== hoehe * dpr) {
                canvas.width = breite * dpr;
                canvas.height = hoehe * dpr;
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function zeichnen() {
            farbenLesen();
            anpassenAnGroesse();
            const breite = canvas.clientWidth, hoehe = canvas.clientHeight;

            ctx.clearRect(0, 0, breite, hoehe);
            ctx.fillStyle = farbe.blatt;
            ctx.fillRect(0, 0, breite, hoehe);

            // Hintergrundbild
            if (bildObjekt) {
                ctx.save();
                ctx.translate(ansicht.x, ansicht.y);
                ctx.scale(ansicht.zoom, ansicht.zoom);
                ctx.drawImage(bildObjekt, 0, 0);
                ctx.restore();
            } else {
                ctx.fillStyle = farbe.schleier;
                ctx.font = '14px "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Noch keine Karte geladen', breite / 2, hoehe / 2);
                ctx.textAlign = 'left';
            }

            if (zustand.raster.rasterSichtbar) zeichneRaster(breite, hoehe);
            zustand.formen.forEach(zeichneForm);
            if (entwurf) zeichneForm(entwurf, true);
            zeichneNebel(breite, hoehe);
            zustand.figuren.forEach(zeichneGeplantenZug);
            zustand.figuren.forEach(zeichneFigur);
            if (messung) zeichneMessung();
        }

        // --- Markierungen ---------------------------------------------------

        function zeichneForm(form, istEntwurf) {
            const p = form.punkte || [];
            if (!p.length) return;
            const r = zustand.raster;

            ctx.save();
            ctx.strokeStyle = form.farbe || malFarbe;
            ctx.fillStyle = (form.farbe || malFarbe) + '33';
            ctx.lineWidth = Math.max(1.5, 3 * ansicht.zoom);
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            if (istEntwurf) ctx.setLineDash([5, 4]);

            const s = (punkt) => feldZuBildschirm(punkt.x, punkt.y);

            if (form.art === 'kreis' && p.length >= 2) {
                const mitte = s(p[0]);
                const felder = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y);
                const radius = felder * r.rasterGroesse * ansicht.zoom;
                ctx.beginPath();
                ctx.arc(mitte.x, mitte.y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                beschrifte(mitte.x, mitte.y - radius - 12,
                    `Radius ${felder.toFixed(1).replace('.', ',')} Felder · ${(felder * r.einheit).toFixed(1).replace('.', ',')}${r.einheitName}`,
                    form.farbe || malFarbe);
            } else if (form.art === 'rechteck' && p.length >= 2) {
                const a = s(p[0]), b = s(p[1]);
                ctx.beginPath();
                ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y);
                ctx.fill();
                ctx.stroke();
                const bf = Math.abs(p[1].x - p[0].x), hf = Math.abs(p[1].y - p[0].y);
                beschrifte((a.x + b.x) / 2, Math.min(a.y, b.y) - 12,
                    `${bf.toFixed(1).replace('.', ',')} × ${hf.toFixed(1).replace('.', ',')} Felder`,
                    form.farbe || malFarbe);
            } else {
                ctx.beginPath();
                p.forEach((punkt, i) => {
                    const b = s(punkt);
                    if (i === 0) ctx.moveTo(b.x, b.y); else ctx.lineTo(b.x, b.y);
                });
                ctx.stroke();
                if (form.art === 'linie' && p.length >= 2) {
                    const felder = entfernungInFeldern(p[0].x, p[0].y, p[1].x, p[1].y);
                    const m = s({ x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 });
                    beschrifte(m.x, m.y - 12, `${felder} Felder · ${(felder * r.einheit).toLocaleString('de-DE')}${r.einheitName}`,
                        form.farbe || malFarbe);
                }
            }
            ctx.restore();
        }

        function beschrifte(x, y, text, farbe) {
            ctx.save();
            ctx.setLineDash([]);
            ctx.font = 'bold 12px "Segoe UI", sans-serif';
            const b = ctx.measureText(text).width;
            ctx.fillStyle = farbe.beschriftung;
            ctx.fillRect(x - b / 2 - 5, y - 9, b + 10, 18);
            ctx.fillStyle = farbe;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x, y);
            ctx.restore();
        }

        // --- Nebel des Krieges ----------------------------------------------

        // Beim Spielleiter halbdurchsichtig (er soll die Karte sehen), bei den
        // Spielern deckend. Die Unterscheidung macht `nebelDeckend`.
        //
        // Der Nebel entsteht auf einer eigenen Ebene, aus der die aufgedeckten
        // Bereiche per 'destination-out' herausgestanzt werden. Mit der
        // Even-Odd-Regel würden sich überlappende Bereiche gegenseitig aufheben
        // und wieder zugedeckt erscheinen.
        let nebelEbene = null;

        function bereichPfad(zielCtx, bereich) {
            if (bereich.art === 'kreis') {
                const m = feldZuBildschirm(bereich.x, bereich.y);
                const radius = bereich.r * zustand.raster.rasterGroesse * ansicht.zoom;
                zielCtx.moveTo(m.x + radius, m.y);
                zielCtx.arc(m.x, m.y, radius, 0, Math.PI * 2);
            } else {
                const a = feldZuBildschirm(bereich.x, bereich.y);
                const b = feldZuBildschirm(bereich.x + bereich.b, bereich.y + bereich.h);
                zielCtx.rect(a.x, a.y, b.x - a.x, b.y - a.y);
            }
        }

        function zeichneNebel(breite, hoehe) {
            if (!zustand.nebel.aktiv) return;

            if (!nebelEbene) nebelEbene = document.createElement('canvas');
            const dpr = window.devicePixelRatio || 1;
            if (nebelEbene.width !== breite * dpr || nebelEbene.height !== hoehe * dpr) {
                nebelEbene.width = breite * dpr;
                nebelEbene.height = hoehe * dpr;
            }
            const nctx = nebelEbene.getContext('2d');
            nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            nctx.clearRect(0, 0, breite, hoehe);

            nctx.fillStyle = nebelDeckend ? farbe.nebelVoll : farbe.nebelHalb;
            nctx.fillRect(0, 0, breite, hoehe);

            // Freigegebene Bereiche ausstanzen. Beim Spielleiter zusätzlich die
            // vorbereiteten, damit er sieht, was er gerade aufdecken würde.
            const auszustanzen = nebelDeckend
                ? zustand.nebel.aufgedeckt
                : zustand.nebel.aufgedeckt.concat(zustand.nebel.entwurf || []);

            nctx.globalCompositeOperation = 'destination-out';
            auszustanzen.forEach(bereich => {
                nctx.beginPath();
                bereichPfad(nctx, bereich);
                nctx.fill();
            });
            nctx.globalCompositeOperation = 'source-over';

            ctx.drawImage(nebelEbene, 0, 0, breite, hoehe);

            // Vorbereitete Bereiche beim Spielleiter umranden — sie sind noch
            // nicht freigegeben und für die Spieler unsichtbar.
            if (!nebelDeckend && (zustand.nebel.entwurf || []).length) {
                ctx.save();
                ctx.strokeStyle = farbe.mess;
                ctx.lineWidth = 2;
                ctx.setLineDash([7, 5]);
                zustand.nebel.entwurf.forEach(bereich => {
                    ctx.beginPath();
                    bereichPfad(ctx, bereich);
                    ctx.stroke();
                });
                ctx.restore();
            }
        }

        // Vorgeschlagene, noch nicht bestätigte Bewegung: Schemen am Zielfeld,
        // gestrichelte Linie und die Entfernung in Feldern.
        function zeichneGeplantenZug(f) {
            if (f.geplantX === undefined || f.geplantX === null) return;
            const von = feldZuBildschirm(f.x, f.y);
            const zu = feldZuBildschirm(f.geplantX, f.geplantY);
            const radius = FIGUR_RADIUS * (f.groesse || 1) * zustand.raster.rasterGroesse * ansicht.zoom;
            const felder = entfernungInFeldern(f.x, f.y, f.geplantX, f.geplantY);
            const r = zustand.raster;

            ctx.save();
            ctx.strokeStyle = f.farbe || farbe.tinte;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(von.x, von.y);
            ctx.lineTo(zu.x, zu.y);
            ctx.stroke();

            ctx.globalAlpha = 0.45;
            ctx.beginPath();
            ctx.arc(zu.x, zu.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = f.farbe || farbe.tinte;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(zu.x, zu.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            if (radius > 6) {
                const text = `${felder} Feld${felder === 1 ? '' : 'er'} · ${(felder * r.einheit).toLocaleString('de-DE')}${r.einheitName}`;
                ctx.font = 'bold 12px "Segoe UI", sans-serif';
                const tb = ctx.measureText(text).width;
                ctx.fillStyle = farbe.beschriftung;
                ctx.fillRect(zu.x - tb / 2 - 5, zu.y - radius - 22, tb + 10, 18);
                ctx.fillStyle = f.farbe || farbe.tinte;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, zu.x, zu.y - radius - 13);
            }
            ctx.restore();
        }

        function zeichneRaster(breite, hoehe) {
            const r = zustand.raster;
            const schritt = r.rasterGroesse * ansicht.zoom;
            if (schritt < 6) return;   // zu fein, würde nur flimmern

            ctx.save();
            ctx.strokeStyle = r.rasterFarbe || farbe.raster;
            ctx.lineWidth = 1;
            ctx.beginPath();

            const startX = (r.rasterVersatzX * ansicht.zoom + ansicht.x) % schritt;
            const startY = (r.rasterVersatzY * ansicht.zoom + ansicht.y) % schritt;
            for (let x = startX; x < breite; x += schritt) {
                ctx.moveTo(Math.round(x) + 0.5, 0);
                ctx.lineTo(Math.round(x) + 0.5, hoehe);
            }
            for (let y = startY; y < hoehe; y += schritt) {
                ctx.moveTo(0, Math.round(y) + 0.5);
                ctx.lineTo(breite, Math.round(y) + 0.5);
            }
            ctx.stroke();
            ctx.restore();
        }

        function zeichneFigur(f) {
            const mitte = feldZuBildschirm(f.x, f.y);
            const radius = FIGUR_RADIUS * (f.groesse || 1) * zustand.raster.rasterGroesse * ansicht.zoom;
            if (radius < 2) return;

            ctx.save();
            if (f.verdeckt) ctx.globalAlpha = 0.45;

            const portrait = figurBilder[f.id];

            if (portrait && portrait.complete && portrait.naturalWidth) {
                // Porträt kreisrund einpassen, ohne es zu verzerren
                ctx.save();
                ctx.beginPath();
                ctx.arc(mitte.x, mitte.y, radius, 0, Math.PI * 2);
                ctx.clip();
                const seite = radius * 2;
                const skala = Math.max(seite / portrait.naturalWidth, seite / portrait.naturalHeight);
                const bw = portrait.naturalWidth * skala, bh = portrait.naturalHeight * skala;
                ctx.drawImage(portrait, mitte.x - bw / 2, mitte.y - bh / 2, bw, bh);
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(mitte.x, mitte.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = f.farbe || farbe.tinte;
                ctx.fill();

                const kuerzel = (f.name || '?').trim().slice(0, 2).toUpperCase();
                ctx.fillStyle = farbe.blatt;
                ctx.font = `bold ${Math.max(8, radius * 0.85)}px "Segoe UI", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(kuerzel, mitte.x, mitte.y);
            }

            // Farbiger Ring — bei Porträts die einzige Zuordnungshilfe
            ctx.beginPath();
            ctx.arc(mitte.x, mitte.y, radius, 0, Math.PI * 2);
            ctx.lineWidth = Math.max(1.5, radius * (portrait ? 0.16 : 0.12));
            ctx.strokeStyle = portrait ? (f.farbe || farbe.tinte) : farbe.umriss;
            ctx.stroke();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Name darunter, sobald genug Platz ist
            if (radius > 12) {
                const schrift = Math.max(9, radius * 0.5);
                ctx.font = `${schrift}px "Segoe UI", sans-serif`;
                const text = f.name || '';
                const breite = ctx.measureText(text).width;
                ctx.fillStyle = farbe.beschriftung;
                ctx.fillRect(mitte.x - breite / 2 - 3, mitte.y + radius + 2, breite + 6, schrift + 4);
                ctx.fillStyle = farbe.tinte;
                ctx.textBaseline = 'top';
                ctx.fillText(text, mitte.x, mitte.y + radius + 4);
            }
            ctx.restore();
        }

        function zeichneMessung() {
            const von = feldZuBildschirm(messung.vonX, messung.vonY);
            const zu = feldZuBildschirm(messung.zuX, messung.zuY);
            const felder = entfernungInFeldern(messung.vonX, messung.vonY, messung.zuX, messung.zuY);
            const r = zustand.raster;

            ctx.save();
            ctx.strokeStyle = farbe.stempel;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(von.x, von.y);
            ctx.lineTo(zu.x, zu.y);
            ctx.stroke();
            ctx.setLineDash([]);

            const text = `${felder} Felder · ${(felder * r.einheit).toLocaleString('de-DE')}${r.einheitName}`;
            ctx.font = 'bold 13px "Segoe UI", sans-serif';
            const tb = ctx.measureText(text).width;
            const mx = (von.x + zu.x) / 2, my = (von.y + zu.y) / 2;
            ctx.fillStyle = farbe.beschriftung;
            ctx.fillRect(mx - tb / 2 - 6, my - 22, tb + 12, 20);
            ctx.strokeStyle = farbe.tinte;
            ctx.lineWidth = 1;
            ctx.strokeRect(mx - tb / 2 - 6, my - 22, tb + 12, 20);
            ctx.fillStyle = farbe.stempel;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, mx, my - 12);
            ctx.restore();
        }

        // Entfernung nach der üblichen Tischregel: diagonale Schritte zählen wie
        // gerade, also der größere der beiden Achsabstände.
        function entfernungInFeldern(x1, y1, x2, y2) {
            return Math.max(Math.abs(Math.round(x2) - Math.round(x1)), Math.abs(Math.round(y2) - Math.round(y1)));
        }

        // --- Eingaben -------------------------------------------------------

        canvas.addEventListener('pointerdown', ereignis => {
            const pos = zeigerPosition(ereignis);
            try { canvas.setPointerCapture(ereignis.pointerId); } catch (e) { /* Zeiger schon weg */ }

            const feldJetzt = bildschirmZuFeld(pos.x, pos.y);

            // Mittlere Maustaste schiebt die Karte, egal welches Werkzeug aktiv ist
            // — so kommt man auch mitten im Messen oder Zeichnen weiter.
            if (ereignis.button === 1) {
                ereignis.preventDefault();
                ziehen = { art: 'karte', vonX: pos.x - ansicht.x, vonY: pos.y - ansicht.y };
                canvas.style.cursor = 'grabbing';
                return;
            }

            // Messen: über das Werkzeug, die Umschalttaste oder die rechte Maustaste
            if (werkzeug === 'messen' || messModus || ereignis.shiftKey || ereignis.button === 2) {
                messung = { vonX: feldJetzt.x, vonY: feldJetzt.y, zuX: feldJetzt.x, zuY: feldJetzt.y };
                ziehen = { art: 'messen' };
                zeichnen();
                return;
            }

            if (werkzeug === 'malen') {
                entwurf = {
                    id: 'form-' + Date.now(), art: malArt, farbe: malFarbe,
                    punkte: [{ x: feldJetzt.x, y: feldJetzt.y }, { x: feldJetzt.x, y: feldJetzt.y }]
                };
                ziehen = { art: 'malen' };
                zeichnen();
                return;
            }

            if (werkzeug === 'radieren') {
                formLoeschenAn(feldJetzt.x, feldJetzt.y);
                return;
            }

            if (werkzeug === 'nebel-auf' || werkzeug === 'nebel-zu') {
                ziehen = { art: werkzeug, vonX: feldJetzt.x, vonY: feldJetzt.y };
                entwurf = {
                    id: 'nebelentwurf', art: nebelForm,
                    farbe: werkzeug === 'nebel-auf' ? '#6fa84a' : '#8c2b22',
                    punkte: [{ x: feldJetzt.x, y: feldJetzt.y }, { x: feldJetzt.x, y: feldJetzt.y }]
                };
                zeichnen();
                return;
            }

            const figur = figurAn(pos.x, pos.y);
            if (figur && darfBewegen(figur)) {
                const feld = bildschirmZuFeld(pos.x, pos.y);
                ziehen = {
                    art: 'figur', figur,
                    versatzX: figur.x - feld.x, versatzY: figur.y - feld.y,
                    // Startpunkt merken, um bei Bestätigungspflicht zurücksetzen zu können
                    startX: figur.x, startY: figur.y
                };
            } else {
                ziehen = { art: 'karte', vonX: pos.x - ansicht.x, vonY: pos.y - ansicht.y };
            }
        });

        canvas.addEventListener('pointermove', ereignis => {
            if (!ziehen) return;
            const pos = zeigerPosition(ereignis);

            if (ziehen.art === 'karte') {
                ansicht.x = pos.x - ziehen.vonX;
                ansicht.y = pos.y - ziehen.vonY;
            } else if (ziehen.art === 'figur') {
                const feld = bildschirmZuFeld(pos.x, pos.y);
                ziehen.figur.x = feld.x + ziehen.versatzX;
                ziehen.figur.y = feld.y + ziehen.versatzY;
            } else if (ziehen.art === 'messen') {
                const feld = bildschirmZuFeld(pos.x, pos.y);
                messung.zuX = feld.x;
                messung.zuY = feld.y;
            } else if (ziehen.art === 'malen' && entwurf) {
                const feld = bildschirmZuFeld(pos.x, pos.y);
                if (entwurf.art === 'freihand') entwurf.punkte.push({ x: feld.x, y: feld.y });
                else entwurf.punkte[1] = { x: feld.x, y: feld.y };
            } else if ((ziehen.art === 'nebel-auf' || ziehen.art === 'nebel-zu') && entwurf) {
                const feld = bildschirmZuFeld(pos.x, pos.y);
                entwurf.punkte[1] = { x: feld.x, y: feld.y };
            }
            zeichnen();
        });

        function ziehenBeenden() {
            if (!ziehen) return;
            if (ziehen.art === 'figur') {
                const f = ziehen.figur;
                let zielX = f.x, zielY = f.y;
                if (zustand.raster.einrasten) {
                    zielX = Math.round(zielX * 2) / 2;   // halbe Felder erlaubt
                    zielY = Math.round(zielY * 2) / 2;
                }

                if (bestaetigungNoetig) {
                    // Figur bleibt stehen; der Zug wird nur vorgeschlagen
                    f.x = ziehen.startX;
                    f.y = ziehen.startY;
                    if (zielX === f.x && zielY === f.y) {
                        f.geplantX = null; f.geplantY = null;
                    } else {
                        f.geplantX = zielX; f.geplantY = zielY;
                        onZugVorschlag(f, entfernungInFeldern(f.x, f.y, zielX, zielY));
                    }
                } else {
                    f.x = zielX; f.y = zielY;
                    onLokaleFigur(f);
                    melden();
                }
            } else if (ziehen.art === 'messen') {
                messung = null;
            } else if (ziehen.art === 'malen' && entwurf) {
                // Winzige Kritzler sind meist Fehlklicks
                const p = entwurf.punkte;
                const gross = entwurf.art === 'freihand'
                    ? p.length > 2
                    : Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) > 0.25;
                if (gross) { verlaufSichern(); zustand.formen.push(entwurf); }
                entwurf = null;
                melden();
            } else if ((ziehen.art === 'nebel-auf' || ziehen.art === 'nebel-zu') && entwurf) {
                const bereich = bereichAusEntwurf(entwurf);
                if (bereich) {
                    verlaufSichern();
                    if (ziehen.art === 'nebel-auf') {
                        // Erst vormerken — freigegeben wird auf Knopfdruck
                        zustand.nebel.aktiv = true;
                        zustand.nebel.entwurf.push(bereich);
                    } else {
                        nebelZudecken(bereich);
                    }
                }
                entwurf = null;
                melden();
            }
            ziehen = null;
            werkzeugCursorSetzen();   // nach Mittelmaus-Schieben wieder das Werkzeug
            zeichnen();
        }

        // Aus zwei gezogenen Punkten einen Bereich machen — je nach gewählter Form
        function bereichAusEntwurf(e) {
            const [a, b] = e.punkte;
            if (e.art === 'kreis') {
                const r = Math.hypot(b.x - a.x, b.y - a.y);
                return r > 0.2 ? { art: 'kreis', x: a.x, y: a.y, r } : null;
            }
            const bereich = {
                art: 'rechteck',
                x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
                b: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y)
            };
            return (bereich.b > 0.2 && bereich.h > 0.2) ? bereich : null;
        }

        // Einen Bereich wieder zudecken. Bereiche, deren Mittelpunkt im Schnitt
        // liegt, fallen ganz weg; Rechtecke werden zusätzlich am Schnitt zerlegt,
        // damit ein Teil-Zudecken möglich bleibt.
        function nebelZudecken(schnitt) {
            const zerlegen = (f) => {
                if (f.art === 'kreis' || schnitt.art === 'kreis') {
                    // Kreise werden nicht zerschnitten — entweder ganz weg oder ganz da
                    const mx = f.art === 'kreis' ? f.x : f.x + f.b / 2;
                    const my = f.art === 'kreis' ? f.y : f.y + f.h / 2;
                    return bereichEnthaelt(schnitt, mx, my) ? [] : [f];
                }
                const ueberlappt = f.x < schnitt.x + schnitt.b && f.x + f.b > schnitt.x &&
                                   f.y < schnitt.y + schnitt.h && f.y + f.h > schnitt.y;
                if (!ueberlappt) return [f];

                const teile = [];
                if (f.y < schnitt.y) teile.push({ art: 'rechteck', x: f.x, y: f.y, b: f.b, h: schnitt.y - f.y });
                if (f.y + f.h > schnitt.y + schnitt.h) {
                    const oben = schnitt.y + schnitt.h;
                    teile.push({ art: 'rechteck', x: f.x, y: oben, b: f.b, h: f.y + f.h - oben });
                }
                const obenKante = Math.max(f.y, schnitt.y);
                const hoehe = Math.min(f.y + f.h, schnitt.y + schnitt.h) - obenKante;
                if (hoehe > 0) {
                    if (f.x < schnitt.x) teile.push({ art: 'rechteck', x: f.x, y: obenKante, b: schnitt.x - f.x, h: hoehe });
                    if (f.x + f.b > schnitt.x + schnitt.b) {
                        const links = schnitt.x + schnitt.b;
                        teile.push({ art: 'rechteck', x: links, y: obenKante, b: f.x + f.b - links, h: hoehe });
                    }
                }
                return teile;
            };

            const brauchbar = f => f.art === 'kreis' ? f.r > 0.05 : (f.b > 0.05 && f.h > 0.05);
            zustand.nebel.aufgedeckt = zustand.nebel.aufgedeckt.flatMap(zerlegen).filter(brauchbar);
            zustand.nebel.entwurf = (zustand.nebel.entwurf || []).flatMap(zerlegen).filter(brauchbar);
        }

        // Markierung an dieser Stelle entfernen (Radiergummi)
        function formLoeschenAn(fx, fy) {
            const toleranz = 0.6;
            for (let i = zustand.formen.length - 1; i >= 0; i--) {
                const p = zustand.formen[i].punkte || [];
                const nah = p.some(punkt => Math.hypot(punkt.x - fx, punkt.y - fy) < toleranz);
                if (nah) {
                    verlaufSichern();
                    zustand.formen.splice(i, 1);
                    zeichnen();
                    melden();
                    return;
                }
            }
        }

        canvas.addEventListener('pointerup', ziehenBeenden);
        canvas.addEventListener('pointercancel', ziehenBeenden);
        canvas.addEventListener('contextmenu', e => e.preventDefault());
        // Mittelklick nicht das Auto-Scrollen von Windows auslösen lassen
        canvas.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });

        canvas.addEventListener('wheel', ereignis => {
            ereignis.preventDefault();
            const pos = zeigerPosition(ereignis);
            const vorher = bildschirmZuFeld(pos.x, pos.y);
            const faktor = ereignis.deltaY < 0 ? 1.12 : 1 / 1.12;
            ansicht.zoom = Math.min(6, Math.max(0.08, ansicht.zoom * faktor));
            // Zoom auf den Mauszeiger zentrieren
            const nachher = feldZuBildschirm(vorher.x, vorher.y);
            ansicht.x += pos.x - nachher.x;
            ansicht.y += pos.y - nachher.y;
            zeichnen();
        }, { passive: false });

        // --- Zustand --------------------------------------------------------

        let meldeSperre = false;
        function melden() {
            if (meldeSperre) return;
            onChange(getState());
        }

        function getState() {
            return JSON.parse(JSON.stringify({
                raster: zustand.raster,
                figuren: zustand.figuren,
                formen: zustand.formen,
                nebel: zustand.nebel
            }));
        }

        // Zustand von außen übernehmen, ohne dadurch erneut zu melden
        function applyState(neu, mitBild) {
            // Ein von außen gesetzter Zustand (Sitzung geladen, Netz-Sync)
            // macht den bisherigen Rückgängig-Verlauf gegenstandslos.
            verlauf.length = 0;
            meldeSperre = true;
            if (neu.raster) Object.assign(zustand.raster, neu.raster);
            if (neu.figuren) zustand.figuren = JSON.parse(JSON.stringify(neu.figuren));
            if (neu.formen) zustand.formen = JSON.parse(JSON.stringify(neu.formen));
            if (neu.nebel) zustand.nebel = JSON.parse(JSON.stringify(neu.nebel));
            if (mitBild !== undefined) setBild(mitBild);
            meldeSperre = false;
            zeichnen();
        }

        function setBild(dataUrl) {
            zustand.bild = dataUrl || null;
            if (!dataUrl) { bildObjekt = null; zeichnen(); return; }
            const bild = new Image();
            bild.onload = () => { bildObjekt = bild; zeichnen(); };
            bild.onerror = () => { bildObjekt = null; zeichnen(); };
            bild.src = dataUrl;
        }

        function setRaster(werte) {
            Object.assign(zustand.raster, werte);
            zeichnen();
            melden();
        }

        // Größe einer vorhandenen Figur ändern (in Feldern)
        function setFigurGroesse(id, groesse) {
            const f = zustand.figuren.find(x => x.id === id);
            if (!f) return;
            f.groesse = Math.max(0.5, Math.min(8, groesse));
            zeichnen();
            melden();
        }

        function addFigur(figur) {
            const vorhanden = zustand.figuren.find(f => f.id === figur.id);
            if (vorhanden) { Object.assign(vorhanden, figur); }
            else { zustand.figuren.push(Object.assign({ x: 1, y: 1, groesse: 1 }, figur)); }
            zeichnen();
            melden();
        }

        function removeFigur(id) {
            zustand.figuren = zustand.figuren.filter(f => f.id !== id);
            delete figurBilder[id];
            delete figurBildQuellen[id];
            zeichnen();
            melden();
        }

        // Porträt einer Figur setzen. Bewusst NICHT Teil von getState(): Bilder
        // ändern sich selten, der Zustand wandert bei jeder Bewegung durchs Netz.
        function setFigurBild(id, dataUrl) {
            if (!dataUrl) {
                delete figurBilder[id];
                delete figurBildQuellen[id];
                zeichnen();
                return;
            }
            if (figurBildQuellen[id] === dataUrl) return;   // schon vorhanden
            figurBildQuellen[id] = dataUrl;
            const bild = new Image();
            bild.onload = zeichnen;
            bild.onerror = () => { delete figurBilder[id]; };
            bild.src = dataUrl;
            figurBilder[id] = bild;
        }

        // Alle bekannten Porträts als {id: dataUrl} — zum Weitergeben ans Netz
        function getFigurBilder() {
            return Object.assign({}, figurBildQuellen);
        }

        function figurenLoeschen() {
            zustand.figuren = [];
            zeichnen();
            melden();
        }

        // Passt Zoom und Verschiebung so an, dass das ganze Bild sichtbar ist
        function einpassen() {
            if (!bildObjekt) { ansicht.zoom = 1; ansicht.x = 0; ansicht.y = 0; zeichnen(); return; }
            const skalaX = canvas.clientWidth / bildObjekt.width;
            const skalaY = canvas.clientHeight / bildObjekt.height;
            ansicht.zoom = Math.min(skalaX, skalaY) * 0.96;
            ansicht.x = (canvas.clientWidth - bildObjekt.width * ansicht.zoom) / 2;
            ansicht.y = (canvas.clientHeight - bildObjekt.height * ansicht.zoom) / 2;
            zeichnen();
        }

        // Rasterfeld ungefähr in der Mitte des sichtbaren Ausschnitts. Neue
        // Figuren landen dort, statt in der Ecke, wo der Spielleiter sie erst
        // suchen und heranziehen müsste.
        function sichtbaresZentrum() {
            const feld = bildschirmZuFeld(canvas.clientWidth / 2, canvas.clientHeight / 2);
            return {
                x: Number.isFinite(feld.x) ? Math.max(1, Math.round(feld.x)) : 1,
                y: Number.isFinite(feld.y) ? Math.max(1, Math.round(feld.y)) : 1
            };
        }

        // Spieler dürfen nur ihre eigene Figur bewegen; null = alles erlaubt
        function setBesitzer(kennung) { nurEigene = kennung || null; }

        // Muss eine Bewegung bestätigt werden? (Spieler: ja, Spielleiter: nein)
        function setBestaetigung(an) { bestaetigungNoetig = !!an; }

        // Messen per Knopf statt Umschalttaste — wichtig auf Tablets
        function setMessModus(an) {
            messModus = !!an;
            canvas.style.cursor = messModus ? 'crosshair' : 'grab';
        }
        function istMessModus() { return messModus; }

        // Einen vorgeschlagenen Zug annehmen bzw. verwerfen
        function zugBestaetigen(id) {
            const f = zustand.figuren.find(x => x.id === id);
            if (!f || f.geplantX === undefined || f.geplantX === null) return false;
            f.x = f.geplantX; f.y = f.geplantY;
            f.geplantX = null; f.geplantY = null;
            zeichnen();
            melden();
            return true;
        }

        function zugVerwerfen(id) {
            const f = zustand.figuren.find(x => x.id === id);
            if (!f) return false;
            f.geplantX = null; f.geplantY = null;
            zeichnen();
            melden();
            return true;
        }

        // Alle offenen Zugvorschläge — für die Anzeige beim Spielleiter
        function offeneZuege() {
            return zustand.figuren
                .filter(f => f.geplantX !== undefined && f.geplantX !== null)
                .map(f => ({
                    id: f.id, name: f.name, besitzer: f.besitzer,
                    vonX: f.x, vonY: f.y, zuX: f.geplantX, zuY: f.geplantY,
                    felder: entfernungInFeldern(f.x, f.y, f.geplantX, f.geplantY)
                }));
        }

        // Figur für Spieler verdecken (Hinterhalt) bzw. wieder aufdecken
        function setVerdeckt(id, verdeckt) {
            const f = zustand.figuren.find(x => x.id === id);
            if (!f) return;
            f.verdeckt = !!verdeckt;
            zeichnen();
            melden();
        }

        // Zustand für die Spieler: verdeckte Figuren fallen weg, und Gegner, die
        // im unaufgedeckten Nebel stehen, ebenfalls. Eigene Figuren bleiben immer
        // sichtbar — die Spieler wissen ja, wo sie stehen. Noch nicht freigegebene
        // Nebelbereiche werden gar nicht erst mitgeschickt.
        function getStateFuerSpieler() {
            return fuerSpieler(getState());
        }

        // --- Werkzeuge ------------------------------------------------------

        function werkzeugCursorSetzen() {
            const zeiger = {
                messen: 'crosshair', malen: 'crosshair', radieren: 'cell',
                'nebel-auf': 'copy', 'nebel-zu': 'not-allowed'
            };
            canvas.style.cursor = zeiger[werkzeug] || 'grab';
        }

        function setWerkzeug(name) {
            werkzeug = name || 'zeigen';
            messModus = werkzeug === 'messen';
            werkzeugCursorSetzen();
            entwurf = null;
            zeichnen();
        }
        function getWerkzeug() { return werkzeug; }
        function setMalArt(art) { malArt = art; }
        function getMalArt() { return malArt; }
        function setMalFarbe(farbe) { malFarbe = farbe; }
        function getMalFarbe() { return malFarbe; }

        // --- Rückgängig ----------------------------------------------------
        // Nur für Markierungen und Nebel — nicht für Figuren-Positionen, die
        // auch über Spieler-Vorschläge und die Netzsynchronisation wandern.
        // Vor jeder solchen Änderung wird der Stand hier abgelegt.
        const verlauf = [];
        const VERLAUF_MAX = 40;

        function verlaufSichern() {
            verlauf.push(JSON.stringify({ formen: zustand.formen, nebel: zustand.nebel }));
            if (verlauf.length > VERLAUF_MAX) verlauf.shift();
        }

        function kannRueckgaengig() { return verlauf.length > 0; }

        function rueckgaengig() {
            if (!verlauf.length) return false;
            const vorher = JSON.parse(verlauf.pop());
            zustand.formen = vorher.formen;
            zustand.nebel = vorher.nebel;
            zeichnen();
            melden();
            return true;
        }

        function formenLoeschen() {
            if (!zustand.formen.length) return;
            verlaufSichern();
            zustand.formen = [];
            zeichnen();
            melden();
        }

        // --- Nebel steuern --------------------------------------------------

        function setNebelDeckend(an) { nebelDeckend = !!an; zeichnen(); }

        function nebelAktiv(an) {
            if (zustand.nebel.aktiv === !!an) return;
            verlaufSichern();
            zustand.nebel.aktiv = !!an;
            zeichnen();
            melden();
        }
        function istNebelAktiv() { return zustand.nebel.aktiv; }

        function nebelAllesZudecken() {
            verlaufSichern();
            zustand.nebel.aktiv = true;
            zustand.nebel.aufgedeckt = [];
            zustand.nebel.entwurf = [];
            zeichnen();
            melden();
        }

        function nebelAllesAufdecken() {
            if (!zustand.nebel.aktiv && !zustand.nebel.aufgedeckt.length && !(zustand.nebel.entwurf || []).length) return;
            verlaufSichern();
            zustand.nebel.aktiv = false;
            zustand.nebel.aufgedeckt = [];
            zustand.nebel.entwurf = [];
            zeichnen();
            melden();
        }

        function setNebelForm(form) { nebelForm = form; }
        function getNebelForm() { return nebelForm; }

        // Vorgemerkte Bereiche für die Spieler freigeben
        function nebelFreigeben() {
            const anzahl = (zustand.nebel.entwurf || []).length;
            if (!anzahl) return 0;
            verlaufSichern();
            zustand.nebel.aufgedeckt = zustand.nebel.aufgedeckt.concat(zustand.nebel.entwurf);
            zustand.nebel.entwurf = [];
            zeichnen();
            melden();
            return anzahl;
        }

        // Vormerkung verwerfen, ohne dass die Spieler je etwas gesehen haben
        function nebelEntwurfVerwerfen() {
            const anzahl = (zustand.nebel.entwurf || []).length;
            if (!anzahl) return 0;
            verlaufSichern();
            zustand.nebel.entwurf = [];
            zeichnen();
            melden();
            return anzahl;
        }

        function offeneNebelBereiche() { return (zustand.nebel.entwurf || []).length; }

        window.addEventListener('resize', zeichnen);
        zeichnen();

        return {
            setBild, setRaster, addFigur, removeFigur, figurenLoeschen,
            setFigurBild, getFigurBilder, setFigurGroesse,
            setBestaetigung, zugBestaetigen, zugVerwerfen, offeneZuege,
            setMessModus, istMessModus, setVerdeckt, getStateFuerSpieler,
            setWerkzeug, getWerkzeug, setMalArt, getMalArt, setMalFarbe, getMalFarbe, formenLoeschen,
            rueckgaengig, kannRueckgaengig,
            setNebelDeckend, nebelAktiv, istNebelAktiv, nebelAllesZudecken, nebelAllesAufdecken,
            setNebelForm, getNebelForm, nebelFreigeben, nebelEntwurfVerwerfen, offeneNebelBereiche,
            getState, applyState, einpassen, sichtbaresZentrum, setBesitzer, zeichnen,
            get figuren() { return zustand.figuren; },
            get raster() { return zustand.raster; },
            get bild() { return zustand.bild; }
        };
    }

    // Verkleinert ein Bild vor der Übertragung — sonst wird die Datenmenge für
    // eine Peer-to-Peer-Verbindung schnell unhandlich.
    function bildVerkleinern(datei, maxKante = 1800, qualitaet = 0.72) {
        return new Promise((erfuellen, ablehnen) => {
            const leser = new FileReader();
            leser.onerror = () => ablehnen(new Error('Datei konnte nicht gelesen werden'));
            leser.onload = () => {
                const bild = new Image();
                bild.onerror = () => ablehnen(new Error('Bild konnte nicht geladen werden'));
                bild.onload = () => {
                    const skala = Math.min(1, maxKante / Math.max(bild.width, bild.height));
                    const breite = Math.round(bild.width * skala);
                    const hoehe = Math.round(bild.height * skala);
                    const flaeche = document.createElement('canvas');
                    flaeche.width = breite;
                    flaeche.height = hoehe;
                    flaeche.getContext('2d').drawImage(bild, 0, 0, breite, hoehe);
                    erfuellen({
                        dataUrl: flaeche.toDataURL('image/jpeg', qualitaet),
                        breite, hoehe,
                        verkleinert: skala < 1
                    });
                };
                bild.src = leser.result;
            };
            leser.readAsDataURL(datei);
        });
    }

    return { create, bildVerkleinern, fuerSpieler };
})();
