// PenNodePaper-Bridge-Client (Protokoll v1, https://github.com/Rec0iL/PenNodePaper,
// docs/vtt-bridge-spec.md). Abhaengigkeitsfreie Fassung des dort beigelegten
// pnp-bridge-client.js, hier ohne Aenderung am Protokollverhalten:
// Handshake (hello/welcome), Antwort auf jeden push/request mit einem result,
// Reconnect mit Back-off, Abbruch ohne Retry bei Protokoll-Mismatch (Close 1008).

export const PROTOCOL = 1;

export function connectPnp({ url, token, profile, onPush, onRequest, onStatus = () => {}, WebSocketImpl = globalThis.WebSocket }) {
  let ws = null;
  let closed = false;
  let tries = 0;
  let timer = null;

  const send = (m) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };
  const sep = url.includes('?') ? '&' : '?';

  function open() {
    onStatus('connecting');
    try {
      ws = new WebSocketImpl(`${url}${sep}token=${encodeURIComponent(token)}`);
    } catch {
      closed = true;
      onStatus('closed', { reason: 'invalidUrl' });
      return;
    }
    ws.onopen = () => send({ t: 'hello', protocol: PROTOCOL, profile });
    ws.onmessage = async (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      if (m.t === 'welcome') {
        tries = 0;
        onStatus('connected', { campaign: m.campaign });
        return;
      }
      if (m.t !== 'push' && m.t !== 'request') return;
      try {
        const data = m.t === 'push' ? await onPush(m.kind, m.payload) : await onRequest(m.what);
        send({ t: 'result', id: m.id, ok: true, data });
      } catch (err) {
        send({ t: 'result', id: m.id, ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    };
    ws.onclose = (e) => {
      ws = null;
      if (closed) { onStatus('closed'); return; }
      if (e.code === 1008) {
        closed = true;
        onStatus('closed', { reason: e.reason || 'protocol' });
        return;
      }
      const wait = Math.min(30000, 2000 * 2 ** tries);
      tries += 1;
      onStatus('connecting', { retryInMs: wait });
      timer = setTimeout(open, wait);
    };
    ws.onerror = () => {};
  }

  open();
  return {
    // Immer die GANZE Gruppe melden; fehlende Spieler gelten dort als abwesend.
    reportParty(characters) { send({ t: 'party', characters }); },
    close() {
      closed = true;
      clearTimeout(timer);
      if (ws) ws.close();
    },
  };
}
