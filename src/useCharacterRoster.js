import { useCallback, useEffect, useState } from 'react';
import { readJSON, writeJSON } from './utils/storage.js';

const ROSTER_KEY = 'pips-paws-roster-v1';

// Alle Maeuse, die je auf diesem Geraet aktiv waren — automatisch gespiegelt
// (App.jsx ruft `mirror` bei jeder Aenderung des aktiven Bogens auf), damit
// man zwischen mehreren eigenen Boegen wechseln kann, ohne manuell "sichern"
// zu muessen. Der zuletzt aktive Bogen bleibt zusaetzlich unter dem separaten
// Solo-Speicher (STORAGE_KEY in App.jsx), der beim naechsten Start laedt.
export function useCharacterRoster() {
  const [roster, setRoster] = useState(() => {
    const saved = readJSON(ROSTER_KEY);
    return Array.isArray(saved) ? saved : [];
  });

  useEffect(() => { writeJSON(ROSTER_KEY, roster); }, [roster]);

  const mirror = useCallback((character) => {
    setRoster((list) => {
      const idx = list.findIndex((c) => c.id === character.id);
      if (idx === -1) return [...list, character];
      if (list[idx] === character) return list;
      const next = [...list];
      next[idx] = character;
      return next;
    });
  }, []);

  const remove = useCallback((id) => {
    setRoster((list) => list.filter((c) => c.id !== id));
  }, []);

  return { roster, mirror, remove };
}
