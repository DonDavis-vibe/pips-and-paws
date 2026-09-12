// Eigene Sounds des SL: Ambient/Musik, die der SL selbst mitbringt (z. B.
// lizenzfreie Tracks von einer eigenen Bibliothek). Bleiben ausschliesslich
// lokal im Browser des SL (IndexedDB) — nie im Repository, nie auf dem
// gehosteten Server. Beim Abspielen fuer alle geht die Datei nur direkt per
// WebRTC an die gerade verbundenen Spieler raus (siehe useMultiplayer.js).
//
// Mehrere benannte Slots (anders als ein einzelner "eigener Sound"): der SL
// baut sich damit sein eigenes kleines Ambient-Board.

const DB_NAME = 'pips-paws-custom-sounds';
const STORE = 'sounds';
export const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — grosszuegig, begrenzt aber die WebRTC-Uebertragung

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listCustomSounds() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => a.addedAt - b.addedAt));
    req.onerror = () => reject(req.error);
  });
}

export async function addCustomSound(name, blob) {
  const db = await openDb();
  const entry = { id: `snd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, blob, addedAt: Date.now() };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve(entry);
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeCustomSound(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
