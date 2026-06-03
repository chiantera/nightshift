import { useState } from 'react';
import AriaCapabilities from './AriaCapabilities';
import { isSeen, markSeen, areSuggestionsEnabled } from './seen';

const KEY = 'spr:value-intro-seen';

/**
 * Modale valore mostrato UNA sola volta al primo avvio autenticato, prima del
 * tour funzionale (il "perché" prima del "come"). Dopo il dismiss non riappare.
 * Rispetta l'interruttore globale dei suggerimenti (Profilo).
 */
export default function ValueIntroModal() {
  const [show, setShow] = useState(() => areSuggestionsEnabled() && !isSeen(KEY));
  if (!show) return null;
  const close = () => { markSeen(KEY); setShow(false); };
  return (
    <div className="value-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="value-modal-title">
      <div className="value-modal">
        <div className="value-modal-kicker">Benvenuto in Digital Trainer</div>
        <h2 id="value-modal-title">Ecco cosa puoi fare con Aria</h2>
        <AriaCapabilities />
        <button type="button" className="auth-tour-ok value-modal-ok" onClick={close}>Iniziamo</button>
      </div>
    </div>
  );
}
