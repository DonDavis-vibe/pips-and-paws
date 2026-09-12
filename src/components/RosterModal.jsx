import { BookCopy, Trash2 } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { Modal } from './ui.jsx';
import { gritForLevel } from '../rules/character.js';

// "Meine Maeuse": Wechsler zwischen allen Boegen, die je in diesem Browser
// aktiv waren (useCharacterRoster.js spiegelt sie automatisch). Zeigt bewusst
// nur die ANDEREN — der aktuelle Bogen ist ja schon offen.
export default function RosterModal({ roster, activeId, onLoad, onRemove, onClose }) {
  const { t } = useLang();
  const others = roster.filter((c) => c.id !== activeId);

  return (
    <Modal title={t('header.roster')} onClose={onClose}>
      {others.length === 0 ? (
        <p className="hint">{t('roster.empty')}</p>
      ) : (
        <div className="gm-grid">
          {others.map((c) => (
            <div key={c.id} className="gm-card">
              <div className="gm-card-id">
                <strong>{c.name || '?'}</strong>
                <span className="gm-bg">
                  {c.background}
                  {c.disposition ? ` · ${c.disposition}` : ''}
                </span>
                <span className="gm-lvl">
                  {t('res.level')} {c.level || 1} · {t('res.grit')} {gritForLevel(c.level || 1)}
                </span>
              </div>
              <div className="gm-actions">
                <button type="button" className="btn btn-sm" onClick={() => onLoad(c)}>
                  <BookCopy size={13} /> {t('roster.load')}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => window.confirm(t('roster.removeConfirm', { name: c.name || '?' })) && onRemove(c.id)}
                >
                  <Trash2 size={13} /> {t('gm.local.remove')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
