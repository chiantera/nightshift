import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle, ArrowLeft, ArrowRight, BookOpen,
  CalendarClock, CheckCircle2, CheckSquare, ChevronDown, ChevronRight,
  Clock, Copy, Dumbbell, Eye, EyeOff, FileText, FolderPlus, Loader2, MessageSquare, Mic, Plus, RefreshCw,
  Globe, Scale, Search, Send, Share2, ShieldAlert, Sparkles,
  Square, Trash2, Upload, Users, X, Zap, FolderOpen,
} from 'lucide-react';

const MultiFileUploadDrawer = React.lazy(() => import('./components/MultiFileUploadDrawer'));
const CaseDetailView = React.lazy(() => import('./screens/CaseDetailView'));
const SettingsScreen = React.lazy(() => import('./settings/SettingsScreen'));
import { ChatDrawer, FloatingChatButton, FabRestoreButton } from './components/ChatPanel';
import AriaPromptBar from './components/AriaPromptBar';
import AccountControls from './components/AccountControls';
import { resumePersistedAnalyses, runningAnalysisCount, getAnalysisState, useAnalysisTick } from './analysis/analysisManager';
import { setStorageUser } from './storage/userStorage';
import LockGate from './lock/LockGate';
import './lock/lock.css';
import './value/value.css';
import { recordAcceptance, ensureAcceptanceTs, isSessionExpired, clearAcceptance } from './auth/sessionExpiry';
import OnboardingWizard from './onboarding/OnboardingWizard';
import FirstRunWizard from './value/FirstRunWizard';
import { clearLoginOptOuts } from './value/seen';
import { wizardBus } from './onboarding/wizardBus';
import './tokens.css';
import './styles.css';
import { applyTheme } from './theme/theme';
import { API } from './config';
import { riskColor, riskIcon, riskLabel } from './domain/helpers';
import { heroMetric } from './value/personalization';
import { formatDate, formatDateFull, formatShortDate } from './dateUtils';
import { useT, renderRich, currentLocale } from './i18n/index.ts';
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
const AUTH_SESSION_REFRESH_EVENT = 'schedapro:auth-session-refresh';
const DEV_BYPASS_SIGNED_OUT_KEY = 'schedapro:dev-bypass-signed-out';

if (import.meta.env.VITE_MOCK_DATA === 'true') installMockApi();

// ── Domain helpers ───────────────────────────────────────────────────────────

type NewCaseInput = {
  title: string;
  goal: string;
  availability: string;
  watch: string;
};

