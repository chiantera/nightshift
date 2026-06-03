import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle, ArrowLeft, ArrowRight, BookOpen,
  CalendarClock, CheckCircle2, CheckSquare, ChevronDown, ChevronRight,
  Clock, Copy, Dumbbell, Eye, EyeOff, FileText, FolderPlus, Loader2, MessageSquare, Mic, Plus, RefreshCw,
  Globe, Scale, Search, Send, Share2, ShieldAlert, ShieldCheck, ShieldOff, Sparkles,
  Square, Trash2, Upload, Users, X, Zap, FolderOpen,
} from 'lucide-react';

const MultiFileUploadDrawer = React.lazy(() => import('./components/MultiFileUploadDrawer'));
const CaseDetailView = React.lazy(() => import('./screens/CaseDetailView'));
import { ChatDrawer, FloatingChatButton, FabRestoreButton } from './components/ChatPanel';
import AriaPromptBar from './components/AriaPromptBar';
import AccountControls from './components/AccountControls';
import { resumePersistedAnalyses, runningAnalysisCount, getAnalysisState, useAnalysisTick } from './analysis/analysisManager';
import LockGate from './lock/LockGate';
import './lock/lock.css';
import { recordAcceptance, ensureAcceptanceTs, isSessionExpired, clearAcceptance } from './auth/sessionExpiry';
import OnboardingWizard from './onboarding/OnboardingWizard';
import { wizardBus } from './onboarding/wizardBus';
import './tokens.css';
import './styles.css';
import { API } from './config';
import { riskColor, riskIcon, riskLabel } from './domain/helpers';
import { formatDate, formatDateFull, formatShortDate } from './dateUtils';
import { dbSave, dbList, dbGet, dbDelete, dbClaimLegacyCases, localOwnerIdFromSession } from './db';
import { installMockApi } from './data/mockApi';
import { decryptSprContainer, exportEncryptedSpr, exportPlainSpr, parseSprFile } from './sprExport';
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
} from './draftArtifacts';
import { type Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { PIANO_PROMPTS } from './prompts/pianoDrafts';
import { REDACT_APPLY_PROMPT, REDACT_DETECT_PROMPT } from './prompts/redaction';
import { SYSTEM_PROMPT_IT } from './prompts/aria';
import { buildCaseContext, caseAnalysisToSummary } from './domain/caseContext';
import { buildUserContextMaterial, mergeWithAi } from './domain/caseMerge';
import { applyRedactionToCase, mergeRedactionRules } from './domain/redaction';
import type {
  AnalisiProgressi,
  Appuntamento,
  ApproccioAllenamento,
  BilancioProgressi,
  CaseAnalysis,
  CaseSummary,
  ChatMsg,
  ChatState,
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
  ValutazioneAderenza,
} from './domain/types';

const DEV_BYPASS_AUTH =
  import.meta.env.VITE_BYPASS_AUTH === 'true' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

if (import.meta.env.VITE_MOCK_DATA === 'true') installMockApi();

// ── Domain helpers ───────────────────────────────────────────────────────────

function NewCaseDrawer({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string) => void }) {
  const [title, setTitle] = useState('');
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="source-drawer upload-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-header">
          <div><p className="eyebrow">Scheda</p><h2>Nuovo cliente</h2></div>
          <button title="Chiudi o annulla" onClick={onClose} className="ghost-button"><X size={18} /></button>
        </div>
        <div className="upload-field">
          <label>Nome del cliente</label>
          <input
            className="upload-input"
            placeholder="es. Marco Bianchi"
            value={title}
            autoFocus
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && title.trim()) onCreate(title.trim()); }}
          />
        </div>
        <div className="upload-actions">
          <button className="ghost-button" onClick={onClose} title="Annulla operazione">Annulla</button>
          <button title="Conferma operazione principale" className="primary-button" disabled={!title.trim()} onClick={() => title.trim() && onCreate(title.trim())}>
            <FolderPlus size={15} /> Crea scheda
          </button>
        </div>
      </aside>
    </div>
  );
}

// MultiFileUploadDrawer → src/components/MultiFileUploadDrawer.tsx (lazy-loaded)

// ── Case list view ────────────────────────────────────────────────────────────

