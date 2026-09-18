import { useEffect, useRef, useState } from 'react';
import { Map, Maximize2, Minimize2 } from 'lucide-react';
import { useLang } from '../../i18n/index.jsx';
import Panel from '../Panel.jsx';
import BattleMapCanvas from './BattleMapCanvas.jsx';

// Reine Anzeige fuer die Spieler: derselbe Leinwand-Motor wie beim SL, aber
// ohne Werkzeugleiste und mit einem Besitzer-Tag, das niemals zu einer Figur
// passt — die Engine erlaubt dann zwar Zoom/Verschieben, aber kein Ziehen von
// Figuren (siehe `darfBewegen` in battlemap.js).
export default function PartyBattleMap({ map }) {
  const { t } = useLang();
  const apiRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!map || !apiRef.current) return;
    apiRef.current.applyState(
      { raster: map.raster, figuren: map.figuren, formen: map.formen, nebel: map.nebel },
      map.dataUrl,
    );
  }, [map]);

  useEffect(() => {
    if (!apiRef.current) return;
    requestAnimationFrame(() => apiRef.current?.einpassen());
  }, [fullscreen]);

  if (!map) return null;

  return (
    <Panel
      id="party-map"
      icon={Map}
      className={`battlemap-panel${fullscreen ? ' battlemap-fullscreen' : ''}`}
      title={map.name || t('map.title')}
      right={(
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFullscreen((f) => !f)}>
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      )}
    >
      <div className="battlemap-stage">
        <BattleMapCanvas
          besitzer="__readonly__"
          nebelDeckend
          onReady={(api) => {
            apiRef.current = api;
            if (api && map) {
              api.applyState(
                { raster: map.raster, figuren: map.figuren, formen: map.formen, nebel: map.nebel },
                map.dataUrl,
              );
              api.einpassen();
            }
          }}
        />
      </div>
    </Panel>
  );
}
