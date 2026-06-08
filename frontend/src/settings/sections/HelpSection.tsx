import { useState } from 'react';
import AriaCapabilities from '../../value/AriaCapabilities';
import { areSuggestionsEnabled, setSuggestionsEnabled } from '../../value/seen';
import { userKey } from '../../storage/userStorage';

export default function HelpSection() {
  const [suggestions, setSuggestions] = useState(areSuggestionsEnabled());

  const reviewTour = () => {
    localStorage.removeItem(userKey('onboarding:dismissed'));
    window.location.reload();
  };

  return (
    <section className="settings-section">
      <p className="settings-section-label">Suggerimenti &amp; aiuto</p>

      <label className="settings-row" style={{ cursor: 'pointer' }}>
        <div>
          <div className="settings-row-label">Suggerimenti e spiegazioni in-app</div>
          <div className="settings-row-desc">Mostra il modale di benvenuto, gli aiuti contestuali e il tour</div>
        </div>
        <input type="checkbox" className="settings-row-control" checked={suggestions}
          onChange={e => { setSuggestionsEnabled(e.target.checked); setSuggestions(e.target.checked); }} />
      </label>

      <div className="settings-row">
        <div><div className="settings-row-label">Rivedi il tour</div><div className="settings-row-desc">Riavvia il tour di benvenuto guidato</div></div>
        <button className="ghost-button settings-row-control" onClick={reviewTour}>Avvia</button>
      </div>

      <details className="profile-section" style={{ marginTop: 6 }}>
        <summary className="settings-row-label" style={{ cursor: 'pointer' }}>Cosa fa Aria</summary>
        <div style={{ marginTop: 10 }}><AriaCapabilities /></div>
      </details>
    </section>
  );
}
