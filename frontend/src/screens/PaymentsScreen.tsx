import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Wallet, CheckCircle2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { useT } from '../i18n/index.ts';
import { API } from '../config';

type ConnectStatus = { onboarded: boolean; charges_enabled: boolean };

/**
 * Payments page (Stripe Connect onboarding — Phase 1). Lets a trainer activate
 * collecting money from their clients. Phase 2 adds the "Incassa" charge form.
 * Gated server-side: /api/connect/* returns 503 until Connect+Supabase are set.
 */
export default function PaymentsScreen({ session, onBack }: { session: Session; onBack: () => void }) {
  const t = useT();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'unavailable' | 'generic' | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };

  async function loadStatus() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/connect/status`, { headers: authHeaders });
      if (res.ok) setStatus(await res.json());
      else setError(res.status === 503 ? 'unavailable' : 'generic');
    } catch {
      setError('generic');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startOnboarding() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/connect/onboard`, { method: 'POST', headers: authHeaders, body: '{}' });
      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url; // hand off to Stripe-hosted onboarding
          return;
        }
      }
      setError(res.status === 503 ? 'unavailable' : 'generic');
    } catch {
      setError('generic');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell maxx-shell">
      <div className="settings-topbar">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> {t('common.back')}</button>
        <h1 className="settings-title">{t('pay.title')}</h1>
      </div>

      <section className="maxx-hero">
        <span className="maxx-badge"><Wallet size={14} /> {t('pay.badge')}</span>
        <h2 className="maxx-headline">{t('pay.tagline')}</h2>
        <p className="maxx-sub">{t('pay.intro')}</p>
      </section>

      <section className="maxx-card">
        {loading ? (
          <p className="maxx-cta-note"><Loader2 size={15} className="spin" /> {t('pay.loading')}</p>
        ) : status?.charges_enabled ? (
          <div className="pay-status-ok">
            <CheckCircle2 size={26} />
            <p>{t('pay.active')}</p>
          </div>
        ) : status?.onboarded ? (
          <>
            <p className="maxx-sub">{t('pay.pending')}</p>
            <button type="button" className="primary-button maxx-cta" onClick={startOnboarding} disabled={busy}>
              {busy ? <Loader2 size={15} className="spin" /> : <Wallet size={15} />} {t('pay.resume')}
            </button>
            <button type="button" className="panel-footer-link pay-refresh" onClick={loadStatus}>{t('pay.refresh')}</button>
          </>
        ) : (
          <>
            <p className="maxx-sub">{t('pay.notActive')}</p>
            <button type="button" className="primary-button maxx-cta" onClick={startOnboarding} disabled={busy}>
              {busy ? <Loader2 size={15} className="spin" /> : <Wallet size={15} />} {t('pay.activate')}
            </button>
          </>
        )}
        {error === 'unavailable' && <p className="maxx-cta-note" role="status">{t('pay.unavailable')}</p>}
        {error === 'generic' && <p className="maxx-cta-note" role="status">{t('pay.error')}</p>}
      </section>

      <p className="maxx-foot">{t('pay.foot')}</p>
    </main>
  );
}
