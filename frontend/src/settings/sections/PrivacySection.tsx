import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import LockManager from '../../lock/LockManager';
import { useLockConfig, setIdleTimeout } from '../../lock/appLock';
import { getPrefs, setPref } from '../settingsStore';

/** Sentinel: "Mai" — a value large enough that idle never elapses in practice. */
const IDLE_NEVER = 100000;
const IDLE_OPTIONS: [number, string][] = [[1, '1 min'], [5, '5 min'], [15, '15 min'], [IDLE_NEVER, 'Mai']];

export default function PrivacySection({ session }: { session: Session }) {
  const userId = session.user.id;
  const cfg = useLockConfig(userId);
  const idle = cfg?.idleTimeoutMin ?? 5;
  const [anonymize, setAnonymize] = useState(getPrefs().anonymizeByDefault);

  return (
    <section className="settings-section">
      <p className="settings-section-label">Privacy &amp; sicurezza</p>

      <LockManager userId={userId} />

      <div className="settings-row">
        <div>
          <div className="settings-row-label">Blocco dopo inattività</div>
          <div className="settings-row-desc">Richiede di nuovo il PIN dopo questo tempo di inattività</div>
        </div>
        <select className="settings-row-control" value={idle}
          onChange={e => setIdleTimeout(userId, Number(e.target.value))}>
          {IDLE_OPTIONS.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}
        </select>
      </div>

      <label className="settings-row" style={{ cursor: 'pointer' }}>
        <div>
          <div className="settings-row-label">Anonimizza per impostazione predefinita</div>
          <div className="settings-row-desc">Pre-seleziona l’anonimizzazione quando esporti o condividi le schede</div>
        </div>
        <input type="checkbox" className="settings-row-control" checked={anonymize}
          onChange={e => { setPref('anonymizeByDefault', e.target.checked); setAnonymize(e.target.checked); }} />
      </label>

      <div className="settings-row">
        <div>
          <div className="settings-row-label">Regole di anonimizzazione</div>
          <div className="settings-row-desc">Le regole si gestiscono nel passaggio di anonimizzazione di ciascuna scheda cliente</div>
        </div>
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row-label">Disconnessione automatica</div>
          <div className="settings-row-desc">Per sicurezza, la sessione scade automaticamente dopo 72 ore</div>
        </div>
      </div>
    </section>
  );
}
