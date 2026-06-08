import { ArrowLeft } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import AccountSection from './sections/AccountSection';
import ProfileSection from './sections/ProfileSection';
import AppearanceSection from './sections/AppearanceSection';
import AriaSection from './sections/AriaSection';
import UnitsSection from './sections/UnitsSection';
import PrivacySection from './sections/PrivacySection';
import DataSection from './sections/DataSection';
import HelpSection from './sections/HelpSection';
import AboutSection from './sections/AboutSection';

export default function SettingsScreen({ session, onBack }: { session: Session; onBack: () => void }) {
  return (
    <main className="app-shell settings-shell">
      <div className="settings-topbar">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Indietro</button>
        <h1 className="settings-title">Impostazioni</h1>
      </div>
      <AccountSection email={session.user.email} />
      <ProfileSection session={session} />
      <AppearanceSection />
      <AriaSection />
      <UnitsSection />
      <PrivacySection session={session} />
      <DataSection session={session} />
      <HelpSection />
      <AboutSection />
    </main>
  );
}
