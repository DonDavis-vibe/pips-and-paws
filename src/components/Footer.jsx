import { Github, BookOpen, ExternalLink, Heart, Link as LinkIcon, MessagesSquare, Bug } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { PRODUCER, PRODUCER_URL, REPO_URL, SITE_URL, DISCORD_URL, APP_VERSION, LINKS } from '../config.js';

function Ext({ href, icon: Icon, children }) {
  return (
    <a className="footer-link" href={href} target="_blank" rel="noopener noreferrer">
      {Icon ? <Icon size={14} /> : null}
      {children}
      <ExternalLink size={11} className="footer-link-ext" />
    </a>
  );
}

export default function Footer() {
  const { t } = useLang();
  const [d1pre, d1post] = t('footer.disclaimer1').split('{name}');
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col footer-col-brand">
          <div className="footer-brand">
            <span aria-hidden="true">🐭</span> {t('app.title')}
          </div>
          <p className="footer-tagline">{t('footer.tagline')}</p>
          <p className="footer-meta">
            v{APP_VERSION} · <span>{t('footer.codeLicense')}</span> · <span>{t('footer.rulesLicense')}</span>
          </p>
        </div>

        <nav className="footer-col" aria-label={t('footer.links')}>
          <h4>{t('footer.links')}</h4>
          <Ext href={SITE_URL} icon={LinkIcon}>
            {t('footer.liveApp')}
          </Ext>
          <Ext href={REPO_URL} icon={Github}>
            {t('footer.github')}
          </Ext>
          <Ext href={LINKS.mausritter} icon={Heart}>
            {t('footer.mausritter')}
          </Ext>
          <Ext href={LINKS.srd} icon={BookOpen}>
            {t('footer.srd')}
          </Ext>
          <Ext href={LINKS.thirdParty}>{t('footer.thirdParty')}</Ext>
        </nav>

        <nav className="footer-col" aria-label={t('footer.community')}>
          <h4>{t('footer.community')}</h4>
          <Ext href={DISCORD_URL} icon={MessagesSquare}>
            {t('footer.discord')}
          </Ext>
          <Ext href={`${REPO_URL}/issues/new`} icon={Bug}>
            {t('footer.reportBug')}
          </Ext>
        </nav>

        <div className="footer-col footer-col-legal">
          <p>
            {d1pre}
            <a href={PRODUCER_URL} target="_blank" rel="noopener noreferrer">
              {PRODUCER}
            </a>
            {d1post}
          </p>
          <p>{t('footer.disclaimer2')}</p>
        </div>
      </div>
    </footer>
  );
}
