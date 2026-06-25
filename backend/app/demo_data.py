from __future__ import annotations

from .models import (
    AnalisiProgressi,
    Appuntamento,
    ApproccioAllenamento,
    BilancioProgressi,
    CaseAnalysis,
    CaseSummary,
    Contradiction,
    EvidenceItem,
    LimitazioneFisica,
    Material,
    MissingDocument,
    Obiettivo,
    OpenQuestion,
    Person,
    SourceRef,
    StepObiettivo,
    TimelineEvent,
    UsageEstimate,
    ValutazioneAderenza,
)


def ref(source_name: str, quote: str, confidence: float = 0.86, chunk: str | None = None) -> SourceRef:
    return SourceRef(source_name=source_name, page=1, chunk=chunk, quote=quote, confidence=confidence)


# ─────────────────────────────────────────────────────────────────────────────
# DEMO CLIENT 1 — Marco Bianchi (massa muscolare, 35 anni)
# ─────────────────────────────────────────────────────────────────────────────

def build_demo_case() -> CaseAnalysis:
    log1 = ref("log-sessioni-1-6.txt", "Panca 60×5, Squat 80×5, Stacco 90×5. Peso 78kg.", 0.91, "sess-1")
    log2 = ref("log-sessioni-1-6.txt", "Panca 65×5 (dolore lieve spalla) → inclinata manubri 20kg×10×3.", 0.88, "sess-3")
    log3 = ref("log-sessioni-7-12.txt", "Panca 67.5×4, 67.5×4, 67.5×3 — PLATEAU. Squat 95×5 (nuovo PR!).", 0.90, "sess-7")
    log4 = ref("log-sessioni-7-12.txt", "Panca pausa 65×8×4 — ottima! Pronto per riprendere progressione.", 0.89, "sess-12")
    anamnesi = ref("anamnesi-sportiva.txt", "Lussazione spalla dx nel 2019 (guarita). Lavoro sedentario 8h/giorno.", 0.85, "anamnesi")

    return CaseAnalysis(
        case_id="marco-bianchi",
        case_title="Marco Bianchi",
        language="it",
        case_summary="35 anni. Obiettivo: aumento massa muscolare. Livello: intermedio. 12 sessioni in 3 mesi. Lavoro d'ufficio sedentario, disponibile 3 giorni/settimana.",
        materials=[
            Material(id="mat-1", name="Anamnesi sportiva", kind="text",
                     content="Marco Bianchi, 35 anni. Nessuna patologia cardiaca. Lussazione spalla dx nel 2019 (guarita). Lavoro sedentario."),
            Material(id="mat-2", name="Log sessioni 1-6 (marzo-aprile 2026)", kind="text",
                     content="SESSIONE 1 - 03/03\nPanca 60×5, Squat 80×5, Stacco 90×5. Peso 78kg.\n\nSESSIONE 3 - 10/03\nPanca 65×5 (dolore spalla) → inclinata manubri.\n\nSESSIONE 6 - 31/03\nPanca 67.5×4 — plateau inizia qui. Squat 92.5×5."),
            Material(id="mat-3", name="Log sessioni 7-12 (aprile-maggio 2026)", kind="text",
                     content="SESSIONE 7 - 07/04\nPanca 67.5×4 — PLATEAU. Squat 95×5 (PR!).\n\nSESSIONE 9 - 21/04\nPeso 79.2kg. Stacco 105×5 (PR).\n\nSESSIONE 12 - 19/05\nPanca pausa 65×8×4 — ottima!"),
        ],
        timeline=[
            TimelineEvent(date="2026-03-03",
                          title="Sessione 1 — Valutazione iniziale",
                          description="Test forza: panca 60 kg × 5, squat 80 kg × 5, stacco 90 kg × 5. Peso 78 kg, BF 18%.",
                          source_refs=[log1], confidence=0.91),
            TimelineEvent(date="2026-03-10",
                          title="Sessione 3 — Prima progressione",
                          description="Panca 65 kg × 5. Dolore lieve spalla verso la fine. Sostituito con panca inclinata manubri.",
                          source_refs=[log2], confidence=0.88),
            TimelineEvent(date="2026-03-24",
                          title="Misurazione 1 mese",
                          description="Peso 78.5 kg (+0.5 kg). Circonferenza braccio sx: 36 → 37 cm.",
                          source_refs=[log1], confidence=0.87),
            TimelineEvent(date="2026-04-07",
                          title="Sessione 7 — Plateau panca",
                          description="Panca 67.5 kg × 4. Non riesce la quinta ripetizione da 3 settimane. Possibile plateau.",
                          source_refs=[log3], confidence=0.90),
            TimelineEvent(date="2026-04-21",
                          title="Misurazione 2 mesi",
                          description="Peso 79.2 kg (+0.7 kg). Panca invariata a 67.5 kg. Squat salito a 95 kg. Stacco 105 kg.",
                          source_refs=[log3], confidence=0.90),
            TimelineEvent(date="2026-05-05",
                          title="Sessione 10 — Variazione programma",
                          description="Introdotto 4×8 pausa-ripetizioni sulla panca. Risposta positiva, dolore spalla assente.",
                          source_refs=[log4], confidence=0.89),
            TimelineEvent(date="2026-05-19",
                          title="Sessione 12 — Verifica plateau",
                          description="Panca pausa: 65 kg × 8. Buona esecuzione. Rimandata progressione a 70 kg. Umore alto.",
                          source_refs=[log4], confidence=0.89),
        ],
        people=[
            Person(name="Marco Bianchi", role="cliente",
                   notes="35 anni, Roma, impiegato. WhatsApp preferito.", source_refs=[]),
            Person(name="Dott. Rossi Luca", role="fisiatra",
                   notes="Ha seguito la spalla nel 2019.", source_refs=[anamnesi]),
        ],
        evidence=[
            EvidenceItem(title="Panca piana — progressione",
                         status="plateau",
                         notes="60 kg → 67.5 kg → plateau 8 settimane. 4×8 pausa ok.",
                         source_refs=[log3]),
            EvidenceItem(title="Squat — progressione",
                         status="confirmed",
                         notes="80 kg → 95 kg in 3 mesi. Progressione regolare.",
                         source_refs=[log3]),
            EvidenceItem(title="Stacco da terra",
                         status="confirmed",
                         notes="90 kg → 105 kg in 3 mesi.",
                         source_refs=[log4]),
            EvidenceItem(title="Peso corporeo",
                         status="partial",
                         notes="78 kg → 79.2 kg in 2 mesi. Sotto target (+1 kg/mese).",
                         source_refs=[]),
        ],
        open_questions=[
            OpenQuestion(question="Ha fatto l'ecografia alla spalla destra?",
                         why_it_matters="Vecchia lussazione — prima di aumentare i carichi in panca serve la liberatoria del fisiatra",
                         source_refs=[anamnesi]),
            OpenQuestion(question="Sta rispettando le 200 g di proteine giornaliere?",
                         why_it_matters="Il plateau sulla massa potrebbe essere nutrizionale, non di allenamento",
                         source_refs=[]),
        ],
        missing_documents=[
            MissingDocument(title="Liberatoria fisiatra per spalla destra",
                            reason="Necessaria prima di aumentare carichi in panca oltre 70 kg",
                            priority="alta"),
        ],
        contradictions=[
            Contradiction(title="Plateau panca da 8 settimane",
                          description="Marco non ha superato 67.5 kg in panca piana da 8 settimane nonostante progressione su squat e stacco. Causa probabile: spalla limitante, volume insufficiente, apporto proteico inadeguato.",
                          source_refs=[log3]),
            Contradiction(title="Aumento di massa inferiore al target",
                          description="+1.2 kg in 2 mesi vs target +1 kg/mese. Potrebbe indicare dieta non ottimizzata.",
                          source_refs=[]),
        ],
        procedural_deadlines=[
            Appuntamento(title="Sessione — Giorno A (Petto + Tricipiti)",
                         due_date="2026-06-02", due_time="18:30",
                         deadline_type="sessione_pt", status="needs_review",
                         urgency="alta",
                         description="Testare panca con presa stretta. Chiedere della spalla.",
                         source_refs=[]),
            Appuntamento(title="Check-in misurazioni 3 mesi",
                         due_date="2026-06-09", due_time="09:00",
                         deadline_type="check_in", status="needs_review",
                         urgency="media",
                         description="Peso, circonferenze, foto progresso. Confronto con baseline.",
                         source_refs=[]),
            Appuntamento(title="Gara amatoriale Natural Bodybuilding Roma",
                         due_date="2026-09-20", due_time="10:00",
                         deadline_type="gara", status="candidate",
                         urgency="bassa",
                         description="Obiettivo dichiarato da Marco. Da valutare fattibilità reale.",
                         source_refs=[]),
        ],
        brief_markdown="""## Marco Bianchi — Note rapide
- 35 anni, impiegato, sedentario fuori dal centro
- Obiettivo massa: +3 kg muscolo in 6 mesi
- Disponibilità: lun/mer/ven ore 18:30
- Limite: dolore occasionale alla spalla dx (vecchia lussazione)
- Non ama il cardio. Motivazione alta nelle prime 2 settimane, poi cala.
- Non fa colazione — solo caffè

## Prossima sessione
**Lunedì** — Giorno A (petto + tricipiti). Testare variazione panca con presa stretta.

## Azioni prioritarie
- Richiedere liberatoria fisiatra per spalla
- Introdurre tracking proteico (obiettivo: 158 g/giorno)
- Periodizzazione ondulata: alternare settimane forza/ipertrofia sulla panca""",
        usage_estimate=UsageEstimate(pages=3, audio_minutes=0, flash_input_tokens=8420,
                                     flash_output_tokens=2100, pro_used=False),
        analisi_progressi=AnalisiProgressi(
            livello_attenzione="medium",
            sommario="Progressione globale buona su squat e stacco. Plateau persistente sulla panca piana da 8 settimane. Spalla destra da monitorare. Aumento di massa nella norma ma sotto il target dichiarato.",
            azioni_immediate=[
                "Verificare stato spalla destra prima di aumentare carichi in panca",
                "Variazione tecnica: pausa-ripetizioni o panca inclinata come primario per 4 settimane",
                "Aumentare apporto proteico: portare a 2 g/kg/giorno (158 g/gg)",
                "Aggiungere mobilità toracica e stretching spalle nel warm-up",
            ],
            obiettivi=[
                Obiettivo(
                    obiettivo_code="OBJ-1",
                    obiettivo_nome="Aumento massa muscolare",
                    scadenza_target="2026-09-03",
                    progresso_score=0.45,
                    step_obiettivo=[
                        StepObiettivo(element="Stimolo allenante progressivo",
                                      description="Progressione del carico e del volume nel tempo",
                                      status="plateau",
                                      notes="Plateau panca — da risolvere con variazione tecnica",
                                      source_refs=[log3]),
                        StepObiettivo(element="Apporto proteico adeguato",
                                      description="2 g/kg/giorno per sintesi proteica ottimale",
                                      status="non_avviato",
                                      notes="Non verificato — Marco non traccia la dieta",
                                      source_refs=[]),
                        StepObiettivo(element="Recupero adeguato",
                                      description="3 sessioni/settimana + sonno 7-8h",
                                      status="raggiunto",
                                      notes="Confermato — rispetta i giorni di riposo",
                                      source_refs=[log4]),
                    ],
                    strategie=[],
                    notes="Progressione parziale. Intervenire su nutrizione e variazione tecnica panca.",
                    source_refs=[log1],
                ),
            ],
            approcci=[
                ApproccioAllenamento(
                    title="Periodizzazione ondulata sul petto",
                    obiettivo_ref="OBJ-1",
                    tipo="periodizzazione",
                    priority="primary",
                    description="Alternare settimane forza (4×5, 85% 1RM) e ipertrofia (4×10, 65%). Rompere l'adattamento.",
                    strengths=["Stimolo neurale e metabolico alternato", "Riduce rischio sovraccarico spalla"],
                    risks=["Richiede pianificazione precisa", "Marco potrebbe demotivarsi con pesi leggeri"],
                    dati_necessari=["1RM panca attuale verificato"],
                    source_refs=[],
                ),
                ApproccioAllenamento(
                    title="Ottimizzazione nutrizionale",
                    obiettivo_ref="OBJ-1",
                    tipo="nutrizione",
                    priority="secondary",
                    description="Tracking alimentare 2 settimane. Obiettivo: 158 g proteina/giorno.",
                    strengths=["Basso rischio", "Alto impatto se causa nutrizionale"],
                    risks=["Marco potrebbe non voler tracciare"],
                    dati_necessari=["Diario alimentare 3 giorni tipo"],
                    source_refs=[],
                ),
            ],
            limitazioni_fisiche=[
                LimitazioneFisica(
                    title="Spalla destra — rischio infortunio",
                    issue_type="infortunio",
                    severity="significant",
                    description="Vecchia lussazione 2019. Dolore occasionale su panca piana con carico elevato. Ecografia di controllo non fatta.",
                    fonte="Anamnesi sportiva — sessione 3",
                    raccomandazione="Ok fisiatra prima di superare 70 kg in panca. Alternativa: inclinata manubri + pausa-ripetizioni.",
                    source_refs=[anamnesi],
                ),
            ],
            valutazioni_aderenza=[
                ValutazioneAderenza(
                    nome="Panca piana — plateau",
                    role="cliente",
                    affidabilita_score=0.45,
                    dichiarazione_chiave="67.5 kg × 4 — invariato da 8 settimane. Quinta ripetizione impossibile.",
                    strengths=["Dato oggettivo misurabile"],
                    vulnerabilities=["Potrebbe essere tecnico, non di forza", "Spalla limitante"],
                    domande_approfondimento=["Testare pausa-ripetizioni", "Testare presa stretta"],
                    source_refs=[log3],
                ),
                ValutazioneAderenza(
                    nome="Squat e stacco — progressione",
                    role="expert",
                    affidabilita_score=0.82,
                    dichiarazione_chiave="Squat 80→95 kg, stacco 90→105 kg in 3 mesi. Progressione costante.",
                    strengths=["Conferma risposta positiva all'allenamento"],
                    vulnerabilities=[],
                    domande_approfondimento=[],
                    source_refs=[log3, log4],
                ),
            ],
            bilancio=BilancioProgressi(
                progresso_score=0.60,
                autonomia_score=0.70,
                progressi_chiave=["Squat +15 kg", "Stacco +15 kg", "Compliance sessioni 12/12 (100%)"],
                fattori_favorevoli=["Risposta positiva ai multiarticolari", "Motivazione alta"],
                critical_gaps=["Monitoraggio nutrizionale mancante", "Ecografia spalla dx non fatta"],
                valutazione_generale="Atleta con ottima compliance e risposta positiva agli esercizi multiarticolari. Plateau isolato sulla panca, risolvibile con variazione tecnica e nutrizione. Nessun segnale di overtraining.",
            ),
            nota_cliente="Marco Bianchi, 35 anni. 12 sessioni in 3 mesi, compliance 100%. Progressione eccellente su squat e stacco. Plateau isolato sulla panca, probabilmente tecnico/nutrizionale.",
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# DEMO CLIENT 2 — Giulia Esposito (dimagrimento, 28 anni)
# ─────────────────────────────────────────────────────────────────────────────

def build_demo_case_2() -> CaseAnalysis:
    log_g = ref("log-giulia.txt", "Peso 68.5 kg (-3.5 kg). Ottima compliance. Cardio HIIT 3×/settimana.", 0.88, "giulia-4")

    return CaseAnalysis(
        case_id="giulia-esposito",
        case_title="Giulia Esposito",
        language="it",
        case_summary="28 anni. Obiettivo: dimagrimento (-8 kg). Livello: principiante. 8 sessioni in 2 mesi. Motivazione: matrimonio ottobre 2026.",
        materials=[
            Material(id="mat-g1", name="Anamnesi e obiettivi", kind="text",
                     content="Giulia Esposito, 28 anni. Nessuna patologia nota. Sedentaria. Obiettivo: perdere peso per matrimonio ottobre 2026. Peso iniziale 72 kg, BF 28%."),
        ],
        timeline=[
            TimelineEvent(date="2026-04-01", title="Sessione 1 — Valutazione",
                          description="Peso 72 kg, BF 28%. Circuito corpo libero. Resistenza cardio bassa.",
                          source_refs=[], confidence=0.90),
            TimelineEvent(date="2026-04-15", title="Misurazione 2 settimane",
                          description="Peso 70.8 kg (-1.2 kg). Buona motivazione.",
                          source_refs=[], confidence=0.88),
            TimelineEvent(date="2026-05-01", title="Sessione 5 — Introduzione HIIT",
                          description="Introdotto HIIT 20 min. Risposta positiva, no dolori.",
                          source_refs=[log_g], confidence=0.89),
            TimelineEvent(date="2026-05-20", title="Misurazione 2 mesi",
                          description="Peso 68.5 kg (-3.5 kg). Vita -4 cm. Energia aumentata.",
                          source_refs=[log_g], confidence=0.91),
        ],
        people=[
            Person(name="Giulia Esposito", role="cliente",
                   notes="28 anni, Napoli. Motivazione altissima — matrimonio a ottobre.", source_refs=[]),
        ],
        evidence=[
            EvidenceItem(title="Peso corporeo",
                         status="confirmed",
                         notes="72 kg → 68.5 kg in 2 mesi. -3.5 kg. In linea con target.",
                         source_refs=[log_g]),
            EvidenceItem(title="Circonferenza vita",
                         status="confirmed",
                         notes="82 cm → 78 cm in 2 mesi. Ottimo.",
                         source_refs=[log_g]),
            EvidenceItem(title="Resistenza cardiovascolare",
                         status="confirmed",
                         notes="Migliorata significativamente. HIIT 20 min senza problemi.",
                         source_refs=[log_g]),
        ],
        open_questions=[
            OpenQuestion(question="Sta seguendo il piano alimentare da 1500 kcal?",
                         why_it_matters="Il deficit calorico è fondamentale per il dimagrimento",
                         source_refs=[]),
        ],
        missing_documents=[],
        contradictions=[],
        procedural_deadlines=[
            Appuntamento(title="Sessione — Full body circuit",
                         due_date="2026-06-03", due_time="09:00",
                         deadline_type="sessione_pt", status="needs_review",
                         urgency="media",
                         description="Aumentare intensità HIIT a 25 min.",
                         source_refs=[]),
            Appuntamento(title="Misurazione mensile — 3 mesi",
                         due_date="2026-07-01", due_time="09:00",
                         deadline_type="check_in", status="needs_review",
                         urgency="media",
                         description="Foto progresso. Target: 66 kg.",
                         source_refs=[]),
        ],
        brief_markdown="""## Giulia Esposito — Note rapide
- 28 anni, Napoli, part-time
- Obiettivo: -8 kg entro ottobre (matrimonio)
- Motivazione eccellente, compliance perfetta
- Attenzione: tende a fare digiuni estremi nel weekend

## Stato attuale
- -3.5 kg in 2 mesi ✓
- HIIT introdotto e tollerato bene ✓
- Target ottobre raggiungibile al ritmo attuale ✓""",
        usage_estimate=UsageEstimate(pages=1, audio_minutes=0, flash_input_tokens=3200,
                                     flash_output_tokens=900, pro_used=False),
        analisi_progressi=AnalisiProgressi(
            livello_attenzione="low",
            sommario="Ottima progressione. Cliente in linea con il target dimagrimento. Compliance eccellente. Matrimonio a ottobre come motivazione forte.",
            azioni_immediate=[
                "Continuare piano attuale — nessuna modifica urgente",
                "Monitorare che non faccia digiuni estremi nel weekend",
                "Introdurre 1 sessione di forza ogni 2 settimane per preservare massa muscolare",
            ],
            obiettivi=[
                Obiettivo(
                    obiettivo_code="OBJ-1",
                    obiettivo_nome="Dimagrimento",
                    scadenza_target="2026-10-01",
                    progresso_score=0.78,
                    step_obiettivo=[
                        StepObiettivo(element="Deficit calorico", description="1500 kcal/giorno",
                                      status="raggiunto", notes="Perdita peso confermata", source_refs=[log_g]),
                        StepObiettivo(element="Allenamento regolare", description="3 sessioni/settimana",
                                      status="raggiunto", notes="Compliance 100%", source_refs=[log_g]),
                    ],
                    strategie=[],
                    notes="Ottima progressione. Continuare piano attuale.",
                    source_refs=[],
                ),
            ],
            approcci=[
                ApproccioAllenamento(
                    title="Introduzione forza per preservare massa",
                    obiettivo_ref="OBJ-1",
                    tipo="periodizzazione",
                    priority="primary",
                    description="Aggiungere 1 sessione forza/settimana per prevenire perdita di massa muscolare durante il dimagrimento.",
                    strengths=["Metabolismo basale più alto", "Corpo tonico per il matrimonio"],
                    risks=["Potrebbe spaventarla — comunicare bene il rationale"],
                    dati_necessari=[],
                    source_refs=[],
                ),
            ],
            limitazioni_fisiche=[],
            valutazioni_aderenza=[
                ValutazioneAderenza(
                    nome="Perdita peso — progressione",
                    role="cliente",
                    affidabilita_score=0.78,
                    dichiarazione_chiave="72 kg → 68.5 kg in 2 mesi. -3.5 kg. Target -8 kg a ottobre raggiungibile.",
                    strengths=["Dato oggettivo", "Ritmo costante"],
                    vulnerabilities=["Plateau possibile nella seconda metà"],
                    domande_approfondimento=["Monitorare ogni 2 settimane", "Adattare dieta se plateau"],
                    source_refs=[log_g],
                ),
            ],
            bilancio=BilancioProgressi(
                progresso_score=0.78,
                autonomia_score=0.80,
                progressi_chiave=["-3.5 kg in 2 mesi", "Vita -4 cm", "Compliance 100%"],
                fattori_favorevoli=["Motivazione forte (matrimonio)", "Risposta positiva all'HIIT"],
                critical_gaps=["Composizione corporea precisa (DEXA)"],
                valutazione_generale="Ottimo andamento. Cliente molto motivata, compliance eccellente. Continuare il piano senza modifiche sostanziali.",
            ),
            nota_cliente="Giulia Esposito, 28 anni. Dimagrimento in corso. -3.5 kg in 2 mesi, in linea con target. Motivazione altissima (matrimonio a ottobre). Nessun problema.",
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# DEMO CLIENT 3 — Luca Ferrara (maratona, 42 anni, infortunio ginocchio)
# ─────────────────────────────────────────────────────────────────────────────

def build_demo_case_3() -> CaseAnalysis:
    log_l1 = ref("log-luca.txt", "VO2max stimato 42 ml/kg/min. Obiettivo: maratona sotto le 4h.", 0.88, "luca-1")
    log_l2 = ref("log-luca.txt", "Dolore al ginocchio sinistro dopo lungo da 25 km. Stop 2 settimane.", 0.90, "luca-3")

    return CaseAnalysis(
        case_id="luca-ferrara",
        case_title="Luca Ferrara",
        language="it",
        case_summary="42 anni. Obiettivo: maratona Roma sotto le 4h. Runner amatoriale. Stop per infortunio ginocchio sinistro. 6 sessioni in 6 settimane.",
        materials=[
            Material(id="mat-l1", name="Piano allenamento maratona", kind="text",
                     content="Piano 16 settimane. Obiettivo sub-4h. VO2max 42. Settimana tipo: 3 corsa + 1 cross-training. ATTENZIONE: stop forzato settimana 6 per ginocchio."),
        ],
        timeline=[
            TimelineEvent(date="2026-04-15", title="Sessione 1 — Valutazione runner",
                          description="VO2max stimato 42. Passo medio attuale: 5'45\"/km. Obiettivo gara: 5'41\"/km (sub-4h).",
                          source_refs=[log_l1], confidence=0.88),
            TimelineEvent(date="2026-04-29", title="Sessione 3 — Lungo 25 km",
                          description="Completato ma dolore al ginocchio sinistro verso il km 22. Segnale di allarme.",
                          source_refs=[log_l2], confidence=0.90),
            TimelineEvent(date="2026-05-13", title="Sessione 5 — Ripresa post-stop",
                          description="Ritorno dopo 2 settimane di stop. Ginocchio ok su distanze brevi (< 10 km). Cauto.",
                          source_refs=[log_l2], confidence=0.87),
        ],
        people=[
            Person(name="Luca Ferrara", role="cliente",
                   notes="42 anni, Milano. Manager, alto stress. Maratona di Roma 22 settembre 2026.", source_refs=[]),
            Person(name="Dott.ssa Mancini", role="fisioterapista",
                   notes="Ha trattato il ginocchio durante lo stop.", source_refs=[log_l2]),
        ],
        evidence=[
            EvidenceItem(title="Passo gara",
                         status="partial",
                         notes="Attuale 5'45\"/km. Target sub-4h: 5'41\"/km. Margine minimo.",
                         source_refs=[log_l1]),
            EvidenceItem(title="Ginocchio sinistro",
                         status="plateau",
                         notes="Dolore al km 22 del lungo da 25 km. Stop 2 settimane. Fisioterapista consultato.",
                         source_refs=[log_l2]),
            EvidenceItem(title="Volume settimanale",
                         status="partial",
                         notes="Target: 60-70 km/sett. Attuale post-stop: 35 km. Da ricostruire gradualmente.",
                         source_refs=[]),
        ],
        open_questions=[
            OpenQuestion(question="Il ginocchio regge sui lunghi oltre 20 km?",
                         why_it_matters="Determinante per la strategia di preparazione alla maratona",
                         source_refs=[log_l2]),
            OpenQuestion(question="Ha l'ok della fisioterapista per aumentare il chilometraggio?",
                         why_it_matters="Non riprendere progressione senza clearance medica",
                         source_refs=[log_l2]),
        ],
        missing_documents=[
            MissingDocument(title="Referto fisioterapista su ginocchio sinistro",
                            reason="Necessario per pianificare ripresa del chilometraggio",
                            priority="alta"),
        ],
        contradictions=[
            Contradiction(title="Infortunio ginocchio a 6 settimane dalla gara",
                          description="Stop forzato di 2 settimane ha tagliato 2 lunghi fondamentali. Il volume attuale (35 km/sett) è troppo basso per gareggiare in sicurezza sub-4h.",
                          source_refs=[log_l2]),
        ],
        procedural_deadlines=[
            Appuntamento(title="Lungo test 18 km",
                         due_date="2026-06-07", due_time="07:00",
                         deadline_type="sessione_pt", status="needs_review",
                         urgency="alta",
                         description="Test ginocchio su distanza intermedia. Stop se dolore.",
                         source_refs=[]),
            Appuntamento(title="Valutazione go/no-go maratona",
                         due_date="2026-09-10", due_time="10:00",
                         deadline_type="check_in", status="candidate",
                         urgency="alta",
                         description="Decisione finale se partecipare alla maratona di Roma o rimandare.",
                         source_refs=[]),
            Appuntamento(title="Maratona di Roma",
                         due_date="2026-09-22", due_time="08:00",
                         deadline_type="gara", status="candidate",
                         urgency="media",
                         description="Obiettivo: sub-4h. Condizionato al recupero del ginocchio.",
                         source_refs=[]),
        ],
        brief_markdown="""## Luca Ferrara — Note rapide
- 42 anni, Milano, manager. Stress alto.
- Obiettivo: maratona Roma 22 settembre, sub-4h
- **ATTENZIONE**: ginocchio sinistro — stop 2 settimane
- Non aumentare volume senza ok fisioterapista

## Situazione critica
- Perse 2 settimane fondamentali di preparazione
- Volume attuale 35 km/sett vs target 60-70 km
- 6 settimane alla gara — decisione go/no-go entro settembre

## Raccomandazione Aria
Considerare maratona alternativa a novembre 2026 se il ginocchio non recupera completamente entro luglio.""",
        usage_estimate=UsageEstimate(pages=2, audio_minutes=0, flash_input_tokens=4100,
                                     flash_output_tokens=1200, pro_used=False),
        analisi_progressi=AnalisiProgressi(
            livello_attenzione="high",
            sommario="Infortunio al ginocchio a 6 settimane dalla maratona di Roma. Volume attuale (35 km/sett) insufficiente per gareggiare in sicurezza. Decisione go/no-go critica entro settembre.",
            azioni_immediate=[
                "Ottenere referto fisioterapista prima di aumentare chilometraggio",
                "Lungo test 18 km come primo indicatore di tenuta",
                "Pianificare scenario B: maratona novembre 2026 se ginocchio non recupera",
                "Ridurre stress extrasportivo — recupero compromesso da alto carico di lavoro",
            ],
            obiettivi=[
                Obiettivo(
                    obiettivo_code="OBJ-1",
                    obiettivo_nome="Maratona sub-4h Roma",
                    scadenza_target="2026-09-22",
                    progresso_score=0.35,
                    step_obiettivo=[
                        StepObiettivo(element="Ginocchio in salute",
                                      description="Capacità di correre oltre 20 km senza dolore",
                                      status="plateau",
                                      notes="Infortunio recente — da verificare con test graduale",
                                      source_refs=[log_l2]),
                        StepObiettivo(element="Volume settimanale 60-70 km",
                                      description="Base aerobica sufficiente per sub-4h",
                                      status="non_avviato",
                                      notes="Attuale 35 km/sett dopo stop — da ricostruire",
                                      source_refs=[]),
                        StepObiettivo(element="Lunghissimi > 30 km",
                                      description="Almeno 2 lunghi da 30+ km in preparazione",
                                      status="non_avviato",
                                      notes="Stop ha cancellato 2 lunghi fondamentali",
                                      source_refs=[log_l2]),
                    ],
                    strategie=[],
                    notes="Obiettivo a rischio. Valutare rimandare a novembre.",
                    source_refs=[log_l1],
                ),
            ],
            approcci=[
                ApproccioAllenamento(
                    title="Recovery + ripresa graduale",
                    obiettivo_ref="OBJ-1",
                    tipo="recupero",
                    priority="primary",
                    description="Aumentare volume del 10% a settimana. Lungo test ogni 2 settimane. Stop immediato se dolore.",
                    strengths=["Conservativo, riduce rischio ricaduta"],
                    risks=["Volume potrebbe non arrivare a 60 km prima della gara"],
                    dati_necessari=["Ok fisioterapista", "Lungo test 18 km ok"],
                    source_refs=[],
                ),
                ApproccioAllenamento(
                    title="Scenario B — maratona novembre",
                    obiettivo_ref="OBJ-1",
                    tipo="altro",
                    priority="fallback",
                    description="Se ginocchio non regge: rimandare a maratona di novembre 2026.",
                    strengths=["Elimina rischio infortunio grave", "Migliore preparazione"],
                    risks=["Delusione cliente — comunicare con anticipo"],
                    dati_necessari=[],
                    source_refs=[],
                ),
            ],
            limitazioni_fisiche=[
                LimitazioneFisica(
                    title="Ginocchio sinistro — rischio infortunio grave",
                    issue_type="infortunio",
                    severity="critical",
                    description="Dolore al ginocchio durante lungo da 25 km. Stop 2 settimane. Referto fisioterapista non ancora disponibile.",
                    fonte="Log sessione 3 — 29/04/2026",
                    raccomandazione="No aumento volume senza ok fisioterapista. Lunghi progressivi: 18 km → 22 km → 27 km.",
                    source_refs=[log_l2],
                ),
            ],
            valutazioni_aderenza=[
                ValutazioneAderenza(
                    nome="Ginocchio sinistro",
                    role="fisioterapista",
                    affidabilita_score=0.72,
                    dichiarazione_chiave="Dolore al km 22 del lungo da 25 km. Stop forzato 2 settimane.",
                    strengths=["Evento documentato"],
                    vulnerabilities=["Potrebbe essere guarito con la fisioterapia"],
                    domande_approfondimento=["Test 18 km", "Test 22 km", "Referto fisioterapista"],
                    source_refs=[log_l2],
                ),
                ValutazioneAderenza(
                    nome="Base aerobica",
                    role="expert",
                    affidabilita_score=0.55,
                    dichiarazione_chiave="VO2max 42 — buona base aerobica. Con preparazione completa il target sub-4h è raggiungibile.",
                    strengths=["Dato oggettivo"],
                    vulnerabilities=["Preparazione incompleta"],
                    domande_approfondimento=["Test passo su 10 km post-stop"],
                    source_refs=[log_l1],
                ),
            ],
            bilancio=BilancioProgressi(
                progresso_score=0.35,
                autonomia_score=0.45,
                progressi_chiave=["VO2max 42 — buona base", "Motivazione alta", "Fisioterapia in corso"],
                fattori_favorevoli=["Runner esperto", "Struttura aerobica solida"],
                critical_gaps=["Referto fisioterapista", "Test lungo 18 km", "Risposta ginocchio > 20 km"],
                valutazione_generale="Situazione critica per l'obiettivo settembre. La decisione go/no-go dipende dal recupero del ginocchio nelle prossime 4 settimane. Preparare piano B (novembre) per non perdere la stagione.",
            ),
            nota_cliente="Luca Ferrara, 42 anni. Maratona Roma 22 settembre a rischio per infortunio al ginocchio. Volume insufficiente. Valutare rimandare a novembre.",
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Registry
# ─────────────────────────────────────────────────────────────────────────────

_DEMO_CACHE: dict[str, dict[str, CaseAnalysis]] = {}


def _build_all() -> dict[str, CaseAnalysis]:
    cases = [build_demo_case(), build_demo_case_2(), build_demo_case_3()]
    return {c.case_id: c for c in cases}


def get_all_cases(lang: str = "it") -> dict[str, CaseAnalysis]:
    """Demo cases for the requested language ('it' default, 'en' supported)."""
    key = "en" if lang == "en" else "it"
    if key not in _DEMO_CACHE:
        if key == "en":
            from .demo_data_en import build_all_en
            _DEMO_CACHE[key] = build_all_en()
        else:
            _DEMO_CACHE[key] = _build_all()
    return _DEMO_CACHE[key]


def get_case_summaries(lang: str = "it") -> list[CaseSummary]:
    cases = get_all_cases(lang)
    fallback = "See sheet" if lang == "en" else "Vedere scheda"
    summaries = []
    for case in cases.values():
        next_dl = sorted(case.procedural_deadlines, key=lambda d: d.due_date)[0] if case.procedural_deadlines else None
        obj_summary = ", ".join(
            o.obiettivo_nome for o in (case.analisi_progressi.obiettivi if case.analisi_progressi else [])
        ) or fallback
        summaries.append(CaseSummary(
            case_id=case.case_id,
            case_title=case.case_title,
            client_name=case.case_title,
            case_summary=case.case_summary,
            obiettivi_summary=obj_summary,
            next_deadline_date=next_dl.due_date if next_dl else None,
            next_deadline_title=next_dl.title if next_dl else None,
            contradiction_count=len(case.contradictions),
            material_count=len(case.materials),
            risk_level=case.analisi_progressi.livello_attenzione if case.analisi_progressi else None,
            status="active",
            created_at="2026-03-01",
        ))
    return summaries
