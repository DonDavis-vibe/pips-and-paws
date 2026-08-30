import { useCallback, useEffect, useState } from 'react';

const KEY = 'pips-paws-theme';
export const THEMES = ['system', 'light', 'dark'];

function systemDark() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function apply(pref) {
  const dark = pref === 'dark' || (pref === 'system' && systemDark());
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

// 'system' | 'light' | 'dark' — gemerkt im localStorage, angewandt an <html data-theme>.
export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      const v = localStorage.getItem(KEY);
      return THEMES.includes(v) ? v : 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    apply(theme);
    if (theme !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try { localStorage.setItem(KEY, next); } catch { /* privater Modus */ }
  }, []);

  const cycle = useCallback(() => {
    setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]);
  }, [theme, setTheme]);

  return { theme, setTheme, cycle };
}
