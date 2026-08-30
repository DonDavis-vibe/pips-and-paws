import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { readJSON, writeJSON } from '../utils/storage.js';

// Panel mit Kopf. Mit `id` ist es einklappbar; der Zustand wird pro id gemerkt.
export default function Panel({
  id, icon: Icon, title, right, defaultOpen = true, className = '', children,
}) {
  const { t } = useLang();
  const key = id ? `pips-paws-panel-${id}` : null;
  const [open, setOpen] = useState(() => (key ? readJSON(key, defaultOpen) !== false : true));

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (key) writeJSON(key, next);
  };

  return (
    <section className={`panel${open ? '' : ' panel-closed'}${className ? ` ${className}` : ''}`}>
      <div className="panel-head">
        <h2>
          {Icon ? <Icon size={18} /> : null}
          {title}
        </h2>
        <div className="panel-head-right">
          {open ? right : null}
          {key ? (
            <button
              type="button"
              className="panel-toggle"
              onClick={toggle}
              aria-expanded={open}
              aria-label={t(open ? 'panel.collapse' : 'panel.expand')}
              title={t(open ? 'panel.collapse' : 'panel.expand')}
            >
              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : null}
        </div>
      </div>
      {open ? <div className="panel-body">{children}</div> : null}
    </section>
  );
}
