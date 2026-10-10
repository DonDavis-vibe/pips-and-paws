import { creatureArt } from '../../data/creatureArt.js';

// Figuren mit `bildKey` (Kreatur-Token) bekommen ihr Tusche-Portrait in der
// Leinwand. Das Bild reist nicht im Kartenzustand mit: Der SL und die Spieler
// haben dieselben Assets und schlagen es hier ueber den Schluessel nach.
export function syncTokenArt(api, figuren) {
  if (!api) return;
  (figuren || []).forEach((f) => {
    if (f.bildKey) api.setFigurBild(f.id, creatureArt(f.bildKey));
  });
}
