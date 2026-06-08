import { useState } from 'react';
import { getThemeChoice, setThemeChoice, type ThemeChoice } from '../../theme/theme';

export default function AppearanceSection() {
  const [theme, setTheme] = useState<ThemeChoice>(getThemeChoice());
  const pick = (c: ThemeChoice) => { setThemeChoice(c); setTheme(c); };
  return (
    <section className="settings-section">
      <p className="settings-section-label">Aspetto</p>
      <div className="settings-row">
        <div><div className="settings-row-label">Tema</div></div>
        <div className="settings-row-control theme-toggle" role="group" aria-label="Tema">
          {(['dark', 'light', 'auto'] as ThemeChoice[]).map(c => (
            <button key={c} type="button" className={theme === c ? 'active' : ''} onClick={() => pick(c)}>
              {c === 'dark' ? 'Scuro' : c === 'light' ? 'Chiaro' : 'Auto'}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
