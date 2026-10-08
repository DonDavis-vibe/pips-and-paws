import { loc } from '../i18n/index.jsx';

// Stabile Gruppen-ID: bleibt ueber Sitzungen gleich (die PeerJS-ID tut das nicht).
export function slug(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

export const partyId = (character, fallback) => `pc-${slug(character?.name) || slug(fallback) || 'maus'}`;

function sheetOf(character, lang) {
  const c = character || {};
  const items = Object.values(c.items || {});
  const name = (it) => loc(it.name, lang);
  const sheet = {
    background: c.background, birthsign: c.birthsign, disposition: c.disposition, coat: c.coat, detail: c.detail,
    level: Number(c.level) || undefined,
    hpCurrent: c.hp?.current, hpMax: c.hp?.max,
    str: c.str?.current, strMax: c.str?.max,
    dex: c.dex?.current, dexMax: c.dex?.max,
    wil: c.wil?.current, wilMax: c.wil?.max,
    pips: Number(c.pips),
    conditions: items.filter((i) => i.type === 'condition' && !i.cleared).map(name),
    items: items.filter((i) => i.type !== 'condition').map(name),
    hirelings: (c.hirelings || []).map((h) => h.name).filter(Boolean),
  };
  // Nur gesetzte Felder melden (PenNodePaper liest sie nur, validiert aber nichts).
  Object.keys(sheet).forEach((k) => {
    const v = sheet[k];
    if (v === undefined || v === '' || Number.isNaN(v) || (Array.isArray(v) && v.length === 0)) delete sheet[k];
  });
  return sheet;
}

// Spieler-Portraet (Data-URL) -> quadratisches UpfImage (256 px)
function squarePortrait(dataUrl, edge) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(null);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = edge;
      canvas.height = edge;
      canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, edge, edge);
      const url = canvas.toDataURL('image/jpeg', 0.8);
      resolve({ name: 'portrait.jpg', mime: 'image/jpeg', b64: url.slice(url.indexOf(',') + 1) });
    };
    img.src = dataUrl;
  });
}

// Eintraege ohne Portraet-Bytes (billig, fuer den Fingerabdruck) + die Quelle.
export function partyWithoutImages({ players, localPlayers, lang }) {
  const out = [];
  Object.entries(players || {}).forEach(([peerId, p]) => {
    const c = p.character;
    // Ohne Namen (frisch beigetreten, Bogen noch leer) gaebe es eine ID, die
    // sich beim Benennen aendert und in PenNodePaper als Geist zurueckbliebe.
    if (!c || !c.name?.trim()) return;
    out.push({
      id: partyId(c, peerId), role: 'pc', name: c.name || '?', playerName: c.playerName || c.name || '?',
      online: true, sheet: sheetOf(c, lang), source: c.portrait,
    });
  });
  // Boegen, die der SL selbst am Tisch fuehrt, gehoeren genauso zur Gruppe.
  (localPlayers || []).forEach((c) => {
    if (!c.name?.trim()) return;
    out.push({
      id: partyId(c, c.id), role: 'pc', name: c.name || '?', playerName: c.playerName || c.name || '?',
      online: true, sheet: sheetOf(c, lang), source: c.portrait,
    });
  });
  // Doppelte Namen wuerden dieselbe ID bekommen -> durchnummerieren.
  const seen = {};
  out.forEach((e) => {
    seen[e.id] = (seen[e.id] || 0) + 1;
    if (seen[e.id] > 1) e.id = `${e.id}-${seen[e.id]}`;
  });
  return out;
}

export function partyFingerprint(entries) {
  return JSON.stringify(entries.map((e) => ({
    ...e,
    // Portraets sind gross: nur grob vergleichen (Laenge + Ende).
    source: typeof e.source === 'string' ? `${e.source.length}:${e.source.slice(-24)}` : null,
  })));
}

const portraitCache = {};

export async function buildParty(entries) {
  const result = [];
  for (const e of entries) {
    const { source, ...rest } = e;
    if (typeof source === 'string' && source.startsWith('data:image/')) {
      const hit = portraitCache[rest.id];
      if (!hit || hit.source !== source) portraitCache[rest.id] = { source, upf: await squarePortrait(source, 256) };
      if (portraitCache[rest.id].upf) rest.portrait = portraitCache[rest.id].upf;
    }
    result.push(rest);
  }
  return result;
}
