import { ArrowLeft, Wallet, ChevronRight } from 'lucide-react';
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
import { useT } from '../i18n/index.ts';

export default function SettingsScreen({ session, onBack, onOpenPayments }: { session: Session; onBack: () => void; onOpenPayments?: () => void }) {
  const t = useT();
  return (
    <main className="app-shell settings-shell">
      <div className="settings-topbar">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> {t('common.back')}</button>
        <h1 className="settings-title">{t('settings.title')}</h1>
      </div>
      {onOpenPayments && (
        <button type="button" className="settings-nav-row" onClick={onOpenPayments}>
          <Wallet size={18} />
          <span className="settings-nav-label">{t('pay.title')}</span>
          <ChevronRight size={18} />
        </button>
      )}
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
