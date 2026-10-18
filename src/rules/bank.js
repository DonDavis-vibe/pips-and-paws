// Bank (Mausritter 2.3, S. 8 "Banking"): In einer Siedlung lassen sich Pips und
// Gegenstaende in einer Bank oder einem Safe lagern. Beim Abholen faellt eine
// Gebuehr von 1 % des Wertes an. Die Bank gehoert zum Bogen (`character.bank`),
// zaehlt nicht zum Inventar und nicht zu den getragenen Pips (Pip-Beutel).

import { addItem, removeItem } from './inventory.js';
import { itemPrice } from './economy.js';

export const BANK_FEE_PERCENT = 1;

export const blankBank = () => ({ pips: 0, items: {} });

export const normalizeBank = (b) => ({
  pips: Math.max(0, Math.floor(Number(b?.pips) || 0)),
  items: b?.items && typeof b.items === 'object' ? b.items : {},
});

// 1 % des Wertes, aufgerundet (mindestens 1 Pip, sobald etwas abgeholt wird).
export const bankFee = (value) => (value > 0 ? Math.max(1, Math.ceil((value * BANK_FEE_PERCENT) / 100)) : 0);

// Wert eines Gegenstands fuer die Gebuehr: eigene Angabe (`worth`, z. B. fuer
// Schatz wie einen Goldring), sonst der Listenpreis, sonst 0.
export function itemWorth(item) {
  if (Number.isFinite(item?.worth) && item.worth >= 0) return item.worth;
  return itemPrice(item) ?? 0;
}

export function depositPips(c, n) {
  const amount = Math.floor(n);
  if (!(amount > 0)) return { ok: false, reason: 'amount' };
  if (amount > (c.pips || 0)) return { ok: false, reason: 'tooFew' };
  const bank = normalizeBank(c.bank);
  return { ok: true, character: { ...c, pips: c.pips - amount, bank: { ...bank, pips: bank.pips + amount } } };
}

// Abheben: die Gebuehr kommt von der abgehobenen Summe ab, es kommen n - Gebuehr an.
export function withdrawPips(c, n) {
  const amount = Math.floor(n);
  const bank = normalizeBank(c.bank);
  if (!(amount > 0)) return { ok: false, reason: 'amount' };
  if (amount > bank.pips) return { ok: false, reason: 'tooFew' };
  const fee = bankFee(amount);
  return {
    ok: true,
    fee,
    received: amount - fee,
    character: { ...c, pips: (c.pips || 0) + amount - fee, bank: { ...bank, pips: bank.pips - amount } },
  };
}

// Gegenstand einlagern (Zustaende bleiben beim Bogen: sie lassen sich nicht abgeben).
export function storeItem(c, itemId) {
  const item = c.items?.[itemId];
  if (!item || item.type === 'condition') return { ok: false, reason: 'notStorable' };
  const bank = normalizeBank(c.bank);
  const { lit: _lit, ...rest } = item; // eine Lichtquelle in der Bank brennt nicht
  const next = removeItem(c, itemId);
  return { ok: true, character: { ...next, bank: { ...bank, items: { ...bank.items, [itemId]: rest } } } };
}

// Gegenstand abholen: braucht einen freien Platz und die Gebuehr in Pips.
export function retrieveItem(c, itemId) {
  const bank = normalizeBank(c.bank);
  const item = bank.items[itemId];
  if (!item) return { ok: false, reason: 'missing' };
  const fee = bankFee(itemWorth(item));
  if ((c.pips || 0) < fee) return { ok: false, reason: 'tooPoor', fee };
  const res = addItem({ ...c, pips: (c.pips || 0) - fee }, item);
  if (!res.ok) return { ok: false, reason: 'noRoom', fee };
  const items = { ...bank.items };
  delete items[itemId];
  return { ok: true, fee, character: { ...res.character, bank: { ...bank, items } } };
}

export function setItemWorth(c, itemId, worth) {
  const bank = normalizeBank(c.bank);
  const item = bank.items[itemId];
  if (!item) return c;
  const value = Math.max(0, Math.floor(Number(worth) || 0));
  return { ...c, bank: { ...bank, items: { ...bank.items, [itemId]: { ...item, worth: value } } } };
}
