// Animierte 3D-Wuerfel (PnpDice, src/vendor/pnp-dice.js): echte Physik auf einer
// Flaeche ueber der ganzen Seite, Wuerfelgeraeusche per WebAudio, keine externen
// Aufrufe. Das Ergebnis kommt IMMER aus unserer Regel-Logik (rules/*.js) — hier
// wird es nur sichtbar gemacht: `fixedRng` laesst die Wuerfel genau bei den
// bereits gewuerfelten Zahlen liegen bleiben.
//
// Ein "Spec" beschreibt, was zu zeigen ist: { notation: '2w20kl1', values: [14, 7] }
// (Formel + Zufallswerte in der Reihenfolge, wie sie gezogen wurden).

import '../vendor/pnp-dice.js';
import { getMyVolume } from './sound.js';

const PnpDice = globalThis.PnpDice;
const PREF_KEY = 'pips-paws-dice3d';
const MAX_DICE = 24; // mehr zeigt PnpDice nicht (maxDice), der Rest wird nur gezaehlt

const reduceMotion = () => {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

let enabled = (() => {
  try {
    const v = localStorage.getItem(PREF_KEY);
    if (v === 'on') return true;
    if (v === 'off') return false;
  } catch { /* privater Modus */ }
  return !reduceMotion();
})();
const listeners = new Set();

export const isDice3dEnabled = () => enabled;

export function setDice3dEnabled(on) {
  enabled = !!on;
  try { localStorage.setItem(PREF_KEY, enabled ? 'on' : 'off'); } catch { /* privater Modus */ }
  listeners.forEach((fn) => fn(enabled));
}

export function onDice3dChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Erdige Mausritter-Palette statt der bunten Standardfarben des Plugins.
const COLORS = {
  4: '#3e6b5b', 6: '#9a4a24', 8: '#b8862d', 10: '#6e3b2a', 12: '#5d7a4a', 20: '#8a2f2a', 100: '#b8862d', custom: '#3e6b5b',
};

function setup() {
  const vol = getMyVolume();
  PnpDice.configure({
    lang: 'en',
    animate: true,
    sound: vol > 0,
    volume: Math.min(1, vol * 0.9),
    showTotal: false, // die Buehne der App zeigt das Ergebnis selbst (Probe, Schaden ...)
    maxDice: MAX_DICE,
    holdMs: 1600,
    dieSize: 36,
    colors: COLORS,
  });
}

const played = new Set();

// Specs von anderen Geraeten (Wuerfe der Mitspieler) pruefen: nur schlichte Formeln
// aus Wuerfelgruppen, begrenzte Zahlen — nichts, was die Seite lahmlegen koennte.
const NOTATION = /^\d{1,2}w\d{1,4}(?:k[hl]\d{1,2})?(?:\+\d{1,2}w\d{1,4}(?:k[hl]\d{1,2})?){0,3}$/;
export function isValidSpec(spec) {
  return !!spec && typeof spec.notation === 'string' && NOTATION.test(spec.notation)
    && Array.isArray(spec.values) && spec.values.length > 0 && spec.values.length <= 40
    && spec.values.every((v) => Number.isInteger(v) && v >= 1 && v <= 10000);
}

// Zeigt die Wuerfel und erfuellt das Versprechen, sobald sie liegen. Ist die
// 3D-Ansicht aus oder fehlerhaft, erfuellt es sofort mit false (Aufrufer fallen
// dann auf die einfache Zahlenanimation zurueck). `id` verhindert Doppelte,
// etwa durch den StrictMode im Entwicklungsmodus.
export function animateDice(spec, id) {
  if (!enabled || !isValidSpec(spec)) return Promise.resolve(false);
  if (id != null) {
    if (played.has(id)) return Promise.resolve(false);
    played.add(id);
    if (played.size > 200) played.delete(played.values().next().value);
  }
  try {
    setup();
    return PnpDice.roll(spec.notation, { rng: PnpDice.fixedRng(spec.values), label: spec.label })
      .then(() => true)
      .catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}

// ---- Spec-Bausteine --------------------------------------------------------

export const dN = (sides, ...values) => ({ notation: `${values.length}w${sides}`, values });

// Mehrere Gruppen hintereinander, z. B. 3W20 (Attribute) + 1W6 (Trefferwuerfel).
export function combine(...specs) {
  const parts = specs.filter(Boolean);
  if (!parts.length) return null;
  return { notation: parts.map((p) => p.notation).join('+'), values: parts.flatMap((p) => p.values) };
}

// Probe (rules/dice.js#rollSave): Vorteil = niedrigerer von 2W20, Nachteil = hoeherer.
export function saveSpec(r) {
  if (!r) return null;
  if (r.mode === 'adv' && r.dice?.length === 2) return { notation: '2w20kl1', values: r.dice };
  if (r.mode === 'disadv' && r.dice?.length === 2) return { notation: '2w20kh1', values: r.dice };
  return dN(20, r.d);
}

// Eigene Formel (z. B. "3w6+2") frei wuerfeln — PnpDice wuerfelt selbst.
// "3k6+2" (polnisch: kosc) -> "3d6+2". Ein k direkt vor einer Ziffer ist nie ein
// Behalten-Modifikator (der heisst kh/kl), also eindeutig.
const normalizeNotation = (s) => String(s || '').replace(/(\d*)k(?=\d)/gi, '$1d');

export async function rollFormula(notation, label, lang) {
  setup();
  notation = normalizeNotation(notation);
  // PnpDice kennt Meldungen auf Deutsch und Englisch.
  PnpDice.configure({ lang: lang === 'de' ? 'de' : 'en' });
  return PnpDice.roll(notation, { label });
}

// Ein PnpDice-Ergebnis als Spec fuer andere Geraete (nur schlichte Formeln, siehe isValidSpec).
export function specFromResult(r) {
  const spec = { notation: String(r?.notation || '').replace(/W/g, 'w'), values: Array.isArray(r?.raw) ? r.raw : [] };
  return isValidSpec(spec) ? spec : null;
}

// Das Ergebnis einer freien Formel fuer Buehne und Protokoll aufbereiten.
export function stageFromFormula(r) {
  const tone = r.crit ? 'ok' : r.fumble ? 'bad' : undefined;
  const detail = String(r.detail || '').replace(/~~/g, '');
  return {
    label: String(r.notation || '').toUpperCase().replace(/^1W/, '1W'),
    value: r.total,
    max: Math.max(6, Number(r.max) || Number(r.total) || 6),
    tone,
    verdict: detail,
    animated: true, // die Wuerfel sind schon gerollt (kein zweites Klackern, keine Zahlen-Animation)
  };
}

export const evaluateFormula = (notation) => PnpDice.evaluate(notation);
export { PnpDice };
