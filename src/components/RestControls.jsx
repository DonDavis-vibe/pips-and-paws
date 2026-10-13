import { useState } from 'react';
import { Moon, Lock } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { applyRest, REST_KINDS } from '../rules/rest.js';
import { restText } from '../utils/ruleText.js';

// Rast-Knoepfe des Spielers. Die Rechnung steckt in rules/rest.js, damit der SL
// per Befehl exakt dieselbe ausloesen kann.
// locked = der SL hat die Rast fuer die Runde an sich gezogen.
// Lange Rast bei vollen TP: laut Regel bekommt EIN Wert W6 zurueck — welcher,
// waehlt die Spielerin (Auswahl erscheint nur, wenn mehr als einer fehlt).
export default function RestControls({ character, setCharacter, notify, locked }) {
  const { t, lang } = useLang();
  const [pickAttr, setPickAttr] = useState(false);

  const hurtAttrs = ['str', 'dex', 'wil'].filter((k) => character[k].current < character[k].max);

  const rest = (kind, attr) => {
    setPickAttr(false);
    const res = applyRest(character, kind, { attr });
    setCharacter(res.character);
    notify(restText(res, kind, t, lang), 'ok');
  };

  const onRest = (kind) => {
    if (kind === 'long' && character.hp.current >= character.hp.max && hurtAttrs.length > 1) {
      setPickAttr(true);
      return;
    }
    rest(kind);
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
      ) : pickAttr ? (
        <>
          <span className="hint">{t('rest.pickAttr')}</span>
          {hurtAttrs.map((k) => (
            <button key={k} type="button" className="btn btn-sm" onClick={() => rest('long', k)}>
              {t(`attr.abbr.${k}`)} {character[k].current}/{character[k].max}
            </button>
          ))}
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPickAttr(false)}>
            {t('wizard.cancel')}
          </button>
        </>
      ) : (
        REST_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => onRest(kind)}
            title={t(`rest.${kind}Hint`)}
          >
            {t(`rest.${kind}`)}
          </button>
        ))
      )}
    </div>
  );
}
