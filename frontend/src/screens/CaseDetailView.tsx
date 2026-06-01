import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, BookOpen,
  CalendarClock, CheckCircle2, CheckSquare, ChevronDown, ChevronRight,
  Clock, Copy, Eye, EyeOff, FileText, Gavel, Loader2, MessageSquare, Mic, Plus, RefreshCw,
  Scale, Search, Share2, ShieldAlert, ShieldCheck, ShieldOff, Sparkles,
  Square, Trash2, Upload, Users, X, Zap,
} from 'lucide-react';
import { type Session } from '@supabase/supabase-js';
import { API } from '../config';
import { wizardBus } from '../onboarding/wizardBus';
import { formatDate, formatDateFull, formatShortDate } from '../dateUtils';
import { dbGet, dbSave, localOwnerIdFromSession } from '../db';
import { exportEncryptedSpr, exportPlainSpr } from '../sprExport';
import {
  addDraftArtifact,
  buildDraftPrompt,
  createDraftArtifact,
  DRAFT_PLAINTEXT_EXPORT_WARNING,
  draftTypeLabel,
  exportDraftArtifact,
  updateDraftArtifact,
  type DraftArtifact,
  type DraftArtifactType,
} from '../draftArtifacts';
import { PIANO_PROMPTS } from '../prompts/pianoDrafts';
import { REDACT_APPLY_PROMPT, REDACT_DETECT_PROMPT } from '../prompts/redaction';
import { buildCaseContext } from '../domain/caseContext';
import { buildUserContextMaterial, mergeWithAi } from '../domain/caseMerge';
import { applyRedactionToCase, mergeRedactionRules } from '../domain/redaction';
import { riskColor, riskIcon, riskLabel } from '../domain/helpers';
import type {
  AnalisiProgressi,
  Appuntamento,
  ApproccioAllenamento,
  BilancioProgressi,
  CaseAnalysis,
  Contradiction,
  EvidenceItem,
  LimitazioneFisica,
  Material,
  Obiettivo,
  OpenQuestion,
  Person,
  RawDocument,
  RedactionRule,
  SourceRef,
  StepObiettivo,
  TabId,
  TimelineEvent,
  UploadQueueItem,
  UserProfile,
  ValutazioneAderenza,
} from '../domain/types';
import AriaPromptBar from '../components/AriaPromptBar';

const MultiFileUploadDrawer = React.lazy(() => import('../components/MultiFileUploadDrawer'));

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(v: number) { return `${Math.round(v * 100)}%`; }

function deadlineTypeLabel(t: Appuntamento['deadline_type']) {
  return ({ sessione_pt: 'Sessione PT', check_in: 'Check-in', gara: 'Gara/Evento', visita_medica: 'Visita medica', altro: 'Altro' })[t];
}

function stepStatusColor(s: StepObiettivo['status']) {
  return ({ raggiunto: '#22c55e', in_corso: '#3b82f6', plateau: '#f97316', non_avviato: '#6b7280' })[s];
}
function stepStatusLabel(s: StepObiettivo['status']) {
  return ({ raggiunto: 'Raggiunto', in_corso: 'In corso', plateau: 'Plateau', non_avviato: 'Non avviato' })[s];
}

function aderenzaRoleLabel(r: ValutazioneAderenza['role']) {
  return ({ cliente: 'Cliente', medico: 'Medico', fisioterapista: 'Fisioterapista', nutrizionista: 'Nutrizionista', expert: 'Esperto' })[r];
}

function tipoApproccioLabel(t: string) {
  return ({
    periodizzazione: 'Periodizzazione', sovraccarico_progressivo: 'Sovraccarico progressivo',
    deload: 'Deload', nutrizione: 'Nutrizione', recupero: 'Recupero', altro: 'Altro',
  })[t] ?? t;
}

function limitazioneTipoLabel(t: string) {
  return ({
    infortunio: 'Infortunio', controindicazione_medica: 'Controindicazione medica',
    limitazione_tecnica: 'Limitazione tecnica', altro: 'Altro',
  })[t] ?? t;
}

function markdownToLines(md: string) { return md.split('\n').filter(l => l.trim()); }

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    timerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);
  return { toast, showToast, dismissToast: () => setToast(null) };
}

function useCompletedTasks(caseId: string) {
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem('plt_tasks') ?? '[]')); }
    catch { return new Set<string>(); }
  });
  const key = (dlTitle: string, idx: number) => `${caseId}|${dlTitle}|${idx}`;
  const toggle = useCallback((dlTitle: string, idx: number) => {
    setCompleted(prev => {
      const next = new Set(prev);
      const k = `${caseId}|${dlTitle}|${idx}`;
      if (next.has(k)) next.delete(k); else next.add(k);
      try { localStorage.setItem('plt_tasks', JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [caseId]);
  const isDone = useCallback((dlTitle: string, idx: number) => completed.has(key(dlTitle, idx)), [completed, caseId]);
  const doneCount = useCallback((dlTitle: string, total: number) => {
    let n = 0; for (let i = 0; i < total; i++) if (completed.has(key(dlTitle, i))) n++;
    return n;
  }, [completed, caseId]);
  return { toggle, isDone, doneCount };
}

function useRedactionRules() {
  const [globalRules, setGlobalRulesState] = useState<RedactionRule[]>(() => {
    try { return JSON.parse(localStorage.getItem('plt_redaction_rules') ?? '[]'); }
    catch { return []; }
  });
  const setGlobalRules = useCallback((rules: RedactionRule[]) => {
    setGlobalRulesState(rules);
    try { localStorage.setItem('plt_redaction_rules', JSON.stringify(rules)); } catch {}
  }, []);
  return { globalRules, setGlobalRules };
}

// ── Small components ─────────────────────────────────────────────────────────

function ToastNotification({ message, type, onDismiss }: { message: string; type: 'success' | 'info' | 'error'; onDismiss: () => void }) {
  return (
    <div className={`toast toast-${type}`} onClick={onDismiss}>
      {type === 'success' ? <CheckCircle2 size={15} /> : type === 'error' ? <AlertTriangle size={15} /> : <Sparkles size={15} />}
      <span>{message}</span>
    </div>
  );
}

function SourceBadge({ refItem, onSelect }: { refItem: SourceRef; onSelect: (s: SourceRef) => void }) {
  return (
    <button className="source-badge" title="Visualizza il documento sorgente" onClick={() => onSelect(refItem)}>
      <FileText size={12} /> {refItem.source_name} · {pct(refItem.confidence)}
    </button>
  );
}

function SourceRow({ refs, onSelect }: { refs: SourceRef[]; onSelect: (s: SourceRef) => void }) {
  if (!refs?.length) return null;
  return <div className="source-row">{refs.map(r => <SourceBadge key={r.quote + r.source_name} refItem={r} onSelect={onSelect} />)}</div>;
}

function StrengthBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="strength-bar-wrap">
      <div className="strength-bar-labels">
        <span>{label}</span><span>{pct(value)}</span>
      </div>
      <div className="strength-bar-track">
        <div className="strength-bar-fill" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function Editable({ value, onChange, placeholder, multiline, className, readOnly }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (!editing) return;
    const el = multiline ? textareaRef.current : inputRef.current;
    el?.focus();
    if (el instanceof HTMLInputElement) el.select();
  }, [editing, multiline]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next !== value) onChange(next);
  };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          className={`editable-input editable-input-multi ${className ?? ''}`}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Escape') cancel();
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
          }}
          rows={Math.max(2, Math.min(10, draft.split('\n').length + 1))}
          placeholder={placeholder}
        />
      );
    }
    return (
      <input
        ref={inputRef}
        className={`editable-input ${className ?? ''}`}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') cancel();
        }}
        placeholder={placeholder}
      />
    );
  }

  const display = value || (placeholder ?? 'Tocca per scrivere…');
  if (readOnly) {
    return <span className={`editable ${className ?? ''}`}>{display}</span>;
  }
  return (
    <span
      className={`editable${value ? '' : ' editable-empty'} ${className ?? ''}`}
      onClick={() => setEditing(true)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true); } }}
      title="Tocca per modificare"
    >
      {display}
    </span>
  );
}

function RowDelete({ onClick, label }: { onClick: () => void; label?: string }) {
  return (
    <button
      className="row-delete-btn"
      onClick={e => { e.stopPropagation(); if (confirm(label ? `Eliminare "${label}"?` : 'Eliminare questa voce?')) onClick(); }}
      title="Elimina voce"
    >
      <Trash2 size={13} />
    </button>
  );
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button title="Aggiungi nuova riga" className="add-row-btn" onClick={onClick}>
      <Plus size={14} /> {label}
    </button>
  );
}

function EditableSelect<T extends string>({ value, options, onChange, className }: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <select
      className={`editable-select ${className ?? ''}`}
      value={value}
      onChange={e => onChange(e.target.value as T)}
      onClick={e => e.stopPropagation()}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function EditablePercent({ value, onChange, className }: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(Math.round(value * 100)));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setDraft(String(Math.round(value * 100))); }, [value]);
  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    const n = Math.max(0, Math.min(100, Number(draft) || 0));
    const asFloat = n / 100;
    if (Math.abs(asFloat - value) > 0.001) onChange(asFloat);
    setDraft(String(n));
  };

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        min={0}
        max={100}
        step={1}
        className={`editable-input editable-percent-input ${className ?? ''}`}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(Math.round(value * 100))); setEditing(false); } }}
      />
    );
  }
  return (
    <span
      className={`editable ${className ?? ''}`}
      onClick={e => { e.stopPropagation(); setEditing(true); }}
      role="button"
      tabIndex={0}
      title="Tocca per modificare"
    >
      {Math.round(value * 100)}%
    </span>
  );
}

function EditableStringList({ items, onChange, placeholder, itemClass, addLabel, icon }: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  itemClass?: string;
  addLabel: string;
  icon?: React.ReactNode;
}) {
  return (
    <>
      <ul className="editable-string-list">
        {items.length === 0 && <li className="muted">Nessuna voce.</li>}
        {items.map((item, i) => (
          <li key={i} className={itemClass}>
            {icon}
            <span style={{ flex: 1 }}>
              <Editable
                value={item}
                onChange={v => onChange(items.map((x, idx) => idx === i ? v : x))}
                placeholder={placeholder}
                multiline
              />
            </span>
            <RowDelete onClick={() => onChange(items.filter((_, idx) => idx !== i))} />
          </li>
        ))}
      </ul>
      <AddRowButton label={addLabel} onClick={() => onChange([...items, ''])} />
    </>
  );
}

// ── Drawers ──────────────────────────────────────────────────────────────────

function SourceDrawer({ source, onClose }: { source: SourceRef | null; onClose: () => void }) {
  if (!source) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="source-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-header">
          <div><p className="eyebrow">Fonte collegata</p><h2>{source.source_name}</h2></div>
          <button onClick={onClose} className="ghost-button" title="Chiudi la finestra corrente">Chiudi</button>
        </div>
        <blockquote>&ldquo;{source.quote}&rdquo;</blockquote>
        <div className="drawer-meta">
          <span>Pagina {source.page ?? 1}</span>
          <span>Chunk {source.chunk ?? 'demo'}</span>
          <span>Confidenza {pct(source.confidence)}</span>
        </div>
      </aside>
    </div>
  );
}

function MaterialDrawer({ material, onClose }: { material: Material | null; onClose: () => void }) {
  if (!material) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="source-drawer material-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-header">
          <div><p className="eyebrow">Documento</p><h2>{material.name}</h2></div>
          <button onClick={onClose} className="ghost-button" title="Chiudi la finestra corrente">Chiudi</button>
        </div>
        <div className="material-content">
          {material.content
            ? material.content.split('\n').map((l, i) => <p key={i}>{l || ' '}</p>)
            : <p className="muted">Contenuto non disponibile per {material.kind.toUpperCase()}.</p>}
        </div>
      </aside>
    </div>
  );
}

function RawDocDrawer({ doc, onClose, onDelete }: { doc: RawDocument | null; onClose: () => void; onDelete: (id: string) => void }) {
  if (!doc) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="source-drawer material-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-header">
          <div><p className="eyebrow">{doc.name}</p><h2>{doc.description || doc.name}</h2></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button title="Esegui azione" onClick={() => { onDelete(doc.doc_id); onClose(); }} className="ghost-button" style={{ color: 'var(--critical)' }}><Trash2 size={16} /></button>
            <button onClick={onClose} className="ghost-button" title="Chiudi la finestra corrente">Chiudi</button>
          </div>
        </div>
        <div className="material-content">
          {doc.text
            ? doc.text.split('\n').map((l, i) => <p key={i}>{l || ' '}</p>)
            : <p className="muted">Nessun testo disponibile.</p>}
        </div>
      </aside>
    </div>
  );
}

// ── Aula Mode overlay ─────────────────────────────────────────────────────────

const AULA_SLIDES = 5;

