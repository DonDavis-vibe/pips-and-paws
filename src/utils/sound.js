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