function NewCaseDrawer({ onClose, onCreate }: { onClose: () => void; onCreate: (input: NewCaseInput) => void }) {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [availability, setAvailability] = useState('');
  const [watch, setWatch] = useState('');
  const submit = () => {
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      goal: goal.trim(),
      availability: availability.trim(),
      watch: watch.trim(),
    });
  };
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
            onKeyDown={e => { if (e.key === 'Enter' && title.trim()) submit(); }}
          />
        </div>
        <div className="new-case-grid">
          <div className="upload-field">
            <label>Obiettivo principale</label>
            <input
              className="upload-input"
              placeholder="es. ipertrofia, dimagrimento, forza…"
              value={goal}
              onChange={e => setGoal(e.target.value)}
            />
          </div>
          <div className="upload-field">
            <label>Disponibilita</label>
            <input
              className="upload-input"
              placeholder="es. 3 allenamenti/settimana, 45 min"
              value={availability}
              onChange={e => setAvailability(e.target.value)}
            />
          </div>
        </div>
        <div className="upload-field">
          <label>Cosa vuoi che Aria tenga d'occhio?</label>
          <textarea
            className="upload-textarea"
            placeholder="es. fastidio al ginocchio, poca aderenza, plateau su squat…"
            value={watch}
            onChange={e => setWatch(e.target.value)}
            rows={3}
          />
        </div>
        <div className="upload-aria-preview upload-aria-preview--compact">
          <p className="eyebrow">Personalizzazione Aria</p>
          <p>
            Bastano questi dettagli per far capire ad Aria cosa conta per questo cliente prima ancora di caricare log o misurazioni.
          </p>
        </div>
        <div className="upload-actions">
          <button className="ghost-button" onClick={onClose} title="Annulla operazione">Annulla</button>
          <button title="Conferma operazione principale" className="primary-button" disabled={!title.trim()} onClick={submit}>
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
  const today = new Date().toISOString().slice(0, 10);
  const segnali = cases.filter(c => c.risk_level === 'critical' || c.risk_level === 'high').length;
  const sessWeek = cases.reduce((s, c) => s + c.material_count, 0);
  const oggi = cases.filter(c => c.next_deadline_date === today).length;

  return (
    <div className="home-stats">
      <div className="home-stat">
        <span className="home-stat-value">{cases.length}</span>
        <span className="home-stat-label">clienti</span>
      </div>
      <div className="home-stat-divider" />
      <div className="home-stat">
        <span className="home-stat-value home-stat-value--hot">{sessWeek}</span>
        <span className="home-stat-label">sessioni tot.</span>
      </div>
      <div className="home-stat-divider" />
      <div className="home-stat">
        <span className="home-stat-value">{segnali}</span>
        <span className="home-stat-label">segnali</span>
      </div>
      <div className="home-stat-divider" />
      <div className="home-stat">
        <span className="home-stat-value">{oggi}</span>
        <span className="home-stat-label">oggi</span>
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

function makeDevBypassSession(): Session {
  return {
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
  } as Session;
}

function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    const refreshSession = () => {
      void supabase.auth.getSession()
        .then(({ data }) => {
          if (data.session) {
            setStorageUser(data.session.user.id);
            if (DEV_BYPASS_AUTH) sessionStorage.removeItem(DEV_BYPASS_SIGNED_OUT_KEY);
            setSession(data.session);
            return;
          }
          if (DEV_BYPASS_AUTH && sessionStorage.getItem(DEV_BYPASS_SIGNED_OUT_KEY) !== '1') {
            const bypass = makeDevBypassSession();
            setStorageUser(bypass.user.id);
            setSession(bypass);
            return;
          }
          setStorageUser('anon');
          setSession(null);
        })
        .catch(() => {
          if (DEV_BYPASS_AUTH && sessionStorage.getItem(DEV_BYPASS_SIGNED_OUT_KEY) !== '1') {
            const bypass = makeDevBypassSession();
            setStorageUser(bypass.user.id);
            setSession(bypass);
            return;
          }
          setStorageUser('anon');
          setSession(null);
        });
    };

    refreshSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT') {
        setStorageUser('anon');
        localStorage.removeItem('spr:chat-messages');
        if (DEV_BYPASS_AUTH) sessionStorage.setItem(DEV_BYPASS_SIGNED_OUT_KEY, '1');
        setSession(null);
        return;
      }
      if (s) {
        setStorageUser(s.user.id);
        if (DEV_BYPASS_AUTH) sessionStorage.removeItem(DEV_BYPASS_SIGNED_OUT_KEY);
        setSession(s);
        return;
      }
      refreshSession();
    });
    window.addEventListener(AUTH_SESSION_REFRESH_EVENT, refreshSession);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener(AUTH_SESSION_REFRESH_EVENT, refreshSession);
    };
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

/** Non-blocking login helper: reminds the user what to do without covering the form. */
function AuthHelp() {
  const [show, setShow] = useState(() => {
    try { return localStorage.getItem(AUTH_TOUR_KEY) !== '1'; } catch { return false; }
  });
  const t = useT();
  if (!show) return null;
  const close = () => setShow(false);
  const never = () => {
    try { localStorage.setItem(AUTH_TOUR_KEY, '1'); } catch {}
    setShow(false);
  };
  return (
    <div className="auth-help" role="note" aria-labelledby="auth-help-title">
      <button type="button" className="auth-help-close" aria-label={t('common.close')} onClick={close}>✕</button>
      <h3 id="auth-help-title">{t('auth.help.title')}</h3>
      <ol>
        <li>{t('auth.help.step1')}</li>
        <li>{t('auth.help.step2')}</li>
        <li>{t('auth.help.step3')}</li>
      </ol>
      <label>
        <input type="checkbox" onChange={e => { if (e.target.checked) never(); }} />
        {t('common.dontShowAgain')}
      </label>
    </div>
  );
}

