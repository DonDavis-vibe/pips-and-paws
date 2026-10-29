import { useState } from 'react';
import {
  Radio, Users, LogOut, Copy, Check, MessagesSquare, Send, Lock, ShieldCheck, KeyRound, Wifi,
} from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { Modal, Field, TextInput } from './ui.jsx';
import {
  GM_WEBHOOK, ROOM_CODE_LENGTH, ROOM_CODE_MIN, getTurnServer, setTurnServer,
} from '../multiplayer/protocol.js';
import { testConnectivity } from '../multiplayer/diagnose.js';
import { hasCrypto } from '../multiplayer/auth.js';
import JoinRequests from './JoinRequests.jsx';
import {
  getWebhook, setWebhook, isValidWebhook, getOpts, setOpts, testWebhook,
} from '../utils/discord.js';

// Das Passwort steht (wenn gewuenscht) hinter dem '#': dieser Teil einer Adresse
// wird vom Browser nie an einen Server geschickt, auch nicht an unseren.
function inviteLink(code, password) {
  const url = new URL(window.location.href);
  url.searchParams.set('join', code);
  url.hash = password ? `pw=${encodeURIComponent(password)}` : '';
  return url.toString();
}

// SL: Zugang zum Raum absichern — Passwort, Beitritt bestaetigen, Gesperrte.
function RoomSecurity({ mp }) {
  const { t } = useLang();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const canCrypto = hasCrypto();

  const apply = async (value) => {
    setBusy(true);
    setFailed(false);
    const ok = await mp.setRoomPassword(value);
    setBusy(false);
    if (!ok) setFailed(true);
    else setDraft('');
  };

  return (
    <details className="mp-security" open={mp.security.password || mp.security.approval}>
      <summary>
        <ShieldCheck size={15} /> {t('mp.sec.title')}
        {mp.security.password || mp.security.approval ? <span className="mp-sec-on">{t('mp.sec.on')}</span> : null}
      </summary>
      <div className="mp-security-body">
        <p className="hint">{t('mp.sec.help')}</p>

        <Field label={t('mp.sec.password')}>
          <div className="inline-roll">
            <input
              type="text"
              className="text-input"
              value={draft}
              maxLength={60}
              autoComplete="off"
              spellCheck={false}
              placeholder={mp.security.password ? t('mp.sec.passwordSet') : t('mp.sec.passwordNone')}
              disabled={!canCrypto}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) apply(draft.trim()); }}
            />
            <button type="button" className="btn btn-sm" disabled={busy || !draft.trim() || !canCrypto} onClick={() => apply(draft.trim())}>
              <Lock size={14} /> {t('mp.sec.set')}
            </button>
            {mp.security.password ? (
              <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => apply('')}>
                {t('mp.sec.remove')}
              </button>
            ) : null}
          </div>
        </Field>
        {!canCrypto ? <p className="mp-status" style={{ color: 'var(--bad)' }}>{t('mp.sec.noCrypto')}</p> : null}
        {failed ? <p className="mp-status" style={{ color: 'var(--bad)' }}>{t('mp.sec.noCrypto')}</p> : null}
        {mp.security.password ? <p className="hint">{t('mp.sec.passwordHint')}</p> : null}

        <label className="gm-share-log">
          <input
            type="checkbox"
            checked={mp.security.approval}
            onChange={(e) => mp.setApprovalRequired(e.target.checked)}
          />
          {t('mp.sec.approval')}
        </label>
        <p className="hint">{t('mp.sec.approvalHint')}</p>

        {mp.bannedCount > 0 ? (
          <p className="hint">
            {t('mp.sec.banned', { n: mp.bannedCount })}{' '}
            <button type="button" className="link-btn" onClick={mp.unbanAll}>{t('mp.sec.unban')}</button>
          </p>
        ) : null}
      </div>
    </details>
  );
}

