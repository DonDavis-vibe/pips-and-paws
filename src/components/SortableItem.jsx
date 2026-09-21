import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLang } from '../i18n/index.jsx';

// Generischer Ziehgriff neben einem Panel (oder einer Inventar-Gruppe), ohne
// dessen eigenes Markup anzufassen: Griff und Kind liegen als Flex-Reihe
// nebeneinander statt uebereinander — kein Ueberlappen mit Panel-Kopf oder
// -Knoepfen. So funktioniert Umordnen fuer jedes Panel gleich, auch fuer
// die, die ihr eigenes <Panel> intern rendern (HirelingsPanel, PartyNpcs, ...).
export default function SortableItem({ id, children, className = '' }) {
  const { t } = useLang();
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-item${isDragging ? ' sortable-item-dragging' : ''}${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        className="sortable-handle"
        aria-label={t('panel.dragHandle')}
        title={t('panel.dragHandle')}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={15} />
      </button>
      <div className="sortable-content">{children}</div>
    </div>
  );
}
