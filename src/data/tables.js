// Aussehen & Wesen aus dem Mausritter-SRD 2.3.1 (CC BY 4.0).

// Sternzeichen (1W6) -> Wesensart (Tugend / Laster)
export const BIRTHSIGNS = [
  { sign: { de: 'Stern', en: 'Star' }, disposition: { de: 'Mutig / Leichtsinnig', en: 'Brave / Reckless' } },
  { sign: { de: 'Rad', en: 'Wheel' }, disposition: { de: 'Fleissig / Einfallslos', en: 'Industrious / Unimaginative' } },
  { sign: { de: 'Eichel', en: 'Acorn' }, disposition: { de: 'Neugierig / Stur', en: 'Inquisitive / Stubborn' } },
  { sign: { de: 'Sturm', en: 'Storm' }, disposition: { de: 'Grosszuegig / Jaehzornig', en: 'Generous / Wrathful' } },
  { sign: { de: 'Mond', en: 'Moon' }, disposition: { de: 'Weise / Geheimnisvoll', en: 'Wise / Mysterious' } },
  { sign: { de: 'Mutter', en: 'Mother' }, disposition: { de: 'Fuersorglich / Besorgt', en: 'Nurturing / Worrying' } },
];

// Fellfarbe (1W6)
export const COAT_COLORS = [
  { de: 'Schokoladenbraun', en: 'Chocolate' },
  { de: 'Schwarz', en: 'Black' },
  { de: 'Weiss', en: 'White' },
  { de: 'Hellbraun', en: 'Tan' },
  { de: 'Grau', en: 'Grey' },
  { de: 'Blaugrau', en: 'Blue' },
];

// Fellmuster (1W6)
export const COAT_PATTERNS = [
  { de: 'einfarbig', en: 'Solid' },
  { de: 'getigert', en: 'Brindle' },
  { de: 'gefleckt', en: 'Patchy' },
  { de: 'gebaendert', en: 'Banded' },
  { de: 'marmoriert', en: 'Marbled' },
  { de: 'gesprenkelt', en: 'Flecked' },
];

// Besonderes Merkmal (W66). Index 0..35 entspricht 11,12,...,16,21,...,66.
export const DETAILS = [
  { de: 'Vernarbter Koerper', en: 'Scarred body' },
  { de: 'Beleibter Koerper', en: 'Corpulent body' },
  { de: 'Skelettartiger Koerper', en: 'Skeletal body' },
  { de: 'Weidenschlanker Koerper', en: 'Willowy body' },
  { de: 'Winziger Koerper', en: 'Tiny body' },
  { de: 'Massiger Koerper', en: 'Massive body' },
  { de: 'Kriegsbemalung', en: 'War paint' },
  { de: 'Fremdlaendische Kleidung', en: 'Foreign clothes' },
  { de: 'Elegante Kleidung', en: 'Elegant clothes' },
  { de: 'Geflickte Kleidung', en: 'Patched clothes' },
  { de: 'Modische Kleidung', en: 'Fashionable clothes' },
  { de: 'Ungewaschene Kleidung', en: 'Unwashed clothes' },
  { de: 'Fehlendes Ohr', en: 'Missing ear' },
  { de: 'Kloetziges Gesicht', en: 'Lumpy face' },
  { de: 'Schoenes Gesicht', en: 'Beautiful face' },
  { de: 'Rundes Gesicht', en: 'Round face' },
  { de: 'Feines Gesicht', en: 'Delicate face' },
  { de: 'Langgezogenes Gesicht', en: 'Elongated face' },
  { de: 'Gepflegtes Fell', en: 'Groomed fur' },
  { de: 'Dreadlocks', en: 'Dreadlocks' },
  { de: 'Gefaerbtes Fell', en: 'Dyed fur' },
  { de: 'Rasiertes Fell', en: 'Shaved fur' },
  { de: 'Krauses Fell', en: 'Frizzy fur' },
  { de: 'Seidiges Fell', en: 'Silky fur' },
  { de: 'Nachtschwarze Augen', en: 'Night black eyes' },
  { de: 'Augenklappe', en: 'Eye patch' },
  { de: 'Blutrote Augen', en: 'Blood red eyes' },
  { de: 'Weise Augen', en: 'Wise eyes' },
  { de: 'Scharfe Augen', en: 'Sharp eyes' },
  { de: 'Leuchtende Augen', en: 'Luminous eyes' },
  { de: 'Gestutzter Schwanz', en: 'Cropped tail' },
  { de: 'Peitschenartiger Schwanz', en: 'Whip-like tail' },
  { de: 'Buescheliger Schwanz', en: 'Tufted tail' },
  { de: 'Stummelschwanz', en: 'Stubby tail' },
  { de: 'Greifschwanz', en: 'Prehensile tail' },
  { de: 'Ringelschwanz', en: 'Curly tail' },
];

// Namen (SRD "Mousy Names" — Auswahl)
export const NAMES = [
  'Pip', 'Hollis', 'Bramble', 'Fennwick', 'Maple', 'Tansy', 'Barnaby', 'Wren',
  'Clover', 'Thistle', 'Odo', 'Marigold', 'Sorrel', 'Figgs', 'Nib', 'Juniper',
  'Aster', 'Cobweb', 'Pelham', 'Rue', 'Salvia', 'Tuppence', 'Wisp', 'Yarrow',
];

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function rollDetailIndex() {
  const tens = 1 + Math.floor(Math.random() * 6);
  const ones = 1 + Math.floor(Math.random() * 6);
  return (tens - 1) * 6 + (ones - 1);
}
