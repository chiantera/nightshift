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
  specialtyLabel,
  outputLabel,
  toneLabel,
} from './personalization';
import { useT } from '../i18n/index.ts';

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
  const t = useT();
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
      <button type="button" className="panel-x" aria-label={t('pers.exitForNow')} onClick={exitForNow}>&#x2715;</button>
      <div className="panel-dots"><span className="panel-dot panel-dot--on" /><span className="panel-dot panel-dot--on" /></div>
      <h2 id="frw-title">{editMode ? t('pers.editTitle') : t('pers.title')}</h2>
      <p className="aria-caps-lede">{t('pers.lede')}</p>

      <div className="aria-setup-block">
        <p className="aria-setup-label">{t('pers.specialtyQ')}</p>
        <div className="aria-chip-grid">
          {SPECIALTY_OPTIONS.map(item => (
            <button
              key={item}
              type="button"
              className={`aria-choice-chip${specialties.includes(item) ? ' aria-choice-chip--on' : ''}`}
              onClick={() => toggleSpecialty(item)}
            >
              {specialties.includes(item) && <CheckCircle2 size={13} />}
              {specialtyLabel(item)}
            </button>
          ))}
          <button
            type="button"
            className={`aria-choice-chip${showOtherSpecialty ? ' aria-choice-chip--on' : ''}`}
            onClick={() => setShowOtherSpecialty(v => !v)}
          >
            {t('pers.other')}
          </button>
        </div>
        {showOtherSpecialty && (
          <input
            className="aria-other-input"
            value={otherSpecialty}
            onChange={e => setOtherSpecialty(e.target.value)}
            placeholder={t('pers.specialtyOtherPlaceholder')}
          />
        )}
      </div>

      <div className="aria-setup-block">
        <p className="aria-setup-label">{t('pers.outputQ')}</p>
        <div className="aria-chip-grid">
          {OUTPUT_STYLE_OPTIONS.map(item => (
            <button
              key={item}
              type="button"
              className={`aria-choice-chip${outputStyles.includes(item) ? ' aria-choice-chip--on' : ''}`}
              onClick={() => toggleOutputStyle(item)}
            >
              {outputStyles.includes(item) && <CheckCircle2 size={13} />}
              {outputLabel(item)}
            </button>
          ))}
          <button
            type="button"
            className={`aria-choice-chip${showOtherOutputStyle ? ' aria-choice-chip--on' : ''}`}
            onClick={() => setShowOtherOutputStyle(v => !v)}
          >
            {t('pers.other')}
          </button>
        </div>
        {showOtherOutputStyle && (
          <input
            className="aria-other-input"
            value={otherOutputStyle}
            onChange={e => setOtherOutputStyle(e.target.value)}
            placeholder={t('pers.outputOtherPlaceholder')}
          />
        )}
      </div>

      <div className="aria-setup-block">
        <p className="aria-setup-label">{t('pers.toneQ')}</p>
        <div className="aria-chip-grid aria-chip-grid--compact">
          {TONE_OPTIONS.map(item => (
            <button
              key={item}
              type="button"
              className={`aria-choice-chip${tone === item ? ' aria-choice-chip--on' : ''}`}
              onClick={() => setTone(item)}
            >
              {tone === item && <CheckCircle2 size={13} />}
              {toneLabel(item)}
            </button>
          ))}
        </div>
      </div>

      {!editMode && (
        <label className="panel-accept">
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />
          <span>{t('pers.accept')}</span>
        </label>
      )}
      <div className="panel-nav">
        <button type="button" className="panel-next auth-tour-ok" disabled={!accepted} onClick={finish}>{editMode ? t('pers.update') : t('pers.saveStart')}</button>
      </div>
      {!editMode && (
        <div className="panel-footer">
          <button type="button" className="panel-footer-link" onClick={exitForNow}>{t('onboard.skip')}</button>
        </div>
      )}
    </PanelModal>
  );
}
