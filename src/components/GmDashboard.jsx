import { useRef, useState } from 'react';
import {
  Users, ScrollText, Megaphone, Dices, Save, FolderOpen, Handshake, Gem,
} from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { RollButton, DiceStage } from './DiceKit.jsx';
import Panel from './Panel.jsx';
import GmPlayerCard from './GmPlayerCard.jsx';
import SharedStash from './SharedStash.jsx';
import GmTimeTracker from './GmTimeTracker.jsx';
import GmCombatTracker from './GmCombatTracker.jsx';
import GmNotes from './GmNotes.jsx';
import EmptyState from './EmptyState.jsx';
import emptyLobby from '../assets/empty-lobby.jpg';
import { GM_BROADCAST, GM_SAVE } from '../multiplayer/protocol.js';
import { rollDice, rollD66, rollReaction, rollTreasure } from '../rules/dice.js';
import { CONDITION_CATALOG } from '../data/items.js';
import { exportGmSession, importGmSession } from '../utils/gmSession.js';
import { shareEvent } from '../utils/discord.js';
import { formatLogEntry, logEntryTone } from '../multiplayer/logFormat.js';

const SHARE_KEYS = new Set([
  'gm.log.broadcast', 'gm.log.roll', 'combat.log.attack', 'combat.log.morale',
  'gm.log.reaction', 'gm.log.treasure',
]);

// Menschenlesbares Label fuer eine SL-Aktion im Live-Log.
function cmdVars(cmd, name, lang, t) {
  const v = { name, ...cmd };
  if (cmd.item?.name) v.item = loc(cmd.item.name, lang);
  if (cmd.key && CONDITION_CATALOG[cmd.key]) v.cond = loc(CONDITION_CATALOG[cmd.key].name, lang);
  if (cmd.kind) v.kind = t(`rest.${cmd.kind}`);
  return v;
}

const formatEntry = formatLogEntry;

// Welche Log-Eintraege gelten als "Wurf" und gehoeren damit ins Wuerfel-Protokoll
// des SL — eigene Wuerfe, NSC-Wuerfe und die Wuerfe der Spieler.
const ROLL_KEYS = new Set([
  'gm.log.roll', 'gm.log.reaction', 'gm.log.treasure',
  'combat.log.attack', 'combat.log.morale',
]);

function isRollEntry(e) {
  if (e.kind === 'gm') return ROLL_KEYS.has(e.key);
  if (e.kind === 'event') return e.ev?.kind === 'roll' || e.ev?.kind === 'save';
  return false;
}

// Vollwertiges Wuerfel-Panel fuer den SL: Buehne, Wuerfel, Schnellwuerfe und ein
// Protokoll, in dem auch die Wuerfe der Spieler auftauchen.
function GmDicePanel({ onLog, log }) {
  const { t } = useLang();
  const [result, setResult] = useState(null);
  const dieLabel = (sides) => `${t('dice.dieLetter')}${sides}`;
  const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const rollN = (sides) => {
    const r = rollDice(1, sides);
    setResult({ id: stamp(), label: dieLabel(sides), value: r.total, max: sides });
    onLog('gm.log.roll', { label: dieLabel(sides), value: r.total });
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
    onLog('gm.log.roll', { label: t('dice.d66'), value: r.value });
  };

  const reaction = () => {
    const r = rollReaction();
    const verdict = t(`reaction.${r.key}`);
    setResult({
      id: stamp(),
      label: t('gm.reaction'),
      value: r.total,
      max: 12,
      verdict,
      parts: [{ value: r.total, label: t('dice.roll') }],
    });
    onLog('gm.log.reaction', { roll: r.total, result: verdict });
  };

  const treasure = () => {
    const r = rollTreasure();
    const verdict = r.key === 'pips' ? t('treasure.pips', { n: r.pips }) : t(`treasure.${r.key}`);
    setResult({ id: stamp(), label: t('gm.treasure'), value: r.d, max: 20, verdict });
    onLog('gm.log.treasure', { d: r.d, result: verdict });
  };

  const rolls = log.filter(isRollEntry).slice(0, 20);

  return (
    <Panel id="gm-dice" icon={Dices} title={t('gm.diceTitle')} className="dice-panel">
      <DiceStage result={result} idleIcon={<Dices size={24} />} idleText={t('dice.stageIdle')} />

      <div className="dice-buttons">
        <span className="dice-sep">{t('gm.roll')}</span>
        {[6, 8, 10, 12, 20].map((sides) => (
          <RollButton key={sides} sides={sides} label={dieLabel(sides)} kind="gm" onRoll={() => rollN(sides)} />
        ))}
        <RollButton d66 label={t('dice.d66')} kind="gm" onRoll={roll66} />
      </div>

      <div className="gm-quick-rolls">
        <button type="button" className="btn btn-sm btn-ghost" onClick={reaction}>
          <Handshake size={14} /> {t('gm.reaction')}
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={treasure}>
          <Gem size={14} /> {t('gm.treasure')}
        </button>
      </div>

      {rolls.length === 0 ? (
        <p className="hint dice-hint">{t('gm.diceEmpty')}</p>
      ) : (
        <ul className="dice-log">
          {rolls.map((e) => {
            const tone = logEntryTone(e);
            const fremd = e.kind === 'event';
            return (
              <li key={e.id} className={`${tone === 'ok' ? 'roll-ok' : tone === 'bad' ? 'roll-bad' : ''}${fremd ? ' roll-from-player' : ''}`}>
                <span className="dice-verdict">{formatLogEntry(e, t)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
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

        {entries.length === 0 ? (
          <EmptyState img={emptyLobby} alt="">{t('gm.noPlayers')}</EmptyState>
        ) : (
          <div className="gm-grid">
            {entries.map(([peerId, player]) => (
              <GmPlayerCard
                key={peerId}
                player={player}
                onCommand={(cmd) => {
                  mp.sendGmCommand(peerId, cmd);
                  mp.logGmAction({ key: `gm.log.${cmd.cmd}`, vars: cmdVars(cmd, player.character?.name || '?', lang, t) });
                }}
              />
            ))}
          </div>
        )}
      </section>

      <GmDicePanel onLog={gmLog} log={mp.liveLog} />

      <GmTimeTracker onLog={gmLog} shareTime={mp.shareTime} />

      <GmCombatTracker
        onLog={gmLog}
        shareNpcs={mp.shareNpcs}
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
        onToggleHidden={mp.stashToggleHidden}
        onItemChange={mp.stashUpdateItem}
        onClear={mp.clearStash}
      />

      <GmNotes />

      <Panel
        id="gm-livelog"
        icon={ScrollText}
        title={t('gm.liveLog')}
        right={(
          <div className="gm-log-toggles">
            <label className="gm-share-log" title={t('gm.restLock.hint')}>
              <input
                type="checkbox"
                checked={mp.restLocked}
                onChange={(e) => mp.setRestLockedShared(e.target.checked)}
              />
              {t('gm.restLock')}
            </label>
            <label className="gm-share-log" title={t('gm.shareLog.hint')}>
              <input
                type="checkbox"
                checked={mp.partyLog}
                onChange={(e) => mp.setPartyLogShared(e.target.checked)}
              />
              {t('gm.shareLog')}
            </label>
          </div>
        )}
      >
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
      </Panel>
    </div>
  );
}
