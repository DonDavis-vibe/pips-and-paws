import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import de from './de.json';
import en from './en.json';

// Neue Sprache hinzufuegen (Details in CONTRIBUTING.md):
//   1. <code>.json anlegen (Kopie von en.json, Werte uebersetzen) — es.json ist schon da
//   2. hier importieren + in DICTS eintragen
//   3. in LANGS freischalten, sobald genug uebersetzt ist
// Fehlende Schluessel fallen automatisch auf Englisch zurueck.
const DICTS = { de, en };
export const LANGS = [
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
];
const CODES = LANGS.map((l) => l.code);
const LS_KEY = 'pips-paws-lang';

function detectLang() {
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
