import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';
import type { UserProfile } from '../../domain/types';
import { useT } from '../../i18n/index.ts';

export default function ProfileSection({ session }: { session: Session }) {
  const t = useT();
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
    <section className="settings-section">
      <p className="settings-section-label">{t('settings.profile.label')}</p>
      {[
        { label: t('settings.profile.fullName'), key: 'full_name' as const, placeholder: t('onboard.fullNamePlaceholder') },
        { label: t('onboard.studio'), key: 'studio' as const, placeholder: t('onboard.studioPlaceholder') },
        { label: t('settings.profile.phone'), key: 'phone' as const, placeholder: t('settings.profile.phonePlaceholder') },
      ].map(({ label, key, placeholder }) => (
        <div key={key} className="profile-field">
          <label className="profile-label">{label}</label>
          <input className="profile-input" value={profile[key] ?? ''} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} />
        </div>
      ))}
      <button title={t('settings.profile.saveTitle')} className={`profile-save${saved ? ' profile-save--saved' : ''}`} onClick={handleSave} disabled={saving}>
        {saving ? t('common.saving') : saved ? t('settings.profile.saved') : t('settings.profile.save')}
      </button>
    </section>
  );
}
