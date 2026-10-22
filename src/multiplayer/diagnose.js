// Warum kommt keine Verbindung zustande? WebRTC meldet das nicht selbst, aber die
// ICE-Kandidaten verraten es (siehe auch Verbindungstest im Mehrspieler-Fenster).

import { iceServerList, hasTurn } from './protocol.js';

// Nach einem Beitritts-Timeout auswerten. Liefert einen Schluessel fuer `mp.status.*`.
export async function diagnoseFailedConnection(conn) {
  const pc = conn && conn.peerConnection;
  const local = [];
  let remote = 0;
  if (pc) {
    try {
      const stats = await pc.getStats();
      stats.forEach((r) => {
        if (r.type === 'local-candidate' && r.candidateType) local.push(r.candidateType);
        if (r.type === 'remote-candidate') remote += 1;
      });
    } catch { /* keine Statistik */ }
  }
  if (!local.length) return 'diagBlocked'; // WebRTC im Browser gesperrt (VPN-/Privacy-Erweiterung)
  if (!remote) return 'diagNoAnswer'; // der SL hat keine Verbindungsdaten geschickt
  if (!local.includes('relay') && !hasTurn()) return 'diagNeedTurn'; // strenges NAT, kein Relay
  return 'diagFailed';
}

// Kurzer Test: welche Kandidatenarten findet dieser Browser/dieses Netz?
//   host = lokales Netz, srflx = ueber STUN erreichbar (direkte Verbindung moeglich),
//   relay = ueber TURN erreichbar.
export function testConnectivity(timeoutMs = 6000) {
  return new Promise((resolve) => {
    const found = { host: false, srflx: false, relay: false };
    let pc;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { pc.close(); } catch { /* */ }
      resolve({ ...found, turn: hasTurn() });
    };
    try {
      pc = new RTCPeerConnection({ iceServers: iceServerList() });
      pc.createDataChannel('probe');
      pc.onicecandidate = (e) => {
        if (!e.candidate) { finish(); return; }
        const m = / typ (host|srflx|relay) /.exec(e.candidate.candidate || '');
        if (m) found[m[1]] = true;
      };
      pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(finish);
      setTimeout(finish, timeoutMs);
    } catch {
      resolve({ ...found, turn: hasTurn(), unsupported: true });
    }
  });
}
