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
import { LogOut, User, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { UserProfile } from '../domain/types';

function ProfileDrawer({ session, onClose }: { session: Session; onClose: () => void }) {
  const [profile, setProfile] = useState<Omit<UserProfile, 'id'>>({ full_name: null, studio: null, phone: null });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
  return (
    <>
      <div className="account-controls">
        <button onClick={() => setShowProfile(true)} className="profile-btn" title="Profilo"><User size={16} /></button>
        <button onClick={requestLogout} className="profile-btn" title="Esci dall'account" aria-label="Esci dall'account"><LogOut size={16} /></button>
      </div>
      {showProfile && <ProfileDrawer session={session} onClose={() => setShowProfile(false)} />}
    </>
  );
}
