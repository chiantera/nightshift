import { useState } from 'react';
import { Fingerprint, ShieldCheck, ShieldOff } from 'lucide-react';
import { useLockConfig, setPin, dismissSetup, usePlatformAuthenticator, hasBiometric, registerBiometric, disableBiometric } from './appLock';
import { PinSetForm } from './LockSetup';

/** Profilo panel: enable / change / disable the PIN app-lock. */
export default function LockManager({ userId }: { userId: string }) {
  const cfg = useLockConfig(userId);
  const enabled = !!(cfg && cfg.enabled && cfg.pinHash);
  const platformAuth = usePlatformAuthenticator();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="lock-manage">
        <div className="lock-manage-title"><ShieldCheck size={15} /> {enabled ? 'Cambia PIN' : 'Imposta un PIN'}</div>
        <PinSetForm
          submitLabel={enabled ? 'Aggiorna PIN' : 'Attiva il blocco'}
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
            {enabled ? <ShieldCheck size={15} /> : <ShieldOff size={15} />} Blocco con PIN
          </div>
          <div className="lock-manage-sub">{enabled ? 'Attivo — richiesto all’apertura e dopo inattività.' : 'Disattivato.'}</div>
        </div>
      </div>
      <div className="lock-manage-actions">
        {enabled ? (
          <>
            <button type="button" className="lock-manage-btn" onClick={() => setEditing(true)}>Cambia PIN</button>
            <button type="button" className="lock-manage-btn lock-manage-btn--danger"
              onClick={() => { if (confirm('Disattivare il blocco con PIN? Chiunque apra l’app potrà accedere ai dati su questo dispositivo.')) dismissSetup(userId); }}>
              Disattiva
            </button>
          </>
        ) : (
          <button type="button" className="lock-manage-btn" onClick={() => setEditing(true)}>Attiva</button>
        )}
      </div>
      {enabled && platformAuth && (
        <div className="lock-manage-row" style={{ marginTop: 4 }}>
          <div className="lock-manage-title" style={{ fontWeight: 600 }}><Fingerprint size={15} /> Sblocco biometrico</div>
          {hasBiometric(userId)
            ? <button type="button" className="lock-manage-btn lock-manage-btn--danger" onClick={() => disableBiometric(userId)}>Disattiva</button>
            : <button type="button" className="lock-manage-btn" onClick={async () => { const ok = await registerBiometric(userId, userId); if (!ok) alert('Attivazione biometria non riuscita su questo dispositivo.'); }}>Attiva</button>}
        </div>
      )}
    </div>
  );
}
