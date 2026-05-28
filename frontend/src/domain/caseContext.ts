import type { CaseAnalysis, CaseSummary } from './types';

export function buildCaseContext(c: CaseAnalysis): string {
  const la = c.legal_analysis;
  let ctx = `SCHEDA CLIENTE: ${c.case_title}\n\nSINTESI: ${c.case_summary}\n\n`;

  const docMedica = (c.raw_documents ?? []).filter(d => d.category === 'giurisprudenza');
  if (docMedica.length) {
    ctx += `DOCUMENTAZIONE MEDICA/SPECIALISTICA (citabile con source_ref):\n`;
    ctx += docMedica.map(d => `• [${d.name}]: ${d.text.slice(0, 400).replace(/\n+/g, ' ')}…`).join('\n');
    ctx += '\n\n';
  }

  if (c.people.length) {
    ctx += `PROFILO CLIENTE E RIFERIMENTI:\n${c.people.map(p => `• ${p.name} (${p.role})${p.notes ? ': ' + p.notes : ''}`).join('\n')}\n\n`;
  }

  if (c.timeline.length) {
    ctx += `STORICO SESSIONI:\n${c.timeline.map(e => `• [${e.date ?? '?'}${e.time ? ' ' + e.time : ''}] ${e.title}: ${e.description}`).join('\n')}\n\n`;
  }

  if (la) {
    if (la.charges.length) {
      ctx += `OBIETTIVI DI ALLENAMENTO:\n${la.charges.map(ch => `• ${ch.charge_code} — ${ch.charge_name}: ${ch.notes}`).join('\n')}\n\n`;
    }
    ctx += `STATO PROGRESSO: ${la.risk_level.toUpperCase()} — ${la.risk_summary}\n\n`;
    if (la.strategies.length) {
      ctx += `STRATEGIE DI ALLENAMENTO:\n${la.strategies.map(s => `• [${s.priority}] ${s.title}: ${s.description}`).join('\n')}\n\n`;
    }
    if (la.constitutional_issues.length > 0) {
      ctx += `LIMITAZIONI FISICHE / CONTROINDICAZIONI:\n${la.constitutional_issues.map(i => `• ${i.title} (${i.severity})\n  Base: ${i.legal_basis}\n  Da fare: ${i.remedy}`).join('\n')}\n\n`;
    }
    if (la.witness_assessments.length) {
      ctx += `AUTOVALUTAZIONI CLIENTE:\n${la.witness_assessments.map(w => `• ${w.witness_name} (${w.role}, affidabilità ${Math.round(w.credibility_score * 100)}%): ${w.key_testimony}`).join('\n')}\n\n`;
    }
    if (la.evidence_balance) {
      ctx += `BILANCIAMENTO PROGRESSI:\n  Aderenza al piano: ${Math.round(la.evidence_balance.prosecution_strength * 100)}% — ${la.evidence_balance.key_prosecution_evidence.join('; ')}\n  Autogestione cliente: ${Math.round(la.evidence_balance.defense_strength * 100)}% — ${la.evidence_balance.key_defense_evidence.join('; ')}\n  Gap di informazioni: ${la.evidence_balance.critical_gaps.join('; ')}\n\n`;
    }
    if (la.client_summary) {
      ctx += `SINTESI PER IL CLIENTE:\n${la.client_summary}\n\n`;
    }
  }

  if (c.contradictions.length) {
    ctx += `PLATEAU E INCONGRUENZE:\n${c.contradictions.map(ct => `• ${ct.title}: ${ct.description}`).join('\n')}\n\n`;
  }

  if (c.open_questions.length) {
    ctx += `QUESTIONI DA CHIARIRE:\n${c.open_questions.map(q => `• ${q.question} — perché conta: ${q.why_it_matters}`).join('\n')}\n\n`;
  }

  const urgentDeadlines = c.procedural_deadlines.filter(d => d.urgency === 'alta');
  if (urgentDeadlines.length) {
    ctx += `APPUNTAMENTI URGENTI:\n${urgentDeadlines.map(d => `• ${d.due_date}${d.due_time ? ' ' + d.due_time : ''} — ${d.title}: ${d.description}`).join('\n')}\n\n`;
  }

  if (c.brief_markdown?.trim()) {
    ctx += `PROMEMORIA TRAINER:\n${c.brief_markdown.trim()}\n\n`;
  }

  return ctx.trim();
}

export function caseAnalysisToSummary(c: CaseAnalysis): CaseSummary {
  if (c.is_pending) {
    const n = c.raw_documents?.length ?? 0;
    return {
      case_id: c.case_id, case_title: c.case_title, client_name: '—',
      case_summary: n === 0 ? 'Scheda vuota — aggiungi documenti' : `${n} documento${n !== 1 ? 'i' : ''} caricato${n !== 1 ? 'i' : ''}, analisi non avviata`,
      charge_summary: '— da analizzare —', next_deadline_date: null, next_deadline_title: null,
      contradiction_count: 0, material_count: n, risk_level: null, status: 'pending',
      created_at: new Date().toISOString(), is_pending: true,
    };
  }
  const la = c.legal_analysis;
  const nextDeadline = [...c.procedural_deadlines].sort((a, b) =>
    `${a.due_date}T${a.due_time ?? '23:59'}`.localeCompare(`${b.due_date}T${b.due_time ?? '23:59'}`)
  )[0];
  const client = c.people.find(p => /cliente|client|athlete|atleta/i.test(p.role));
  return {
    case_id: c.case_id, case_title: c.case_title, client_name: client?.name ?? c.case_title,
    case_summary: c.case_summary,
    charge_summary: la?.charges.map(ch => ch.charge_name).join(', ') || 'Obiettivo da determinare',
    next_deadline_date: nextDeadline?.due_date ?? null, next_deadline_title: nextDeadline?.title ?? null,
    contradiction_count: c.contradictions.length, material_count: c.materials.length,
    risk_level: la?.risk_level ?? null, status: 'active', created_at: new Date().toISOString(),
  };
}
