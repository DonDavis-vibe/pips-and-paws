import { Eye } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import Panel from './Panel.jsx';

// Was der Spielleiter sichtbar geschaltet hat: WER am Tisch steht.
// Bewusst ohne Trefferpunkte — die bleiben beim SL.
export default function PartyNpcs({ npcs }) {
  const { t } = useLang();
  if (!npcs || npcs.length === 0) return null;

  return (
    <Panel id="party-npcs" icon={Eye} className="party-npcs-panel" title={(
      <>
        {t('npcs.title')}
        <span className="stash-count">{npcs.length}</span>
      </>
    )}>
      <div className="party-npc-list">
        {npcs.map((n) => (
          <div key={n.id} className="party-npc">
            <strong>{n.name}</strong>
            {n.note ? <span className="party-npc-note">{n.note}</span> : null}
          </div>
        ))}
      </div>
    </Panel>
  );
}
