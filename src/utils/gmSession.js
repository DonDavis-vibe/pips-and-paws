// SL-Sitzung sichern/laden: buendelt alle lokalen SL-Daten (Tischmitte, Zeit-,
// Kampf-Tracker, allgemeine Notizen, geheime Notizen pro Held) in eine JSON-Datei.

const GM_PREFIX = 'pips-paws-gm-';
const NOTE_PREFIX = 'pips-paws-gmnote-';

const isGmKey = (k) => k.startsWith(GM_PREFIX) || k.startsWith(NOTE_PREFIX);

export function exportGmSession() {
  const data = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && isGmKey(k)) data[k] = localStorage.getItem(k);
  }
  const payload = { app: 'pips-paws-gm-session', schemaVersion: 1, savedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pips-paws-sl-sitzung-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importGmSession(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed.data !== 'object') throw new Error('Kein SL-Sitzungsformat');
        for (let i = localStorage.length - 1; i >= 0; i -= 1) {
          const k = localStorage.key(i);
          if (k && isGmKey(k)) localStorage.removeItem(k);
        }
        for (const [k, v] of Object.entries(parsed.data)) {
          if (isGmKey(k) && typeof v === 'string') localStorage.setItem(k, v);
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
