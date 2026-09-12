import { useCallback, useEffect, useState } from 'react';

const KEY = 'pips-paws-skin';
// 'print' = Druckbogen-Look (Standard), 'classic' = das fruehere App-Design.
export const SKINS = ['print', 'classic'];

function apply(skin) {
  document.documentElement.setAttribute('data-skin', skin);
}

// Unabhaengig vom Hell/Dunkel-Thema: welche Gestaltung die Oberflaeche traegt.
// Gemerkt im localStorage, angewandt an <html data-skin> (index.html setzt
// den Wert schon vor dem ersten Paint, damit nichts flackert).
export function useSkin() {
  const [skin, setSkinState] = useState(() => {
    try {
      const v = localStorage.getItem(KEY);
      return SKINS.includes(v) ? v : 'print';
    } catch {
      return 'print';
    }
  });

  useEffect(() => { apply(skin); }, [skin]);

  const setSkin = useCallback((next) => {
    setSkinState(next);
    try { localStorage.setItem(KEY, next); } catch { /* privater Modus */ }
  }, []);

  const toggle = useCallback(() => {
    setSkin(skin === 'print' ? 'classic' : 'print');
  }, [skin, setSkin]);

  return { skin, setSkin, toggle };
}
