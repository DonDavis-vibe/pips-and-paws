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
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      frames += 1;
      setShown(1 + Math.floor(Math.random() * span));
      if (frames >= 9) {
        clearInterval(timer.current);
        setShown(result.value);
        setRolling(false);
      }
    }, 45);
    return () => clearInterval(timer.current);
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

  return (
    <div className={`dice-stage stage-live${tone ? ` stage-${tone}` : ''}${compact ? ' dice-stage--compact' : ''}`}>
      {result.parts && !rolling ? (
        <div className="dice-parts" key={`p-${result.id}`}>
          {result.parts.map((p, i) => (
            <span key={i} className="dice-part">
              <span className="dice-part-value">{p.value}</span>
              <span className="dice-part-label">{p.label}</span>
            </span>
          ))}
        </div>
      ) : null}

      <span className={`dice-stage-value${rolling ? ' is-rolling' : ''}`} key={`v-${result.id}`}>
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
