import { useState } from 'react';
import { Landmark, PiggyBank, Wallet, Undo2 } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import Panel from './Panel.jsx';
import { itemLabel } from '../data/items.js';
import {
  normalizeBank, bankFee, itemWorth, depositPips, withdrawPips, storeItem, retrieveItem, setItemWorth,
} from '../rules/bank.js';

// Bank (Regeln S. 8): in einer Siedlung Pips und Gegenstaende einlagern, beim
// Abholen 1 % des Wertes als Gebuehr. Die Bank gehoert zum Bogen — sie zaehlt
// nicht zum Inventar (kein Platz noetig) und nicht zu den getragenen Pips.
export default function BankPanel({ character, setCharacter, notify }) {
  const { t, lang } = useLang();
  const [pick, setPick] = useState('');
  const bank = normalizeBank(character.bank);
  const storedItems = Object.values(bank.items);
  const storable = Object.values(character.items || {}).filter((i) => i.type !== 'condition');
  const name = (it) => itemLabel(it, loc(it.name, lang));

  const apply = (res, okMsg) => {
    if (!res.ok) {
      const key = {
        tooFew: 'bank.tooFew', amount: 'bank.amount', tooPoor: 'bank.tooPoor', noRoom: 'inv.noRoom', notStorable: 'bank.notStorable', missing: 'bank.amount',
      }[res.reason] || 'bank.amount';
      notify(t(key, { n: res.fee ?? 0 }), 'warn');
      return;
    }
    setCharacter(res.character);
    if (okMsg) notify(okMsg(res), 'ok');
  };

  const ask = (promptKey, max) => {
    const raw = window.prompt(t(promptKey, { n: max }));
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const deposit = () => {
    const n = ask('bank.promptDeposit', character.pips || 0);
    if (n) apply(depositPips(character, n), () => t('bank.deposited', { n }));
  };

  const withdraw = () => {
    const n = ask('bank.promptWithdraw', bank.pips);
    if (n) apply(withdrawPips(character, n), (r) => t('bank.withdrawn', { n, fee: r.fee, got: r.received }));
  };

  const store = () => {
    if (!pick) return;
    const item = character.items[pick];
    apply(storeItem(character, pick), () => t('bank.stored', { name: name(item) }));
    setPick('');
  };

  return (
    <Panel
      id="bank"
      icon={Landmark}
      title={(
        <>
          {t('bank.title')}
          {bank.pips || storedItems.length ? (
            <span className="stash-count">{bank.pips}p{storedItems.length ? ` · ${storedItems.length}` : ''}</span>
          ) : null}
        </>
      )}
      defaultOpen={false}
    >
      <p className="hint">{t('bank.hint')}</p>

      <div className="bank-pips">
        <span className="bank-balance"><PiggyBank size={15} /> {t('bank.balance', { n: bank.pips })}</span>
        <button type="button" className="btn btn-sm btn-ghost" disabled={!character.pips} onClick={deposit}>
          {t('bank.deposit')}
        </button>
        <button type="button" className="btn btn-sm btn-ghost" disabled={!bank.pips} onClick={withdraw}>
          {t('bank.withdraw')}
        </button>
      </div>

      <div className="bank-store">
        <select className="text-input" value={pick} onChange={(e) => setPick(e.target.value)} aria-label={t('bank.storeItem')}>
          <option value="">{t('bank.storeItem')}</option>
          {storable.map((it) => <option key={it.itemId} value={it.itemId}>{name(it)}</option>)}
        </select>
        <button type="button" className="btn btn-sm" disabled={!pick} onClick={store}>
          <Wallet size={14} /> {t('bank.store')}
        </button>
      </div>

      {storedItems.length === 0 ? (
        <p className="hint">{t('bank.empty')}</p>
      ) : (
        <ul className="bank-items">
          {storedItems.map((it) => {
            const worth = itemWorth(it);
            return (
              <li key={it.itemId}>
                <span className="bank-item-name">{name(it)}{it.usage ? ` (${it.usage.current}/${it.usage.max})` : ''}</span>
                <label className="bank-worth" title={t('bank.worthHint')}>
                  {t('bank.worth')}
                  <input
                    type="number"
                    min="0"
                    className="text-input"
                    value={Number.isFinite(it.worth) ? it.worth : worth}
                    onChange={(e) => setCharacter((c) => setItemWorth(c, it.itemId, e.target.value))}
                  />
                  p
                </label>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  title={t('bank.retrieveHint')}
                  onClick={() => apply(retrieveItem(character, it.itemId), (r) => t('bank.retrieved', { name: name(it), fee: r.fee }))}
                >
                  <Undo2 size={13} /> {t('bank.retrieve', { fee: bankFee(worth) })}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