function HomepageStats({ cases }: { cases: CaseSummary[] }) {
  const critical = cases.filter(c => c.risk_level === 'critical' || c.risk_level === 'high').length;
  const totalContradictions = cases.reduce((s, c) => s + c.contradiction_count, 0);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = cases.filter(c => c.next_deadline_date && c.next_deadline_date >= today).length;

  return (
    <div className="home-stats">
      <div className="home-stat">
        <span className="home-stat-value">{cases.length}</span>
        <span className="home-stat-label">clienti</span>
      </div>
      <div className="home-stat-divider" />
      <div className="home-stat">
        <span className="home-stat-value" style={{ color: critical > 0 ? 'var(--critical)' : 'var(--success)' }}>{critical}</span>
        <span className="home-stat-label">attenzione</span>
      </div>
      <div className="home-stat-divider" />
      <div className="home-stat">
        <span className="home-stat-value" style={{ color: upcoming > 0 ? 'var(--warning)' : 'var(--ink-4)' }}>{upcoming}</span>
        <span className="home-stat-label">appuntamenti</span>
      </div>
      <div className="home-stat-divider" />
      <div className="home-stat">
        <span className="home-stat-value" style={{ color: totalContradictions > 0 ? 'var(--warning)' : 'var(--ink-4)' }}>{totalContradictions}</span>
        <span className="home-stat-label">plateau rilevati</span>
      </div>
    </div>
  );
}

async function fetchWithWakeup(
  url: string,
  opts: { firstTimeoutMs: number; retryTimeoutMs: number; onSlow: () => void }
): Promise<Response> {
  const attempt = (timeoutMs: number) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
  };
  try {
    const r = await attempt(opts.firstTimeoutMs);
    if (r.ok) return r;
    throw new Error(`${r.status}`);
  } catch {
    opts.onSlow();
    return attempt(opts.retryTimeoutMs);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      setSession({
        access_token: 'dev-bypass-token',
        refresh_token: 'dev-bypass-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'dev-user',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'dev@pocketlegal.local',
          app_metadata: {},
          user_metadata: {},
          created_at: new Date(0).toISOString(),
        },
      } as Session);
      // Even in bypass mode, honour an explicit logout: signOut() fires
      // SIGNED_OUT, which clears the faked session (otherwise the logout
      // button appears to do nothing on localhost).
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') setSession(null);
      });
      return () => subscription.unsubscribe();
    }

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  return session;
}

function OnboardingScreen({ session, onComplete }: { session: Session; onComplete: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [nome, setNome] = useState('');
  const [studio, setStudio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { setError('Il nome è obbligatorio.'); return; }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('profiles').upsert({
      id: session.user.id,
      full_name: nome.trim(),
      studio: studio.trim() || null,
    });
    setSaving(false);
    if (err) { setError('Errore durante il salvataggio. Riprova.'); return; }
    onComplete();
  };

  if (step === 1) return (
    <div className="onboarding-screen">
      <div className="onboarding-card">
        <div className="auth-brand auth-brand--hero" style={{ marginBottom: 20 }}>
          <div className="auth-brand-icon"><Dumbbell size={20} /></div>
          <div>
            <div className="auth-brand-name">Digital Trainer</div>
            <div className="auth-brand-sub">Coach AI per personal trainer</div>
          </div>
        </div>
        <div className="onboarding-step-badge">Passo 1 di 2</div>
        <h2 className="onboarding-title">Benvenuto nel tuo studio digitale.</h2>
        <p className="onboarding-lede">
          Digital Trainer legge le schede dei tuoi clienti, organizza sessioni e progressi,
          e ti aiuta a preparare piani di allenamento in secondi.
        </p>
        <button className="onboarding-cta" onClick={() => setStep(2)}>
          Inizia la configurazione <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="onboarding-screen">
      <div className="onboarding-card">
        <div className="onboarding-step-badge">Passo 2 di 2</div>
        <h2 className="onboarding-title">Il tuo profilo trainer</h2>
        <p className="onboarding-lede">
          Queste informazioni appariranno nelle schede e nei piani che generi.
        </p>
        <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: 8 }}>
          <div className="profile-field">
            <label className="profile-label">Nome completo *</label>
            <input
              className="auth-input"
              type="text"
              placeholder="Mario Rossi PT"
              value={nome}
              onChange={e => setNome(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="profile-field">
            <label className="profile-label">Studio / Palestra <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opzionale)</span></label>
            <input
              className="auth-input"
              type="text"
              placeholder="FitLab Milano"
              value={studio}
              onChange={e => setStudio(e.target.value)}
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-submit" type="submit" disabled={saving || !nome.trim()}>
            {saving ? 'Salvataggio…' : 'Entra in Digital Trainer'}
          </button>
          <button type="button" className="onboarding-skip" onClick={onComplete}>
            Salta per ora
          </button>
        </form>
      </div>
    </div>
  );
}

