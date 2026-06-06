import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import PanelModal from './PanelModal';
import { markSeen } from './seen';
import { openOverlay, closeOverlay } from './overlayGate';
import { recordAcceptance } from '../auth/sessionExpiry';
import {
  type AriaSetup,
  OUTPUT_STYLE_OPTIONS,
  SPECIALTY_OPTIONS,
  TONE_OPTIONS,
  loadAriaSetup,
  saveAriaSetup,
} from './personalization';

type Props = {
  editMode?: boolean;
  initialValues?: AriaSetup;
  onComplete?: () => void;
};

const KEY = 'spr:aria-setup-seen:v1';

function hasCompleteAriaSetup() {
  const setup = loadAriaSetup();
  return !!setup && setup.outputStyles.length > 0 && !!setup.tone;
}

/**
 * Setup compatto al primo avvio: invece di spiegare a lungo il valore di Aria,
 * raccoglie preferenze reali del trainer. Quelle preferenze vengono poi usate
 * come contesto nelle analisi e nelle bozze.
 */
export default function FirstRunWizard({ editMode = false, initialValues, onComplete }: Props) {
  const eligible = useMemo(() => editMode || !hasCompleteAriaSetup(), [editMode]);
  const [open, setOpen] = useState(eligible);
  const [specialties, setSpecialties] = useState<string[]>(() => initialValues?.specialties ?? []);
  const [otherSpecialty, setOtherSpecialty] = useState('');
  const [showOtherSpecialty, setShowOtherSpecialty] = useState(false);
  const [outputStyles, setOutputStyles] = useState<string[]>(() =>
    initialValues?.outputStyles ?? [OUTPUT_STYLE_OPTIONS[0]]
  );
  const [otherOutputStyle, setOtherOutputStyle] = useState('');
  const [showOtherOutputStyle, setShowOtherOutputStyle] = useState(false);
  const [tone, setTone] = useState(() => initialValues?.tone ?? TONE_OPTIONS[0]);
  const [accepted, setAccepted] = useState(() => editMode);
  useEffect(() => { if (!open) return; openOverlay(); return () => closeOverlay(); }, [open]);
  if (!open) return null;

  const toggleSpecialty = (item: string) => {
    setSpecialties(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };
  const toggleOutputStyle = (item: string) => {
    setOutputStyles(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };
  const finish = () => {
    const customSpecialty = otherSpecialty.trim();
    const customOutputStyle = otherOutputStyle.trim();
    saveAriaSetup({
      specialties: customSpecialty ? Array.from(new Set([...specialties, customSpecialty])) : specialties,
      outputStyles: customOutputStyle ? Array.from(new Set([...outputStyles, customOutputStyle])) : outputStyles,
      tone,
    });
    if (!editMode) {
      markSeen(KEY);
      recordAcceptance();
    }
    setOpen(false);
    onComplete?.();
  };
  const exitForNow = () => { setOpen(false); };

  return (
    <PanelModal labelledBy="frw-title" onBackdrop={exitForNow}>
      <button type="button" className="panel-x" aria-label="Esci per ora" onClick={exitForNow}>&#x2715;</button>
      <div className="panel-dots"><span className="panel-dot panel-dot--on" /><span className="panel-dot panel-dot--on" /></div>
      <h2 id="frw-title">{editMode ? 'Aggiorna configurazione Aria' : 'Configura Aria sul tuo modo di lavorare'}</h2>
      <p className="aria-caps-lede">
        Aria personalizza meglio quando conosce il tuo stile: obiettivi frequenti, formato delle bozze e tono da usare con i clienti.
      </p>

      <div className="aria-setup-block">
        <p className="aria-setup-label">Che clienti segui piu spesso?</p>
        <div className="aria-chip-grid">
          {SPECIALTY_OPTIONS.map(item => (
            <button
              key={item}
              type="button"
              className={`aria-choice-chip${specialties.includes(item) ? ' aria-choice-chip--on' : ''}`}
              onClick={() => toggleSpecialty(item)}
            >
              {specialties.includes(item) && <CheckCircle2 size={13} />}
              {item}
            </button>
          ))}
          <button
            type="button"
            className={`aria-choice-chip${showOtherSpecialty ? ' aria-choice-chip--on' : ''}`}
            onClick={() => setShowOtherSpecialty(v => !v)}
          >
            Altro
          </button>
        </div>
        {showOtherSpecialty && (
          <input
            className="aria-other-input"
            value={otherSpecialty}
            onChange={e => setOtherSpecialty(e.target.value)}
            placeholder="Es. endurance, senior, calisthenics…"
          />
        )}
      </div>

      <div className="aria-setup-block">
        <p className="aria-setup-label">Come vuoi ricevere le bozze?</p>
        <div className="aria-chip-grid">
          {OUTPUT_STYLE_OPTIONS.map(item => (
            <button
              key={item}
              type="button"
              className={`aria-choice-chip${outputStyles.includes(item) ? ' aria-choice-chip--on' : ''}`}
              onClick={() => toggleOutputStyle(item)}
            >
              {outputStyles.includes(item) && <CheckCircle2 size={13} />}
              {item}
            </button>
          ))}
          <button
            type="button"
            className={`aria-choice-chip${showOtherOutputStyle ? ' aria-choice-chip--on' : ''}`}
            onClick={() => setShowOtherOutputStyle(v => !v)}
          >
            Altro
          </button>
        </div>
        {showOtherOutputStyle && (
          <input
            className="aria-other-input"
            value={otherOutputStyle}
            onChange={e => setOtherOutputStyle(e.target.value)}
            placeholder="Es. checklist sessione, note vocali riordinate…"
          />
        )}
      </div>

      <div className="aria-setup-block">
        <p className="aria-setup-label">Tono preferito</p>
        <div className="aria-chip-grid aria-chip-grid--compact">
          {TONE_OPTIONS.map(item => (
            <button
              key={item}
              type="button"
              className={`aria-choice-chip${tone === item ? ' aria-choice-chip--on' : ''}`}
              onClick={() => setTone(item)}
            >
              {tone === item && <CheckCircle2 size={13} />}
              {item}
            </button>
          ))}
        </div>
      </div>

      {!editMode && (
        <label className="panel-accept">
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />
          <span>Ho capito: Aria prepara bozze da verificare. Il trainer resta responsabile e per aspetti di salute si rimanda a un medico qualificato.</span>
        </label>
      )}
      <div className="panel-nav">
        <button type="button" className="panel-next auth-tour-ok" disabled={!accepted} onClick={finish}>{editMode ? 'Aggiorna' : 'Salva e inizia'}</button>
      </div>
      {!editMode && (
        <div className="panel-footer">
          <button type="button" className="panel-footer-link" onClick={exitForNow}>Salta per ora</button>
        </div>
      )}
    </PanelModal>
  );
}
