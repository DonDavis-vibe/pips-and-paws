// Zugangskontrolle fuer den Multiplayer-Raum: optionales Passwort per
// Challenge-Response. Das Passwort selbst geht nie ueber die Leitung — der SL
// schickt eine Zufallszahl, der Spieler antwortet mit einem HMAC darueber. So
// sieht auch ein manipulierter Vermittlungsserver (PeerJS) es nicht.
//
// Das Passwort wird mit PBKDF2 (Salz = Raum-Code) zu einem Schluessel
// gestreckt, damit sich ein mitgeschnittenes Frage-Antwort-Paar nicht billig
// offline durchprobieren laesst. Braucht WebCrypto (HTTPS, localhost, file://).

const ITERATIONS = 150000;
const enc = new TextEncoder();

export const hasCrypto = () => !!(globalThis.crypto && globalThis.crypto.subtle);

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export function randomHex(bytes = 16) {
  const a = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(a);
  return hex(a);
}

// Passwort + Raum-Code -> HMAC-Schluessel (CryptoKey)
export async function deriveKey(password, roomCode) {
  const base = await crypto.subtle.importKey('raw', enc.encode(String(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(`pips-paws:${roomCode}`), iterations: ITERATIONS },
    base,
    256,
  );
  return crypto.subtle.importKey('raw', bits, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

// Antwort auf eine Frage (nonce) — beide Seiten rechnen dasselbe.
export async function makeProof(key, nonce, roomCode) {
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${nonce}:${roomCode}`));
  return hex(sig);
}

// Vergleich ohne vorzeitigen Abbruch.
export function safeEqual(a, b) {
  const x = String(a);
  const y = String(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) diff |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  return diff === 0;
}
