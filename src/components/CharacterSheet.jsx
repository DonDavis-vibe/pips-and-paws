import { useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { Backpack, Timer } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { Field, TextInput } from './ui.jsx';
import AttributeBox from './AttributeBox.jsx';
import ResourceBar from './ResourceBar.jsx';
import RestControls from './RestControls.jsx';
import InventoryGrid from './InventoryGrid.jsx';
import ItemCard from './ItemCard.jsx';
import AddItemMenu from './AddItemMenu.jsx';
import DiceRoller from './DiceRoller.jsx';
import SharedStash, { STASH_DRAG_PREFIX } from './SharedStash.jsx';
import PartyLog from './PartyLog.jsx';
import PartyNpcs from './PartyNpcs.jsx';
import Portrait from './Portrait.jsx';
import Panel from './Panel.jsx';
import MouseIcon from './MouseIcon.jsx';
import { tryMove, addItem, removeItem, firstFreeFit } from '../rules/inventory.js';
import { rollSave, rollDie } from '../rules/dice.js';
import { shareSave, shareRoll } from '../utils/discord.js';

export default function CharacterSheet({ character, setCharacter, notify, onEvent, stash, partyLog, partyTime, restLocked, partyNpcs }) {
  const { t, lang } = useLang();
  const [activeId, setActiveId] = useState(null);
  const [externalRoll, setExternalRoll] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
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
      { label: `${label} ${die}`, value, max: opt.sides, tone: 'bad', verdict },
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
    const tone = r.nat1 ? 'crit-good' : r.nat20 ? 'crit-bad' : r.ok ? 'ok' : 'bad';
    const verdict = (r.nat1 && t('dice.nat1')) || (r.nat20 && t('dice.nat20'))
      || (r.ok ? t('dice.success') : t('dice.fail'));
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
      { label, verdict: `${r.d} · ${r.ok ? t('dice.success') : t('dice.fail')}`, ok: r.ok, tone },
    );
    notify(
      `${label} — d20 ${r.d} ≤ ${r.target} · ${r.ok ? t('dice.success') : t('dice.fail')}`,
      r.ok ? 'ok' : 'bad',
    );
    if (onEvent) onEvent({ kind: 'save', attr: attrKey, roll: r.d, target: r.target, ok: r.ok });
    shareSave(character.name || t('app.title'), attr, r.d, r.target, r.ok);
  };

  // Beim Ziehen aus der Mitte liegt der Gegenstand noch nicht im eigenen Inventar.
  const activeItem = activeId
    ? (String(activeId).startsWith(STASH_DRAG_PREFIX)
      ? stash?.items.find((i) => i.itemId === String(activeId).slice(STASH_DRAG_PREFIX.length))
      : character.items[activeId])
    : null;

  return (
    <div className="sheet">
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

      {/* Ein gemeinsamer DndContext ueber Raster UND Tischmitte, damit Karten
          aus der Mitte direkt auf einen Inventarplatz gezogen werden koennen. */}
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

      <PartyNpcs npcs={partyNpcs} />

      <DiceRoller character={character} onEvent={onEvent} external={externalRoll} />

      {partyLog ? <PartyLog entries={partyLog.entries} shared={partyLog.shared} /> : null}

      <Panel id="notes" title={t('sheet.notes')}>
        <textarea
          className="notes"
          rows={4}
          placeholder={t('sheet.notesPlaceholder')}
          value={character.notes}
          onChange={(e) => patch({ notes: e.target.value })}
        />
      </Panel>
    </div>
  );
}
