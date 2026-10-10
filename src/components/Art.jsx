// Kleine Strichzeichnung der Maus als Icon (Panel-Koepfe, Fusszeile). Nutzt
// currentColor fuer die Tusche und --art-paper fuer die Fuellung, damit sie im
// Dunkelmodus als "Negativdruck" mitgeht. Die grossen Illustrationen (Marke,
// Portraet, Leerzustaende) sind Tusche-Bilder: siehe InkArt.jsx.

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.6,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
};
const PAPER = 'var(--art-paper, #f8f1de)';

// Sitzende Maus im Profil — Marke in der Kopfzeile und Icon.
export function ArtMouse({ size = 48, className }) {
  return (
    <svg viewBox="-2 8 80 56" width={size} height={size * 0.7} className={className} aria-hidden="true">
      <g {...STROKE}>
        <path d="M50 55 C60 62 72 56 70 46" />
        <path d="M3 37 C4 28 11 21 20 20 C27 12 41 10 50 19 C59 28 60 47 51 55 C42 62 22 62 14 56 C7 51 2 45 3 37 Z" fill={PAPER} />
        <circle cx="24" cy="17" r="7.5" fill={PAPER} />
        <circle cx="24" cy="17" r="3.2" fill="currentColor" stroke="none" />
        <circle cx="13" cy="31" r="1.9" fill="currentColor" stroke="none" />
        <circle cx="3" cy="37" r="2.2" fill="currentColor" stroke="none" />
        <path d="M6 40 L0 43 M6 37 L-1 36.5 M6 34 L1 30" strokeWidth="1.5" />
        <path d="M17 56 c2-3 5-3 7 0 M27 58 c2-3 5-3 7 0" strokeWidth="2" />
        <path d="M46 31 c4 3 6 8 6 13 M51 26 c4 5 6 11 5 18" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
