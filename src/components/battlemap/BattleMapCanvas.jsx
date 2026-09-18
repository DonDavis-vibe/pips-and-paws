import { useEffect, useRef } from 'react';
import { BattleMap } from '../../battlemap/battlemap.js';

// Duenne Bruecke zwischen React und der Karten-Engine (battlemap.js): Die
// Engine fuehrt ihren eigenen Zustand (Zoom, Figuren, Zeichnungen, Nebel) und
// meldet Aenderungen nur ueber `onChange` — wir duplizieren das nicht in
// React-State, sondern reichen die Instanz per `onReady` an die Eltern-
// Komponente weiter, die sie dann direkt anspricht (addFigur, setWerkzeug, ...).
export default function BattleMapCanvas({ onReady, onChange, besitzer, bestaetigung, nebelDeckend, className }) {
  const canvasRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const map = BattleMap.create(canvasRef.current, {
      onChange: (state) => onChangeRef.current?.(state),
      einheit: 1,
      einheitName: 'Feld',
      bestaetigungNoetig: !!bestaetigung,
      nebelDeckend: !!nebelDeckend,
    });
    if (besitzer) map.setBesitzer(besitzer);
    onReady?.(map);
    return () => onReady?.(null);
    // Die Engine wird bewusst genau einmal erzeugt — Karten-, Token- und
    // Werkzeugwechsel laufen ueber die von `onReady` gereichte Instanz, nicht
    // ueber ein Neu-Erzeugen der Leinwand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={`battlemap-canvas${className ? ` ${className}` : ''}`} />;
}
