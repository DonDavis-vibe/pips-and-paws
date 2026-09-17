import { useRef, useState } from 'react';
import {
  Users, ScrollText, Megaphone, Dices, Save, FolderOpen, Handshake, Gem, Dice6,
} from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { RollButton, DiceStage } from './DiceKit.jsx';
import Panel from './Panel.jsx';
import GmPlayerCard from './GmPlayerCard.jsx';
import GmLocalPlayers from './GmLocalPlayers.jsx';
import GmSoundboard from './GmSoundboard.jsx';
import CharacterSheet from './CharacterSheet.jsx';
import { useLocalPlayers } from '../useLocalPlayers.js';
import SharedStash from './SharedStash.jsx';
import GmTimeTracker from './GmTimeTracker.jsx';
import GmCombatTracker from './GmCombatTracker.jsx';
import GmNotes from './GmNotes.jsx';
import EmptyState from './EmptyState.jsx';
import emptyLobby from '../assets/empty-lobby.jpg';
import { ArtLantern } from './Art.jsx';
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

// Menschenlesbares Label fuer eine SL-Aktion im Live-Log. Auch von
// GmLocalPlayers genutzt, damit lokale und verbundene Eingriffe gleich klingen.
export function cmdVars(cmd, name, lang, t) {
  const v = { name, ...cmd };
  if (cmd.item?.name) v.item = loc(cmd.item.name, lang);
  if (cmd.key && CONDITION_CATALOG[cmd.key]) v.cond = loc(CONDITION_CATALOG[cmd.key].name, lang);
  if (cmd.kind) v.kind = t(`rest.${cmd.kind}`);
  if (cmd.attr) v.attr = t(`attr.abbr.${cmd.attr}`);
  return v;
}

const formatEntry = formatLogEntry;

