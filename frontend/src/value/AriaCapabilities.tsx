import { MessageSquare, SlidersHorizontal, Mic, HeartPulse } from 'lucide-react';
import { useT, renderRich } from '../i18n/index.ts';

/** Riepilogo del valore di Aria. Riusato dal modale valore e dal pannello Profilo. */
export default function AriaCapabilities() {
  const t = useT();
  return (
    <div className="aria-caps">
      <p className="aria-caps-lede">{renderRich(t('caps.lede'))}</p>
      <ul className="aria-caps-list">
        <li><MessageSquare size={18} /><div><strong>{t('caps.1.title')}</strong><span>{t('caps.1.desc')}</span></div></li>
        <li><SlidersHorizontal size={18} /><div><strong>{t('caps.2.title')}</strong><span>{t('caps.2.desc')}</span></div></li>
        <li><Mic size={18} /><div><strong>{t('caps.3.title')}</strong><span>{t('caps.3.desc')}</span></div></li>
        <li><HeartPulse size={18} /><div><strong>{t('caps.4.title')}</strong><span>{t('caps.4.desc')}</span></div></li>
      </ul>
      <p className="aria-caps-foot">{t('caps.foot')}</p>
    </div>
  );
}
