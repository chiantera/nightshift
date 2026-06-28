import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Wallet, CheckCircle2, Copy, ExternalLink, Nfc } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Session } from '@supabase/supabase-js';
import { useT } from '../i18n/index.ts';
import { API } from '../config';

type ConnectStatus = { onboarded: boolean; charges_enabled: boolean };

// Web NFC (Android Chrome only): write the payment URL to a physical tag the
// client can tap. Feature-detected — the button is hidden where unsupported.
const NFC_SUPPORTED = typeof window !== 'undefined' && 'NDEFReader' in window;

/**
 * Payments page (Stripe Connect). Phase 1: activate collecting (onboarding).
 * Phase 2: the "Incassa" form — enter amount + description → one-off payment
 * link (1% platform fee) the trainer shares with the client.
 * Gated server-side: /api/connect/* returns 503 until Connect+Supabase are set.
 */
export default function PaymentsScreen({ session, onBack }: { session: Session; onBack: () => void }) {
  const t = useT();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'unavailable' | 'generic' | null>(null);

  // Charge form (Phase 2)
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [genBusy, setGenBusy] = useState(false);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [chargeErr, setChargeErr] = useState<'amount' | 'generic' | null>(null);
  const [copied, setCopied] = useState(false);
  const [nfcState, setNfcState] = useState<'idle' | 'writing' | 'done' | 'error'>('idle');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };

  async function generatePayment() {
    const amt = parseFloat(amount.replace(',', '.'));
    if (!amt || amt < 0.5) { setChargeErr('amount'); return; }
    setGenBusy(true);
    setChargeErr(null);
    setPayUrl(null);
    setCopied(false);
    setNfcState('idle');
    try {
      const res = await fetch(`${API}/api/connect/payment`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ amount: amt, description: desc.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setPayUrl(data.url ?? null);
      } else {
        setChargeErr('generic');
      }
    } catch {
      setChargeErr('generic');
    } finally {
      setGenBusy(false);
    }
  }

  async function copyLink() {
    if (!payUrl) return;
    try {
      await navigator.clipboard.writeText(payUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  async function writeNfc() {
    if (!NFC_SUPPORTED || !payUrl) return;
    setNfcState('writing');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ndef = new (window as any).NDEFReader();
      await ndef.write({ records: [{ recordType: 'url', data: payUrl }] });
      setNfcState('done');
    } catch {
      setNfcState('error');
    }
  }

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
          <div className="pay-charge">
            <div className="pay-active-badge"><CheckCircle2 size={16} /> {t('pay.active')}</div>
            <h3 className="pay-charge-title">{t('pay.charge.title')}</h3>
            <label className="pay-field">
              <span>{t('pay.charge.amount')}</span>
              <div className="pay-amount-wrap">
                <span className="pay-amount-cur">€</span>
                <input
                  type="number" inputMode="decimal" min="0.5" step="0.5"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder={t('pay.charge.amountPh')}
                />
              </div>
            </label>
            <label className="pay-field">
              <span>{t('pay.charge.desc')}</span>
              <input
                type="text" value={desc} onChange={e => setDesc(e.target.value)}
                placeholder={t('pay.charge.descPh')} maxLength={120}
              />
            </label>
            <button type="button" className="primary-button maxx-cta" onClick={generatePayment} disabled={genBusy}>
              {genBusy ? <Loader2 size={15} className="spin" /> : <Wallet size={15} />} {t('pay.charge.generate')}
            </button>
            {chargeErr === 'amount' && <p className="maxx-cta-note" role="status">{t('pay.charge.amountErr')}</p>}
            {chargeErr === 'generic' && <p className="maxx-cta-note" role="status">{t('pay.charge.error')}</p>}
            {payUrl && (
              <div className="pay-result">
                <p className="pay-result-label">{t('pay.charge.linkReady')}</p>
                <div className="pay-qr"><QRCodeSVG value={payUrl} size={168} marginSize={2} /></div>
                <p className="pay-qr-hint">{t('pay.charge.qrHint')}</p>
                <div className="pay-link-row">
                  <input type="text" readOnly value={payUrl} onFocus={e => e.currentTarget.select()} />
                </div>
                <div className="pay-link-actions">
                  <button type="button" className="secondary-button" onClick={copyLink}>
                    <Copy size={14} /> {copied ? t('pay.charge.copied') : t('pay.charge.copy')}
                  </button>
                  <a className="secondary-button" href={payUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} /> {t('pay.charge.open')}
                  </a>
                </div>
                {NFC_SUPPORTED && (
                  <>
                    <button type="button" className="secondary-button pay-nfc-btn" onClick={writeNfc} disabled={nfcState === 'writing'}>
                      {nfcState === 'writing' ? <Loader2 size={14} className="spin" /> : <Nfc size={14} />} {t('pay.charge.nfc')}
                    </button>
                    {nfcState === 'writing' && <p className="maxx-cta-note" role="status">{t('pay.charge.nfcWriting')}</p>}
                    {nfcState === 'done' && <p className="maxx-cta-note" role="status">{t('pay.charge.nfcDone')}</p>}
                    {nfcState === 'error' && <p className="maxx-cta-note" role="status">{t('pay.charge.nfcError')}</p>}
                  </>
                )}
              </div>
            )}
            <p className="maxx-cta-note">{t('pay.charge.fee')}</p>
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
