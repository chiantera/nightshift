import { useState } from 'react';
import { ArrowLeft, Sparkles, Check } from 'lucide-react';
import { useT, renderRich } from '../i18n/index.ts';

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
  const [tapped, setTapped] = useState(false);

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
        <button type="button" className="primary-button maxx-cta" onClick={() => setTapped(true)}>
          <Sparkles size={15} /> {t('maxx.cta')}
        </button>
        <p className="maxx-cta-note" role={tapped ? 'status' : undefined}>
          {tapped ? t('maxx.ctaTapped') : t('maxx.ctaNote')}
        </p>
      </section>

      <p className="maxx-foot">{t('maxx.foot')}</p>
      <p className="maxx-contact">
        {t('maxx.contact')}{' '}
        <a href="mailto:digitaltrainer.dev@gmail.com">digitaltrainer.dev@gmail.com</a>
      </p>
    </main>
  );
}
