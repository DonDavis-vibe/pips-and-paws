import { useRef, useState } from 'react';
import { Home, UserPlus, FolderOpen } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import Panel from './Panel.jsx';
import GmPlayerCard from './GmPlayerCard.jsx';
import CharacterWizard from './CharacterWizard.jsx';
import { downloadCharacter, readCharacterFile } from '../utils/exportImport.js';
import { rollSave } from '../rules/dice.js';
import { applyRest } from '../rules/rest.js';
import {
  applyDamage, applyHeal, applyPips, applyXp, applyGive, applyCondition,
} from '../rules/gmActions.js';
import {
  GM_DAMAGE, GM_HEAL, GM_PIPS, GM_XP, GM_SAVE, GM_GIVE, GM_CONDITION, GM_REST,
} from '../multiplayer/protocol.js';

// Boegen, die der SL selbst am Tisch fuehrt: kein Peer, kein Draht — SL legt
// Maeuse an oder laedt Dateien, und wendet Eingriffe direkt auf den lokalen
// Bogen an (dieselben Regeln wie beim Fern-Spieler, siehe rules/gmActions.js).
// `gmLog`/`cmdVars` kommen von GmDashboard, damit lokale Eingriffe im selben
// Live-Protokoll auftauchen wie Eingriffe bei verbundenen Spielern. Das
// "Bogen oeffnen" (Vollbild zum Herumreichen) lebt eine Ebene hoeher in
// GmDashboard, weil es dort das ganze Dashboard ersetzen muss, nicht nur
// diesen Panel-Inhalt.
export default function GmLocalPlayers({
  players, addPlayer, updatePlayer, removePlayer, onOpen, notify, gmLog, cmdVars,
}) {
  const { t, lang } = useLang();
  const [showWizard, setShowWizard] = useState(false);
  const fileInput = useRef(null);

  const onCommand = (player, cmd) => {
    const name = player.name || '?';
    if (cmd.cmd === GM_DAMAGE) {
      const { character, strHit, saveRoll, dead } = applyDamage(player, cmd.amount);
      updatePlayer(player.id, character);
      gmLog('gm.log.damage', cmdVars(cmd, name, lang, t));
      if (strHit > 0) notify?.(t('player.gm.strDamage', { n: cmd.amount, s: strHit }), 'bad');
      // SRD-Schadenskette (siehe gmActions.js#applyDamage): STR-Schaden loest
      // sofort einen automatischen STR-Rettungswurf aus.
      if (saveRoll) {
        gmLog('gm.log.saveLocal', {
          name, attr: t('attr.abbr.str'), d: saveRoll.d, target: saveRoll.target,
          result: t(saveRoll.ok ? 'dice.success' : 'dice.fail'),
        });
        if (!saveRoll.ok && !dead) gmLog('gm.log.critDamage', { name });
      }
      if (dead) gmLog('gm.log.dead', { name });
    } else if (cmd.cmd === GM_HEAL) {
      updatePlayer(player.id, (c) => applyHeal(c, cmd.amount));
      gmLog('gm.log.heal', cmdVars(cmd, name, lang, t));
    } else if (cmd.cmd === GM_PIPS) {
      updatePlayer(player.id, (c) => applyPips(c, cmd.amount));
      gmLog('gm.log.pips', cmdVars(cmd, name, lang, t));
    } else if (cmd.cmd === GM_XP) {
      updatePlayer(player.id, (c) => applyXp(c, cmd.amount).character);
      gmLog('gm.log.xp', cmdVars(cmd, name, lang, t));
    } else if (cmd.cmd === GM_SAVE) {
      // Kein Draht noetig: der SL hat den Bogen vor sich und wuerfelt gleich mit.
      const r = rollSave(player[cmd.attr]?.current ?? 0);
      gmLog('gm.log.saveLocal', {
        ...cmdVars(cmd, name, lang, t),
        d: r.d,
        target: r.target,
        result: t(r.ok ? 'dice.success' : 'dice.fail'),
      });
    } else if (cmd.cmd === GM_REST) {
      const { character: next, msg, noRation } = applyRest(player, cmd.kind);
      updatePlayer(player.id, next);
      const vars = msg.vars.attrKey ? { ...msg.vars, attr: t(`attr.${msg.vars.attrKey}`) } : msg.vars;
      const result = t(msg.key, vars) + (noRation && cmd.kind === 'long' ? ` — ${t('rest.noRation')}` : '');
      gmLog('gm.log.rest', { ...cmdVars(cmd, name, lang, t), result });
    } else if (cmd.cmd === GM_GIVE && cmd.item) {
      const { character, ok } = applyGive(player, cmd.item);
      if (ok) {
        updatePlayer(player.id, character);
        gmLog('gm.log.give', cmdVars(cmd, name, lang, t));
      } else {
        notify?.(t('player.gm.giveNoRoom', { item: loc(cmd.item.name, lang) }), 'warn');
      }
    } else if (cmd.cmd === GM_CONDITION) {
      const { character, ok, cond } = applyCondition(player, cmd.key);
      if (ok) {
        updatePlayer(player.id, character);
        gmLog('gm.log.condition', cmdVars(cmd, name, lang, t));
      } else {
        notify?.(t('player.gm.conditionNoRoom', { name: loc(cond.name, lang) }), 'warn');
      }
    }
  };

  const onLoadFile = async (file) => {
    if (!file) return;
    try {
      addPlayer(await readCharacterFile(file));
      notify?.(t('toast.imported'), 'ok');
    } catch {
      notify?.(t('toast.importFailed'), 'bad');
    }
  };

  return (
    <Panel
      id="gm-local"
      icon={Home}
      title={t('gm.local.title')}
      right={(
        <div className="stash-head-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowWizard(true)}>
            <UserPlus size={15} /> {t('gm.local.newPlayer')}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()}>
            <FolderOpen size={15} /> {t('gm.local.loadSheet')}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              onLoadFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      )}
    >
      <p className="hint">{t('gm.local.hint')}</p>

      {players.length === 0 ? (
        <p className="hint">{t('gm.local.empty')}</p>
      ) : (
        <div className="gm-grid">
          {players.map((p) => (
            <GmPlayerCard
              key={p.id}
              player={{ character: p, items: p.items || {} }}
              onCommand={(cmd) => onCommand(p, cmd)}
              local
              onOpenSheet={() => onOpen(p.id)}
              onSave={() => downloadCharacter(p)}
              onRemove={() => removePlayer(p.id)}
            />
          ))}
        </div>
      )}

      {showWizard ? (
        <CharacterWizard
          onCancel={() => setShowWizard(false)}
          onDone={(c) => {
            addPlayer(c);
            setShowWizard(false);
          }}
        />
      ) : null}
    </Panel>
  );
}
