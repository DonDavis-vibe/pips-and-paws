import { rollDie } from './dice.js';

// Fraktionen nach SRD ("Factions", Zielfortschritt): zwischen den Sitzungen W6
// werfen, +1 je relevanter Ressource der Fraktion, -1 je relevanter Ressource
// einer vom Ziel betroffenen Rivalin; 4-5 = 1 Fortschritt, 6+ = 2.

export const progressFor = (total) => (total >= 6 ? 2 : total >= 4 ? 1 : 0);

export const isDone = (goal) => goal.progress >= goal.max;

// Aktuelles Ziel: das vom SL gewaehlte, sonst das erste unerledigte.
export function currentGoal(faction) {
  const chosen = faction.goals.find((g) => g.id === faction.current && !isDone(g));
  return chosen || faction.goals.find((g) => !isDone(g)) || null;
}

// Relevante Ressourcen: vom SL gesetzt, sonst alle.
export const relevantOf = (faction) => (Number.isFinite(faction.rel) ? faction.rel : faction.resources.length);

// Wuerfelt und wendet den Fortschritt auf das aktuelle Ziel an.
// -> { faction, roll: { die, rel, rival, total, gain, goal, completed } | null }
export function rollFaction(faction, rival = 0, rng = rollDie) {
  const goal = currentGoal(faction);
  if (!goal) return { faction, roll: null };
  const die = rng(6);
  const rel = relevantOf(faction);
  const total = die + rel - rival;
  const gain = progressFor(total);
  const progress = Math.min(goal.max, goal.progress + gain);
  const completed = gain > 0 && progress >= goal.max;
  return {
    faction: { ...faction, goals: faction.goals.map((g) => (g.id === goal.id ? { ...g, progress } : g)) },
    roll: { die, rel, rival, total, gain, goal: goal.id, goalText: goal.text, completed },
  };
}
