import { ScrollText } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { formatLogEntry, logEntryTone } from '../multiplayer/logFormat.js';
import Panel from './Panel.jsx';

const TONE_CLASS = { ok: 'roll-ok', bad: 'roll-bad', say: 'roll-say' };

// Geteiltes Runden-Log auf dem Spielerbogen. Sichtbar, wenn der SL das Teilen
// aktiviert hat; einklappbar wie jedes Panel.
export default function PartyLog({ entries, shared }) {
  const { t } = useLang();
  if (!shared) return null;

  const rows = (entries || []).filter((e) => formatLogEntry(e, t));

  return (
    <Panel id="party-log" icon={ScrollText} title={t('party.title')}>
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
    </Panel>
  );
}
