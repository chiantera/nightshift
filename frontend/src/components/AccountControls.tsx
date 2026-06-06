/**
 * AccountControls — the Profilo + Logout button pair shown top-right on every
 * screen (home header and the case-detail top bar). Both buttons share the same
 * `.profile-btn` look/size. Logout confirms before signing out.
 *
 * Self-contained (own ProfileDrawer + supabase client) so it can be reused
 * across screens and ported to PLT with only copy changes.
 */
import React, { useEffect, useState } from 'react';
import { type Session } from '@supabase/supabase-js';
import { Fingerprint, LogOut, ShieldCheck, ShieldOff, User, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { UserProfile } from '../domain/types';
import { useLockConfig, setPin, dismissSetup, usePlatformAuthenticator, hasBiometric, registerBiometric, disableBiometric } from '../lock/appLock';
import { PinSetForm } from '../lock/LockSetup';
import AriaCapabilities from '../value/AriaCapabilities';
import { areSuggestionsEnabled, setSuggestionsEnabled } from '../value/seen';
import { dismissOnboarding } from '../onboarding/wizardBus';
import FirstRunWizard from '../value/FirstRunWizard';
import { type AriaSetup, loadAriaSetup } from '../value/personalization';
import { getThemeChoice, setThemeChoice, type ThemeChoice } from '../theme/theme';

/** Profilo panel: enable / change / disable the PIN app-lock. */
function LockManager({ userId }: { userId: string }) {
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

function ProfileDrawer({ session, onClose, onEditAria }: { session: Session; onClose: () => void; onEditAria: () => void }) {
  const [profile, setProfile] = useState<Omit<UserProfile, 'id'>>({ full_name: null, studio: null, phone: null });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [suggestions, setSuggestions] = useState(() => areSuggestionsEnabled());
  const [theme, setTheme] = useState<ThemeChoice>(getThemeChoice());
  const pickTheme = (c: ThemeChoice) => { setThemeChoice(c); setTheme(c); };

  useEffect(() => {
    supabase.from('profiles').select('full_name,studio,phone').eq('id', session.user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [session.user.id]);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('profiles').upsert({ id: session.user.id, ...profile });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-drawer" onClick={e => e.stopPropagation()}>
        <div className="profile-header">
          <div className="profile-title">Profilo</div>
          <button className="profile-close" title="Chiudi profilo" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="profile-email">{session.user.email}</div>
        <div>
          <h4 style={{ marginTop: 4 }}>Tema</h4>
          <div className="theme-toggle" role="group" aria-label="Tema">
            {(['dark', 'light', 'auto'] as ThemeChoice[]).map(c => (
              <button key={c} type="button" className={theme === c ? 'active' : ''} onClick={() => pickTheme(c)}>
                {c === 'dark' ? 'Scuro' : c === 'light' ? 'Chiaro' : 'Auto'}
              </button>
            ))}
          </div>
        </div>
        {[
          { label: 'Nome completo', key: 'full_name' as const, placeholder: 'Mario Rossi PT' },
          { label: 'Studio / Palestra', key: 'studio' as const, placeholder: 'FitLab Milano' },
          { label: 'Telefono', key: 'phone' as const, placeholder: '+39 02 1234567' },
        ].map(({ label, key, placeholder }) => (
          <div key={key} className="profile-field">
            <label className="profile-label">{label}</label>
            <input className="profile-input" value={profile[key] ?? ''} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} />
          </div>
        ))}
        <button title="Salva modifiche profilo" className={`profile-save${saved ? ' profile-save--saved' : ''}`} onClick={handleSave} disabled={saving}>
          {saving ? 'Salvataggio…' : saved ? 'Salvato ✓' : 'Salva profilo'}
        </button>
        <LockManager userId={session.user.id} />
        <button className="lock-manage-btn" style={{ marginTop: 12 }} onClick={onEditAria}>
          Modifica configurazione Aria
        </button>
        <details className="profile-section">
          <summary className="lock-manage-btn">Cosa fa Aria</summary>
          <div style={{ marginTop: 10 }}><AriaCapabilities /></div>
        </details>
        <label className="profile-section profile-toggle">
          <span>Mostra suggerimenti e spiegazioni in-app</span>
          <input
            type="checkbox"
            checked={suggestions}
            onChange={e => {
              const on = e.target.checked;
              setSuggestions(on);
              setSuggestionsEnabled(on);
              if (!on) dismissOnboarding();
            }}
          />
        </label>
        <p className="profile-hint">Spegne il modale di benvenuto, gli aiuti contestuali e il tour. Non tocca gli avvisi della pagina di accesso.</p>
        <button className="profile-logout" title="Disconnettiti dall'applicazione" onClick={() => requestLogout()}>
          <LogOut size={15} /> Esci dall'account
        </button>
      </div>
    </div>
  );
}

/** Confirm, then sign out. Shared by the drawer button and the quick logout button. */
function requestLogout() {
  if (confirm('Vuoi davvero uscire dall\'account?')) supabase.auth.signOut();
}

export default function AccountControls({ session }: { session: Session }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showAriaEdit, setShowAriaEdit] = useState(false);
  const [ariaInitialValues, setAriaInitialValues] = useState<AriaSetup | undefined>(undefined);

  const handleEditAria = () => {
    setAriaInitialValues(loadAriaSetup() ?? undefined);
    setShowProfile(false);
    setShowAriaEdit(true);
  };

  return (
    <>
      <div className="account-controls">
        <button onClick={() => setShowProfile(true)} className="profile-btn" title="Profilo"><User size={16} /></button>
        <button onClick={requestLogout} className="profile-btn" title="Esci dall'account" aria-label="Esci dall'account"><LogOut size={16} /></button>
      </div>
      {showProfile && (
        <ProfileDrawer
          session={session}
          onClose={() => setShowProfile(false)}
          onEditAria={handleEditAria}
        />
      )}
      {showAriaEdit && (
        <FirstRunWizard
          editMode
          initialValues={ariaInitialValues}
          onComplete={() => setShowAriaEdit(false)}
        />
      )}
    </>
  );
}
