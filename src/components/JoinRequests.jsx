import { UserCheck, UserX } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';

// Beitrittsanfragen, die der SL noch zulassen oder ablehnen muss
// (Raum-Einstellung "Beitritt bestaetigen"). Steht im Multiplayer-Fenster und
// oben im Dashboard, damit eine Anfrage nicht untergeht.
export default function JoinRequests({ mp }) {
  const { t } = useLang();
  if (!mp.pending?.length) return null;
  return (
    <div className="join-requests" role="alert">
      <strong>{t('mp.pending.title', { n: mp.pending.length })}</strong>
      <ul>
        {mp.pending.map((p) => (
          <li key={p.peerId}>
            <span className="join-name">{p.name || t('mp.pending.unnamed')}</span>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => mp.approvePending(p.peerId)}>
              <UserCheck size={14} /> {t('mp.pending.allow')}
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => mp.rejectPending(p.peerId)}>
              <UserX size={14} /> {t('mp.pending.deny')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
