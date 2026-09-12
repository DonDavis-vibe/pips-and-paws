import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download, Upload, Sparkles, Languages, CircleHelp, Monitor, Sun, Moon, Brush, BookCopy,
} from 'lucide-react';
import { useLang, loc, LANGS } from './i18n/index.jsx';
import { useTheme } from './useTheme.js';
import { useSkin } from './useSkin.js';
import { useCharacterRoster } from './useCharacterRoster.js';
import { blankCharacter, isBlank, normalizeCharacter } from './rules/character.js';
import {
  applyDamage, applyHeal, applyPips, applyXp, applyGive, applyCondition,
} from './rules/gmActions.js';
import { CONDITION_CATALOG } from './data/items.js';
import { readJSON, writeJSON } from './utils/storage.js';
import { downloadCharacter, readCharacterFile } from './utils/exportImport.js';
import { rollSave } from './rules/dice.js';
import { applyRest } from './rules/rest.js';
import { shareEvent, setWebhook } from './utils/discord.js';
import {
  GM_DAMAGE, GM_HEAL, GM_PIPS, GM_SAVE, GM_WHISPER, GM_BROADCAST,
  GM_XP, GM_GIVE, GM_CONDITION, GM_STASH_DENY, GM_WEBHOOK, GM_REST,
} from './multiplayer/protocol.js';
import { useMultiplayer } from './multiplayer/useMultiplayer.js';
import brandMark from './assets/brand-mark.jpg';
import CharacterSheet from './components/CharacterSheet.jsx';
import CharacterWizard from './components/CharacterWizard.jsx';
import ConnectionBadge from './components/ConnectionBadge.jsx';
import MultiplayerModal from './components/MultiplayerModal.jsx';
import GmDashboard from './components/GmDashboard.jsx';
import HelpModal from './components/HelpModal.jsx';
import RosterModal from './components/RosterModal.jsx';
import Footer from './components/Footer.jsx';
import { ArtMouse } from './components/Art.jsx';
import VolumeControl from './components/VolumeControl.jsx';

const STORAGE_KEY = 'pips-paws-character-v1';

