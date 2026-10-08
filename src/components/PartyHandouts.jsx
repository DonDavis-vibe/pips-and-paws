import { FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import Panel from './Panel.jsx';
import { Modal } from './ui.jsx';

// Handouts, die der SL gezeigt hat. Ein neues oeffnet sich als Popup (wie ein
// uebergebener Zettel, siehe HandoutPopup); danach bleibt es hier zum
// Nachlesen — auf dem eigenen Geraet, auch nach einem Reload. Loeschen
// entfernt nur die lokale Kopie.
export function HandoutView({ handout }) {
  return (
    <div className="handout-body">
      {handout.image ? <img className="handout-image" src={handout.image} alt={handout.title} /> : null}
      {handout.text ? <p className="handout-text">{handout.text}</p> : null}
    </div>
  );
}

export function HandoutPopup({ handout, onClose }) {
  if (!handout) return null;
  return (
    <Modal title={handout.title} onClose={onClose} wide>
      <HandoutView handout={handout} />
    </Modal>
  );
}

export default function PartyHandouts({ handouts, onOpen, onRemove }) {
  const { t } = useLang();
  const list = handouts || [];
  if (list.length === 0) return null;

  return (
    <Panel
      id="party-handouts"
      icon={FileText}
      className="party-handouts-panel"
      title={(
        <>
          {t('handout.playerTitle')}
          <span className="stash-count">{list.length}</span>
        </>
      )}
    >
      <ul className="handout-list">
        {list.map((h) => (
          <li key={h.id} className="handout-item">
            <div className="handout-head">
              {h.kind === 'image' ? <ImageIcon size={15} /> : <FileText size={15} />}
              <button type="button" className="handout-title" onClick={() => onOpen(h.id)}>{h.title}</button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onRemove(h.id)}
                aria-label={t('item.remove')}
                title={t('item.remove')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
