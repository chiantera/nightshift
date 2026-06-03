import { useEffect, useMemo, useState } from 'react';
import PanelModal from './PanelModal';
import AriaCapabilities from './AriaCapabilities';
import { shouldShowHourly, markShown, optOutUntilLogin } from './seen';
import { openOverlay, closeOverlay } from './overlayGate';
import { recordAcceptance } from '../auth/sessionExpiry';

const KEY = 'value-wizard';

/**
 * Wizard sequenziale al primo avvio (e a cadenza oraria). Pannelli: benvenuto ->
 * come usare Aria -> privacy -> avviso+checkbox. La checkbox dell'avviso e' SEMPRE
 * obbligatoria per superare l'ultimo pannello ('Iniziamo' disabilitato finche' non e'
 * spuntata); accettarla aggiorna il timestamp 72h. Footer: 'Esci per ora' (ritorna tra
 * ~1h) / 'Non mostrare piu'' (fino al login).
 */
export default function FirstRunWizard() {
  const eligible = useMemo(() => shouldShowHourly(KEY), []);
  const [open, setOpen] = useState(eligible);
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  useEffect(() => { if (!open) return; openOverlay(); return () => closeOverlay(); }, [open]);
  if (!open) return null;

  const finish = () => { markShown(KEY); recordAcceptance(); setOpen(false); };
  const exitForNow = () => { markShown(KEY); setOpen(false); };
  const optOut = () => { optOutUntilLogin(KEY); setOpen(false); };

  const panels = [
    {
      title: 'Benvenuto in Digital Trainer',
      body: (
        <p className="aria-caps-lede">
          Digital Trainer non tiene solo l&apos;elenco dei tuoi clienti. Aria lavora sui dettagli reali di
          ognuno e ti prepara le bozze su cui lavori, in una frazione del tempo.{' '}
          <strong>Aria propone, tu decidi e personalizzi.</strong>
        </p>
      ),
    },
    { title: 'Cosa puoi fare con Aria', body: <AriaCapabilities /> },
    {
      title: 'Privacy',
      body: (
        <p className="aria-caps-lede">
          I dati dei tuoi clienti restano <strong>solo su questo dispositivo</strong>. Invii all&apos;AI
          solo ci&ograve; che scegli; usa pseudonimi o la funzione &laquo;Anonimizza&raquo; quando opportuno.
        </p>
      ),
    },
    {
      title: 'Prima di iniziare',
      isWarning: true,
      body: (
        <p className="aria-caps-lede">
          L&apos;intelligenza artificiale pu&ograve; sbagliare: <strong>controlla sempre</strong> ogni contenuto
          generato. Sei tu il professionista responsabile; per qualsiasi aspetto di salute rimanda a
          un medico qualificato. Digital Trainer &egrave; uno strumento di supporto e bozza, non fornisce
          consulenza, diagnosi o prescrizioni mediche.
        </p>
      ),
    },
  ];
  const current = panels[step];
  const last = step === panels.length - 1;
  const canAdvance = !current.isWarning || accepted;

  return (
    <PanelModal labelledBy="frw-title" onBackdrop={exitForNow}>
      <button type="button" className="panel-x" aria-label="Esci per ora" onClick={exitForNow}>&#x2715;</button>
      <div className="panel-dots">{panels.map((_, i) => <span key={i} className={`panel-dot${i === step ? ' panel-dot--on' : ''}`} />)}</div>
      <h2 id="frw-title">{current.title}</h2>
      <div className="panel-body">{current.body}</div>
      {current.isWarning && (
        <label className="panel-accept">
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />
          <span>Ho letto e compreso: Aria prepara bozze da verificare, non decisioni.</span>
        </label>
      )}
      <div className="panel-nav">
        {step > 0 && <button type="button" className="panel-back" onClick={() => setStep(step - 1)}>Indietro</button>}
        {!last
          ? <button type="button" className="panel-next auth-tour-ok" onClick={() => setStep(step + 1)}>Avanti &#x2192;</button>
          : <button type="button" className="panel-next auth-tour-ok" disabled={!canAdvance} onClick={finish}>Iniziamo</button>}
      </div>
      <div className="panel-footer">
        <button type="button" className="panel-footer-link" onClick={exitForNow}>Esci per ora</button>
        <button type="button" className="panel-footer-link" onClick={optOut}>Non mostrare pi&ugrave;</button>
      </div>
    </PanelModal>
  );
}
