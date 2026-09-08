import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { ICON_GROUPS, iconForItem } from '../data/icons.js';

// Symbolauswahl fuer eine Gegenstandskarte. Haengt wie InfoHint im Portal an
// document.body, damit das Fenster nicht am overflow:hidden der Karte
// abgeschnitten wird.
export default function IconPicker({ item, onPick, onClose, anchor }) {
  const { t } = useLang();
  const popRef = useRef(null);
  const [pos, setPos] = useState(null); // null = noch nicht vermessen

  // Erst nach dem Einhaengen messen: die echte Hoehe haengt davon ab, wie viel
  // vom Inhalt die max-height durchlaesst. Mit festen Werten ragte das Fenster
  // am unteren Rand heraus.
  useEffect(() => {
    const rect = anchor?.getBoundingClientRect();
    const pop = popRef.current;
    if (!rect || !pop) return;
    const { width: W, height: H } = pop.getBoundingClientRect();
    const M = 8;
    const below = rect.bottom + 6;
    // unter das Symbol, sonst darueber, sonst so weit unten wie es passt
    let top = below;
    if (below + H > window.innerHeight - M) {
      const above = rect.top - H - 6;
      top = above >= M ? above : Math.max(M, window.innerHeight - H - M);
    }
    const left = Math.min(Math.max(M, rect.left - M), window.innerWidth - W - M);
    setPos({ top, left });
  }, [anchor]);

  useEffect(() => {
    const onDown = (e) => {
      if (!popRef.current?.contains(e.target) && e.target !== anchor) onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, anchor]);

  const Current = iconForItem(item);

  return createPortal(
    <div
      ref={popRef}
      className="icon-picker"
      // vor dem Vermessen unsichtbar, sonst blitzt es kurz in der Ecke auf
      style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: 'hidden' }}
      role="dialog"
      aria-label={t('icon.pick')}
    >
      <div className="icon-picker-head">
        <span>{t('icon.pick')}</span>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            onPick(null);
            onClose();
          }}
          title={t('icon.resetHint')}
        >
          <RotateCcw size={12} /> {t('icon.reset')}
        </button>
      </div>

      <div className="icon-picker-body">
        {ICON_GROUPS.map((group) => (
          <div key={group.key} className="icon-group">
            <div className="icon-group-title">{t(`icon.group.${group.key}`)}</div>
            <div className="icon-grid">
              {Object.entries(group.icons).map(([key, Cmp]) => (
                <button
                  key={key}
                  type="button"
                  className={`icon-choice${item.icon === key ? ' icon-choice-on' : ''}`}
                  onClick={() => {
                    onPick(key);
                    onClose();
                  }}
                  aria-label={key}
                  title={key}
                >
                  <Cmp size={16} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="icon-picker-foot">
        <Current size={14} /> {t('icon.current')}
      </div>
    </div>,
    document.body,
  );
}
