import { useT } from '../../i18n/index.ts';

export default function AboutSection() {
  const t = useT();
  return (
    <section className="settings-section">
      <p className="settings-section-label">{t('settings.about.label')}</p>
      <div className="settings-row">
        <div><div className="settings-row-label">{t('settings.about.version')}</div></div>
        <div className="settings-row-control settings-row-desc">{__APP_VERSION__}</div>
      </div>
      <div className="settings-row">
        <div><div className="settings-row-desc">{t('settings.about.tagline')}</div></div>
      </div>
    </section>
  );
}
