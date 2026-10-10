// Tusche-Portraits der SRD-Kreaturen (src/assets/ink/creatures/<key>.webp, key wie
// in data/creatures.js). Transparente Linien wie die uebrigen Tusche-Grafiken.
const files = import.meta.glob('../assets/ink/creatures/*.webp', { eager: true, query: '?url', import: 'default' });

const BY_KEY = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop().replace('.webp', ''), url]),
);

export const creatureArt = (key) => BY_KEY[key] || null;
