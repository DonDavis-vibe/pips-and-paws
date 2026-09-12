// Handgezeichnete Strich-Vignetten fuer den Druckbogen-Look. Alle nutzen
// currentColor fuer die Tusche und --art-paper fuer die Fuellung, damit sie
// im Dunkelmodus als "Negativdruck" mitgehen. Die Fotos/Vignetten des
// Classic-Skins bleiben unangetastet; CSS blendet je Skin das Passende ein.

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

// Maus mit Schwert auf dem Ruecken — Platzhalter fuer das Charakterbild.
export function ArtKnight({ className }) {
  return (
    <svg viewBox="-3 2 82 72" className={className} aria-hidden="true">
      <g {...STROKE}>
        <path d="M50 62 C60 69 72 63 70 53" />
        <path d="M58 6 L62 10 L38 40 L34 36 Z" fill={PAPER} />
        <path d="M30 44 l8-8 M36 44 l-8-8" strokeWidth="2.4" />
        <path d="M28 42 l-4 4" strokeWidth="3" />
        <path d="M3 44 C4 35 11 28 20 27 C27 19 41 17 50 26 C59 35 60 54 51 62 C42 69 22 69 14 63 C7 58 2 52 3 44 Z" fill={PAPER} />
        <circle cx="24" cy="24" r="7.5" fill={PAPER} />
        <circle cx="24" cy="24" r="3.2" fill="currentColor" stroke="none" />
        <circle cx="13" cy="38" r="1.9" fill="currentColor" stroke="none" />
        <circle cx="3" cy="44" r="2.2" fill="currentColor" stroke="none" />
        <path d="M6 47 L0 50 M6 44 L-1 43.5 M6 41 L1 37" strokeWidth="1.5" />
        <path d="M17 63 c2-3 5-3 7 0 M27 65 c2-3 5-3 7 0" strokeWidth="2" />
        <path d="M46 38 c4 3 6 8 6 13 M51 33 c4 5 6 11 5 18" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

// Leere Truhe — Tischmitte ohne Gegenstaende.
export function ArtChest({ className }) {
  return (
    <svg viewBox="0 0 80 64" className={className} aria-hidden="true">
      <g {...STROKE}>
        <path d="M8 28 H72 V56 H8 Z" fill={PAPER} />
        <path d="M8 28 C8 16 20 10 40 10 C60 10 72 16 72 28" fill={PAPER} />
        <path d="M8 28 H72" />
        <path d="M22 10.5 V28 M58 10.5 V28" strokeWidth="2" />
        <rect x="34" y="24" width="12" height="12" rx="2" fill={PAPER} />
        <circle cx="40" cy="30" r="1.6" fill="currentColor" stroke="none" />
        <path d="M14 40 h8 M14 46 h5 M60 40 h6 M14 34 h4" strokeWidth="1.5" />
        <path d="M2 60 h76" strokeWidth="2" />
      </g>
    </svg>
  );
}

// Laterne — Lobby, noch niemand am Tisch.
export function ArtLantern({ className }) {
  return (
    <svg viewBox="0 0 64 80" className={className} aria-hidden="true">
      <g {...STROKE}>
        <path d="M32 4 C24 4 18 8 18 14 H46 C46 8 40 4 32 4 Z" fill={PAPER} />
        <path d="M26 4 C28 1 36 1 38 4" />
        <path d="M20 14 L16 60 H48 L44 14" fill={PAPER} />
        <path d="M14 60 H50 V68 H14 Z" fill={PAPER} />
        <path d="M24 14 V60 M40 14 V60" strokeWidth="1.6" />
        <path d="M32 26 C29 32 27 36 32 44 C37 36 35 32 32 26 Z" fill="currentColor" />
        <path d="M10 30 l-6-2 M10 40 h-7 M54 30 l6-2 M54 40 h7" strokeWidth="1.6" />
        <path d="M18 76 h28" strokeWidth="2" />
      </g>
    </svg>
  );
}

// Wuerfel und Feder — Charaktererschaffung.
export function ArtDiceQuill({ className }) {
  return (
    <svg viewBox="0 0 80 64" className={className} aria-hidden="true">
      <g {...STROKE}>
        <path d="M12 26 L28 18 L44 26 L28 34 Z" fill={PAPER} />
        <path d="M12 26 V44 L28 52 V34 M44 26 V44 L28 52" fill={PAPER} />
        <circle cx="28" cy="26" r="1.9" fill="currentColor" stroke="none" />
        <circle cx="19" cy="38" r="1.7" fill="currentColor" stroke="none" />
        <circle cx="21" cy="44" r="1.7" fill="currentColor" stroke="none" />
        <circle cx="36" cy="38" r="1.7" fill="currentColor" stroke="none" />
        <circle cx="38" cy="44" r="1.7" fill="currentColor" stroke="none" />
        <circle cx="35" cy="34" r="1.7" fill="currentColor" stroke="none" />
        <path d="M74 6 C60 8 50 20 48 40 L52 44 C64 40 72 24 74 6 Z" fill={PAPER} />
        <path d="M48 40 C56 30 62 20 70 12" strokeWidth="1.6" />
        <path d="M48 40 L42 56" strokeWidth="2.4" />
        <path d="M6 58 h68" strokeWidth="2" />
      </g>
    </svg>
  );
}
