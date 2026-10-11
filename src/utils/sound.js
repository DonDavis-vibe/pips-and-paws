// SL-Soundboard: Abspiel-Engine.
//
// Die eingebauten Soundboard-Kurzeffekte sind kurze Toene von Kenney
// (kenney.nl, Lizenz CC0 — gemeinfrei, ohne Einschraenkung nutzbar, siehe
// src/assets/sfx/CREDITS.txt). Bewusst nach Erzaehl-Moment sortiert (Tuer,
// Muenzen, Klinge, Fanfare, dramatischer Stich) statt nach Wurf-Ausgang —
// das Wurfergebnis sieht man ja schon im Wuerfel-Panel, am Tisch fehlt eher
// ein Knopf fuer "die Tuer knarrt auf" oder "die Truhe ist voller Muenzen".
// Auswahl uebernommen aus dem Schwesterprojekt "Demonslayer".
// Bewusst NICHT mitgeliefert: Ambient-/Musik-Dateien fuer echte Atmosphaere —
// die sind so gut wie nie wirklich frei lizenziert. Dafuer laedt der SL eigene
// Dateien hoch (customSounds.js) — die bleiben lokal und gehen nur direkt per
// WebRTC an gerade verbundene Spieler raus, genau wie der Discord-Webhook.

import fanfareUrl from '../assets/sfx/fanfare.mp3';
import dramaticUrl from '../assets/sfx/dramatic.mp3';
import coinsUrl from '../assets/sfx/coins.mp3';
import doorUrl from '../assets/sfx/door.mp3';
import bladeUrl from '../assets/sfx/blade.mp3';
import boltUrl from '../assets/sfx/bolt.mp3';
import bellUrl from '../assets/sfx/bell.mp3';

const FX_URLS = {
  fanfare: fanfareUrl, dramatic: dramaticUrl, coins: coinsUrl, door: doorUrl, blade: bladeUrl, bolt: boltUrl, bell: bellUrl,
};
export const FX_KINDS = Object.keys(FX_URLS);

// ---- Lautstaerke-Modell -----------------------------------------------
// Effektiv gilt: SL-Pegel (pro Sound, vom SL beim Abspielen gewaehlt) x
// eigener Pegel (pro Geraet, gilt fuer alles was man hoert). Bewusst nicht in
// der Charakter-JSON: das ist eine Geraete-Einstellung, keine Eigenschaft
// der Maus.
const MY_VOLUME_KEY = 'pips-paws-my-volume';
let myVolume = 1;
try {
  const stored = parseFloat(localStorage.getItem(MY_VOLUME_KEY));
  if (!Number.isNaN(stored)) myVolume = Math.max(0, Math.min(1, stored));
} catch { /* privater Modus */ }

export function getMyVolume() { return myVolume; }
export function setMyVolume(v) {
  myVolume = Math.max(0, Math.min(1, v));
  try { localStorage.setItem(MY_VOLUME_KEY, String(myVolume)); } catch { /* privater Modus */ }
  currentAudioPlayers.forEach((audio) => applyVolume(audio, audio.sourceVolume));
}

export let currentAudioPlayers = [];

function applyVolume(audio, sourceVolume) {
  const src = typeof sourceVolume === 'number' && !Number.isNaN(sourceVolume) ? sourceVolume : 0.6;
  audio.sourceVolume = src;
  audio.volume = Math.max(0, Math.min(1, src * myVolume));
}

function register(audio) {
  currentAudioPlayers.push(audio);
  audio.addEventListener('ended', () => {
    currentAudioPlayers = currentAudioPlayers.filter((a) => a !== audio);
  });
}

export function playFx(kind, sourceVolume = 0.6) {
  const url = FX_URLS[kind];
  if (!url) return;
  try {
    const audio = new Audio(url);
    applyVolume(audio, sourceVolume);
    audio.play().catch(() => { /* Autoplay blockiert */ });
    register(audio);
  } catch { /* ignorieren */ }
}

export function playBlob(blob, sourceVolume = 0.6) {
  try {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    applyVolume(audio, sourceVolume);
    audio.play().catch(() => { /* Autoplay blockiert */ });
    register(audio);
    audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true });
  } catch { /* ignorieren */ }
}

export function setLiveVolume(sourceVolume) {
  currentAudioPlayers.forEach((audio) => applyVolume(audio, sourceVolume));
}

export function stopAllAudio() {
  currentAudioPlayers.forEach((audio) => { audio.pause(); audio.currentTime = 0; });
  currentAudioPlayers = [];
}

export function fadeOutAllAudio(durationMs = 3500) {
  if (currentAudioPlayers.length === 0) return;
  const toFade = [...currentAudioPlayers];
  currentAudioPlayers = [];
  const steps = 35;
  const stepTime = durationMs / steps;
  toFade.forEach((audio) => {
    const startVol = audio.volume;
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      audio.volume = Math.max(0, startVol * (1 - step / steps));
      if (step >= steps) {
        clearInterval(id);
        audio.pause();
        audio.currentTime = 0;
      }
    }, stepTime);
  });
}

// ---- Wuerfel-Geraeusch ---------------------------------------------------
// Synthetisch (Web Audio) statt einer Datei: ein kurzes Klackern, das in ein
// dumpfes Aufsetzen ausklingt. Keine Lizenz, keine Dateigroesse. Folgt dem
// eigenen Pegel (VolumeControl) — Regler auf 0 schaltet es stumm.
let diceCtx = null;
let lastDiceSoundId = null;

function noiseBuffer(ctx, seconds) {
  const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buf;
}

function clack(ctx, when, freq, gain, len) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, len);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = 1.4;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, when);
  amp.gain.exponentialRampToValueAtTime(0.001, when + len);
  src.connect(filter).connect(amp).connect(ctx.destination);
  src.start(when);
}

// `id` verhindert, dass dieselbe Wurfbuehne beim erneuten Einblenden (Panel
// auf-/zuklappen, Neuaufbau) denselben Wurf noch einmal vertont.
export function playDiceRoll(id) {
  if (id != null) {
    if (id === lastDiceSoundId) return;
    lastDiceSoundId = id;
  }
  if (myVolume <= 0) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!diceCtx) diceCtx = new Ctx();
    if (diceCtx.state === 'suspended') diceCtx.resume().catch(() => { /* Autoplay blockiert */ });
    const t0 = diceCtx.currentTime + 0.01;
    const vol = 0.5 * myVolume;
    // Klackern: abnehmende Abstaende und Lautstaerke, leicht variierende Tonhoehe.
    let at = 0;
    for (let i = 0; i < 7; i += 1) {
      clack(diceCtx, t0 + at, 1800 + Math.random() * 1800, vol * (1 - i * 0.09), 0.05);
      at += 0.045 + i * 0.012;
    }
    // Aufsetzen: tiefer, kurzer Schlag.
    clack(diceCtx, t0 + at + 0.03, 420, vol * 1.2, 0.12);
  } catch { /* ignorieren */ }
}
