import { useState } from 'react';
import {
  Package2, Trash2, HandCoins, Eye, EyeOff, Settings2,
} from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import ItemCard from './ItemCard.jsx';
import AddItemMenu from './AddItemMenu.jsx';
import Panel from './Panel.jsx';
import IconPicker from './IconPicker.jsx';
import { iconForItem } from '../data/icons.js';
import EmptyState from './EmptyState.jsx';
import emptyStash from '../assets/ink/stash.webp';
import { stashUsed } from '../rules/stash.js';

// Praefix, an dem onDragEnd erkennt: die Karte kommt aus der Mitte, nicht aus dem Raster.
export const STASH_DRAG_PREFIX = 'stash:';

// Die "Tischmitte" — geteiltes Inventar zwischen SL und Spielern.
// mode 'gm':     Loot anlegen / entfernen / leeren
// mode 'player': Gegenstaende sehen und "Nehmen"
// draggable: Spieler duerfen die Karte direkt auf einen Inventarplatz ziehen
// (die Komponente muss dann innerhalb eines DndContext stehen).
export default function SharedStash({
  items, mode, cfg, onCfg, onAdd, onRemove, onClear, onTake, onToggleHidden, onItemChange, draggable, takingIds = [],
}) {
  const { t } = useLang();
  const [cfgOpen, setCfgOpen] = useState(false);
  // Beim SL zaehlt alles (auch Verstecktes), beim Spieler meldet der SL die belegten Plaetze mit.
  const used = mode === 'gm' ? stashUsed(items) : (cfg?.used ?? stashUsed(items));
  const capacity = cfg?.capacity || 0;
  const [iconFor, setIconFor] = useState(null); // { id, anchor }
  // Versteckte Gegenstaende gehen gar nicht erst an die Spieler raus (siehe
  // commitStash) — der SL kann die Mitte also in Ruhe vorbereiten.
  const hiddenCount = mode === 'gm' ? items.filter((i) => i.hidden).length : 0;

  return (
    <Panel
      id={`stash-${mode}`}
      icon={Package2}
      className="stash-panel"
      title={(
        <>
          {cfg?.name || t('stash.title')}
          {capacity ? (
            <span className={`stash-count${used > capacity ? ' stash-count-over' : ''}`} title={t('stash.capacityHint')}>
              {used}/{capacity}
            </span>
          ) : (items.length ? <span className="stash-count">{items.length}</span> : null)}
          {hiddenCount ? (
            <span className="stash-count stash-count-hidden" title={t('stash.hiddenCount', { n: hiddenCount })}>
              <EyeOff size={12} /> {hiddenCount}
            </span>
          ) : null}
        </>
      )}
      right={mode === 'gm' ? (
        <div className="stash-head-actions">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCfgOpen((v) => !v)} aria-expanded={cfgOpen} title={t('stash.settings')}>
            <Settings2 size={14} />
          </button>
          <AddItemMenu onAdd={onAdd} triggerLabel={t('stash.addLoot')} triggerClass="btn btn-sm" />
          {items.length ? (
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClear}>
              {t('stash.clear')}
            </button>
          ) : null}
        </div>
      ) : null}
    >
      {mode === 'gm' && cfgOpen ? (
        <div className="stash-cfg">
          <label>
            <span>{t('stash.cfgName')}</span>
            <input
              type="text"
              className="text-input"
              maxLength={40}
              placeholder={t('stash.title')}
              defaultValue={cfg?.name || ''}
              onBlur={(e) => onCfg?.({ name: e.target.value })}
            />
          </label>
          <label>
            <span>{t('stash.cfgCapacity')}</span>
            <input
              type="number"
              min="0"
              max="99"
              className="text-input"
              defaultValue={capacity}
              onBlur={(e) => onCfg?.({ capacity: e.target.value })}
            />
          </label>
          <p className="hint">{t('stash.cfgHint')}</p>
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState img={emptyStash} alt="">{mode === 'gm' ? t('stash.emptyGm') : t('stash.emptyPlayer')}</EmptyState>
      ) : (
        <div className="stash-grid">
          {items.map((it) => (
            <div key={it.itemId} className={`stash-item${it.hidden ? ' stash-item-hidden' : ''}`}>
              {draggable ? (
                <ItemCard item={it} dragId={`${STASH_DRAG_PREFIX}${it.itemId}`} />
              ) : (
                <ItemCard item={it} overlay />
              )}
              {mode === 'gm' ? (
                <div className="stash-item-actions">
                  {/* Vorbereiteter Loot soll schon richtig aussehen, wenn er
                      beim Spieler ankommt — darum Symbolwahl auch fuer den SL. */}
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost stash-icon-btn"
                    onClick={(e) => setIconFor(iconFor?.id === it.itemId ? null : { id: it.itemId, anchor: e.currentTarget })}
                    aria-label={t('icon.pick')}
                    title={t('icon.pick')}
                  >
                    {(() => {
                      const Cmp = iconForItem(it);
                      return <Cmp size={13} />;
                    })()}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm${it.hidden ? '' : ' btn-ghost'}`}
                    onClick={() => onToggleHidden(it.itemId)}
                    title={it.hidden ? t('stash.reveal.hint') : t('stash.hide.hint')}
                  >
                    {it.hidden ? <><EyeOff size={13} /> {t('stash.hidden')}</> : <><Eye size={13} /> {t('stash.visible')}</>}
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => onRemove(it.itemId)}>
                    <Trash2 size={13} /> {t('item.remove')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={takingIds.includes(it.itemId)}
                  onClick={() => onTake(it.itemId)}
                >
                  <HandCoins size={13} /> {t('stash.take')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {iconFor ? (
        <IconPicker
          item={items.find((i) => i.itemId === iconFor.id) || {}}
          anchor={iconFor.anchor}
          onPick={(key) => {
            const target = items.find((i) => i.itemId === iconFor.id);
            if (target) onItemChange({ ...target, icon: key || undefined });
          }}
          onClose={() => setIconFor(null)}
        />
      ) : null}
    </Panel>
  );
}
