import { useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  Backpack, Timer, User, Gauge, Users, Landmark, Map as MapIcon, FileText, Contact, UsersRound, ScrollText, NotebookPen, Dices,
} from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { Field, TextInput } from './ui.jsx';
import AttributeBox from './AttributeBox.jsx';
import ResourceBar from './ResourceBar.jsx';
import RestControls from './RestControls.jsx';
import InventoryGrid, { GROUP_ORDER_KEY, DEFAULT_GROUP_ORDER } from './InventoryGrid.jsx';
import ItemCard from './ItemCard.jsx';
import AddItemMenu from './AddItemMenu.jsx';
import DiceRoller from './DiceRoller.jsx';
import SharedStash, { STASH_DRAG_PREFIX } from './SharedStash.jsx';
import PartyLog from './PartyLog.jsx';
import PartyNpcs from './PartyNpcs.jsx';
import PartyGroup from './PartyGroup.jsx';
import PartyBattleMap from './battlemap/PartyBattleMap.jsx';
import PartyHandouts, { HandoutPopup } from './PartyHandouts.jsx';
import HirelingsPanel from './HirelingsPanel.jsx';
import Portrait from './Portrait.jsx';
import { itemLabel, CONDITION_CATALOG } from '../data/items.js';
import Panel from './Panel.jsx';
import MouseIcon from './MouseIcon.jsx';
import SortableItem from './SortableItem.jsx';
import SectionNav from './SectionNav.jsx';
import BankPanel from './BankPanel.jsx';
import {
  tryMove, addItem, removeItem, firstFreeFit, placeInGrit,
} from '../rules/inventory.js';
import { GRIT_SLOT_PREFIX, PAW_SLOTS } from '../rules/character.js';
import { rollSave, rollDie } from '../rules/dice.js';
import { shareSave, shareRoll } from '../utils/discord.js';
import { useOrder } from '../useOrder.js';
import { castSpell, spellEffectText } from '../rules/magic.js';
import { stashHasRoom, stashUsed } from '../rules/stash.js';
import { repairItem } from '../rules/economy.js';
import AfterFight from './AfterFight.jsx';
import { effectiveSaveMode } from '../rules/status.js';
import { dN, combine, saveSpec } from '../utils/dice3d.js';
import { rollLevelUp } from '../rules/levelup.js';

// Sprungleiste: Symbol + Kurzname je Panel (Label-Schluessel nav.*).
const NAV_ICONS = {
  identity: User, attributes: Gauge, inventory: Backpack, bank: Landmark, hirelings: Users, battlemap: MapIcon,
  handouts: FileText, npcs: Contact, group: UsersRound, log: ScrollText, notes: NotebookPen,
};

const PANEL_ORDER_KEY = 'pips-paws-panel-order';
const DEFAULT_PANEL_ORDER = [
  'identity', 'attributes', 'inventory', 'bank', 'hirelings', 'battlemap', 'handouts', 'npcs', 'group', 'log', 'notes',
];

