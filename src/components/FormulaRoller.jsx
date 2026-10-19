import { useState } from 'react';
import { Sigma } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { rollFormula } from '../utils/dice3d.js';

// Freie Wuerfel-Formel ("3w6+2", "4w6kh3", "2w20kl1", "1w20r1" ...): PnpDice
// wuerfelt selbst, die 3D-Wuerfel rollen ueber die Seite, danach geht das
// Ergebnis an die Buehne und ins Protokoll der aufrufenden Tafel (`onResult`).
export default function FormulaRoller({ onResult }) {
  const { t, lang } = useLang();
  const [formula, setFormula] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const f = formula.trim();
    if (!f || busy) return;
    setError('');
    setBusy(true);
    try {
      const r = await rollFormula(f, undefined, lang);
      onResult(r);
      setFormula('');
    } catch (err) {
      setError(err?.message || t('formula.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="dice-custom formula-roller" onSubmit={submit} title={t('formula.hint')}>
      <Sigma size={15} className="dice-custom-icon" aria-hidden="true" />
      <input
        type="text"
        className="dice-custom-input formula-input"
        placeholder={t('formula.placeholder')}
        value={formula}
        maxLength={80}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => { setFormula(e.target.value); setError(''); }}
        aria-label={t('formula.label')}
      />
      <button type="submit" className="btn btn-sm" disabled={!formula.trim() || busy}>
        {t('formula.roll')}
      </button>
      {error ? <span className="formula-error" role="alert">{error}</span> : null}
    </form>
  );
}
