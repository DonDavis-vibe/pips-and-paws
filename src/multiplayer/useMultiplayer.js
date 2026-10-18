import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import {
  ROOM_PREFIX, JOIN_TIMEOUT_MS, MAX_RECONNECT_ATTEMPTS, SESSION_KEY,
  T_STATE, T_EVENT, T_SAY, T_GM, T_STASH, T_STASH_DROP, T_STASH_TAKE, T_LOG, T_LOGCFG, T_TIME, T_RESTCFG, T_NPCS,
  T_GROUP, T_SOUND_FX, T_SOUND_CUSTOM, T_SOUND_VOL, T_SOUND_STOP, T_SOUND_FADE,
  T_MAP_SHARE, T_MAP, T_MAP_IMG, T_HANDOUT,
  T_HELLO, T_AUTH, MAX_UNAUTH, AUTH_TIMEOUT_MS, CHALLENGE_TIMEOUT_MS, PENDING_TIMEOUT_MS,
  GM_GIVE, GM_STASH_DENY, GM_STASH_FULL,
  generateRoomCode, isMessage, peerConfig,
} from './protocol.js';
import {
  hasCrypto, deriveKey, makeProof, randomHex, safeEqual,
} from './auth.js';
import { readJSON, writeJSON, remove as removeStore } from '../utils/storage.js';
import { stashUsed, stashHasRoom, normalizeStashCfg } from '../rules/stash.js';
import { playFx, playBlob, setLiveVolume, stopAllAudio as stopAllAudioLocal, fadeOutAllAudio as fadeOutAllAudioLocal } from '../utils/sound.js';

const GM_STASH_KEY = 'pips-paws-gm-stash';
const GM_STASH_CFG_KEY = 'pips-paws-gm-stash-cfg'; // Name und Platzzahl des Lagers
const CLIENT_ID_KEY = 'pips-paws-mp-client'; // zufaellige Geraete-ID (pro Browser), siehe Zugangskontrolle
const GM_SECURITY_KEY = 'pips-paws-mp-gm-security'; // SL: Passwort + zugelassene/gesperrte Geraete (nur diese Browser-Sitzung)
const APPROVAL_KEY = 'pips-paws-mp-approval'; // SL: Beitritt muss bestaetigt werden (bleibt gemerkt)
const PARTY_LOG_KEY = 'pips-paws-party-log-on';
const REST_LOCK_KEY = 'pips-paws-rest-locked';
const GROUP_SHARE_KEY = 'pips-paws-group-shared';
const MAP_SHARE_KEY = 'pips-paws-gm-map-shared';
const HANDOUTS_KEY = 'pips-paws-handouts'; // Spieler: erhaltene Handouts (pro Geraet)
const MAX_HANDOUTS = 30;

// Eintraege, die der SL nie an die Spieler spiegelt, auch wenn das Runden-Log
// geteilt ist: Begegnungswuerfe laufen laut Regeln (S. 21) verdeckt.
const PRIVATE_GM_KEYS = new Set(['gm.log.whisper', 'time.log.encounter', 'time.log.encHour']);

// Welche Log-Eintraege der Host an die Spieler spiegelt (kein Fluestern, keine
// Rohdaten, keine geheimen Wuerfe — `secret` setzt der SL im Wuerfel-Panel).
const isShareable = (e) =>
  e.kind === 'event'
  || (e.kind === 'gm' && !PRIVATE_GM_KEYS.has(e.key) && !e.secret)
  || (e.kind === 'system'
    && ['gm.log.stashDrop', 'gm.log.stashTake', 'mp.log.left', 'mp.log.joined'].includes(e.key));

// Serverloses Multiplayer ueber WebRTC (PeerJS). Der Spielleiter ist Host & Autoritaet:
// feste Peer-ID = Raum-Code, Spieler verbinden sich direkt. Muster aus dem
// Referenzprojekt coc-tool (useMultiplayer.js), auf Pips & Paws angepasst.

const saveSession = (role, code, pw) => {
  // Das Raum-Passwort bleibt nur in dieser Browser-Sitzung (sessionStorage), damit ein Neuladen wieder reinkommt.
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role, roomCode: code, ...(pw ? { pw } : {}) })); } catch { /* */ }
};
const clearSession = () => {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* */ }
};
const loadSession = () => {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
};

// Geraete-ID des Spielers: bleibt ueber Neuladen gleich, damit der SL ein schon
// zugelassenes (oder gesperrtes) Geraet wiedererkennt — die Peer-ID tut das nicht.
function getClientId() {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = randomHex(12);
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch { return randomHex(12); }
}

// Gesperrte Geraete zaehlen: gespeichert sind Geraete-ID und Peer-ID (Peer-IDs haben Bindestriche).
const countBanned = (set) => [...set].filter((id) => !String(id).includes('-')).length;

