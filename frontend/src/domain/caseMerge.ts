import type { CaseAnalysis } from './types';

export function buildUserContextMaterial(c: CaseAnalysis): { name: string; kind: string; text: string } | null {
  const isIncremental = c.analisi_progressi != null && (c.analyzed_doc_ids?.length ?? 0) > 0;
  const lines: string[] = [];
  if (c.case_summary?.trim()) lines.push(`SINTESI: ${c.case_summary.trim()}`);
  if (c.people.length) lines.push('PERSONE:\n' + c.people.map(p => `- ${p.name} (${p.role})${p.notes ? ': ' + p.notes : ''}`).join('\n'));
  if (c.timeline.length) lines.push('STORICO SESSIONI:\n' + c.timeline.map(e => `- [${e.date ?? '?'}${e.time ? ' ' + e.time : ''}]${e.tipo_sessione ? ' [' + e.tipo_sessione + ']' : ''} ${e.title}${e.description ? ': ' + e.description : ''}`).join('\n'));
  if (c.evidence.length) lines.push('PROGRESSI MISURATI:\n' + c.evidence.map(e => `- ${e.title} (${e.status})${e.notes ? ': ' + e.notes : ''}`).join('\n'));
  if (c.contradictions.length) lines.push('PLATEAU E INCONGRUENZE:\n' + c.contradictions.map(ct => `- ${ct.title}: ${ct.description}`).join('\n'));
  if (c.open_questions.length) lines.push('DOMANDE APERTE:\n' + c.open_questions.map(q => `- ${q.question} (${q.why_it_matters})`).join('\n'));
  if (c.missing_documents.length) lines.push('DOCUMENTI MANCANTI:\n' + c.missing_documents.map(d => `- ${d.title} (priorità ${d.priority}): ${d.reason}`).join('\n'));
  if (c.procedural_deadlines.length) lines.push('APPUNTAMENTI:\n' + c.procedural_deadlines.map(dl => `- [${dl.due_date}] ${dl.title} (urgenza ${dl.urgency})`).join('\n'));
  if (c.analisi_progressi?.obiettivi.length) lines.push('OBIETTIVI CORRENTI:\n' + c.analisi_progressi.obiettivi.map(ob => `- ${ob.obiettivo_nome} (progresso ${Math.round(ob.progresso_score * 100)}%)`).join('\n'));
  if (c.brief_markdown?.trim()) lines.push(`PROMEMORIA TRAINER (aggiorna con i nuovi documenti):\n${c.brief_markdown.trim()}`);
  if (!lines.length) return null;
  let text = lines.join('\n\n');
  const MAX_CONTEXT_CHARS = 8000;
  if (text.length > MAX_CONTEXT_CHARS) {
    text = text.slice(0, MAX_CONTEXT_CHARS) + '\n\n[...contesto troncato per limite di lunghezza — i nuovi documenti sono prioritari...]';
  }
  return {
    name: isIncremental
      ? 'Analisi esistente consolidata — integra i nuovi documenti che seguono, aggiorna il brief_markdown.'
      : 'Annotazioni esistenti (inserite dal trainer — integrare, non sovrascrivere)',
    kind: 'text',
    text,
  };
}

function mergeArrays<T extends Record<string, unknown>>(existing: T[], ai: T[], key: keyof T): T[] {
  const seen = new Set(existing.map(e => String(e[key] ?? '').toLowerCase().trim()));
  const novel = ai.filter(a => !seen.has(String(a[key] ?? '').toLowerCase().trim()));
  return [...existing, ...novel];
}

export function mergeWithAi(existing: CaseAnalysis, ai: CaseAnalysis): CaseAnalysis {
  const merged: CaseAnalysis = {
    ...ai,
    case_id: existing.case_id,
    raw_documents: existing.raw_documents,
    analyzed_doc_ids: existing.analyzed_doc_ids,
    is_pending: false,
    case_title: existing.case_title?.trim() || ai.case_title,
    case_summary: existing.case_summary?.trim() || ai.case_summary,
    brief_markdown: ai.brief_markdown?.trim() || existing.brief_markdown || '',
    timeline: mergeArrays(existing.timeline, ai.timeline, 'title'),
    people: mergeArrays(existing.people, ai.people, 'name'),
    evidence: mergeArrays(existing.evidence, ai.evidence, 'title'),
    open_questions: mergeArrays(existing.open_questions, ai.open_questions, 'question'),
    missing_documents: mergeArrays(existing.missing_documents, ai.missing_documents, 'title'),
    contradictions: mergeArrays(existing.contradictions, ai.contradictions, 'title'),
    procedural_deadlines: mergeArrays(existing.procedural_deadlines, ai.procedural_deadlines, 'title'),
    materials: mergeArrays(existing.materials, ai.materials, 'name'),
  };
  if (existing.analisi_progressi && ai.analisi_progressi) {
    merged.analisi_progressi = {
      ...ai.analisi_progressi,
      livello_attenzione: existing.analisi_progressi.livello_attenzione,
      sommario: existing.analisi_progressi.sommario?.trim() || ai.analisi_progressi.sommario,
      azioni_immediate: existing.analisi_progressi.azioni_immediate.length
        ? existing.analisi_progressi.azioni_immediate
        : ai.analisi_progressi.azioni_immediate,
    };
  }
  return merged;
}
