import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  GripVertical, Trash2, Swords, Shield, Sparkles, Flame, Apple, Package, AlertTriangle, Info, PackagePlus,
} from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { InfoHint } from './ui.jsx';

const TYPE_ICON = {
  weapon: Swords,
  armour: Shield,
  spell: Sparkles,
  light: Flame,
  ration: Apple,
  condition: AlertTriangle,
  standard: Package,
};

export default function ItemCard({ item, onChange, onRemove, onStash, dragId, overlay }) {
  const { t, lang } = useLang();
  const [showEffect, setShowEffect] = useState(false);
  const Icon = TYPE_ICON[item.type] || Package;

  const drag = useDraggable({ id: dragId ?? item.itemId, disabled: overlay });
  // Bei aktivem Ziehen uebernimmt das DragOverlay die Bewegung — die Quelle
  // bleibt an Ort und Stelle und wird nur ausgegraut (kein doppeltes Kaertchen).
  const style = overlay ? undefined : { opacity: drag.isDragging ? 0.3 : 1 };

  const effectText = loc(item.effect, lang);

  return (
    <div
      ref={overlay ? undefined : drag.setNodeRef}
      style={style}
      className={`item-card type-${item.type}${item.cleared ? ' item-cleared' : ''}${item.size === 2 ? ' item-wide' : ''}${overlay ? ' item-overlay' : ''}`}
    >
      <div className="item-top">
        {overlay ? null : (
          <button
            type="button"
            className="item-grip"
            aria-label="drag"
            ref={drag.setActivatorNodeRef}
            {...drag.listeners}
            {...drag.attributes}
          >
            <GripVertical size={14} />
          </button>
        )}
        <Icon size={14} className="item-type-icon" />
        <span className="item-name">{loc(item.name, lang)}</span>
        {!overlay && onStash && item.type !== 'condition' ? (
          <button type="button" className="icon-btn" onClick={() => onStash(item)} aria-label={t('stash.send')} title={t('stash.send')}>
            <PackagePlus size={14} />
          </button>
        ) : null}
        {!overlay && onRemove && (
          <button type="button" className="icon-btn item-del" onClick={onRemove} aria-label={t('item.remove')}>
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="item-meta">
        {item.damage ? (
          <span className="tag">
            {t('item.damage')} {item.damage}
          </span>
        ) : null}
        {item.defense ? (
          <span className="tag">
            {t('item.defense')} {item.defense}
          </span>
        ) : null}
        {item.size === 2 ? <span className="tag">{t('item.twoSlots')}</span> : null}
      </div>

      {item.usage ? (
        <div className="usage-row">
          <div className="usage-dots" aria-label={t('item.uses')}>
            {Array.from({ length: item.usage.max }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`dot${i < item.usage.current ? ' dot-on' : ''}`}
                disabled={overlay}
                onClick={() => onChange({ ...item, usage: { ...item.usage, current: i < item.usage.current ? i : i + 1 } })}
                aria-label={`${t('item.uses')} ${i + 1}`}
              />
            ))}
          </div>
          {overlay ? null : <InfoHint text={t('hint.usage')} />}
        </div>
      ) : null}

      {effectText ? (
        <div className="item-effect">
          <button type="button" className="link-btn" onClick={() => setShowEffect((v) => !v)} disabled={overlay}>
            <Info size={12} /> {t('item.effect')}
          </button>
          {showEffect ? <p>{effectText}</p> : null}
        </div>
      ) : null}

      {item.type === 'condition' && !overlay ? (
        <button
          type="button"
          className="link-btn item-clear-toggle"
          onClick={() => onChange({ ...item, cleared: !item.cleared })}
        >
          {item.cleared ? t('item.markActive') : t('item.markCleared')}
        </button>
      ) : null}
    </div>
  );
}