const AUTH_TOUR_KEY = 'schedapro:auth-tour:dismissed';

/** First-run welcome panel on the login page. Reuses the wizard's `.tour-*`
 *  look. Guides the user: read the warning → tick the box → sign in / sign up.
 *  ✕ / "Ho capito" close for this visit; "Non mostrare più" persists. */
function AuthTour() {
  const [show, setShow] = useState(() => {
    try { return localStorage.getItem(AUTH_TOUR_KEY) !== '1'; } catch { return false; }
  });
  if (!show) return null;
  const close = () => setShow(false);
  const never = () => {
    try { localStorage.setItem(AUTH_TOUR_KEY, '1'); } catch {}
    setShow(false);
  };
  return (
    <div className="auth-tour-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-tour-title">
      <div className="tour-tooltip auth-tour-panel">
        <button type="button" className="tour-close" aria-label="Chiudi" onClick={close}>✕</button>
        <h3 className="tour-title" id="auth-tour-title">Benvenuto in Digital Trainer 👋</h3>
        <p className="tour-body">Prima di entrare, tre passaggi rapidi:</p>
        <ol className="auth-tour-steps">
          <li>Leggi l'<strong>avvertimento</strong> qui a fianco (responsabilità professionale e privacy).</li>
          <li>Spunta «<strong>Ho letto e compreso</strong>».</li>
          <li><strong>Accedi</strong> o <strong>registrati</strong> con la tua email.</li>
        </ol>
        <button type="button" className="auth-tour-ok" onClick={close}>Ho capito, iniziamo</button>
        <label className="tour-dontshow">
          <input type="checkbox" onChange={e => { if (e.target.checked) never(); }} />
          Non mostrare più
        </label>
      </div>
    </div>
  );
}

