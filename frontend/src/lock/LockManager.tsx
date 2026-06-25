import { useState } from 'react';
import { Fingerprint, ShieldCheck, ShieldOff } from 'lucide-react';
import { useLockConfig, setPin, dismissSetup, usePlatformAuthenticator, hasBiometric, registerBiometric, disableBiometric } from './appLock';
import { PinSetForm } from './LockSetup';
import { useT } from '../i18n/index.ts';

/** Profilo panel: enable / change / disable the PIN app-lock. */
export default function LockManager({ userId }: { userId: string }) {
  const t = useT();
  const cfg = useLockConfig(userId);
  const enabled = !!(cfg && cfg.enabled && cfg.pinHash);
  const platformAuth = usePlatformAuthenticator();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="lock-manage">
        <div className="lock-manage-title"><ShieldCheck size={15} /> {enabled ? t('lock.changePin') : t('lock.setPinTitle')}</div>
        <PinSetForm
          submitLabel={enabled ? t('lock.updatePin') : t('lock.enableLock')}
          onCancel={() => setEditing(false)}
          onSubmit={async (pin) => { await setPin(userId, pin); setEditing(false); }}
        />
      </div>
    );
  }

  return (
    <div className="lock-manage">
      <div className="lock-manage-row">
        <div>
          <div className="lock-manage-title">
            {enabled ? <ShieldCheck size={15} /> : <ShieldOff size={15} />} {t('lock.pinLock')}
          </div>
          <div className="lock-manage-sub">{enabled ? t('lock.statusActive') : t('lock.statusOff')}</div>
        </div>
      </div>
      <div className="lock-manage-actions">
        {enabled ? (
          <>
            <button type="button" className="lock-manage-btn" onClick={() => setEditing(true)}>{t('lock.changePin')}</button>
            <button type="button" className="lock-manage-btn lock-manage-btn--danger"
              onClick={() => { if (confirm(t('lock.disableConfirm'))) dismissSetup(userId); }}>
              {t('lock.disable')}
            </button>
          </>
        ) : (
          <button type="button" className="lock-manage-btn" onClick={() => setEditing(true)}>{t('lock.enable')}</button>
        )}
      </div>
      {enabled && platformAuth && (
        <div className="lock-manage-row" style={{ marginTop: 4 }}>
          <div className="lock-manage-title" style={{ fontWeight: 600 }}><Fingerprint size={15} /> {t('lock.bioTitle')}</div>
          {hasBiometric(userId)
            ? <button type="button" className="lock-manage-btn lock-manage-btn--danger" onClick={() => disableBiometric(userId)}>{t('lock.disable')}</button>
            : <button type="button" className="lock-manage-btn" onClick={async () => { const ok = await registerBiometric(userId, userId); if (!ok) alert(t('lock.bioRegisterFailed')); }}>{t('lock.enable')}</button>}
        </div>
      )}
    </div>
  );
}
