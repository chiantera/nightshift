import type { DraftArtifact } from '../draftArtifacts';

export type SourceRef = {
  source_name: string;
  page: number | null;
  chunk: string | null;
  quote: string;
  confidence: number;
};

export type Material = {
  id: string;
  name: string;
  kind: string;
  description: string;
  excerpt: string;
  content: string;
};

export type TimelineEvent = {
  date: string | null;
  time: string | null;
  title: string;
  description: string;
  tipo_sessione?: 'forza' | 'cardio' | 'mobilita' | 'hiit' | 'recupero' | 'altro';
  source_refs: SourceRef[];
  confidence: number;
};

export type Person = {
  name: string;
  role: string;
  notes: string;
  source_refs: SourceRef[];
};

export type EvidenceItem = {
  title: string;
  status: string;
  notes: string;
  source_refs: SourceRef[];
};

export type OpenQuestion = {
  question: string;
  why_it_matters: string;
  source_refs: SourceRef[];
};

export type MissingDocument = {
  title: string;
  reason: string;
  priority: 'alta' | 'media' | 'bassa';
};

export type Contradiction = {
  title: string;
  description: string;
  source_refs: SourceRef[];
};

export type Appuntamento = {
  title: string;
  deadline_type: 'sessione_pt' | 'check_in' | 'gara' | 'visita_medica' | 'altro';
  due_date: string;
  due_time: string | null;
  status: 'confirmed' | 'candidate' | 'needs_review';
  urgency: 'alta' | 'media' | 'bassa';
  description: string;
  source_refs: SourceRef[];
  tasks: string[];
};

export type UsageEstimate = {
  pages: number;
  audio_minutes: number;
  flash_input_tokens: number;
  flash_output_tokens: number;
  pro_used: boolean;
  model_route: string;
};

export type ProRecommendation = {
  recommended: boolean;
  reasons: string[];
  message: string;
  cta_label: string;
  alternate_label: string;
  requires_confirmation: boolean;
  auto_charge: boolean;
};

// ── Fitness analysis sub-types ────────────────────────────────────────────────

export type StepObiettivo = {
  element: string;
  description: string;
  status: 'raggiunto' | 'in_corso' | 'plateau' | 'non_avviato';
  notes: string;
  source_refs: SourceRef[];
};

export type Obiettivo = {
  obiettivo_code: string;
  obiettivo_nome: string;
  scadenza_target: string;
  step_obiettivo: StepObiettivo[];
  strategie: string[];
  progresso_score: number;
  notes: string;
  source_refs: SourceRef[];
};

export type ApproccioAllenamento = {
  title: string;
  obiettivo_ref: string | null;
  tipo: string;
  priority: 'primary' | 'secondary' | 'fallback';
  description: string;
  strengths: string[];
  risks: string[];
  dati_necessari: string[];
  source_refs: SourceRef[];
};

export type LimitazioneFisica = {
  title: string;
  issue_type: string;
  severity: 'critical' | 'significant' | 'minor';
  description: string;
  fonte: string;
  raccomandazione: string;
  source_refs: SourceRef[];
};

export type ValutazioneAderenza = {
  nome: string;
  role: 'cliente' | 'medico' | 'fisioterapista' | 'nutrizionista' | 'expert';
  affidabilita_score: number;
  dichiarazione_chiave: string;
  strengths: string[];
  vulnerabilities: string[];
  domande_approfondimento: string[];
  source_refs: SourceRef[];
};

export type BilancioProgressi = {
  progresso_score: number;
  autonomia_score: number;
  progressi_chiave: string[];
  fattori_favorevoli: string[];
  critical_gaps: string[];
  valutazione_generale: string;
};

export type AnalisiProgressi = {
  livello_attenzione: 'low' | 'medium' | 'high' | 'critical';
  sommario: string;
  azioni_immediate: string[];
  obiettivi: Obiettivo[];
  approcci: ApproccioAllenamento[];
  limitazioni_fisiche: LimitazioneFisica[];
  valutazioni_aderenza: ValutazioneAderenza[];
  bilancio: BilancioProgressi | null;
  nota_cliente: string;
};

// ── Document types ─────────────────────────────────────────────────────────────

export type RawDocument = {
  doc_id: string;
  name: string;
  description: string;
  text: string;
  added_at: string;
  category?: 'scheda' | 'documento_medico';
};

export type UploadQueueItem = {
  id: string;
  file: File | null;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  text?: string;
  error?: string;
  description?: string;
  category: 'scheda' | 'documento_medico';
};

export type RedactionRule = {
  id: string;
  original: string;
  replacement: string;
  enabled: boolean;
};

// ── Root types ─────────────────────────────────────────────────────────────────

export type CaseAnalysis = {
  case_id: string;
  case_title: string;
  language: string;
  case_summary: string;
  materials: Material[];
  timeline: TimelineEvent[];
  people: Person[];
  evidence: EvidenceItem[];
  open_questions: OpenQuestion[];
  missing_documents: MissingDocument[];
  contradictions: Contradiction[];
  procedural_deadlines: Appuntamento[];
  brief_markdown: string;
  usage_estimate: UsageEstimate;
  pro_recommendation?: ProRecommendation;
  analisi_progressi: AnalisiProgressi | null;
  is_pending?: boolean;
  raw_documents?: RawDocument[];
  redaction_rules?: RedactionRule[];
  analyzed_doc_ids?: string[];
  draft_artifacts?: DraftArtifact[];
};

export type CaseSummary = {
  case_id: string;
  case_title: string;
  client_name: string;
  case_summary: string;
  obiettivi_summary: string;
  next_deadline_date: string | null;
  next_deadline_title: string | null;
  contradiction_count: number;
  material_count: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical' | null;
  status: string;
  created_at: string;
  is_pending?: boolean;
};

export type TabId = 'timeline' | 'deadlines' | 'facts' | 'analisi' | 'piani' | 'questions' | 'brief';

export type ChatMsg = {
  role: 'user' | 'assistant';
  content: string;
  id: string;
};

export type ChatState = {
  open: boolean;
  messages: ChatMsg[];
  caseContext: string | null;
  activeCaseId: string | null;
};

export type UserProfile = {
  id: string;
  full_name: string | null;
  studio: string | null;
  phone: string | null;
};
