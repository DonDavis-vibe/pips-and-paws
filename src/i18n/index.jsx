import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import de from './de.json';
import en from './en.json';

const DICTS = { de, en };
const LS_KEY = 'pips-paws-lang';

function detectLang() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === 'de' || saved === 'en') return saved;
  } catch {
    /* privater Modus */
  }
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('de')) {
    return 'de';
  }
  return 'en';
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