function AulaModeOverlay({ caseData, onClose }: { caseData: CaseAnalysis; onClose: () => void }) {
  const [slide, setSlide] = useState(0);
  const [time, setTime] = useState(() => new Date());
  const touchStartX = useRef(0);
  const la = caseData.analisi_progressi;

  const nextDeadline = useMemo(() =>
    [...caseData.procedural_deadlines].sort((a, b) =>
      `${a.due_date}T${a.due_time ?? '23:59'}`.localeCompare(`${b.due_date}T${b.due_time ?? '23:59'}`)
    )[0],
    [caseData]
  );
  const primaryApproccio = la?.approcci.find(a => a.priority === 'primary') ?? la?.approcci[0];

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setSlide(s => Math.min(s + 1, AULA_SLIDES - 1));
      else if (e.key === 'ArrowLeft') setSlide(s => Math.max(s - 1, 0));
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 44) setSlide(s => dx > 0 ? Math.min(s + 1, AULA_SLIDES - 1) : Math.max(s - 1, 0));
  };

  return (
    <div className="aula-overlay" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="aula-header">
        <div className="aula-brand"><Gavel size={13} /> AULA MODE</div>
        <div className="aula-clock"><Clock size={12} /> {time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        <button title="Chiudi o annulla" className="aula-close" onClick={onClose}><X size={19} /></button>
      </div>

      <div className="aula-dots">
        {Array.from({ length: AULA_SLIDES }, (_, i) => (
          <button title="Esegui azione" key={i} className={`aula-dot${slide === i ? ' active' : ''}`} onClick={() => setSlide(i)} />
        ))}
      </div>

      <div className="aula-content">
        {slide === 0 && (
          <div className="aula-slide">
            <div className="aula-slide-label">01 — Il caso</div>
            <h2 className="aula-case-title">{caseData.case_title}</h2>
            {nextDeadline && (
              <div className="aula-hearing-box">
                <div className="aula-hearing-label">Prossima udienza / scadenza</div>
                <div className="aula-hearing-date">{formatDateFull(nextDeadline.due_date)}{nextDeadline.due_time ? ` · ${nextDeadline.due_time}` : ''}</div>
                <div className="aula-hearing-desc">{nextDeadline.title}</div>
              </div>
            )}
            {la && (
              <div className="aula-risk-box" style={{ borderColor: riskColor(la.livello_attenzione) + '88', background: riskColor(la.livello_attenzione) + '18' }}>
                {riskIcon(la.livello_attenzione)} <span style={{ color: riskColor(la.livello_attenzione), fontWeight: 800 }}>Attenzione {riskLabel(la.livello_attenzione)}</span>
              </div>
            )}
          </div>
        )}

        {slide === 1 && (
          <div className="aula-slide">
            <div className="aula-slide-label">02 — Approccio principale</div>
            {primaryApproccio ? (
              <>
                <h3 className="aula-strategy-title">{primaryApproccio.title}</h3>
                <ul className="aula-points">
                  {primaryApproccio.strengths.slice(0, 3).map((s, i) => (
                    <li key={i}><span className="aula-num">{i + 1}</span><span>{s}</span></li>
                  ))}
                </ul>
                {primaryApproccio.risks[0] && (
                  <div className="aula-risk-note"><AlertTriangle size={13} /> {primaryApproccio.risks[0]}</div>
                )}
              </>
            ) : <p className="aula-empty">Nessun approccio disponibile</p>}
          </div>
        )}

        {slide === 2 && (
          <div className="aula-slide">
            <div className="aula-slide-label">03 — Contraddizioni da usare</div>
            {caseData.contradictions.length > 0 ? (
              <ul className="aula-contradictions">
                {caseData.contradictions.slice(0, 3).map((c, i) => (
                  <li key={i}>
                    <span className="aula-num">{i + 1}</span>
                    <div><strong>{c.title}</strong><p>{c.description}</p></div>
                  </li>
                ))}
              </ul>
            ) : <p className="aula-empty">Nessuna contraddizione rilevata</p>}
          </div>
        )}

        {slide === 3 && (
          <div className="aula-slide">
            <div className="aula-slide-label">04 — Valutazioni aderenza</div>
            {la?.valutazioni_aderenza.length ? (
              <div className="aula-witnesses">
                {la.valutazioni_aderenza.map((v, i) => (
                  <div key={i} className={`aula-witness aula-witness-${v.role}`}>
                    <div className="aula-witness-header">
                      <strong>{v.nome}</strong>
                      <span className={`witness-role-badge role-${v.role}`}>{aderenzaRoleLabel(v.role)}</span>
                      <span className="aula-cred" style={{ color: v.affidabilita_score >= 0.7 ? '#22c55e' : '#f97316' }}>{pct(v.affidabilita_score)}</span>
                    </div>
                    {v.vulnerabilities[0] && <p className="aula-vuln">⚡ {v.vulnerabilities[0]}</p>}
                    {v.domande_approfondimento[0] && <p className="aula-cross">→ {v.domande_approfondimento[0]}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="aula-empty">Nessuna valutazione aderenza disponibile</p>}
          </div>
        )}

        {slide === 4 && (
          <div className="aula-slide">
            <div className="aula-slide-label">05 — Azioni ora</div>
            {la?.azioni_immediate.length ? (
              <ul className="aula-actions">
                {la.azioni_immediate.slice(0, 5).map((a, i) => (
                  <li key={i}><CheckCircle2 size={14} /><span>{a}</span></li>
                ))}
              </ul>
            ) : <p className="aula-empty">Nessuna azione urgente definita</p>}
          </div>
        )}
      </div>

      <div className="aula-nav">
        <button title="Scorri diapositive" className="aula-nav-btn" onClick={() => setSlide(s => Math.max(s - 1, 0))} disabled={slide === 0}>
          <ArrowLeft size={22} />
        </button>
        <span className="aula-nav-counter">{slide + 1} / {AULA_SLIDES}</span>
        <button title="Scorri diapositive" className="aula-nav-btn" onClick={() => setSlide(s => Math.min(s + 1, AULA_SLIDES - 1))} disabled={slide === AULA_SLIDES - 1}>
          <ArrowRight size={22} />
        </button>
      </div>
    </div>
  );
}
// ── Analisi progressi tab ─────────────────────────────────────────────────────


function AnalisiProgressiTab({ la, onSelectSource, onOpenChat, onOpenDraft, onUpdate }: {
  la: AnalisiProgressi;
  onSelectSource: (s: SourceRef) => void;
  onOpenChat: (key: string) => void;
  onOpenDraft: (type: DraftArtifactType, title?: string, extraInstruction?: string) => void;
  onUpdate: (updater: (la: AnalisiProgressi) => AnalisiProgressi) => void;
}) {
  const [expandedObiettivo, setExpandedObiettivo] = useState<number | null>(0);
  const [expandedApproccio, setExpandedApproccio] = useState<number | null>(0);
  const bilancio: BilancioProgressi = la.bilancio ?? {
    progresso_score: 0.5,
    autonomia_score: 0.5,
    progressi_chiave: [],
    fattori_favorevoli: [],
    critical_gaps: [],
    valutazione_generale: '',
  };

  const updateObiettivo = (i: number, patch: Partial<Obiettivo>) =>
    onUpdate(la => ({ ...la, obiettivi: la.obiettivi.map((o, idx) => idx === i ? { ...o, ...patch } : o) }));
  const deleteObiettivo = (i: number) =>
    onUpdate(la => ({ ...la, obiettivi: la.obiettivi.filter((_, idx) => idx !== i) }));
  const addObiettivo = () =>
    onUpdate(la => ({ ...la, obiettivi: [...la.obiettivi, { obiettivo_code: '', obiettivo_nome: '', scadenza_target: '', step_obiettivo: [], strategie: [], progresso_score: 0.5, notes: '', source_refs: [] }] }));

  const updateStep = (oi: number, si: number, patch: Partial<StepObiettivo>) =>
    onUpdate(la => ({ ...la, obiettivi: la.obiettivi.map((o, idx) => idx === oi ? { ...o, step_obiettivo: o.step_obiettivo.map((s, j) => j === si ? { ...s, ...patch } : s) } : o) }));
  const deleteStep = (oi: number, si: number) =>
    onUpdate(la => ({ ...la, obiettivi: la.obiettivi.map((o, idx) => idx === oi ? { ...o, step_obiettivo: o.step_obiettivo.filter((_, j) => j !== si) } : o) }));
  const addStep = (oi: number) =>
    onUpdate(la => ({ ...la, obiettivi: la.obiettivi.map((o, idx) => idx === oi ? { ...o, step_obiettivo: [...o.step_obiettivo, { element: '', description: '', status: 'in_corso', notes: '', source_refs: [] }] } : o) }));

  const updateApproccio = (i: number, patch: Partial<ApproccioAllenamento>) =>
    onUpdate(la => ({ ...la, approcci: la.approcci.map((a, idx) => idx === i ? { ...a, ...patch } : a) }));
  const deleteApproccio = (i: number) =>
    onUpdate(la => ({ ...la, approcci: la.approcci.filter((_, idx) => idx !== i) }));
  const addApproccio = () =>
    onUpdate(la => ({ ...la, approcci: [...la.approcci, { title: '', obiettivo_ref: null, tipo: '', priority: 'secondary', description: '', strengths: [], risks: [], dati_necessari: [], source_refs: [] }] }));

  const updateLimitazione = (i: number, patch: Partial<LimitazioneFisica>) =>
    onUpdate(la => ({ ...la, limitazioni_fisiche: la.limitazioni_fisiche.map((x, idx) => idx === i ? { ...x, ...patch } : x) }));
  const deleteLimitazione = (i: number) =>
    onUpdate(la => ({ ...la, limitazioni_fisiche: la.limitazioni_fisiche.filter((_, idx) => idx !== i) }));
  const addLimitazione = () =>
    onUpdate(la => ({ ...la, limitazioni_fisiche: [...la.limitazioni_fisiche, { title: '', issue_type: '', severity: 'minor', description: '', fonte: '', raccomandazione: '', source_refs: [] }] }));

  const updateAderenza = (i: number, patch: Partial<ValutazioneAderenza>) =>
    onUpdate(la => ({ ...la, valutazioni_aderenza: la.valutazioni_aderenza.map((v, idx) => idx === i ? { ...v, ...patch } : v) }));
  const deleteAderenza = (i: number) =>
    onUpdate(la => ({ ...la, valutazioni_aderenza: la.valutazioni_aderenza.filter((_, idx) => idx !== i) }));
  const addAderenza = () =>
    onUpdate(la => ({ ...la, valutazioni_aderenza: [...la.valutazioni_aderenza, { nome: '', role: 'cliente', affidabilita_score: 0.5, dichiarazione_chiave: '', strengths: [], vulnerabilities: [], domande_approfondimento: [], source_refs: [] }] }));

  const updateBilancio = (patch: Partial<BilancioProgressi>) =>
    onUpdate(la => ({ ...la, bilancio: { ...(la.bilancio ?? bilancio), ...patch } }));

  const ATTENZIONE_OPTIONS: Array<{ value: 'low' | 'medium' | 'high' | 'critical'; label: string }> = [
    { value: 'low', label: 'Basso' }, { value: 'medium', label: 'Medio' },
    { value: 'high', label: 'Alto' }, { value: 'critical', label: 'Critico' },
  ];
  const STEP_STATUS_OPTIONS: Array<{ value: StepObiettivo['status']; label: string }> = [
    { value: 'raggiunto', label: 'Raggiunto' }, { value: 'in_corso', label: 'In corso' },
    { value: 'plateau', label: 'Plateau' }, { value: 'non_avviato', label: 'Non avviato' },
  ];
  const PRIORITY_OPTIONS: Array<{ value: ApproccioAllenamento['priority']; label: string }> = [
    { value: 'primary', label: 'Primario' }, { value: 'secondary', label: 'Secondario' }, { value: 'fallback', label: 'Fallback' },
  ];
  const SEVERITY_OPTIONS: Array<{ value: LimitazioneFisica['severity']; label: string }> = [
    { value: 'critical', label: 'Critico' }, { value: 'significant', label: 'Significativo' }, { value: 'minor', label: 'Minore' },
  ];
  const ADERENZA_ROLE_OPTIONS: Array<{ value: ValutazioneAderenza['role']; label: string }> = [
    { value: 'cliente', label: 'Cliente' }, { value: 'medico', label: 'Medico' },
    { value: 'fisioterapista', label: 'Fisioterapista' }, { value: 'nutrizionista', label: 'Nutrizionista' }, { value: 'expert', label: 'Esperto' },
  ];

  return (
    <section className="panel legal-panel">

      {/* Attenzione banner */}
      <div className="risk-banner" style={{ borderColor: riskColor(la.livello_attenzione) + '66', background: riskColor(la.livello_attenzione) + '11' }}>
        <div className="risk-banner-label" style={{ color: riskColor(la.livello_attenzione) }}>
          {riskIcon(la.livello_attenzione)} Livello attenzione{' '}
          <EditableSelect
            value={la.livello_attenzione}
            options={ATTENZIONE_OPTIONS}
            onChange={v => onUpdate(la => ({ ...la, livello_attenzione: v }))}
          />
        </div>
        <p>
          <Editable
            value={la.sommario}
            onChange={v => onUpdate(la => ({ ...la, sommario: v }))}
            placeholder="Sintesi dei progressi…"
            multiline
          />
        </p>
      </div>

      {/* Azioni immediate */}
      <div className="legal-section">
        <h2><Zap size={16} /> Azioni immediate</h2>
        <EditableStringList
          items={la.azioni_immediate}
          onChange={items => onUpdate(la => ({ ...la, azioni_immediate: items }))}
          placeholder="Azione immediata…"
          itemClass="action-item"
          icon={<CheckCircle2 size={14} />}
          addLabel="Aggiungi azione"
        />
      </div>

      {/* Obiettivi */}
      <div className="legal-section">
        <h2><Scale size={16} /> Obiettivi e progressi</h2>
        {la.obiettivi.map((ob, oi) => (
          <div key={oi} className="charge-card">
            <div className="charge-card-header">
              <button className="charge-card-toggle" title="Espandi obiettivo" onClick={() => setExpandedObiettivo(expandedObiettivo === oi ? null : oi)}>
                {expandedObiettivo === oi ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <div className="charge-card-content">
                <div className="charge-card-title-row">
                  <span className="charge-code">
                    <Editable value={ob.obiettivo_code} onChange={v => updateObiettivo(oi, { obiettivo_code: v })} placeholder="OBJ-1" />
                  </span>
                  <span className="charge-name">
                    <Editable value={ob.obiettivo_nome} onChange={v => updateObiettivo(oi, { obiettivo_nome: v })} placeholder="Nome obiettivo" />
                  </span>
                </div>
                <div className="charge-card-meta-row">
                  <div className="strength-mini">
                    <div className="strength-mini-fill" style={{ width: `${ob.progresso_score * 100}%`, background: `hsl(${ob.progresso_score * 120}, 70%, 50%)` }} />
                  </div>
                  <span className="charge-strength-label">
                    Progresso{' '}
                    <EditablePercent value={ob.progresso_score} onChange={v => updateObiettivo(oi, { progresso_score: v })} />
                  </span>
                </div>
              </div>
              <RowDelete onClick={() => deleteObiettivo(oi)} label={ob.obiettivo_nome} />
            </div>
            {expandedObiettivo === oi && (
              <div className="charge-card-body">
                <p className="charge-sentence">
                  <strong>Scadenza target:</strong>{' '}
                  <Editable value={ob.scadenza_target} onChange={v => updateObiettivo(oi, { scadenza_target: v })} placeholder="YYYY-MM-DD" />
                </p>
                <h4>Step</h4>
                <div className="elements-table">
                  {ob.step_obiettivo.map((step, si) => (
                    <div key={si} className="element-row">
                      <div className="element-status-dot" style={{ background: stepStatusColor(step.status) }} title={stepStatusLabel(step.status)} />
                      <div className="element-body" style={{ flex: 1 }}>
                        <div className="editable-row-head">
                          <strong>
                            <Editable value={step.element} onChange={v => updateStep(oi, si, { element: v })} placeholder="Step…" />
                          </strong>
                          <RowDelete onClick={() => deleteStep(oi, si)} label={step.element} />
                        </div>
                        <p>
                          <Editable value={step.description} onChange={v => updateStep(oi, si, { description: v })} placeholder="Descrizione…" multiline />
                        </p>
                        <p className="element-notes">
                          <Editable value={step.notes} onChange={v => updateStep(oi, si, { notes: v })} placeholder="Note…" multiline />
                        </p>
                        <EditableSelect
                          value={step.status}
                          options={STEP_STATUS_OPTIONS}
                          onChange={v => updateStep(oi, si, { status: v })}
                          className={`element-chip element-${step.status}`}
                        />
                        <SourceRow refs={step.source_refs} onSelect={onSelectSource} />
                      </div>
                    </div>
                  ))}
                  <AddRowButton label="Aggiungi step" onClick={() => addStep(oi)} />
                </div>
                <h4>Strategie</h4>
                <EditableStringList
                  items={ob.strategie}
                  onChange={items => updateObiettivo(oi, { strategie: items })}
                  placeholder="Strategia…"
                  addLabel="Aggiungi strategia"
                />
                <h4>Note</h4>
                <p className="charge-notes">
                  <Editable value={ob.notes} onChange={v => updateObiettivo(oi, { notes: v })} placeholder="Note sull'obiettivo…" multiline />
                </p>
                <SourceRow refs={ob.source_refs} onSelect={onSelectSource} />
              </div>
            )}
          </div>
        ))}
        <AddRowButton label="Aggiungi obiettivo" onClick={addObiettivo} />
      </div>

      {/* Approcci allenamento */}
      <div className="legal-section">
        <h2><ShieldCheck size={16} /> Approcci di allenamento</h2>
        {la.approcci.map((a, ai) => (
          <div key={ai} className={`strategy-card strategy-${a.priority}`}>
            <div className="strategy-header">
              <button className="strategy-toggle" title="Mostra o nascondi i dettagli dell'approccio" onClick={() => setExpandedApproccio(expandedApproccio === ai ? null : ai)}>
                {expandedApproccio === ai ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
              <div className="strategy-content">
                <div className="strategy-title-row">
                  <EditableSelect
                    value={a.priority}
                    options={PRIORITY_OPTIONS}
                    onChange={v => updateApproccio(ai, { priority: v })}
                    className={`priority-badge priority-${a.priority}`}
                  />
                  <span className="strategy-type-badge">
                    <Editable value={a.tipo} onChange={v => updateApproccio(ai, { tipo: v })} placeholder="tipo approccio" />
                  </span>
                </div>
                <div className="strategy-title">
                  <Editable value={a.title} onChange={v => updateApproccio(ai, { title: v })} placeholder="Titolo approccio…" />
                </div>
              </div>
              <RowDelete onClick={() => deleteApproccio(ai)} label={a.title} />
            </div>
            {expandedApproccio === ai && (
              <div className="strategy-body">
                <p>
                  <Editable value={a.description} onChange={v => updateApproccio(ai, { description: v })} placeholder="Descrizione…" multiline />
                </p>
                <div className="strategy-cols">
                  <div className="strategy-col">
                    <h4>Punti di forza</h4>
                    <EditableStringList
                      items={a.strengths}
                      onChange={items => updateApproccio(ai, { strengths: items })}
                      placeholder="Punto di forza…"
                      itemClass="pro-item"
                      addLabel="Aggiungi"
                    />
                  </div>
                  <div className="strategy-col">
                    <h4>Rischi</h4>
                    <EditableStringList
                      items={a.risks}
                      onChange={items => updateApproccio(ai, { risks: items })}
                      placeholder="Rischio…"
                      itemClass="risk-item"
                      addLabel="Aggiungi"
                    />
                  </div>
                </div>
                <h4>Dati necessari</h4>
                <EditableStringList
                  items={a.dati_necessari}
                  onChange={items => updateApproccio(ai, { dati_necessari: items })}
                  placeholder="Dato necessario…"
                  icon={<Search size={12} />}
                  addLabel="Aggiungi dato"
                />
                <SourceRow refs={a.source_refs} onSelect={onSelectSource} />
              </div>
            )}
          </div>
        ))}
        <AddRowButton label="Aggiungi approccio" onClick={addApproccio} />
      </div>

      {/* Limitazioni fisiche */}
      <div className="legal-section">
        <h2><ShieldAlert size={16} /> Limitazioni fisiche</h2>
        {la.limitazioni_fisiche.length === 0 && <p className="muted">Nessuna limitazione rilevata.</p>}
        {la.limitazioni_fisiche.map((lim, li) => (
          <div key={li} className={`issue-card issue-${lim.severity}`}>
            <div className="issue-header">
              <EditableSelect
                value={lim.severity}
                options={SEVERITY_OPTIONS}
                onChange={v => updateLimitazione(li, { severity: v })}
                className={`severity-badge severity-${lim.severity}`}
              />
              <span className="issue-type">
                <Editable value={lim.issue_type} onChange={v => updateLimitazione(li, { issue_type: v })} placeholder="tipo limitazione" />
              </span>
              <RowDelete onClick={() => deleteLimitazione(li)} label={lim.title} />
            </div>
            <h3>
              <Editable value={lim.title} onChange={v => updateLimitazione(li, { title: v })} placeholder="Titolo…" />
            </h3>
            <p>
              <Editable value={lim.description} onChange={v => updateLimitazione(li, { description: v })} placeholder="Descrizione…" multiline />
            </p>
            <div className="issue-law">
              <BookOpen size={13} />{' '}
              <em>
                <Editable value={lim.fonte} onChange={v => updateLimitazione(li, { fonte: v })} placeholder="Fonte (es. referto medico)…" />
              </em>
            </div>
            <div className="issue-remedy">
              <ShieldCheck size={13} />
              <span>
                <Editable value={lim.raccomandazione} onChange={v => updateLimitazione(li, { raccomandazione: v })} placeholder="Raccomandazione…" />
              </span>
            </div>
            <SourceRow refs={lim.source_refs} onSelect={onSelectSource} />
          </div>
        ))}
        <AddRowButton label="Aggiungi limitazione" onClick={addLimitazione} />
      </div>

      {/* Valutazioni aderenza */}
      <div className="legal-section">
        <h2><Users size={16} /> Valutazioni aderenza</h2>
        {la.valutazioni_aderenza.length === 0 && <p className="muted">Nessuna valutazione registrata.</p>}
        {la.valutazioni_aderenza.map((v, vi) => (
          <div key={vi} className={`witness-card witness-${v.role}`}>
            <div className="witness-header">
              <div>
                <strong>
                  <Editable value={v.nome} onChange={val => updateAderenza(vi, { nome: val })} placeholder="Nome…" />
                </strong>
                <EditableSelect
                  value={v.role}
                  options={ADERENZA_ROLE_OPTIONS}
                  onChange={val => updateAderenza(vi, { role: val })}
                  className={`witness-role-badge role-${v.role}`}
                />
              </div>
              <div className="credibility-score" style={{ color: v.affidabilita_score >= 0.7 ? 'var(--success)' : v.affidabilita_score >= 0.5 ? 'var(--warning)' : 'var(--critical)' }}>
                <EditablePercent value={v.affidabilita_score} onChange={val => updateAderenza(vi, { affidabilita_score: val })} /> aderenza
              </div>
              <RowDelete onClick={() => deleteAderenza(vi)} label={v.nome} />
            </div>
            <StrengthBar value={v.affidabilita_score} label="Aderenza al programma" color={`hsl(${v.affidabilita_score * 120}, 70%, 50%)`} />
            <p className="witness-testimony">&ldquo;
              <Editable value={v.dichiarazione_chiave} onChange={val => updateAderenza(vi, { dichiarazione_chiave: val })} placeholder="Dichiarazione chiave…" multiline />
            &rdquo;</p>
            <div className="witness-cols">
              <div>
                <h4>Punti forti</h4>
                <EditableStringList
                  items={v.strengths}
                  onChange={items => updateAderenza(vi, { strengths: items })}
                  placeholder="Punto forte…"
                  itemClass="pro-item"
                  addLabel="Aggiungi"
                />
              </div>
              <div>
                <h4>Vulnerabilità</h4>
                <EditableStringList
                  items={v.vulnerabilities}
                  onChange={items => updateAderenza(vi, { vulnerabilities: items })}
                  placeholder="Vulnerabilità…"
                  itemClass="risk-item"
                  addLabel="Aggiungi"
                />
              </div>
            </div>
            <h4>Domande di approfondimento</h4>
            <EditableStringList
              items={v.domande_approfondimento}
              onChange={items => updateAderenza(vi, { domande_approfondimento: items })}
              placeholder="Domanda…"
              icon={<ArrowRight size={12} />}
              addLabel="Aggiungi domanda"
            />
            <SourceRow refs={v.source_refs} onSelect={onSelectSource} />
            <button title="Chiedi ad Aria"
              className="giulia-ctx-btn"
              onClick={() => onOpenDraft(
                'messaggioMotivazione',
                `Messaggio — ${v.nome || 'cliente'}`,
                `Prepara un messaggio motivazionale personalizzato per ${v.nome} (${aderenzaRoleLabel(v.role)}, aderenza ${Math.round(v.affidabilita_score * 100)}%). Dichiarazione chiave: "${v.dichiarazione_chiave}". Vulnerabilità note: ${v.vulnerabilities.join('; ') || 'da sviluppare'}.`
              )}
            >
              <MessageSquare size={12} /> Chiedi ad Aria
            </button>
          </div>
        ))}
        <AddRowButton label="Aggiungi valutazione" onClick={addAderenza} />
      </div>

      {/* Bilancio progressi */}
      <div className="legal-section">
        <h2><Scale size={16} /> Bilancio progressi</h2>
        <div className="balance-card">
          <div className="balance-bars">
            <div>
              <span className="muted" style={{ fontSize: '0.78rem' }}>Progresso complessivo:{' '}
                <EditablePercent value={bilancio.progresso_score} onChange={v => updateBilancio({ progresso_score: v })} />
              </span>
              <StrengthBar value={bilancio.progresso_score} label="Progresso" color="#22c55e" />
            </div>
            <div>
              <span className="muted" style={{ fontSize: '0.78rem' }}>Autonomia:{' '}
                <EditablePercent value={bilancio.autonomia_score} onChange={v => updateBilancio({ autonomia_score: v })} />
              </span>
              <StrengthBar value={bilancio.autonomia_score} label="Autonomia" color="#3b82f6" />
            </div>
          </div>
          <div className="balance-cols">
            <div>
              <h4>Progressi chiave</h4>
              <EditableStringList
                items={bilancio.progressi_chiave}
                onChange={items => updateBilancio({ progressi_chiave: items })}
                placeholder="Progresso raggiunto…"
                itemClass="pro-item"
                addLabel="Aggiungi"
              />
            </div>
            <div>
              <h4>Fattori favorevoli</h4>
              <EditableStringList
                items={bilancio.fattori_favorevoli}
                onChange={items => updateBilancio({ fattori_favorevoli: items })}
                placeholder="Fattore favorevole…"
                itemClass="pro-item"
                addLabel="Aggiungi"
              />
            </div>
          </div>
          <div className="balance-gaps">
            <h4><Search size={13} /> Lacune nel percorso</h4>
            <EditableStringList
              items={bilancio.critical_gaps}
              onChange={items => updateBilancio({ critical_gaps: items })}
              placeholder="Lacuna…"
              addLabel="Aggiungi lacuna"
            />
          </div>
          <p className="balance-assessment">
            <Editable
              value={bilancio.valutazione_generale}
              onChange={v => updateBilancio({ valutazione_generale: v })}
              placeholder="Valutazione complessiva…"
              multiline
            />
          </p>
        </div>
      </div>

      {/* Nota cliente */}
      <div className="client-summary-box">
        <h2><Users size={16} /> Nota per il cliente</h2>
        <p>
          <Editable
            value={la.nota_cliente}
            onChange={v => onUpdate(la => ({ ...la, nota_cliente: v }))}
            placeholder="Sintesi per il cliente in linguaggio semplice…"
            multiline
          />
        </p>
      </div>

      {/* AI drafting */}
      <div className="legal-drafting-box">
        <div className="legal-drafting-header">
          <Sparkles size={16} />
          <div>
            <div className="legal-drafting-title">Genera con Aria</div>
            <div className="legal-drafting-sub">Piani, schede, report — generati da AI in base ai dati del cliente</div>
          </div>
        </div>
        <div className="legal-drafting-grid">
          {([
            { key: 'pianoSettimana', label: 'Piano settimana',    desc: 'Piano settimanale personalizzato basato sullo storico sessioni', icon: FileText },
            { key: 'schedaMensile',  label: 'Scheda mensile',     desc: 'Scheda allenamento mensile con esercizi, serie e recuperi', icon: Scale },
            { key: 'reportProgresso', label: 'Report progresso',  desc: 'Report progressi con dati, plateau e raccomandazioni', icon: ShieldAlert },
            { key: 'notaNutrizionale', label: 'Nota nutrizionale', desc: 'Indicazioni alimentari di supporto (non medico)', icon: Users },
            { key: 'messaggioMotivazione', label: 'Messaggio cliente', desc: 'Messaggio motivazionale personalizzato per il cliente', icon: Sparkles },
          ] as const).map(({ key, label, desc, icon: Icon }) => (
            <button key={key} className="legal-drafting-card" title="Apri una nuova bozza nel workspace" onClick={() => onOpenDraft(key, label)}>
              <div className="legal-drafting-card-icon"><Icon size={18} /></div>
              <div className="legal-drafting-card-label">{label}</div>
              <div className="legal-drafting-card-desc">{desc}</div>
            </button>
          ))}
        </div>
        <p className="legal-drafting-note">
          Aria prepara bozze locali modificabili: il trainer verifica e personalizza prima di consegnare al cliente. Non sono consigli medici.
        </p>
      </div>
    </section>
  );
}

// ── Redaction components ──────────────────────────────────────────────────────

function RedactionDrawer({
  globalRules, setGlobalRules,
  caseRules, setCaseRules,
  onClose, caseCtx, apiBase,
}: {
  globalRules: RedactionRule[]; setGlobalRules: (r: RedactionRule[]) => void;
  caseRules: RedactionRule[]; setCaseRules: (r: RedactionRule[]) => void;
  onClose: () => void; caseCtx: string; apiBase: string;
}) {
  const [origInput, setOrigInput] = useState('');
  const [replInput, setReplInput] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [suggested, setSuggested] = useState<RedactionRule[]>([]);

  const addRule = (target: 'global' | 'case') => {
    if (!origInput.trim()) return;
    const rule: RedactionRule = { id: crypto.randomUUID(), original: origInput.trim(), replacement: replInput.trim() || '[OMISSIS]', enabled: true };
    if (target === 'global') setGlobalRules([...globalRules, rule]);
    else setCaseRules([...caseRules, rule]);
    setOrigInput(''); setReplInput('');
  };

  const handleDetect = async () => {
    setDetecting(true); setSuggested([]);
    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: REDACT_DETECT_PROMPT(caseCtx) }], mode: 'flash' }),
      });
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ''; let full = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const p = line.slice(6).trim(); if (p === '[DONE]') break;
          try { full += (JSON.parse(p) as { text: string }).text; } catch {}
        }
      }
      const rules: RedactionRule[] = full.split('\n').flatMap(line => {
        const m = line.match(/^(.+?)\s*→\s*(.+)$/);
        if (!m) return [];
        return [{ id: crypto.randomUUID(), original: m[1].trim(), replacement: m[2].trim(), enabled: true }];
      });
      setSuggested(rules);
    } finally { setDetecting(false); }
  };

  const RuleList = ({ rules, onChange, title }: { rules: RedactionRule[]; onChange: (r: RedactionRule[]) => void; title: string }) => (
    <div className="redact-section">
      <p className="eyebrow">{title}</p>
      {rules.length === 0 && <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 8 }}>Nessuna regola.</p>}
      {rules.map((r, i) => (
        <div key={r.id} className="redact-rule-item">
          <span className="redact-original">{r.original}</span>
          <span className="redact-arrow">→</span>
          <span className="redact-replacement">{r.replacement}</span>
          <button className="redact-toggle-chip" title="Attiva o disattiva questa regola di anonimizzazione" onClick={() => onChange(rules.map((x, j) => j === i ? { ...x, enabled: !x.enabled } : x))}>
            {r.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          <button className="redact-delete-btn" title="Elimina definitivamente questa regola" onClick={() => onChange(rules.filter((_, j) => j !== i))}><X size={12} /></button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="source-drawer redact-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-header">
          <div><p className="eyebrow">Privacy</p><h2>Anonimizza dati sensibili</h2></div>
          <button onClick={onClose} className="ghost-button" title="Chiudi la finestra corrente">Chiudi</button>
        </div>

        <div className="redact-add-form">
          <p className="eyebrow">Aggiungi regola</p>
          <div className="redact-add-row">
            <input className="upload-input" placeholder="Parola originale (es. Mario Rossi)" value={origInput} onChange={e => setOrigInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRule('global')} />
            <span style={{ color: 'var(--ink-3)', flexShrink: 0 }}>→</span>
            <input className="upload-input" placeholder="[OMISSIS]" value={replInput} onChange={e => setReplInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRule('global')} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="ghost-button" style={{ fontSize: '0.8rem', padding: '8px 12px' }} onClick={() => addRule('global')} title="Aggiungi regola a tutti i fascicoli" disabled={!origInput.trim()}>+ Globale</button>
            <button className="ghost-button" style={{ fontSize: '0.8rem', padding: '8px 12px' }} onClick={() => addRule('case')} title="Aggiungi regola solo a questa scheda" disabled={!origInput.trim()}>+ Solo questo caso</button>
          </div>
        </div>

        <RuleList rules={globalRules} onChange={setGlobalRules} title="Regole globali (tutti i fascicoli)" />
        <RuleList rules={caseRules} onChange={setCaseRules} title="Regole per questa scheda" />

        <div className="redact-section">
          <p className="eyebrow">Rilevamento AI</p>
          <button title="Azione secondaria" className="ghost-button" style={{ width: '100%', justifyContent: 'center', gap: 8 }} onClick={handleDetect} disabled={detecting}>
            {detecting ? <><Loader2 size={14} className="spin" /> Analisi in corso…</> : <><Sparkles size={14} /> Rileva dati sensibili con AI</>}
          </button>
          {suggested.length > 0 && (
            <div className="redact-suggested">
              <p className="eyebrow" style={{ marginTop: 12 }}>Suggeriti ({suggested.length})</p>
              {suggested.map(r => (
                <div key={r.id} className="redact-rule-item">
                  <span className="redact-original">{r.original}</span>
                  <span className="redact-arrow">→</span>
                  <span className="redact-replacement">{r.replacement}</span>
                  <button title="Azione secondaria" className="ghost-button" style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: 6 }}
                    onClick={() => { setCaseRules([...caseRules, r]); setSuggested(suggested.filter(s => s.id !== r.id)); }}>
                    + Aggiungi
                  </button>
                </div>
              ))}
              <button title="Conferma operazione principale" className="primary-button" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                onClick={() => { setCaseRules([...caseRules, ...suggested]); setSuggested([]); }}>
                Accetta tutte
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function AnonModal({ text, onClose }: { text: string; onClose: () => void }) {
  const lines = markdownToLines(text);
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="source-drawer anon-modal" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-header">
          <div><p className="eyebrow">Versione anonimizzata</p><h2>Testo anonimizzato</h2></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button title="Azione secondaria" className="ghost-button" onClick={() => navigator.clipboard.writeText(text).catch(() => {})}><Copy size={15} /></button>
            {typeof navigator.share === 'function' && (
              <button title="Azione secondaria" className="ghost-button" onClick={() => navigator.share({ title: 'Testo anonimizzato', text }).catch(() => {})}><Share2 size={15} /></button>
            )}
            <button className="ghost-button" onClick={onClose} title="Chiudi la finestra corrente">Chiudi</button>
          </div>
        </div>
        <div className="material-content anon-content">
          {text
            ? lines.map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
                if (line.startsWith('- ')) return <p className="bullet" key={i}>• {line.slice(2)}</p>;
                return <p key={i}>{line.replaceAll('**', '')}</p>;
              })
            : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}><Loader2 className="spin" size={28} /><p>Anonimizzazione in corso…</p></div>
          }
        </div>
      </aside>
    </div>
  );
}

