import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Info } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';

export function Field({ label, children, hint, className = '' }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

// Kleiner (i)-Aufklapper. Die Sprechblase liegt position:fixed und wird an den
// Knopf gerechnet — so kann sie nicht von Panels/Kaerten abgeschnitten werden.
export function InfoHint({ text }) {
  const { t } = useLang();
  const [pos, setPos] = useState(null); // null = zu
  const btnRef = useRef(null);

  const toggle = (e) => {
    e.stopPropagation();
    setPos((p) => {
      if (p) return null;
      const b = btnRef.current?.getBoundingClientRect();
      if (!b) return null;
      const width = Math.min(260, window.innerWidth - 24);
      let left = b.left + b.width / 2 - width / 2;
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      const below = b.bottom + 150 < window.innerHeight;
      return { left, width, top: below ? b.bottom + 8 : b.top - 8, below, arrow: b.left + b.width / 2 - left };
    });
  };

  useEffect(() => {
    if (!pos) return undefined;
    const close = () => setPos(null);
    const onKey = (e) => e.key === 'Escape' && setPos(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [pos]);

  return (
    <span className="info-hint">
      <button
        ref={btnRef}
        type="button"
        className={`info-hint-btn${pos ? ' is-open' : ''}`}
        aria-label={t('header.help')}
        aria-expanded={!!pos}
        onClick={toggle}
      >
        <Info size={13} />
      </button>
      {pos
        ? createPortal(
          <span
            className={`info-hint-pop${pos.below ? '' : ' info-hint-pop-above'}`}
            role="tooltip"
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              '--arrow-x': `${pos.arrow}px`,
            }}
          >
            {text}
          </span>,
          document.body,
        )
        : null}
    </span>
  );
}

export function TextInput({ value, onChange, ...rest }) {
  return <input className="text-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

export function Stepper({ value, onChange, min = -99, max = 999, label }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, (value || 0) - 1))} aria-label="-">
        −
      </button>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
      />
      <button type="button" onClick={() => onChange(Math.min(max, (value || 0) + 1))} aria-label="+">
        +
      </button>
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  const { t } = useLang();
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? ' modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
