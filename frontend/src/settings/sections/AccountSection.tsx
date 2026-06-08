import { supabase } from '../../supabaseClient';
import { LogOut } from 'lucide-react';

export default function AccountSection({ email }: { email: string | undefined }) {
  const changePassword = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    alert(error ? `Errore: ${error.message}` : 'Ti abbiamo inviato un’email per reimpostare la password.');
  };
  const logout = () => { if (confirm('Vuoi davvero uscire dall’account?')) supabase.auth.signOut(); };
  return (
    <section className="settings-section">
      <p className="settings-section-label">Account</p>
      <div className="settings-row">
        <div><div className="settings-row-label">Email</div><div className="settings-row-desc">{email ?? '—'}</div></div>
      </div>
      <div className="settings-row">
        <div><div className="settings-row-label">Password</div><div className="settings-row-desc">Ti inviamo un’email per reimpostarla</div></div>
        <button className="ghost-button settings-row-control" onClick={changePassword}>Cambia password</button>
      </div>
      <div className="settings-row">
        <div><div className="settings-row-label">Esci dall’account</div></div>
        <button className="ghost-button settings-row-control" onClick={logout}><LogOut size={15} /> Logout</button>
      </div>
    </section>
  );
}
