import { ArrowLeft } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

export default function SettingsScreen({ session, onBack }: { session: Session; onBack: () => void }) {
  return (
    <main className="app-shell settings-shell">
      <div className="settings-topbar">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Indietro</button>
        <h1 className="settings-title">Impostazioni</h1>
      </div>
      {/* sections added in later tasks */}
      <p className="muted" style={{ marginTop: 16 }}>Le impostazioni arriveranno qui.</p>
    </main>
  );
}
