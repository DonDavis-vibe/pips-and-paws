// Menschenlesbare Meldungen zu Regel-Ergebnissen (Schaden, Rast). Von
// Spieler-Client (App.jsx, Befehl vom SL), Spielerbogen und SL-Dashboard
// (lokale Boegen) gemeinsam genutzt, damit alle dasselbe sagen.

import { loc } from '../i18n/index.jsx';

// rules/gmActions.js#applyDamage -> [{ text, tone }]; tone: 'bad' | 'ok' | 'warn'

export function damageMessages(res, t, condName) {
  const attr = t(`attr.abbr.${res.attr}`);
  let head = t('dmg.taken', { n: res.dealt });
  if (res.absorbed > 0) head += ` ${t('dmg.armour', { n: res.absorbed })}`;
  if (res.attrHit > 0) head += ` — ${t('dmg.toAttr', { n: res.attrHit, attr })}`;
  const out = [{ text: head, tone: 'bad' }];

  if (res.saveRoll) {
    const r = res.saveRoll;
    const mode = r.mode && r.mode !== 'normal' ? ` (${t(`dice.mode.${r.mode}`)})` : '';
    out.push({
      text: `${t('dice.saveVs', { attr: t(`attr.${res.attr}`) })}${mode} — d20 ${r.d} ≤ ${r.target} · ${r.ok ? t('dice.success') : t('dice.fail')}`,
      tone: r.ok ? 'ok' : 'bad',
    });
  }
  if (res.crit && !res.zero.dead) {
    out.push({ text: res.attr === 'str' ? t('player.gm.critDamage') : t('dmg.critSpecial'), tone: 'bad' });
  }
  if (res.injuredOverflow) out.push({ text: t('player.gm.conditionOverflow', { name: condName }), tone: 'warn' });
  if (res.zero.dead) out.push({ text: t('player.gm.dead'), tone: 'bad' });
  else {
    if (res.zero.immobile) out.push({ text: t('zero.immobile'), tone: 'bad' });
    if (res.zero.insensible) out.push({ text: t('zero.insensible'), tone: 'bad' });
  }
  return out;
}

// rules/rest.js#applyRest -> ein Satz inkl. abgeraeumter Zustaende.
export function restText(rest, kind, t, lang) {
  const { msg, noRation, cleared } = rest;
  const vars = msg.vars.attrKey ? { ...msg.vars, attr: t(`attr.${msg.vars.attrKey}`) } : msg.vars;
  let text = t(msg.key, vars);
  if (noRation && kind === 'long') text += ` — ${t('rest.noRation')}`;
  if (cleared?.length) {
    text += ` — ${t('rest.cleared', { names: cleared.map((c) => loc(c.name, lang)).join(', ') })}`;
  }
  return text;
}
