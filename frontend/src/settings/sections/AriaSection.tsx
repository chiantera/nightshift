import { useState } from 'react';
import FirstRunWizard from '../../value/FirstRunWizard';
import { loadAriaSetup, type AriaSetup } from '../../value/personalization';
import { getPrefs, setPref } from '../settingsStore';

export default function AriaSection() {
  const [showEdit, setShowEdit] = useState(false);
  const [initial, setInitial] = useState<AriaSetup | undefined>(undefined);
  const [mode, setMode] = useState(getPrefs().defaultAnalysisMode);
  const [confirmPro, setConfirmPro] = useState(getPrefs().confirmBeforePro);
  const openEdit = () => { setInitial(loadAriaSetup() ?? undefined); setShowEdit(true); };
  return (
    <section className="settings-section">
      <p className="settings-section-label">Aria (AI)</p>
      <div className="settings-row">
        <div><div className="settings-row-label">Configurazione Aria</div><div className="settings-row-desc">Specialità, formato bozze, tono</div></div>
        <button className="ghost-button settings-row-control" onClick={openEdit}>Modifica</button>
      </div>
      <div className="settings-row">
        <div><div className="settings-row-label">Analisi predefinita</div></div>
        <div className="settings-row-control theme-toggle" role="group" aria-label="Analisi predefinita">
          {(['flash', 'pro'] as const).map(m => (
            <button key={m} type="button" className={mode === m ? 'active' : ''}
              onClick={() => { setPref('defaultAnalysisMode', m); setMode(m); }}>
              {m === 'flash' ? 'Flash' : 'Pro'}
            </button>
          ))}
        </div>
      </div>
      <label className="settings-row" style={{ cursor: 'pointer' }}>
        <div><div className="settings-row-label">Conferma prima di Pro</div><div className="settings-row-desc">Chiedi sempre conferma per le analisi Pro (consumano più crediti)</div></div>
        <input type="checkbox" className="settings-row-control" checked={confirmPro}
          onChange={e => { setPref('confirmBeforePro', e.target.checked); setConfirmPro(e.target.checked); }} />
      </label>
      {showEdit && <FirstRunWizard editMode initialValues={initial} onComplete={() => setShowEdit(false)} />}
    </section>
  );
}
