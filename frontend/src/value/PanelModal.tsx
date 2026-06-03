import { type ReactNode } from 'react';

/** Shell visiva riusabile per i pannelli (backdrop scuro + card). */
export default function PanelModal({ children, labelledBy }: { children: ReactNode; labelledBy?: string }) {
  return (
    <div className="value-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="value-modal">{children}</div>
    </div>
  );
}
