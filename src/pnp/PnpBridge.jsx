import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useLang } from '../i18n/index.jsx';
import { readJSON, writeJSON } from '../utils/storage.js';
import { connectPnp } from './client.js';
import { buildProfile } from './profile.js';
import { buildParty, partyFingerprint, partyWithoutImages } from './party.js';

// Bewusst NICHT unter "pips-paws-gm-": das Pairing-Token ist ein Geheimnis und
// darf nicht in der exportierten SL-Sitzung (gmSession.js) landen.
const SETTINGS_KEY = 'pips-paws-pnp-link';
export const DEFAULT_URL = 'ws://127.0.0.1:4317/bridge';
const PARTY_DEBOUNCE_MS = 1000;

const PnpContext = createContext(null);

// SL-Dashboard <-> PenNodePaper (https://github.com/Rec0iL/PenNodePaper,
// Protokoll: docs/vtt-bridge-spec.md). Die Verbindung gehoert dem Dashboard;
// was ein Push konkret bewirkt, entscheiden die Panels, die ihren Teil per
// usePnpHandler anmelden (Kampf-Tracker -> character, Battlemap -> scene,
// Handouts -> handout, Soundboard -> music_cue/tracks). Alles landet zuerst
// nur beim SL — Spieler sehen nichts, was der SL nicht ausdruecklich zeigt.
export function PnpProvider({ players, localPlayers, notify, children }) {
  const { t, lang } = useLang();
  const [settings, setSettings] = useState(() => readJSON(SETTINGS_KEY, {}) || {});
  const [status, setStatus] = useState('off'); // off | connecting | connected
  const [campaign, setCampaign] = useState('');
  const [hint, setHint] = useState('');
  const linkRef = useRef(null);
  const handlersRef = useRef({});
  const tRef = useRef(t);
  tRef.current = t;
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const register = useCallback((kind, fn) => {
    handlersRef.current[kind] = fn;
    return () => { if (handlersRef.current[kind] === fn) delete handlersRef.current[kind]; };
  }, []);

  const call = useCallback(async (kind, payload) => {
    const fn = handlersRef.current[kind];
    if (!fn) throw new Error(tRef.current('pnp.err.busy'));
    const out = await fn(payload);
    notifyRef.current?.(tRef.current(`pnp.toast.${kind}`, { name: payload?.title || payload?.name || '' }), 'ok');
    return out;
  }, []);

  const saveSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeJSON(SETTINGS_KEY, next);
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    if (linkRef.current) linkRef.current.close();
    linkRef.current = null;
  }, []);

  const disconnect = useCallback(() => {
    stop();
    setStatus('off');
    setCampaign('');
    setHint('');
    saveSettings({ auto: false });
  }, [stop, saveSettings]);

  const partyRef = useRef({ players, localPlayers, lang });
  partyRef.current = { players, localPlayers, lang };

  const connect = useCallback((url, token) => {
    stop();
    const cleanUrl = (url || '').trim() || DEFAULT_URL;
    const cleanToken = (token || '').trim();
    if (!cleanToken) {
      setStatus('off');
      setHint(tRef.current('pnp.err.noToken'));
      return;
    }
    saveSettings({ url: cleanUrl, token: cleanToken, auto: true });
    setStatus('connecting');
    setHint('');
    linkRef.current = connectPnp({
      url: cleanUrl,
      token: cleanToken,
      profile: buildProfile(tRef.current, partyRef.current.lang),
      onPush: (kind, payload) => {
        if (['handout', 'scene', 'character', 'music_cue'].includes(kind)) return call(kind, payload);
        throw new Error(tRef.current('pnp.err.unsupported', { kind }));
      },
      onRequest: async (what) => {
        if (what === 'tracks') return handlersRef.current.tracks ? handlersRef.current.tracks() : [];
        if (what === 'party') {
          const entries = partyWithoutImages(partyRef.current);
          return buildParty(entries);
        }
        throw new Error(tRef.current('pnp.err.unsupported', { kind: what }));
      },
      onStatus: (s, info) => {
        if (s === 'connected') {
          setStatus('connected');
          setCampaign((info && info.campaign) || '');
          setHint('');
        } else if (s === 'connecting') {
          setStatus('connecting');
          setHint(info?.retryInMs ? tRef.current('pnp.retry', { s: Math.round(info.retryInMs / 1000) }) : '');
        } else {
          setStatus('off');
          setCampaign('');
          setHint(info?.reason === 'invalidUrl' ? tRef.current('pnp.err.badUrl') : (info?.reason || ''));
        }
      },
    });
  }, [stop, saveSettings, call]);

  // Nach einem Reload selbst wieder verbinden, solange der SL nicht
  // ausdruecklich getrennt hat (settings.auto). Cleanup schliesst die
  // Verbindung (auch beim StrictMode-Probelauf: dann folgt gleich der naechste connect).
  useEffect(() => {
    const s = readJSON(SETTINGS_KEY, {}) || {};
    if (s.auto && s.token) connect(s.url, s.token);
    return stop;
  }, [connect, stop]);

  // Gruppe melden, sobald sie sich aendert (entprellt, immer die GANZE Gruppe).
  const entries = partyWithoutImages({ players, localPlayers, lang });
  const fingerprint = partyFingerprint(entries);
  useEffect(() => {
    if (status !== 'connected' || !linkRef.current) return undefined;
    const timer = setTimeout(async () => {
      const party = await buildParty(partyWithoutImages(partyRef.current));
      if (linkRef.current) linkRef.current.reportParty(party);
    }, PARTY_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [fingerprint, status]);

  const value = useMemo(() => ({
    status, campaign, hint, settings, connect, disconnect, register,
  }), [status, campaign, hint, settings, connect, disconnect, register]);

  return <PnpContext.Provider value={value}>{children}</PnpContext.Provider>;
}

export function usePnp() {
  return useContext(PnpContext);
}

// Meldet einen Handler fuer einen Push-Typ ('handout' | 'scene' | 'character' |
// 'music_cue') oder eine Anfrage ('tracks') an. Immer die neueste Closure.
export function usePnpHandler(kind, fn) {
  const ctx = useContext(PnpContext);
  const ref = useRef(fn);
  ref.current = fn;
  const register = ctx?.register;
  useEffect(() => {
    if (!register) return undefined;
    return register(kind, (...args) => ref.current(...args));
  }, [register, kind]);
}
