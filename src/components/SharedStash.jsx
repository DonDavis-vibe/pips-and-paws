import { useState } from 'react';
import { Package2, Trash2, HandCoins, Eye, EyeOff } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import ItemCard from './ItemCard.jsx';
import AddItemMenu from './AddItemMenu.jsx';
import Panel from './Panel.jsx';
import IconPicker from './IconPicker.jsx';
import { iconForItem } from '../data/icons.js';
import EmptyState from './EmptyState.jsx';
import emptyStash from '../assets/empty-stash.jpg';

// Praefix, an dem onDragEnd erkennt: die Karte kommt aus der Mitte, nicht aus dem Raster.
export const STASH_DRAG_PREFIX = 'stash:';

// Die "Tischmitte" — geteiltes Inventar zwischen SL und Spielern.
// mode 'gm':     Loot anlegen / entfernen / leeren
// mode 'player': Gegenstaende sehen und "Nehmen"
// draggable: Spieler duerfen die Karte direkt auf einen Inventarplatz ziehen
// (die Komponente muss dann innerhalb eines DndContext stehen).
export default function SharedStash({ items, mode, onAdd, onRemove, onClear, onTake, onToggleHidden, onItemChange, draggable, takingIds = [] }) {
  const { t } = useLang();
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
          {t('stash.title')}
          {items.length ? <span className="stash-count">{items.length}</span> : null}
          {hiddenCount ? (
            <span className="stash-count stash-count-hidden" title={t('stash.hiddenCount', { n: hiddenCount })}>
              <EyeOff size={12} /> {hiddenCount}
            </span>
          ) : null}
        </>
      )}
      right={mode === 'gm' ? (
        <div className="stash-head-actions">
          <AddItemMenu onAdd={onAdd} triggerLabel={t('stash.addLoot')} triggerClass="btn btn-sm" />
          {items.length ? (
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClear}>
              {t('stash.clear')}
            </button>
          ) : null}
        </div>
      ) : null}
    >
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
