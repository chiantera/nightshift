import { MessageSquare, SlidersHorizontal, Mic, HeartPulse } from 'lucide-react';

/** Riepilogo del valore di Aria. Riusato dal modale valore e dal pannello Profilo. */
export default function AriaCapabilities() {
  return (
    <div className="aria-caps">
      <p className="aria-caps-lede">
        Digital Trainer non tiene solo l'elenco dei tuoi clienti. Aria lavora sui dettagli reali di
        ognuno — condizioni, progressi, obiettivi — e ti prepara le bozze su cui lavori, in una
        frazione del tempo. <strong>Aria propone, tu decidi e personalizzi.</strong>
      </p>
      <ul className="aria-caps-list">
        <li><MessageSquare size={18} /><div><strong>Chiedile qualsiasi cosa su un cliente</strong><span>Dalla chat: conosce già la scheda e risponde all'istante con consigli e dubbi.</span></div></li>
        <li><SlidersHorizontal size={18} /><div><strong>Istruzioni aggiuntive</strong><span>Prima di un'analisi dici ad Aria cosa guardare: orienti il risultato prima di generarlo.</span></div></li>
        <li><Mic size={18} /><div><strong>Detta a voce in palestra</strong><span>Registri la sessione parlando: Aria la struttura nella scheda.</span></div></li>
        <li><HeartPulse size={18} /><div><strong>Si adatta al cliente reale</strong><span>Tiene conto di condizioni e limiti; per dieta e salute rimanda al medico/nutrizionista.</span></div></li>
      </ul>
      <p className="aria-caps-foot">
        Da questi dati Aria bozza piano settimanale, scheda mensile, report progresso, nota
        nutrizionale orientativa e messaggio al cliente — sui dati reali della scheda, mai inventati.
        Tu verifichi e consegni.
      </p>
    </div>
  );
}