function AuthScreen() {
  const t = useT();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const finalizeAuthSuccess = (userId?: string) => {
    if (userId) setStorageUser(userId);
    recordAcceptance();
    clearLoginOptOuts();
    if (DEV_BYPASS_AUTH) sessionStorage.removeItem(DEV_BYPASS_SIGNED_OUT_KEY);
    window.dispatchEvent(new Event(AUTH_SESSION_REFRESH_EVENT));
  };

  const handleForgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email) { setError(t('auth.forgot.noEmail')); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email);
      if (err) throw err;
      setInfo(t('auth.forgot.sent'));
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (tab === 'login') {
        const { data: loginData, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        finalizeAuthSuccess(loginData.session?.user.id); // ha appena spuntato l'avviso: avvia la finestra di 72h
      } else {
        const { data: signupData, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        let signedInUserId: string | undefined;
        if (!signupData.session) {
          const { data: loginData2, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
          if (loginErr) throw loginErr;
          signedInUserId = loginData2.session?.user.id;
        } else {
          signedInUserId = signupData.session.user.id;
        }
        finalizeAuthSuccess(signedInUserId);
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-shell">
        <div className="auth-col">
        <AuthHelp />
        <div className="auth-disclaimer auth-disclaimer--card" role="note">
          <p>{renderRich(t('auth.disclaimer.important'))}</p>
          <p>{renderRich(t('auth.disclaimer.privacy'))}</p>
          <p>{renderRich(t('auth.disclaimer.feedback'))}</p>
          <label className="auth-accept">
            <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />
            <span>{t('auth.accept.label')}</span>
          </label>
        </div>
        <div className="auth-card">
          <div className="auth-card-kicker">{t('auth.kicker')}</div>
          <div className="auth-tabs">
            {(['login', 'signup'] as const).map(tabKey => (
              <button title={t('auth.tab.title')} key={tabKey} className={`auth-tab${tab === tabKey ? ' auth-tab--active' : ''}`} onClick={() => setTab(tabKey)}>
                {tabKey === 'login' ? t('auth.tab.login') : t('auth.tab.signup')}
              </button>
            ))}
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <input className="auth-input" type="email" placeholder={t('auth.email')} value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="auth-input" type="password" placeholder={t('auth.password')} value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <div className="auth-error">{error}</div>}
            {info && <div className="auth-info">{info}</div>}
            <button className="auth-submit" title={t('auth.submit.title')} type="submit" disabled={loading || !accepted}>
              {loading ? t('common.loading') : tab === 'login' ? t('auth.submit.login') : t('auth.submit.signup')}
            </button>
            {tab === 'login' && (
              <button type="button" className="auth-forgot" onClick={handleForgotPassword} disabled={loading}>
                {t('auth.forgot.link')}
              </button>
            )}
            {!accepted && <p className="auth-accept-hint">{t('auth.accept.hint')}</p>}
          </form>
        </div>
        </div>

        <section className="auth-intro" aria-labelledby="auth-title">
          <div className="auth-brand auth-brand--hero">
            <div className="auth-brand-icon"><Dumbbell size={20} /></div>
            <div>
              <div className="auth-brand-name">{t('brand.name')}</div>
              <div className="auth-brand-sub">{t('brand.sub')}</div>
            </div>
          </div>
          <h1 id="auth-title">{t('auth.hero.title')}</h1>
          <p className="auth-lede">{t('auth.hero.lede')}</p>
          <ul className="auth-feature-list" aria-label={t('auth.features.label')}>
            <li><CheckSquare size={18} /><div><strong>{t('auth.feature.1.title')}</strong><span>{t('auth.feature.1.desc')}</span></div></li>
            <li><MessageSquare size={18} /><div><strong>{t('auth.feature.2.title')}</strong><span>{t('auth.feature.2.desc')}</span></div></li>
            <li><Mic size={18} /><div><strong>{t('auth.feature.3.title')}</strong><span>{t('auth.feature.3.desc')}</span></div></li>
            <li><Share2 size={18} /><div><strong>{t('auth.feature.4.title')}</strong><span>{t('auth.feature.4.desc')}</span></div></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

// ── Case list ─────────────────────────────────────────────────────────────────

function CaseListView({ onSelect, session, onOpenChat, onOpenSettings }: { onSelect: (id: string, opts?: { openUpload?: boolean }) => void; session: Session; onOpenChat: (msg?: string) => void; onOpenSettings: () => void }) {
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

  const handleCreate = useCallback(async (input: NewCaseInput) => {
    const summaryParts = [
      input.goal ? `Obiettivo: ${input.goal}` : '',
      input.availability ? `Disponibilita: ${input.availability}` : '',
      input.watch ? `Da monitorare: ${input.watch}` : '',
    ].filter(Boolean);
    const initialQuestion = input.watch
      ? [{ question: 'Cosa deve tenere d\'occhio Aria?', why_it_matters: input.watch, source_refs: [] }]
      : [];
    const newCase: CaseAnalysis = {
      case_id: crypto.randomUUID(), case_title: input.title, is_pending: true, raw_documents: [],
      language: 'it', case_summary: summaryParts.join('\n'), materials: [], timeline: [], people: [],
      evidence: [], open_questions: initialQuestion, missing_documents: [], contradictions: [],
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
    onSelect(newCase.case_id, { openUpload: true });
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
          <AccountControls session={session} onOpenSettings={onOpenSettings} />
        </div>
        <h1 className="home-headline">
          I MIEI<br /><span className="home-headline-accent">CLIENTI</span>
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
        {filtered.map(c => {
          const hm = heroMetric(c);
          const cardClass = [
            'case-card',
            localIds.has(c.case_id) ? 'case-card-local' : '',
            hm.stalled ? 'case-card--stalled' : '',
          ].filter(Boolean).join(' ');

          // Days since next deadline for "ultima N gg fa" wording
          const deadlineDays = (() => {
            if (!c.next_deadline_date) return null;
            const diff = Math.floor((Date.now() - Date.parse(c.next_deadline_date)) / 86_400_000);
            return diff > 0 ? diff : null;
          })();

          return (
            <button key={c.case_id} title="Apri la scheda cliente" className={cardClass} onClick={() => onSelect(c.case_id)}>
              <div className="case-card-header">
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
                {/* Hero metric on the right */}
                <div className="case-card-metric">
                  <b>
                    {hm.value}
                    {hm.unit && <em>{hm.unit}</em>}
                  </b>
                  <span>{hm.label}</span>
                </div>
              </div>
              {/* Name row with risk dot */}
              <div className="case-card-name-row">
                <span
                  className="case-card-risk-dot"
                  style={{ background: riskColor(c.risk_level) }}
                  title={riskLabel(c.risk_level)}
                />
                <h3 className="case-card-title">{c.case_title}</h3>
              </div>
              {getAnalysisState(c.case_id)?.status === 'running' && (
                <span className="case-analyzing-pill"><Loader2 size={12} className="spin" /> Analisi in corso…</span>
              )}
              {/* Goal subline */}
              <p className="case-card-charges">{c.obiettivi_summary}</p>
              <div className="case-card-footer">
                <div className="case-card-meta">
                  {deadlineDays !== null ? (
                    <span><CalendarClock size={13} /> ultima {deadlineDays} gg fa</span>
                  ) : c.next_deadline_date ? (
                    <span><CalendarClock size={13} /> {formatShortDate(c.next_deadline_date)}</span>
                  ) : null}
                  <span><FileText size={13} /> {c.material_count} materiali</span>
                </div>
                <span className="case-card-open">Apri <ChevronRight size={14} /></span>
              </div>
            </button>
          );
        })}
      </div>

      {showUpload && <NewCaseDrawer onClose={() => setShowUpload(false)} onCreate={handleCreate} />}
    </main>
  );
}


// ── Root app ─────────────────────────────────────────────────────────────────

type View = 'cases' | 'case' | 'settings';

function App() {
  const session = useAuth();
  const sessionResolved = session !== undefined;
  const didResumeRef = useRef(false);
  // Keep <html lang> in sync with the chosen locale (re-runs on locale change via useT).
  useT();
  useEffect(() => { document.documentElement.lang = currentLocale(); });
  useEffect(() => {
    if (sessionResolved && !didResumeRef.current) {
      didResumeRef.current = true;
      resumePersistedAnalyses();
    }
  }, [sessionResolved]);
  // Re-apply the theme once auth resolves: setStorageUser(userId) has run by now,
  // so getThemeChoice() reads the correct per-user `spr:{userId}:theme` key
  // (the no-FOUC script in index.html handled the pre-paint pass with the anon key).
  useEffect(() => { applyTheme(); }, [session]);
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
  const [autoUploadCaseId, setAutoUploadCaseId] = useState<string | null>(null);
  const [activeCaseData, setActiveCaseData] = useState<CaseAnalysis | null>(null);
  const [chat, setChat] = useState<ChatState>(() => {
    try {
      const saved = localStorage.getItem('spr:chat-messages');
      return { open: false, messages: saved ? JSON.parse(saved) : [], caseContext: null, activeCaseId: null };
    } catch { return { open: false, messages: [], caseContext: null, activeCaseId: null }; }
  });
  const [chatStreaming, setChatStreaming] = useState(false);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [fabHidden, setFabHidden] = useState(() => {
    try { return sessionStorage.getItem('spr:fab-hidden') === '1'; } catch { return false; }
  });

  const hideFab = useCallback(() => {
    setFabHidden(true);
    try { sessionStorage.setItem('spr:fab-hidden', '1'); } catch {}
  }, []);

  const restoreFab = useCallback(() => {
    setFabHidden(false);
    try { sessionStorage.removeItem('spr:fab-hidden'); } catch {}
  }, []);

  // Resume logic moved to after session resolves (see didResumeRef above).

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
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).maybeSingle();
        if (alive) setProfileReady(!!(data?.full_name));
      } catch {
        if (alive) setProfileReady(false);
      }
    })();
    return () => { alive = false; };
  }, [session]);

  useEffect(() => {
    try { localStorage.setItem('spr:chat-messages', JSON.stringify(chat.messages)); } catch {}
  }, [chat.messages]);

  useEffect(() => {
    if (!session) setChat(s => ({ ...s, open: false, messages: [], caseContext: null, activeCaseId: null }));
  }, [session]);

  const handleSelectCase = useCallback((id: string, opts?: { openUpload?: boolean }) => {
    setSelectedCaseId(id);
    setView('case');
    setActiveCaseData(null);
    setChat(prev => ({ ...prev, caseContext: null }));
    if (opts?.openUpload) setAutoUploadCaseId(id);
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
      <Loader2 size={28} className="spin" style={{ color: 'var(--aria)' }} />
    </div>
  );

  if (!session) return <AuthScreen />;

  if (session && profileReady === false) return (
    <OnboardingScreen session={session} onComplete={() => setProfileReady(true)} />
  );

  return (
    <LockGate session={session}>
      {view === 'settings' && (
        <Suspense fallback={<div className="loading-shell"><Loader2 className="spin" size={28} /></div>}>
          <SettingsScreen session={session} onBack={() => setView('cases')} />
        </Suspense>
      )}
      {view !== 'settings' && (view === 'case' && selectedCaseId
        ? (
          <Suspense fallback={<div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}><Loader2 size={28} className="spin" style={{ color: 'var(--aria)' }} /></div>}>
            <CaseDetailView caseId={selectedCaseId} session={session} onBack={handleBack} onOpenChat={openChat} onCaseLoaded={handleCaseLoaded} onCaseAnalyzed={() => setListRefreshKey(k => k + 1)} autoOpenUpload={autoUploadCaseId === selectedCaseId} onAutoUploadConsumed={() => setAutoUploadCaseId(null)} onOpenSettings={() => setView('settings')} />
          </Suspense>
        )
        : <CaseListView key={listRefreshKey} onSelect={handleSelectCase} session={session} onOpenChat={openChat} onOpenSettings={() => setView('settings')} />
      )}
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
      <FirstRunWizard />
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
