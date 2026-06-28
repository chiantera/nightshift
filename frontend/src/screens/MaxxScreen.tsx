import { useState } from 'react';
import { ArrowLeft, Sparkles, Check, Loader2 } from 'lucide-react';
import { useT, renderRich } from '../i18n/index.ts';
import { API } from '../config';

const MAXX_FEATURE_KEYS = [
  'maxx.feat.pro',
  'maxx.feat.depth',
  'maxx.feat.reco',
  'maxx.feat.priority',
  'maxx.feat.support',
];

/**
 * Maxx upgrade / pricing page. Reached from the gated Pro toggle's upsell.
 * The checkout is a placeholder — there is no payment processor wired yet, so the
 * CTA acknowledges intent without charging. Swap the CTA handler for the real
 * signup/payment flow (e.g. Stripe Checkout) when it exists.
 */
export default function MaxxScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<'idle' | 'unavailable'>('idle');

  async function startCheckout(plan: 'maxx' | 'daypass' = 'maxx') {
    setBusy(true);
    setNote('idle');
    try {
      const res = await fetch(`${API}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      <p className="maxx-foot">{t('maxx.foot')}</p>
      <p className="maxx-contact">
        {t('maxx.contact')}{' '}
        <a href="mailto:digitaltrainer.dev@gmail.com">digitaltrainer.dev@gmail.com</a>
      </p>
    </main>
  );
}
