import { useEffect, useRef, useState } from 'react';

// Wuerfel-Optik: SVG-Glyphen, Knoepfe mit Wurf-Animation und eine
// Ergebnis-Buehne, in der die Zahl kurz "taumelt" und dann landet.
// Gemeinsam genutzt von der Spieler-Wurfleiste und dem SL-Wurfbereich.

const PIP_FACES = {
  1: [[12, 12]],
  2: [[8, 8], [16, 16]],
  3: [[8, 8], [12, 12], [16, 16]],
  4: [[8, 8], [16, 8], [8, 16], [16, 16]],
  5: [[8, 8], [16, 8], [12, 12], [8, 16], [16, 16]],
  6: [[8, 7], [16, 7], [8, 12], [16, 12], [8, 17], [16, 17]],
};

function D6Face({ face = 6 }) {
  return (
    <svg viewBox="0 0 24 24" className="die-svg" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {(PIP_FACES[face] || PIP_FACES[6]).map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.7" fill="currentColor" />
      ))}
    </svg>
  );
}

function PolyDie({ sides }) {
  return (
    <svg viewBox="0 0 24 24" className="die-svg" aria-hidden="true">
      <polygon
        points="12,1.5 21.5,7 21.5,17 12,22.5 2.5,17 2.5,7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <polygon points="12,1.5 21.5,7 12,12 2.5,7" fill="currentColor" opacity="0.14" />
      <line x1="12" y1="1.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="2.5" y1="7" x2="12" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="21.5" y1="7" x2="12" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <text x="12" y="18.5" textAnchor="middle" className="die-svg-num">{sides}</text>
    </svg>
  );
}

