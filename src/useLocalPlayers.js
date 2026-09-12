import { useCallback, useEffect, useState } from 'react';
import { readJSON, writeJSON } from './utils/storage.js';
import { newId } from './rules/character.js';

const KEY = 'pips-paws-local-players-v1';

// Charakterboegen, die der SL selbst am Tisch verwaltet (offline, ohne
// Multiplayer-Verbindung) — z. B. weil Spieler kein eigenes Geraet dabeihaben.
// Getrennt vom eigenen Solo-Bogen (STORAGE_KEY in App.jsx) und unabhaengig
// davon, ob gerade eine Multiplayer-Sitzung laeuft.
export function useLocalPlayers() {
  const [players, setPlayers] = useState(() => {
    const saved = readJSON(KEY);
    return Array.isArray(saved) ? saved : [];
  });

  useEffect(() => { writeJSON(KEY, players); }, [players]);

  const addPlayer = useCallback((character) => {
    setPlayers((list) => {
      // Import kann auf eine bereits vorhandene id treffen (z. B. zweimal
      // dieselbe Datei geladen) — dann bekommt die neue Kopie eine frische id,
      // statt den vorhandenen Bogen zu ueberschreiben.
      const clash = list.some((c) => c.id === character.id);
      const next = clash ? { ...character, id: newId('c') } : character;
      return [...list, next];
    });
  }, []);

  const updatePlayer = useCallback((id, updater) => {
    setPlayers((list) => list.map((c) => (c.id === id
      ? (typeof updater === 'function' ? updater(c) : updater)
      : c)));
  }, []);

  const removePlayer = useCallback((id) => {
    setPlayers((list) => list.filter((c) => c.id !== id));
  }, []);

  return {
    players, addPlayer, updatePlayer, removePlayer,
  };
}
