import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  GripVertical, Trash2, Swords, Info, PackagePlus, Lock, Pencil, Sparkles, Flame, Hammer,
} from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { InfoHint } from './ui.jsx';
import { weaponDamageOptions } from '../rules/dice.js';
import { iconForItem } from '../data/icons.js';
import { itemArt } from '../data/itemArt.js';
import InkArt from './InkArt.jsx';
import { SPELL_CATALOG } from '../data/items.js';
import { spellUsesLeft } from '../rules/magic.js';
import { repairCost } from '../rules/economy.js';
import IconPicker from './IconPicker.jsx';

// overlay  = statische, nicht bedienbare Karte (z.B. in der Tischmitte)
// dragging = die Karte, die gerade am Mauszeiger haengt (bekommt die Schraeglage)
// locked   = darf nicht gezogen werden (z.B. ein Zustand im Mumm-Feld — SRD:
//            "cannot be removed until cleared")
// onCast(item, power) = Zauber wirken; `inPaw`: Regel — die Tafel muss in einer
// Pfote gehalten werden, sonst ist der Knopf gesperrt.
// onRepair(item) = einen Nutzungspunkt gegen Pips loeschen (rules/economy.js).
export default function ItemCard({
  item, onChange, onRemove, onStash, onRollDamage, onCast, onRepair, inPaw, dragId, overlay, dragging, locked,
}) {
  const { t, lang } = useLang();
  const [showEffect, setShowEffect] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const Icon = iconForItem(item);
  const art = itemArt(item); // Tusche-Bild, solange kein eigenes Symbol gewaehlt ist
  const dmgOptions = weaponDamageOptions(item);
  // Symbol wechseln darf, wer die Karte auch sonst aendern darf.
  const canPickIcon = !overlay && !!onChange;
  // Umbenennen: eigener Name ueber dem Katalognamen (customName). Der Katalog-
  // name bleibt darunter sichtbar, damit klar ist, ob es z. B. ein leichtes
  // oder schweres Schwert ist. Zustaende behalten ihren festen Namen.
  const canRename = !overlay && !!onChange && item.type !== 'condition';
  const baseName = loc(item.name, lang);
  const customName = typeof item.customName === 'string' ? item.customName.trim() : '';
  const startRename = () => { setDraftName(customName); setRenaming(true); };
  const commitRename = () => {
    setRenaming(false);
    const next = draftName.trim().slice(0, 40);
    if (next === customName) return;
    const { customName: _old, ...rest } = item;
    onChange(next ? { ...rest, customName: next } : rest);
  };

  const drag = useDraggable({ id: dragId ?? item.itemId, disabled: overlay || locked });
  // Bei aktivem Ziehen uebernimmt das DragOverlay die Bewegung — die Quelle
  // bleibt an Ort und Stelle und wird nur ausgegraut (kein doppeltes Kaertchen).
  const style = overlay ? undefined : { opacity: drag.isDragging ? 0.3 : 1 };

  const effectText = loc(item.effect, lang);
  const isSpell = item.type === 'spell';
  const recharge = isSpell ? loc(SPELL_CATALOG[item.key]?.recharge, lang) : '';
  const usesLeft = isSpell ? spellUsesLeft(item) : 0;

  return (
    <div
      ref={overlay ? undefined : drag.setNodeRef}
      style={style}
      className={`item-card type-${item.type}${item.cleared ? ' item-cleared' : ''}${item.size === 2 ? ' item-wide' : ''}${overlay ? ' item-overlay' : ''}${dragging ? ' item-dragging' : ''}${locked ? ' item-locked' : ''}`}
    >
      <div className="item-top">
        {overlay ? null : locked ? (
          <Lock size={14} className="item-grip item-locked-icon" aria-label={t('item.locked')} title={t('item.locked')} />
        ) : (
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
        {canPickIcon ? (
          <button
            type="button"
            className="item-type-icon item-icon-btn"
            // currentTarget ist im State-Updater bereits zurueckgesetzt —
            // den Knoten daher synchron festhalten.
            onClick={(e) => {
              const node = e.currentTarget;
              setPickerAnchor((a) => (a ? null : node));
            }}
            aria-label={t('icon.pick')}
            title={t('icon.pick')}
          >
            {art ? <InkArt src={art} className="item-art" /> : <Icon size={14} />}
          </button>
        ) : art ? (
          <InkArt src={art} className="item-art item-type-icon" />
        ) : (
          <Icon size={14} className="item-type-icon" />
        )}
        {renaming ? (
          <input
            className="item-name-input"
            autoFocus
            maxLength={40}
            value={draftName}
            placeholder={baseName}
            aria-label={t('item.rename')}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') { setDraftName(customName); setRenaming(false); }
            }}
          />
        ) : (
          <span className="item-name">
            {customName || baseName}
            {customName ? <span className="item-subname">{baseName}</span> : null}
          </span>
        )}
        {canRename && !renaming ? (
          <button type="button" className="icon-btn" onClick={startRename} aria-label={t('item.rename')} title={t('item.rename')}>
            <Pencil size={13} />
          </button>
        ) : null}
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
          onRollDamage && !overlay && dmgOptions.length ? (
            dmgOptions.map((o) => (
              <button
                key={o.hands || 'x'}
                type="button"
                className="tag tag-roll"
                onClick={() => onRollDamage(item, o)}
                title={t(o.hands ? `item.rollDamage.${o.hands}` : 'item.rollDamage')}
              >
                <Swords size={11} /> {t('dice.dieLetter')}{o.sides}
                {o.hands ? <span className="tag-hands">{t(`item.hands.${o.hands}`)}</span> : null}
              </button>
            ))
          ) : (
            <span className="tag">
              {t('item.damage')} {item.damage}
            </span>
          )
        ) : null}
        {/* Verstaerkter (W12) / geschwaechter (W4) Angriff — Regel S. 10, gilt
            unabhaengig von der Waffe. */}
        {item.damage && onRollDamage && !overlay && dmgOptions.length ? (
          <>
            <button type="button" className="tag tag-roll tag-enhanced" onClick={() => onRollDamage(item, { sides: 12, mode: 'enhanced' })} title={t('item.enhancedHint')}>
              ▲ {t('dice.dieLetter')}12
            </button>
            <button type="button" className="tag tag-roll tag-impaired" onClick={() => onRollDamage(item, { sides: 4, mode: 'impaired' })} title={t('item.impairedHint')}>
              ▼ {t('dice.dieLetter')}4
            </button>
          </>
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
                disabled={overlay || !onChange}
                onClick={() => onChange({ ...item, usage: { ...item.usage, current: i < item.usage.current ? i : i + 1 } })}
                aria-label={`${t('item.uses')} ${i + 1}`}
              />
            ))}
          </div>
          {overlay ? null : <InfoHint text={t('hint.usage')} />}
        </div>
      ) : null}

      {/* Licht (Regel S. 9): brennt es, markiert der Zeit-Tracker des SL alle 6 Zuege
          eine Nutzung (rules/light.js). Reparatur: 10 % des Preises je Punkt. */}
      {!overlay && onChange && (item.type === 'light' || (onRepair && repairCost(item) != null)) ? (
        <div className="item-actions">
          {item.type === 'light' ? (
            <button
              type="button"
              className={`tag tag-roll${item.lit ? ' tag-lit' : ''}`}
              disabled={!item.lit && item.usage && item.usage.current >= item.usage.max}
              onClick={() => onChange({ ...item, lit: !item.lit })}
              title={t('light.hint')}
            >
              <Flame size={11} /> {item.lit ? t('light.lit') : t('light.light')}
            </button>
          ) : null}
          {onRepair && repairCost(item) != null ? (
            <button type="button" className="tag tag-roll" onClick={() => onRepair(item)} title={t('repair.hint')}>
              <Hammer size={11} /> {t('repair.button', { n: repairCost(item) })}
            </button>
          ) : null}
        </div>
      ) : null}

      {isSpell && onCast && !overlay ? (
        <div className="spell-cast">
          {usesLeft > 0 ? (
            <>
              <span className="spell-cast-label" title={inPaw ? t('spell.castHint') : t('spell.needPaw')}>
                <Sparkles size={12} /> {t('spell.cast')}
              </span>
              {Array.from({ length: Math.min(3, usesLeft) }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className="tag tag-roll"
                  disabled={!inPaw}
                  onClick={() => onCast(item, n)}
                  title={inPaw ? t('spell.powerHint', { n }) : t('spell.needPaw')}
                >
                  {t('spell.power', { n })}
                </button>
              ))}
            </>
          ) : (
            <>
              <span className="spell-depleted">{t('spell.depleted')}</span>
              {onChange ? (
                <button type="button" className="link-btn" onClick={() => onChange({ ...item, usage: { ...item.usage, current: 0 } })}>
                  {t('spell.recharged')}
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {effectText ? (
        <div className="item-effect">
          <button type="button" className="link-btn" onClick={() => setShowEffect((v) => !v)} disabled={overlay}>
            <Info size={12} /> {t('item.effect')}
          </button>
          {showEffect ? <p>{effectText}</p> : null}
          {showEffect && recharge ? <p className="spell-recharge"><strong>{t('spell.recharge')}:</strong> {recharge}</p> : null}
          {showEffect && item.type === 'weapon' && onChange ? (
            <div className="item-flags">
              <label title={t('weapon.silveredHint')}>
                <input type="checkbox" checked={!!item.silvered} onChange={(e) => onChange({ ...item, silvered: e.target.checked })} />
                {t('weapon.silvered')}
              </label>
              <label title={t('weapon.magicHint')}>
                <input type="checkbox" checked={!!item.magic} onChange={(e) => onChange({ ...item, magic: e.target.checked })} />
                {t('weapon.magic')}
              </label>
            </div>
          ) : null}
        </div>
      ) : null}

      {pickerAnchor ? (
        <IconPicker
          item={item}
          anchor={pickerAnchor}
          onPick={(key) => onChange({ ...item, icon: key || undefined })}
          onClose={() => setPickerAnchor(null)}
        />
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
