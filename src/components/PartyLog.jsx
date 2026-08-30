import { useState } from 'react';
import { ScrollText, ChevronDown, ChevronRight } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { formatLogEntry, logEntryTone } from '../multiplayer/logFormat.js';

const TONE_CLASS = { ok: 'roll-ok', bad: 'roll-bad', say: 'roll-say' };

// Geteiltes Runden-Log auf dem Spielerbogen. Sichtbar, wenn der SL das Teilen
// aktiviert hat; jeder Spieler kann das Panel fuer sich ein- und ausklappen.
export default function PartyLog({ entries, shared }) {
  const { t } = useLang();
  const [open, setOpen] = useState(true);

  if (!shared) return null;

  const rows = (entries || []).filter((e) => formatLogEntry(e, t));

  return (
    <section className="panel party-log-panel">
      <div className="panel-head">
        <h2>
          <ScrollText size={18} /> {t('party.title')}
        </h2>
        <button type="button" className="link-btn" onClick={() => setOpen((v) => !v)}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {open ? t('party.hide') : t('party.show')}
        </button>
      </div>

      {open ? (
        <ul className="dice-log party-log">
          {rows.length === 0 ? (
            <li className="dice-empty">{t('party.empty')}</li>
          ) : (
            rows.map((e) => (
              <li key={e.id} className={TONE_CLASS[logEntryTone(e)] || ''}>
                <span className="dice-detail">
                  {new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>{formatLogEntry(e, t)}</span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </section>
  );
}
