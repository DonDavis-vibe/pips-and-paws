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
  // Echte 3D-Wuerfel nur fuer W6 (einzeln oder als Paar bei W66) — andere
  // Seitenzahlen (W8/W10/W12/W20) bleiben bei der Zahlen-Anzeige, ein
  // 20-seitiger Wuerfel als Pip-Wuerfel waere ein eigenes, viel groesseres Modell.
  const cubeSize = compact ? 30 : 42;
  const isCubePair = result.max === 66 && result.parts?.length === 2;
  const isCube = result.max === 6;

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

      <span className={`dice-stage-value${rolling ? ' is-rolling' : ''}${isCube || isCubePair ? ' dice-stage-value--sub' : ''}`} key={`v-${result.id}`}>
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