export default function App() {
  const { t, lang, setLang } = useLang();
  const { theme, cycle: cycleTheme } = useTheme();
  const { skin, toggle: toggleSkin } = useSkin();
  const mp = useMultiplayer();

  const [character, setCharacter] = useState(() => {
    const saved = readJSON(STORAGE_KEY);
    return saved ? normalizeCharacter(saved) : blankCharacter();
  });
  const [showWizard, setShowWizard] = useState(() => isBlank(readJSON(STORAGE_KEY)));
  const [showMpModal, setShowMpModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const { roster, mirror: mirrorRoster, remove: removeFromRoster } = useCharacterRoster();
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const fileInput = useRef(null);
  const lastCmdRef = useRef(null);
  // Wunschplatz beim Ziehen aus der Tischmitte: der SL gewaehrt den Gegenstand
  // erst per GM_GIVE zurueck, bis dahin merken wir uns das Ziel lokal.
  const wantSlotRef = useRef({});

  // Nehmen aus der Tischmitte; slot ist der Wunschplatz beim Ziehen (optional).
  const { stashTake } = mp;
  const takeFromStash = useCallback((itemId, slot) => {
    if (slot) wantSlotRef.current[itemId] = slot;
    stashTake(itemId);
  }, [stashTake]);

  const notify = useCallback((message, kind = 'info') => {
    setToast({ message, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => {
    writeJSON(STORAGE_KEY, character);
    // Jede je aktive Maus landet automatisch in "Meine Maeuse" — ohne
    // manuelles Sichern, siehe useCharacterRoster.js.
    mirrorRoster(character);
  }, [character, mirrorRoster]);

  // Titel + Meta-Beschreibung an die aktuelle Sprache anpassen. Suchmaschinen
  // rendern das JS und indexieren die uebersetzte Fassung (z. B. bei ?lang=fr).
  useEffect(() => {
    document.title = t('meta.title');
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', t('meta.description'));
  }, [t, lang]);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // Reload-/Schliessen-Schutz
  useEffect(() => {
    if (isBlank(character) && !mp.role) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [character, mp.role]);

  // Spieler: eigenen Bogen (debounced) an den Spielleiter pushen
  const { role: mpRole, sendState, resyncNonce } = mp;
  useEffect(() => {
    if (mpRole !== 'player') return undefined;
    const id = setTimeout(() => sendState(character), 300);
    return () => clearTimeout(id);
    // resyncNonce: nach jedem (Wieder-)Verbinden den Bogen erneut schicken
  }, [character, mpRole, sendState, resyncNonce]);

  // Spieler: Befehle des Spielleiters anwenden
  const { gmCommand, clearGmCommand, sendEvent, stashDrop } = mp;
  useEffect(() => {
    if (!gmCommand || lastCmdRef.current === gmCommand.id) return;
    lastCmdRef.current = gmCommand.id;
    const cmd = gmCommand.cmd;
    const cn = character.name || t('app.title');

    if (cmd === GM_HEAL) {
      setCharacter((c) => applyHeal(c, gmCommand.amount));
      notify(t('player.gm.heal', { n: gmCommand.amount }), 'ok');
      shareEvent(cn, `💚 ${t('player.gm.heal', { n: gmCommand.amount })}`, 'ok');
    } else if (cmd === GM_PIPS) {
      setCharacter((c) => applyPips(c, gmCommand.amount));
      notify(t('player.gm.pips', { n: gmCommand.amount }), gmCommand.amount >= 0 ? 'ok' : 'warn');
    } else if (cmd === GM_DAMAGE) {
      // applyDamage() einmal direkt aufrufen (nicht in der setCharacter-Updater-
      // Funktion) — deren Rueckgabe wuerde erst beim naechsten Commit ausgewertet,
      // also NACH dem synchronen Code hier unten (strHit/saveRoll waeren dann
      // noch auf ihren Anfangswerten). Ausserdem wuerde ein zweiter Aufruf wegen
      // des Rettungswurfs eine ANDERE Zufallszahl liefern als die gespeicherte.
      const { character: nextChar, strHit, saveRoll, dead, injuredOk } = applyDamage(character, gmCommand.amount);
      setCharacter(nextChar);
      notify(
        strHit > 0 ? t('player.gm.strDamage', { n: gmCommand.amount, s: strHit }) : t('player.gm.damage', { n: gmCommand.amount }),
        'bad',
      );
      shareEvent(cn, `🩸 ${gmCommand.amount} ${t('item.damage')}${strHit > 0 ? ` (${strHit} → STR)` : ''}`, 'bad');
      // SRD-Schadenskette: STR-Schaden verlangt sofort einen automatischen
      // STR-Rettungswurf; misslingt er, gibt's kritischen Schaden (Verletzt +
      // kampfunfaehig). Sinkt STR auf 0, ist die Maus tot. Siehe gmActions.js.
      if (saveRoll) {
        sendEvent({ kind: 'save', attr: 'str', roll: saveRoll.d, target: saveRoll.target, ok: saveRoll.ok, reason: 'damage' });
        notify(
          `${t('dice.saveVs', { attr: t('attr.str') })} — d20 ${saveRoll.d} ≤ ${saveRoll.target} · ${saveRoll.ok ? t('dice.success') : t('dice.fail')}`,
          saveRoll.ok ? 'ok' : 'bad',
        );
        shareEvent(cn, `🎲 ${t('dice.saveVs', { attr: t('attr.str') })} — W20 ${saveRoll.d} ≤ ${saveRoll.target} · ${saveRoll.ok ? '✅' : '❌'}`, saveRoll.ok ? 'ok' : 'bad');
        if (!saveRoll.ok && !dead) {
          notify(t('player.gm.critDamage'), 'bad');
          shareEvent(cn, `💥 ${t('player.gm.critDamage')}`, 'bad');
        }
        if (injuredOk === false) {
          notify(t('player.gm.conditionNoRoom', { name: loc(CONDITION_CATALOG.injured.name, lang) }), 'warn');
        }
      }
      if (dead) {
        notify(t('player.gm.dead'), 'bad');
        shareEvent(cn, `☠ ${t('player.gm.dead')}`, 'bad');
      }
    } else if (cmd === GM_SAVE) {
      const r = rollSave(character[gmCommand.attr]?.current ?? 0);
      const prefix = gmCommand.reason === 'initiative' ? `${t('combat.initiative')}: ` : '';
      notify(
        `${prefix}${t('dice.saveVs', { attr: t(`attr.${gmCommand.attr}`) })} — d20 ${r.d} ≤ ${r.target} · ${r.ok ? t('dice.success') : t('dice.fail')}`,
        r.ok ? 'ok' : 'bad',
      );
      sendEvent({ kind: 'save', attr: gmCommand.attr, roll: r.d, target: r.target, ok: r.ok, reason: gmCommand.reason });
      shareEvent(cn, `${prefix}🎲 ${t('dice.saveVs', { attr: t(`attr.${gmCommand.attr}`) })} — W20 ${r.d} ≤ ${r.target} · ${r.ok ? '✅' : '❌'}`, r.ok ? 'ok' : 'bad');
    } else if (cmd === GM_REST) {
      const { character: next, msg, noRation } = applyRest(character, gmCommand.kind);
      setCharacter(next);
      const vars = msg.vars.attrKey ? { ...msg.vars, attr: t(`attr.${msg.vars.attrKey}`) } : msg.vars;
      const text = t(msg.key, vars) + (noRation && gmCommand.kind === 'long' ? ` — ${t('rest.noRation')}` : '');
      notify(`${t(`rest.${gmCommand.kind}`)}: ${text}`, 'ok');
      shareEvent(cn, `🌙 ${t(`rest.${gmCommand.kind}`)} — ${text}`, 'ok');
    } else if (cmd === GM_XP) {
      const { before, after } = applyXp(character, gmCommand.amount);
      setCharacter((c) => applyXp(c, gmCommand.amount).character);
      notify(t('player.gm.xp', { n: gmCommand.amount }), gmCommand.amount >= 0 ? 'ok' : 'warn');
      shareEvent(cn, `✨ ${t('player.gm.xp', { n: gmCommand.amount })}`, 'gold');
      if (after > before) shareEvent(cn, `⭐ ${t('res.level')} ${after}!`, 'gold');
    } else if (cmd === GM_GIVE && gmCommand.item) {
      const item = gmCommand.item;
      const label = loc(item.name, lang);
      const wantSlot = wantSlotRef.current[item.itemId];
      delete wantSlotRef.current[item.itemId];
      const { ok } = applyGive(character, item, wantSlot);
      if (ok) {
        setCharacter((c) => applyGive(c, item, wantSlot).character);
        notify(t('player.gm.give', { item: label }), 'ok');
      } else {
        stashDrop(item);
        notify(t('player.gm.giveNoRoom', { item: label }), 'warn');
      }
      shareEvent(cn, `🎁 ${t('player.gm.give', { item: label })}`, 'info');
    } else if (cmd === GM_CONDITION) {
      const { ok, cond } = applyCondition(character, gmCommand.key);
      const label = loc(cond.name, lang);
      if (ok) {
        setCharacter((c) => applyCondition(c, gmCommand.key, cond).character);
        notify(t('player.gm.condition', { name: label }), 'bad');
        shareEvent(cn, `⚠️ ${t('player.gm.condition', { name: label })}`, 'bad');
      } else {
        notify(t('player.gm.conditionNoRoom', { name: label }), 'warn');
      }
    } else if (cmd === GM_STASH_DENY) {
      notify(t('player.gm.stashGone'), 'warn');
    } else if (cmd === GM_WEBHOOK && gmCommand.url) {
      setWebhook(gmCommand.url);
      notify(t('player.gm.webhookShared'), 'ok');
    } else if (cmd === GM_WHISPER) {
      notify(`${t('player.gm.whisper')}: ${gmCommand.text}`, 'info');
    } else if (cmd === GM_BROADCAST) {
      notify(`${t('player.gm.broadcast')}: ${gmCommand.text}`, 'info');
    }
    clearGmCommand();
  }, [gmCommand, clearGmCommand, notify, t, lang, character, sendEvent, stashDrop]);

  const onImport = async (file) => {
    if (!file) return;
    try {
      setCharacter(await readCharacterFile(file));
      setShowWizard(false);
      notify(t('toast.imported'), 'ok');
    } catch {
      notify(t('toast.importFailed'), 'bad');
    }
  };

  const isGm = mp.role === 'gm';

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <img className="skin-classic-only" src={brandMark} alt="" width="56" height="56" />
            <ArtMouse className="brand-mark-line skin-print-only" size={46} />
          </span>
          <div>
            <h1 className="brand-title">{t('app.title')}</h1>
            <p className="brand-sub">{t('app.tagline')}</p>
          </div>
        </div>
        <div className="topbar-actions">
          <ConnectionBadge mp={mp} onOpen={() => setShowMpModal(true)} />
          {!isGm ? (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  if (isBlank(character) || window.confirm(t('confirm.new'))) setShowWizard(true);
                }}
              >
                <Sparkles size={16} /> {t('header.new')}
              </button>
              {roster.length > 1 ? (
                <button type="button" className="btn btn-ghost" onClick={() => setShowRoster(true)}>
                  <BookCopy size={16} /> {t('header.roster')}
                </button>
              ) : null}
              <button type="button" className="btn btn-ghost" onClick={() => downloadCharacter(character)}>
                <Download size={16} /> {t('header.export')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => fileInput.current?.click()}>
                <Upload size={16} /> {t('header.import')}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  onImport(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost btn-icon-only"
            onClick={cycleTheme}
            aria-label={`${t('header.theme')}: ${t(`theme.${theme}`)}`}
            title={`${t('header.theme')}: ${t(`theme.${theme}`)}`}
          >
            {theme === 'system' ? <Monitor size={16} /> : theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <VolumeControl />
          <button
            type="button"
            className="btn btn-ghost btn-icon-only"
            onClick={toggleSkin}
            aria-label={`${t('header.skin')}: ${t(`skin.${skin}`)}`}
            title={`${t('header.skin')}: ${t(`skin.${skin}`)}`}
          >
            <Brush size={16} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon-only"
            onClick={() => setShowHelp(true)}
            aria-label={t('header.help')}
            title={t('header.help')}
          >
            <CircleHelp size={16} />
          </button>
          <div className="lang-switch" role="group" aria-label={t('header.language')}>
            <Languages size={15} />
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                className={l.code === lang ? 'active' : ''}
                onClick={() => setLang(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main>
        {isGm ? (
          <GmDashboard mp={mp} notify={notify} />
        ) : (
          <CharacterSheet
            character={character}
            setCharacter={setCharacter}
            notify={notify}
            onEvent={mp.role === 'player' ? sendEvent : null}
            stash={mp.role === 'player' ? { items: mp.stash, take: takeFromStash, drop: mp.stashDrop } : null}
            partyLog={mp.role === 'player' ? { entries: mp.liveLog, shared: mp.partyLog } : null}
            partyTime={mp.role === 'player' ? mp.partyTime : null}
            restLocked={mp.role === 'player' && mp.restLocked}
            partyNpcs={mp.role === 'player' ? mp.partyNpcs : null}
            partyGroup={mp.role === 'player' ? mp.partyGroup : null}
            myPeerId={mp.role === 'player' ? mp.myPeerId : null}
          />
        )}
      </main>

      <Footer onHelp={() => setShowHelp(true)} />

      {showWizard && !isGm ? (
        <CharacterWizard
          onCancel={() => setShowWizard(false)}
          onDone={(c) => {
            setCharacter(c);
            setShowWizard(false);
          }}
        />
      ) : null}

      {showMpModal ? <MultiplayerModal mp={mp} onClose={() => setShowMpModal(false)} /> : null}

      {showHelp ? <HelpModal onClose={() => setShowHelp(false)} /> : null}

      {showRoster ? (
        <RosterModal
          roster={roster}
          activeId={character.id}
          onLoad={(c) => {
            setCharacter(normalizeCharacter(c));
            setShowRoster(false);
          }}
          onRemove={removeFromRoster}
          onClose={() => setShowRoster(false)}
        />
      ) : null}

      {toast ? <div className={`toast toast-${toast.kind}`}>{toast.message}</div> : null}
    </div>
  );
}
