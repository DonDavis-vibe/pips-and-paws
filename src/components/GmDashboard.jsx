import { Users, ScrollText, Megaphone, Dices } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import GmPlayerCard from './GmPlayerCard.jsx';
import SharedStash from './SharedStash.jsx';
import GmTimeTracker from './GmTimeTracker.jsx';
import { GM_BROADCAST } from '../multiplayer/protocol.js';
import { rollDice, rollD66 } from '../rules/dice.js';
import { CONDITION_CATALOG } from '../data/items.js';

// Menschenlesbares Label fuer eine SL-Aktion im Live-Log.
function cmdVars(cmd, name, lang) {
  const v = { name, ...cmd };
  if (cmd.item?.name) v.item = loc(cmd.item.name, lang);
  if (cmd.key && CONDITION_CATALOG[cmd.key]) v.cond = loc(CONDITION_CATALOG[cmd.key].name, lang);
  return v;
}

function formatEntry(e, t) {
  if (e.kind === 'system') return t(e.key, e.vars || {});
  if (e.kind === 'say') return `${e.playerName}: ${e.text}`;
  if (e.kind === 'gm') return t(e.key, e.vars || {});
  if (e.kind === 'event' && e.ev) {
    const ev = e.ev;
    if (ev.kind === 'save') {
      return `${e.playerName} · ${t('dice.saveVs', { attr: t(`attr.${ev.attr}`) })} — d20 ${ev.roll} ≤ ${ev.target} · ${ev.ok ? t('dice.success') : t('dice.fail')}`;
    }
    if (ev.kind === 'roll') {
      return `${e.playerName} · ${ev.label}: ${ev.value}`;
    }
  }
  return JSON.stringify(e);
}

function GmDiceBar({ onRoll }) {
  const { t } = useLang();
  return (
    <div className="gm-dice-bar">
      <Dices size={15} />
      <span className="gm-save-label">{t('gm.roll')}:</span>
      {[6, 8, 10, 12, 20].map((sides) => (
        <button
          key={sides}
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => {
            const r = rollDice(1, sides);
            onRoll(`W${sides}`, r.total);
          }}
        >
          W{sides}
        </button>
      ))}
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        onClick={() => {
          const r = rollD66();
          onRoll('W66', r.value);
        }}
      >
        W66
      </button>
    </div>
  );
}

export default function GmDashboard({ mp }) {
  const { t, lang } = useLang();
  const entries = Object.entries(mp.players);

  return (
    <div className="gm-dash">
      <section className="panel">
        <div className="panel-head">
          <h2>
            <Users size={18} /> {t('gm.dashboard')} · {t('mp.playersConnected', { n: entries.length })}
          </h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const text = window.prompt(t('gm.prompt.broadcast'));
              if (text) {
                mp.sendGmCommand(null, { cmd: GM_BROADCAST, text });
                mp.logGmAction({ key: 'gm.log.broadcast', vars: { text } });
              }
            }}
          >
            <Megaphone size={16} /> {t('gm.action.broadcast')}
          </button>
        </div>

        <GmDiceBar onRoll={(label, value) => mp.logGmAction({ key: 'gm.log.roll', vars: { label, value } })} />

        {entries.length === 0 ? (
          <p className="hint">{t('gm.noPlayers')}</p>
        ) : (
          <div className="gm-grid">
            {entries.map(([peerId, player]) => (
              <GmPlayerCard
                key={peerId}
                player={player}
                onCommand={(cmd) => {
                  mp.sendGmCommand(peerId, cmd);
                  mp.logGmAction({ key: `gm.log.${cmd.cmd}`, vars: cmdVars(cmd, player.character?.name || '?', lang) });
                }}
              />
            ))}
          </div>
        )}
      </section>

      <GmTimeTracker onLog={(key, vars) => mp.logGmAction({ key, vars })} />

      <SharedStash
        mode="gm"
        items={mp.stash}
        onAdd={mp.stashAddItem}
        onRemove={mp.stashRemoveItem}
        onClear={mp.clearStash}
      />

      <section className="panel">
        <div className="panel-head">
          <h2>
            <ScrollText size={18} /> {t('gm.liveLog')}
          </h2>
        </div>
        <ul className="dice-log">
          {mp.liveLog.length === 0 ? (
            <li className="dice-empty">{t('dice.emptyLog')}</li>
          ) : (
            mp.liveLog.map((e) => (
              <li key={e.id}>
                <span className="dice-detail">
                  {new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>{formatEntry(e, t)}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
