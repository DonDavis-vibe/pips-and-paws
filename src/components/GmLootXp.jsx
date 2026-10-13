import { useState } from 'react';
import { Gem } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { applyXp, applyPips } from '../rules/gmActions.js';
import { lootShare } from '../rules/economy.js';
import { GM_XP, GM_PIPS } from '../multiplayer/protocol.js';

// Beute in EP (Regel S. 11): Fuer jeden Pip-Wert Schatz, der in Sicherheit
// gebracht wird, gibt es 1 EP — gleichmaessig auf die Gruppe verteilt. Optional
// wird der Anteil auch gleich als Pips gutgeschrieben.
export default function GmLootXp({ mp, localApi, gmLog }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState('');
  const [asPips, setAsPips] = useState(false);
  const [skip, setSkip] = useState([]);

  const members = [
    ...Object.entries(mp.players).map(([peerId, p]) => ({ id: `peer:${peerId}`, peerId, name: p.character?.name || '?' })),
    ...localApi.players.map((p) => ({ id: `local:${p.id}`, localId: p.id, name: p.name || '?' })),
  ];
  const chosen = members.filter((m) => !skip.includes(m.id));
  const share = lootShare(parseInt(total, 10) || 0, chosen.length);

  const apply = (e) => {
    e.preventDefault();
    if (!share) return;
    chosen.forEach((m) => {
      if (m.peerId) {
        mp.sendGmCommand(m.peerId, { cmd: GM_XP, amount: share });
        if (asPips) mp.sendGmCommand(m.peerId, { cmd: GM_PIPS, amount: share });
      } else {
        localApi.updatePlayer(m.localId, (c) => {
          const next = applyXp(c, share).character;
          return asPips ? applyPips(next, share) : next;
        });
      }
    });
    gmLog('gm.log.loot', { total: parseInt(total, 10), share, n: chosen.length });
    setTotal('');
    setOpen(false);
  };

  return (
    <span className="gm-cond-picker">
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen((v) => !v)} title={t('loot.hint')}>
        <Gem size={15} /> {t('loot.title')}
      </button>
      {open ? (
        <form className="gm-dmg-form fight-form" onSubmit={apply}>
          <label className="gm-dmg-row">
            <span>{t('loot.total')}</span>
            <input type="number" min="0" inputMode="numeric" autoFocus value={total} onChange={(e) => setTotal(e.target.value)} />
          </label>
          {members.length === 0 ? <p className="hint">{t('loot.nobody')}</p> : members.map((m) => (
            <label key={m.id} className="gm-dmg-check">
              <input
                type="checkbox"
                checked={!skip.includes(m.id)}
                onChange={(e) => setSkip((s) => (e.target.checked ? s.filter((x) => x !== m.id) : [...s, m.id]))}
              />
              {m.name}
            </label>
          ))}
          <label className="gm-dmg-check">
            <input type="checkbox" checked={asPips} onChange={(e) => setAsPips(e.target.checked)} />
            {t('loot.asPips')}
          </label>
          <p className="hint">{t('loot.share', { n: share })}</p>
          <button type="submit" className="btn btn-sm btn-primary" disabled={!share}>
            {t('loot.apply')}
          </button>
        </form>
      ) : null}
    </span>
  );
}
