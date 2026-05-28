import type { CaseAnalysis, CaseSummary } from './types';

export function buildCaseContext(c: CaseAnalysis): string {
  const la = c.analisi_progressi;
  let ctx = `SCHEDA CLIENTE: ${c.case_title}\n\nSINTESI: ${c.case_summary}\n\n`;

  const docMedica = (c.raw_documents ?? []).filter(d => d.category === 'documento_medico');
  if (docMedica.length) {
    ctx += `DOCUMENTAZIONE MEDICA/SPECIALISTICA (citabile con source_ref):\n`;
    ctx += docMedica.map(d => `• [${d.name}]: ${d.text.slice(0, 400).replace(/\n+/g, ' ')}…`).join('\n');
    ctx += '\n\n';
  }

  if (c.people.length) {
    ctx += `PROFILO CLIENTE E RIFERIMENTI:\n${c.people.map(p => `• ${p.name} (${p.role})${p.notes ? ': ' + p.notes : ''}`).join('\n')}\n\n`;
  }

  if (c.timeline.length) {
    ctx += `STORICO SESSIONI:\n${c.timeline.map(e => `• [${e.date ?? '?'}${e.time ? ' ' + e.time : ''}]${e.tipo_sessione ? ' [' + e.tipo_sessione.toUpperCase() + ']' : ''} ${e.title}: ${e.description}`).join('\n')}\n\n`;
  }

  if (la) {
    if (la.obiettivi.length) {
      ctx += `OBIETTIVI DI ALLENAMENTO:\n${la.obiettivi.map(ob => `• ${ob.obiettivo_code} — ${ob.obiettivo_nome} (progresso: ${Math.round(ob.progresso_score * 100)}%): ${ob.notes}`).join('\n')}\n\n`;
    }
    ctx += `LIVELLO ATTENZIONE: ${la.livello_attenzione.toUpperCase()} — ${la.sommario}\n\n`;
    if (la.approcci.length) {
      ctx += `APPROCCI DI ALLENAMENTO:\n${la.approcci.map(a => `• [${a.priority}] ${a.title}: ${a.description}`).join('\n')}\n\n`;
    }
    if (la.limitazioni_fisiche.length > 0) {
      ctx += `LIMITAZIONI FISICHE / CONTROINDICAZIONI:\n${la.limitazioni_fisiche.map(l => `• ${l.title} (${l.severity})\n  Fonte: ${l.fonte}\n  Raccomandazione: ${l.raccomandazione}`).join('\n')}\n\n`;
    }
    if (la.valutazioni_aderenza.length) {
      ctx += `VALUTAZIONI ADERENZA:\n${la.valutazioni_aderenza.map(v => `• ${v.nome} (${v.role}, aderenza ${Math.round(v.affidabilita_score * 100)}%): ${v.dichiarazione_chiave}`).join('\n')}\n\n`;
    }
    if (la.bilancio) {
      ctx += `BILANCIO PROGRESSI:\n  Progresso: ${Math.round(la.bilancio.progresso_score * 100)}% — ${la.bilancio.progressi_chiave.join('; ')}\n  Autonomia: ${Math.round(la.bilancio.autonomia_score * 100)}% — ${la.bilancio.fattori_favorevoli.join('; ')}\n  Lacune: ${la.bilancio.critical_gaps.join('; ')}\n\n`;
    }
    if (la.nota_cliente) {
      ctx += `NOTA PER IL CLIENTE:\n${la.nota_cliente}\n\n`;
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
      obiettivi_summary: '— da analizzare —', next_deadline_date: null, next_deadline_title: null,
      contradiction_count: 0, material_count: n, risk_level: null, status: 'pending',
      created_at: new Date().toISOString(), is_pending: true,
    };
  }
  const la = c.analisi_progressi;
  const nextDeadline = [...c.procedural_deadlines].sort((a, b) =>
    `${a.due_date}T${a.due_time ?? '23:59'}`.localeCompare(`${b.due_date}T${b.due_time ?? '23:59'}`)
  )[0];
  const client = c.people.find(p => /cliente|client|athlete|atleta/i.test(p.role));
  return {
    case_id: c.case_id, case_title: c.case_title, client_name: client?.name ?? c.case_title,
    case_summary: c.case_summary,
    obiettivi_summary: la?.obiettivi.map(ob => ob.obiettivo_nome).join(', ') || 'Obiettivo da determinare',
    next_deadline_date: nextDeadline?.due_date ?? null, next_deadline_title: nextDeadline?.title ?? null,
    contradiction_count: c.contradictions.length, material_count: c.materials.length,
    risk_level: la?.livello_attenzione ?? null, status: 'active', created_at: new Date().toISOString(),
  };
}
