// Ein Runden-Log-Eintrag -> menschenlesbare Zeile. Genutzt vom SL-Dashboard
// und vom geteilten Runden-Log der Spieler.

export function formatLogEntry(e, t) {
  if (!e) return '';
  if (e.kind === 'system') return t(e.key, e.vars || {});
  if (e.kind === 'gm') return t(e.key, e.vars || {});
  if (e.kind === 'say') return `${e.playerName}: ${e.text}`;
  if (e.kind === 'event' && e.ev) {
    const ev = e.ev;
    if (ev.kind === 'save') {
      const tag = ev.reason === 'initiative' ? `${t('combat.initiative')} · ` : '';
      const mode = ev.mode && ev.mode !== 'normal' ? ` (${t(`dice.mode.${ev.mode}`)})` : '';
      return `${e.playerName} · ${tag}${t('dice.saveVs', { attr: t(`attr.${ev.attr}`) })}${mode} — d20 ${ev.roll} ≤ ${ev.target} · ${ev.ok ? t('dice.success') : t('dice.fail')}`;
    }
    if (ev.kind === 'roll') {
      return `${e.playerName} · ${ev.label}: ${ev.value}`;
    }
  }
  return '';
}

// Farb-Hinweis fuer die linke Kante einer Log-Zeile.
export function logEntryTone(e) {
  if (e?.kind === 'event' && e.ev?.kind === 'save') return e.ev.ok ? 'ok' : 'bad';
  if (e?.kind === 'gm' && e.key === 'combat.log.attack') return 'bad';
  if (e?.kind === 'say') return 'say';
  return '';
}
