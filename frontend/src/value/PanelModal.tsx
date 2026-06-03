import { type ReactNode } from 'react';

/** Shell visiva riusabile per i pannelli (backdrop scuro + card).
 *  Clic sull'area scura (backdrop, non sulla card) chiama `onBackdrop` → l'utente
 *  non resta mai intrappolato sul velo che copre la UI. */
export default function PanelModal({ children, labelledBy, onBackdrop }: { children: ReactNode; labelledBy?: string; onBackdrop?: () => void }) {
  return (
    <div
      className="value-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={onBackdrop ? (e) => { if (e.target === e.currentTarget) onBackdrop(); } : undefined}
    >
      <div className="value-modal">{children}</div>
    </div>
  );
}
