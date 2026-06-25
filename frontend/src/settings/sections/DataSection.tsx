import { useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Download, Upload, Trash2, MessageSquareX, RotateCcw, PlayCircle } from 'lucide-react';
import { dbList, dbGet, dbSave, dbDelete, localOwnerIdFromSession } from '../../db';
import { exportPlainSpr, parseSprFile, decryptSprContainer } from '../../sprExport';
import { setSuggestionsEnabled } from '../../value/seen';
import { userKey } from '../../storage/userStorage';
import type { CaseAnalysis } from '../../domain/types';
import { useT } from '../../i18n/index.ts';

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
  const t = useT();
  const owner = localOwnerIdFromSession(session);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportAll = async () => {
    const cases = await dbList<CaseAnalysis>(owner);
    if (cases.length === 0) { alert(t('settings.data.nothingToExport')); return; }
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
        const password = prompt(t('import.encryptedPrompt'));
        if (!password) throw new Error(t('import.cancelled'));
        data = await decryptSprContainer<CaseAnalysis>(parsed.container, password);
      } else {
        if (!confirm(t('import.unprotectedConfirm'))) {
          throw new Error(t('import.cancelled'));
        }
        data = parsed.caseData;
      }
      if (!data.case_id || !data.case_title) throw new Error(t('import.invalidFile'));
      const existing = await dbGet(owner, data.case_id);
      if (existing && !confirm(t('import.duplicateConfirm', { title: data.case_title }))) {
        data.case_id = crypto.randomUUID();
        data.case_title += t('import.copySuffix');
      }
      await dbSave(owner, data as CaseAnalysis);
      window.location.reload();
    } catch (err) {
      alert(t('import.failed', { msg: (err as Error).message }));
    }
    e.target.value = '';
  };

  const clearChat = () => {
    if (!confirm(t('settings.data.clearChatConfirm'))) return;
    localStorage.removeItem(CHAT_KEY);
    alert(t('settings.data.chatCleared'));
  };

  const resetSuggestions = () => {
    setSuggestionsEnabled(true);
    const prefix = userKey('');
    Object.keys(localStorage)
      .filter(k => k.startsWith(prefix) && (k.includes(':optout:') || k.includes(':lastshown:') || k.endsWith(':onboarding:dismissed')))
      .forEach(k => localStorage.removeItem(k));
    alert(t('settings.data.suggestionsReset'));
  };

  const reviewTour = () => {
    localStorage.removeItem(userKey('onboarding:dismissed'));
    window.location.reload();
  };

  const wipeLocal = async () => {
    if (!confirm(t('settings.data.wipeConfirm1'))) return;
    if (!confirm(t('settings.data.wipeConfirm2'))) return;
    const cases = await dbList<CaseAnalysis>(owner);
    for (const c of cases) await dbDelete(owner, c.case_id);
    const prefix = userKey('');
    Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(CHAT_KEY);
    window.location.reload();
  };

  return (
    <section className="settings-section">
      <p className="settings-section-label">{t('settings.data.label')}</p>

      <div className="settings-row">
        <div><div className="settings-row-label">{t('settings.data.exportAll')}</div><div className="settings-row-desc">{t('settings.data.exportAllDesc')}</div></div>
        <button className="ghost-button settings-row-control" onClick={exportAll}><Download size={15} /> {t('common.export')}</button>
      </div>

      <div className="settings-row">
        <div><div className="settings-row-label">{t('settings.data.importOne')}</div><div className="settings-row-desc">{t('settings.data.importOneDesc')}</div></div>
        <button className="ghost-button settings-row-control" onClick={() => fileRef.current?.click()}><Upload size={15} /> {t('cases.import')}</button>
        <input ref={fileRef} type="file" accept=".spr,application/json" style={{ display: 'none' }} onChange={onImportFile} />
      </div>

      <div className="settings-row">
        <div><div className="settings-row-label">{t('settings.data.clearChat')}</div><div className="settings-row-desc">{t('settings.data.clearChatDesc')}</div></div>
        <button className="ghost-button settings-row-control" onClick={clearChat}><MessageSquareX size={15} /> {t('settings.data.clear')}</button>
      </div>

      <div className="settings-row">
        <div><div className="settings-row-label">{t('settings.data.resetSuggestions')}</div><div className="settings-row-desc">{t('settings.data.resetSuggestionsDesc')}</div></div>
        <button className="ghost-button settings-row-control" onClick={resetSuggestions}><RotateCcw size={15} /> {t('settings.data.resetBtn')}</button>
      </div>

      <div className="settings-row">
        <div><div className="settings-row-label">{t('settings.help.reviewTour')}</div><div className="settings-row-desc">{t('settings.help.reviewTourDesc')}</div></div>
        <button className="ghost-button settings-row-control" onClick={reviewTour}><PlayCircle size={15} /> {t('common.start')}</button>
      </div>

      <div className="settings-row">
        <div><div className="settings-row-label settings-danger">{t('settings.data.wipeLabel')}</div><div className="settings-row-desc">{t('settings.data.wipeDesc')}</div></div>
        <button className="ghost-button settings-row-control settings-danger" onClick={wipeLocal}><Trash2 size={15} /> {t('settings.data.delete')}</button>
      </div>
    </section>
  );
}
