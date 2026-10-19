import { useEffect, useState } from 'react';
import { Box } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { isDice3dEnabled, setDice3dEnabled, onDice3dChange } from '../utils/dice3d.js';

// Schalter fuer die animierten 3D-Wuerfel (utils/dice3d.js). Standard: an,
// ausser das Geraet bittet um reduzierte Bewegung. Gilt pro Geraet.
export default function Dice3dToggle() {
  const { t } = useLang();
  const [on, setOn] = useState(isDice3dEnabled);
  useEffect(() => onDice3dChange(setOn), []);
  const label = `${t('header.dice3d')}: ${t(on ? 'common.on' : 'common.off')}`;
  return (
    <button
      type="button"
      className={`btn btn-ghost btn-icon-only${on ? ' is-on' : ''}`}
      onClick={() => setDice3dEnabled(!on)}
      aria-pressed={on}
      aria-label={label}
      title={label}
    >
      <Box size={16} />
    </button>
  );
}
