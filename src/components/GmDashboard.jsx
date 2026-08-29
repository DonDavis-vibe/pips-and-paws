import { useRef, useState } from 'react';
import { Users, ScrollText, Megaphone, Dices, Save, FolderOpen } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { RollButton, DiceStage } from './DiceKit.jsx';
import GmPlayerCard from './GmPlayerCard.jsx';
import SharedStash from './SharedStash.jsx';
import GmTimeTracker from './GmTimeTracker.jsx';
import GmCombatTracker from './GmCombatTracker.jsx';
import GmNotes from './GmNotes.jsx';
import { GM_BROADCAST, GM_SAVE } from '../multiplayer/protocol.js';
import { rollDice, rollD66 } from '../rules/dice.js';
import { CONDITION_CATALOG } from '../data/items.js';
import { exportGmSession, importGmSession } from '../utils/gmSession.js';
import { shareEvent } from '../utils/discord.js';

const SHARE_KEYS = new Set(['gm.log.broadcast', 'gm.log.roll', 'combat.log.attack']);

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
      const tag = ev.reason === 'initiative' ? `${t('combat.initiative')} · ` : '';
      return `${e.playerName} · ${tag}${t('dice.saveVs', { attr: t(`attr.${ev.attr}`) })} — d20 ${ev.roll} ≤ ${ev.target} · ${ev.ok ? t('dice.success') : t('dice.fail')}`;
    }
    if (ev.kind === 'roll') {
      return `${e.playerName} · ${ev.label}: ${ev.value}`;
    }
  }
  return JSON.stringify(e);
}

function GmDiceBar({ onRoll }) {
  const { t } = useLang();
  const [result, setResult] = useState(null);
  const dieLabel = (sides) => `${t('dice.dieLetter')}${sides}`;
  const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const rollN = (sides) => {
    const r = rollDice(1, sides);
    setResult({ id: stamp(), label: dieLabel(sides), value: r.total, max: sides });
    onRoll(dieLabel(sides), r.total);
  };

  const roll66 = () => {
    const r = rollD66();
    setResult({
      id: stamp(),
      label: t('dice.d66'),
      value: r.value,
      max: 66,
      parts: [
        { value: r.tens, label: t('dice.tens') },
        { value: r.ones, label: t('dice.ones') },
      ],
    });
    onRoll(t('dice.d66'), r.value);
  };

  return (
    <div className="gm-dice-bar">
      <div className="gm-dice-btns">
        <span className="gm-save-label">{t('gm.roll')}</span>
        {[6, 8, 10, 12, 20].map((sides) => (
          <RollButton key={sides} sides={sides} label={dieLabel(sides)} kind="gm" onRoll={() => rollN(sides)} />
        ))}
        <RollButton d66 label={t('dice.d66')} kind="gm" onRoll={roll66} />
      </div>
      <DiceStage result={result} compact idleIcon={<Dices size={16} />} />
    </div>
  );
}

export default function GmDashboard({ mp, notify }) {
  const { t, lang } = useLang();
  const entries = Object.entries(mp.players);
  const fileInput = useRef(null);

  // SL-Log + optional an Discord (nur die fuer die Runde relevanten Meldungen).
  const gmLog = (key, vars) => {
    mp.logGmAction({ key, vars });
    if (SHARE_KEYS.has(key)) {
      shareEvent(t('mp.badge.gm'), t(key, vars), key === 'combat.log.attack' ? 'bad' : 'info');
    }
  };

  const onLoadSession = async (file) => {
    if (!file) return;
    try {
      await importGmSession(file);
      notify?.(t('gm.session.loaded'), 'ok');
      setTimeout(() => window.location.reload(), 500);
    } catch {
      notify?.(t('gm.session.loadFailed'), 'bad');
    }
  };

  return (
    <div className="gm-dash">
      <section className="panel">
        <div className="panel-head">
          <h2>
            <Users size={18} /> {t('gm.dashboard')} · {t('mp.playersConnected', { n: entries.length })}
          </h2>
          <div className="stash-head-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={exportGmSession}>
              <Save size={15} /> {t('gm.session.save')}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()}>
              <FolderOpen size={15} /> {t('gm.session.load')}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                onLoadSession(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const text = window.prompt(t('gm.prompt.broadcast'));
                if (text) {
                  mp.sendGmCommand(null, { cmd: GM_BROADCAST, text });
                  gmLog('gm.log.broadcast', { text });
                }
              }}
            >
              <Megaphone size={15} /> {t('gm.action.broadcast')}
            </button>
          </div>
        </div>

        <GmDiceBar onRoll={(label, value) => gmLog('gm.log.roll', { label, value })} />

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

      <GmTimeTracker onLog={gmLog} />

      <GmCombatTracker
        onLog={gmLog}
        onInitiative={() => {
          mp.sendGmCommand(null, { cmd: GM_SAVE, attr: 'dex', reason: 'initiative' });
          gmLog('combat.log.initiative', {});
        }}
      />

      <SharedStash
        mode="gm"
        items={mp.stash}
        onAdd={mp.stashAddItem}
        onRemove={mp.stashRemoveItem}
        onClear={mp.clearStash}
      />

      <GmNotes />

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
