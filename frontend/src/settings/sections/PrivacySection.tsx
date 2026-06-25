import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import LockManager from '../../lock/LockManager';
import { useLockConfig, setIdleTimeout } from '../../lock/appLock';
import { getPrefs, setPref } from '../settingsStore';
import { useT } from '../../i18n/index.ts';

/** Sentinel: "never" — a value large enough that idle never elapses in practice. */
const IDLE_NEVER = 100000;

export default function PrivacySection({ session }: { session: Session }) {
  const t = useT();
  const userId = session.user.id;
  const cfg = useLockConfig(userId);
  const idle = cfg?.idleTimeoutMin ?? 5;
  const [anonymize, setAnonymize] = useState(getPrefs().anonymizeByDefault);
  const idleOptions: [number, string][] = [[1, '1 min'], [5, '5 min'], [15, '15 min'], [IDLE_NEVER, t('settings.privacy.never')]];

  return (
    <section className="settings-section">
      <p className="settings-section-label">{t('settings.privacy.label')}</p>

      <LockManager userId={userId} />

      <div className="settings-row">
        <div>
          <div className="settings-row-label">{t('settings.privacy.idleLock')}</div>
          <div className="settings-row-desc">{t('settings.privacy.idleLockDesc')}</div>
        </div>
        <select className="settings-row-control" value={idle}
          onChange={e => setIdleTimeout(userId, Number(e.target.value))}>
          {idleOptions.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}
        </select>
      </div>

      <label className="settings-row" style={{ cursor: 'pointer' }}>
        <div>
          <div className="settings-row-label">{t('settings.privacy.anonymize')}</div>
          <div className="settings-row-desc">{t('settings.privacy.anonymizeDesc')}</div>
        </div>
        <input type="checkbox" className="settings-row-control" checked={anonymize}
          onChange={e => { setPref('anonymizeByDefault', e.target.checked); setAnonymize(e.target.checked); }} />
      </label>

      <div className="settings-row">
        <div>
          <div className="settings-row-label">{t('settings.privacy.rules')}</div>
          <div className="settings-row-desc">{t('settings.privacy.rulesDesc')}</div>
        </div>
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row-label">{t('settings.privacy.autoLogout')}</div>
          <div className="settings-row-desc">{t('settings.privacy.autoLogoutDesc')}</div>
        </div>
      </div>
    </section>
  );
}
