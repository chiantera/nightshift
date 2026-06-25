import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, FileText, Globe, Loader2,
  HeartPulse, Mic, ShieldCheck, Sparkles, Upload, X,
} from 'lucide-react';
import { API } from '../config';
import type { UploadQueueItem } from '../domain/types';
import { ARIA_FOCUS_PRESETS, focusLabel, focusInstruction } from '../value/personalization';
import { useT } from '../i18n/index.ts';

export default function MultiFileUploadDrawer({
  queue,
  onClose,
  onAddFiles,
  onRemoveItem,
  onRetryItem,
  onAddTextItem,
  processing,
  onAnalyze,
}: {
  queue: UploadQueueItem[];
  onClose: () => void;
  onAddFiles: (files: File[], category: 'scheda' | 'documento_medico') => void;
  onRemoveItem: (id: string) => void;
  onRetryItem: (id: string) => void;
  onAddTextItem: (text: string, name?: string, category?: 'scheda' | 'documento_medico') => void;
  processing: boolean;
  onAnalyze?: (initialInstructions?: string) => void;
}) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<'scheda' | 'documento_medico'>('scheda');
  const [dragging, setDragging] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pendingItemName, setPendingItemName] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlName, setUrlName] = useState('');
  const [urlFetching, setUrlFetching] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [selectedFocusId, setSelectedFocusId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  // When the drawer opens, drop the cursor straight into the text box so the
  // user can start typing without first choosing what to do. (preventScroll so
  // it doesn't yank the drop-zone out of view.)
  useEffect(() => {
    pasteRef.current?.focus({ preventScroll: true });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append('file', blob, 'nota_vocale.webm');
          const res = await fetch(`${API}/api/transcribe`, { method: 'POST', body: fd });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.text) {
            setPasteText(prev => prev ? prev + '\n\n' + data.text : data.text);
            setPendingItemName(t('upload.voiceNote'));
          } else {
            alert(t('upload.transcribeFailed'));
          }
        } finally {
          setTranscribing(false);
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      alert(t('upload.micUnavailable'));
    }
  }, [t]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onAddFiles(files, activeTab);
  }, [onAddFiles, activeTab]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onAddFiles(files, activeTab);
    e.target.value = '';
  }, [onAddFiles, activeTab]);

  const handleUrlImport = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    setUrlFetching(true);
    setUrlError('');
    try {
      const res = await fetch(`${API}/api/fetch-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name: urlName.trim() }),
      });
      if (!res.ok) throw new Error(t('upload.fetchError', { status: res.status }));
      const data = await res.json();
      const extracted: string = data.extracted_text ?? '';
      setPasteText(prev => prev ? prev + '\n\n' + extracted : extracted);
      setPendingItemName(urlName.trim() || url);
      setUrlInput('');
      setUrlName('');
    } catch (e) {
      setUrlError((e as Error).message);
    } finally {
      setUrlFetching(false);
    }
  }, [urlInput, urlName, t]);

  const doneCount = queue.filter(i => i.status === 'done' && i.text).length;
  const medicalDoneCount = queue.filter(i => i.status === 'done' && i.category === 'documento_medico').length;
  const schedaDoneCount = queue.filter(i => i.status === 'done' && i.category !== 'documento_medico').length;
  const errorCount = queue.filter(i => i.status === 'error').length;
  const isUploading = queue.some(i => i.status === 'uploading' || i.status === 'pending');
  const isGiur = activeTab === 'documento_medico';
  const selectedFocus = selectedFocusId ? ARIA_FOCUS_PRESETS.find(p => p.id === selectedFocusId) : null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="source-drawer upload-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />

        <div className="drawer-header">
          <div>
            <p className="eyebrow">{t('upload.eyebrow')}</p>
            <h2>{t('upload.title')}</h2>
          </div>
          <button title={t('common.close')} onClick={onClose} className="ghost-button"><X size={18} /></button>
        </div>

        <div className="upload-tab-strip">
          <button className={`upload-tab${!isGiur ? ' active' : ''}`} onClick={() => setActiveTab('scheda')}>
            <FileText size={14} /> {t('upload.tab.sheet')}
          </button>
          <button className={`upload-tab${isGiur ? ' active doc' : ''}`} onClick={() => setActiveTab('documento_medico')}>
            <HeartPulse size={14} /> {t('upload.tab.medical')}
          </button>
        </div>

        {isGiur && (
          <div className="upload-url-section">
            <label className="upload-url-label">{t('upload.url.label')}</label>
            <div className="upload-url-row">
              <input
                className="upload-url-input"
                type="url"
                placeholder={t('upload.url.placeholder')}
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && urlInput.trim()) handleUrlImport(); }}
              />
            </div>
            <div className="upload-url-row" style={{ marginTop: 6 }}>
              <input
                className="upload-url-input"
                type="text"
                placeholder={t('upload.url.namePlaceholder')}
                value={urlName}
                onChange={e => setUrlName(e.target.value)}
              />
              <button
                className="primary-button upload-url-btn"
                disabled={!urlInput.trim() || urlFetching}
                onClick={handleUrlImport}
              >
                {urlFetching ? <Loader2 size={13} className="spin" /> : <Globe size={13} />}
                {urlFetching ? t('upload.url.importing') : t('cases.import')}
              </button>
            </div>
            {urlError && (
              <p className="upload-url-hint" style={{ color: 'var(--critical)', marginTop: 6 }}>
                {t('upload.url.errorPrefix', { msg: urlError })}
              </p>
            )}
            <p className="upload-url-hint">{t('upload.url.hint')}</p>
          </div>
        )}

        <label
          className={`drop-zone${dragging ? ' dragging' : ''}${isGiur ? ' drop-zone--doc' : ''}`}
          style={{ cursor: 'pointer' }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="drop-zone-icon-container">
            {isGiur ? <HeartPulse size={28} /> : <Upload size={32} />}
          </div>
          <p>{isGiur ? t('upload.drop.medical') : t('upload.drop.normal')}</p>
          <small>{isGiur ? t('upload.drop.medicalHint') : t('upload.drop.normalHint')}</small>
          <input ref={fileRef} type="file" style={{ display: 'none' }} multiple accept=".pdf,.docx,.pptx,.xlsx,.txt,.csv,.rtf,image/*,audio/*" onChange={onFileChange} />
        </label>

        {queue.length === 0 && (
          <div className="upload-privacy-notice">
            <ShieldCheck size={13} />
            <span>
              {isGiur ? t('upload.privacy.medical') : t('upload.privacy.normal')}
            </span>
          </div>
        )}

        {queue.length > 0 && (
          <div className="upload-queue">
            {queue.map(item => (
              <div key={item.id} className={`upload-queue-item ${item.status}`}>
                <div className="upload-queue-icon">
                  {item.status === 'uploading' ? (
                    <Loader2 size={18} className="spin text-sky" />
                  ) : item.status === 'error' ? (
                    <AlertTriangle size={18} className="text-red" />
                  ) : item.status === 'done' ? (
                    <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                  ) : (
                    <FileText size={18} />
                  )}
                </div>
                <div className="upload-queue-info">
                  <div className="upload-queue-name">
                    {item.description || item.name}
                    {item.category === 'documento_medico'
                      ? <span className="upload-cat-badge upload-cat-badge--medico">{t('upload.badge.medical')}</span>
                      : <span className="upload-cat-badge upload-cat-badge--doc">{t('upload.badge.sheet')}</span>
                    }
                  </div>
                  <div className="upload-queue-size">
                    {item.name !== (item.description || item.name) && item.name}
                    {item.size > 0 && ` · ${(item.size / 1024).toFixed(0)} KB`}
                  </div>
                </div>
                <div className="upload-queue-status">
                  {item.status === 'pending' && <span className="status-badge pending">{t('upload.status.pending')}</span>}
                  {item.status === 'uploading' && <span className="status-badge uploading">{t('upload.status.uploading')}</span>}
                  {item.status === 'done' && <span className="status-badge done">{t('upload.status.done')}</span>}
                  {item.status === 'error' && (
                    <span className="status-badge error" onClick={() => onRetryItem(item.id)} title={item.error} style={{ cursor: 'pointer' }}>
                      {t('upload.status.retry')}
                    </span>
                  )}
                </div>
                {(item.status === 'pending' || item.status === 'done' || item.status === 'error') && (
                  <button className="upload-queue-action" onClick={() => onRemoveItem(item.id)} title={t('upload.remove')}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {doneCount > 0 && (
          <div className="upload-aria-preview">
            <div>
              <p className="eyebrow">{t('upload.ready.eyebrow')}</p>
              <h3>{t('upload.ready.title')}</h3>
            </div>
            <div className="upload-aria-signal-row">
              {schedaDoneCount > 0 && <span>{t('upload.ready.sessions', { n: schedaDoneCount })}</span>}
              {medicalDoneCount > 0 && <span>{t('upload.ready.medical', { n: medicalDoneCount })}</span>}
              <span>{t('upload.ready.sources', { n: doneCount })}</span>
            </div>
            <p>{t('upload.ready.focusHint')}</p>
            <div className="upload-focus-row">
              {ARIA_FOCUS_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  className={`upload-focus-chip${selectedFocusId === preset.id ? ' upload-focus-chip--on' : ''}`}
                  onClick={() => setSelectedFocusId(prev => prev === preset.id ? null : preset.id)}
                >
                  {focusLabel(preset)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="upload-field">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label className={`upload-text-label${pasteText ? ' upload-text-label--ready' : ''}`}>
              {pasteText
                ? (pendingItemName ? t('upload.text.ready', { name: pendingItemName }) : t('upload.text.review'))
                : (isGiur ? t('upload.text.docLabel') : t('upload.text.label'))}
            </label>
            {!isGiur && (
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={transcribing}
                className={`mic-btn${recording ? ' mic-btn--recording' : ''}`}
              >
                {transcribing
                  ? <><Loader2 size={12} className="spin" /> {t('upload.transcribing')}</>
                  : recording
                    ? <><span className="mic-btn-dot" /> {t('upload.stop')}</>
                    : <><Mic size={12} /> {t('upload.voiceNote')}</>
                }
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <textarea
              ref={pasteRef}
              className={`upload-textarea${pasteText ? ' upload-textarea--has-content' : ''}`}
              placeholder={t('upload.text.placeholder')}
              value={pasteText}
              onChange={e => { setPasteText(e.target.value); if (!e.target.value) setPendingItemName(''); }}
              rows={4}
              style={{ flex: 1, minHeight: 80 }}
            />
            <button
              className="primary-button"
              data-tour="add-in-upload"
              disabled={!pasteText.trim()}
              onClick={() => {
                onAddTextItem(pasteText.trim(), pendingItemName || undefined, activeTab);
                setPasteText('');
                setPendingItemName('');
              }}
              style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap', padding: '8px 12px', fontSize: '0.78rem' }}
            >
              {t('upload.add')}
            </button>
          </div>
        </div>

        <div className="upload-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div>
            {isUploading && (
              <div className="upload-status-processing">
                <Loader2 size={14} className="spin" />
                <span>{t('upload.processing')}</span>
              </div>
            )}
            {!isUploading && doneCount > 0 && (
              <div className="upload-status-done">{t('upload.donePlural', { n: doneCount })}</div>
            )}
            {errorCount > 0 && <span className="upload-status-error">{t('upload.errorPlural', { n: errorCount })}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="ghost-button" onClick={onClose}>{t('common.close')}</button>
            {doneCount > 0 && onAnalyze && (
              <button className="primary-button upload-analyze-btn" onClick={() => onAnalyze(selectedFocus ? focusInstruction(selectedFocus) : undefined)}>
                <Sparkles size={15} /> {t('upload.startAnalysis')}
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
