import { useState } from 'react';
import { Radio, Users, LogOut, Copy, Check } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { Modal, Field, TextInput } from './ui.jsx';

function inviteLink(code) {
  const url = new URL(window.location.href);
  url.searchParams.set('join', code);
  url.hash = '';
  return url.toString();
}

export default function MultiplayerModal({ mp, onClose }) {
  const { t } = useLang();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const status = mp.statusMessage ? t(`mp.status.${mp.statusMessage}`, { v: mp.statusMessage }) : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink(mp.roomCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard evtl. blockiert */
    }
  };

  return (
    <Modal title={t('mp.title')} onClose={onClose}>
      {!mp.role ? (
        <div className="mp-choice">
          <p className="hint">{t('mp.intro')}</p>
          <button type="button" className="btn btn-primary" onClick={() => mp.hostSession()}>
            <Radio size={16} /> {t('mp.host')}
          </button>
          <div className="mp-sep">{t('common.or')}</div>
          <Field label={t('mp.joinCode')}>
            <div className="inline-roll">
              <TextInput
                value={code}
                onChange={(v) => setCode(v.toUpperCase().slice(0, 4))}
                placeholder="ABCD"
                maxLength={4}
              />
              <button type="button" className="btn" disabled={code.length < 4} onClick={() => mp.joinSession(code)}>
                {t('mp.joinBtn')}
              </button>
            </div>
          </Field>
          {status ? <p className="mp-status">{status}</p> : null}
        </div>
      ) : (
        <div className="mp-active">
          <div className="mp-room">
            <span className="mp-room-label">{t('mp.roomCode')}</span>
            <strong className="mp-room-code">{mp.roomCode}</strong>
            <span className={`mp-dot ${mp.roomOnline ? 'on' : 'off'}`}>
              {mp.roomOnline ? t('mp.roomOnline') : t('mp.roomOffline')}
            </span>
          </div>

          {mp.role === 'gm' ? (
            <>
              <Field label={t('mp.inviteLink')}>
                <div className="inline-roll">
                  <TextInput value={inviteLink(mp.roomCode)} onChange={() => {}} readOnly />
                  <button type="button" className="icon-btn" onClick={copy} aria-label={t('mp.copyLink')}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </Field>
              <p className="hint">
                <Users size={14} /> {t('mp.playersConnected', { n: Object.keys(mp.players).length })}
              </p>
            </>
          ) : (
            <p className="mp-status">{status || t(`mp.state.${mp.connectionState}`)}</p>
          )}

          <button type="button" className="btn btn-ghost" onClick={mp.leaveSession}>
            <LogOut size={16} /> {t('mp.leave')}
          </button>
        </div>
      )}
    </Modal>
  );
}
