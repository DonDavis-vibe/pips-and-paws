// Kleiner Leerzustand: Holzschnitt-Vignette + Text. Die Vignetten liegen in
// src/assets/ und tragen einen cremefarbenen Grund; im Dunkelmodus setzt CSS
// sie in eine ruhige Karte.
// `art` ist die Strichzeichnung fuer den Druckbogen-Skin, `img` die Vignette
// des Classic-Skins — CSS zeigt je nach data-skin nur eins von beiden.
export default function EmptyState({ img, art: Art, alt = '', children }) {
  return (
    <div className="empty-state">
      {img ? <img className="empty-state-art skin-classic-only" src={img} alt={alt} width="180" height="180" /> : null}
      {Art ? <span className="empty-state-art empty-state-art-line skin-print-only"><Art /></span> : null}
      <p className="empty-state-text">{children}</p>
    </div>
  );
}
