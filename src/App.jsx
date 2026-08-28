import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Upload, Sparkles, Languages } from 'lucide-react';
import { useLang } from './i18n/index.jsx';
import { blankCharacter, isBlank, normalizeCharacter } from './rules/character.js';
import { readJSON, writeJSON } from './utils/storage.js';
import { downloadCharacter, readCharacterFile } from './utils/exportImport.js';
import { rollSave } from './rules/dice.js';
import {
  GM_DAMAGE, GM_HEAL, GM_PIPS, GM_SAVE, GM_WHISPER, GM_BROADCAST,
} from './multiplayer/protocol.js';
import { useMultiplayer } from './multiplayer/useMultiplayer.js';
import CharacterSheet from './components/CharacterSheet.jsx';
import CharacterWizard from './components/CharacterWizard.jsx';
import ConnectionBadge from './components/ConnectionBadge.jsx';
import MultiplayerModal from './components/MultiplayerModal.jsx';
import GmDashboard from './components/GmDashboard.jsx';

const STORAGE_KEY = 'pips-paws-character-v1';

export default function App() {
  const { t, lang, setLang } = useLang();
  const mp = useMultiplayer();

  const [character, setCharacter] = useState(() => {
    const saved = readJSON(STORAGE_KEY);
    return saved ? normalizeCharacter(saved) : blankCharacter();
  });
  const [showWizard, setShowWizard] = useState(() => isBlank(readJSON(STORAGE_KEY)));
  const [showMpModal, setShowMpModal] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const fileInput = useRef(null);
  const lastCmdRef = useRef(null);

  const notify = useCallback((message, kind = 'info') => {
    setToast({ message, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => {
    writeJSON(STORAGE_KEY, character);
  }, [character]);
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
  const { role: mpRole, sendState } = mp;
  useEffect(() => {
    if (mpRole !== 'player') return undefined;
    const id = setTimeout(() => sendState(character), 300);
    return () => clearTimeout(id);
  }, [character, mpRole, sendState]);

  // Spieler: Befehle des Spielleiters anwenden
  const { gmCommand, clearGmCommand, sendEvent } = mp;
  useEffect(() => {
    if (!gmCommand || lastCmdRef.current === gmCommand.id) return;
    lastCmdRef.current = gmCommand.id;
    const cmd = gmCommand.cmd;

    if (cmd === GM_HEAL) {
      setCharacter((c) => ({ ...c, hp: { ...c.hp, current: Math.min(c.hp.max, c.hp.current + gmCommand.amount) } }));
      notify(t('player.gm.heal', { n: gmCommand.amount }), 'ok');
    } else if (cmd === GM_PIPS) {
      setCharacter((c) => ({ ...c, pips: Math.max(0, c.pips + gmCommand.amount) }));
      notify(t('player.gm.pips', { n: gmCommand.amount }), gmCommand.amount >= 0 ? 'ok' : 'warn');
    } else if (cmd === GM_DAMAGE) {
      let strHit = 0;
      setCharacter((c) => {
        let hpCur = c.hp.current - gmCommand.amount;
        let strCur = c.str.current;
        if (hpCur < 0) {
          strHit = -hpCur;
          strCur = Math.max(0, strCur - strHit);
          hpCur = 0;
        }
        return { ...c, hp: { ...c.hp, current: hpCur }, str: { ...c.str, current: strCur } };
      });
      notify(
        strHit > 0 ? t('player.gm.strDamage', { n: gmCommand.amount, s: strHit }) : t('player.gm.damage', { n: gmCommand.amount }),
        'bad',
      );
    } else if (cmd === GM_SAVE) {
      const r = rollSave(character[gmCommand.attr]?.current ?? 0);
      notify(
        `${t('dice.saveVs', { attr: t(`attr.${gmCommand.attr}`) })} — d20 ${r.d} ≤ ${r.target} · ${r.ok ? t('dice.success') : t('dice.fail')}`,
        r.ok ? 'ok' : 'bad',
      );
      sendEvent({ kind: 'save', attr: gmCommand.attr, roll: r.d, target: r.target, ok: r.ok });
    } else if (cmd === GM_WHISPER) {
      notify(`${t('player.gm.whisper')}: ${gmCommand.text}`, 'info');
    } else if (cmd === GM_BROADCAST) {
      notify(`${t('player.gm.broadcast')}: ${gmCommand.text}`, 'info');
    }
    clearGmCommand();
  }, [gmCommand, clearGmCommand, notify, t, character, sendEvent]);

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
          <span className="brand-mark">🐭</span>
          <div>
            <div className="brand-title">{t('app.title')}</div>
            <div className="brand-sub">{t('app.tagline')}</div>
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
          <div className="lang-switch" role="group" aria-label={t('header.language')}>
            <Languages size={15} />
            {['de', 'en'].map((l) => (
              <button key={l} type="button" className={l === lang ? 'active' : ''} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main>
        {isGm ? (
          <GmDashboard mp={mp} />
        ) : (
          <CharacterSheet
            character={character}
            setCharacter={setCharacter}
            notify={notify}
            onEvent={mp.role === 'player' ? sendEvent : null}
          />
        )}
      </main>

      <footer className="disclaimer">
        <p>{t('footer.disclaimer1')}</p>
        <p>{t('footer.disclaimer2')}</p>
      </footer>

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

      {toast ? <div className={`toast toast-${toast.kind}`}>{toast.message}</div> : null}
    </div>
  );
}
