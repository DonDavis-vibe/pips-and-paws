import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import de from './de.json';
import en from './en.json';
import fr from './fr.json';
import it from './it.json';
import ja from './ja.json';

// Neue Sprache hinzufuegen (Details in CONTRIBUTING.md):
//   1. <code>.json anlegen (Kopie von en.json, Werte uebersetzen)
//      — Geruest fuer Spanisch liegt bereit: es.json
//   2. hier importieren + in DICTS eintragen
//   3. in LANGS freischalten, sobald genug uebersetzt ist
// Fehlende Schluessel fallen automatisch auf Englisch zurueck.
const DICTS = { de, en, fr, it, ja };
export const LANGS = [
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'it', label: 'IT' },
  { code: 'ja', label: 'JA' },
];
const CODES = LANGS.map((l) => l.code);
const LS_KEY = 'pips-paws-lang';

function detectLang() {
  // ?lang=xx im Link hat Vorrang (geteilte Links, hreflang, Suchmaschinen).
  try {
    const q = new URLSearchParams(window.location.search).get('lang')?.toLowerCase();
    if (CODES.includes(q)) return q;
  } catch {
    /* ignorieren */
  }
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (CODES.includes(saved)) return saved;
  } catch {
    /* privater Modus */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2).toLowerCase() : '';
  return CODES.includes(nav) ? nav : 'en';
}

const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(detectLang);

  // <html lang> von Anfang an passend setzen (Screenreader, Suchmaschinen).
  useEffect(() => {
    try { document.documentElement.lang = lang; } catch { /* ignorieren */ }
  }, [lang]);

  // ?lang=xx ist ein Einmal-Schalter: die erkannte Sprache wird als Praeferenz
  // gespeichert und der Parameter aus der URL entfernt, damit ein spaeterer
  // manueller Wechsel nicht bei jedem Reload ueberschrieben wird.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has('lang')) return;
      try { localStorage.setItem(LS_KEY, lang); } catch { /* ignorieren */ }
      url.searchParams.delete('lang');
      window.history.replaceState({}, '', url);
    } catch { /* ignorieren */ }
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(LS_KEY, next);
    } catch {
      /* ignorieren */
    }
    try {
      document.documentElement.lang = next;
    } catch {
      /* ignorieren */
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict = DICTS[lang] || DICTS.en;
      let str = dict[key] ?? DICTS.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

// Ein lokalisiertes Datenfeld ({ de, en }) oder ein blanker String -> String.
export function loc(field, lang) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lang] ?? field.en ?? field.de ?? '';
}
