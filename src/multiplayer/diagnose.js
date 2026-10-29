// Warum kommt keine Verbindung zustande? WebRTC meldet das nicht selbst.
//
// Wichtig: Chrome wirft gescheiterte Kandidaten nach ~15 s aus getStats() —
// wer erst beim Timeout nachschaut, sieht "keine Kandidaten vom SL", obwohl der
// SL sehr wohl Adressen geschickt hat und nur kein Weg zwischen den Netzen
// existiert. Deshalb protokolliert `watchConnection` den Aufbau live mit.

import { iceServerList, hasTurn } from './protocol.js';

// "candidate:… 1 udp 2122260223 192.0.2.1 54321 typ host …" -> { proto, typ, fam, addr, port }
export function parseCandidate(str) {
  const m = / (udp|tcp) \d+ (\S+) (\d+) typ (\w+)/i.exec(String(str || ''));
  if (!m) return null;
  const addr = m[2];
  const fam = addr.endsWith('.local') ? 'm' : addr.includes(':') ? '6' : '4';
  return { proto: m[1].toLowerCase(), addr, port: Number(m[3]), typ: m[4], fam };
}
const token = (c) => `${c.typ}${c.fam}`; // z. B. host4, hostm (mDNS), srflx4, srflx6, relay4

// Den Aufbau einer DataConnection mitschreiben (gleich nach peer.connect bzw. im
// 'connection'-Handler aufrufen; PeerJS legt die RTCPeerConnection synchron an).
export function watchConnection(conn) {
  const d = { local: new Set(), remote: new Set(), answered: false, ice: 'new', checked: false };
  if (!conn) return d;
  conn.pnpDiag = d;
  const pc = conn.peerConnection;
  if (!pc) return d;
  pc.addEventListener('icecandidate', (e) => {
    const c = e.candidate && parseCandidate(e.candidate.candidate);
    if (c) d.local.add(token(c));
  });
  pc.addEventListener('iceconnectionstatechange', () => {
    d.ice = pc.iceConnectionState;
    if (d.ice !== 'new') d.checked = true;
  });
  // Spieler-Seite: von 'have-local-offer' nach 'stable' = die Antwort des SL ist da.
  pc.addEventListener('signalingstatechange', () => {
    if (pc.signalingState === 'stable') d.answered = true;
  });
  // Gegen-Kandidaten kommen per Trickle ueber PeerJS herein.
  const add = pc.addIceCandidate.bind(pc);
  pc.addIceCandidate = (cand, ...rest) => {
    const c = parseCandidate(cand?.candidate ?? cand);
    if (c) d.remote.add(token(c));
    return add(cand, ...rest);
  };
  return d;
}

// Oeffentlich erreichbare IP-Versionen einer Kandidatenmenge (mDNS-Hosts zaehlen nicht).
const publicFamilies = (set) => new Set([...set]
  .filter((k) => /^(srflx|prflx|relay)/.test(k) || k === 'host6')
  .map((k) => k.slice(-1)));

export function diagDetail(d) {
  const list = (s) => [...s].sort().join(',') || '-';
  return `answer:${d.answered ? 'yes' : 'no'} ice:${d.ice} L:${list(d.local)} R:${list(d.remote)} turn:${hasTurn() ? 'yes' : 'no'}`;
}

// Spieler-Seite, nach dem Beitritts-Timeout. Liefert { key (fuer mp.status.*), detail }.
export function diagnoseFailedConnection(conn) {
  const d = conn?.pnpDiag || watchConnection(null);
  let key;
  if (!d.local.size) key = 'diagBlocked'; // WebRTC im eigenen Browser gesperrt
  else if (!d.answered) key = 'diagNoAnswer'; // Angebot kam nie beantwortet zurueck
  else if (!d.remote.size) key = 'diagGmNoCandidates'; // SL hat geantwortet, aber keine Adressen geschickt
  else if (d.local.has('relay4') || d.local.has('relay6') || hasTurn()) key = 'diagFailed';
  else {
    const mine = publicFamilies(d.local);
    const theirs = publicFamilies(d.remote);
    const common = [...mine].some((f) => theirs.has(f));
    key = mine.size && theirs.size && !common ? 'diagIpMismatch' : 'diagNeedTurn';
  }
  return { key, detail: diagDetail(d) };
}

// SL-Seite: ein Beitrittsversuch kam an, der Datenkanal aber nie zustande.
// Liefert den Schluessel fuer den Log-Eintrag (mp.log.*).
export function classifyIncomingFailure(conn) {
  const d = conn?.pnpDiag || watchConnection(null);
  if (!d.local.size) return 'mp.log.joinBlocked'; // der SL selbst liefert keine Adressen
  if (!d.remote.size) return 'mp.log.joinNoCandidates'; // Spieler hat nichts geschickt (oder abgebrochen)
  return 'mp.log.joinNoRoute';
}

// Kurzer Test: was laesst dieses Netz zu?
//   host = lokales Netz, srflx = ueber STUN erreichbar, relay = ueber TURN.
//   symmetric: das Netz vergibt je Gegenstelle einen anderen Port (symmetrisches NAT,
//   typisch fuer Mobilfunk/CGNAT) — erkennbar, weil zwei STUN-Server verschiedene
//   Ports melden. Pro lokalem Socket gibt es sonst genau einen srflx-Port.
export function testConnectivity(timeoutMs = 7000) {
  return new Promise((resolve) => {
    const hosts = [];
    const srflx4 = new Set();
    const found = { host: false, srflx: false, relay: false, v6: false };
    let pc;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { pc.close(); } catch { /* */ }
      const v4Sockets = Math.max(1, hosts.length - (found.v6 ? 1 : 0));
      resolve({ ...found, turn: hasTurn(), symmetric: srflx4.size > v4Sockets });
    };
    try {
      pc = new RTCPeerConnection({ iceServers: iceServerList() });
      pc.createDataChannel('probe');
      pc.onicecandidate = (e) => {
        if (!e.candidate) { finish(); return; }
        const c = parseCandidate(e.candidate.candidate);
        if (!c || c.proto !== 'udp') return;
        found[c.typ] = true;
        if (c.typ === 'host') hosts.push(c.addr);
        if (c.typ === 'srflx' && c.fam === '6') found.v6 = true;
        if (c.typ === 'srflx' && c.fam === '4') srflx4.add(`${c.addr}:${c.port}`);
      };
      pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(finish);
      setTimeout(finish, timeoutMs);
    } catch {
      resolve({ ...found, turn: hasTurn(), unsupported: true });
    }
  });
}
