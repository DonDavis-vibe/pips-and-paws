import { useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Backpack, Timer } from 'lucide-react';
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
import HirelingsPanel from './HirelingsPanel.jsx';
import Portrait from './Portrait.jsx';
import Panel from './Panel.jsx';
import MouseIcon from './MouseIcon.jsx';
import SortableItem from './SortableItem.jsx';
import {
  tryMove, addItem, removeItem, firstFreeFit, placeInGrit,
} from '../rules/inventory.js';
import { GRIT_SLOT_PREFIX } from '../rules/character.js';
import { rollSave, rollDie } from '../rules/dice.js';
import { shareSave, shareRoll } from '../utils/discord.js';
import { useOrder } from '../useOrder.js';

const PANEL_ORDER_KEY = 'pips-paws-panel-order';
const DEFAULT_PANEL_ORDER = [
  'identity', 'attributes', 'inventory', 'hirelings', 'battlemap', 'npcs', 'group', 'log', 'notes',
];

export default function CharacterSheet({
  character, setCharacter, notify, onEvent, stash, partyLog, partyTime, restLocked, partyNpcs, partyGroup, myPeerId, partyMap,
}) {
  const { t, lang } = useLang();
  const [activeId, setActiveId] = useState(null);
  const [externalRoll, setExternalRoll] = useState(null);

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

  // Direkter Schadenswurf ueber die Waffenkarte (Discord-Feedback).
  const onRollDamage = (item, opt) => {
    const value = rollDie(opt.sides);
    const weapon = loc(item.name, lang);
    const hands = opt.hands ? ` (${t(`item.hands.${opt.hands}`)})` : '';
    const label = `${weapon}${hands}`;
    const die = `${t('dice.dieLetter')}${opt.sides}`;
    const verdict = `${t('item.damage')} ${value}`;
    pushRoll(
      { label: `${label} ${die}`, value, max: opt.sides, die: opt.sides, tone: 'bad', verdict },
      { label: `${label} ${die}`, verdict },
    );
    notify(`${label} ${die} — ${verdict}`, 'bad');
    if (onEvent) onEvent({ kind: 'roll', label: `${label} ${die}`, value });
    shareRoll(character.name || t('app.title'), `${label} ${die}`, value);
  };

  const onSave = (attrKey) => {
    const r = rollSave(character[attrKey].current);
    const attr = t(`attr.${attrKey}`);
    const label = t('dice.saveVs', { attr });
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
          { value: r.d, label: t('dice.roll') },
          { value: `≤ ${r.target}`, label: t('dice.target') },
        ],
      },
      { label, verdict: `${r.d} · ${verdict}`, ok: r.ok, tone },
    );
    notify(`${label} — d20 ${r.d} ≤ ${r.target} · ${verdict}`, tone);
    if (onEvent) onEvent({ kind: 'save', attr: attrKey, roll: r.d, target: r.target, ok: r.ok });
    shareSave(character.name || t('app.title'), attr, r.d, r.target, r.ok);
  };

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
        <ResourceBar character={character} patch={patch} />
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
        <Panel id="inventory" icon={Backpack} title={t('inv.title')} right={<AddItemMenu onAdd={onAdd} />}>
          <InventoryGrid
            character={character}
            onItemChange={onItemChange}
            onItemRemove={onItemRemove}
            onItemStash={stash ? onItemStash : undefined}
            onRollDamage={onRollDamage}
            groupOrder={groupOrder}
          />
        </Panel>

        {stash ? (
          <SharedStash
            mode="player"
            items={stash.items}
            onTake={(id) => stash.take(id)}
            draggable
          />
        ) : null}

        <DragOverlay>{activeItem ? <ItemCard item={activeItem} overlay dragging /> : null}</DragOverlay>
      </DndContext>
    ),
    hirelings: (
      <HirelingsPanel
        hirelings={character.hirelings || []}
        onChange={(next) => patch({ hirelings: next })}
        onMoraleSave={onHirelingSave}
      />
    ),
    battlemap: <PartyBattleMap map={partyMap} />,
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
            <SortableItem key={id} id={id}>
              {PANELS[id]}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
      </div>

      <DiceRoller character={character} onEvent={onEvent} external={externalRoll} />
    </div>
  );
}
