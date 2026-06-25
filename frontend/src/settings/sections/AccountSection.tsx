import { supabase } from '../../supabaseClient';
import { LogOut } from 'lucide-react';
import { t as tr, useT } from '../../i18n/index.ts';

export default function AccountSection({ email }: { email: string | undefined }) {
  const t = useT();
  const changePassword = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    alert(error ? tr('common.errorPrefix', { msg: error.message }) : tr('settings.account.resetSent'));
  };
  const logout = () => { if (confirm(tr('account.logoutConfirm'))) supabase.auth.signOut(); };
  return (
    <section className="settings-section">
      <p className="settings-section-label">{t('settings.account.label')}</p>
      <div className="settings-row">
        <div><div className="settings-row-label">{t('common.email')}</div><div className="settings-row-desc">{email ?? '—'}</div></div>
      </div>
      <div className="settings-row">
        <div><div className="settings-row-label">{t('settings.account.password')}</div><div className="settings-row-desc">{t('settings.account.passwordDesc')}</div></div>
        <button className="ghost-button settings-row-control" onClick={changePassword}>{t('settings.account.changePassword')}</button>
      </div>
      <div className="settings-row">
        <div><div className="settings-row-label">{t('settings.account.logoutLabel')}</div></div>
        <button className="ghost-button settings-row-control" onClick={logout}><LogOut size={15} /> {t('settings.account.logoutBtn')}</button>
      </div>
    </section>
  );
}