function AuthScreen() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (tab === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        recordAcceptance(); // ha appena spuntato l'avviso: avvia la finestra di 72h
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        recordAcceptance();
        setInfo('Account creato. Puoi accedere subito.');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <AuthTour />
      <div className="auth-shell">
        <div className="auth-col">
        <div className="auth-disclaimer auth-disclaimer--card" role="note">
          <p><strong>⚠️ Importante.</strong> L'intelligenza artificiale può commettere errori: <strong>controlla sempre</strong> ogni contenuto generato prima di usarlo. Sei tu il professionista responsabile del tuo lavoro — affidati alla tua esperienza e competenza, alla tua formazione professionale, e <strong>per qualsiasi aspetto di salute rivolgiti a un medico qualificato</strong>. Digital Trainer è uno strumento di supporto organizzativo e di bozza per personal trainer: non fornisce consulenza, diagnosi o prescrizioni mediche e non sostituisce il giudizio di un professionista qualificato.</p>
          <p><strong>🔒 Privacy.</strong> Digital Trainer applica letteralmente i più alti standard di protezione della privacy: a parte i dati di accesso (email e password, che non saranno mai usati a fini commerciali), <strong>nessun dato viene salvato da nessuna parte se non su QUESTO dispositivo</strong>. In ogni caso, sentiti libero di usare pseudonimi o soprannomi al posto dei nomi reali dei tuoi clienti, e sfrutta la funzione “Anonimizza” integrata nell'app.</p>
          <p><strong>💬 Feedback.</strong> Per domande, commenti o consigli scrivi a <strong>digitaltrainer.dev@gmail.com</strong> — allega pure screenshot se ti aiutano a spiegare. Ogni segnalazione è benvenuta.</p>
          <label className="auth-accept">
            <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />
            <span>Ho letto e compreso questo avvertimento.</span>
          </label>
        </div>
        <div className="auth-card">
          <div className="auth-card-kicker">Accesso riservato</div>
          <div className="auth-tabs">
            {(['login', 'signup'] as const).map(t => (
              <button title="Cambia modalità di accesso" key={t} className={`auth-tab${tab === t ? ' auth-tab--active' : ''}`} onClick={() => setTab(t)}>
                {t === 'login' ? 'Accedi' : 'Registrati'}
              </button>
            ))}
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <input className="auth-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="auth-input" type="password" placeholder="Password (min. 6 caratteri)" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <div className="auth-error">{error}</div>}
            {info && <div className="auth-info">{info}</div>}
            <button className="auth-submit" title="Conferma dati di accesso" type="submit" disabled={loading || !accepted}>
              {loading ? 'Caricamento…' : tab === 'login' ? 'Accedi' : 'Crea account'}
            </button>
            {!accepted && <p className="auth-accept-hint">Spunta la casella qui sopra per continuare.</p>}
          </form>
        </div>
        </div>

        <section className="auth-intro" aria-labelledby="auth-title">
          <div className="auth-brand auth-brand--hero">
            <div className="auth-brand-icon"><Dumbbell size={20} /></div>
            <div>
              <div className="auth-brand-name">Digital Trainer</div>
              <div className="auth-brand-sub">Coach AI per personal trainer</div>
            </div>
          </div>
          <h1 id="auth-title">Gestisci i tuoi clienti con l'AI. Dal foglio di carta al coach digitale.</h1>
          <p className="auth-lede">
            Sessioni, progressi, appuntamenti e piani di allenamento -- tutto in una scheda cliente intelligente.
            Tu resti il professionista al comando: Aria prepara le bozze, tu verifichi e consegni.
          </p>
          <ul className="auth-feature-list" aria-label="Cosa fa Digital Trainer">
            <li><ShieldCheck size={18} /><div><strong>Privacy totale</strong><span>Le schede restano sul tuo dispositivo; invii all'AI solo ciò che scegli.</span></div></li>
            <li><FileText size={18} /><div><strong>Progressi con fonti</strong><span>Ogni analisi rimanda al log di sessione o alla misurazione originale.</span></div></li>
            <li><CalendarClock size={18} /><div><strong>Appuntamenti organizzati</strong><span>Sessioni, check-in, gare e visite -- tutto in un calendario chiaro.</span></div></li>
            <li><CheckSquare size={18} /><div><strong>Piani generati dall'AI</strong><span>Aria genera schede settimanali e mensili personalizzate. Tu verifichi e consegni.</span></div></li>
            <li><MessageSquare size={18} /><div><strong>Chiedi ad Aria</strong><span>Una chat che conosce la scheda: dubbi sul cliente, idee per la prossima sessione, riassunti veloci.</span></div></li>
            <li><Mic size={18} /><div><strong>Detta a voce</strong><span>Registra gli appunti parlando a fine allenamento: Aria li trascrive e li archivia nella scheda.</span></div></li>
            <li><ShieldOff size={18} /><div><strong>Anonimizza</strong><span>Sostituisci nomi reali con pseudonimi con un tocco, prima di inviare qualsiasi cosa all'AI.</span></div></li>
            <li><Share2 size={18} /><div><strong>Esporta e porta con te</strong><span>Backup cifrato della scheda in un file <code>.spr</code>: i tuoi dati restano tuoi.</span></div></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

// ── Case list ─────────────────────────────────────────────────────────────────

function CaseListView({ onSelect, session, onOpenChat }: { onSelect: (id: string) => void; session: Session; onOpenChat: (msg?: string) => void }) {
  useAnalysisTick(); // re-render this list as background analyses start/finish
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [localIds, setLocalIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [warming, setWarming] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [search, setSearch] = useState('');
  const [profileTagline, setProfileTagline] = useState<string | null>(null);
  const localOwnerId = useMemo(() => localOwnerIdFromSession(session), [session]);

  useEffect(() => {
    supabase.from('profiles').select('full_name,studio').eq('id', session.user.id).single()
      .then(({ data }) => {
        if (data) setProfileTagline(data.studio || data.full_name || null);
      });
  }, [session.user.id]);

  const filtered = useMemo(() => {
    if (!cases) return [];
    if (!search.trim()) return cases;
    const q = search.toLowerCase();
    return cases.filter(c =>
      c.case_title.toLowerCase().includes(q) ||
      c.obiettivi_summary.toLowerCase().includes(q) ||
      c.client_name.toLowerCase().includes(q) ||
      c.case_summary.toLowerCase().includes(q)
    );
  }, [cases, search]);

  useEffect(() => {
    (async () => {
      // Local cases from IndexedDB -- always available, even offline
      await dbClaimLegacyCases(localOwnerId);
      const local = (await dbList(localOwnerId)) as CaseAnalysis[];
      const localSummaries = local.map(caseAnalysisToSummary);
      const localIdSet = new Set(local.map(c => c.case_id));
      setLocalIds(localIdSet);
      setCases(localSummaries);

      // Backend demo cases -- patient retry to absorb Render free-tier cold start
      try {
        const r = await fetchWithWakeup(`${API}/api/cases`, {
          firstTimeoutMs: 5000,
          retryTimeoutMs: 45000,
          onSlow: () => setWarming(true),
        });
        if (!r.ok) throw new Error(`${r.status}`);
        const demo = await r.json() as CaseSummary[];
        setCases([...localSummaries, ...demo.filter(c => !localIdSet.has(c.case_id))]);
        setWarming(false);
      } catch {
        setWarming(false);
        if (localSummaries.length === 0) setError('Backend non raggiungibile e nessuna scheda locale');
      }
    })();
  }, [localOwnerId]);

  const handleCreate = useCallback(async (title: string) => {
    const newCase: CaseAnalysis = {
      case_id: crypto.randomUUID(), case_title: title, is_pending: true, raw_documents: [],
      language: 'it', case_summary: '', materials: [], timeline: [], people: [],
      evidence: [], open_questions: [], missing_documents: [], contradictions: [],
      procedural_deadlines: [], brief_markdown: '', usage_estimate: { pages: 0, audio_minutes: 0, flash_input_tokens: 0, flash_output_tokens: 0, pro_used: false, model_route: '' }, analisi_progressi: null,
    };
    try {
      await dbSave(localOwnerId, newCase);
    } catch (e) {
      setError(`Errore creazione scheda: ${(e as Error).message}`);
      return;
    }
    setShowUpload(false);
    setCases(prev => {
      const summary = caseAnalysisToSummary(newCase);
      return prev ? [summary, ...prev] : [summary];
    });
    setLocalIds(prev => new Set([...prev, newCase.case_id]));
    onSelect(newCase.case_id);
  }, [localOwnerId, onSelect]);

  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Eliminare la scheda? I dati sono conservati solo sul tuo dispositivo.')) return;
    await dbDelete(localOwnerId, id);
    setCases(prev => prev?.filter(c => c.case_id !== id) ?? null);
    setLocalIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, [localOwnerId]);

  return (
    <main className="app-shell home-shell">

      {/* ── Hero ── */}
      <header className="home-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="home-brand">
            <div className="home-brand-icon"><Dumbbell size={22} /></div>
            <div>
              <div className="home-brand-name">Digital Trainer</div>
              <div className="home-brand-tagline">{profileTagline ?? 'Il tuo studio'}</div>
            </div>
          </div>
          <AccountControls session={session} />
        </div>
        <h1 className="home-headline">
          I miei <span className="home-headline-accent">clienti</span>
        </h1>
        {cases && <HomepageStats cases={cases} />}
      </header>

      {/* ── Aria inline prompt ── */}
      <AriaPromptBar onOpenChat={onOpenChat} />

      {/* ── Actions bar ── */}
      <div className="home-actions-bar">
        {cases && cases.length > 1 && (
          <div className="cases-search-wrap home-search">
            <Search size={15} className="cases-search-icon" />
            <input
              className="cases-search"
              placeholder="Cerca cliente, obiettivo…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="cases-search-clear" title="Azzera ricerca" onClick={() => setSearch('')}><X size={14} /></button>}
          </div>
        )}
        <button className="primary-button home-new-btn" data-tour="new-case" title="Crea una nuova scheda cliente" onClick={() => { setShowUpload(true); wizardBus.emit('new-case-drawer-opened'); }}>
          <Plus size={15} /> Nuovo cliente
        </button>
        <button title="Esegui azione" className="secondary-button" onClick={() => document.getElementById('import-file-input')?.click()}>
          <Upload size={14} /> Importa
        </button>
        <input
          id="import-file-input"
          type="file"
          style={{ display: 'none' }}
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              const parsed = await parseSprFile<CaseAnalysis>(text);
              let data: CaseAnalysis;
              if (parsed.kind === 'encrypted') {
                const password = prompt("Scheda protetta\n\nQuesto file .spr è cifrato. Inserisci la password usata al momento dell'esportazione.");
                if (!password) throw new Error('Importazione annullata');
                data = await decryptSprContainer<CaseAnalysis>(parsed.container, password);
              } else {
                if (!confirm('Questo .spr non è protetto da password. Importalo solo se proviene da una fonte affidabile.\n\nContinuare?')) {
                  throw new Error('Importazione annullata');
                }
                data = parsed.caseData;
              }
              if (!data.case_id || !data.case_title) throw new Error('File non valido');
              const existing = await dbGet(localOwnerId, data.case_id);
              if (existing) {
                const action = confirm(
                  `La scheda "${data.case_title}" è già presente. \n\nOK = Sostituisci\nAnnulla = Salva come copia`
                );
                if (!action) {
                  data.case_id = crypto.randomUUID();
                  data.case_title += ' (importato)';
                }
              }
              await dbSave(localOwnerId, data as CaseAnalysis);
              window.location.reload();
            } catch (err) {
              alert(`Importazione fallita: ${(err as Error).message}`);
            }
            e.target.value = '';
          }}
        />
      </div>

      {analyzing && (
        <div className="analyzing-banner">
          <Loader2 className="spin" size={18} />
          Analisi AI in corso -- attendere…
        </div>
      )}

      {error && <div className="error-banner"><AlertTriangle size={16} /> {error}</div>}

      {warming && (
        <div className="warming-banner">
          <Loader2 className="spin" size={16} />
          Sto svegliando il server -- può richiedere qualche secondo…
        </div>
      )}

      {cases === null && !error && (
        <div className="cases-loading"><Loader2 className="spin" size={32} /></div>
      )}

      {/* ── Cases grid ── */}
      <div className="cases-grid">
        {filtered.length === 0 && cases && cases.length > 0 && (
          <p className="muted" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px 0' }}>
            Nessun cliente corrisponde a &ldquo;{search}&rdquo;
          </p>
        )}
        {cases && cases.length === 0 && (
          <div className="empty-state empty-state-placeholder lg" style={{ gridColumn: '1/-1' }}>
            <FolderOpen size={48} style={{ color: 'var(--ink-5)', marginBottom: 16 }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--ink-1)', marginBottom: 8 }}>Nessun cliente presente</h3>
            <p className="muted" style={{ maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.5 }}>
              Crea la prima scheda cliente per iniziare a gestire sessioni, progressi e piani di allenamento con l'AI.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="primary-button" data-tour="new-case" onClick={() => { setShowUpload(true); wizardBus.emit('new-case-drawer-opened'); }} title="Crea una nuova scheda cliente">
                <Plus size={15} /> Nuovo cliente
              </button>
            </div>
          </div>
        )}
        {filtered.map(c => (
          <button key={c.case_id} title="Apri la scheda cliente" className={`case-card${localIds.has(c.case_id) ? ' case-card-local' : ''}`} onClick={() => onSelect(c.case_id)}>
            <div className="case-card-header">
              <div className="case-card-risk" style={{ background: riskColor(c.risk_level) + '22', border: `1px solid ${riskColor(c.risk_level)}55` }}>
                <span style={{ color: riskColor(c.risk_level) }}>{riskIcon(c.risk_level)} {riskLabel(c.risk_level)}</span>
              </div>
              <div className="case-card-actions">
                {localIds.has(c.case_id) && (
                  <span className="case-local-badge">locale</span>
                )}
                {localIds.has(c.case_id) && (
                  <button className="case-delete-btn" onClick={e => handleDelete(c.case_id, e)} title="Elimina scheda" type="button">
                    <Trash2 size={14} />
                  </button>
                )}
                <ChevronRight size={18} className="case-card-arrow" />
              </div>
            </div>
            <h3 className="case-card-title">{c.case_title}</h3>
            {getAnalysisState(c.case_id)?.status === 'running' && (
              <span className="case-analyzing-pill"><Loader2 size={12} className="spin" /> Analisi in corso…</span>
            )}
            <p className="case-card-charges">{c.obiettivi_summary}</p>
            <p className="case-card-summary">{c.case_summary}</p>
            <div className="case-card-footer">
              <div className="case-card-meta">
                {c.next_deadline_date && (
                  <span><CalendarClock size={13} /> {formatShortDate(c.next_deadline_date)}</span>
                )}
                <span><AlertTriangle size={13} /> {c.contradiction_count} contraddizioni</span>
                <span><FileText size={13} /> {c.material_count} materiali</span>
              </div>
              <span className="case-card-open">Apri <ChevronRight size={14} /></span>
            </div>
          </button>
        ))}
      </div>

      {showUpload && <NewCaseDrawer onClose={() => setShowUpload(false)} onCreate={handleCreate} />}
    </main>
  );
}


