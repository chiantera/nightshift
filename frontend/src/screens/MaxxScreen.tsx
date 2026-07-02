import { useEffect, useState } from 'react';
import { ArrowLeft, Sparkles, Check, Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { useT, renderRich, currentLocale } from '../i18n/index.ts';
import { API } from '../config';

const MAXX_FEATURE_KEYS = [
  'maxx.feat.pro',
  'maxx.feat.depth',
  'maxx.feat.reco',
  'maxx.feat.priority',
  'maxx.feat.support',
];

type Membership = { active: boolean; plan?: string | null; expires_at?: string | null };

/**
 * Maxx upgrade / pricing page. Reached from the gated Pro toggle's upsell.
 * Checks the caller's Maxx status on load — active members see a confirmation
 * card instead of the paywall, so they're never asked to pay again.
 */
export default function MaxxScreen({ onBack, session }: { onBack: () => void; session: Session }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<'idle' | 'unavailable'>('idle');
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API}/api/maxx/status`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (alive && r.ok) setMembership(await r.json());
      } catch { /* fall back to the paywall */ }
    })();
    return () => { alive = false; };
  }, [session]);

  async function startCheckout(plan: 'maxx' | 'daypass' = 'maxx') {
    setBusy(true);
    setNote('idle');
    try {
      const res = await fetch(`${API}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url; // hand off to Stripe-hosted checkout
          return;
        }
      }
      // 503 (not configured) / 502 / missing url → graceful fallback note
      setNote('unavailable');
    } catch {
      setNote('unavailable');
    } finally {
      setBusy(false);
    }
  }

  const isActive = !!membership?.active;
  const expiresLabel = membership?.expires_at
    ? new Date(membership.expires_at).toLocaleString(currentLocale() === 'en' ? 'en-GB' : 'it', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <main className="app-shell maxx-shell">
      <div className="settings-topbar">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> {t('common.back')}</button>
        <h1 className="settings-title">{t('maxx.title')}</h1>
      </div>

      <section className="maxx-hero">
        <span className="maxx-badge"><Sparkles size={14} /> {t('maxx.badge')}</span>
        <h2 className="maxx-headline">{t('maxx.tagline')}</h2>
        <p className="maxx-sub">{renderRich(t('maxx.intro'))}</p>
      </section>

      {isActive ? (
        <section className="maxx-card">
          <div className="maxx-plan">
            <span className="maxx-plan-name">
              {membership?.plan === 'daypass' ? t('maxx.active.planDaypass') : t('maxx.active.planMaxx')}
            </span>
            <span className="maxx-price"><Check size={26} /> {t('maxx.active.title')}</span>
            {expiresLabel && <span className="maxx-price-note">{t('maxx.active.until', { date: expiresLabel })}</span>}
          </div>
          <p className="maxx-cta-note">{renderRich(t('maxx.active.note'))}</p>
        </section>
      ) : (
        <section className="maxx-card">
          <div className="maxx-plan">
            <span className="maxx-plan-name">{t('maxx.plan')}</span>
            <span className="maxx-price">{t('maxx.price')}<em>{t('maxx.priceUnit')}</em></span>
            <span className="maxx-price-note">{t('maxx.priceNote')}</span>
          </div>
          <ul className="maxx-features">
            {MAXX_FEATURE_KEYS.map((k) => (
              <li key={k}><Check size={15} /> <span>{renderRich(t(k))}</span></li>
            ))}
          </ul>
          <button type="button" className="primary-button maxx-cta" onClick={() => startCheckout('maxx')} disabled={busy}>
            {busy ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />} {t('maxx.cta')}
          </button>
          <p className="maxx-cta-note" role={note === 'unavailable' ? 'status' : undefined}>
            {note === 'unavailable' ? t('maxx.ctaTapped') : t('maxx.ctaNote')}
          </p>
          <button type="button" className="maxx-test-link" onClick={() => startCheckout('daypass')} disabled={busy}>
            {t('maxx.daypassCta')}
          </button>
        </section>
      )}

      <p className="maxx-foot">{t('maxx.foot')}</p>
      <p className="maxx-contact">
        {t('maxx.contact')}{' '}
        <a href="mailto:digitaltrainer.dev@gmail.com">digitaltrainer.dev@gmail.com</a>
      </p>
    </main>
  );
}
