import PanelModal from './PanelModal';
import { areSuggestionsEnabled, isOptedOut, optOutUntilLogin } from './seen';
import { type ReactNode } from 'react';

/**
 * Pannello contestuale singolo. Appare a ogni trigger (nessun timer) finche' non
 * e' in opt-out e i suggerimenti sono ON. Exit (x / "Ho capito") chiude solo questa
 * volta; "Non mostrare piu'" opt-out fino al prossimo login.
 */
export default function InfoPanelModal({ id, title, children, onClose }: { id: string; title: string; children: ReactNode; onClose: () => void }) {
  if (!areSuggestionsEnabled() || isOptedOut(`ctx:${id}`)) return null;
  const optOut = () => { optOutUntilLogin(`ctx:${id}`); onClose(); };
  return (
    <PanelModal labelledBy={`ip-${id}`}>
      <button type="button" className="panel-x" aria-label="Chiudi" onClick={onClose}>&#x2715;</button>
      <h2 id={`ip-${id}`}>{title}</h2>
      <div className="panel-body">{children}</div>
      <div className="panel-nav">
        <button type="button" className="panel-next auth-tour-ok" onClick={onClose}>Ho capito</button>
      </div>
      <div className="panel-footer">
        <span />
        <button type="button" className="panel-footer-link" onClick={optOut}>Non mostrare pi&ugrave;</button>
      </div>
    </PanelModal>
  );
}
