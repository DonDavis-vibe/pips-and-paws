import { useCallback, useRef, useState } from 'react';
import { Timer, Flame, Dice5, RotateCcw, Minus, Plus } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { readJSON, writeJSON } from '../utils/storage.js';
import { rollDie } from '../rules/dice.js';

const KEY = 'pips-paws-gm-tracker';
const TURNS_PER_WATCH = 36;
const WATCHES_PER_DAY = 4;

const fresh = () => ({
  turn: 0,
  lightOn: false,
  lightLeft: 6,
  encMode: 'dungeon', // dungeon | wild | off
  encLeft: 3,
});

// Zeit-, Licht- und Begegnungs-Tracker fuer den Spielleiter (SRD S. "Time" / SL-Bogen).
// Rein lokal beim SL, ueberlebt einen Reload; Meldungen laufen ins Live-Log.
export default function GmTimeTracker({ onLog }) {
  const { t } = useLang();
  const [s, setS] = useState(() => ({ ...fresh(), ...readJSON(KEY) }));
  const sRef = useRef(s);
  sRef.current = s;

  const commit = useCallback((next) => {
    sRef.current = next;
    setS(next);
    writeJSON(KEY, next);
  }, []);

  const rollEncounter = useCallback(
    (withHour) => {
      const r = rollDie(6);
      const kind = r === 1 ? 'encounter' : r === 2 ? 'omen' : 'nothing';
      onLog('time.log.encounter', { roll: r, result: t(`time.enc.${kind}`) });
      if (withHour && kind !== 'nothing') {
        onLog('time.log.encHour', { hour: rollDie(12) });
      }
    },
    [onLog, t],
  );

  const advance = useCallback(
    (delta) => {
      const cur = sRef.current;
      let { turn, lightOn, lightLeft, encMode, encLeft } = cur;
      turn = Math.max(0, turn + delta);

      if (delta > 0) {
        const prevWatch = Math.floor(cur.turn / TURNS_PER_WATCH);
        const newWatch = Math.floor(turn / TURNS_PER_WATCH);
        if (newWatch > prevWatch) {
          onLog('time.log.watch', {
            day: Math.floor(turn / (TURNS_PER_WATCH * WATCHES_PER_DAY)) + 1,
            watch: (newWatch % WATCHES_PER_DAY) + 1,
          });
        }
        if (lightOn) {
          lightLeft -= 1;
          if (lightLeft <= 0) {
            onLog('time.log.light', {});
            lightLeft = 6;
          }
        }
        if (encMode === 'dungeon') {
          encLeft -= 1;
          if (encLeft <= 0) {
            rollEncounter(false);
            encLeft = 3;
          }
        }
      }
      commit({ ...cur, turn, lightLeft, encLeft });
    },
    [commit, onLog, rollEncounter],
  );

  const watch = Math.floor(s.turn / TURNS_PER_WATCH);
  const day = Math.floor(watch / WATCHES_PER_DAY) + 1;
  const watchNo = (watch % WATCHES_PER_DAY) + 1;
  const inWatch = s.turn % TURNS_PER_WATCH;

  return (
    <section className="panel time-panel">
      <div className="panel-head">
        <h2>
          <Timer size={18} /> {t('time.title')}
        </h2>
        <button type="button" className="icon-btn" onClick={() => commit(fresh())} aria-label={t('time.reset')} title={t('time.reset')}>
          <RotateCcw size={15} />
        </button>
      </div>

      <div className="time-row">
        <div className="time-clock">
          <span>
            {t('time.day')} {day} · {t('time.watch')} {watchNo}
          </span>
          <strong>
            {t('time.turn')} {s.turn} <span className="time-dim">({inWatch}/{TURNS_PER_WATCH})</span>
          </strong>
        </div>
        <div className="time-steppers">
          <button type="button" className="btn btn-sm" onClick={() => advance(-1)} aria-label={t('time.prev')}>
            <Minus size={14} />
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => advance(1)}>
            <Plus size={14} /> {t('time.turn')}
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => advance(TURNS_PER_WATCH - inWatch)}>
            {t('time.nextWatch')}
          </button>
        </div>
      </div>

      <div className="time-row">
        <button
          type="button"
          className={`btn btn-sm${s.lightOn ? ' btn-primary' : ' btn-ghost'}`}
          onClick={() => commit({ ...s, lightOn: !s.lightOn, lightLeft: s.lightOn ? s.lightLeft : 6 })}
        >
          <Flame size={14} /> {s.lightOn ? t('time.lightOn') : t('time.lightOff')}
        </button>
        {s.lightOn ? (
          <span className="time-dim">{t('time.lightLeft', { n: s.lightLeft })}</span>
        ) : null}
      </div>

      <div className="time-row">
        <span className="gm-save-label">{t('time.encounter')}:</span>
        <select className="text-input time-select" value={s.encMode} onChange={(e) => commit({ ...s, encMode: e.target.value, encLeft: 3 })}>
          <option value="dungeon">{t('time.mode.dungeon')}</option>
          <option value="wild">{t('time.mode.wild')}</option>
          <option value="off">{t('time.mode.off')}</option>
        </select>
        {s.encMode === 'dungeon' ? <span className="time-dim">{t('time.encIn', { n: s.encLeft })}</span> : null}
        {s.encMode !== 'off' ? (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => rollEncounter(s.encMode === 'wild')}>
            <Dice5 size={14} /> {t('time.rollNow')}
          </button>
        ) : null}
      </div>
    </section>
  );
}