const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

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
// Protokoll, in dem auch die Wuerfe der Spieler auftauchen. Die Buehne (`result`)
// lebt eine Ebene hoeher in GmDashboard, damit auch GmCombatTracker (NSC-Angriffe)
// ueber `pushRoll` mitschreiben kann statt nur ins Log zu gehen.
function GmDicePanel({ onLog, log, result, pushRoll }) {
  const { t } = useLang();
  const [customSides, setCustomSides] = useState('');
  const dieLabel = (sides) => `${t('dice.dieLetter')}${sides}`;

  // `preset`: kommt der Wurf von einem der festen Knoepfe (dann `die` fuer den
  // 3D-Wuerfel in DiceStage) oder aus dem Eigener-Wuerfel-Feld (dann nicht —
  // siehe Kommentar bei rollCustom).
  const rollN = (sides, preset = true) => {
    const r = rollDice(1, sides);
    pushRoll({ label: dieLabel(sides), value: r.total, max: sides, ...(preset ? { die: sides } : {}) });
    onLog('gm.log.roll', { label: dieLabel(sides), value: r.total });
  };

  // Eigener Wuerfel mit frei eingegebener Seitenzahl — fuer alles, was nicht
  // schon einen Knopf hat (W3, W100, ...). Bewusst OHNE `die`-Flag, auch bei
  // Seitenzahlen wie 6/8/10/12: die Buehne zeigt fuer diese Wuerfel nur die
  // Zahl, den 3D-Wuerfel gibt es nur bei den festen Knoepfen, siehe DiceStage.
  const rollCustom = (e) => {
    e.preventDefault();
    const sides = parseInt(customSides, 10);
    if (!Number.isFinite(sides) || sides < 2 || sides > 1000) return;
    rollN(sides, false);
  };

  const roll66 = () => {
    const r = rollD66();
    pushRoll({
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
    pushRoll({
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
    pushRoll({ label: t('gm.treasure'), value: r.d, max: 20, verdict });
    onLog('gm.log.treasure', { d: r.d, result: verdict });
  };

  const rolls = log.filter(isRollEntry).slice(0, 20);

  return (
    <Panel id="gm-dice" icon={Dices} title={t('gm.diceTitle')} className="dice-panel">
      <DiceStage result={result} idleIcon={<Dices size={24} />} idleText={t('dice.stageIdle')} />

      <div className="dice-buttons">
        <span className="dice-sep">{t('gm.roll')}</span>
        {[4, 6, 8, 10, 12, 20].map((sides) => (
          <RollButton key={sides} sides={sides} label={dieLabel(sides)} kind="gm" onRoll={() => rollN(sides)} />
        ))}
        <RollButton d66 label={t('dice.d66')} kind="gm" onRoll={roll66} />
      </div>

      <form className="dice-custom" onSubmit={rollCustom}>
        <Dice6 size={15} className="dice-custom-icon" aria-hidden="true" />
        <input
          type="number"
          min="2"
          max="1000"
          inputMode="numeric"
          className="dice-custom-input"
          placeholder={t('dice.customPlaceholder')}
          value={customSides}
          onChange={(e) => setCustomSides(e.target.value)}
          aria-label={t('dice.customLabel')}
        />
        <button type="submit" className="btn btn-sm" disabled={!customSides}>
          {t('dice.customRoll')}
        </button>
      </form>

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
  const localApi = useLocalPlayers();
  const [openLocalId, setOpenLocalId] = useState(null);
  const openLocal = localApi.players.find((p) => p.id === openLocalId);

  // Gemeinsame Wuerfel-Buehne des SL-Bereichs: eigene Wuerfe im GmDicePanel UND
  // NSC-Angriffe aus GmCombatTracker landen hier, nicht nur im Log.
  const [diceResult, setDiceResult] = useState(null);
  const pushRoll = (stage) => setDiceResult({ id: stamp(), ...stage });

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

  // Ein lokaler Bogen ist "geoeffnet": das Geraet zeigt statt des Dashboards
  // den vollen, normalen Charakterbogen — zum Herumreichen am Tisch. Ersetzt
  // bewusst das ganze Dashboard (nicht nur den Lokale-Spieler-Block), damit
  // der Bogen den vollen Bildschirm bekommt.
  if (openLocal) {
    return (
      <div className="local-sheet">
        <div className="local-sheet-bar">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpenLocalId(null)}>
            ← {t('gm.local.backToDashboard')}
          </button>
          <strong>{openLocal.name || '?'}</strong>
        </div>
        <CharacterSheet
          character={openLocal}
          setCharacter={(updater) => localApi.updatePlayer(openLocal.id, updater)}
          notify={notify}
          restLocked={false}
        />
      </div>
    );
  }

  return (
    <div className="gm-dash">
      {/* Alles ausser dem Wuerfel-Panel steckt in EINEM Wrapper — siehe
          Kommentar bei .sheet-main in CharacterSheet.jsx: sonst spannt die
          gemeinsame Wuerfel-Spalte mehrere Grid-Zeilen, und WebKit/Safari
          rechnet deren volle Hoehe komplett der ersten Zeile zu. */}
      <div className="sheet-main">
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

        <label className="gm-share-log" title={t('group.shareHint')}>
          <input type="checkbox" checked={mp.groupShared} onChange={(e) => mp.setGroupShared(e.target.checked)} />
          {t('group.share')}
        </label>

        {entries.length === 0 ? (
          <EmptyState img={emptyLobby} art={ArtLantern} alt="">{t('gm.noPlayers')}</EmptyState>
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

      <GmLocalPlayers
        players={localApi.players}
        addPlayer={localApi.addPlayer}
        updatePlayer={localApi.updatePlayer}
        removePlayer={localApi.removePlayer}
        onOpen={setOpenLocalId}
        notify={notify}
        gmLog={gmLog}
        cmdVars={cmdVars}
      />

      <GmSoundboard mp={mp} notify={notify} />

      <GmTimeTracker onLog={gmLog} shareTime={mp.shareTime} />

      <GmCombatTracker
        onLog={gmLog}
        shareNpcs={mp.shareNpcs}
        pushRoll={pushRoll}
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

      <GmDicePanel onLog={gmLog} log={mp.liveLog} result={diceResult} pushRoll={pushRoll} />
    </div>
  );
}