let uidSeq = 0;
// Kollisionssicher auch nach einem HMR-Modul-Reset (Zeitstempel + Zufall + Zaehler).
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}-${(uidSeq += 1)}`;
const newEid = uid;

// Kurzes Label fuers Live-Log (das Log laeuft in der Sprache des SL; hier reicht ein fester Griff).
const itemLabel = (it) => (it?.name && (it.name.de || it.name.en)) || String(it?.name || '?');

export function useMultiplayer() {
  const [role, setRole] = useState(null); // null | 'gm' | 'player'
  const [roomCode, setRoomCode] = useState('');
  const [roomOnline, setRoomOnline] = useState(false);
  const [connectionState, setConnectionState] = useState('idle'); // idle|connecting|connected|error
  const [statusMessage, setStatusMessage] = useState('');
  const [players, setPlayers] = useState({}); // peerId -> { character, items, lastSeen }
  const [liveLog, setLiveLog] = useState([]);
  const [gmCommand, setGmCommand] = useState(null); // Spieler: zuletzt empfangener SL-Befehl
  const [stash, setStash] = useState([]); // Tischmitte: beim SL kanonisch, bei Spielern eine Kopie
  // Lager-Einstellungen (Name, Platzzahl) + belegte Plaetze. Beim SL kanonisch, bei Spielern eine Kopie.
  const [stashCfg, setStashCfgState] = useState(() => ({ ...normalizeStashCfg(readJSON(GM_STASH_CFG_KEY)), used: 0 }));
  // Geteiltes Runden-Log: der SL schaltet es fuer die Runde an/aus, Spieler bekommen den Stand.
  const [partyLog, setPartyLog] = useState(() => readJSON(PARTY_LOG_KEY, true) !== false);
  // Geteilte Tageszeit: null = der SL zeigt sie den Spielern gerade nicht.
  const [partyTime, setPartyTime] = useState(null); // { day, watch, turn, inWatch, turnsPerWatch }
  // Rast-Sperre: der SL loest Rasten selbst aus, Spieler sehen nur einen Hinweis.
  const [restLocked, setRestLocked] = useState(() => readJSON(REST_LOCK_KEY, false) === true);
  // Sichtbar geschaltete NSC (beim Spieler eine Kopie, beim SL der gesendete Stand).
  const [partyNpcs, setPartyNpcs] = useState([]);
  // Gruppenuebersicht: der SL teilt sie erst auf Wunsch (wie das Runden-Log).
  const [groupShared, setGroupSharedState] = useState(() => readJSON(GROUP_SHARE_KEY, false) === true);
  const [partyGroup, setPartyGroup] = useState([]); // Spieler: die jeweils ANDEREN am Tisch
  // Battlemap: der SL teilt sie erst auf Wunsch. `partyMap` ist beim Spieler
  // der komplette Stand (Bild + Zustand), beim SL ungenutzt (der haelt seine
  // eigenen Karten selbst, siehe GmBattleMap).
  const [mapShared, setMapSharedState] = useState(() => readJSON(MAP_SHARE_KEY, false) === true);
  const [partyMap, setPartyMap] = useState(null);
  // Handouts, die der SL gezeigt hat (Spieler). Bleiben pro Geraet erhalten.
  const [handouts, setHandouts] = useState(() => {
    const saved = readJSON(HANDOUTS_KEY);
    return Array.isArray(saved) ? saved : [];
  });
  const [newHandoutId, setNewHandoutId] = useState(null); // zuletzt eingetroffen -> Popup
  // Eigene Peer-ID (nur als Spieler gesetzt) — damit die Gruppenuebersicht
  // sich selbst aus der Liste der "anderen" herausfiltern kann.
  const [myPeerId, setMyPeerId] = useState(null);
  // Zaehlt bei jedem (Wieder-)Verbinden hoch. Der Spieler muss seinen Bogen dann
  // erneut schicken — sonst kennt ein neu gestarteter Host ihn gar nicht und
  // zeigt "0 verbunden", obwohl Wuerfe ankommen.
  const [resyncNonce, setResyncNonce] = useState(0);

  // --- Zugangskontrolle (SL) ---------------------------------------------
  // Verbindungen sind erst "unauthentifiziert" (unauthRef) und bekommen NICHTS,
  // bis sie zugelassen sind — erst dann wandern sie in clientConnsRef, ueber den
  // alle Broadcasts laufen. Passwort: Challenge-Response (auth.js). Bestaetigung:
  // der SL sieht eine Anfrage in `pending`. Rauswurf sperrt das Geraet.
  const [security, setSecurity] = useState(() => ({
    password: false,
    passwordText: '', // nur im Browser des SL, fuer den Einladungslink
    approval: readJSON(APPROVAL_KEY, false) === true,
  }));
  const [pending, setPending] = useState([]); // [{ peerId, name }] wartet auf die Zusage
  const [bannedCount, setBannedCount] = useState(0);
  // Spieler: der SL verlangt ein Passwort, das wir noch nicht haben ('password' | null)
  const [authPrompt, setAuthPrompt] = useState(null);

  // Spiegel von `players` fuer synchrone Namens-Lookups ausserhalb von State-Updatern
  // (pushLog darf NIE in einem setState-Updater laufen — StrictMode ruft die doppelt auf).
  const playersRef = useRef({});
  playersRef.current = players;
  const stashRef = useRef([]);
  stashRef.current = stash;
  const stashCfgRef = useRef(stashCfg);
  stashCfgRef.current = stashCfg;
  const roleRef = useRef(null);
  roleRef.current = role;
  const partyLogRef = useRef(true);
  partyLogRef.current = partyLog;
  const knownPeersRef = useRef(new Set());
  const liveLogRef = useRef([]);
  liveLogRef.current = liveLog;
  const partyTimeRef = useRef(null);
  partyTimeRef.current = partyTime;
  const restLockedRef = useRef(false);
  restLockedRef.current = restLocked;
  const partyNpcsRef = useRef([]);
  partyNpcsRef.current = partyNpcs;
  const groupSharedRef = useRef(false);
  groupSharedRef.current = groupShared;
  const groupTimerRef = useRef(null);
  const mapSharedRef = useRef(false);
  mapSharedRef.current = mapShared;
  const mapStateRef = useRef(null); // letzter { name, raster, figuren, formen, nebel }
  const mapImageRef = useRef(null); // letztes { name, dataUrl }
  const mapStateTimerRef = useRef(null);

  const peerRef = useRef(null);
  const hostConnRef = useRef(null); // Spieler -> SL
  const clientConnsRef = useRef({}); // SL -> Spieler
  const joinTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectPendingRef = useRef(false);
  const retryJoinAttemptsRef = useRef(0);
  const retryJoinPendingRef = useRef(false);
  const wireHostRef = useRef(null);
  const challengeAnswerRef = useRef(null);
  const autoRestoreRef = useRef(false);
  const seenEidsRef = useRef(new Set()); // Deduplizierung doppelt zugestellter Nachrichten
  // SL
  const unauthRef = useRef({}); // peerId -> { conn, state, nonce, clientId, name, timer }
  const secretRef = useRef(null); // abgeleiteter Passwort-Schluessel (CryptoKey) oder null
  const approvalRef = useRef(security.approval);
  approvalRef.current = security.approval;
  const trustedRef = useRef(new Set()); // clientIds, die schon zugelassen waren (kein erneutes Fragen)
  const bannedRef = useRef(new Set()); // clientIds und peerIds, die rausgeworfen wurden
  const admittedInfoRef = useRef({}); // peerId -> { clientId, name }
  const failRef = useRef({ count: 0, since: 0, lockedUntil: 0 }); // Brute-Force-Bremse
  const roomCodeRef = useRef('');
  // Spieler
  const joinPwRef = useRef(''); // Passwort fuer die laufende Verbindung
  const identityRef = useRef(''); // Name der Maus, fuer die Anfrage beim SL
  const challengeRef = useRef(null); // { nonce, conn } wartet auf ein Passwort
  const authedRef = useRef(false); // wurden wir eingelassen?
  const authFailedRef = useRef(false); // abgelehnt -> kein automatisches Neuverbinden
  const lastJoinCodeRef = useRef('');

  const pushLog = useCallback((entry) => {
    const full = { id: uid(), time: Date.now(), ...entry };
    setLiveLog((prev) => [full, ...prev].slice(0, 200));
    if (roleRef.current === 'gm' && partyLogRef.current && isShareable(full)) {
      Object.values(clientConnsRef.current).forEach((conn) => {
        if (conn && conn.open) {
          try { conn.send({ t: T_LOG, eid: uid(), entry: full }); } catch { /* */ }
        }
      });
    }
  }, []);

  // SL schaltet das geteilte Runden-Log fuer die Runde an/aus.
  const setPartyLogShared = useCallback((on) => {
    setPartyLog(on);
    writeJSON(PARTY_LOG_KEY, on);
    if (roleRef.current === 'gm') {
      Object.values(clientConnsRef.current).forEach((conn) => {
        if (conn && conn.open) {
          try { conn.send({ t: T_LOGCFG, eid: uid(), shared: on }); } catch { /* */ }
        }
      });
    }
  }, []);

  // SL zieht die Rast an sich (oder gibt sie wieder frei).
  const setRestLockedShared = useCallback((on) => {
    setRestLocked(on);
    writeJSON(REST_LOCK_KEY, on);
    if (roleRef.current === 'gm') {
      Object.values(clientConnsRef.current).forEach((conn) => {
        if (conn && conn.open) {
          try { conn.send({ t: T_RESTCFG, eid: uid(), locked: on }); } catch { /* */ }
        }
      });
    }
  }, []);

  // SL schaltet NSC fuer die Spieler sichtbar (leere Liste = niemand zu sehen).
  const shareNpcs = useCallback((list) => {
    // Bewusst nur Name und Kreatur-Schluessel (fuers Portrait): der Hinweistext aus dem Katalog ist der Statblock
    // (STR/DEX/WIL) und gehoert nicht auf den Spielertisch.
    const safe = (list || []).map((n) => ({ id: n.id, name: n.name, key: n.key || null }));
    setPartyNpcs(safe);
    partyNpcsRef.current = safe;
    if (roleRef.current === 'gm') {
      Object.values(clientConnsRef.current).forEach((conn) => {
        if (conn && conn.open) {
          try { conn.send({ t: T_NPCS, eid: uid(), npcs: safe }); } catch { /* */ }
        }
      });
    }
  }, []);

  // --- Gruppenuebersicht: kompakte Sicht der Spieler aufeinander ---------
  // Baut die Liste direkt aus `players` (peerId -> {character, items}) — bewusst
  // ohne Attribute/Inventar/Pips, nur was am Tisch ohnehin sichtbar waere.
  const groupSnapshot = useCallback(() => Object.entries(playersRef.current).map(([peerId, p]) => {
    const c = p.character || {};
    const items = p.items || {};
    const conditions = Object.values(items)
      .filter((i) => i.type === 'condition' && !i.cleared)
      .map((i) => ({ key: i.key, name: i.name }));
    return {
      peerId,
      name: c.name || '',
      hp: { current: c.hp?.current ?? 0, max: c.hp?.max ?? 0 },
      conditions,
    };
  }), []);

  const broadcastGroupNow = useCallback(() => {
    if (roleRef.current !== 'gm' || !groupSharedRef.current) return;
    const members = groupSnapshot();
    Object.values(clientConnsRef.current).forEach((conn) => {
      if (conn && conn.open) {
        try { conn.send({ t: T_GROUP, eid: uid(), members }); } catch { /* */ }
      }
    });
  }, [groupSnapshot]);

  // Bogen-Updates kommen bei jedem Tastendruck — kurz sammeln, dann einmal senden.
  const scheduleGroupBroadcast = useCallback(() => {
    clearTimeout(groupTimerRef.current);
    groupTimerRef.current = setTimeout(broadcastGroupNow, 250);
  }, [broadcastGroupNow]);

  // SL schaltet die Gruppenuebersicht fuer die Runde an/aus.
  const setGroupShared = useCallback((on) => {
    setGroupSharedState(on);
    groupSharedRef.current = on;
    writeJSON(GROUP_SHARE_KEY, on);
    if (roleRef.current !== 'gm') return;
    if (on) {
      broadcastGroupNow();
    } else {
      Object.values(clientConnsRef.current).forEach((conn) => {
        if (conn && conn.open) {
          try { conn.send({ t: T_GROUP, eid: uid(), members: [] }); } catch { /* */ }
        }
      });
    }
  }, [broadcastGroupNow]);

  // --- Battlemap: SL ist Autoritaet, Bild und Zustand laufen getrennt ---
  // (siehe Kommentar bei T_MAP in protocol.js). Beide Refs merken sich den
  // letzten Stand, damit neu (wieder) verbundene Spieler ihn sofort bekommen.
  const broadcastMapState = useCallback((state) => {
    mapStateRef.current = state;
    if (roleRef.current !== 'gm' || !mapSharedRef.current) return;
    clearTimeout(mapStateTimerRef.current);
    mapStateTimerRef.current = setTimeout(() => {
      Object.values(clientConnsRef.current).forEach((conn) => {
        if (conn && conn.open) {
          try { conn.send({ t: T_MAP, eid: uid(), ...mapStateRef.current }); } catch { /* */ }
        }
      });
    }, 150);
  }, []);

  const broadcastMapImage = useCallback((name, dataUrl) => {
    mapImageRef.current = { name, dataUrl };
    if (roleRef.current !== 'gm' || !mapSharedRef.current) return;
    Object.values(clientConnsRef.current).forEach((conn) => {
      if (conn && conn.open) {
        try { conn.send({ t: T_MAP_IMG, eid: uid(), name, dataUrl }); } catch { /* */ }
      }
    });
  }, []);

  // SL schaltet die Kartenfreigabe an/aus. Beim Einschalten den zuletzt
  // gemeldeten Stand sofort mitschicken, statt auf die naechste Aenderung zu warten.
  const setMapShared = useCallback((on) => {
    setMapSharedState(on);
    mapSharedRef.current = on;
    writeJSON(MAP_SHARE_KEY, on);
    if (roleRef.current !== 'gm') return;
    Object.values(clientConnsRef.current).forEach((conn) => {
      if (conn && conn.open) {
        try { conn.send({ t: T_MAP_SHARE, eid: uid(), shared: on }); } catch { /* */ }
      }
    });
    if (on) {
      if (mapStateRef.current) broadcastMapState(mapStateRef.current);
      if (mapImageRef.current) broadcastMapImage(mapImageRef.current.name, mapImageRef.current.dataUrl);
    }
  }, [broadcastMapState, broadcastMapImage]);

  // SL zeigt ein Handout: allen (peerIds = null) oder nur den angegebenen
  // Spielern. Gibt zurueck, wie vielen es zugestellt wurde.
  const sendHandout = useCallback((handout, peerIds = null) => {
    if (roleRef.current !== 'gm') return 0;
    const targets = peerIds || Object.keys(clientConnsRef.current);
    let delivered = 0;
    targets.forEach((pid) => {
      const conn = clientConnsRef.current[pid];
      if (conn && conn.open) {
        try { conn.send({ t: T_HANDOUT, eid: uid(), handout }); delivered += 1; } catch { /* */ }
      }
    });
    return delivered;
  }, []);

  const clearNewHandout = useCallback(() => setNewHandoutId(null), []);
  const removeHandout = useCallback((id) => {
    setHandouts((prev) => {
      const next = prev.filter((h) => h.id !== id);
      writeJSON(HANDOUTS_KEY, next);
      return next;
    });
  }, []);

  // --- Soundboard: SL loest Sounds bei allen aus (siehe utils/sound.js) ---
  const broadcastSound = useCallback((payload) => {
    if (roleRef.current !== 'gm') return;
    Object.values(clientConnsRef.current).forEach((conn) => {
      if (conn && conn.open) {
        try { conn.send({ eid: uid(), ...payload }); } catch { /* */ }
      }
    });
  }, []);

  const sendSoundFx = useCallback((kind, volume) => {
    playFx(kind, volume);
    broadcastSound({ t: T_SOUND_FX, kind, volume });
  }, [broadcastSound]);

  const previewSoundFx = useCallback((kind, volume) => playFx(kind, volume), []);

  const sendCustomSound = useCallback((name, blob, volume) => {
    playBlob(blob, volume);
    broadcastSound({ t: T_SOUND_CUSTOM, name, volume, blob });
  }, [broadcastSound]);

  const previewCustomSound = useCallback((blob, volume) => playBlob(blob, volume), []);

  const setSoundVolumeShared = useCallback((volume) => {
    setLiveVolume(volume);
    broadcastSound({ t: T_SOUND_VOL, volume });
  }, [broadcastSound]);

  const stopSoundShared = useCallback(() => {
    stopAllAudioLocal();
    broadcastSound({ t: T_SOUND_STOP });
  }, [broadcastSound]);

  const fadeOutSoundShared = useCallback(() => {
    fadeOutAllAudioLocal();
    broadcastSound({ t: T_SOUND_FADE });
  }, [broadcastSound]);

  // SL teilt die Tageszeit (oder blendet sie mit clock=null wieder aus).
  const shareTime = useCallback((clock) => {
    setPartyTime(clock);
    partyTimeRef.current = clock;
    if (roleRef.current === 'gm') {
      Object.values(clientConnsRef.current).forEach((conn) => {
        if (conn && conn.open) {
          try { conn.send({ t: T_TIME, eid: uid(), clock }); } catch { /* */ }
        }
      });
    }
  }, []);

  // --- Tischmitte (SL ist Autoritaet, verteilt nach jeder Aenderung den kompletten Stand) ---
  const commitStash = useCallback((next) => {
    stashRef.current = next;
    setStash(next);
    if (roleRef.current === 'gm') {
      writeJSON(GM_STASH_KEY, next);
      // Versteckte Gegenstaende verlassen den SL-Rechner nicht.
      const visible = next.filter((i) => !i.hidden);
      const cfg = { ...stashCfgRef.current, used: stashUsed(next) };
      stashCfgRef.current = cfg;
      setStashCfgState(cfg);
      Object.values(clientConnsRef.current).forEach((conn) => {
        if (conn && conn.open) conn.send({ t: T_STASH, items: visible, cfg });
      });
    }
  }, []);

  // SL: Name und Platzzahl des Lagers aendern (z. B. "Karren", 6 Plaetze).
  const setStashCfg = useCallback((patch) => {
    const merged = { ...normalizeStashCfg({ ...stashCfgRef.current, ...patch }), used: stashUsed(stashRef.current) };
    stashCfgRef.current = merged;
    setStashCfgState(merged);
    writeJSON(GM_STASH_CFG_KEY, { name: merged.name, capacity: merged.capacity });
    if (roleRef.current === 'gm') {
      const visible = stashRef.current.filter((i) => !i.hidden);
      Object.values(clientConnsRef.current).forEach((conn) => {
        if (conn && conn.open) {
          try { conn.send({ t: T_STASH, items: visible, cfg: merged }); } catch { /* */ }
        }
      });
    }
  }, []);

  const stashAddItem = useCallback((item) => {
    commitStash([{ ...item }, ...stashRef.current]);
  }, [commitStash]);

  const stashRemoveItem = useCallback((itemId) => {
    commitStash(stashRef.current.filter((i) => i.itemId !== itemId));
  }, [commitStash]);

  // SL aendert einen Gegenstand in der Mitte (z.B. sein Symbol).
  const stashUpdateItem = useCallback((next) => {
    commitStash(stashRef.current.map((i) => (i.itemId === next.itemId ? next : i)));
  }, [commitStash]);

  // SL blendet einen vorbereiteten Gegenstand fuer die Spieler ein/aus.
  const stashToggleHidden = useCallback((itemId) => {
    commitStash(stashRef.current.map((i) => (i.itemId === itemId ? { ...i, hidden: !i.hidden } : i)));
  }, [commitStash]);

  // Spieler: Gegenstand in die Mitte legen bzw. einen herausnehmen wollen
  const stashDrop = useCallback((item) => {
    const conn = hostConnRef.current;
    if (conn && conn.open) conn.send({ t: T_STASH_DROP, item, eid: newEid() });
  }, []);
  const stashTake = useCallback((itemId) => {
    const conn = hostConnRef.current;
    if (conn && conn.open) conn.send({ t: T_STASH_TAKE, itemId, eid: newEid() });
  }, []);

  const cleanupPeer = useCallback(() => {
    clearTimeout(joinTimeoutRef.current);
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch { /* schon zerstoert */ }
    }
    peerRef.current = null;
    hostConnRef.current = null;
    clientConnsRef.current = {};
    Object.values(unauthRef.current).forEach((u) => clearTimeout(u.timer));
    unauthRef.current = {};
    admittedInfoRef.current = {};
    challengeRef.current = null;
    reconnectAttemptsRef.current = 0;
    reconnectPendingRef.current = false;
    retryJoinAttemptsRef.current = 0;
    retryJoinPendingRef.current = false;
  }, []);

  const leaveSession = useCallback(() => {
    cleanupPeer();
    clearSession();
    roleRef.current = null;
    setRole(null);
    setRoomCode('');
    setRoomOnline(false);
    setConnectionState('idle');
    setStatusMessage('');
    setPlayers({});
    setLiveLog([]);
    setGmCommand(null);
    knownPeersRef.current = new Set();
    stashRef.current = [];
    setStash([]);
    setPartyGroup([]);
    setMyPeerId(null);
    setPartyMap(null);
    setPending([]);
    setBannedCount(0);
    setAuthPrompt(null);
    secretRef.current = null;
    trustedRef.current = new Set();
    bannedRef.current = new Set();
    joinPwRef.current = '';
    authedRef.current = false;
    authFailedRef.current = false;
    try { sessionStorage.removeItem(GM_SECURITY_KEY); } catch { /* */ }
  }, [cleanupPeer]);

  // SL raeumt die Tischmitte komplett ab (auch aus dem lokalen Speicher).
  const clearStash = useCallback(() => {
    removeStore(GM_STASH_KEY);
    commitStash([]);
  }, [commitStash]);

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

  const handleIncomingRef = useRef(null);
  const handleIncoming = useCallback((peerId, payload) => {
    if (!isMessage(payload)) return;
    // Daten nimmt der SL nur von zugelassenen Verbindungen an.
    if (roleRef.current === 'gm' && !clientConnsRef.current[peerId]) return;
    // Doppelt zugestellte Nachrichten (Reconnect / mehrfache DataConnection) verwerfen
    if (payload.eid != null) {
      if (seenEidsRef.current.has(payload.eid)) return;
      seenEidsRef.current.add(payload.eid);
      if (seenEidsRef.current.size > 400) {
        seenEidsRef.current = new Set([...seenEidsRef.current].slice(-200));
      }
    }
    const name = playersRef.current[peerId]?.character?.name || '?';
    const sendTo = (pid, msg) => {
      const conn = clientConnsRef.current[pid];
      if (conn && conn.open) conn.send({ eid: newEid(), ...msg });
    };

    if (payload.t === T_STATE) {
      setPlayers((prev) => ({
        ...prev,
        [peerId]: { character: payload.character, items: payload.items || {}, lastSeen: Date.now() },
      }));
      scheduleGroupBroadcast();
      if (roleRef.current === 'gm' && !knownPeersRef.current.has(peerId) && payload.character?.name?.trim()) {
        knownPeersRef.current.add(peerId);
        pushLog({ kind: 'system', key: 'mp.log.joined', vars: { name: payload.character.name } });
      }
    } else if (payload.t === T_EVENT) {
      pushLog({ kind: 'event', playerId: peerId, playerName: name, ev: payload.ev });
    } else if (payload.t === T_SAY) {
      pushLog({ kind: 'say', playerId: peerId, playerName: name, text: String(payload.text || '') });
    } else if (payload.t === T_STASH_DROP && payload.item) {
      const { bounce, ...dropped } = payload.item;
      // Lager voll: der Gegenstand geht zurueck. Ein zurueckgeschickter (bounce) wird immer
      // angenommen — sonst gaebe es eine Endlosschleife, wenn der Spieler keinen Platz mehr hat.
      if (!bounce && !stashHasRoom(stashUsed(stashRef.current), dropped, stashCfgRef.current.capacity)) {
        sendTo(peerId, { t: T_GM, cmd: GM_STASH_FULL, item: dropped });
        return;
      }
      commitStash([{ ...dropped, origin: 'stash' }, ...stashRef.current]);
      pushLog({ kind: 'system', key: 'gm.log.stashDrop', vars: { name, item: itemLabel(dropped) } });
    } else if (payload.t === T_STASH_TAKE) {
      // Versteckte Gegenstaende gelten als nicht vorhanden — sie wurden nie ausgeliefert.
      const found = stashRef.current.find((i) => i.itemId === payload.itemId && !i.hidden);
      if (found) {
        commitStash(stashRef.current.filter((i) => i.itemId !== payload.itemId));
        sendTo(peerId, { t: T_GM, cmd: GM_GIVE, item: found });
        pushLog({ kind: 'system', key: 'gm.log.stashTake', vars: { name, item: itemLabel(found) } });
      } else {
        sendTo(peerId, { t: T_GM, cmd: GM_STASH_DENY, itemId: payload.itemId });
      }
    }
  }, [pushLog, commitStash, scheduleGroupBroadcast]);
  handleIncomingRef.current = handleIncoming;

  // --- SL: Zugangskontrolle ---------------------------------------------
  const persistSecurity = useCallback((pw) => {
    try {
      const prev = JSON.parse(sessionStorage.getItem(GM_SECURITY_KEY) || 'null') || {};
      sessionStorage.setItem(GM_SECURITY_KEY, JSON.stringify({
        code: roomCodeRef.current,
        pw: pw !== undefined ? pw : (prev.code === roomCodeRef.current ? prev.pw : ''),
        trusted: [...trustedRef.current].slice(-200),
        banned: [...bannedRef.current].slice(-200),
      }));
    } catch { /* privater Modus */ }
  }, []);

  const refreshPending = useCallback(() => {
    setPending(Object.entries(unauthRef.current)
      .filter(([, u]) => u.state === 'pending')
      .map(([peerId, u]) => ({ peerId, name: u.name })));
  }, []);

  const dropUnauth = useCallback((peerId) => {
    const u = unauthRef.current[peerId];
    if (!u) return;
    clearTimeout(u.timer);
    delete unauthRef.current[peerId];
    refreshPending();
  }, [refreshPending]);

  const armUnauthTimer = useCallback((peerId, ms, reason = 'timeout') => {
    const u = unauthRef.current[peerId];
    if (!u) return;
    clearTimeout(u.timer);
    u.timer = setTimeout(() => {
      const cur = unauthRef.current[peerId];
      if (!cur) return;
      try { cur.conn.send({ t: T_AUTH, step: 'denied', reason }); } catch { /* */ }
      try { cur.conn.close(); } catch { /* */ }
      dropUnauth(peerId);
    }, ms);
  }, [dropUnauth]);

  const denyConn = useCallback((conn, reason) => {
    try { conn.send({ t: T_AUTH, step: 'denied', reason }); } catch { /* */ }
    dropUnauth(conn.peer);
    // kurz warten, damit die Absage noch ankommt, dann trennen
    setTimeout(() => { try { conn.close(); } catch { /* */ } }, 200);
  }, [dropUnauth]);

  // Alles, was ein neu zugelassener Spieler zum Start bekommt (frueher beim Verbindungsaufbau).
  const sendBundle = useCallback((conn) => {
    try {
      conn.send({
        t: T_STASH,
        items: stashRef.current.filter((i) => !i.hidden),
        cfg: { ...stashCfgRef.current, used: stashUsed(stashRef.current) },
      });
    } catch { /* */ }
    try {
      conn.send({ t: T_LOGCFG, eid: uid(), shared: partyLogRef.current });
      if (partyLogRef.current) {
        const backlog = liveLogRef.current.filter(isShareable).slice(0, 40);
        if (backlog.length) conn.send({ t: T_LOG, eid: uid(), entries: backlog });
      }
      if (partyTimeRef.current) conn.send({ t: T_TIME, eid: uid(), clock: partyTimeRef.current });
      conn.send({ t: T_RESTCFG, eid: uid(), locked: restLockedRef.current });
      if (partyNpcsRef.current.length) conn.send({ t: T_NPCS, eid: uid(), npcs: partyNpcsRef.current });
      if (groupSharedRef.current) conn.send({ t: T_GROUP, eid: uid(), members: groupSnapshot() });
      conn.send({ t: T_MAP_SHARE, eid: uid(), shared: mapSharedRef.current });
      if (mapSharedRef.current) {
        if (mapStateRef.current) conn.send({ t: T_MAP, eid: uid(), ...mapStateRef.current });
        if (mapImageRef.current) conn.send({ t: T_MAP_IMG, eid: uid(), ...mapImageRef.current });
      }
    } catch { /* */ }
  }, [groupSnapshot]);

  // Verbindung zulassen: ab jetzt gehoert sie zu clientConnsRef (alle Broadcasts).
  const admitConn = useCallback((conn, info) => {
    const pid = conn.peer;
    const old = clientConnsRef.current[pid];
    if (old && old !== conn) {
      try { old.close(); } catch { /* */ }
    }
    dropUnauth(pid);
    clientConnsRef.current[pid] = conn;
    admittedInfoRef.current[pid] = { clientId: info.clientId, name: info.name };
    if (info.clientId && !String(info.clientId).startsWith('legacy-')) {
      trustedRef.current.add(info.clientId);
      persistSecurity();
    }
    try { conn.send({ t: T_AUTH, step: 'ok' }); } catch { /* */ }
    sendBundle(conn);
  }, [dropUnauth, persistSecurity, sendBundle]);

  const isBanned = (clientId, peerId) => bannedRef.current.has(clientId) || bannedRef.current.has(peerId);

  // Nach Passwort (oder ohne): ggf. auf die Zusage des SL warten.
  const afterPassword = useCallback((conn, u) => {
    if (approvalRef.current && !trustedRef.current.has(u.clientId)) {
      u.state = 'pending';
      try { conn.send({ t: T_AUTH, step: 'wait' }); } catch { /* */ }
      armUnauthTimer(conn.peer, PENDING_TIMEOUT_MS);
      refreshPending();
    } else {
      admitConn(conn, u);
    }
  }, [admitConn, armUnauthTimer, refreshPending]);

  const handleUnauth = useCallback(async (conn, payload) => {
    if (!isMessage(payload)) return;
    const pid = conn.peer;
    const u = unauthRef.current[pid];
    if (!u || u.conn !== conn) return;

    if (payload.t === T_HELLO && u.state === 'new') {
      const clientId = String(payload.clientId || '').slice(0, 64);
      if (!clientId) { denyConn(conn, 'rejected'); return; }
      u.clientId = clientId;
      u.name = String(payload.name || '').trim().slice(0, 40);
      if (isBanned(clientId, pid)) { denyConn(conn, 'kicked'); return; }
      if (Date.now() < failRef.current.lockedUntil) { denyConn(conn, 'locked'); return; }
      if (secretRef.current) {
        u.state = 'challenged';
        u.nonce = randomHex(16);
        armUnauthTimer(pid, CHALLENGE_TIMEOUT_MS); // der Spieler muss das Passwort ja noch eintippen
        try { conn.send({ t: T_AUTH, step: 'challenge', nonce: u.nonce }); } catch { /* */ }
      } else {
        afterPassword(conn, u);
      }
    } else if (payload.t === T_AUTH && payload.step === 'proof' && u.state === 'challenged') {
      u.state = 'verifying';
      let ok = false;
      try {
        const expected = await makeProof(secretRef.current, u.nonce, roomCodeRef.current);
        ok = typeof payload.proof === 'string' && safeEqual(expected, payload.proof);
      } catch { ok = false; }
      if (unauthRef.current[pid] !== u) return; // waehrenddessen getrennt
      if (!ok) {
        // Brute-Force-Bremse: 5 Fehlversuche in 60 s sperren alle Anmeldungen fuer 60 s.
        const f = failRef.current;
        if (Date.now() - f.since > 60000) { f.count = 0; f.since = Date.now(); }
        f.count += 1;
        if (f.count >= 5) { f.lockedUntil = Date.now() + 60000; f.count = 0; }
        denyConn(conn, 'password');
        return;
      }
      u.state = 'verified';
      afterPassword(conn, u);
    } else if (payload.t === T_STATE && u.state === 'new' && !secretRef.current && !approvalRef.current
      && !isBanned(`legacy-${pid}`, pid)) {
      // Alter Client (vor dem Zugangs-Protokoll): kennt kein Hallo und schickt gleich seinen Bogen.
      // Nur im offenen Raum zugelassen — mit Passwort oder Bestaetigung kommt er nicht rein.
      u.clientId = `legacy-${pid}`;
      admitConn(conn, u);
      handleIncomingRef.current?.(pid, payload);
    }
  }, [admitConn, afterPassword, armUnauthTimer, denyConn]);

  // SL: Raum-Passwort setzen (leer = kein Passwort). Gilt fuer neue Verbindungen.
  const setRoomPassword = useCallback(async (pw) => {
    const value = String(pw || '');
    if (!value) {
      secretRef.current = null;
      setSecurity((s) => ({ ...s, password: false, passwordText: '' }));
      persistSecurity('');
      return true;
    }
    if (!hasCrypto()) return false;
    secretRef.current = await deriveKey(value, roomCodeRef.current);
    setSecurity((s) => ({ ...s, password: true, passwordText: value }));
    persistSecurity(value);
    return true;
  }, [persistSecurity]);

  const setApprovalRequired = useCallback((on) => {
    setSecurity((s) => ({ ...s, approval: !!on }));
    approvalRef.current = !!on;
    writeJSON(APPROVAL_KEY, !!on);
    // Schaltet der SL die Bestaetigung aus, werden wartende Anfragen eingelassen.
    if (!on) {
      Object.values(unauthRef.current)
        .filter((u) => u.state === 'pending')
        .forEach((u) => admitConn(u.conn, u));
    }
  }, [admitConn]);

  const approvePending = useCallback((peerId) => {
    const u = unauthRef.current[peerId];
    if (u && u.state === 'pending') admitConn(u.conn, u);
  }, [admitConn]);

  const rejectPending = useCallback((peerId) => {
    const u = unauthRef.current[peerId];
    if (u) denyConn(u.conn, 'rejected');
  }, [denyConn]);

  // SL wirft einen Spieler raus und sperrt das Geraet fuer diese Sitzung.
  const kickPlayer = useCallback((peerId) => {
    const conn = clientConnsRef.current[peerId];
    const info = admittedInfoRef.current[peerId] || {};
    const name = playersRef.current[peerId]?.character?.name || info.name || '?';
    bannedRef.current.add(peerId);
    if (info.clientId) {
      bannedRef.current.add(info.clientId);
      trustedRef.current.delete(info.clientId);
    }
    persistSecurity();
    setBannedCount(countBanned(bannedRef.current));
    // erst aus der Liste nehmen, damit der close-Handler nicht noch "hat den Raum verlassen" loggt
    delete clientConnsRef.current[peerId];
    delete admittedInfoRef.current[peerId];
    knownPeersRef.current.delete(peerId);
    if (conn) {
      try { conn.send({ t: T_AUTH, step: 'denied', reason: 'kicked' }); } catch { /* */ }
      setTimeout(() => { try { conn.close(); } catch { /* */ } }, 200);
    }
    setPlayers((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
    pushLog({ kind: 'system', key: 'mp.log.kicked', vars: { name } });
    scheduleGroupBroadcast();
  }, [persistSecurity, pushLog, scheduleGroupBroadcast]);

  const unbanAll = useCallback(() => {
    bannedRef.current = new Set();
    persistSecurity();
    setBannedCount(0);
  }, [persistSecurity]);

  // --- SL: Sitzung hosten ---
  const hostSession = useCallback((preferredCodeArg) => {
    const preferredCode = typeof preferredCodeArg === 'string' ? preferredCodeArg : undefined;
    cleanupPeer();
    setConnectionState('connecting');
    setStatusMessage(preferredCode ? 'restore' : 'creating');
    setPlayers({});
    setLiveLog([]);

    const code = preferredCode || generateRoomCode();
    roomCodeRef.current = code;
    secretRef.current = null;
    trustedRef.current = new Set();
    bannedRef.current = new Set();
    failRef.current = { count: 0, since: 0, lockedUntil: 0 };
    setSecurity((sec) => ({ ...sec, password: false, passwordText: '' }));
    setPending([]);
    setBannedCount(0);
    const peer = new Peer(ROOM_PREFIX + code, peerConfig());
    peerRef.current = peer;
    let opened = false;

    peer.on('open', () => {
      if (opened) return; // 'open' feuert nach Reconnect erneut
      opened = true;
      reconnectAttemptsRef.current = 0;
      roleRef.current = 'gm';
      const savedStash = readJSON(GM_STASH_KEY, []) || [];
      stashRef.current = savedStash;
      setStash(savedStash);
      setStashCfgState((c) => ({ ...c, used: stashUsed(savedStash) }));
      setRoomCode(code);
      setRoomOnline(true);
      setRole('gm');
      setConnectionState('connected');
      setStatusMessage('');
      pushLog({ kind: 'system', key: 'mp.log.started', vars: { code } });
      saveSession('gm', code);

      // Zugangskontrolle: Passwort und zugelassene/gesperrte Geraete dieser Sitzung wiederherstellen
      // (nach einem Neuladen des SL muessen nicht alle erneut gefragt werden).
      roomCodeRef.current = code;
      let saved = null;
      try { saved = JSON.parse(sessionStorage.getItem(GM_SECURITY_KEY) || 'null'); } catch { /* */ }
      if (saved && saved.code === code) {
        trustedRef.current = new Set(saved.trusted || []);
        bannedRef.current = new Set(saved.banned || []);
        setBannedCount(countBanned(bannedRef.current));
        if (saved.pw && hasCrypto()) {
          deriveKey(saved.pw, code).then((k) => {
            secretRef.current = k;
            setSecurity((sec) => ({ ...sec, password: true, passwordText: saved.pw }));
          }).catch(() => { /* ohne Passwort weiter — der SL kann es neu setzen */ });
        }
      }
    });

    peer.on('disconnected', () => {
      setRoomOnline(false);
      reconnectHost();
    });

    peer.on('connection', (conn) => {
      const pid = conn.peer;
      // Neue Verbindung: unauthentifiziert. Daten bekommt sie erst nach dem Einlass
      // (admitConn) — bis dahin ist sie NICHT in clientConnsRef und sieht keinen Broadcast.
      const stale = unauthRef.current[pid];
      if (stale) {
        clearTimeout(stale.timer);
        try { stale.conn.close(); } catch { /* */ }
      }
      if (Object.keys(unauthRef.current).length >= MAX_UNAUTH) {
        conn.on('open', () => {
          try { conn.send({ t: T_AUTH, step: 'denied', reason: 'full' }); } catch { /* */ }
          setTimeout(() => { try { conn.close(); } catch { /* */ } }, 200);
        });
        return;
      }
      unauthRef.current[pid] = { conn, state: 'new', timer: null };
      armUnauthTimer(pid, AUTH_TIMEOUT_MS);

      conn.on('data', (data) => {
        if (clientConnsRef.current[pid] === conn) handleIncoming(pid, data);
        else handleUnauth(conn, data);
      });
      conn.on('close', () => {
        if (unauthRef.current[pid]?.conn === conn) dropUnauth(pid);
        if (clientConnsRef.current[pid] !== conn) return; // nie zugelassen oder bereits ersetzt
        delete clientConnsRef.current[pid];
        delete admittedInfoRef.current[pid];
        knownPeersRef.current.delete(pid);
        const name = playersRef.current[pid]?.character?.name;
        if (name) pushLog({ kind: 'system', key: 'mp.log.left', vars: { name } });
        setPlayers((prev) => {
          const next = { ...prev };
          delete next[pid];
          return next;
        });
        scheduleGroupBroadcast();
      });
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
  }, [cleanupPeer, handleIncoming, handleUnauth, armUnauthTimer, dropUnauth, pushLog, reconnectHost, scheduleGroupBroadcast]);

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
    authedRef.current = false;
    authFailedRef.current = false;
    challengeRef.current = null;

    // Eingelassen (oder alter SL ohne Zugangskontrolle): ab jetzt normaler Betrieb.
    const becomeConnected = () => {
      if (authedRef.current) return;
      authedRef.current = true;
      clearTimeout(joinTimeoutRef.current);
      retryJoinAttemptsRef.current = 0;
      challengeRef.current = null;
      setAuthPrompt(null);
      setRole('player');
      setRoomCode(code);
      setConnectionState('connected');
      setStatusMessage('');
      saveSession('player', code, joinPwRef.current);
      setResyncNonce((n) => n + 1);
      setMyPeerId(peerRef.current?.id || null);
    };

    // Auf die Passwort-Frage des SL antworten (das Passwort selbst geht nie raus).
    const answerChallenge = async (nonce) => {
      if (!hasCrypto()) {
        authFailedRef.current = true;
        setConnectionState('error');
        setStatusMessage('noCrypto');
        return;
      }
      try {
        const key = await deriveKey(joinPwRef.current, code);
        const proof = await makeProof(key, nonce, code);
        if (conn.open) conn.send({ t: T_AUTH, step: 'proof', proof });
      } catch {
        authFailedRef.current = true;
        setConnectionState('error');
        setStatusMessage('noCrypto');
      }
    };
    challengeAnswerRef.current = (pw) => {
      joinPwRef.current = pw;
      const c = challengeRef.current;
      if (!c || c.conn !== conn) return false;
      challengeRef.current = null;
      setAuthPrompt(null);
      setStatusMessage('authenticating');
      answerChallenge(c.nonce);
      return true;
    };

    const handleAuth = (payload) => {
      if (payload.step === 'challenge' && typeof payload.nonce === 'string') {
        if (joinPwRef.current) {
          setStatusMessage('authenticating');
          answerChallenge(payload.nonce);
        } else {
          challengeRef.current = { nonce: payload.nonce, conn };
          setAuthPrompt('password');
          setConnectionState('connecting');
          setStatusMessage('needPassword');
        }
      } else if (payload.step === 'wait') {
        setConnectionState('connecting');
        setStatusMessage('waitApproval');
      } else if (payload.step === 'ok') {
        becomeConnected();
      } else if (payload.step === 'denied') {
        authFailedRef.current = true;
        authedRef.current = false;
        clearTimeout(joinTimeoutRef.current);
        clearSession();
        setConnectionState('error');
        const map = {
          password: 'wrongPassword', kicked: 'kicked', rejected: 'rejected', locked: 'locked', timeout: 'authTimeout', full: 'hostBusy',
        };
        setStatusMessage(map[payload.reason] || 'rejected');
        if (payload.reason === 'password') {
          joinPwRef.current = '';
          setAuthPrompt('password');
        } else {
          setAuthPrompt(null);
        }
      }
    };

    conn.on('open', () => {
      clearTimeout(joinTimeoutRef.current);
      // Hallo: Geraete-ID (fuer Wiedererkennen/Sperre) und Name der Maus (fuer die Anfrage beim SL).
      try { conn.send({ t: T_HELLO, v: 2, clientId: getClientId(), name: identityRef.current }); } catch { /* */ }
    });

    conn.on('data', (payload) => {
      if (!isMessage(payload)) return;
      if (payload.t === T_AUTH) { handleAuth(payload); return; }
      // Alter SL (ohne Zugangskontrolle) schickt gleich Daten: einfach so weitermachen.
      if (!authedRef.current && !authFailedRef.current) becomeConnected();
      if (payload.t === T_STASH) {
        commitStash(Array.isArray(payload.items) ? payload.items : []);
        if (payload.cfg) setStashCfgState({ ...normalizeStashCfg(payload.cfg), used: Math.max(0, Number(payload.cfg.used) || 0) });
      } else if (payload.t === T_GM) {
        // id vom Absender (eid) -> App entdedupliziert doppelt zugestellte Befehle
        setGmCommand({ ...payload, id: payload.eid ?? Date.now() + Math.random() });
      } else if (payload.t === T_LOGCFG) {
        setPartyLog(!!payload.shared);
      } else if (payload.t === T_TIME) {
        setPartyTime(payload.clock || null);
      } else if (payload.t === T_RESTCFG) {
        setRestLocked(!!payload.locked);
      } else if (payload.t === T_NPCS) {
        setPartyNpcs(Array.isArray(payload.npcs) ? payload.npcs : []);
      } else if (payload.t === T_GROUP) {
        setPartyGroup(Array.isArray(payload.members) ? payload.members : []);
      } else if (payload.t === T_MAP_SHARE) {
        if (!payload.shared) setPartyMap(null);
      } else if (payload.t === T_MAP) {
        const { name, raster, figuren, formen, nebel } = payload;
        setPartyMap((prev) => ({ ...prev, name, raster, figuren, formen, nebel }));
      } else if (payload.t === T_MAP_IMG) {
        setPartyMap((prev) => ({ ...prev, name: payload.name, dataUrl: payload.dataUrl }));
      } else if (payload.t === T_HANDOUT && payload.handout?.id) {
        const h = payload.handout;
        setHandouts((prev) => {
          const next = [h, ...prev.filter((x) => x.id !== h.id)].slice(0, MAX_HANDOUTS);
          writeJSON(HANDOUTS_KEY, next);
          return next;
        });
        setNewHandoutId(h.id);
      } else if (payload.t === T_SOUND_FX) {
        playFx(payload.kind, payload.volume);
      } else if (payload.t === T_SOUND_CUSTOM && payload.blob) {
        const blob = payload.blob instanceof Blob ? payload.blob : new Blob([payload.blob]);
        playBlob(blob, payload.volume);
      } else if (payload.t === T_SOUND_VOL) {
        setLiveVolume(payload.volume);
      } else if (payload.t === T_SOUND_STOP) {
        stopAllAudioLocal();
      } else if (payload.t === T_SOUND_FADE) {
        fadeOutAllAudioLocal();
      } else if (payload.t === T_LOG) {
        const incoming = payload.entries || (payload.entry ? [payload.entry] : []);
        if (incoming.length) {
          setLiveLog((prev) => {
            const seen = new Set(prev.map((e) => e.id));
            const add = incoming.filter((e) => e && e.id && !seen.has(e.id));
            return add.length ? [...add, ...prev].sort((a, b) => b.time - a.time).slice(0, 200) : prev;
          });
        }
      }
    });

    conn.on('close', () => {
      if (hostConnRef.current !== conn) return; // bereits ersetzt
      hostConnRef.current = null;
      // Abgelehnt/gesperrt/falsches Passwort: nicht automatisch weiter versuchen.
      if (authFailedRef.current) return;
      setConnectionState('connecting');
      setStatusMessage('hostInterrupted');
      attemptReconnectToHost(code);
    });

    conn.on('error', () => clearTimeout(joinTimeoutRef.current));
  }, [attemptReconnectToHost, commitStash]);

  wireHostRef.current = wireHostConnection;

  const joinSession = useCallback((codeInput, opts = {}) => {
    const code = (codeInput || '').trim().toUpperCase();
    if (!code) {
      setStatusMessage('needCode');
      return;
    }
    cleanupPeer();
    joinPwRef.current = opts.password || '';
    lastJoinCodeRef.current = code;
    authFailedRef.current = false;
    authedRef.current = false;
    setAuthPrompt(null);
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

  // Spieler: Passwort eintippen. Laeuft die Verbindung noch (Frage wartet), wird einfach geantwortet,
  // sonst (nach "falsches Passwort") neu verbunden.
  const submitPassword = useCallback((pw) => {
    const value = String(pw || '');
    if (!value) return;
    if (challengeAnswerRef.current && challengeAnswerRef.current(value)) return;
    if (lastJoinCodeRef.current) joinSession(lastJoinCodeRef.current, { password: value });
  }, [joinSession]);

  // Name der Maus, den der SL bei einer Beitrittsanfrage sieht.
  const setIdentity = useCallback((name) => { identityRef.current = String(name || '').trim().slice(0, 40); }, []);

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
      joinSession(stored.roomCode, { password: stored.pw });
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join');
    if (joinParam) {
      // Passwort im Einladungslink steht hinter dem '#' — der geht nie an einen Server.
      const hashPw = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('pw') || '';
      const url = new URL(window.location.href);
      url.searchParams.delete('join');
      url.hash = '';
      window.history.replaceState({}, '', url);
      joinSession(joinParam, { password: hashPw });
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
    partyLog,
    setPartyLogShared,
    partyTime,
    shareTime,
    restLocked,
    setRestLockedShared,
    partyNpcs,
    shareNpcs,
    groupShared,
    setGroupShared,
    partyGroup,
    myPeerId,
    mapShared,
    setMapShared,
    broadcastMapState,
    broadcastMapImage,
    partyMap,
    handouts,
    newHandoutId,
    clearNewHandout,
    removeHandout,
    sendHandout,
    sendSoundFx,
    previewSoundFx,
    sendCustomSound,
    previewCustomSound,
    setSoundVolumeShared,
    stopSoundShared,
    fadeOutSoundShared,
    resyncNonce,
    security,
    pending,
    bannedCount,
    authPrompt,
    setRoomPassword,
    setApprovalRequired,
    approvePending,
    rejectPending,
    kickPlayer,
    unbanAll,
    submitPassword,
    setIdentity,
    gmCommand,
    stash,
    stashCfg,
    setStashCfg,
    hostSession,
    joinSession,
    leaveSession,
    sendState,
    sendEvent,
    sendSay,
    sendGmCommand,
    logGmAction,
    clearGmCommand,
    stashAddItem,
    stashRemoveItem,
    stashToggleHidden,
    stashUpdateItem,
    stashDrop,
    stashTake,
    clearStash,
  };
}
