/**
 * AccountControls — the Profilo + Logout button pair shown top-right on every
 * screen (home header and the case-detail top bar). Both buttons share the same
 * `.profile-btn` look/size. Logout confirms before signing out.
 *
 * Self-contained (own ProfileDrawer + supabase client) so it can be reused
 * across screens and ported to PLT with only copy changes.
 */
import React, { useState } from 'react';
import { type Session } from '@supabase/supabase-js';
import { LogOut, User, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import AriaCapabilities from '../value/AriaCapabilities';
import { areSuggestionsEnabled, setSuggestionsEnabled } from '../value/seen';
import { dismissOnboarding } from '../onboarding/wizardBus';

function ProfileDrawer({ session, onClose, onOpenSettings }: { session: Session; onClose: () => void; onOpenSettings: () => void }) {
  const [suggestions, setSuggestions] = useState(() => areSuggestionsEnabled());

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-drawer" onClick={e => e.stopPropagation()}>
        <div className="profile-header">
          <div className="profile-title">Profilo</div>
          <button className="profile-close" title="Chiudi profilo" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="profile-email">{session.user.email}</div>
        <button className="lock-manage-btn" style={{ width: '100%', marginBottom: 12 }} onClick={() => { onOpenSettings(); onClose(); }}>
          Apri Impostazioni
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

export default function AccountControls({ session, onOpenSettings }: { session: Session; onOpenSettings: () => void }) {
  const [showProfile, setShowProfile] = useState(false);

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
          onOpenSettings={onOpenSettings}
        />
      )}
    </>
  );
}
