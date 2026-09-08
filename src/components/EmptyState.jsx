// Kleiner Leerzustand: Holzschnitt-Vignette + Text. Die Vignetten liegen in
// src/assets/ und tragen einen cremefarbenen Grund; im Dunkelmodus setzt CSS
// sie in eine ruhige Karte.
export default function EmptyState({ img, alt = '', children }) {
  return (
    <div className="empty-state">
      {img ? <img className="empty-state-art" src={img} alt={alt} width="180" height="180" /> : null}
      <p className="empty-state-text">{children}</p>
    </div>
  );
}
