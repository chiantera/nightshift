import { useState } from 'react';
import { getThemeChoice, setThemeChoice, type ThemeChoice } from '../../theme/theme';
import { useT } from '../../i18n/index.ts';

export default function AppearanceSection() {
  const t = useT();
  const [theme, setTheme] = useState<ThemeChoice>(getThemeChoice());
  const pick = (c: ThemeChoice) => { setThemeChoice(c); setTheme(c); };
  return (
    <section className="settings-section">
      <p className="settings-section-label">{t('settings.appearance.label')}</p>
      <div className="settings-row">
        <div><div className="settings-row-label">{t('settings.appearance.theme')}</div></div>
        <div className="settings-row-control theme-toggle" role="group" aria-label={t('settings.appearance.theme')}>
          {(['dark', 'light', 'auto'] as ThemeChoice[]).map(c => (
            <button key={c} type="button" className={theme === c ? 'active' : ''} onClick={() => pick(c)}>
              {c === 'dark' ? t('settings.theme.dark') : c === 'light' ? t('settings.theme.light') : t('settings.theme.auto')}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
