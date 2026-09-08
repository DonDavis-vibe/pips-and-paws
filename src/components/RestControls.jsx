import { Moon, Lock } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { applyRest, REST_KINDS } from '../rules/rest.js';

// Rast-Knoepfe des Spielers. Die Rechnung steckt in rules/rest.js, damit der SL
// per Befehl exakt dieselbe ausloesen kann.
// locked = der SL hat die Rast fuer die Runde an sich gezogen.
export default function RestControls({ character, setCharacter, notify, locked }) {
  const { t } = useLang();

  const rest = (kind) => {
    const { character: next, msg, noRation } = applyRest(character, kind);
    setCharacter(next);
    const vars = msg.vars.attrKey ? { ...msg.vars, attr: t(`attr.${msg.vars.attrKey}`) } : msg.vars;
    notify(t(msg.key, vars) + (noRation && kind === 'long' ? ` — ${t('rest.noRation')}` : ''), 'ok');
  };

  return (
    <div className="rest-controls">
      <span className="rest-label">
        <Moon size={14} /> {t('rest.title')}
      </span>
      {locked ? (
        <span className="rest-locked">
          <Lock size={13} /> {t('rest.locked')}
        </span>
      ) : (
        REST_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => rest(kind)}
            title={t(`rest.${kind}Hint`)}
          >
            {t(`rest.${kind}`)}
          </button>
        ))
      )}
    </div>
  );
}