// ── Root app ─────────────────────────────────────────────────────────────────

type View = 'cases' | 'case';

function App() {
  const session = useAuth();
  // Warm up the Render backend the moment the app loads (free-tier instances
  // cold-start in ~30-50s). Fire-and-forget so nothing blocks; by the time the
  // user reads the disclaimer, logs in, and opens a client, the backend is awake.
  useEffect(() => { fetch(`${API}/api/health`).catch(() => {}); }, []);
  // Logout forzato ogni 72h: l'utente deve ri-accettare l'avviso. Quando c'è una
  // sessione, se l'ultima accettazione è scaduta sloggiamo (→ torna al login con
  // la checkbox); altrimenti innestiamo il timestamp per le sessioni preesistenti.
  // Ricontrolliamo quando l'app torna in primo piano.
  useEffect(() => {
    if (!session) return;
    const check = () => {
      if (isSessionExpired()) { clearAcceptance(); supabase.auth.signOut(); }
      else ensureAcceptanceTs();
    };
    check();
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [session]);
  const [profileReady, setProfileReady] = useState<boolean | null>(null);
  const [view, setView] = useState<View>('cases');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeCaseData, setActiveCaseData] = useState<CaseAnalysis | null>(null);
  const [chat, setChat] = useState<ChatState>(() => {
    try {
      const saved = localStorage.getItem('plt_chat_messages');
      return { open: false, messages: saved ? JSON.parse(saved) : [], caseContext: null, activeCaseId: null };
    } catch { return { open: false, messages: [], caseContext: null, activeCaseId: null }; }
  });
  const [chatStreaming, setChatStreaming] = useState(false);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [fabHidden, setFabHidden] = useState(() => {
    try { return sessionStorage.getItem('plt_fab_hidden') === '1'; } catch { return false; }
  });

  const hideFab = useCallback(() => {
    setFabHidden(true);
    try { sessionStorage.setItem('plt_fab_hidden', '1'); } catch {}
  }, []);

  const restoreFab = useCallback(() => {
    setFabHidden(false);
    try { sessionStorage.removeItem('plt_fab_hidden'); } catch {}
  }, []);

  // Resume any analysis job that was running before a refresh / app restart.
  useEffect(() => { resumePersistedAnalyses(); }, []);

  // Refresh the client list whenever a background analysis finishes, so updated
  // cards show even if the user is sitting on the list while it completes.
  const analysisTick = useAnalysisTick();
  const prevRunningRef = useRef(runningAnalysisCount());
  useEffect(() => {
    const n = runningAnalysisCount();
    if (n < prevRunningRef.current) setListRefreshKey(k => k + 1);
    prevRunningRef.current = n;
  }, [analysisTick]);

  useEffect(() => {
    if (!session) { setProfileReady(null); return; }
    if (DEV_BYPASS_AUTH) { setProfileReady(true); return; }
    supabase.from('profiles').select('full_name').eq('id', session.user.id).single()
      .then(({ data }) => setProfileReady(!!(data?.full_name)));
  }, [session]);

  useEffect(() => {
    try { localStorage.setItem('plt_chat_messages', JSON.stringify(chat.messages)); } catch {}
  }, [chat.messages]);

  const handleSelectCase = useCallback((id: string) => {
    setSelectedCaseId(id);
    setView('case');
    setActiveCaseData(null);
    setChat(prev => ({ ...prev, caseContext: null }));
  }, []);

  const handleBack = useCallback(() => {
    setView('cases');
    setSelectedCaseId(null);
    setActiveCaseData(null);
    setChat(prev => ({ ...prev, caseContext: null }));
  }, []);

  const handleCaseLoaded = useCallback((data: CaseAnalysis) => {
    setActiveCaseData(data);
    const newCtx = buildCaseContext(data);
    setChat(prev => {
      if (prev.activeCaseId === data.case_id) {
        // stesso caso -- aggiorna solo il contesto, tieni i messaggi
        return { ...prev, caseContext: newCtx };
      }
      // scheda diversa -- resetta la chat
      return { open: prev.open, messages: [], caseContext: newCtx, activeCaseId: data.case_id };
    });
  }, []);

  const openChat = useCallback((initialKeyOrText?: string) => {
    if (initialKeyOrText) {
      const ctx = activeCaseData ? buildCaseContext(activeCaseData) : null;
      const pianoEntry = PIANO_PROMPTS[initialKeyOrText as keyof typeof PIANO_PROMPTS];
      const content = ctx
        ? (pianoEntry ? `${ctx}\n\n---\n\n${pianoEntry.prompt}` : `${ctx}\n\n---\n${initialKeyOrText}`)
        : initialKeyOrText;
      const userMsg: ChatMsg = { role: 'user', content, id: crypto.randomUUID() };
      setChat(prev => ({ ...prev, open: true, messages: [...prev.messages, userMsg] }));
      sendToApi([...chat.messages, userMsg]);
      return;
    }
    setChat(prev => ({ ...prev, open: true }));
  }, [activeCaseData, chat.messages]);

  const sendMessage = useCallback((text: string) => {
    const userMsg: ChatMsg = { role: 'user', content: text, id: crypto.randomUUID() };
    setChat(prev => ({ ...prev, messages: [...prev.messages, userMsg] }));
    sendToApi([...chat.messages, userMsg]);
  }, [chat.messages]);

  const sendToApi = useCallback(async (messages: ChatMsg[]) => {
    setChatStreaming(true);
    const assistantId = crypto.randomUUID();
    setChat(prev => ({
      ...prev,
      messages: [...prev.messages.filter(m => m.id !== assistantId),
        { role: 'assistant', content: '', id: assistantId }],
    }));

    try {
      const caseCtx = activeCaseData ? buildCaseContext(activeCaseData) : null;
      const systemWithCtx = caseCtx
        ? `${SYSTEM_PROMPT_IT}\n\n---\n${caseCtx}`
        : SYSTEM_PROMPT_IT;

      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          system_override: systemWithCtx,
          mode: 'flash',
        }),
      });

      if (!res.ok || !res.body) throw new Error(`${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const { text } = JSON.parse(payload) as { text: string };
            setChat(prev => ({
              ...prev,
              messages: prev.messages.map(m =>
                m.id === assistantId ? { ...m, content: m.content + text } : m
              ),
            }));
          } catch { /* skip malformed chunk */ }
        }
      }
    } catch (e) {
      setChat(prev => ({
        ...prev,
        messages: prev.messages.map(m =>
          m.id === assistantId && m.role === 'assistant' && m.content === ''
            ? { ...m, content: `Errore: ${(e as Error).message}` }
            : m
        ),
      }));
    } finally {
      setChatStreaming(false);
    }
  }, [activeCaseData]);

  if (session === undefined || (session && profileReady === null)) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
      <Loader2 size={28} className="spin" style={{ color: 'var(--giulia-ink)' }} />
    </div>
  );

  if (!session) return <AuthScreen />;

  if (session && profileReady === false) return (
    <OnboardingScreen session={session} onComplete={() => setProfileReady(true)} />
  );

  return (
    <LockGate session={session}>
      {view === 'case' && selectedCaseId
        ? (
          <Suspense fallback={<div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}><Loader2 size={28} className="spin" style={{ color: 'var(--giulia-ink)' }} /></div>}>
            <CaseDetailView caseId={selectedCaseId} session={session} onBack={handleBack} onOpenChat={openChat} onCaseLoaded={handleCaseLoaded} onCaseAnalyzed={() => setListRefreshKey(k => k + 1)} />
          </Suspense>
        )
        : <CaseListView key={listRefreshKey} onSelect={handleSelectCase} session={session} onOpenChat={openChat} />
      }
      {fabHidden
        ? <FabRestoreButton onRestore={restoreFab} />
        : <FloatingChatButton onClick={() => setChat(prev => ({ ...prev, open: !prev.open }))} hasContext={!!activeCaseData} onHide={hideFab} />
      }
      <ChatDrawer
        state={chat}
        onClose={() => setChat(prev => ({ ...prev, open: false }))}
        onSend={sendMessage}
        onQuickAction={openChat}
        onClear={() => setChat(prev => ({ ...prev, messages: [] }))}
        streaming={chatStreaming}
      />
      <OnboardingWizard view={view} />
    </LockGate>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
