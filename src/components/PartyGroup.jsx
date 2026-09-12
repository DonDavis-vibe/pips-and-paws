import { Users, Heart } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import Panel from './Panel.jsx';

// Kompakte Sicht der Spieler aufeinander — nur wenn der SL sie teilt (siehe
// GmDashboard). Bewusst nur Name, TP und Zustaende, keine Attribute, kein
// Inventar: das bleibt Sache des jeweiligen Bogens und des SL.
export default function PartyGroup({ members, myPeerId }) {
  const { t, lang } = useLang();
  const others = (members || []).filter((m) => m.peerId !== myPeerId);
  if (others.length === 0) return null;

  return (
    <Panel id="party-group" icon={Users} className="party-group-panel" title={(
      <>
        {t('group.title')}
        <span className="stash-count">{others.length}</span>
      </>
    )}>
      <div className="party-group-list">
        {others.map((m) => {
          const max = m.hp?.max > 0 ? m.hp.max : 1;
          const pct = Math.max(0, Math.min(100, ((m.hp?.current ?? 0) / max) * 100));
          const hpColor = pct > 50 ? 'var(--ok)' : pct > 25 ? 'var(--warn)' : 'var(--bad)';
          return (
            <div key={m.peerId} className="party-group-member">
              <div className="party-group-head">
                <strong>{m.name || '?'}</strong>
                <span className="party-group-hp" style={{ color: hpColor }}>
                  <Heart size={12} /> {m.hp?.current ?? 0} / {m.hp?.max ?? 0}
                </span>
              </div>
              <div className="hp-track party-group-track">
                <div className="hp-fill" style={{ width: `${pct}%`, background: hpColor }} />
              </div>
              {m.conditions?.length ? (
                <div className="party-group-conditions">
                  {m.conditions.map((c, i) => (
                    <span key={c.key || i} className="chip chip-bad">{loc(c.name, lang)}</span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
