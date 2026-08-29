import { useState } from 'react';
import { Radio, Users, LogOut, Copy, Check, MessagesSquare, Send } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { Modal, Field, TextInput } from './ui.jsx';
import { GM_WEBHOOK } from '../multiplayer/protocol.js';
import {
  getWebhook, setWebhook, isValidWebhook, getOpts, setOpts, testWebhook,
} from '../utils/discord.js';

function inviteLink(code) {
  const url = new URL(window.location.href);
  url.searchParams.set('join', code);
  url.hash = '';
  return url.toString();
}

function DiscordSettings({ mp }) {
  const { t } = useLang();
  const [url, setUrl] = useState(() => getWebhook());
  const [opts, setLocalOpts] = useState(() => getOpts());
  const [test, setTest] = useState(null); // null | 'ok' | 'bad' | 'pending'

  const saveUrl = (v) => {
    setUrl(v);
    setWebhook(v);
    setTest(null);
  };
  const toggle = (k) => {
    const next = { ...opts, [k]: !opts[k] };
    setLocalOpts(next);
    setOpts(next);
  };
  const runTest = async () => {
    setTest('pending');
    setTest((await testWebhook(url)) ? 'ok' : 'bad');
  };

  const valid = isValidWebhook(url);

  return (
    <details className="mp-discord">
      <summary>
        <MessagesSquare size={15} /> {t('mp.discord.title')}
      </summary>
      <div className="mp-discord-body">
        <p className="hint">{t('mp.discord.help')}</p>
        <Field label={t('mp.discord.url')}>
          <div className="inline-roll">
            <TextInput value={url} onChange={saveUrl} placeholder="https://discord.com/api/webhooks/..." />
            <button type="button" className="btn btn-sm" disabled={!valid || test === 'pending'} onClick={runTest}>
              {t('mp.discord.test')}
            </button>
          </div>
        </Field>
        {test === 'ok' ? <p className="mp-status" style={{ color: 'var(--ok)' }}>{t('mp.discord.testOk')}</p> : null}
        {test === 'bad' ? <p className="mp-status" style={{ color: 'var(--bad)' }}>{t('mp.discord.testBad')}</p> : null}

        <div className="mp-discord-opts">
          <label>
            <input type="checkbox" checked={opts.rolls} onChange={() => toggle('rolls')} /> {t('mp.discord.rolls')}
          </label>
          <label>
            <input type="checkbox" checked={opts.events} onChange={() => toggle('events')} /> {t('mp.discord.events')}
          </label>
        </div>

        {mp.role === 'gm' && Object.keys(mp.players).length > 0 && valid ? (
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => mp.sendGmCommand(null, { cmd: GM_WEBHOOK, url })}
          >
            <Send size={14} /> {t('mp.discord.share')}
          </button>
        ) : null}
      </div>
    </details>
  );
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

      <DiscordSettings mp={mp} />
    </Modal>
  );
}
