import {
  Info, ShieldCheck, ScrollText, Backpack, Radio, Swords, BookOpen,
} from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { Modal } from './ui.jsx';
import { LINKS } from '../config.js';

const SECTIONS = [
  { key: 'about', icon: Info },
  { key: 'storage', icon: ShieldCheck },
  { key: 'sheet', icon: ScrollText },
  { key: 'inventory', icon: Backpack },
  { key: 'multiplayer', icon: Radio },
  { key: 'gm', icon: Swords },
];

function Section({ icon: Icon, heading, body }) {
  return (
    <section className="help-section">
      <h3>
        <Icon size={16} /> {heading}
      </h3>
      {body.split('\n').filter(Boolean).map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </section>
  );
}

export default function HelpModal({ onClose }) {
  const { t } = useLang();

  return (
    <Modal title={t('help.title')} onClose={onClose} wide>
      <p className="help-lead">{t('help.lead')}</p>

      {SECTIONS.map(({ key, icon }) => (
        <Section key={key} icon={icon} heading={t(`help.${key}.h`)} body={t(`help.${key}.p`)} />
      ))}

      <section className="help-section">
        <h3>
          <BookOpen size={16} /> {t('help.rules.h')}
        </h3>
        <p>{t('help.rules.p')}</p>
        <p className="help-links">
          <a href={LINKS.mausritter} target="_blank" rel="noopener noreferrer">
            mausritter.com
          </a>
          <a href={LINKS.srd} target="_blank" rel="noopener noreferrer">
            {t('footer.srd')}
          </a>
        </p>
      </section>
    </Modal>
  );
}
