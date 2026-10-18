// Tusche-Bilder der Gegenstaende und Zauber (src/assets/ink/items/<key>.webp, key wie
// in data/items.js: Katalogschluessel bzw. Zauberschluessel). Transparente Linien
// wie die uebrigen Tusche-Grafiken. Entstehung: tools/item-art/.
const files = import.meta.glob('../assets/ink/items/*.webp', { eager: true, query: '?url', import: 'default' });

const BY_KEY = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop().replace('.webp', ''), url]),
);

// Ein vom Spieler gewaehltes Symbol (item.icon) hat Vorrang vor dem Bild.
export const itemArt = (item) => (item && !item.icon && item.key ? BY_KEY[item.key] || null : null);
