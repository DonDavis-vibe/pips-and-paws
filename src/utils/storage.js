// localStorage/sessionStorage mit try/catch (privater Modus, voller Speicher).

export function readJSON(key, fallback = null, store = localStorage) {
  try {
    const raw = store.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value, store = localStorage) {
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key, store = localStorage) {
  try {
    store.removeItem(key);
  } catch {
    /* ignorieren */
  }
}
