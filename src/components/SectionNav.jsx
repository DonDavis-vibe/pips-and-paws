import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../i18n/index.jsx';

// Sprungleiste am unteren Rand (Bogen und SL-Dashboard): ein Knopf je Bereich,
// Klick scrollt weich zum Bereich, der aktive Bereich ist hervorgehoben.
// `items`: [{ id, icon, label }] — Ziel ist das Element mit der DOM-id
// `sec-<id>` (gesetzt von SortableItem bzw. Panel#anchorId). Bereiche, die gerade
// nicht im DOM stehen (ausgeblendete Panels), werden uebersprungen.
// Per Portal in den body gehaengt: .sheet/.gm-dash sind auf breiten Schirmen
// ein Grid, ein weiteres Kind wuerde dort eine Zelle belegen.
export const sectionDomId = (id) => `sec-${id}`;

export default function SectionNav({ items }) {
  const { t } = useLang();
  const [present, setPresent] = useState([]);
  const [active, setActive] = useState(null);
  const innerRef = useRef(null);

  // Pruefen, welche Bereiche im DOM stehen. Die Liste ändert sich genau dann,
  // wenn Panels erscheinen/verschwinden (Karte, Handouts ...) oder umsortiert
  // werden — der Schluessel deckt beides ab.
  const itemsKey = items.map((it) => it.id).join('|');
  useLayoutEffect(() => {
    const next = items.filter((it) => document.getElementById(sectionDomId(it.id))).map((it) => it.id);
    setPresent((prev) => (prev.length === next.length && prev.every((id, i) => id === next[i]) ? prev : next));
  }, [itemsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const presentKey = present.join('|');
  useEffect(() => {
    if (!present.length) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = present[0];
      if (atBottom) {
        current = present[present.length - 1];
      } else {
        // Letzter Bereich, dessen Oberkante schon im oberen Drittel angekommen ist.
        const line = window.innerHeight * 0.33;
        for (const id of present) {
          const el = document.getElementById(sectionDomId(id));
          if (el && el.getBoundingClientRect().top <= line) current = id;
        }
      }
      setActive(current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [presentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Leiste seitlich nachfuehren, damit der aktive Knopf sichtbar bleibt
  // (auf dem Handy passt nicht alles auf einmal hinein).
  useEffect(() => {
    const inner = innerRef.current;
    const btn = inner?.querySelector('.section-nav-btn.active');
    if (!inner || !btn) return;
    const left = btn.offsetLeft - (inner.clientWidth - btn.offsetWidth) / 2;
    inner.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [active]);

  const jump = (id) => {
    const el = document.getElementById(sectionDomId(id));
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setActive(id);
  };

  if (present.length < 2) return null;

  const visible = items.filter((it) => present.includes(it.id));
  return createPortal(
    <nav className="section-nav" aria-label={t('nav.label')}>
      <div className="section-nav-inner" ref={innerRef}>
        {visible.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            className={`section-nav-btn${active === id ? ' active' : ''}`}
            onClick={() => jump(id)}
            aria-current={active === id ? 'true' : undefined}
            title={label}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>,
    document.body,
  );
}
