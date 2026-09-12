import { useEffect, useRef, useState } from 'react';
import {
  Music, Headphones, Play, Square, TrendingDown, Upload, Trash2, Volume1, Volume2, VolumeX,
} from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import Panel from './Panel.jsx';
import { FX_KINDS } from '../utils/sound.js';
import { listCustomSounds, addCustomSound, removeCustomSound, MAX_BYTES } from '../utils/customSounds.js';

const FX_ICON_COLOR = {
  fanfare: 'var(--gold)', dramatic: 'var(--bad)', coins: 'var(--ok)', door: 'var(--accent-2)', blade: 'var(--accent)', bolt: 'var(--warn)', bell: 'var(--ink-dim)',
};

// Soundboard des SL: eingebaute Kurz-Effekte (freie CC0-Sounds von Kenney.nl,
// siehe src/assets/sfx/CREDITS.txt) fuer Erzaehl-Momente (Tuer, Muenzen,
// Klinge, Fanfare, dramatischer Stich, Riegel) plus eine Tisch-Glocke, dazu
// eigene, lokal hochgeladene Ambient-/Musik-Dateien. Ein Klick spielt bei
// allen verbundenen Spielern (und beim SL selbst); der Kopfhoerer-Knopf hoert
// nur der SL selbst vor.
export default function GmSoundboard({ mp, notify }) {
  const { t } = useLang();
  const [vol, setVol] = useState(0.6);
  const [customs, setCustoms] = useState([]);
  const fileInput = useRef(null);

  const refresh = () => listCustomSounds().then(setCustoms).catch(() => setCustoms([]));
  useEffect(() => { refresh(); }, []);

  const onVolume = (v) => {
    setVol(v);
    mp.setSoundVolumeShared(v);
  };

  const onUpload = async (file) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      notify?.(t('gm.sound.custom.tooBig'), 'bad');
      return;
    }
    try {
      await addCustomSound(file.name.replace(/\.[^.]+$/, ''), file);
      await refresh();
    } catch {
      notify?.(t('gm.sound.custom.uploadFailed'), 'bad');
    }
  };

  const onRemove = async (id) => {
    if (!window.confirm(t('gm.sound.custom.removeConfirm'))) return;
    await removeCustomSound(id);
    await refresh();
  };

  return (
    <Panel id="gm-sound" icon={Music} title={t('gm.sound.title')}>
      <p className="hint">{t('gm.sound.hint')}</p>

      <div className="gm-sound-row">
        {FX_KINDS.map((kind) => (
          <span key={kind} className="gm-sound-fx">
            <span className="gm-sound-fx-label" style={{ color: FX_ICON_COLOR[kind] }}>{t(`gm.sound.fx.${kind}`)}</span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => mp.previewSoundFx(kind, vol)}
              aria-label={t('gm.sound.preview')}
              title={t('gm.sound.preview')}
            >
              <Headphones size={14} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => mp.sendSoundFx(kind, vol)}
              aria-label={t('gm.sound.sendAll')}
              title={t('gm.sound.sendAll')}
            >
              <Play size={14} />
            </button>
          </span>
        ))}
      </div>

      <div className="gm-sound-controls">
        <button type="button" className="btn btn-sm btn-ghost" onClick={mp.fadeOutSoundShared}>
          <TrendingDown size={14} /> {t('gm.sound.fadeOut')}
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={mp.stopSoundShared}>
          <Square size={14} /> {t('gm.sound.stopAll')}
        </button>
        <span className="gm-sound-vol">
          {vol === 0 ? <VolumeX size={15} /> : vol < 0.5 ? <Volume1 size={15} /> : <Volume2 size={15} />}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={vol}
            onChange={(e) => onVolume(parseFloat(e.target.value))}
            aria-label={t('gm.sound.volume')}
            title={t('gm.sound.volume')}
          />
        </span>
      </div>

      <div className="sub-h">{t('gm.sound.custom.title')}</div>
      <p className="hint">{t('gm.sound.custom.hint')}</p>

      {customs.length === 0 ? (
        <p className="hint">{t('gm.sound.custom.empty')}</p>
      ) : (
        <ul className="gm-sound-custom-list">
          {customs.map((s) => (
            <li key={s.id}>
              <span className="gm-sound-custom-name" title={s.name}>{s.name}</span>
              <button type="button" className="icon-btn" onClick={() => mp.previewCustomSound(s.blob, vol)} aria-label={t('gm.sound.preview')} title={t('gm.sound.preview')}>
                <Headphones size={14} />
              </button>
              <button type="button" className="icon-btn" onClick={() => mp.sendCustomSound(s.name, s.blob, vol)} aria-label={t('gm.sound.sendAll')} title={t('gm.sound.sendAll')}>
                <Play size={14} />
              </button>
              <button type="button" className="icon-btn" onClick={() => onRemove(s.id)} aria-label={t('gm.local.remove')} title={t('gm.local.remove')}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()}>
        <Upload size={15} /> {t('gm.sound.custom.upload')}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => {
          onUpload(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </Panel>
  );
}
