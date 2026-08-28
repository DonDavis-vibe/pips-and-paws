import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import {
  ROOM_PREFIX, JOIN_TIMEOUT_MS, MAX_RECONNECT_ATTEMPTS, SESSION_KEY,
  T_STATE, T_EVENT, T_SAY, T_GM,
  generateRoomCode, isMessage, peerConfig,
} from './protocol.js';

// Serverloses Multiplayer ueber WebRTC (PeerJS). Der Spielleiter ist Host & Autoritaet:
// feste Peer-ID = Raum-Code, Spieler verbinden sich direkt. Muster aus dem
// Referenzprojekt coc-tool (useMultiplayer.js), auf Pips & Paws angepasst.

const saveSession = (role, code) => {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role, roomCode: code })); } catch { /* */ }
};
const clearSession = () => {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* */ }
};
const loadSession = () => {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
};

let uidSeq = 0;
// Kollisionssicher auch nach einem HMR-Modul-Reset (Zeitstempel + Zufall + Zaehler).
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}-${(uidSeq += 1)}`;
const newEid = uid;

export function useMultiplayer() {
  const [role, setRole] = useState(null); // null | 'gm' | 'player'
  const [roomCode, setRoomCode] = useState('');
  const [roomOnline, setRoomOnline] = useState(false);
  const [connectionState, setConnectionState] = useState('idle'); // idle|connecting|connected|error
  const [statusMessage, setStatusMessage] = useState('');
  const [players, setPlayers] = useState({}); // peerId -> { character, items, lastSeen }
  const [liveLog, setLiveLog] = useState([]);
  const [gmCommand, setGmCommand] = useState(null); // Spieler: zuletzt empfangener SL-Befehl

  // Spiegel von `players` fuer synchrone Namens-Lookups ausserhalb von State-Updatern
  // (pushLog darf NIE in einem setState-Updater laufen — StrictMode ruft die doppelt auf).
  const playersRef = useRef({});
  playersRef.current = players;

  const peerRef = useRef(null);
  const hostConnRef = useRef(null); // Spieler -> SL
  const clientConnsRef = useRef({}); // SL -> Spieler
  const joinTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectPendingRef = useRef(false);
  const retryJoinAttemptsRef = useRef(0);
  const retryJoinPendingRef = useRef(false);
  const wireHostRef = useRef(null);
  const autoRestoreRef = useRef(false);
  const seenEidsRef = useRef(new Set()); // Deduplizierung doppelt zugestellter Nachrichten

  const pushLog = useCallback((entry) => {
    const id = uid();
    setLiveLog((prev) => [{ id, time: Date.now(), ...entry }, ...prev].slice(0, 200));
  }, []);

  const cleanupPeer = useCallback(() => {
    clearTimeout(joinTimeoutRef.current);
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch { /* schon zerstoert */ }
    }
    peerRef.current = null;
    hostConnRef.current = null;
    clientConnsRef.current = {};
    reconnectAttemptsRef.current = 0;
    reconnectPendingRef.current = false;
    retryJoinAttemptsRef.current = 0;
    retryJoinPendingRef.current = false;
  }, []);

  const leaveSession = useCallback(() => {
    cleanupPeer();
    clearSession();
    setRole(null);
    setRoomCode('');
    setRoomOnline(false);
    setConnectionState('idle');
    setStatusMessage('');
    setPlayers({});
    setLiveLog([]);
    setGmCommand(null);
  }, [cleanupPeer]);

  // --- SL: Reconnect zum Signalling-Server ---
  const reconnectHost = useCallback(() => {
    const peer = peerRef.current;
    if (!peer || peer.destroyed || peer.open || reconnectPendingRef.current) return;
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      pushLog({ kind: 'system', key: 'mp.log.serverLost' });
      return;
    }
    const delay = Math.min(2000 * 2 ** reconnectAttemptsRef.current, 30000);
    reconnectAttemptsRef.current += 1;
    reconnectPendingRef.current = true;
    setTimeout(() => {
      if (!peerRef.current || peerRef.current.destroyed || peerRef.current.open) {
        reconnectPendingRef.current = false;
        return;
      }
      try { peerRef.current.reconnect(); } catch { /* naechster Versuch */ }
      setTimeout(() => {
        reconnectPendingRef.current = false;
        if (!peerRef.current || peerRef.current.destroyed) return;
        if (peerRef.current.open) {
          reconnectAttemptsRef.current = 0;
          setRoomOnline(true);
          pushLog({ kind: 'system', key: 'mp.log.serverBack' });
        } else {
          reconnectHost();
        }
      }, 3000);
    }, delay);
  }, [pushLog]);

  const handleIncoming = useCallback((peerId, payload) => {
    if (!isMessage(payload)) return;
    // Doppelt zugestellte Nachrichten (Reconnect / mehrfache DataConnection) verwerfen
    if (payload.eid != null) {
      if (seenEidsRef.current.has(payload.eid)) return;
      seenEidsRef.current.add(payload.eid);
      if (seenEidsRef.current.size > 400) {
        seenEidsRef.current = new Set([...seenEidsRef.current].slice(-200));
      }
    }
    const name = playersRef.current[peerId]?.character?.name || '?';
    if (payload.t === T_STATE) {
      setPlayers((prev) => ({
        ...prev,
        [peerId]: { character: payload.character, items: payload.items || {}, lastSeen: Date.now() },
      }));
    } else if (payload.t === T_EVENT) {
      pushLog({ kind: 'event', playerId: peerId, playerName: name, ev: payload.ev });
    } else if (payload.t === T_SAY) {
      pushLog({ kind: 'say', playerId: peerId, playerName: name, text: String(payload.text || '') });
    }
  }, [pushLog]);

  // --- SL: Sitzung hosten ---
  const hostSession = useCallback((preferredCodeArg) => {
    const preferredCode = typeof preferredCodeArg === 'string' ? preferredCodeArg : undefined;
    cleanupPeer();
    setConnectionState('connecting');
    setStatusMessage(preferredCode ? 'restore' : 'creating');
    setPlayers({});
    setLiveLog([]);

    const code = preferredCode || generateRoomCode();
    const peer = new Peer(ROOM_PREFIX + code, peerConfig());
    peerRef.current = peer;
    let opened = false;

    peer.on('open', () => {
      if (opened) return; // 'open' feuert nach Reconnect erneut
      opened = true;
      reconnectAttemptsRef.current = 0;
      setRoomCode(code);
      setRoomOnline(true);
      setRole('gm');
      setConnectionState('connected');
      setStatusMessage('');
      pushLog({ kind: 'system', key: 'mp.log.started', vars: { code } });
      saveSession('gm', code);
    });

    peer.on('disconnected', () => {
      setRoomOnline(false);
      reconnectHost();
    });

    peer.on('connection', (conn) => {
      // Alte Verbindung desselben Spielers ersetzen (Reconnect / Doppelverbindung)
      const old = clientConnsRef.current[conn.peer];
      if (old && old !== conn) {
        try { old.close(); } catch { /* */ }
      }
      conn.on('data', (data) => handleIncoming(conn.peer, data));
      conn.on('close', () => {
        if (clientConnsRef.current[conn.peer] !== conn) return; // wurde bereits ersetzt
        delete clientConnsRef.current[conn.peer];
        const name = playersRef.current[conn.peer]?.character?.name;
        if (name) pushLog({ kind: 'system', key: 'mp.log.left', vars: { name } });
        setPlayers((prev) => {
          const next = { ...prev };
          delete next[conn.peer];
          return next;
        });
      });
      clientConnsRef.current[conn.peer] = conn;
    });

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        clearSession();
        setStatusMessage(preferredCode ? 'idTakenRetry' : 'idTaken');
      } else {
        setStatusMessage(`error:${err.type}`);
      }
      setConnectionState('error');
      setRole(null);
    });
  }, [cleanupPeer, handleIncoming, pushLog, reconnectHost]);

  // --- Spieler: Reconnect zum SL ---
  const attemptReconnectToHost = useCallback((code) => {
    const peer = peerRef.current;
    if (!peer || peer.destroyed || retryJoinPendingRef.current) return;
    if (retryJoinAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setStatusMessage('hostGone');
      setConnectionState('error');
      return;
    }
    const delay = Math.min(2000 * 2 ** retryJoinAttemptsRef.current, 30000);
    retryJoinAttemptsRef.current += 1;
    retryJoinPendingRef.current = true;
    setTimeout(() => {
      retryJoinPendingRef.current = false;
      if (!peerRef.current || peerRef.current.destroyed) return;
      const conn = peerRef.current.connect(ROOM_PREFIX + code, { reliable: true });
      wireHostRef.current(conn, code);
    }, delay);
  }, []);

  const wireHostConnection = useCallback((conn, code) => {
    const prev = hostConnRef.current;
    if (prev && prev !== conn) {
      try { prev.close(); } catch { /* */ }
    }
    hostConnRef.current = conn;

    conn.on('open', () => {
      clearTimeout(joinTimeoutRef.current);
      retryJoinAttemptsRef.current = 0;
      setRole('player');
      setRoomCode(code);
      setConnectionState('connected');
      setStatusMessage('');
      saveSession('player', code);
    });

    conn.on('data', (payload) => {
      if (!isMessage(payload)) return;
      if (payload.t === T_GM) {
        // id vom Absender (eid) -> App entdedupliziert doppelt zugestellte Befehle
        setGmCommand({ ...payload, id: payload.eid ?? Date.now() + Math.random() });
      }
    });

    conn.on('close', () => {
      if (hostConnRef.current !== conn) return; // bereits ersetzt
      hostConnRef.current = null;
      setConnectionState('connecting');
      setStatusMessage('hostInterrupted');
      attemptReconnectToHost(code);
    });

    conn.on('error', () => clearTimeout(joinTimeoutRef.current));
  }, [attemptReconnectToHost]);

  wireHostRef.current = wireHostConnection;

  const joinSession = useCallback((codeInput) => {
    const code = (codeInput || '').trim().toUpperCase();
    if (!code) {
      setStatusMessage('needCode');
      return;
    }
    cleanupPeer();
    setConnectionState('connecting');
    setStatusMessage('connecting');

    const peer = new Peer(peerConfig());
    peerRef.current = peer;
    let connected = false;

    peer.on('open', () => {
      if (connected) return; // 'open' kann nach Reconnect erneut feuern
      connected = true;
      const conn = peer.connect(ROOM_PREFIX + code, { reliable: true });
      joinTimeoutRef.current = setTimeout(() => {
        if (conn.open) return;
        setStatusMessage('joinFailed');
        setConnectionState('error');
        clearSession();
        conn.close();
      }, JOIN_TIMEOUT_MS);
      wireHostConnection(conn, code);
    });

    peer.on('error', (err) => {
      clearTimeout(joinTimeoutRef.current);
      setConnectionState('error');
      clearSession();
      if (err.type === 'peer-unavailable') setStatusMessage('roomNotFound');
      else if (['network', 'server-error', 'socket-error'].includes(err.type)) setStatusMessage('serverUnreachable');
      else setStatusMessage(`error:${err.type}`);
    });
  }, [cleanupPeer, wireHostConnection]);

  // --- Senden: Spieler -> SL ---
  const sendState = useCallback((character) => {
    const conn = hostConnRef.current;
    if (conn && conn.open) conn.send({ t: T_STATE, character, items: character.items || {} });
  }, []);

  const sendEvent = useCallback((ev) => {
    const conn = hostConnRef.current;
    if (conn && conn.open) conn.send({ t: T_EVENT, ev, eid: newEid() });
  }, []);

  const sendSay = useCallback((text) => {
    const conn = hostConnRef.current;
    if (conn && conn.open) conn.send({ t: T_SAY, text, eid: newEid() });
  }, []);

  // --- Senden: SL -> Spieler ---
  const sendGmCommand = useCallback((peerId, cmd) => {
    const payload = { t: T_GM, eid: newEid(), ...cmd };
    if (peerId) {
      const conn = clientConnsRef.current[peerId];
      if (conn && conn.open) conn.send(payload);
      return;
    }
    Object.values(clientConnsRef.current).forEach((conn) => {
      if (conn && conn.open) conn.send(payload);
    });
  }, []);

  const logGmAction = useCallback((entry) => pushLog({ kind: 'gm', ...entry }), [pushLog]);
  const clearGmCommand = useCallback(() => setGmCommand(null), []);

  // Beim Start: unterbrochene Sitzung wiederherstellen, sonst ?join=CODE pruefen.
  useEffect(() => {
    if (autoRestoreRef.current) return;
    autoRestoreRef.current = true;

    const stored = loadSession();
    if (stored?.role === 'gm' && stored.roomCode) {
      hostSession(stored.roomCode);
      return;
    }
    if (stored?.role === 'player' && stored.roomCode) {
      joinSession(stored.roomCode);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join');
    if (joinParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete('join');
      window.history.replaceState({}, '', url);
      joinSession(joinParam);
    }
  }, [hostSession, joinSession]);

  return {
    role,
    roomCode,
    roomOnline,
    connectionState,
    statusMessage,
    players,
    liveLog,
    gmCommand,
    hostSession,
    joinSession,
    leaveSession,
    sendState,
    sendEvent,
    sendSay,
    sendGmCommand,
    logGmAction,
    clearGmCommand,
  };
}