function D66Glyph() {
  return (
    <svg viewBox="0 0 24 24" className="die-svg" aria-hidden="true">
      <rect x="2.5" y="5" width="12" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="10" y="7" width="12" height="12" rx="3" fill="var(--bg-panel)" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="13" r="1.6" fill="currentColor" />
      <circle cx="6.5" cy="9" r="1.4" fill="currentColor" />
      <circle cx="6.5" cy="13" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function DieGlyph({ sides, d66, face }) {
  if (d66) return <D66Glyph />;
  if (sides === 6) return <D6Face face={face} />;
  return <PolyDie sides={sides} />;
}

// Echter 3D-Wuerfel (CSS-Transform-Wuerfel, 6 Seiten mit Pips) fuer den
// Ergebnis-Bereich. Jede Seite steht per rotateX/Y + translateZ fest im
// Wuerfel-Raum; um Seite N nach vorn zu drehen, dreht man den GANZEN Wuerfel
// um die Umkehrung von Seite N's eigener Drehung — bei reinen 90°/180°-Drehungen
// um eine Achse ist das einfach die Negation (siehe CUBE_SHOW).
const CUBE_FACE_STYLE = {
  1: { transform: 'translateZ(var(--die3d-half))' },
  2: { transform: 'rotateX(90deg) translateZ(var(--die3d-half))' },
  3: { transform: 'rotateY(90deg) translateZ(var(--die3d-half))' },
  4: { transform: 'rotateY(-90deg) translateZ(var(--die3d-half))' },
  5: { transform: 'rotateX(-90deg) translateZ(var(--die3d-half))' },
  6: { transform: 'rotateY(180deg) translateZ(var(--die3d-half))' },
};

const CUBE_SHOW = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

const mod360 = (n) => ((n % 360) + 360) % 360;

// `rollId` aendert sich bei jedem neuen Wurf (auch bei gleichem Ergebnis) und
// loest die Drehung aus; die Zieldrehung wird immer VORWAERTS vom aktuellen
// Drehwinkel aus erreicht (nie ein Sprung zurueck), plus ein paar Extra-
// Umdrehungen fuers Taumel-Gefuehl.
export function Die3D({ value, rollId, size = 42 }) {
  const target = CUBE_SHOW[value] || CUBE_SHOW[6];
  const [rot, setRot] = useState(target);
  const rotRef = useRef(target);
  const lastRollId = useRef(rollId);

  useEffect(() => {
    if (rollId === lastRollId.current) return;
    lastRollId.current = rollId;
    const cur = rotRef.current;
    const dx = mod360(target.x - mod360(cur.x));
    const dy = mod360(target.y - mod360(cur.y));
    const extraX = (1 + Math.floor(Math.random() * 2)) * 360;
    const extraY = (1 + Math.floor(Math.random() * 2)) * 360;
    const next = { x: cur.x + dx + extraX, y: cur.y + dy + extraY };
    rotRef.current = next;
    setRot(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollId]);

  return (
    <div className="die3d-scene" style={{ width: size, height: size }}>
      <div
        className="die3d-cube"
        style={{ width: size, height: size, '--die3d-half': `${size / 2}px`, transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
      >
        {[1, 2, 3, 4, 5, 6].map((f) => (
          <div key={f} className="die3d-face" style={CUBE_FACE_STYLE[f]}>
            <svg viewBox="0 0 24 24" className="die3d-pips" aria-hidden="true">
              {(PIP_FACES[f] || []).map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="2.3" fill="currentColor" />
              ))}
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Generische Vielflaechner (W4/W8/W10/W12) ---
// Der Wuerfel hat nur rechte Winkel zwischen seinen Seiten, das geht mit
// einfachem rotateX/rotateY. Die anderen Formen nicht — hier reicht nur eine
// echte Achse-Winkel-Drehung (kuerzester Drehweg zwischen zwei Normalen-
// Vektoren), sonst identisches Prinzip: jede Seite steht per fester Drehung +
// translateZ im Wuerfelraum, der ganze Koerper dreht sich um die Umkehrung
// der Ziel-Seiten-Drehung, damit die Seite nach vorn zeigt.
function vnorm([x, y, z]) {
  const len = Math.sqrt(x * x + y * y + z * z) || 1;
  return [x / len, y / len, z / len];
}
function vcross([ax, ay, az], [bx, by, bz]) {
  return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
}
function vdot([ax, ay, az], [bx, by, bz]) { return ax * bx + ay * by + az * bz; }

// Achse+Winkel, die den Vektor `from` auf `to` dreht (kuerzester Weg).
function rotationBetween(from, to) {
  const f = vnorm(from);
  const d = Math.max(-1, Math.min(1, vdot(f, to)));
  if (d > 0.999999) return { axis: [1, 0, 0], angle: 0 };
  if (d < -0.999999) return { axis: [1, 0, 0], angle: 180 };
  return { axis: vnorm(vcross(f, to)), angle: (Math.acos(d) * 180) / Math.PI };
}

const rot3dCss = ({ axis, angle }) => `rotate3d(${axis[0]}, ${axis[1]}, ${axis[2]}, ${angle}deg)`;
const FORWARD = [0, 0, 1];
const PHI = (1 + Math.sqrt(5)) / 2; // Goldener Schnitt, fuers Dodekaeder

// Flaechen-Normalen je Wuerfelform (Index i => Seite i+1). Reihenfolge ist
// beliebig — welche Zahl auf welcher Seite steht, ist bei diesen Formen auch
// bei echten Wuerfeln nicht einheitlich genormt.
const POLY_NORMALS = {
  4: [ // Tetraeder: 4 abwechselnde Ecken eines Wuerfels
    [-1, -1, -1], [-1, 1, 1], [1, -1, 1], [1, 1, -1],
  ].map(vnorm),
  8: [ // Oktaeder: dual zum Wuerfel, Normalen = dessen Eckenrichtungen
    [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
    [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
  ].map(vnorm),
  10: (() => { // Angenaeherter Pentagon-Trapezoeder: zwei gestaffelte 5er-Ringe
    const tilt = (58 * Math.PI) / 180;
    const out = [];
    for (let k = 0; k < 10; k += 1) {
      const az = (k * 36 * Math.PI) / 180;
      const y = k % 2 === 0 ? Math.cos(tilt) : -Math.cos(tilt);
      out.push(vnorm([Math.sin(tilt) * Math.cos(az), y, Math.sin(tilt) * Math.sin(az)]));
    }
    return out;
  })(),
  12: [ // Dodekaeder: Normalen entlang der Ikosaeder-Eckpunkte (Goldener Schnitt)
    [0, 1, PHI], [0, 1, -PHI], [0, -1, PHI], [0, -1, -PHI],
    [1, PHI, 0], [1, -PHI, 0], [-1, PHI, 0], [-1, -PHI, 0],
    [PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, 1], [-PHI, 0, -1],
  ].map(vnorm),
};

const POLY_SHAPE = { 4: 'tri', 8: 'tri', 10: 'kite', 12: 'penta' }; // Klasse .die3d-face--<shape> traegt den clip-path
const POLY_DIST_FACTOR = { 4: 0.22, 8: 0.3, 10: 0.44, 12: 0.42 };

// Wie Die3D, aber fuer W4/W8/W10/W12. `flourish` ist eine reine rotateX/Y-
// Zusatzdrehung (wie beim Wuerfel, mit wachsendem Winkel fuers Taumeln), die
// eigentliche Ziel-Seite kommt per rotate3d obendrauf — der Browser interpoliert
// beides im selben Übergang (rotate3d nimmt dabei den kuerzesten Drehweg direkt
// zur neuen Seite, das Taumel-Gefuehl liefert allein die rotateX/Y-Zusatzdrehung).
export function PolyDie3D({ sides, value, rollId, size = 42 }) {
  const normals = POLY_NORMALS[sides];
  const shape = POLY_SHAPE[sides];
  const dist = size * POLY_DIST_FACTOR[sides];
  const targetIdx = Math.min(Math.max(value, 1), sides) - 1;
  const target = rotationBetween(normals[targetIdx], FORWARD);

  const [show, setShow] = useState(target);
  const [flourish, setFlourish] = useState({ x: 0, y: 0 });
  const flourishRef = useRef({ x: 0, y: 0 });
  const lastRollId = useRef(rollId);

  useEffect(() => {
    if (rollId === lastRollId.current) return;
    lastRollId.current = rollId;
    const cur = flourishRef.current;
    const next = {
      x: cur.x + (1 + Math.floor(Math.random() * 2)) * 360,
      y: cur.y + (1 + Math.floor(Math.random() * 2)) * 360,
    };
    flourishRef.current = next;
    setFlourish(next);
    setShow(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollId]);

  const numSize = Math.round(size * 0.34);

  return (
    <div className="die3d-scene" style={{ width: size, height: size }}>
      <div
        className="die3d-poly"
        style={{ width: size, height: size, transform: `rotateX(${flourish.x}deg) rotateY(${flourish.y}deg) ${rot3dCss(show)}` }}
      >
        {normals.map((n, i) => (
          <div
            key={i}
            className={`die3d-face die3d-face--${shape}`}
            style={{ transform: `${rot3dCss(rotationBetween(FORWARD, n))} translateZ(${dist}px)` }}
          >
            <span className="die3d-num" style={{ fontSize: numSize }}>{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Wurf-Knopf mit Glyphe. `kind` steuert die Farbe (basic | save | gm).
export function RollButton({ sides, d66, label, title, kind = 'basic', onRoll, disabled }) {
  const [spin, setSpin] = useState(0);
  const face = sides === 6 || d66 ? 1 + (spin % 6) : undefined;

  return (
    <button
      type="button"
      className={`roll-btn roll-btn-${kind}`}
      onClick={() => {
        setSpin((s) => s + 1);
        onRoll();
      }}
      disabled={disabled}
      title={title || label}
    >
      <span key={spin} className="die-glyph">
        <DieGlyph sides={sides} d66={d66} face={face} />
      </span>
      <span className="roll-btn-label">{label}</span>
    </button>
  );
}

// Ergebnis-Buehne. `result`: { id, label, value, max, parts?, verdict?, tone? }
//   tone: 'ok' | 'bad' | 'crit-good' | 'crit-bad'
export function DiceStage({ result, idleIcon, idleText, compact }) {
  const [shown, setShown] = useState(null);
  const [rolling, setRolling] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!result) return undefined;
    const span = Math.max(6, result.max || 20);
    setRolling(true);
    setShown(1 + Math.floor(Math.random() * span));
    let frames = 0;
    let fallback;
    clearInterval(timer.current);
    const settle = () => {
      clearInterval(timer.current);
      clearTimeout(fallback);
      setShown(result.value);
      setRolling(false);
    };
    timer.current = setInterval(() => {
      frames += 1;
      setShown(1 + Math.floor(Math.random() * span));
      if (frames >= 9) settle();
    }, 45);
    // Sicherheitsnetz gegen gedrosselte Timer (Hintergrund-Tab o.Ae.).
    fallback = setTimeout(settle, 650);
    return () => {
      clearInterval(timer.current);
      clearTimeout(fallback);
    };
  }, [result?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!result) {
    return (
      <div className={`dice-stage stage-idle${compact ? ' dice-stage--compact' : ''}`}>
        <div className="dice-stage-idle">
          {idleIcon}
          {idleText ? <span>{idleText}</span> : null}
        </div>
      </div>
    );
  }

  const tone = rolling ? '' : result.tone || '';
  // Echte 3D-Wuerfel fuer W4/W6/W8/W10/W12 (einzeln oder als Wuerfel-Paar bei
  // W66). W20 bleibt bei der Zahlen-Anzeige — ein 20-seitiger Pip-Wuerfel
  // waere ein eigenes, viel groesseres Modell (Ikosaeder mit 20 Dreiecken).
  const cubeSize = compact ? 30 : 42;
  const isCubePair = result.max === 66 && result.parts?.length === 2;
  const isCube = result.max === 6;
  const isPoly = [4, 8, 10, 12].includes(result.max);

  return (
    <div className={`dice-stage stage-live${tone ? ` stage-${tone}` : ''}${compact ? ' dice-stage--compact' : ''}`}>
      {isCubePair ? (
        <div className="die3d-pair" key={`cp-${result.id}`}>
          {result.parts.map((p, i) => (
            <div className="die3d-labeled" key={i}>
              <Die3D value={p.value} rollId={result.id} size={cubeSize} />
              <span className="dice-part-label">{p.label}</span>
            </div>
          ))}
        </div>
      ) : isCube ? (
        <Die3D value={result.value} rollId={result.id} size={cubeSize} />
      ) : isPoly ? (
        <PolyDie3D sides={result.max} value={result.value} rollId={result.id} size={cubeSize} />
      ) : null}

      {result.parts && !isCubePair && !rolling ? (
        <div className="dice-parts" key={`p-${result.id}`}>
          {result.parts.map((p, i) => (
            <span key={i} className="dice-part">
              <span className="dice-part-value">{p.value}</span>
              <span className="dice-part-label">{p.label}</span>
            </span>
          ))}
        </div>
      ) : null}

      <span className={`dice-stage-value${rolling ? ' is-rolling' : ''}${isCube || isCubePair || isPoly ? ' dice-stage-value--sub' : ''}`} key={`v-${result.id}`}>
        {shown}
      </span>

      <span className="dice-stage-meta">
        <span className="dice-stage-label">{result.label}</span>
        {result.verdict && !rolling ? (
          <span className="dice-badge" key={`b-${result.id}`}>
            {result.verdict}
          </span>
        ) : null}
      </span>
    </div>
  );
}