function ExportCaseDrawer({
  onClose,
  onExport,
  hasAnonymizationRules,
}: {
  onClose: () => void;
  onExport: (opts: { includeDocs: boolean; protectedFile: boolean; password?: string; anonymized: boolean }) => Promise<void>;
  hasAnonymizationRules: boolean;
}) {
  const [mode, setMode] = useState<'protected' | 'plain'>('protected');
  const [includeDocs, setIncludeDocs] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [anonymized, setAnonymized] = useState(hasAnonymizationRules);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (mode === 'protected') {
      if (!password.trim()) { setError('Inserisci una password per proteggere la scheda.'); return; }
      if (password !== confirmPassword) { setError('Le password non coincidono.'); return; }
    } else if (!confirm('Confermi di voler esportare un file non protetto?\nIl contenuto sarà leggibile da chiunque abbia accesso al file.')) {
      return;
    }
    setBusy(true);
    try {
      await onExport({ includeDocs, protectedFile: mode === 'protected', password, anonymized: mode === 'plain' && anonymized });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="source-drawer export-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Condivisione locale</p>
            <h2>Esporta scheda cliente</h2>
          </div>
          <button className="ghost-button" onClick={onClose} title="Chiudi"><X size={16} /></button>
        </div>

        <p className="export-privacy-copy">
          Le schede restano su questo dispositivo. L'esportazione crea un file .spr che puoi trasferire su un altro dispositivo o condividere con un collega.
        </p>

        <div className="export-mode-grid">
          <button title="Seleziona questa modalità di esportazione" className={`export-mode-card${mode === 'protected' ? ' active' : ''}`} onClick={() => setMode('protected')}>
            <ShieldCheck size={18} />
            <strong>Proteggi con password — consigliato</strong>
            <span>Il contenuto viene cifrato nel browser prima del download. SchedaPRO non salva il file e non conosce la password.</span>
          </button>
          <button title="Seleziona questa modalità di esportazione" className={`export-mode-card export-mode-card-warning${mode === 'plain' ? ' active' : ''}`} onClick={() => setMode('plain')}>
            <ShieldAlert size={18} />
            <strong>Esporta senza password</strong>
            <span>Solo per debug, archiviazione locale sicura o dopo aver anonimizzato i dati sensibili.</span>
          </button>
        </div>

        {mode === 'protected' ? (
          <div className="export-fields">
            <label>Password <input type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
            <label>Conferma password <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label>
            <p className="export-note">Chi riceve il file potrà aprirlo su un altro dispositivo, ma solo con questa password. Se la perdi, SchedaPRO non può recuperarla.</p>
            <p className="export-note">Consiglio: invia la password con un canale diverso dal file.</p>
          </div>
        ) : (
          <div className="export-warning-box">
            <strong>File non protetto</strong>
            <p>Il file .spr non protetto contiene i dati del cliente in chiaro. Prima di inviare un file non protetto, usa \"Anonimizza\" per sostituire nomi e dati identificativi.</p>
            <label className="export-check-row">
              <input type="checkbox" checked={anonymized} disabled={!hasAnonymizationRules} onChange={e => setAnonymized(e.target.checked)} />
              Esporta copia anonimizzata {hasAnonymizationRules ? '' : '(aggiungi prima regole da “Anonimizza”)'}
            </label>
          </div>
        )}

        <label className="export-check-row">
          <input type="checkbox" checked={includeDocs} onChange={e => setIncludeDocs(e.target.checked)} />
          Includi documenti originali
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="drawer-actions">
          <button className="ghost-button" onClick={onClose} title="Annulla operazione">Annulla</button>
          <button title="Conferma operazione principale" className="primary-button" disabled={busy} onClick={submit}>
            {busy ? <Loader2 className="spin" size={15} /> : <Share2 size={15} />}
            {mode === 'protected' ? 'Esporta .spr protetto' : 'Esporta comunque'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function DraftingWorkspace({
  caseTitle,
  drafts,
  activeDraftId,
  onSelectDraft,
  onUpdateDraft,
  onDeleteDraft,
  onExportDraft,
  onOpenProtectedPltExport,
}: {
  caseTitle: string;
  drafts: DraftArtifact[];
  activeDraftId: string | null;
  onSelectDraft: (id: string) => void;
  onUpdateDraft: (draft: DraftArtifact) => void;
  onDeleteDraft: (id: string) => void;
  onExportDraft: (draft: DraftArtifact, format: 'md' | 'txt' | 'html' | 'docx') => void;
  onOpenProtectedPltExport: () => void;
}) {
  const activeDraft = drafts.find(d => d.id === activeDraftId) ?? drafts[0] ?? null;

  if (!drafts.length) {
    return (
      <section className="panel draft-workspace-panel">
        <div className="draft-empty-state">
          <Sparkles size={24} />
          <h2>Workspace redazione atti</h2>
          <p className="muted">Clicca una card viola in “Analisi legale” per aprire una nuova bozza persistente. La chat resta solo per rifiniture e domande.</p>
        </div>
      </section>
    );
  }

  const verified = activeDraft.claim_refs.filter(c => c.status === 'sourced').length;
  const toCheck = activeDraft.claim_refs.filter(c => c.status !== 'sourced').length;

  return (
    <section className="panel draft-workspace-panel">
      <div className="draft-workspace-header">
        <div>
          <p className="eyebrow">Piano di allenamento</p>
          <h2>{caseTitle}</h2>
          <p className="muted">Bozze locali della scheda. Ogni click su una card genera una nuova tab modificabile.</p>
        </div>
        <button className="ghost-button" onClick={onOpenProtectedPltExport} title="Esporta la scheda cliente in formato protetto">
          <ShieldCheck size={14} /> .spr protetto
        </button>
      </div>

      <div className="draft-tabs" role="tablist" aria-label="Bozze della scheda">
        {drafts.map((draft, idx) => (
          <button
            key={draft.id}
            role="tab"
            className={`draft-tab${draft.id === activeDraft.id ? ' active' : ''}`}
            onClick={() => onSelectDraft(draft.id)}
            title="Apri questa bozza"
          >
            <span>{idx + 1}. {draft.title}</span>
            <small>{draft.status} · {new Date(draft.created_at).toLocaleString('it')}</small>
          </button>
        ))}
      </div>

      <div className="draft-editor-grid">
        <div className="draft-editor-main">
          <label className="draft-title-field">
            Titolo bozza
            <input
              value={activeDraft.title}
              onChange={e => onUpdateDraft({ ...activeDraft, title: e.target.value })}
            />
          </label>
          <div className="draft-toolbar">
            <label>
              Stato
              <select
                value={activeDraft.status}
                onChange={e => onUpdateDraft({ ...activeDraft, status: e.target.value as DraftArtifact['status'] })}
              >
                <option value="draft">bozza</option>
                <option value="reviewing">in revisione</option>
                <option value="approved">approvata dal trainer</option>
                <option value="archived">archiviata</option>
              </select>
            </label>
            <button className="ghost-button" onClick={() => onDeleteDraft(activeDraft.id)} title="Archivia/elimina questa workspace"><Trash2 size={13} /> Elimina</button>
          </div>
          <textarea
            className="editable-input editable-input-multi draft-editor"
            value={activeDraft.content_markdown}
            onChange={e => onUpdateDraft({ ...activeDraft, content_markdown: e.target.value })}
            rows={24}
            placeholder="La bozza generata comparirà qui. Puoi modificarla liberamente: resta salvata nella scheda locale."
          />
        </div>

        <aside className="draft-side-panel">
          <div className="draft-guardrail-card">
            <ShieldAlert size={16} />
            <strong>Bozza — verificare prima della consegna</strong>
            <p>I piani generati da Aria sono bozze. Il trainer verifica dati, progressi e adeguatezza prima di consegnarli al cliente. Non sono consigli medici.</p>
          </div>

          <div className="draft-check-card">
            <h3>Verifiche</h3>
            <p><strong>{verified}</strong> claim con fonte · <strong>{toCheck}</strong> da verificare/unsupported</p>
            {activeDraft.claim_refs.length === 0 && <p className="muted">Nessuna citazione sospetta rilevata automaticamente.</p>}
            {activeDraft.claim_refs.map(claim => (
              <div key={claim.id} className={`draft-claim draft-claim-${claim.status}`}>
                <span>{claim.status === 'da_verificare' ? 'DA VERIFICARE' : claim.status}</span>
                <p>{claim.claim_text}</p>
              </div>
            ))}
          </div>

          <div className="draft-export-card">
            <h3>Esporta bozza</h3>
            <p className="export-note">{DRAFT_PLAINTEXT_EXPORT_WARNING}</p>
            <div className="draft-export-buttons">
              <button className="brief-action-btn" onClick={() => onExportDraft(activeDraft, 'md')}><FileText size={13} /> .md</button>
              <button className="brief-action-btn" onClick={() => onExportDraft(activeDraft, 'txt')}><FileText size={13} /> .txt</button>
              <button className="brief-action-btn" onClick={() => onExportDraft(activeDraft, 'html')}><FileText size={13} /> .html</button>
              <button className="brief-action-btn" onClick={() => onExportDraft(activeDraft, 'docx')}><FileText size={13} /> .docx</button>
            </div>
            <button className="primary-button draft-protected-export" onClick={onOpenProtectedPltExport} title="Esporta scheda protetta">
              <ShieldCheck size={14} /> Proteggi tutto come .spr
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ── Case detail view ──────────────────────────────────────────────────────────

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'timeline', label: 'Storico sessioni' },
  { id: 'deadlines', label: 'Appuntamenti' },
  { id: 'facts', label: 'Profilo & misurazioni' },
  { id: 'analisi', label: 'Analisi AI' },
  { id: 'piani', label: 'Piano allenamento' },
  { id: 'questions', label: 'Note trainer' },
  { id: 'brief', label: 'Promemoria' },
];

function CaseDetailView({ caseId, session, onBack, onOpenChat, onCaseLoaded, onCaseAnalyzed }: { caseId: string; session: Session; onBack: () => void; onOpenChat: (key: string) => void; onCaseLoaded: (d: CaseAnalysis) => void; onCaseAnalyzed?: (d: CaseAnalysis) => void }) {
  const [caseData, setCaseData] = useState<CaseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('timeline');
  const [selectedSource, setSelectedSource] = useState<SourceRef | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedRawDoc, setSelectedRawDoc] = useState<RawDocument | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aulaModeActive, setAulaModeActive] = useState(false);
  const [redactionOverride, setRedactionOverride] = useState<boolean | null>(null);
  const [showRedactionDrawer, setShowRedactionDrawer] = useState(false);
  const [anonModal, setAnonModal] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [anonymizingDocId, setAnonymizingDocId] = useState<string | null>(null);
  const localOwnerId = useMemo(() => localOwnerIdFromSession(session), [session]);

  const { toast, showToast, dismissToast } = useToast();
  const { toggle: toggleTask, isDone, doneCount } = useCompletedTasks(caseId);
  const { globalRules, setGlobalRules } = useRedactionRules();
  const caseRedactionRules = caseData?.redaction_rules ?? [];
  const mergedRules = mergeRedactionRules(globalRules, caseRedactionRules);
  const hasActiveRules = mergedRules.some(r => r.enabled && r.original.trim());
  const redactionActive = redactionOverride !== null ? redactionOverride : hasActiveRules;

  const exportBrief = useCallback(async () => {
    if (!caseData) return;
    try {
      await navigator.clipboard.writeText(caseData.brief_markdown);
      showToast('Promemoria copiato negli appunti!');
    } catch {
      showToast('Copia non riuscita', 'error');
    }
  }, [caseData, showToast]);

  const exportBriefDocx = useCallback(async () => {
    if (!caseData) return;
    try {
      const res = await fetch(`${API}/api/export-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_title: caseData.case_title, brief_markdown: caseData.brief_markdown }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${caseData.case_title.replace(/[^\w\s-]/g, '').trim()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast(`Errore export: ${(e as Error).message}`, 'error');
    }
  }, [caseData, showToast]);

  const shareBrief = useCallback(async () => {
    if (!caseData) return;
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: caseData.case_title, text: caseData.brief_markdown }); return; } catch {}
    }
    exportBrief();
  }, [caseData, exportBrief]);

  const timelineRef = useRef<HTMLElement | null>(null);
  const deadlinesRef = useRef<HTMLElement | null>(null);
  const contradictionsRef = useRef<HTMLHeadingElement | null>(null);
  const materialsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (caseId === '__new__') {
      const nc = (window as any).__newCase as CaseAnalysis | undefined;
      if (nc) { setCaseData(nc); onCaseLoaded(nc); return; }
    }
    (async () => {
      // Check IndexedDB first — data stays local
      const local = await dbGet(localOwnerId, caseId) as CaseAnalysis | null;
      if (local) { setCaseData(local); onCaseLoaded(local); return; }
      // Fall back to backend demo cases
      try {
        const r = await fetch(`${API}/api/cases/${caseId}`);
        if (!r.ok) throw new Error(`${r.status}`);
        const d = await r.json() as CaseAnalysis;
        setCaseData(d); onCaseLoaded(d);
      } catch (e) { setError((e as Error).message); }
    })();
  }, [caseId, localOwnerId, onCaseLoaded]);

  const scrollTo = (ref: React.RefObject<HTMLElement | HTMLHeadingElement | null>) => {
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };

  // ── Upload queue callbacks ──────────────────────────────────────────────
  const processItems = useCallback(async (itemsToProcess: UploadQueueItem[]) => {
    if (itemsToProcess.length === 0) return;

    setUploadProcessing(true);
    setUploadQueue(prev => prev.map(i =>
      itemsToProcess.some(it => it.id === i.id) ? { ...i, status: 'uploading' as const } : i
    ));

    for (const item of itemsToProcess) {
      try {
        let text = item.text ?? '';
        if (!text) {
          if (!item.file) throw new Error('Nessun file o testo disponibile');
          if (item.file.type.startsWith('text/') || item.file.name.endsWith('.txt')) {
            text = await item.file.text();
          } else {
            const fd = new FormData();
            fd.append('file', item.file);
            const res = await fetch(`${API}/api/upload`, { method: 'POST', body: fd });
            if (!res.ok) throw new Error(`Upload fallito (${res.status})`);
            const data = await res.json();
            text = data.extracted_text ?? '';
          }
        }

        setUploadQueue(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'done' as const, text } : i
        ));

        setCaseData(prevCase => {
          if (!prevCase) return prevCase;
          const newDoc: RawDocument = {
            doc_id: item.id,
            name: item.description || item.name,
            description: item.description || item.name,
            text,
            added_at: new Date().toISOString(),
            category: item.category,
          };
          const updated = {
            ...prevCase,
            raw_documents: [...(prevCase.raw_documents ?? []), newDoc],
          };
          dbSave(localOwnerId, updated);
          return updated;
        });

        const label = item.category === 'documento_medico' ? 'Doc. medico' : 'Documento';
        showToast(`${label} "${item.description || item.name}" aggiunto!`);
      } catch (e) {
        setUploadQueue(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'error' as const, error: (e as Error).message } : i
        ));
        showToast(`Errore caricamento "${item.description || item.name}": ${(e as Error).message}`, 'error');
      }
    }
    setUploadProcessing(false);
  }, [showToast]);

  const handleAddFiles = useCallback((files: File[], category: 'scheda' | 'documento_medico' = 'scheda') => {
    const MAX_BYTES = 50 * 1024 * 1024;
    const oversized = files.filter(f => f.size > MAX_BYTES);
    if (oversized.length) showToast(`${oversized.map(f => f.name).join(', ')}: file troppo grande (max 50 MB)`, 'error');
    const accepted = files.filter(f => f.size <= MAX_BYTES);
    if (!accepted.length) return;
    const newItems: UploadQueueItem[] = accepted.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      size: f.size,
      status: 'pending' as const,
      description: f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      category,
    }));
    setUploadQueue(prev => [...prev, ...newItems]);
    processItems(newItems);
    wizardBus.emit('material-added');
  }, [showToast, processItems]);

  const handleAddTextItem = useCallback((text: string, name?: string, category: 'scheda' | 'documento_medico' = 'scheda') => {
    const label = name || (category === 'documento_medico' ? 'Doc. medico incollato' : 'Testo incollato');
    const item: UploadQueueItem = {
      id: crypto.randomUUID(),
      file: null,
      name: label,
      size: text.length,
      status: 'done',
      text,
      description: label,
      category,
    };
    setUploadQueue(prev => [...prev, item]);

    setCaseData(prevCase => {
      if (!prevCase) return prevCase;
      const newDoc: RawDocument = {
        doc_id: item.id,
        name: label,
        description: label,
        text,
        added_at: new Date().toISOString(),
        category,
      };
      const updated = {
        ...prevCase,
        raw_documents: [...(prevCase.raw_documents ?? []), newDoc],
      };
      dbSave(localOwnerId, updated);
      return updated;
    });
    showToast(`"${label}" aggiunto!`);
    wizardBus.emit('material-added');
  }, [showToast]);

  const handleAddUrlItem = useCallback(async (url: string, name: string) => {
    const id = crypto.randomUUID();
    const label = name.trim() || url;
    const item: UploadQueueItem = {
      id,
      file: null,
      name: label,
      size: 0,
      status: 'uploading',
      category: 'documento_medico',
      description: label,
    };
    setUploadQueue(prev => [...prev, item]);
    wizardBus.emit('material-added');
    try {
      const res = await fetch(`${API}/api/fetch-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name: label }),
      });
      if (!res.ok) throw new Error(`Fetch URL fallito (${res.status})`);
      const data = await res.json();
      const text: string = data.extracted_text ?? '';
      setUploadQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'done', text, size: text.length } : i));
      setCaseData(prevCase => {
        if (!prevCase) return prevCase;
        const newDoc: RawDocument = {
          doc_id: id,
          name: label,
          description: label,
          text,
          added_at: new Date().toISOString(),
          category: 'documento_medico',
        };
        const updated = { ...prevCase, raw_documents: [...(prevCase.raw_documents ?? []), newDoc] };
        dbSave(localOwnerId, updated);
        return updated;
      });
      showToast(`Precedente "${label}" importato dall'URL!`);
    } catch (e) {
      setUploadQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: (e as Error).message } : i));
      showToast(`Errore importazione URL: ${(e as Error).message}`, 'error');
    }
  }, [showToast]);

  const handleRemoveQueueItem = useCallback((id: string) => {
    setUploadQueue(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleRetryQueueItem = useCallback((id: string) => {
    setUploadQueue(prev => {
      const item = prev.find(i => i.id === id);
      if (item) {
        const retryingItem = { ...item, status: 'pending' as const, error: undefined };
        processItems([retryingItem]);
        return prev.map(i => i.id === id ? retryingItem : i);
      }
      return prev;
    });
  }, [processItems]);

  const handleDeleteDoc = useCallback(async (docId: string) => {
    if (!caseData) return;
    const updated = { ...caseData, raw_documents: (caseData.raw_documents ?? []).filter(d => d.doc_id !== docId) };
    await dbSave(localOwnerId, updated);
    setCaseData(updated);
    showToast("Documento eliminato");
  }, [caseData, showToast]);

  const handleDeleteMaterial = useCallback(async (materialId: string) => {
    if (!caseData) return;
    const updated = { ...caseData, materials: caseData.materials.filter(m => m.id !== materialId) };
    await dbSave(localOwnerId, updated);
    setCaseData(updated);
    showToast("Materiale eliminato");
  }, [caseData, showToast]);

  const downloadPlt = useCallback((container: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(container, null, 2)], { type: 'application/vnd.pocket-legal-triage.case+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const buildExportCase = useCallback((includeDocs = false, anonymized = false) => {
    if (!caseData) return null;
    const rules = mergeRedactionRules(globalRules, caseData.redaction_rules ?? []);
    const base = anonymized ? applyRedactionToCase(caseData, rules) : caseData;
    return {
      ...base,
      raw_documents: includeDocs ? base.raw_documents : [],
      redaction_rules: [],
      analyzed_doc_ids: [],
    };
  }, [caseData, globalRules]);

  const handleExport = useCallback(async ({
    includeDocs = false,
    protectedFile = true,
    password = '',
    anonymized = false,
  }: { includeDocs?: boolean; protectedFile?: boolean; password?: string; anonymized?: boolean }) => {
    if (!caseData) return;
    try {
      const exportData = buildExportCase(includeDocs, anonymized);
      if (!exportData) return;
      const container = protectedFile
        ? await exportEncryptedSpr(exportData, password)
        : exportPlainSpr(exportData);
      downloadPlt(container, `${caseData.case_id}.spr`);
      showToast(protectedFile
        ? 'Scheda protetta esportata'
        : (anonymized ? 'Copia anonimizzata esportata senza password' : 'Scheda non protetta esportata'));
    } catch (e) {
      showToast(`Esportazione fallita: ${(e as Error).message}`, 'error');
    }
  }, [buildExportCase, caseData, downloadPlt, showToast]);

  const updateCase = useCallback(async (updater: (c: CaseAnalysis) => CaseAnalysis) => {
    if (!caseData) return;
    const updated = updater(caseData);
    await dbSave(localOwnerId, updated);
    setCaseData(updated);
  }, [caseData]);

  const fetchChatFull = useCallback(async (userMessage: string): Promise<string> => {
    const res = await fetch(`${API}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: userMessage }], mode: 'flash' }),
    });
    if (!res.ok || !res.body) throw new Error(`${res.status}`);
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ''; let full = '';
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const p = line.slice(6).trim(); if (p === '[DONE]') break;
        try { full += (JSON.parse(p) as { text: string }).text; } catch {}
      }
    }
    return full;
  }, []);

  const downloadTextFile = useCallback((content: string | Blob, filename: string, mime: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleOpenDraftWorkspace = useCallback(async (type: DraftArtifactType, title?: string, extraInstruction = '') => {
    if (!caseData) return;
    const sourceCase = redactionActive && hasActiveRules ? applyRedactionToCase(caseData, mergedRules) : caseData;
    const pianoEntry = PIANO_PROMPTS[type as keyof typeof PIANO_PROMPTS] ?? PIANO_PROMPTS.pianoSettimana;
    const promptTail = extraInstruction
      ? (ctx: string) => `${ctx}\n\n---\n${extraInstruction}`
      : (ctx: string) => `${ctx}\n\n---\n${pianoEntry.prompt}`;
    const prompt = buildDraftPrompt({
      caseData: sourceCase,
      type,
      promptTail,
      buildCaseContext,
      anonymized: redactionActive && hasActiveRules,
      extraInstruction: type === 'witnessCrossExam' ? '' : extraInstruction,
      workspaceTitle: title || draftTypeLabel(type),
    });
    const placeholder = createDraftArtifact({
      caseData,
      type,
      title: title || draftTypeLabel(type),
      prompt,
      anonymized: redactionActive && hasActiveRules,
      contentMarkdown: 'Generazione bozza in corso…\n\nLa workspace è già salvata nella scheda locale.',
    });
    const createdCase = addDraftArtifact(caseData, placeholder);
    await dbSave(localOwnerId, createdCase);
    setCaseData(createdCase);
    onCaseLoaded(createdCase);
    setActiveDraftId(placeholder.id);
    setActiveTab('piani');
    showToast('Nuova workspace bozza creata');

    try {
      const generated = await fetchChatFull(prompt);
      const finalized = {
        ...placeholder,
        content_markdown: generated || 'Nessun contenuto generato. Riprova dalla chat o modifica manualmente questa bozza.',
        updated_at: new Date().toISOString(),
      };
      const finalizedCase = updateDraftArtifact(createdCase, finalized);
      await dbSave(localOwnerId, finalizedCase);
      setCaseData(finalizedCase);
      onCaseLoaded(finalizedCase);
      showToast('Bozza salvata nella scheda');
    } catch (e) {
      const failed = {
        ...placeholder,
        content_markdown: `Generazione non riuscita: ${(e as Error).message}\n\nPuoi comunque usare questa workspace: il prompt è salvato nei metadati della bozza.`,
        generation_notes: {
          ...placeholder.generation_notes,
          warnings: [...placeholder.generation_notes.warnings, `Generazione fallita: ${(e as Error).message}`],
        },
        updated_at: new Date().toISOString(),
      };
      const failedCase = updateDraftArtifact(createdCase, failed);
      await dbSave(localOwnerId, failedCase);
      setCaseData(failedCase);
      onCaseLoaded(failedCase);
      showToast(`Generazione bozza fallita: ${(e as Error).message}`, 'error');
    }
  }, [caseData, redactionActive, hasActiveRules, mergedRules, localOwnerId, onCaseLoaded, fetchChatFull, showToast, updateCase]);

  const handleUpdateDraft = useCallback((draft: DraftArtifact) => {
    updateCase(c => updateDraftArtifact(c, draft));
  }, [updateCase]);

  const handleDeleteDraft = useCallback((id: string) => {
    updateCase(c => ({ ...c, draft_artifacts: (c.draft_artifacts ?? []).filter(draft => draft.id !== id) }));
    setActiveDraftId(prev => prev === id ? null : prev);
    showToast('Workspace bozza eliminata');
  }, [updateCase, showToast]);

  const handleExportDraft = useCallback(async (draft: DraftArtifact, format: 'md' | 'txt' | 'html' | 'docx') => {
    if (format !== 'docx') {
      const exported = exportDraftArtifact(draft, format);
      if (!confirm(`${exported.warning}\n\nProcedere con export ${format.toUpperCase()} non cifrato?`)) return;
      downloadTextFile(exported.content, exported.filename, exported.mime);
      showToast(`Bozza esportata in .${format}`);
      return;
    }
    if (!confirm(`${DRAFT_PLAINTEXT_EXPORT_WARNING}\n\nProcedere con export DOCX non cifrato?`)) return;
    try {
      const res = await fetch(`${API}/api/export-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_title: draft.title, brief_markdown: draft.content_markdown }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const blob = await res.blob();
      downloadTextFile(blob, `${draft.title.replace(/[^\w\s-]/g, '').trim() || 'bozza'}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      showToast('Bozza esportata in DOCX');
    } catch (e) {
      showToast(`Export DOCX fallito: ${(e as Error).message}`, 'error');
    }
  }, [downloadTextFile, showToast]);

  const handleAnonymizeBrief = useCallback(async () => {
    if (!caseData) return;
    setAnonModal(''); // empty = loading
    try {
      const result = await fetchChatFull(REDACT_APPLY_PROMPT(caseData.brief_markdown));
      setAnonModal(result);
    } catch (e) {
      setAnonModal(null);
      showToast(`Errore: ${(e as Error).message}`, 'error');
    }
  }, [caseData, fetchChatFull, showToast]);

  const handleAnonymizeDoc = useCallback(async (docId: string) => {
    if (!caseData) return;
    const doc = (caseData.raw_documents ?? []).find(d => d.doc_id === docId);
    if (!doc) return;
    setAnonymizingDocId(docId);
    try {
      const anonText = await fetchChatFull(REDACT_APPLY_PROMPT(doc.text));
      const updated = { ...caseData, raw_documents: (caseData.raw_documents ?? []).map(d => d.doc_id === docId ? { ...d, text: anonText, name: d.name.startsWith('[ANONIMIZZATO] ') ? d.name : `[ANONIMIZZATO] ${d.name}` } : d) };
      await dbSave(localOwnerId, updated);
      setCaseData(updated);
      showToast('Documento anonimizzato');
    } catch (e) {
      showToast(`Errore: ${(e as Error).message}`, 'error');
    } finally {
      setAnonymizingDocId(null);
    }
  }, [caseData, fetchChatFull, showToast]);

  const handleAnalyze = useCallback(async (mode: 'flash' | 'pro' = 'flash') => {
    if (!caseData) return;
    if (mode === 'pro') {
      const ok = confirm('Avviare un Approfondimento Pro con Aria? Verrà eseguita un\'analisi più approfondita del cliente solo dopo questa conferma.');
      if (!ok) return;
    }
    const docs = caseData.raw_documents ?? [];
    if (docs.length === 0) {
      showToast('Aggiungi almeno un documento prima di analizzare', 'error');
      return;
    }

    const analyzedIds = new Set(caseData.analyzed_doc_ids ?? []);
    const newDocs = docs.filter(d => !analyzedIds.has(d.doc_id));
    const isIncremental = caseData.analisi_progressi != null && newDocs.length > 0;

    wizardBus.emit('analyze-started');
    setShowUpload(false);
    setUploadQueue(prev => prev.filter(i => i.status !== 'done')); // Clear completed items from drawer
    setAnalyzing(true);
    try {
      const sourceDocs = isIncremental ? newDocs : docs;
      const docMaterials = sourceDocs.map(d => ({ name: d.description || d.name, kind: 'text', text: d.text, category: d.category ?? 'scheda' }));
      const ctxMaterial = buildUserContextMaterial(caseData);
      const materials = ctxMaterial ? [ctxMaterial, ...docMaterials] : docMaterials;
      const res = await fetch(`${API}/api/analyze-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_title: caseData.case_title, materials, mode, language: 'it' }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const merged = mergeWithAi(caseData, await res.json() as CaseAnalysis);
      // Segna i doc come analizzati ma NON li elimina — restano visibili sotto "Documenti della scheda"
      const analyzedDocIds = docs.map(d => d.doc_id);
      const updated = { ...merged, raw_documents: docs, analyzed_doc_ids: analyzedDocIds };
      await dbSave(localOwnerId, updated);
      setCaseData(updated);
      onCaseLoaded(updated);
      onCaseAnalyzed?.(updated);
      if (updated.pro_recommendation?.recommended) {
        showToast('Analisi standard completata. Aria suggerisce un Approfondimento Pro: nessun addebito senza conferma.', 'info');
      }
    } catch (e) {
      showToast(`Errore analisi: ${(e as Error).message}`, 'error');
    } finally {
      setAnalyzing(false);
    }
  }, [caseData, showToast, onCaseLoaded, onCaseAnalyzed]);

  const setCaseRedactionRules = useCallback((rules: RedactionRule[]) => {
    updateCase(c => ({ ...c, redaction_rules: rules }));
  }, [updateCase]);

  // ── List edit helpers (Pass 1: timeline, people, evidence, contradictions) ──
  const addTimelineEvent = () => updateCase(c => ({
    ...c,
    timeline: [...c.timeline, { date: '', time: null, title: '', description: '', source_refs: [], confidence: 1 }],
  }));
  const updateTimelineEvent = (i: number, patch: Partial<TimelineEvent>) => updateCase(c => ({
    ...c, timeline: c.timeline.map((ev, idx) => idx === i ? { ...ev, ...patch } : ev),
  }));
  const deleteTimelineEvent = (i: number) => updateCase(c => ({
    ...c, timeline: c.timeline.filter((_, idx) => idx !== i),
  }));

  const addPerson = () => updateCase(c => ({
    ...c, people: [...c.people, { name: '', role: '', notes: '', source_refs: [] }],
  }));
  const updatePerson = (i: number, patch: Partial<Person>) => updateCase(c => ({
    ...c, people: c.people.map((p, idx) => idx === i ? { ...p, ...patch } : p),
  }));
  const deletePerson = (i: number) => updateCase(c => ({
    ...c, people: c.people.filter((_, idx) => idx !== i),
  }));

  const addEvidence = () => updateCase(c => ({
    ...c, evidence: [...c.evidence, { title: '', status: '', notes: '', source_refs: [] }],
  }));
  const updateEvidence = (i: number, patch: Partial<EvidenceItem>) => updateCase(c => ({
    ...c, evidence: c.evidence.map((ev, idx) => idx === i ? { ...ev, ...patch } : ev),
  }));
  const deleteEvidence = (i: number) => updateCase(c => ({
    ...c, evidence: c.evidence.filter((_, idx) => idx !== i),
  }));

  const addContradiction = () => updateCase(c => ({
    ...c, contradictions: [...c.contradictions, { title: '', description: '', source_refs: [] }],
  }));
  const updateContradiction = (i: number, patch: Partial<Contradiction>) => updateCase(c => ({
    ...c, contradictions: c.contradictions.map((ct, idx) => idx === i ? { ...ct, ...patch } : ct),
  }));
  const deleteContradiction = (i: number) => updateCase(c => ({
    ...c, contradictions: c.contradictions.filter((_, idx) => idx !== i),
  }));

  const addOpenQuestion = () => updateCase(c => ({
    ...c, open_questions: [...c.open_questions, { question: '', why_it_matters: '', source_refs: [] }],
  }));
  const updateOpenQuestion = (i: number, patch: Partial<OpenQuestion>) => updateCase(c => ({
    ...c, open_questions: c.open_questions.map((q, idx) => idx === i ? { ...q, ...patch } : q),
  }));
  const deleteOpenQuestion = (i: number) => updateCase(c => ({
    ...c, open_questions: c.open_questions.filter((_, idx) => idx !== i),
  }));

  if (error) return (
    <main className="app-shell loading-shell">
      <AlertTriangle /><h1>Errore</h1><p>{error}</p>
      <button title="Azione secondaria" className="ghost-button" onClick={onBack}>← Torna ai fascicoli</button>
    </main>
  );

  if (!caseData) return (
    <main className="app-shell loading-shell">
      <Loader2 className="spin" size={40} /><p>Carico scheda cliente…</p>
    </main>
  );

  const rawDocs = caseData.raw_documents ?? [];
  const analyzedIdsSet = new Set(caseData.analyzed_doc_ids ?? []);
  const unanalyzedCount = rawDocs.filter(d => !analyzedIdsSet.has(d.doc_id)).length;
  const hasExistingAnalysis = caseData.analisi_progressi != null;
  const setRedactionActive = (val: boolean | ((prev: boolean) => boolean)) => {
    setRedactionOverride(prev => typeof val === 'function' ? val(prev !== null ? prev : hasActiveRules) : val);
  };
  const d = (redactionActive && hasActiveRules)
    ? applyRedactionToCase(caseData, mergedRules) : caseData;
  const la = d.analisi_progressi;
  const nextDeadline = [...d.procedural_deadlines].sort((a, b) =>
    `${a.due_date}T${a.due_time ?? '23:59'}`.localeCompare(`${b.due_date}T${b.due_time ?? '23:59'}`)
  )[0];

  return (
    <main className="app-shell">
      {/* Back button */}
      <button className="back-button" title="Torna alla lista clienti" onClick={onBack}><ArrowLeft size={15} /> Clienti</button>

      {analyzing && (
        <div className="analyzing-banner"><Loader2 className="spin" size={18} /> Analisi AI in corso…</div>
      )}

      {/* Hero */}
      <section className="hero-card">
        <div className="hero-topline">
          <span><Gavel size={14} /> SchedaPRO</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {la && (
              <div className="risk-pill" style={{ background: riskColor(la.livello_attenzione) + '22', border: `1px solid ${riskColor(la.livello_attenzione)}55`, color: riskColor(la.livello_attenzione) }}>
                {riskIcon(la.livello_attenzione)} Attenzione {riskLabel(la.livello_attenzione)}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 4 }}>
              <button
                className={`anonymize-action-btn${redactionActive ? ' anonymize-action-active' : ''}`}
                onClick={() => setShowRedactionDrawer(true)}
                title="Anonimizza dati sensibili prima di condividere"
              >
                {redactionActive ? <EyeOff size={13} /> : <ShieldCheck size={13} />}
                {redactionActive ? 'Vista anonimizzata' : `Anonimizza${mergedRules.filter(r => r.enabled).length ? ` · ${mergedRules.filter(r => r.enabled).length}` : ''}`}
              </button>
              {mergedRules.some(r => r.enabled) && (
                <button
                  className={`ghost-button redact-toggle-btn${redactionActive ? ' redact-toggle-active' : ''}`}
                  style={{ padding: '0 10px', height: 'auto', borderRadius: 999 }}
                  onClick={() => setRedactionActive(v => !v)}
                  title={redactionActive ? 'Mostra dati originali' : 'Mostra vista anonimizzata'}
                >
                  {redactionActive ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
              )}
            </div>
            <button
              className="ghost-button"
              onClick={() => setShowExportModal(true)}
              title="Esporta scheda"
            >
              <Share2 size={13} /> Esporta
            </button>
          </div>
        </div>
        <h1>
          <Editable
            value={d.case_title}
            onChange={t => updateCase(c => ({ ...c, case_title: t }))}
            placeholder="Nome del cliente…"
            readOnly={redactionActive}
          />
        </h1>
        <p>
          <Editable
            value={d.case_summary}
            onChange={t => updateCase(c => ({ ...c, case_summary: t }))}
            placeholder="Obiettivo e note principali (tocca per scrivere)…"
            multiline
            readOnly={redactionActive}
          />
        </p>
        <div className="hero-actions">
          <button className="primary-button" data-tour="add-document" onClick={() => { setShowUpload(true); wizardBus.emit('upload-opened'); }} title="Carica nuovi documenti PDF o immagini" style={uploadQueue.length > 0 ? { position: 'relative' } : undefined}>
            <Upload size={15} /> Aggiungi documento
            {uploadQueue.length > 0 && (
              <span className="upload-badge-hero">
                {uploadProcessing
                  ? <><Loader2 size={11} className="spin" /> {uploadQueue.filter(i => i.status === 'uploading' || i.status === 'pending').length} in elaborazione</>
                  : `${uploadQueue.length} in coda`}
              </span>
            )}
          </button>
          {(!hasExistingAnalysis || unanalyzedCount > 0) && (
            <button title="Esegui azione"
              data-tour="analyze"
              className="secondary-button"
              onClick={() => handleAnalyze('flash')}
              disabled={analyzing || rawDocs.length === 0}
            >
              <Sparkles size={14} />
              {hasExistingAnalysis
                ? `Incorpora ${unanalyzedCount} documento${unanalyzedCount === 1 ? '' : 'i'}`
                : 'Analizza con AI'}
            </button>
          )}
          {hasExistingAnalysis && (
            <button
              className="ghost-button"
              onClick={() => {
                const updated = { ...caseData, analyzed_doc_ids: [], case_summary: '', materials: [], timeline: [], people: [], evidence: [], open_questions: [], missing_documents: [], contradictions: [], procedural_deadlines: [], brief_markdown: '', usage_estimate: { pages: 0, audio_minutes: 0, flash_input_tokens: 0, flash_output_tokens: 0, pro_used: false, model_route: '' }, pro_recommendation: { recommended: false, reasons: [], message: '', cta_label: 'Avvia Analisi Pro', alternate_label: 'Continua con analisi standard', requires_confirmation: true, auto_charge: false }, analisi_progressi: null };
                dbSave(localOwnerId, updated).then(() => { setCaseData(updated); onCaseLoaded(updated); showToast('Analisi resettata. Ora puoi ri-analizzare da capo.'); });
              }}
              title="Resetta l'analisi e ri-analizza tutti i documenti da capo"
            >
              <RefreshCw size={13} /> Ri-analizza
            </button>
          )}
          <button className="aula-trigger-btn" title="Vista rapida per consultazione durante sessione" onClick={() => setAulaModeActive(true)}>
            <Gavel size={14} /> Vista sessione
          </button>
        </div>
        {d.pro_recommendation?.recommended && (
          <div className="pro-recommendation-card" role="status" aria-live="polite">
            <div>
              <p className="eyebrow">Approfondimento Pro con Aria</p>
              <p>{d.pro_recommendation.message}</p>
              <p className="muted">L’analisi standard resta inclusa. Pro parte solo con conferma: nessun addebito automatico.</p>
            </div>
            <div className="pro-recommendation-actions">
              <button className="primary-button" onClick={() => handleAnalyze('pro')} disabled={analyzing || rawDocs.length === 0}>
                <Sparkles size={14} /> {d.pro_recommendation.cta_label}
              </button>
              <button
                className="ghost-button"
                onClick={() => updateCase(c => ({ ...c, pro_recommendation: { ...c.pro_recommendation!, recommended: false } }))}
              >
                {d.pro_recommendation.alternate_label}
              </button>
            </div>
          </div>
        )}
      </section>

      <AriaPromptBar onOpenChat={(msg) => onOpenChat(msg ?? '')} />

      {/* Stats */}
      <section className="stats-grid">
        <button className="stats-card" title="Vai a questa sezione" onClick={() => { scrollTo(materialsRef); }}>
          <FileText /><strong>{d.materials.length}</strong><span>materiali</span>
        </button>
        <button className="stats-card" title="Vai a questa sezione" onClick={() => { setActiveTab('timeline'); scrollTo(timelineRef); }}>
          <Clock /><strong>{d.timeline.length}</strong><span>eventi</span>
        </button>
        <button className="stats-card" title="Vai a questa sezione" onClick={() => { setActiveTab('questions'); scrollTo(contradictionsRef); }}>
          <AlertTriangle /><strong>{d.contradictions.length}</strong><span>contraddizioni</span>
        </button>
        <button className="stats-card" title="Vai a questa sezione" onClick={() => { setActiveTab('deadlines'); scrollTo(deadlinesRef); }}>
          <CalendarClock /><strong>{nextDeadline ? formatShortDate(nextDeadline.due_date) : '—'}</strong><span>priorità</span>
        </button>
      </section>

      {/* Next deadline banner */}
      {nextDeadline && (
        <section className="deadline-card" onClick={() => setActiveTab('deadlines')}>
          <div>
            <p className="eyebrow">Prossima priorità</p>
            <h2>{nextDeadline.title}</h2>
            <p>{formatDate(nextDeadline.due_date)}{nextDeadline.due_time ? ` · ${nextDeadline.due_time}` : ''} · {nextDeadline.status === 'confirmed' ? 'confermato' : 'da confermare'}</p>
            <p>{nextDeadline.description}</p>
            <button title="Apri una nuova bozza di preparazione udienza"
              className="giulia-ctx-btn"
              onClick={e => {
                e.stopPropagation();
                handleOpenDraftWorkspace(
                  'strategy',
                  nextDeadline.title,
                  `Prepara una bozza operativa sulla prossima priorità "${nextDeadline.title}" (${nextDeadline.due_date}${nextDeadline.due_time ? ` alle ${nextDeadline.due_time}` : ''}). Indica priorità difensive, documenti da portare o acquisire, atti da predisporre, rischi, verifiche fattuali e fonti da controllare. Descrizione scadenza/priorità: ${nextDeadline.description}`
                );
              }}
            >
              <MessageSquare size={12} /> Prepara con Aria
            </button>
          </div>
          <ShieldCheck className="deadline-icon" />
        </section>
      )}

      {/* Tab bar (scrollable) */}
      <nav className="tab-bar">
        {tabs.map(tab => (
          <button title="Esegui azione" key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
            {tab.id === 'analisi' && la && (
              <span className="tab-risk-dot" style={{ background: riskColor(la.livello_attenzione) }} />
            )}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Timeline */}
      {activeTab === 'timeline' && (
        <section ref={timelineRef} className="panel timeline-panel">
          {d.timeline.length === 0 && (
            <div className="empty-state-placeholder">
              <p className="muted" style={{ marginBottom: 12 }}>Nessun evento ancora nella timeline.</p>
              <p className="muted" style={{ fontSize: '0.85rem' }}>Carica dei documenti e clicca su <strong>Analizza con AI</strong> in alto per estrarre automaticamente la cronologia dei fatti, oppure aggiungi un evento manualmente.</p>
            </div>
          )}
          {d.timeline.map((ev, i) => (
            <article className="timeline-item" key={i}>
              <div className="time-dot" />
              <div className="timeline-content">
                <div className="editable-row-head">
                  <p className="eyebrow">
                    <Editable
                      value={ev.date ?? ''}
                      onChange={v => updateTimelineEvent(i, { date: v || null })}
                      placeholder="data"
                    />
                    {' · '}
                    <Editable
                      value={ev.time ?? ''}
                      onChange={v => updateTimelineEvent(i, { time: v || null })}
                      placeholder="orario"
                    />
                  </p>
                  <RowDelete onClick={() => deleteTimelineEvent(i)} label={ev.title} />
                </div>
                <h3>
                  <Editable
                    value={ev.title}
                    onChange={v => updateTimelineEvent(i, { title: v })}
                    placeholder="Titolo evento…"
                  />
                </h3>
                <p>
                  <Editable
                    value={ev.description}
                    onChange={v => updateTimelineEvent(i, { description: v })}
                    placeholder="Descrizione evento…"
                    multiline
                  />
                </p>
                <SourceRow refs={ev.source_refs} onSelect={setSelectedSource} />
              </div>
            </article>
          ))}
          <AddRowButton label="Aggiungi evento" onClick={addTimelineEvent} />
        </section>
      )}

      {/* Deadlines */}
      {activeTab === 'deadlines' && (
        <section ref={deadlinesRef} className="panel deadline-list-panel">
          <h2><CalendarClock size={18} /> Agenda difensiva</h2>
          <p className="muted">Appuntamenti del cliente. I candidati vanno confermati prima di essere trattati come operativi.</p>
          {d.procedural_deadlines.length === 0 && (
            <p className="muted">Nessun appuntamento. Aggiungi il primo.</p>
          )}
          {d.procedural_deadlines.map((dl, i) => {
            const upd = (patch: Partial<Appuntamento>) => updateCase(c => ({
              ...c, procedural_deadlines: c.procedural_deadlines.map((d, idx) => idx === i ? { ...d, ...patch } : d),
            }));
            const del = () => updateCase(c => ({ ...c, procedural_deadlines: c.procedural_deadlines.filter((_, idx) => idx !== i) }));
            return (
              <article className="deadline-item" key={i}>
                <div className="deadline-item-header">
                  <div style={{ flex: 1 }}>
                    <p className="eyebrow">
                      <EditableSelect
                        value={dl.deadline_type}
                        options={[
                          { value: 'sessione_pt', label: 'Sessione PT' },
                          { value: 'check_in', label: 'Check-in' },
                          { value: 'gara', label: 'Gara/Evento' },
                          { value: 'visita_medica', label: 'Visita medica' },
                          { value: 'altro', label: 'Altro' },
                        ]}
                        onChange={v => upd({ deadline_type: v })}
                      />
                      {' · urgenza '}
                      <EditableSelect
                        value={dl.urgency}
                        options={[
                          { value: 'alta', label: 'alta' }, { value: 'media', label: 'media' }, { value: 'bassa', label: 'bassa' },
                        ]}
                        onChange={v => upd({ urgency: v })}
                      />
                    </p>
                    <h3>
                      <Editable value={dl.title} onChange={v => upd({ title: v })} placeholder="Titolo scadenza…" />
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <EditableSelect
                      value={dl.status}
                      options={[
                        { value: 'confirmed', label: 'confermato' },
                        { value: 'candidate', label: 'da confermare' },
                        { value: 'needs_review', label: 'verifica' },
                      ]}
                      onChange={v => upd({ status: v })}
                      className={`status-chip ${dl.status}`}
                    />
                    <RowDelete onClick={del} label={dl.title} />
                  </div>
                </div>
                <p className="deadline-date">
                  <Editable value={dl.due_date} onChange={v => upd({ due_date: v })} placeholder="data scadenza" />
                  {' · '}
                  <Editable value={dl.due_time ?? ''} onChange={v => upd({ due_time: v || null })} placeholder="orario" />
                </p>
                <p>
                  <Editable value={dl.description} onChange={v => upd({ description: v })} placeholder="Descrizione appuntamento…" multiline />
                </p>
                <div className="task-progress">
                  <div className="task-progress-bar">
                    <div className="task-progress-fill" style={{ width: `${dl.tasks.length ? (doneCount(dl.title, dl.tasks.length) / dl.tasks.length) * 100 : 0}%` }} />
                  </div>
                  <span>{doneCount(dl.title, dl.tasks.length)}/{dl.tasks.length} completati</span>
                </div>
                <ul className="task-list">
                  {dl.tasks.map((t, ti) => (
                    <li key={ti} className={`task-item${isDone(dl.title, ti) ? ' task-done' : ''}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <button title="Esegui azione"
                        onClick={() => toggleTask(dl.title, ti)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', marginTop: 2 }}
                      >
                        {isDone(dl.title, ti)
                          ? <CheckSquare size={15} className="task-icon task-icon-done" />
                          : <Square size={15} className="task-icon" />}
                      </button>
                      <span style={{ flex: 1 }}>
                        <Editable
                          value={t}
                          onChange={v => upd({ tasks: dl.tasks.map((x, idx) => idx === ti ? v : x) })}
                          placeholder="Task…"
                          multiline
                        />
                      </span>
                      <RowDelete onClick={() => upd({ tasks: dl.tasks.filter((_, idx) => idx !== ti) })} />
                    </li>
                  ))}
                </ul>
                <AddRowButton label="Aggiungi task" onClick={() => upd({ tasks: [...dl.tasks, ''] })} />
                <SourceRow refs={dl.source_refs} onSelect={setSelectedSource} />
              </article>
            );
          })}
          <AddRowButton
            label="Aggiungi appuntamento"
            onClick={() => updateCase(c => ({
              ...c, procedural_deadlines: [...c.procedural_deadlines, {
                title: '', deadline_type: 'altro', due_date: '', due_time: null,
                status: 'candidate', urgency: 'media', description: '', source_refs: [], tasks: [],
              }],
            }))}
          />
        </section>
      )}

      {/* People & evidence */}
      {activeTab === 'facts' && (
        <section className="panel grid-panel">
          <div>
            <h2><Users size={18} /> Persone</h2>
            {d.people.length === 0 && <p className="muted">Nessuna persona. Aggiungi un nome.</p>}
            {d.people.map((p, i) => (
              <article className="mini-card" key={i}>
                <div className="editable-row-head">
                  <h3>
                    <Editable
                      value={p.name}
                      onChange={v => updatePerson(i, { name: v })}
                      placeholder="Nome…"
                    />
                  </h3>
                  <RowDelete onClick={() => deletePerson(i)} label={p.name} />
                </div>
                <p className="role">
                  <Editable
                    value={p.role}
                    onChange={v => updatePerson(i, { role: v })}
                    placeholder="Ruolo…"
                  />
                </p>
                <p>
                  <Editable
                    value={p.notes}
                    onChange={v => updatePerson(i, { notes: v })}
                    placeholder="Note…"
                    multiline
                  />
                </p>
                <SourceRow refs={p.source_refs} onSelect={setSelectedSource} />
              </article>
            ))}
            <AddRowButton label="Aggiungi persona" onClick={addPerson} />
          </div>
          <div>
            <h2><Search size={18} /> Prove</h2>
            {d.evidence.length === 0 && <p className="muted">Nessuna prova. Aggiungi un elemento.</p>}
            {d.evidence.map((ev, i) => (
              <article className="mini-card" key={i}>
                <div className="editable-row-head">
                  <h3>
                    <Editable
                      value={ev.title}
                      onChange={v => updateEvidence(i, { title: v })}
                      placeholder="Titolo prova…"
                    />
                  </h3>
                  <RowDelete onClick={() => deleteEvidence(i)} label={ev.title} />
                </div>
                <p className="role">
                  <Editable
                    value={ev.status}
                    onChange={v => updateEvidence(i, { status: v })}
                    placeholder="Stato…"
                  />
                </p>
                <p>
                  <Editable
                    value={ev.notes}
                    onChange={v => updateEvidence(i, { notes: v })}
                    placeholder="Note…"
                    multiline
                  />
                </p>
                <SourceRow refs={ev.source_refs} onSelect={setSelectedSource} />
              </article>
            ))}
            <AddRowButton label="Aggiungi prova" onClick={addEvidence} />
          </div>
        </section>
      )}

      {/* Analisi progressi */}
      {activeTab === 'analisi' && (
        la
          ? <AnalisiProgressiTab
              la={la}
              onSelectSource={setSelectedSource}
              onOpenChat={onOpenChat}
              onOpenDraft={handleOpenDraftWorkspace}
              onUpdate={updater => updateCase(c => ({ ...c, analisi_progressi: c.analisi_progressi ? updater(c.analisi_progressi) : null }))}
            />
          : (
            <section className="panel">
              <div className="empty-state-placeholder">
                <p className="muted" style={{ marginBottom: 12 }}>Nessuna analisi AI presente.</p>
                <p className="muted" style={{ fontSize: '0.85rem' }}>Aggiungi log di sessione o misurazioni e clicca su <strong>Analizza con AI</strong> per estrarre automaticamente progressi, plateau e raccomandazioni, oppure crea l'analisi manualmente.</p>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <button title="Conferma operazione principale" className="primary-button" onClick={() => handleAnalyze('flash')} disabled={analyzing || rawDocs.length === 0}>
                  <Sparkles size={14} /> Analizza con AI
                </button>
                <button title="Esegui azione"
                  className="secondary-button"
                  onClick={() => updateCase(c => ({ ...c, analisi_progressi: {
                    livello_attenzione: 'medium',
                    sommario: '',
                    azioni_immediate: [],
                    obiettivi: [],
                    approcci: [],
                    limitazioni_fisiche: [],
                    valutazioni_aderenza: [],
                    bilancio: null,
                    nota_cliente: '',
                  } }))}
                >
                  <Plus size={14} /> Crea analisi manualmente
                </button>
              </div>
            </section>
          )
      )}

      {/* Piani workspace */}
      {activeTab === 'piani' && (
        <DraftingWorkspace
          caseTitle={caseData.case_title}
          drafts={caseData.draft_artifacts ?? []}
          activeDraftId={activeDraftId}
          onSelectDraft={setActiveDraftId}
          onUpdateDraft={handleUpdateDraft}
          onDeleteDraft={handleDeleteDraft}
          onExportDraft={handleExportDraft}
          onOpenProtectedPltExport={() => setShowExportModal(true)}
        />
      )}

      {/* Questions / contradictions */}
      {activeTab === 'questions' && (
        <section className="panel">
          <h2>Note del trainer</h2>
          {d.open_questions.length === 0 && <p className="muted">Nessuna domanda aperta.</p>}
          {d.open_questions.map((q, i) => (
            <article className="question-card" key={i}>
              <div className="editable-row-head">
                <h3>
                  <Editable
                    value={q.question}
                    onChange={v => updateOpenQuestion(i, { question: v })}
                    placeholder="Domanda…"
                  />
                </h3>
                <RowDelete onClick={() => deleteOpenQuestion(i)} label={q.question} />
              </div>
              <p>
                <Editable
                  value={q.why_it_matters}
                  onChange={v => updateOpenQuestion(i, { why_it_matters: v })}
                  placeholder="Perché è rilevante…"
                  multiline
                />
              </p>
              <SourceRow refs={q.source_refs} onSelect={setSelectedSource} />
              {q.question && (
                <button className="giulia-ctx-btn" title="Chiedi a Aria di analizzare questo elemento in dettaglio" onClick={() => onOpenChat(`Come lavoriamo su questa domanda: "${q.question}"? Perché conta: ${q.why_it_matters}. Suggerisci le azioni concrete per rispondere a questa priorità.`)}>
                  <MessageSquare size={12} /> Chiedi a Aria
                </button>
              )}
            </article>
          ))}
          <AddRowButton label="Aggiungi domanda" onClick={addOpenQuestion} />

          <h2 style={{ marginTop: 28 }}>Documenti mancanti</h2>
          {d.missing_documents.length === 0 && <p className="muted">Nessun documento segnalato come mancante.</p>}
          {d.missing_documents.map((doc, i) => (
            <article className="missing-card" key={i}>
              <CheckCircle2 />
              <div style={{ flex: 1 }}>
                <div className="editable-row-head">
                  <h3>
                    <Editable
                      value={doc.title}
                      onChange={v => updateCase(c => ({ ...c, missing_documents: c.missing_documents.map((d, idx) => idx === i ? { ...d, title: v } : d) }))}
                      placeholder="Documento mancante…"
                    />
                    {' '}
                    <EditableSelect
                      value={doc.priority}
                      options={[
                        { value: 'alta', label: 'alta' }, { value: 'media', label: 'media' }, { value: 'bassa', label: 'bassa' },
                      ]}
                      onChange={v => updateCase(c => ({ ...c, missing_documents: c.missing_documents.map((d, idx) => idx === i ? { ...d, priority: v } : d) }))}
                    />
                  </h3>
                  <RowDelete
                    onClick={() => updateCase(c => ({ ...c, missing_documents: c.missing_documents.filter((_, idx) => idx !== i) }))}
                    label={doc.title}
                  />
                </div>
                <p>
                  <Editable
                    value={doc.reason}
                    onChange={v => updateCase(c => ({ ...c, missing_documents: c.missing_documents.map((d, idx) => idx === i ? { ...d, reason: v } : d) }))}
                    placeholder="Motivo…"
                    multiline
                  />
                </p>
              </div>
            </article>
          ))}
          <AddRowButton
            label="Aggiungi documento mancante"
            onClick={() => updateCase(c => ({ ...c, missing_documents: [...c.missing_documents, { title: '', reason: '', priority: 'media' }] }))}
          />

          <h2 ref={contradictionsRef} style={{ marginTop: 28 }}>Contraddizioni</h2>
          {d.contradictions.length === 0 && <p className="muted">Nessuna contraddizione segnalata.</p>}
          {d.contradictions.map((ct, i) => (
            <article className="question-card contradiction" key={i}>
              <div className="editable-row-head">
                <h3>
                  <Editable
                    value={ct.title}
                    onChange={v => updateContradiction(i, { title: v })}
                    placeholder="Contraddizione…"
                  />
                </h3>
                <RowDelete onClick={() => deleteContradiction(i)} label={ct.title} />
              </div>
              <p>
                <Editable
                  value={ct.description}
                  onChange={v => updateContradiction(i, { description: v })}
                  placeholder="Descrizione…"
                  multiline
                />
              </p>
              <SourceRow refs={ct.source_refs} onSelect={setSelectedSource} />
              {ct.title && (
                <button className="giulia-ctx-btn" title="Chiedi a Aria di analizzare questo elemento in dettaglio" onClick={() => onOpenChat(`Come gestiamo questa incongruenza con il cliente: "${ct.title}"? ${ct.description} Suggerisci come affrontarla nel piano di allenamento e come comunicarla.`)}>
                  <MessageSquare size={12} /> Chiedi a Aria
                </button>
              )}
            </article>
          ))}
          <AddRowButton label="Aggiungi contraddizione" onClick={addContradiction} />
        </section>
      )}

      {/* Brief */}
      {activeTab === 'brief' && (
        <section className="panel brief-panel">
          <div className="brief-toolbar">
            <button className="brief-action-btn" title="Azione rapida sul documento" onClick={exportBriefDocx}><FileText size={14} /> Scarica DOCX</button>
            <button className="brief-action-btn" title="Azione rapida sul documento" onClick={exportBrief}><Copy size={14} /> Copia</button>
            <button className="brief-action-btn" title="Azione rapida sul documento" onClick={shareBrief}><Share2 size={14} /> Condividi</button>
            <button className="brief-action-btn" title="Azione rapida sul documento" onClick={handleAnonymizeBrief}><EyeOff size={14} /> Anonimizza</button>
            <button className="brief-action-btn" title="Azione rapida sul documento" onClick={() => setAulaModeActive(true)}><Gavel size={14} /> Vista sessione</button>
          </div>
          <textarea
            className="editable-input editable-input-multi brief-editor"
            value={caseData.brief_markdown}
            onChange={e => updateCase(c => ({ ...c, brief_markdown: e.target.value }))}
            placeholder="Scrivi il promemoria in markdown. Usa ## per i titoli, - per i bullet, **grassetto**."
            rows={24}
          />
          <div className="brief-preview">
            <p className="eyebrow">Anteprima</p>
            {markdownToLines(d.brief_markdown).map((line, i) => {
              if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
              if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
              if (line.startsWith('- ')) return <p className="bullet" key={i}>• {line.slice(2)}</p>;
              if (line.startsWith('**') && line.endsWith('**')) return <p key={i}><strong>{line.slice(2, -2)}</strong></p>;
              return <p key={i}>{line.replaceAll('**', '')}</p>;
            })}
          </div>
          <div className="usage-box">
            <p className="eyebrow">Stima token richiesti</p>
            <p>
              {caseData.usage_estimate.pages} pag · {caseData.usage_estimate.audio_minutes} min audio ·
              Flash {caseData.usage_estimate.flash_input_tokens}/{caseData.usage_estimate.flash_output_tokens} tok ·
              Pro: {caseData.usage_estimate.pro_used ? 'sì' : 'no'}
            </p>
          </div>
        </section>
      )}

      {/* Raw documents (always visible — the source files in this scheda) */}
      <section ref={materialsRef} className="materials-panel">
        <div className="materials-header">
          <h2>Documenti del cliente ({rawDocs.length})</h2>
          <button className="upload-fab" title="Aggiungi nuovi log, misurazioni o documenti" onClick={() => setShowUpload(true)}>
            <Plus size={16} /> Aggiungi
            {uploadQueue.length > 0 && <span className="upload-badge">{uploadQueue.length}</span>}
          </button>
        </div>
        {rawDocs.length === 0 && (
          <p className="muted">Nessun documento. Aggiungi PDF, testi o note manuali.</p>
        )}
        {rawDocs.map(doc => (
          <div key={doc.doc_id} className="pending-doc-row">
            <button className="pending-doc-item pending-doc-item-flex" title="Visualizza il contenuto estratto dal documento" onClick={() => setSelectedRawDoc(doc)}>
              <FileText size={18} className="pending-doc-icon" />
              <div>
                <strong>{doc.description || doc.name}</strong>
                <small>{doc.name} · {new Date(doc.added_at).toLocaleDateString('it')}</small>
              </div>
            </button>
            <button
              className="ghost-button pending-doc-anon-btn"
              title="Anonimizza questo documento con AI"
              disabled={anonymizingDocId === doc.doc_id}
              onClick={() => handleAnonymizeDoc(doc.doc_id)}
            >
              {anonymizingDocId === doc.doc_id ? <Loader2 size={13} className="spin" /> : <EyeOff size={13} />}
            </button>
            <button
              className="ghost-button"
              title="Elimina questo documento"
              onClick={() => handleDeleteDoc(doc.doc_id)}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </section>

      {/* AI-extracted materials (post-analysis only) */}
      {d.materials.length > 0 && (
        <section className="materials-panel">
          <div className="materials-header">
            <h2>Materiali estratti dall'AI</h2>
          </div>
          {d.materials.map((m: Material) => (
            <div key={m.id} className="pending-doc-row">
              <button className="material-button pending-doc-item-flex" title="Visualizza questo materiale investigativo" onClick={() => setSelectedMaterial(m)}>
                {m.kind === 'audio' ? <Mic size={17} /> : <FileText size={17} />}
                <div>
                  <strong>{m.name}</strong>
                  <p>{m.description}</p>
                  <small>{m.excerpt}</small>
                </div>
              </button>
              <button
                className="ghost-button pending-doc-anon-btn"
                title="Elimina questo materiale"
                onClick={() => handleDeleteMaterial(m.id)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </section>
      )}

      <SourceDrawer source={selectedSource} onClose={() => setSelectedSource(null)} />
      <MaterialDrawer material={selectedMaterial} onClose={() => setSelectedMaterial(null)} />
      <RawDocDrawer doc={selectedRawDoc} onClose={() => setSelectedRawDoc(null)} onDelete={handleDeleteDoc} />
      {showRedactionDrawer && (
        <RedactionDrawer
          globalRules={globalRules} setGlobalRules={setGlobalRules}
          caseRules={caseRedactionRules} setCaseRules={setCaseRedactionRules}
          onClose={() => {
            setShowRedactionDrawer(false);
            setRedactionOverride(null);
          }}
          caseCtx={buildCaseContext(caseData)}
          apiBase={API}
        />
      )}
      {anonModal !== null && <AnonModal text={anonModal} onClose={() => setAnonModal(null)} />}
      {showExportModal && (
        <ExportCaseDrawer
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          hasAnonymizationRules={mergedRules.some(r => r.enabled && r.original.trim())}
        />
      )}
      {showUpload && (
        <Suspense fallback={null}>
          <MultiFileUploadDrawer
            queue={uploadQueue}
            onClose={() => {
              setUploadQueue(prev => prev.filter(i => i.status !== 'done'));
              setShowUpload(false);
              wizardBus.emit('upload-closed');
            }}
            onAddFiles={handleAddFiles}
            onRemoveItem={handleRemoveQueueItem}
            onRetryItem={handleRetryQueueItem}
            onAddTextItem={handleAddTextItem}
            processing={uploadProcessing}
            onAnalyze={() => handleAnalyze('flash')}
          />
        </Suspense>
      )}
      {aulaModeActive && <AulaModeOverlay caseData={caseData} onClose={() => setAulaModeActive(false)} />}
      {toast && <ToastNotification message={toast.message} type={toast.type} onDismiss={dismissToast} />}
    </main>
  );
}

export default CaseDetailView;
