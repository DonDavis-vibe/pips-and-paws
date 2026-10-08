import { useState } from 'react';
import { Network, Plug, PlugZap } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { DEFAULT_URL, usePnp } from '../pnp/PnpBridge.jsx';
import { Field, Modal, TextInput } from './ui.jsx';

// Verbindung zu PenNodePaper (https://github.com/Rec0iL/PenNodePaper): Knopf
// mit Statuspunkt in der Kopfzeile des SL-Dashboards, Einstellungen im Fenster.
// Adresse und Pairing-Token zeigt PenNodePaper unter Einstellungen -> VTT link.
export default function GmPnpLink() {
  const { t } = useLang();
  const pnp = usePnp();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  if (!pnp) return null;

  const { status, campaign, hint, settings } = pnp;
  const openDialog = () => {
    setUrl(settings.url || DEFAULT_URL);
    setToken(settings.token || '');
    setOpen(true);
  };
  const statusText = status === 'connected'
    ? `${t('pnp.connected')}${campaign ? ` – ${t('pnp.campaign', { name: campaign })}` : ''}`
    : status === 'connecting' ? t('pnp.connecting') : t('pnp.off');

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm pnp-btn" onClick={openDialog} title={statusText}>
        <Network size={15} /> {t('pnp.title')}
        <span className={`pnp-dot pnp-${status}`} aria-hidden="true" />
      </button>
      {open ? (
        <Modal title={t('pnp.title')} onClose={() => setOpen(false)}>
          <p className="hint">
            {t('pnp.intro')}{' '}
            <a href="https://github.com/Rec0iL/PenNodePaper" target="_blank" rel="noopener noreferrer">PenNodePaper</a>
          </p>
          <Field label={t('pnp.url')}>
            <TextInput value={url} onChange={setUrl} autoComplete="off" spellCheck={false} />
          </Field>
          <Field label={t('pnp.token')} hint={t('pnp.tokenHint')}>
            <TextInput type="password" value={token} onChange={setToken} autoComplete="off" spellCheck={false} />
          </Field>
          <div className="pnp-foot">
            {status === 'off' ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => pnp.connect(url, token)}>
                <Plug size={14} /> {t('pnp.connect')}
              </button>
            ) : (
              <button type="button" className="btn btn-sm" onClick={pnp.disconnect}>
                <PlugZap size={14} /> {t('pnp.disconnect')}
              </button>
            )}
            <span className={`pnp-status pnp-${status}`}>
              {statusText}{hint ? ` (${hint})` : ''}
            </span>
          </div>
          <ul className="pnp-map hint">
            <li>{t('pnp.map.handout')}</li>
            <li>{t('pnp.map.scene')}</li>
            <li>{t('pnp.map.character')}</li>
            <li>{t('pnp.map.music')}</li>
            <li>{t('pnp.map.party')}</li>
          </ul>
          <p className="hint">{t('pnp.privacy')}</p>
        </Modal>
      ) : null}
    </>
  );
}