// Spieler: Passwort abfragen (der SL hat eines gesetzt, im Link stand keins).
function PasswordPrompt({ mp }) {
  const { t } = useLang();
  const [pw, setPw] = useState('');
  return (
    <form
      className="mp-password"
      onSubmit={(e) => { e.preventDefault(); if (pw) { mp.submitPassword(pw); setPw(''); } }}
    >
      <Field label={t('mp.pw.label')}>
        <div className="inline-roll">
          <input
            type="password"
            className="text-input"
            value={pw}
            autoFocus
            autoComplete="off"
            maxLength={60}
            onChange={(e) => setPw(e.target.value)}
          />
          <button type="submit" className="btn" disabled={!pw}>
            <KeyRound size={14} /> {t('mp.pw.send')}
          </button>
        </div>
      </Field>
    </form>
  );
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

// Verbindungsprobleme: Test, was dieses Netz zulaesst, und optional ein eigener TURN-Relay.
// Die Eintraege bleiben auf diesem Geraet (localStorage), nie im Bogen.
function ConnectionHelp() {
  const { t } = useLang();
  const stored = getTurnServer();
  const [urls, setUrls] = useState(stored ? [].concat(stored.urls).join(', ') : '');
  const [user, setUser] = useState(stored?.username || '');
  const [pass, setPass] = useState(stored?.credential || '');
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null); // null | 'pending' | Ergebnis von testConnectivity

  const save = () => {
    const list = urls.split(',').map((u) => u.trim()).filter(Boolean);
    if (!list.length) {
      setTurnServer(null);
      setNote(t('mp.net.removed'));
    } else if (!list.every((u) => /^turns?:/i.test(u))) {
      setNote(t('mp.net.badUrl'));
    } else {
      setTurnServer({ urls: list.length === 1 ? list[0] : list, username: user.trim(), credential: pass });
      setNote(t('mp.net.saved'));
    }
    setResult(null);
  };

  const run = async () => {
    setResult('pending');
    setResult(await testConnectivity());
  };

  let verdict = '';
  if (result && result !== 'pending') {
    if (result.unsupported || !(result.host || result.srflx || result.relay)) verdict = t('mp.net.noRtc');
    else if (result.relay) verdict = t('mp.net.okRelay');
    else if (result.turn) verdict = t('mp.net.turnFail');
    else if (!result.srflx) verdict = t('mp.net.noDirect');
    else if (result.symmetric) verdict = t('mp.net.symmetric');
    else verdict = t('mp.net.ok', { ip: result.v6 ? 'IPv4 + IPv6' : t('mp.net.v4only') });
  }

  return (
    <details className="mp-discord mp-net">
      <summary>
        <Wifi size={15} /> {t('mp.net.title')}
      </summary>
      <div className="mp-discord-body">
        <p className="hint">{t('mp.net.help')}</p>
        <div className="inline-roll">
          <button type="button" className="btn btn-sm" disabled={result === 'pending'} onClick={run}>
            {result === 'pending' ? t('mp.net.testing') : t('mp.net.test')}
          </button>
          {verdict ? <span className="mp-status">{verdict}</span> : null}
        </div>
        <Field label={t('mp.net.turnUrl')}>
          <TextInput value={urls} onChange={setUrls} placeholder="turn:turn.example.org:3478" />
        </Field>
        <div className="inline-roll">
          <TextInput value={user} onChange={setUser} placeholder={t('mp.net.turnUser')} />
          <TextInput value={pass} onChange={setPass} placeholder={t('mp.net.turnPass')} />
        </div>
        <div className="inline-roll">
          <button type="button" className="btn btn-sm" onClick={save}>{t('mp.net.save')}</button>
          {note ? <span className="hint">{note}</span> : null}
        </div>
      </div>
    </details>
  );
}

export default function MultiplayerModal({ mp, onClose }) {
  const { t } = useLang();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [withPw, setWithPw] = useState(false); // Passwort in den Einladungslink einbetten

  const status = mp.statusMessage ? t(`mp.status.${mp.statusMessage}`, { v: mp.statusMessage }) : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink(mp.roomCode, withPw ? mp.security.passwordText : ''));
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
                onChange={(v) => setCode(v.toUpperCase().slice(0, ROOM_CODE_LENGTH))}
                placeholder="ABCDEF"
                maxLength={ROOM_CODE_LENGTH}
              />
              <button type="button" className="btn" disabled={code.length < ROOM_CODE_MIN} onClick={() => mp.joinSession(code)}>
                {t('mp.joinBtn')}
              </button>
            </div>
          </Field>
          {status ? <p className="mp-status">{status}</p> : null}
          {mp.statusDetail && mp.connectionState === 'error' ? (
            <p className="hint mp-detail">
              {t('mp.status.detail')} <code>{mp.statusDetail}</code>
            </p>
          ) : null}
          {mp.authPrompt === 'password' ? <PasswordPrompt mp={mp} /> : null}
          {mp.connectionState === 'connecting' ? (
            <button type="button" className="btn btn-ghost" onClick={mp.leaveSession}>
              <LogOut size={16} /> {t('mp.cancel')}
            </button>
          ) : null}
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
                  <TextInput value={inviteLink(mp.roomCode, withPw ? mp.security.passwordText : '')} onChange={() => {}} readOnly />
                  <button type="button" className="icon-btn" onClick={copy} aria-label={t('mp.copyLink')}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </Field>
              {mp.security.password ? (
                <label className="gm-share-log" title={t('mp.sec.linkPwHint')}>
                  <input type="checkbox" checked={withPw} onChange={(e) => setWithPw(e.target.checked)} />
                  {t('mp.sec.linkPw')}
                </label>
              ) : null}
              <p className="hint">
                <Users size={14} /> {t('mp.playersConnected', { n: Object.keys(mp.players).length })}
              </p>
              <JoinRequests mp={mp} />
              <RoomSecurity mp={mp} />
            </>
          ) : (
            <p className="mp-status">{status || t(`mp.state.${mp.connectionState}`)}</p>
          )}

          <button type="button" className="btn btn-ghost" onClick={mp.leaveSession}>
            <LogOut size={16} /> {t('mp.leave')}
          </button>
        </div>
      )}

      <ConnectionHelp />
      <DiscordSettings mp={mp} />
    </Modal>
  );
}