export default function CharacterSheet({
  character, setCharacter, notify, onEvent, stash, partyLog, partyTime, restLocked, partyNpcs, partyGroup, myPeerId, partyMap, handouts, newHandoutId, onHandoutSeen, onHandoutRemove,
}) {
  const { t, lang } = useLang();
  const [activeId, setActiveId] = useState(null);
  const [externalRoll, setExternalRoll] = useState(null);
  const [handoutViewId, setHandoutViewId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  // Eigene Sensoren + eigener DndContext fuers Panel-Umordnen (siehe unten,
  // umschliesst den Inventar-DndContext von aussen): getrennt von den
  // Item-Drag-Sensoren, damit ein Item-Ziehen niemals versehentlich als
  // Panel-Ziehen interpretiert wird (und umgekehrt).
  const panelSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  // Reihenfolge der Pfoten/Koerper/Rucksack-Gruppen im Inventar. Teilt sich
  // bewusst den Inventar-DndContext (siehe onDragEnd) statt einen eigenen zu
  // bekommen — ein zweiter, dort verschachtelter DndContext wuerde dessen
  // Drag-Ziele kapern (siehe Kommentar in InventoryGrid.jsx).
  const { order: groupOrder, reorder: reorderGroups } = useOrder(
    GROUP_ORDER_KEY, DEFAULT_GROUP_ORDER, DEFAULT_GROUP_ORDER,
  );

  const patch = (partial) => setCharacter((c) => ({ ...c, ...partial }));

  const onItemChange = (next) =>
    setCharacter((c) => ({ ...c, items: { ...c.items, [next.itemId]: next } }));

  const onItemRemove = (itemId) => setCharacter((c) => removeItem(c, itemId));

  // Spieler legt einen Gegenstand in die Tischmitte (optimistisch entfernen, dann melden).
  const onItemStash = (item) => {
    // Lager mit Platzgrenze (Karren, Truhe): voll -> gar nicht erst ablegen.
    if (!stashHasRoom(stash.cfg?.used ?? stashUsed(stash.items), item, stash.cfg?.capacity)) {
      notify(t('stash.full', { name: stash.cfg?.name || t('stash.title') }), 'warn');
      return;
    }
    setCharacter((c) => removeItem(c, item.itemId));
    stash.drop(item);
  };

  const onAdd = (item) => {
    setCharacter((c) => {
      const res = addItem(c, item);
      if (!res.ok) {
        notify(t(`inv.${res.reason}`), 'warn');
        return c;
      }
      return res.character;
    });
  };

  const onDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;

    // Inventar-Gruppe (Pfoten/Koerper/Rucksack) umsortiert, kein Gegenstand.
    if (DEFAULT_GROUP_ORDER.includes(active.id)) {
      reorderGroups(active.id, over.id);
      return;
    }

    // Karte kommt aus der Tischmitte -> beim SL anfragen, Wunschplatz merken.
    if (String(active.id).startsWith(STASH_DRAG_PREFIX)) {
      const itemId = String(active.id).slice(STASH_DRAG_PREFIX.length);
      const item = stash?.items.find((i) => i.itemId === itemId);
      if (!item) return;
      if (!firstFreeFit(character.inventory, item.size === 2 ? 2 : 1)) {
        notify(t('inv.noRoom'), 'warn');
        return;
      }
      stash.take(itemId, over.id);
      return;
    }

    // Ablage im Mumm-Feld (SRD "Grit space") statt eines normalen Inventar-Platzes.
    if (String(over.id).startsWith(GRIT_SLOT_PREFIX)) {
      setCharacter((c) => {
        const res = placeInGrit(c, active.id);
        if (!res.ok) {
          notify(t(`inv.${res.reason}`), 'warn');
          return c;
        }
        return res.character;
      });
      return;
    }

    setCharacter((c) => {
      const res = tryMove(c.inventory, c.items, active.id, over.id);
      if (!res.ok) {
        notify(t(`inv.${res.reason}`), 'warn');
        return c;
      }
      return { ...c, inventory: res.inventory };
    });
  };

  // Wuerfe, die nicht im Wuerfel-Panel selbst ausgeloest werden, wandern ueber
  // diesen Kanal trotzdem dorthin — sonst waeren sie nur ein kurzer Toast.
  const pushRoll = (stage, logEntry) =>
    setExternalRoll({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, stage, logEntry });

  // Direkter Schadenswurf ueber die Waffenkarte. Regeln S. 9/10:
  //  - opt.mode 'enhanced' -> W12, 'impaired' -> W4 (unabhaengig von der Waffe)
  //  - zwei leichte Waffen in den Pfoten: beide Wuerfel, das bessere Ergebnis
  const onRollDamage = (item, opt) => {
    const weapon = itemLabel(item, loc(item.name, lang));
    const otherLight = !opt.mode && item.key === 'w_light'
      ? PAW_SLOTS.map((s) => character.inventory[s]).find((v) => v && !v.cont && v.itemId !== item.itemId
        && character.items[v.itemId]?.key === 'w_light')
      : null;
    const rolls = otherLight ? [rollDie(opt.sides), rollDie(opt.sides)] : [rollDie(opt.sides)];
    const value = Math.max(...rolls);
    const hands = opt.hands ? ` (${t(`item.hands.${opt.hands}`)})` : '';
    const tag = opt.mode ? ` · ${t(`item.${opt.mode}`)}` : otherLight ? ` · ${t('item.dualWield')}` : '';
    const label = `${weapon}${hands}${tag}`;
    const die = `${t('dice.dieLetter')}${opt.sides}`;
    const verdict = `${t('item.damage')} ${value}`;
    pushRoll(
      {
        label: `${label} ${die}`,
        value,
        max: opt.sides,
        die: rolls.length === 1 ? opt.sides : undefined,
        tone: 'bad',
        verdict,
        parts: rolls.length > 1 ? rolls.map((r) => ({ value: r, label: die })) : undefined,
        // zwei leichte Waffen: beide Wuerfel liegen, der hoehere zaehlt
        dice3d: rolls.length > 1 ? { notation: `2w${opt.sides}kh1`, values: rolls } : dN(opt.sides, rolls[0]),
      },
      { label: `${label} ${die}`, verdict },
    );
    notify(`${label} ${die} — ${verdict}`, 'bad');
    if (onEvent) onEvent({ kind: 'roll', label: `${label} ${die}`, value, dice3d: rolls.length > 1 ? { notation: `2w${opt.sides}kh1`, values: rolls } : dN(opt.sides, rolls[0]) });
    shareRoll(character.name || t('app.title'), `${label} ${die}`, value);
  };

  // Reparieren (Regel S. 8): ein Nutzungspunkt fuer 10 % des Preises.
  const onRepair = (item) => {
    const res = repairItem(character, item.itemId);
    const name = itemLabel(item, loc(item.name, lang));
    if (!res.ok) {
      notify(res.reason === 'tooPoor' ? t('repair.tooPoor', { n: res.cost }) : t('repair.no'), 'warn');
      return;
    }
    setCharacter(res.character);
    notify(t('repair.done', { name, n: res.cost }), 'ok');
  };

  // Kaufen aus dem Katalog: Preis von den Pips abziehen, dann einlegen.
  const onBuy = (item, price) => {
    if ((character.pips || 0) < price) { notify(t('buy.tooPoor', { n: price }), 'warn'); return; }
    setCharacter((c) => {
      const res = addItem({ ...c, pips: c.pips - price }, item);
      return res.ok ? res.character : { ...c, pips: c.pips - price, items: { ...c.items, [item.itemId]: item } };
    });
    notify(t('buy.done', { name: loc(item.name, lang), n: price }), 'ok');
  };

  // Zauber wirken (rules/magic.js). Gewuerfelt wird hier, nicht im Updater.
  const onCast = (item, power) => {
    const res = castSpell(character, item.itemId, power);
    setCharacter(res.character);
    const name = itemLabel(item, loc(item.name, lang));
    const effect = spellEffectText(loc(item.effect, lang), res.power, res.sum);
    const label = t('spell.castLabel', { name, n: res.power });
    const verdict = `${t('spell.sumDice', { sum: res.sum, dice: res.power })}${res.marks ? ` · ${t('spell.marked', { n: res.marks })}` : ''}`;
    pushRoll(
      {
        label,
        value: res.sum,
        max: res.power * 6,
        tone: res.sixes ? 'bad' : 'ok',
        verdict,
        parts: res.dice.map((d) => ({ value: d, label: d >= 4 ? t('spell.markShort') : t('dice.roll') })),
        // Zauberwuerfel, bei einem Patzer dazu die W6 fuer den WIL-Schaden
        dice3d: dN(6, ...res.dice, ...(res.wilDice || [])),
      },
      { label, verdict: `${verdict} — ${effect}` },
    );
    notify(`${label}: ${effect}`, 'ok');
    if (res.depleted) notify(t('spell.nowDepleted', { name }), 'warn');
    if (res.sixes) {
      notify(t('spell.miscast', { n: res.sixes, dmg: res.wilDamage }), 'bad');
      if (res.saveRoll) {
        const r = res.saveRoll;
        notify(`${t('dice.saveVs', { attr: t('attr.wil') })} — d20 ${r.d} ≤ ${r.target} · ${r.ok ? t('dice.success') : t('dice.fail')}`, r.ok ? 'ok' : 'bad');
      }
      if (res.drained) notify(t('player.gm.condition', { name: loc(CONDITION_CATALOG.drained.name, lang) }), 'bad');
      if (res.drainedOverflow) notify(t('player.gm.conditionOverflow', { name: loc(CONDITION_CATALOG.drained.name, lang) }), 'warn');
      if (res.zero.insensible) notify(t('zero.insensible'), 'bad');
    }
    if (onEvent) onEvent({ kind: 'roll', label: `${label} (${res.dice.join(', ')})`, value: res.sum });
    shareRoll(character.name || t('app.title'), `${label} (${res.dice.join(', ')})`, res.sum, res.sixes ? `⚠ ${t('spell.miscastShort')}` : '');
  };

  const onSave = (attrKey) => {
    const mode = effectiveSaveMode(character, attrKey);
    const r = rollSave(character[attrKey].current, mode);
    const attr = t(`attr.${attrKey}`);
    const label = `${t('dice.saveVs', { attr })}${mode === 'normal' ? '' : ` (${t(`dice.mode.${mode}`)})`}`;
    const tone = r.ok ? 'ok' : 'bad';
    const verdict = r.ok ? t('dice.success') : t('dice.fail');
    pushRoll(
      {
        label,
        value: r.d,
        max: 20,
        tone,
        verdict,
        parts: [
          ...r.dice.map((d) => ({ value: d, label: t('dice.roll') })),
          { value: `≤ ${r.target}`, label: t('dice.target') },
        ],
        dice3d: saveSpec(r),
      },
      { label, verdict: `${r.d} · ${verdict}`, ok: r.ok, tone },
    );
    notify(`${label} — d20 ${r.d} ≤ ${r.target} · ${verdict}`, tone);
    if (onEvent) onEvent({ kind: 'save', attr: attrKey, roll: r.d, target: r.target, ok: r.ok, mode, dice3d: saveSpec(r) });
    shareSave(character.name || t('app.title'), attr, r.d, r.target, r.ok);
  };

  // Stufenaufstieg (SRD): fuer die naechste offene Stufe d20 je Attribut und die
  // Trefferwuerfel der Stufe. Gewuerfelt wird HIER, nicht im setCharacter-Updater
  // (StrictMode ruft Updater doppelt auf).
  const onLevelUp = () => {
    const { patch: lv, report } = rollLevelUp(character);
    setCharacter((c) => ({ ...c, ...lv }));
    const attrText = report.attrs
      .map((a) => `${t(`attr.abbr.${a.key}`)} ${a.up ? `${a.before}→${a.after}` : a.before}`)
      .join(' · ');
    const hpText = `${t('res.hpShort')} ${report.hd.before}→${report.hd.after}`;
    const verdict = `${attrText} · ${hpText}`;
    const label = t('levelup.stage', { level: report.level });
    pushRoll(
      {
        label,
        value: report.hd.total,
        max: report.hd.count * 6,
        verdict,
        parts: [
          ...report.attrs.map((a) => ({ value: a.roll, label: `${t(`attr.abbr.${a.key}`)}${a.up ? ' ↑' : ''}` })),
          ...report.hd.dice.map((d) => ({ value: d, label: t('levelup.hd') })),
        ],
        // drei W20 fuer die Attribute, dazu die Trefferwuerfel
        dice3d: combine(dN(20, ...report.attrs.map((a) => a.roll)), dN(6, ...report.hd.dice)),
      },
      { label, verdict },
    );
    notify(`${label}: ${verdict}`, 'ok');
    if (onEvent) onEvent({ kind: 'roll', label, value: report.hd.total });
  };
  const onLevelSkip = () => setCharacter((c) => ({ ...c, levelDone: c.level }));

  // Miethelfer-Moral (SRD): WIL-Rettungswurf, bei Misserfolg flieht er/sie.
  // Bewusst nur lokal (Wuerfel-Panel + Toast) — kein onEvent/Discord, Mietlinge
  // sind Sache der Spielerin, nicht Teil des Party-weiten Ereignis-Feeds.
  const onHirelingSave = (h) => {
    const r = rollSave(h.wil.current);
    const label = t('hirelings.moraleFor', { name: h.name || t('hirelings.namePlaceholder') });
    const tone = r.ok ? 'ok' : 'bad';
    const verdict = r.ok ? t('hirelings.moraleOk') : t('hirelings.moraleFlee');
    pushRoll(
      {
        label,
        value: r.d,
        max: 20,
        tone,
        verdict,
        parts: [
          { value: r.d, label: t('dice.roll') },
          { value: `≤ ${r.target}`, label: t('dice.target') },
        ],
        dice3d: dN(20, r.d),
      },
      { label, verdict: `${r.d} · ${verdict}`, ok: r.ok, tone },
    );
    notify(`${label} — d20 ${r.d} ≤ ${r.target} · ${verdict}`, r.ok ? 'ok' : 'bad');
  };

  // Beim Ziehen aus der Mitte liegt der Gegenstand noch nicht im eigenen Inventar.
  const activeItem = activeId
    ? (String(activeId).startsWith(STASH_DRAG_PREFIX)
      ? stash?.items.find((i) => i.itemId === String(activeId).slice(STASH_DRAG_PREFIX.length))
      : character.items[activeId])
    : null;

  // Welche Panels es diese Session ueberhaupt gibt — die meisten haengen von
  // Multiplayer-Zustand ab, den nur die Elternkomponente (App.jsx) kennt.
  // Muss hier dupliziert werden, weil ein SortableItem sonst einen leeren
  // Ziehgriff ueber "nichts" anzeigen wuerde (die Kind-Komponenten selbst
  // entscheiden erst beim Rendern, ob sie null zurueckgeben).
  const visiblePanelIds = DEFAULT_PANEL_ORDER.filter((id) => {
    if (id === 'battlemap') return !!partyMap;
    if (id === 'handouts') return !!(handouts && handouts.length);
    if (id === 'npcs') return !!(partyNpcs && partyNpcs.length);
    if (id === 'group') return !!(partyGroup && partyGroup.some((m) => m.peerId !== myPeerId));
    if (id === 'log') return !!(partyLog && partyLog.shared);
    return true;
  });
  const { order: panelOrder, reorder: reorderPanels } = useOrder(
    PANEL_ORDER_KEY, DEFAULT_PANEL_ORDER, visiblePanelIds,
  );
  const onPanelDragEnd = ({ active, over }) => {
    if (over) reorderPanels(active.id, over.id);
  };

  const PANELS = {
    identity: (
      <Panel id="identity" icon={MouseIcon} title={t('sheet.identity')}>
        <div className="identity-layout">
          <Portrait
            src={character.portrait}
            onChange={(p) => patch({ portrait: p })}
            notify={notify}
          />
          <div className="identity-grid">
            <Field label={t('sheet.name')} className="field-hero">
              <TextInput value={character.name} onChange={(v) => patch({ name: v })} placeholder="…" />
            </Field>
            <Field label={t('sheet.player')}>
              <TextInput value={character.playerName} onChange={(v) => patch({ playerName: v })} />
            </Field>
            <Field label={t('sheet.background')}>
              <TextInput value={character.background} onChange={(v) => patch({ background: v })} />
            </Field>
            <Field label={t('sheet.birthsign')}>
              <TextInput value={character.birthsign} onChange={(v) => patch({ birthsign: v })} />
            </Field>
            <Field label={t('sheet.disposition')}>
              <TextInput value={character.disposition} onChange={(v) => patch({ disposition: v })} />
            </Field>
            <Field label={t('sheet.coat')}>
              <TextInput value={character.coat} onChange={(v) => patch({ coat: v })} />
            </Field>
            <Field label={t('sheet.detail')}>
              <TextInput value={character.detail} onChange={(v) => patch({ detail: v })} />
            </Field>
          </div>
        </div>
      </Panel>
    ),
    attributes: (
      <section className="panel">
        <div className="attr-grid">
          <AttributeBox attrKey="str" labelKey="attr.str" value={character.str}
            onChange={(v) => patch({ str: v })} onSave={onSave} />
          <AttributeBox attrKey="dex" labelKey="attr.dex" value={character.dex}
            onChange={(v) => patch({ dex: v })} onSave={onSave} />
          <AttributeBox attrKey="wil" labelKey="attr.wil" value={character.wil}
            onChange={(v) => patch({ wil: v })} onSave={onSave} />
        </div>
        <ResourceBar character={character} patch={patch} onLevelUp={onLevelUp} onLevelSkip={onLevelSkip} notify={notify} />
        <RestControls character={character} setCharacter={setCharacter} notify={notify} locked={restLocked} />
      </section>
    ),
    inventory: (
      // Eigener, innerer DndContext fuers Ziehen von Gegenstaenden (Slot zu
      // Slot, Tischmitte zu Slot) — bewusst getrennt vom aeusseren
      // Panel-Umordnen-Context, siehe panelSensors weiter oben.
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={onDragEnd}
      >
        <Panel
          id="inventory"
          icon={Backpack}
          title={t('inv.title')}
          right={(
            <div className="stash-head-actions">
              <AfterFight character={character} setCharacter={setCharacter} notify={notify} pushRoll={pushRoll} />
              <AddItemMenu onAdd={onAdd} onBuy={onBuy} pips={character.pips} />
            </div>
          )}
        >
          <InventoryGrid
            character={character}
            onItemChange={onItemChange}
            onItemRemove={onItemRemove}
            onItemStash={stash ? onItemStash : undefined}
            onRollDamage={onRollDamage}
            onCast={onCast}
            onRepair={onRepair}
            groupOrder={groupOrder}
          />
        </Panel>

        {stash ? (
          <SharedStash
            mode="player"
            items={stash.items}
            cfg={stash.cfg}
            onTake={(id) => stash.take(id)}
            draggable
          />
        ) : null}

        <DragOverlay>{activeItem ? <ItemCard item={activeItem} overlay dragging /> : null}</DragOverlay>
      </DndContext>
    ),
    bank: <BankPanel character={character} setCharacter={setCharacter} notify={notify} />,
    hirelings: (
      <HirelingsPanel
        hirelings={character.hirelings || []}
        onChange={(next) => patch({ hirelings: next })}
        onMoraleSave={onHirelingSave}
        character={character}
        setCharacter={setCharacter}
        notify={notify}
      />
    ),
    battlemap: <PartyBattleMap map={partyMap} />,
    handouts: (
      <PartyHandouts
        handouts={handouts}
        onOpen={setHandoutViewId}
        onRemove={(id) => onHandoutRemove?.(id)}
      />
    ),
    npcs: <PartyNpcs npcs={partyNpcs} />,
    group: <PartyGroup members={partyGroup} myPeerId={myPeerId} />,
    log: partyLog ? <PartyLog entries={partyLog.entries} shared={partyLog.shared} /> : null,
    notes: (
      <Panel id="notes" title={t('sheet.notes')}>
        <textarea
          className="notes"
          rows={4}
          placeholder={t('sheet.notesPlaceholder')}
          value={character.notes}
          onChange={(e) => patch({ notes: e.target.value })}
        />
      </Panel>
    ),
  };

  return (
    <div className="sheet">
      {/* Alles ausser dem Wuerfel-Panel steckt in EINEM Wrapper, damit die
          Wuerfel-Spalte (siehe .dice-panel in theme.css) in exakt eine
          Grid-Zeile faellt statt mehrere zu ueberspannen — WebKit/Safari
          rechnet sonst die volle Hoehe eines ueber mehrere Zeilen
          gespannten Elements komplett der ERSTEN Zeile zu, was zwischen
          Steckbrief und Attributen eine Luecke aufreisst, die mit jedem
          Wuerfelwurf im Protokoll waechst. */}
      <div className="sheet-main">
      {partyTime ? (
        <div className="party-time" title={t('time.playerTitle')}>
          <Timer size={15} />
          <span>
            {t('time.day')} {partyTime.day} · {t('time.watch')} {partyTime.watch}
          </span>
          <strong>
            {t('time.turn')} {partyTime.turn}
          </strong>
          <span className="party-time-dim">
            ({partyTime.inWatch}/{partyTime.turnsPerWatch})
          </span>
        </div>
      ) : null}

      {/* Aeusserer DndContext nur fuers Panel-Umordnen — der Inventar-
          DndContext (Item-Drag) lebt unveraendert innerhalb von PANELS.inventory,
          eine Ebene tiefer. Siehe Kommentar bei panelSensors weiter oben. */}
      <DndContext sensors={panelSensors} onDragEnd={onPanelDragEnd}>
        <SortableContext items={panelOrder} strategy={verticalListSortingStrategy}>
          {panelOrder.map((id) => (
            <SortableItem key={id} id={id} anchor>
              {PANELS[id]}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
      </div>

      <DiceRoller character={character} onEvent={onEvent} external={externalRoll} />
      <SectionNav
        items={[
          ...panelOrder.map((id) => ({ id, icon: NAV_ICONS[id], label: t(`nav.${id}`) })),
          { id: 'dice', icon: Dices, label: t('nav.dice') },
        ]}
      />
      <HandoutPopup
        handout={(handouts || []).find((h) => h.id === (newHandoutId || handoutViewId))}
        onClose={() => { setHandoutViewId(null); onHandoutSeen?.(); }}
      />
    </div>
  );
}
