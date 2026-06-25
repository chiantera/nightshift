import { useState } from 'react';
import AriaCapabilities from '../../value/AriaCapabilities';
import { areSuggestionsEnabled, setSuggestionsEnabled } from '../../value/seen';
import { userKey } from '../../storage/userStorage';
import { useT } from '../../i18n/index.ts';

export default function HelpSection() {
  const t = useT();
  const [suggestions, setSuggestions] = useState(areSuggestionsEnabled());

  const reviewTour = () => {
    localStorage.removeItem(userKey('onboarding:dismissed'));
    window.location.reload();
  };

  return (
    <section className="settings-section">
      <p className="settings-section-label">{t('settings.help.label')}</p>

      <label className="settings-row" style={{ cursor: 'pointer' }}>
        <div>
          <div className="settings-row-label">{t('settings.help.suggestions')}</div>
          <div className="settings-row-desc">{t('settings.help.suggestionsDesc')}</div>
        </div>
        <input type="checkbox" className="settings-row-control" checked={suggestions}
          onChange={e => { setSuggestionsEnabled(e.target.checked); setSuggestions(e.target.checked); }} />
      </label>

      <div className="settings-row">
        <div><div className="settings-row-label">{t('settings.help.reviewTour')}</div><div className="settings-row-desc">{t('settings.help.reviewTourDesc')}</div></div>
        <button className="ghost-button settings-row-control" onClick={reviewTour}>{t('common.start')}</button>
      </div>

      <details className="profile-section" style={{ marginTop: 6 }}>
        <summary className="settings-row-label" style={{ cursor: 'pointer' }}>{t('settings.help.whatAria')}</summary>
        <div style={{ marginTop: 10 }}><AriaCapabilities /></div>
      </details>
    </section>
  );
}
