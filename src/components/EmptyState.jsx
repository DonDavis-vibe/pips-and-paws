import InkArt from './InkArt.jsx';

// Kleiner Leerzustand: Tusche-Vignette (siehe InkArt) + Text.
export default function EmptyState({ img, alt = '', children }) {
  return (
    <div className="empty-state">
      {img ? <InkArt className="empty-state-art" src={img} alt={alt} width="156" height="156" /> : null}
      <p className="empty-state-text">{children}</p>
    </div>
  );
}
