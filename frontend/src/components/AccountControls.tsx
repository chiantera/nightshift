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
import { t, useT } from '../i18n/index.ts';

function ProfileDrawer({ session, onClose, onOpenSettings }: { session: Session; onClose: () => void; onOpenSettings: () => void }) {
  const tr = useT();
  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-drawer" onClick={e => e.stopPropagation()}>
        <div className="profile-header">
          <div className="profile-title">{tr('account.profile')}</div>
          <button className="profile-close" title={tr('account.closeProfile')} onClick={onClose}><X size={18} /></button>
        </div>
        <div className="profile-email">{session.user.email}</div>
        <button className="lock-manage-btn" style={{ width: '100%', marginBottom: 12 }} onClick={() => { onOpenSettings(); onClose(); }}>
          {tr('account.openSettings')}
        </button>
        <button className="profile-logout" title={tr('account.logoutTitle')} onClick={() => requestLogout()}>
          <LogOut size={15} /> {tr('account.logout')}
        </button>
      </div>
    </div>
  );
}

/** Confirm, then sign out. Shared by the drawer button and the quick logout button. */
function requestLogout() {
  if (confirm(t('account.logoutConfirm'))) supabase.auth.signOut();
}

export default function AccountControls({ session, onOpenSettings }: { session: Session; onOpenSettings: () => void }) {
  const tr = useT();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <div className="account-controls">
        <button onClick={() => setShowProfile(true)} className="profile-btn" title={tr('account.profile')}><User size={16} /></button>
        <button onClick={requestLogout} className="profile-btn" title={tr('account.logout')} aria-label={tr('account.logout')}><LogOut size={16} /></button>
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
