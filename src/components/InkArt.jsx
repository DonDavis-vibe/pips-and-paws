// Tusche-Illustration (src/assets/ink/*.webp): schwarze Linien mit Alpha, kein
// Papiergrund. Passt dadurch auf jedes Papier und jeden Skin; im Dunkelmodus
// kehrt CSS (.ink-art) die Tusche zu hellen Linien um ("Negativdruck").
export default function InkArt({ src, className = '', alt = '', ...rest }) {
  return <img className={`ink-art${className ? ` ${className}` : ''}`} src={src} alt={alt} draggable="false" {...rest} />;
}
