import { useMemo, useState } from 'react';
import { Dices, ArrowLeftRight } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { Modal, Field, TextInput } from './ui.jsx';
import { rollDie, rollAttribute } from '../rules/dice.js';
import { blankCharacter, gritForLevel } from '../rules/character.js';
import { addItem } from '../rules/inventory.js';
import { makeItem } from '../data/items.js';
import { backgroundAt } from '../data/backgrounds.js';
import { BIRTHSIGNS, COAT_COLORS, COAT_PATTERNS, DETAILS, NAMES, pick, rollDetailIndex } from '../data/tables.js';

const STEPS = 5;
const WEAPON_KEYS = ['w_light', 'w_medium', 'w_heavy', 'w_light_ranged', 'w_heavy_ranged', 'w_improvised'];

function freshAttrs() {
  return { str: rollAttribute(), dex: rollAttribute(), wil: rollAttribute() };
}

export default function CharacterWizard({ onDone, onCancel }) {
  const { t, lang } = useLang();
  const [step, setStep] = useState(1);

  const [attrs, setAttrs] = useState(freshAttrs);
  const [swapA, setSwapA] = useState('str');
  const [swapB, setSwapB] = useState('dex');

  const [hpRoll, setHpRoll] = useState(() => rollDie(6));
  const [pipRoll, setPipRoll] = useState(() => rollDie(6));

  const [extraRolls, setExtraRolls] = useState(() => [rollDie(6), rollDie(6)]);
  const [extraChoice, setExtraChoice] = useState(0); // 0 = Item A, 1 = Item B (nur wenn "choose one")

  const [weaponKey, setWeaponKey] = useState('w_medium');

  const [birthIdx, setBirthIdx] = useState(() => Math.floor(Math.random() * 6));
  const [colorIdx, setColorIdx] = useState(() => Math.floor(Math.random() * 6));
  const [patternIdx, setPatternIdx] = useState(() => Math.floor(Math.random() * 6));
  const [detailIdx, setDetailIdx] = useState(rollDetailIndex);
  const [name, setName] = useState(() => pick(NAMES));

  const values = { str: attrs.str.value, dex: attrs.dex.value, wil: attrs.wil.value };
  const highest = Math.max(values.str, values.dex, values.wil);
  const extraMode = highest <= 7 ? 'both' : highest <= 9 ? 'one' : 'none';

  const bg = useMemo(() => backgroundAt(hpRoll, pipRoll), [hpRoll, pipRoll]);
  const extraBg = useMemo(() => backgroundAt(extraRolls[0], extraRolls[1]), [extraRolls]);

  const doSwap = () => {
    if (swapA === swapB) return;
    setAttrs((a) => ({ ...a, [swapA]: a[swapB], [swapB]: a[swapA] }));
  };

  const resolveEntries = (entries) =>
    entries.map((e) => (e.k ? { item: makeItem(e.k) } : { text: loc(e.t, lang) }));

  const finish = () => {
    let c = blankCharacter();
    c.name = name.trim();
    c.str = { max: values.str, current: values.str };
    c.dex = { max: values.dex, current: values.dex };
    c.wil = { max: values.wil, current: values.wil };
    c.hp = { max: hpRoll, current: hpRoll };
    c.pips = pipRoll;
    c.level = 1;
    c.grit = gritForLevel(1);
    c.background = loc(bg.name, lang);
    c.birthsign = loc(BIRTHSIGNS[birthIdx].sign, lang);
    c.disposition = loc(BIRTHSIGNS[birthIdx].disposition, lang);
    c.coat = `${loc(COAT_COLORS[colorIdx], lang)}, ${loc(COAT_PATTERNS[patternIdx], lang)}`;
    c.detail = loc(DETAILS[detailIdx], lang);

    const grant = [
      { item: makeItem('torches') },
      { item: makeItem('rations') },
      ...resolveEntries(bg.items),
      { item: makeItem(weaponKey) },
    ];

    if (extraMode === 'both') {
      grant.push(...resolveEntries(extraBg.items));
    } else if (extraMode === 'one') {
      grant.push(resolveEntries([extraBg.items[extraChoice]])[0]);
    }

    const freeTexts = [];
    for (const g of grant) {
      if (g.item) {
        const res = addItem(c, g.item);
        if (res.ok) c = res.character;
        else freeTexts.push(loc(g.item.name, lang));
      } else if (g.text) {
        freeTexts.push(g.text);
      }
    }
    if (freeTexts.length) {
      c.notes = `${t('wizard.startingGear')}: ${freeTexts.join(', ')}`;
    }

    onDone(c);
  };

  const footer = (
    <div className="wizard-nav">
      <button type="button" className="btn btn-ghost" onClick={onCancel}>
        {t('wizard.cancel')}
      </button>
      <div className="wizard-nav-right">
        {step > 1 ? (
          <button type="button" className="btn" onClick={() => setStep((s) => s - 1)}>
            {t('wizard.back')}
          </button>
        ) : null}
        {step < STEPS ? (
          <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
            {t('wizard.next')}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={name.trim().length < 1} onClick={finish}>
            {t('wizard.finish')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Modal title={t('wizard.title')} onClose={onCancel} footer={footer} wide>
      <p className="wizard-step">{t('wizard.step', { n: step, total: STEPS })}</p>

      {step === 1 ? (
        <div className="wizard-pane">
          <h3 className="sub-h">{t('wizard.attributes')}</h3>
          <p className="hint">{t('wizard.attributesHint')}</p>
          <div className="roll-row">
            {['str', 'dex', 'wil'].map((k) => (
              <div key={k} className="roll-box">
                <span>{k.toUpperCase()}</span>
                <strong>{attrs[k].value}</strong>
                <span className="roll-dice">{attrs[k].dice.join(' ')}</span>
              </div>
            ))}
          </div>
          <button type="button" className="btn" onClick={() => setAttrs(freshAttrs())}>
            <Dices size={16} /> {t('wizard.rerollAll')}
          </button>
          <div className="swap-row">
            <span className="hint">{t('wizard.swap')}</span>
            <select className="text-input" value={swapA} onChange={(e) => setSwapA(e.target.value)}>
              {['str', 'dex', 'wil'].map((k) => (
                <option key={k} value={k}>{k.toUpperCase()}</option>
              ))}
            </select>
            <select className="text-input" value={swapB} onChange={(e) => setSwapB(e.target.value)}>
              {['str', 'dex', 'wil'].map((k) => (
                <option key={k} value={k}>{k.toUpperCase()}</option>
              ))}
            </select>
            <button type="button" className="icon-btn" onClick={doSwap} aria-label={t('wizard.swap')}>
              <ArrowLeftRight size={16} />
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="wizard-pane">
          <h3 className="sub-h">{t('wizard.hpPips')}</h3>
          <p className="hint">{t('wizard.hpPipsHint')}</p>
          <div className="roll-row">
            <div className="roll-box">
              <span>{t('res.hpShort')}</span>
              <strong>{hpRoll}</strong>
            </div>
            <div className="roll-box">
              <span>{t('wizard.pips')}</span>
              <strong>{pipRoll}</strong>
            </div>
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setHpRoll(rollDie(6));
              setPipRoll(rollDie(6));
            }}
          >
            <Dices size={16} /> {t('wizard.roll')}
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="wizard-pane">
          <h3 className="sub-h">{t('wizard.background')}</h3>
          <p className="hint">{t('wizard.backgroundHint')}</p>
          <div className="grants">
            <span className="grants-label">
              {loc(bg.name, lang)} — {t('wizard.backgroundRolled', { hp: hpRoll, pips: pipRoll })}
            </span>
            <ul>
              {bg.items.map((e, i) => (
                <li key={i}>{e.k ? loc(makeItem(e.k).name, lang) : loc(e.t, lang)}</li>
              ))}
            </ul>
          </div>

          {extraMode !== 'none' ? (
            <div className="grants">
              <span className="grants-label">{t('wizard.extraItems')}</span>
              <p className="hint">
                {extraMode === 'both' ? t('wizard.extraBoth') : t('wizard.extraOne')}
              </p>
              {extraMode === 'one' ? (
                <div className="extra-choice">
                  {extraBg.items.map((e, i) => (
                    <label key={i} className="radio-line">
                      <input
                        type="radio"
                        name="extra"
                        checked={extraChoice === i}
                        onChange={() => setExtraChoice(i)}
                      />
                      {e.k ? loc(makeItem(e.k).name, lang) : loc(e.t, lang)}
                    </label>
                  ))}
                </div>
              ) : (
                <ul>
                  {extraBg.items.map((e, i) => (
                    <li key={i}>{e.k ? loc(makeItem(e.k).name, lang) : loc(e.t, lang)}</li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setExtraRolls([rollDie(6), rollDie(6)])}
              >
                <Dices size={15} /> {t('wizard.roll')}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="wizard-pane">
          <h3 className="sub-h">{t('wizard.weapon')}</h3>
          <p className="hint">{t('wizard.weaponHint')}</p>
          <div className="weapon-list">
            {WEAPON_KEYS.map((k) => {
              const it = makeItem(k);
              return (
                <label key={k} className="radio-line">
                  <input type="radio" name="weapon" checked={weaponKey === k} onChange={() => setWeaponKey(k)} />
                  <span>
                    <strong>{loc(it.name, lang)}</strong> — {it.damage}
                    {it.size === 2 ? ` · ${t('item.twoSlots')}` : ''}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="wizard-pane">
          <h3 className="sub-h">{t('wizard.identity')}</h3>
          <p className="hint">{t('wizard.identityHint')}</p>

          <Field label={t('sheet.name')}>
            <div className="inline-roll">
              <TextInput value={name} onChange={setName} />
              <button type="button" className="icon-btn" onClick={() => setName(pick(NAMES))} aria-label={t('wizard.roll')}>
                <Dices size={16} />
              </button>
            </div>
          </Field>

          <Field label={t('sheet.birthsign')}>
            <div className="inline-roll">
              <select className="text-input" value={birthIdx} onChange={(e) => setBirthIdx(+e.target.value)}>
                {BIRTHSIGNS.map((b, i) => (
                  <option key={i} value={i}>
                    {loc(b.sign, lang)} — {loc(b.disposition, lang)}
                  </option>
                ))}
              </select>
              <button type="button" className="icon-btn" onClick={() => setBirthIdx(Math.floor(Math.random() * 6))} aria-label={t('wizard.roll')}>
                <Dices size={16} />
              </button>
            </div>
          </Field>

          <Field label={t('sheet.coat')}>
            <div className="inline-roll">
              <select className="text-input" value={colorIdx} onChange={(e) => setColorIdx(+e.target.value)}>
                {COAT_COLORS.map((c, i) => (
                  <option key={i} value={i}>{loc(c, lang)}</option>
                ))}
              </select>
              <select className="text-input" value={patternIdx} onChange={(e) => setPatternIdx(+e.target.value)}>
                {COAT_PATTERNS.map((c, i) => (
                  <option key={i} value={i}>{loc(c, lang)}</option>
                ))}
              </select>
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  setColorIdx(Math.floor(Math.random() * 6));
                  setPatternIdx(Math.floor(Math.random() * 6));
                }}
                aria-label={t('wizard.roll')}
              >
                <Dices size={16} />
              </button>
            </div>
          </Field>

          <Field label={t('sheet.detail')}>
            <div className="inline-roll">
              <select className="text-input" value={detailIdx} onChange={(e) => setDetailIdx(+e.target.value)}>
                {DETAILS.map((d, i) => (
                  <option key={i} value={i}>{loc(d, lang)}</option>
                ))}
              </select>
              <button type="button" className="icon-btn" onClick={() => setDetailIdx(rollDetailIndex())} aria-label={t('wizard.roll')}>
                <Dices size={16} />
              </button>
            </div>
          </Field>
        </div>
      ) : null}
    </Modal>
  );
}
