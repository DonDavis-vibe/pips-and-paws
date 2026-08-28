import { Dices } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { Stepper } from './ui.jsx';

export default function AttributeBox({ attrKey, labelKey, value, onChange, onSave }) {
  const { t } = useLang();
  const wounded = value.current < value.max;

  return (
    <div className={`attr-box${wounded ? ' attr-wounded' : ''}`}>
      <div className="attr-title">{t(labelKey)}</div>
      <div className="attr-row">
        <div className="attr-cell">
          <span className="attr-cap">{t('attr.current')}</span>
          <Stepper value={value.current} min={0} max={20} label={`${attrKey} ${t('attr.current')}`}
            onChange={(n) => onChange({ ...value, current: n })} />
        </div>
        <div className="attr-cell">
          <span className="attr-cap">{t('attr.max')}</span>
          <Stepper value={value.max} min={0} max={20} label={`${attrKey} ${t('attr.max')}`}
            onChange={(n) => onChange({ ...value, max: n })} />
        </div>
      </div>
      <button type="button" className="btn btn-ghost attr-save" onClick={() => onSave(attrKey)}>
        <Dices size={15} /> {t('attr.save')}
      </button>
    </div>
  );
}
