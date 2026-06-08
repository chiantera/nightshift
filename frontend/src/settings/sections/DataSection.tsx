import { useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Download, Upload, Trash2, MessageSquareX, RotateCcw, PlayCircle } from 'lucide-react';
import { dbList, dbGet, dbSave, dbDelete, localOwnerIdFromSession } from '../../db';
import { exportPlainSpr, parseSprFile, decryptSprContainer } from '../../sprExport';
import { setSuggestionsEnabled } from '../../value/seen';
import { userKey } from '../../storage/userStorage';
import type { CaseAnalysis } from '../../domain/types';

const CHAT_KEY = 'spr:chat-messages';

function downloadSpr(container: unknown, baseName: string) {
  const blob = new Blob([JSON.stringify(container, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName.replace(/[^\w\s-]/g, '').trim() || 'scheda'}.spr`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataSection({ session }: { session: Session }) {
  const owner = localOwnerIdFromSession(session);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportAll = async () => {
    const cases = await dbList<CaseAnalysis>(owner);
    if (cases.length === 0) { alert('Nessuna scheda da esportare.'); return; }
    for (const c of cases) {
      downloadSpr(exportPlainSpr(c), c.case_title || c.case_id);
      // small gap so browsers don't drop rapid sequential downloads
      await new Promise(r => setTimeout(r, 250));
    }
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = await parseSprFile<CaseAnalysis>(text);
      let data: CaseAnalysis;
      if (parsed.kind === 'encrypted') {
        const password = prompt('Scheda protetta\n\nQuesto file .spr è cifrato. Inserisci la password usata al momento dell’esportazione.');
        if (!password) throw new Error('Importazione annullata');
        data = await decryptSprContainer<CaseAnalysis>(parsed.container, password);
      } else {
        if (!confirm('Questo .spr non è protetto da password. Importalo solo se proviene da una fonte affidabile.\n\nContinuare?')) {
          throw new Error('Importazione annullata');
        }
        data = parsed.caseData;
      }
      if (!data.case_id || !data.case_title) throw new Error('File non valido');
      const existing = await dbGet(owner, data.case_id);
      if (existing && !confirm(`La scheda "${data.case_title}" è già presente.\n\nOK = Sostituisci\nAnnulla = Salva come copia`)) {
        data.case_id = crypto.randomUUID();
        data.case_title += ' (importato)';
      }
      await dbSave(owner, data as CaseAnalysis);
      window.location.reload();
    } catch (err) {
      alert(`Importazione fallita: ${(err as Error).message}`);
    }
    e.target.value = '';
  };

  const clearChat = () => {
    if (!confirm('Svuotare la cronologia della chat con Aria su questo dispositivo?')) return;
    localStorage.removeItem(CHAT_KEY);
    alert('Chat svuotata.');
  };

  const resetSuggestions = () => {
    setSuggestionsEnabled(true);
    const prefix = userKey('');
    Object.keys(localStorage)
      .filter(k => k.startsWith(prefix) && (k.includes(':optout:') || k.includes(':lastshown:') || k.endsWith(':onboarding:dismissed')))
      .forEach(k => localStorage.removeItem(k));
    alert('Suggerimenti e aiuti contestuali riattivati.');
  };

  const reviewTour = () => {
    localStorage.removeItem(userKey('onboarding:dismissed'));
    window.location.reload();
  };

  const wipeLocal = async () => {
    if (!confirm('ATTENZIONE: questa azione elimina TUTTE le schede e i dati salvati su QUESTO dispositivo per il tuo account. I file .spr già esportati non vengono toccati, ma i dati non esportati andranno persi in modo irreversibile.\n\nVuoi continuare?')) return;
    if (!confirm('Conferma definitiva: cancellare tutti i dati locali di questo account su questo dispositivo?')) return;
    const cases = await dbList<CaseAnalysis>(owner);
    for (const c of cases) await dbDelete(owner, c.case_id);
    const prefix = userKey('');
    Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(CHAT_KEY);
    window.location.reload();
  };

  return (
    <section className="settings-section">
      <p className="settings-section-label">Dati</p>

      <div className="settings-row">
        <div><div className="settings-row-label">Esporta tutte le schede</div><div className="settings-row-desc">Scarica un file .spr per ogni scheda cliente</div></div>
        <button className="ghost-button settings-row-control" onClick={exportAll}><Download size={15} /> Esporta</button>
      </div>

      <div className="settings-row">
        <div><div className="settings-row-label">Importa una scheda</div><div className="settings-row-desc">Carica un file .spr esportato in precedenza</div></div>
        <button className="ghost-button settings-row-control" onClick={() => fileRef.current?.click()}><Upload size={15} /> Importa</button>
        <input ref={fileRef} type="file" accept=".spr,application/json" style={{ display: 'none' }} onChange={onImportFile} />
      </div>

      <div className="settings-row">
        <div><div className="settings-row-label">Svuota chat</div><div className="settings-row-desc">Cancella la cronologia della chat con Aria</div></div>
        <button className="ghost-button settings-row-control" onClick={clearChat}><MessageSquareX size={15} /> Svuota</button>
      </div>

      <div className="settings-row">
        <div><div className="settings-row-label">Reset suggerimenti</div><div className="settings-row-desc">Riattiva gli aiuti contestuali e i messaggi nascosti</div></div>
        <button className="ghost-button settings-row-control" onClick={resetSuggestions}><RotateCcw size={15} /> Reset</button>
      </div>

      <div className="settings-row">
        <div><div className="settings-row-label">Rivedi il tour</div><div className="settings-row-desc">Riavvia il tour di benvenuto guidato</div></div>
        <button className="ghost-button settings-row-control" onClick={reviewTour}><PlayCircle size={15} /> Avvia</button>
      </div>

      <div className="settings-row">
        <div><div className="settings-row-label settings-danger">Cancella dati locali del dispositivo</div><div className="settings-row-desc">Elimina tutte le schede e i dati locali di questo account su questo dispositivo</div></div>
        <button className="ghost-button settings-row-control settings-danger" onClick={wipeLocal}><Trash2 size={15} /> Cancella</button>
      </div>
    </section>
  );
}
