import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import {
  ITEM_CATALOG, CATALOG_KEYS, CONDITION_CATALOG, SPELL_CATALOG, makeItem, makeCondition,
} from '../data/items.js';
import { Modal, Field, TextInput } from './ui.jsx';

const TABS = ['catalog', 'spell', 'condition', 'custom'];

export default function AddItemMenu({ onAdd }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('catalog');
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState('standard');
  const [customSize, setCustomSize] = useState(1);
  const [customUses, setCustomUses] = useState(0);

  const add = (item) => {
    onAdd(item);
    setOpen(false);
    setCustomName('');
  };

  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        <Plus size={16} /> {t('inv.add')}
      </button>

      {open ? (
        <Modal title={t('inv.add')} onClose={() => setOpen(false)} wide>
          <div className="tab-row">
            {TABS.map((tb) => (
              <button
                key={tb}
                type="button"
                className={`tab${tab === tb ? ' tab-active' : ''}`}
                onClick={() => setTab(tb)}
              >
                {t(`inv.tab.${tb}`)}
              </button>
            ))}
          </div>

          {tab === 'catalog' ? (
            <div className="catalog-grid">
              {CATALOG_KEYS.map((key) => {
                const c = ITEM_CATALOG[key];
                return (
                  <button key={key} type="button" className="catalog-item" onClick={() => add(makeItem(key))}>
                    <span className="catalog-name">{loc(c.name, lang)}</span>
                    <span className="catalog-tags">
                      {t(`type.${c.type}`)}
                      {c.size === 2 ? ` · ${t('item.twoSlots')}` : ''}
                      {c.damage ? ` · ${c.damage}` : ''}
                      {c.defense ? ` · ${t('item.defense')} ${c.defense}` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {tab === 'spell' ? (
            <div className="catalog-grid">
              {Object.keys(SPELL_CATALOG).map((key) => (
                <button key={key} type="button" className="catalog-item" onClick={() => add(makeItem(key))}>
                  <span className="catalog-name">{loc(SPELL_CATALOG[key].name, lang)}</span>
                  <span className="catalog-tags">{loc(SPELL_CATALOG[key].effect, lang)}</span>
                </button>
              ))}
            </div>
          ) : null}

          {tab === 'condition' ? (
            <div className="catalog-grid">
              {Object.keys(CONDITION_CATALOG).map((key) => (
                <button key={key} type="button" className="catalog-item" onClick={() => add(makeCondition(key))}>
                  <span className="catalog-name">{loc(CONDITION_CATALOG[key].name, lang)}</span>
                  <span className="catalog-tags">{loc(CONDITION_CATALOG[key].effect, lang)}</span>
                </button>
              ))}
            </div>
          ) : null}

          {tab === 'custom' ? (
            <div className="custom-item-form">
              <Field label={t('inv.customName')}>
                <TextInput value={customName} onChange={setCustomName} />
              </Field>
              <Field label={t('sheet.identity')}>
                <select className="text-input" value={customType} onChange={(e) => setCustomType(e.target.value)}>
                  {['standard', 'weapon', 'armour', 'spell', 'condition', 'light', 'ration'].map((tp) => (
                    <option key={tp} value={tp}>{t(`type.${tp}`)}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('item.twoSlots')}>
                <input type="checkbox" checked={customSize === 2} onChange={(e) => setCustomSize(e.target.checked ? 2 : 1)} />
              </Field>
              <Field label={t('item.uses')}>
                <input
                  type="number"
                  className="text-input"
                  min={0}
                  max={9}
                  value={customUses}
                  onChange={(e) => setCustomUses(Math.max(0, Math.min(9, parseInt(e.target.value, 10) || 0)))}
                />
              </Field>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!customName.trim()}
                onClick={() => {
                  const nm = customName.trim();
                  if (customType === 'condition') {
                    add(makeCondition(null, { name: { de: nm, en: nm } }));
                    return;
                  }
                  add(
                    makeItem(null, {
                      nameText: nm,
                      name: { de: nm, en: nm },
                      type: customType,
                      size: customSize,
                      usage: customUses > 0 ? { max: customUses } : null,
                    }),
                  );
                }}
              >
                <Plus size={16} /> {t('inv.add')}
              </button>
            </div>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}
