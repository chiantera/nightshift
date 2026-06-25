import PanelModal from './PanelModal';
import { areSuggestionsEnabled, isOptedOut, optOutUntilLogin } from './seen';
import { openOverlay, closeOverlay } from './overlayGate';
import { useEffect, type ReactNode } from 'react';
import { useT } from '../i18n/index.ts';

/**
 * Pannello contestuale singolo. Appare a ogni trigger (nessun timer) finche' non
 * e' in opt-out e i suggerimenti sono ON. Exit (x / "Ho capito") chiude solo questa
 * volta; "Non mostrare piu'" opt-out fino al prossimo login. Mentre e' aperto mette in
 * pausa il tour spotlight (overlayGate) per evitare il deadlock di sovrapposizione.
 */
export default function InfoPanelModal({ id, title, children, onClose }: { id: string; title: string; children: ReactNode; onClose: () => void }) {
  const t = useT();
  const visible = areSuggestionsEnabled() && !isOptedOut(`ctx:${id}`);
  useEffect(() => { if (!visible) return; openOverlay(); return () => closeOverlay(); }, [visible]);
  if (!visible) return null;
  const optOut = () => { optOutUntilLogin(`ctx:${id}`); onClose(); };
  return (
    <PanelModal labelledBy={`ip-${id}`} onBackdrop={onClose}>
      <button type="button" className="panel-x" aria-label={t('common.close')} onClick={onClose}>&#x2715;</button>
      <h2 id={`ip-${id}`}>{title}</h2>
      <div className="panel-body">{children}</div>
      <div className="panel-nav">
        <button type="button" className="panel-next auth-tour-ok" onClick={onClose}>{t('common.gotIt')}</button>
      </div>
      <div className="panel-footer">
        <span />
        <button type="button" className="panel-footer-link" onClick={optOut}>{t('common.dontShowAgain')}</button>
      </div>
    </PanelModal>
  );
}
