import { useEffect, useRef } from 'react';

// Kleiner Nachrichtenkanal zwischen SL-Panels, die sich sonst nicht kennen
// (z. B. Generator -> Notizen / Handout-Bibliothek). Jedes Panel haelt seinen
// eigenen Zustand; das Ziel meldet sich per useGmEvent an und schreibt selbst.
const PREFIX = 'pips-paws:';

export const emitGm = (name, detail) => window.dispatchEvent(new CustomEvent(PREFIX + name, { detail }));

export function useGmEvent(name, handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const fn = (e) => ref.current(e.detail);
    window.addEventListener(PREFIX + name, fn);
    return () => window.removeEventListener(PREFIX + name, fn);
  }, [name]);
}
