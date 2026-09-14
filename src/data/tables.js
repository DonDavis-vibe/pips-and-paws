// Aussehen & Wesen aus dem Mausritter-SRD 2.3.1 (CC BY 4.0).

// Sternzeichen (1W6) -> Wesensart (Tugend / Laster)
export const BIRTHSIGNS = [
  { sign: { de: 'Stern', en: 'Star', es: 'La Estrella' }, disposition: { de: 'Mutig / Leichtsinnig', en: 'Brave / Reckless', es: 'Valiente / Descuidado' } },
  { sign: { de: 'Rad', en: 'Wheel', es: 'La Rueda' }, disposition: { de: 'Fleissig / Einfallslos', en: 'Industrious / Unimaginative', es: 'Diligente / Sin imaginación' } },
  { sign: { de: 'Eichel', en: 'Acorn', es: 'La Bellota' }, disposition: { de: 'Neugierig / Stur', en: 'Inquisitive / Stubborn', es: 'Inquisitivo / Terco' } },
  { sign: { de: 'Sturm', en: 'Storm', es: 'La Tormenta' }, disposition: { de: 'Grosszuegig / Jaehzornig', en: 'Generous / Wrathful', es: 'Generoso / Iracundo' } },
  { sign: { de: 'Mond', en: 'Moon', es: 'La Luna' }, disposition: { de: 'Weise / Geheimnisvoll', en: 'Wise / Mysterious', es: 'Sabio / Misterioso' } },
  { sign: { de: 'Mutter', en: 'Mother', es: 'La MAdre' }, disposition: { de: 'Fuersorglich / Besorgt', en: 'Nurturing / Worrying', es: 'Protector / Preocupado' } },
];

// Fellfarbe (1W6)
export const COAT_COLORS = [
  { de: 'Schokoladenbraun', en: 'Chocolate', es: 'Chocolate' },
  { de: 'Schwarz', en: 'Black', es: 'Negro' },
  { de: 'Weiss', en: 'White', es: 'Blanco' },
  { de: 'Hellbraun', en: 'Tan', es: 'Café claro' },
  { de: 'Grau', en: 'Grey', es: 'Gris' },
  { de: 'Blaugrau', en: 'Blue', es: 'Azul' },
];

// Fellmuster (1W6)
export const COAT_PATTERNS = [
  { de: 'einfarbig', en: 'Solid', es: 'Sólido' },
  { de: 'getigert', en: 'Brindle', es: 'Manchas grandes' },
  { de: 'gefleckt', en: 'Patchy', es: 'Cuerpo y cabeza de distinto color' },
  { de: 'gebaendert', en: 'Banded', es: 'A rayas' },
  { de: 'marmoriert', en: 'Marbled', es: 'Moteado' },
  { de: 'gesprenkelt', en: 'Flecked', es: 'Calvo, solo pelusilla' },
];

// Besonderes Merkmal (W66). Index 0..35 entspricht 11,12,...,16,21,...,66.
export const DETAILS = [
  { de: 'Vernarbter Koerper', en: 'Scarred body', es: 'Cicatrices' },
  { de: 'Beleibter Koerper', en: 'Corpulent body', es: 'Corpulento' },
  { de: 'Skelettartiger Koerper', en: 'Skeletal body', es: 'Esquelético' },
  { de: 'Weidenschlanker Koerper', en: 'Willowy body', es: 'Esbelto' },
  { de: 'Winziger Koerper', en: 'Tiny body', es: 'Diminuto' },
  { de: 'Massiger Koerper', en: 'Massive body', es: 'Enorme' },
  { de: 'Kriegsbemalung', en: 'War paint', es: 'Pintura de guerra' },
  { de: 'Fremdlaendische Kleidung', en: 'Foreign clothes', es: 'Ropajes extranjeros' },
  { de: 'Elegante Kleidung', en: 'Elegant clothes', es: 'Ropaje elegante' },
  { de: 'Geflickte Kleidung', en: 'Patched clothes', es: 'Ropaje remendado' },
  { de: 'Modische Kleidung', en: 'Fashionable clothes', es: 'Ropa de moda' },
  { de: 'Ungewaschene Kleidung', en: 'Unwashed clothes', es: 'Ropajes sucios' },
  { de: 'Fehlendes Ohr', en: 'Missing ear', es: 'Oreja amputada' },
  { de: 'Kloetziges Gesicht', en: 'Lumpy face', es: 'Rostro abultado' },
  { de: 'Schoenes Gesicht', en: 'Beautiful face', es: 'Rostro hermoso' },
  { de: 'Rundes Gesicht', en: 'Round face', es: 'Rostro redondeado' },
  { de: 'Feines Gesicht', en: 'Delicate face', es: 'Rostro delicado' },
  { de: 'Langgezogenes Gesicht', en: 'Elongated face', es: 'Rostro alargado' },
  { de: 'Gepflegtes Fell', en: 'Groomed fur', es: 'Pelaje cuidado' },
  { de: 'Dreadlocks', en: 'Dreadlocks', es: 'Rastas' },
  { de: 'Gefaerbtes Fell', en: 'Dyed fur', es: 'Pelaje teñido' },
  { de: 'Rasiertes Fell', en: 'Shaved fur', es: 'Pelaje afeitado' },
  { de: 'Krauses Fell', en: 'Frizzy fur', es: 'Pelaje encrespado' },
  { de: 'Seidiges Fell', en: 'Silky fur', es: 'Pelaje sedoso' },
  { de: 'Nachtschwarze Augen', en: 'Night black eyes', es: 'Ojos negros intensos' },
  { de: 'Augenklappe', en: 'Eye patch', es: 'Parche en un ojo' },
  { de: 'Blutrote Augen', en: 'Blood red eyes', es: 'Ojos rojo sangre' },
  { de: 'Weise Augen', en: 'Wise eyes', es: 'Mirada sabia' },
  { de: 'Scharfe Augen', en: 'Sharp eyes', es: 'Mirada aguda' },
  { de: 'Leuchtende Augen', en: 'Luminous eyes', es: 'Ojos luminosos' },
  { de: 'Gestutzter Schwanz', en: 'Cropped tail', es: 'Cola recortada' },
  { de: 'Peitschenartiger Schwanz', en: 'Whip-like tail', es: 'Cola fina' },
  { de: 'Buescheliger Schwanz', en: 'Tufted tail', es: 'Cola anudada' },
  { de: 'Stummelschwanz', en: 'Stubby tail', es: 'Cola rechoncha' },
  { de: 'Greifschwanz', en: 'Prehensile tail', es: 'Cola prensil' },
  { de: 'Ringelschwanz', en: 'Curly tail', es: 'Cola rizada' },
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
