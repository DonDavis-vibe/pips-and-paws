import { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import placeholder from '../assets/portrait-placeholder.jpg';
import { readPortrait } from '../utils/portrait.js';

// Charakterbild. Mit onChange = bearbeitbar (Spieler), ohne = nur Anzeige (SL).
export default function Portrait({ src, onChange, notify, size = 'md' }) {
  const { t } = useLang();
  const inputRef = useRef(null);
  const editable = typeof onChange === 'function';

  const pick = async (file) => {
    if (!file) return;
    try {
      onChange(await readPortrait(file));
    } catch {
      notify?.(t('portrait.failed'), 'bad');
    }
  };

  return (
    <div className={`portrait portrait-${size}${editable ? ' portrait-editable' : ''}`}>
      <img
        src={src || placeholder}
        alt={src ? t('portrait.alt') : t('portrait.placeholderAlt')}
        className={src ? '' : 'portrait-is-placeholder'}
        draggable="false"
      />
      {editable ? (
        <>
          <button
            type="button"
            className="portrait-edit"
            onClick={() => inputRef.current?.click()}
            aria-label={src ? t('portrait.change') : t('portrait.add')}
            title={src ? t('portrait.change') : t('portrait.add')}
          >
            <Camera size={size === 'sm' ? 13 : 15} />
          </button>
          {src ? (
            <button
              type="button"
              className="portrait-remove"
              onClick={() => onChange('')}
              aria-label={t('portrait.remove')}
              title={t('portrait.remove')}
            >
              <X size={12} />
            </button>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </>
      ) : null}
    </div>
  );
}
