// Optionale Discord-Anbindung per Webhook — unabhaengiger Broadcast-Kanal,
// keine Verbindung zum Multiplayer. Wuerfe und Ereignisse landen als Nachricht
// im Kanal, mit dem Maus-Namen als Absender. Muster wie in den anderen Tools.
//
// Die Webhook-URL ist ein Zugangsschluessel fuer den Kanal. Sie liegt nur im
// localStorage dieses Browsers und wird NICHT in die Charakterdatei geschrieben.

const URL_KEY = 'pips-paws-discord-webhook';
const OPT_KEY = 'pips-paws-discord-opts';

export const COLORS = {
  ok: 0x3f9d4f,
  bad: 0xb23b3b,
  gold: 0xc8853b,
  info: 0x4a6d8c,
  neutral: 0x8a7a63,
};

export function getWebhook() {
  try {
    return localStorage.getItem(URL_KEY) || '';
  } catch {
    return '';
  }
}

export function setWebhook(url) {
  try {
    if (url && url.trim()) localStorage.setItem(URL_KEY, url.trim());
    else localStorage.removeItem(URL_KEY);
  } catch {
    /* privater Modus */
  }
}

export function isValidWebhook(url) {
  return /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+/.test((url || '').trim());
}

export function hasWebhook() {
  return isValidWebhook(getWebhook());
}

export function getOpts() {
  try {
    return { rolls: true, events: true, ...JSON.parse(localStorage.getItem(OPT_KEY) || '{}') };
  } catch {
    return { rolls: true, events: true };
  }
}

export function setOpts(opts) {
  try {
    localStorage.setItem(OPT_KEY, JSON.stringify(opts));
  } catch {
    /* ignorieren */
  }
}

// --- gedrosselte Warteschlange; ein Netzwerkfehler blockiert die App nie ---
let queue = [];
let running = false;

async function pump() {
  if (running) return;
  running = true;
  while (queue.length) {
    const body = queue.shift();
    const url = getWebhook();
    if (!isValidWebhook(url)) break;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        queue.unshift(body);
        await wait((data.retry_after || 1) * 1000 + 150);
      } else {
        await wait(400);
      }
    } catch {
      // offline / CORS / geloescht — still schlucken
      await wait(400);
    }
  }
  running = false;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function enqueue(body) {
  if (!hasWebhook()) return;
  queue.push({ allowed_mentions: { parse: [] }, ...body });
  pump();
}

function send(username, embed, opt) {
  if (opt && !getOpts()[opt]) return;
  enqueue({ username: String(username || 'Pips & Paws').slice(0, 78), embeds: [embed] });
}

// --- oeffentliche Helfer ---

export function shareRoll(name, label, value, detail) {
  send(name, {
    color: COLORS.neutral,
    description: `🎲 **${label}** — ${value}${detail ? `  \n\`${detail}\`` : ''}`,
  }, 'rolls');
}

export function shareSave(name, attrLabel, roll, target, ok) {
  send(name, {
    color: ok ? COLORS.ok : COLORS.bad,
    description: `🎲 **${attrLabel}** — W20 ${roll} ≤ ${target} · ${ok ? '✅' : '❌'}`,
  }, 'rolls');
}

export function shareEvent(name, text, tone = 'info') {
  send(name, { color: COLORS[tone] || COLORS.info, description: text }, 'events');
}

export async function testWebhook(url) {
  if (!isValidWebhook(url)) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Pips & Paws',
        embeds: [{ color: COLORS.gold, description: '🐭 Verbindung steht — Wuerfe und Ereignisse landen ab jetzt hier.' }],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
