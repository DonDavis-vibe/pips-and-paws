import { useState } from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { getMyVolume, setMyVolume } from '../utils/sound.js';

// Eigene Lautstaerke: gilt fuer alles, was man hoert (SL-Soundboard und die
// eigenen Wuerfel-/Treffer-Toene), unabhaengig von der Rolle. Legt sich als
// Gesamtpegel ueber die Mischung des SL, statt sie zu ersetzen — bleibt eine
// Geraete-Einstellung (localStorage), landet nie in der Charakter-Datei.
export default function VolumeControl() {
  const { t } = useLang();
  const [vol, setVol] = useState(() => getMyVolume());

  const onChange = (v) => {
    setVol(v);
    setMyVolume(v);
  };

  const Icon = vol === 0 ? VolumeX : vol < 0.5 ? Volume1 : Volume2;

  return (
    <span className="volume-switch" title={t('header.volume')}>
      <Icon size={15} />
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={vol}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={t('header.volume')}
      />
    </span>
  );
}
