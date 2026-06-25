/**
 * LockSetup — first-run prompt to protect the app with a PIN, plus a reusable
 * PinSetForm (enter + confirm) used here and by the Profilo management panel.
 */
import { useRef, useState } from 'react';
import { Fingerprint, ShieldCheck } from 'lucide-react';
import { setPin, dismissSetup, isPlatformAuthenticatorAvailable, registerBiometric } from './appLock';
import { useT, renderRich } from '../i18n/index.ts';

const PIN_LEN = 4;

/** Enter a 4-digit PIN twice; calls onSubmit(pin) when both match. */
export function PinSetForm({ onSubmit, submitLabel, onCancel }: {
  onSubmit: (pin: string) => void | Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
}) {
  const t = useT();
  const [pin, setPinVal] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const confirmRef = useRef<HTMLInputElement>(null);

  const digits = (s: string) => s.replace(/\D/g, '').slice(0, PIN_LEN);

  const proceed = async () => {
    if (pin.length !== PIN_LEN) { setError(t('lock.pinFourDigits')); return; }
    if (pin !== confirm) { setError(t('lock.pinMismatch')); return; }
    setBusy(true);
    try { await onSubmit(pin); } finally { setBusy(false); }
  };

  return (
    <div className="lock-form">
      <label className="lock-field-label">{t('lock.pinLabel')}</label>
      <input
        className="lock-input" inputMode="numeric" type="password" autoComplete="off"
        value={pin} autoFocus
        onChange={e => { setPinVal(digits(e.target.value)); setError(null); }}
        onKeyDown={e => { if (e.key === 'Enter' && pin.length === PIN_LEN) confirmRef.current?.focus(); }}
      />
      <label className="lock-field-label">{t('lock.confirmPin')}</label>
      <input
        ref={confirmRef}
        className="lock-input" inputMode="numeric" type="password" autoComplete="off"
        value={confirm}
        onChange={e => { setConfirm(digits(e.target.value)); setError(null); }}
        onKeyDown={e => { if (e.key === 'Enter') void proceed(); }}
      />
      {error && <p className="lock-error" role="alert">{error}</p>}
      <div className="lock-form-actions">
        {onCancel && <button type="button" className="ghost-button" onClick={onCancel}>{t('common.cancel')}</button>}
        <button type="button" className="primary-button" onClick={() => void proceed()} disabled={busy || pin.length !== PIN_LEN || confirm.length !== PIN_LEN}>
          {busy ? t('common.saving') : submitLabel}
        </button>
      </div>
    </div>
  );
}

export default function LockSetup({ userId, onDone }: { userId: string; onDone: () => void }) {
  const t = useT();
  const [step, setStep] = useState<'intro' | 'set' | 'bio'>('intro');

  if (step === 'bio') {
    return (
      <div className="lock-screen">
        <div className="lock-card">
          <div className="lock-icon"><Fingerprint size={22} /></div>
          <h1 className="lock-title">{t('lock.bioTitle')}</h1>
          <p className="lock-sub">{t('lock.bioSub')}</p>
          <div className="lock-form-actions lock-form-actions--stack">
            <button type="button" className="primary-button" onClick={async () => { await registerBiometric(userId, userId); onDone(); }}>{t('lock.enableBio')}</button>
            <button type="button" className="ghost-button" onClick={onDone}>{t('lock.pinOnly')}</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'set') {
    return (
      <div className="lock-screen">
        <div className="lock-card">
          <div className="lock-icon"><ShieldCheck size={22} /></div>
          <h1 className="lock-title">{t('lock.setPinTitle')}</h1>
          <p className="lock-sub">{t('lock.setPinSub')}</p>
          <PinSetForm
            submitLabel={t('lock.enableLock')}
            onCancel={() => setStep('intro')}
            onSubmit={async (pin) => { await setPin(userId, pin); if (await isPlatformAuthenticatorAvailable()) setStep('bio'); else onDone(); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <div className="lock-icon"><ShieldCheck size={22} /></div>
        <h1 className="lock-title">{t('lock.protectTitle')}</h1>
        <p className="lock-sub">{renderRich(t('lock.protectSub'))}</p>
        <div className="lock-form-actions lock-form-actions--stack">
          <button type="button" className="primary-button" onClick={() => setStep('set')}>{t('lock.setPinBtn')}</button>
          <button type="button" className="ghost-button" onClick={() => { dismissSetup(userId); onDone(); }}>{t('lock.later')}</button>
        </div>
      </div>
    </div>
  );
}
