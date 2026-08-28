// Nachrichten-Vertrag zwischen Spielleiter (Host) und Spielern.
// Alle Nachrichten haben ein Feld `t` (Typ). Freitext wird beim Rendern escaped.

export const ROOM_PREFIX = 'pips-paws-';
export const JOIN_TIMEOUT_MS = 20000;
export const MAX_RECONNECT_ATTEMPTS = 8;
export const SESSION_KEY = 'pips-paws-mp-session';
export const TURN_KEY = 'pips-paws-mp-turn';

export const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

// Spieler -> Spielleiter
export const T_STATE = 'state'; // { character, items }
export const T_EVENT = 'event'; // { ev } strukturiert, z.B. { kind:'save', attr, roll, ok }
export const T_SAY = 'say'; //   { text } Freitext an den SL

// Spielleiter -> Spieler
export const T_GM = 'gmCommand'; // { cmd, ... }
export const GM_SAVE = 'save'; //      { attr, reason }
export const GM_DAMAGE = 'damage'; //  { amount, target: 'hp'|'str'|'dex'|'wil', source }
export const GM_HEAL = 'heal'; //      { amount, target }
export const GM_PIPS = 'pips'; //      { amount }
export const GM_WHISPER = 'whisper'; // { text }
export const GM_BROADCAST = 'broadcast'; // { text }

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne I/O/0/1
  let code = '';
  for (let i = 0; i < 4; i += 1) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export function isMessage(m) {
  return m && typeof m === 'object' && typeof m.t === 'string';
}

export function getTurnServer() {
  try {
    const stored = JSON.parse(localStorage.getItem(TURN_KEY) || 'null');
    if (stored && stored.urls) return stored;
  } catch {
    /* ungueltig */
  }
  return null;
}

export function setTurnServer(server) {
  try {
    if (server && server.urls) localStorage.setItem(TURN_KEY, JSON.stringify(server));
    else localStorage.removeItem(TURN_KEY);
  } catch {
    /* ignorieren */
  }
}

export function peerConfig() {
  const iceServers = [...STUN_SERVERS];
  const turn = getTurnServer();
  if (turn) iceServers.push(turn);
  return { config: { iceServers } };
}
