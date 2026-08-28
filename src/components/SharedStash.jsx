import { Package2, Trash2, HandCoins } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import ItemCard from './ItemCard.jsx';
import AddItemMenu from './AddItemMenu.jsx';

// Die "Tischmitte" — geteiltes Inventar zwischen SL und Spielern.
// mode 'gm':     Loot anlegen / entfernen / leeren
// mode 'player': Gegenstaende sehen und "Nehmen"
export default function SharedStash({ items, mode, onAdd, onRemove, onClear, onTake, takingIds = [] }) {
  const { t } = useLang();

  return (
    <section className="panel stash-panel">
      <div className="panel-head">
        <h2>
          <Package2 size={18} /> {t('stash.title')}
          {items.length ? <span className="stash-count">{items.length}</span> : null}
        </h2>
        {mode === 'gm' ? (
          <div className="stash-head-actions">
            <AddItemMenu onAdd={onAdd} triggerLabel={t('stash.addLoot')} triggerClass="btn btn-sm" />
            {items.length ? (
              <button type="button" className="btn btn-sm btn-ghost" onClick={onClear}>
                {t('stash.clear')}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="hint">{mode === 'gm' ? t('stash.emptyGm') : t('stash.emptyPlayer')}</p>
      ) : (
        <div className="stash-grid">
          {items.map((it) => (
            <div key={it.itemId} className="stash-item">
              <ItemCard item={it} overlay />
              {mode === 'gm' ? (
                <button type="button" className="btn btn-sm btn-danger" onClick={() => onRemove(it.itemId)}>
                  <Trash2 size={13} /> {t('item.remove')}
                </button>
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
    </section>
  );
}
