"""English demo cases — parallel to demo_data.py (Italian).

Only the human-readable strings differ from the Italian builders. Enum values
(role, status, deadline_type, livello_attenzione, priority, severity, tipo…)
and the structural fields (dates, scores, source-ref shape) stay identical, so
the frontend's enum localization keeps working and IDs match across languages.
"""
from __future__ import annotations

from .models import (
    AnalisiProgressi,
    Appuntamento,
    ApproccioAllenamento,
    BilancioProgressi,
    CaseAnalysis,
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
# DEMO CLIENT 1 — Marco Bianchi (muscle mass, 35)
# ─────────────────────────────────────────────────────────────────────────────

def build_demo_case_en() -> CaseAnalysis:
    log1 = ref("session-log-1-6.txt", "Bench 60×5, Squat 80×5, Deadlift 90×5. Weight 78kg.", 0.91, "sess-1")
    log2 = ref("session-log-1-6.txt", "Bench 65×5 (mild shoulder pain) → incline dumbbell 20kg×10×3.", 0.88, "sess-3")
    log3 = ref("session-log-7-12.txt", "Bench 67.5×4, 67.5×4, 67.5×3 — PLATEAU. Squat 95×5 (new PR!).", 0.90, "sess-7")
    log4 = ref("session-log-7-12.txt", "Bench paused 65×8×4 — excellent! Ready to resume progression.", 0.89, "sess-12")
    anamnesi = ref("sports-history.txt", "Right shoulder dislocation in 2019 (healed). Sedentary desk job 8h/day.", 0.85, "history")

    return CaseAnalysis(
        case_id="marco-bianchi",
        case_title="Marco Bianchi",
        language="en",
        case_summary="35 years old. Goal: build muscle mass. Level: intermediate. 12 sessions in 3 months. Sedentary office job, available 3 days/week.",
        materials=[
            Material(id="mat-1", name="Sports history", kind="text",
                     content="Marco Bianchi, 35. No cardiac conditions. Right shoulder dislocation in 2019 (healed). Sedentary job."),
            Material(id="mat-2", name="Session log 1-6 (March-April 2026)", kind="text",
                     content="SESSION 1 - 03/03\nBench 60×5, Squat 80×5, Deadlift 90×5. Weight 78kg.\n\nSESSION 3 - 10/03\nBench 65×5 (shoulder pain) → incline dumbbell.\n\nSESSION 6 - 31/03\nBench 67.5×4 — plateau starts here. Squat 92.5×5."),
            Material(id="mat-3", name="Session log 7-12 (April-May 2026)", kind="text",
                     content="SESSION 7 - 07/04\nBench 67.5×4 — PLATEAU. Squat 95×5 (PR!).\n\nSESSION 9 - 21/04\nWeight 79.2kg. Deadlift 105×5 (PR).\n\nSESSION 12 - 19/05\nBench paused 65×8×4 — excellent!"),
        ],
        timeline=[
            TimelineEvent(date="2026-03-03",
                          title="Session 1 — Initial assessment",
                          description="Strength test: bench 60 kg × 5, squat 80 kg × 5, deadlift 90 kg × 5. Weight 78 kg, BF 18%.",
                          source_refs=[log1], confidence=0.91),
            TimelineEvent(date="2026-03-10",
                          title="Session 3 — First progression",
                          description="Bench 65 kg × 5. Mild shoulder pain towards the end. Replaced with incline dumbbell bench.",
                          source_refs=[log2], confidence=0.88),
            TimelineEvent(date="2026-03-24",
                          title="1-month measurement",
                          description="Weight 78.5 kg (+0.5 kg). Left arm circumference: 36 → 37 cm.",
                          source_refs=[log1], confidence=0.87),
            TimelineEvent(date="2026-04-07",
                          title="Session 7 — Bench plateau",
                          description="Bench 67.5 kg × 4. Can't hit the fifth rep for 3 weeks. Possible plateau.",
                          source_refs=[log3], confidence=0.90),
            TimelineEvent(date="2026-04-21",
                          title="2-month measurement",
                          description="Weight 79.2 kg (+0.7 kg). Bench unchanged at 67.5 kg. Squat up to 95 kg. Deadlift 105 kg.",
                          source_refs=[log3], confidence=0.90),
            TimelineEvent(date="2026-05-05",
                          title="Session 10 — Program change",
                          description="Introduced 4×8 paused reps on the bench. Positive response, no shoulder pain.",
                          source_refs=[log4], confidence=0.89),
            TimelineEvent(date="2026-05-19",
                          title="Session 12 — Plateau check",
                          description="Paused bench: 65 kg × 8. Good execution. Progression to 70 kg postponed. High spirits.",
                          source_refs=[log4], confidence=0.89),
        ],
        people=[
            Person(name="Marco Bianchi", role="cliente",
                   notes="35, Rome, office worker. Prefers WhatsApp.", source_refs=[]),
            Person(name="Dr. Luca Rossi", role="fisiatra",
                   notes="Treated the shoulder in 2019.", source_refs=[anamnesi]),
        ],
        evidence=[
            EvidenceItem(title="Flat bench — progression",
                         status="plateau",
                         notes="60 kg → 67.5 kg → plateau 8 weeks. 4×8 paused ok.",
                         source_refs=[log3]),
            EvidenceItem(title="Squat — progression",
                         status="confirmed",
                         notes="80 kg → 95 kg in 3 months. Steady progression.",
                         source_refs=[log3]),
            EvidenceItem(title="Deadlift",
                         status="confirmed",
                         notes="90 kg → 105 kg in 3 months.",
                         source_refs=[log4]),
            EvidenceItem(title="Body weight",
                         status="partial",
                         notes="78 kg → 79.2 kg in 2 months. Below target (+1 kg/month).",
                         source_refs=[]),
        ],
        open_questions=[
            OpenQuestion(question="Has he had the right-shoulder ultrasound?",
                         why_it_matters="Old dislocation — before increasing bench loads we need the physiatrist's clearance",
                         source_refs=[anamnesi]),
            OpenQuestion(question="Is he hitting his 200 g of daily protein?",
                         why_it_matters="The mass plateau could be nutritional, not training-related",
                         source_refs=[]),
        ],
        missing_documents=[
            MissingDocument(title="Physiatrist clearance for right shoulder",
                            reason="Required before increasing bench loads above 70 kg",
                            priority="alta"),
        ],
        contradictions=[
            Contradiction(title="Bench plateau for 8 weeks",
                          description="Marco hasn't passed 67.5 kg on flat bench for 8 weeks despite progressing on squat and deadlift. Likely cause: limiting shoulder, insufficient volume, inadequate protein intake.",
                          source_refs=[log3]),
            Contradiction(title="Mass gain below target",
                          description="+1.2 kg in 2 months vs target +1 kg/month. May indicate an unoptimised diet.",
                          source_refs=[]),
        ],
        procedural_deadlines=[
            Appuntamento(title="Session — Day A (Chest + Triceps)",
                         due_date="2026-06-02", due_time="18:30",
                         deadline_type="sessione_pt", status="needs_review",
                         urgency="alta",
                         description="Test close-grip bench. Ask about the shoulder.",
                         source_refs=[]),
            Appuntamento(title="3-month measurements check-in",
                         due_date="2026-06-09", due_time="09:00",
                         deadline_type="check_in", status="needs_review",
                         urgency="media",
                         description="Weight, circumferences, progress photos. Compare with baseline.",
                         source_refs=[]),
            Appuntamento(title="Amateur Natural Bodybuilding contest, Rome",
                         due_date="2026-09-20", due_time="10:00",
                         deadline_type="gara", status="candidate",
                         urgency="bassa",
                         description="Goal stated by Marco. Real feasibility to be assessed.",
                         source_refs=[]),
        ],
        brief_markdown="""## Marco Bianchi — Quick notes
- 35, office worker, sedentary outside the gym
- Mass goal: +3 kg muscle in 6 months
- Availability: Mon/Wed/Fri at 18:30
- Limit: occasional right-shoulder pain (old dislocation)
- Doesn't like cardio. High motivation the first 2 weeks, then it drops.
- Skips breakfast — coffee only

## Next session
**Monday** — Day A (chest + triceps). Test close-grip bench variation.

## Priority actions
- Request physiatrist clearance for the shoulder
- Introduce protein tracking (target: 158 g/day)
- Undulating periodisation: alternate strength/hypertrophy weeks on the bench""",
        usage_estimate=UsageEstimate(pages=3, audio_minutes=0, flash_input_tokens=8420,
                                     flash_output_tokens=2100, pro_used=False),
        analisi_progressi=AnalisiProgressi(
            livello_attenzione="medium",
            sommario="Good overall progression on squat and deadlift. Persistent flat-bench plateau for 8 weeks. Right shoulder to monitor. Mass gain within range but below the stated target.",
            azioni_immediate=[
                "Check right-shoulder status before increasing bench loads",
                "Technical variation: paused reps or incline bench as primary for 4 weeks",
                "Increase protein intake: bring to 2 g/kg/day (158 g/day)",
                "Add thoracic mobility and shoulder stretching to the warm-up",
            ],
            obiettivi=[
                Obiettivo(
                    obiettivo_code="OBJ-1",
                    obiettivo_nome="Build muscle mass",
                    scadenza_target="2026-09-03",
                    progresso_score=0.45,
                    step_obiettivo=[
                        StepObiettivo(element="Progressive training stimulus",
                                      description="Load and volume progression over time",
                                      status="plateau",
                                      notes="Bench plateau — to solve with a technical variation",
                                      source_refs=[log3]),
                        StepObiettivo(element="Adequate protein intake",
                                      description="2 g/kg/day for optimal protein synthesis",
                                      status="non_avviato",
                                      notes="Not verified — Marco doesn't track his diet",
                                      source_refs=[]),
                        StepObiettivo(element="Adequate recovery",
                                      description="3 sessions/week + 7-8h sleep",
                                      status="raggiunto",
                                      notes="Confirmed — respects rest days",
                                      source_refs=[log4]),
                    ],
                    strategie=[],
                    notes="Partial progression. Act on nutrition and bench technical variation.",
                    source_refs=[log1],
                ),
            ],
            approcci=[
                ApproccioAllenamento(
                    title="Undulating periodisation on the chest",
                    obiettivo_ref="OBJ-1",
                    tipo="periodizzazione",
                    priority="primary",
                    description="Alternate strength weeks (4×5, 85% 1RM) and hypertrophy weeks (4×10, 65%). Break the adaptation.",
                    strengths=["Alternating neural and metabolic stimulus", "Reduces shoulder overload risk"],
                    risks=["Requires precise planning", "Marco may lose motivation with lighter weights"],
                    dati_necessari=["Verified current bench 1RM"],
                    source_refs=[],
                ),
                ApproccioAllenamento(
                    title="Nutritional optimisation",
                    obiettivo_ref="OBJ-1",
                    tipo="nutrizione",
                    priority="secondary",
                    description="2-week food tracking. Target: 158 g protein/day.",
                    strengths=["Low risk", "High impact if the cause is nutritional"],
                    risks=["Marco may not want to track"],
                    dati_necessari=["3-day typical food diary"],
                    source_refs=[],
                ),
            ],
            limitazioni_fisiche=[
                LimitazioneFisica(
                    title="Right shoulder — injury risk",
                    issue_type="infortunio",
                    severity="significant",
                    description="Old 2019 dislocation. Occasional pain on flat bench with heavy load. Follow-up ultrasound not done.",
                    fonte="Sports history — session 3",
                    raccomandazione="Physiatrist sign-off before exceeding 70 kg on bench. Alternative: incline dumbbell + paused reps.",
                    source_refs=[anamnesi],
                ),
            ],
            valutazioni_aderenza=[
                ValutazioneAderenza(
                    nome="Flat bench — plateau",
                    role="cliente",
                    affidabilita_score=0.45,
                    dichiarazione_chiave="67.5 kg × 4 — unchanged for 8 weeks. Fifth rep impossible.",
                    strengths=["Objective, measurable data"],
                    vulnerabilities=["May be technical, not strength", "Limiting shoulder"],
                    domande_approfondimento=["Test paused reps", "Test close grip"],
                    source_refs=[log3],
                ),
                ValutazioneAderenza(
                    nome="Squat and deadlift — progression",
                    role="expert",
                    affidabilita_score=0.82,
                    dichiarazione_chiave="Squat 80→95 kg, deadlift 90→105 kg in 3 months. Steady progression.",
                    strengths=["Confirms positive response to training"],
                    vulnerabilities=[],
                    domande_approfondimento=[],
                    source_refs=[log3, log4],
                ),
            ],
            bilancio=BilancioProgressi(
                progresso_score=0.60,
                autonomia_score=0.70,
                progressi_chiave=["Squat +15 kg", "Deadlift +15 kg", "Session compliance 12/12 (100%)"],
                fattori_favorevoli=["Positive response to compound lifts", "High motivation"],
                critical_gaps=["Missing nutritional monitoring", "Right-shoulder ultrasound not done"],
                valutazione_generale="Athlete with excellent compliance and a positive response to compound lifts. Isolated bench plateau, solvable with a technical variation and nutrition. No signs of overtraining.",
            ),
            nota_cliente="Marco Bianchi, 35. 12 sessions in 3 months, 100% compliance. Excellent progression on squat and deadlift. Isolated bench plateau, likely technical/nutritional.",
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# DEMO CLIENT 2 — Giulia Esposito (weight loss, 28)
# ─────────────────────────────────────────────────────────────────────────────

def build_demo_case_2_en() -> CaseAnalysis:
    log_g = ref("giulia-log.txt", "Weight 68.5 kg (-3.5 kg). Excellent compliance. HIIT cardio 3×/week.", 0.88, "giulia-4")

    return CaseAnalysis(
        case_id="giulia-esposito",
        case_title="Giulia Esposito",
        language="en",
        case_summary="28 years old. Goal: weight loss (-8 kg). Level: beginner. 8 sessions in 2 months. Motivation: wedding in October 2026.",
        materials=[
            Material(id="mat-g1", name="History and goals", kind="text",
                     content="Giulia Esposito, 28. No known conditions. Sedentary. Goal: lose weight for her wedding in October 2026. Starting weight 72 kg, BF 28%."),
        ],
        timeline=[
            TimelineEvent(date="2026-04-01", title="Session 1 — Assessment",
                          description="Weight 72 kg, BF 28%. Bodyweight circuit. Low cardio endurance.",
                          source_refs=[], confidence=0.90),
            TimelineEvent(date="2026-04-15", title="2-week measurement",
                          description="Weight 70.8 kg (-1.2 kg). Good motivation.",
                          source_refs=[], confidence=0.88),
            TimelineEvent(date="2026-05-01", title="Session 5 — HIIT introduced",
                          description="Introduced 20-min HIIT. Positive response, no pain.",
                          source_refs=[log_g], confidence=0.89),
            TimelineEvent(date="2026-05-20", title="2-month measurement",
                          description="Weight 68.5 kg (-3.5 kg). Waist -4 cm. Increased energy.",
                          source_refs=[log_g], confidence=0.91),
        ],
        people=[
            Person(name="Giulia Esposito", role="cliente",
                   notes="28, Naples. Very high motivation — wedding in October.", source_refs=[]),
        ],
        evidence=[
            EvidenceItem(title="Body weight",
                         status="confirmed",
                         notes="72 kg → 68.5 kg in 2 months. -3.5 kg. On target.",
                         source_refs=[log_g]),
            EvidenceItem(title="Waist circumference",
                         status="confirmed",
                         notes="82 cm → 78 cm in 2 months. Excellent.",
                         source_refs=[log_g]),
            EvidenceItem(title="Cardiovascular endurance",
                         status="confirmed",
                         notes="Significantly improved. 20-min HIIT with no issues.",
                         source_refs=[log_g]),
        ],
        open_questions=[
            OpenQuestion(question="Is she following the 1500 kcal meal plan?",
                         why_it_matters="The calorie deficit is essential for weight loss",
                         source_refs=[]),
        ],
        missing_documents=[],
        contradictions=[],
        procedural_deadlines=[
            Appuntamento(title="Session — Full body circuit",
                         due_date="2026-06-03", due_time="09:00",
                         deadline_type="sessione_pt", status="needs_review",
                         urgency="media",
                         description="Increase HIIT intensity to 25 min.",
                         source_refs=[]),
            Appuntamento(title="Monthly measurement — 3 months",
                         due_date="2026-07-01", due_time="09:00",
                         deadline_type="check_in", status="needs_review",
                         urgency="media",
                         description="Progress photos. Target: 66 kg.",
                         source_refs=[]),
        ],
        brief_markdown="""## Giulia Esposito — Quick notes
- 28, Naples, part-time
- Goal: -8 kg by October (wedding)
- Excellent motivation, perfect compliance
- Watch out: tends to do extreme fasting on weekends

## Current status
- -3.5 kg in 2 months ✓
- HIIT introduced and well tolerated ✓
- October target achievable at the current pace ✓""",
        usage_estimate=UsageEstimate(pages=1, audio_minutes=0, flash_input_tokens=3200,
                                     flash_output_tokens=900, pro_used=False),
        analisi_progressi=AnalisiProgressi(
            livello_attenzione="low",
            sommario="Excellent progression. Client on track with the weight-loss target. Excellent compliance. October wedding as strong motivation.",
            azioni_immediate=[
                "Continue the current plan — no urgent changes",
                "Monitor that she doesn't do extreme weekend fasting",
                "Introduce 1 strength session every 2 weeks to preserve muscle mass",
            ],
            obiettivi=[
                Obiettivo(
                    obiettivo_code="OBJ-1",
                    obiettivo_nome="Weight loss",
                    scadenza_target="2026-10-01",
                    progresso_score=0.78,
                    step_obiettivo=[
                        StepObiettivo(element="Calorie deficit", description="1500 kcal/day",
                                      status="raggiunto", notes="Weight loss confirmed", source_refs=[log_g]),
                        StepObiettivo(element="Regular training", description="3 sessions/week",
                                      status="raggiunto", notes="100% compliance", source_refs=[log_g]),
                    ],
                    strategie=[],
                    notes="Excellent progression. Continue the current plan.",
                    source_refs=[],
                ),
            ],
            approcci=[
                ApproccioAllenamento(
                    title="Introduce strength to preserve mass",
                    obiettivo_ref="OBJ-1",
                    tipo="periodizzazione",
                    priority="primary",
                    description="Add 1 strength session/week to prevent muscle-mass loss during weight loss.",
                    strengths=["Higher basal metabolism", "Toned body for the wedding"],
                    risks=["Might scare her — communicate the rationale well"],
                    dati_necessari=[],
                    source_refs=[],
                ),
            ],
            limitazioni_fisiche=[],
            valutazioni_aderenza=[
                ValutazioneAderenza(
                    nome="Weight loss — progression",
                    role="cliente",
                    affidabilita_score=0.78,
                    dichiarazione_chiave="72 kg → 68.5 kg in 2 months. -3.5 kg. -8 kg target by October achievable.",
                    strengths=["Objective data", "Steady pace"],
                    vulnerabilities=["Possible plateau in the second half"],
                    domande_approfondimento=["Monitor every 2 weeks", "Adjust diet if plateau"],
                    source_refs=[log_g],
                ),
            ],
            bilancio=BilancioProgressi(
                progresso_score=0.78,
                autonomia_score=0.80,
                progressi_chiave=["-3.5 kg in 2 months", "Waist -4 cm", "100% compliance"],
                fattori_favorevoli=["Strong motivation (wedding)", "Positive response to HIIT"],
                critical_gaps=["Precise body composition (DEXA)"],
                valutazione_generale="Excellent trajectory. Very motivated client, excellent compliance. Continue the plan with no substantial changes.",
            ),
            nota_cliente="Giulia Esposito, 28. Weight loss in progress. -3.5 kg in 2 months, on target. Very high motivation (October wedding). No issues.",
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# DEMO CLIENT 3 — Luca Ferrara (marathon, 42, knee injury)
# ─────────────────────────────────────────────────────────────────────────────

def build_demo_case_3_en() -> CaseAnalysis:
    log_l1 = ref("luca-log.txt", "Estimated VO2max 42 ml/kg/min. Goal: marathon under 4h.", 0.88, "luca-1")
    log_l2 = ref("luca-log.txt", "Left knee pain after the 25 km long run. 2-week stop.", 0.90, "luca-3")

    return CaseAnalysis(
        case_id="luca-ferrara",
        case_title="Luca Ferrara",
        language="en",
        case_summary="42 years old. Goal: Rome marathon under 4h. Amateur runner. Stopped for a left-knee injury. 6 sessions in 6 weeks.",
        materials=[
            Material(id="mat-l1", name="Marathon training plan", kind="text",
                     content="16-week plan. Sub-4h goal. VO2max 42. Typical week: 3 runs + 1 cross-training. WARNING: forced stop in week 6 for the knee."),
        ],
        timeline=[
            TimelineEvent(date="2026-04-15", title="Session 1 — Runner assessment",
                          description="Estimated VO2max 42. Current average pace: 5'45\"/km. Race goal: 5'41\"/km (sub-4h).",
                          source_refs=[log_l1], confidence=0.88),
            TimelineEvent(date="2026-04-29", title="Session 3 — 25 km long run",
                          description="Completed but left-knee pain around km 22. Warning sign.",
                          source_refs=[log_l2], confidence=0.90),
            TimelineEvent(date="2026-05-13", title="Session 5 — Return after stop",
                          description="Back after a 2-week stop. Knee ok on short distances (< 10 km). Cautious.",
                          source_refs=[log_l2], confidence=0.87),
        ],
        people=[
            Person(name="Luca Ferrara", role="cliente",
                   notes="42, Milan. Manager, high stress. Rome marathon, 22 September 2026.", source_refs=[]),
            Person(name="Dr. Mancini", role="fisioterapista",
                   notes="Treated the knee during the stop.", source_refs=[log_l2]),
        ],
        evidence=[
            EvidenceItem(title="Race pace",
                         status="partial",
                         notes="Current 5'45\"/km. Sub-4h target: 5'41\"/km. Minimal margin.",
                         source_refs=[log_l1]),
            EvidenceItem(title="Left knee",
                         status="plateau",
                         notes="Pain at km 22 of the 25 km long run. 2-week stop. Physiotherapist consulted.",
                         source_refs=[log_l2]),
            EvidenceItem(title="Weekly volume",
                         status="partial",
                         notes="Target: 60-70 km/week. Current post-stop: 35 km. To rebuild gradually.",
                         source_refs=[]),
        ],
        open_questions=[
            OpenQuestion(question="Does the knee hold up on long runs over 20 km?",
                         why_it_matters="Decisive for the marathon preparation strategy",
                         source_refs=[log_l2]),
            OpenQuestion(question="Does he have the physiotherapist's ok to increase mileage?",
                         why_it_matters="Don't resume progression without medical clearance",
                         source_refs=[log_l2]),
        ],
        missing_documents=[
            MissingDocument(title="Physiotherapist report on the left knee",
                            reason="Needed to plan the mileage build-back",
                            priority="alta"),
        ],
        contradictions=[
            Contradiction(title="Knee injury 6 weeks before the race",
                          description="A forced 2-week stop cut 2 key long runs. The current volume (35 km/week) is too low to race sub-4h safely.",
                          source_refs=[log_l2]),
        ],
        procedural_deadlines=[
            Appuntamento(title="18 km test long run",
                         due_date="2026-06-07", due_time="07:00",
                         deadline_type="sessione_pt", status="needs_review",
                         urgency="alta",
                         description="Test the knee at an intermediate distance. Stop if pain.",
                         source_refs=[]),
            Appuntamento(title="Marathon go/no-go assessment",
                         due_date="2026-09-10", due_time="10:00",
                         deadline_type="check_in", status="candidate",
                         urgency="alta",
                         description="Final decision whether to run the Rome marathon or postpone.",
                         source_refs=[]),
            Appuntamento(title="Rome Marathon",
                         due_date="2026-09-22", due_time="08:00",
                         deadline_type="gara", status="candidate",
                         urgency="media",
                         description="Goal: sub-4h. Conditional on the knee's recovery.",
                         source_refs=[]),
        ],
        brief_markdown="""## Luca Ferrara — Quick notes
- 42, Milan, manager. High stress.
- Goal: Rome marathon, 22 September, sub-4h
- **WARNING**: left knee — 2-week stop
- Don't increase volume without the physiotherapist's ok

## Critical situation
- Lost 2 key weeks of preparation
- Current volume 35 km/week vs target 60-70 km
- 6 weeks to the race — go/no-go decision by September

## Aria's recommendation
Consider an alternative marathon in November 2026 if the knee doesn't fully recover by July.""",
        usage_estimate=UsageEstimate(pages=2, audio_minutes=0, flash_input_tokens=4100,
                                     flash_output_tokens=1200, pro_used=False),
        analisi_progressi=AnalisiProgressi(
            livello_attenzione="high",
            sommario="Knee injury 6 weeks before the Rome marathon. Current volume (35 km/week) insufficient to race safely. Critical go/no-go decision by September.",
            azioni_immediate=[
                "Get the physiotherapist's report before increasing mileage",
                "18 km test long run as the first durability indicator",
                "Plan scenario B: November 2026 marathon if the knee doesn't recover",
                "Reduce non-sport stress — recovery compromised by high workload",
            ],
            obiettivi=[
                Obiettivo(
                    obiettivo_code="OBJ-1",
                    obiettivo_nome="Sub-4h Rome marathon",
                    scadenza_target="2026-09-22",
                    progresso_score=0.35,
                    step_obiettivo=[
                        StepObiettivo(element="Healthy knee",
                                      description="Ability to run over 20 km without pain",
                                      status="plateau",
                                      notes="Recent injury — to verify with a gradual test",
                                      source_refs=[log_l2]),
                        StepObiettivo(element="Weekly volume 60-70 km",
                                      description="Aerobic base sufficient for sub-4h",
                                      status="non_avviato",
                                      notes="Currently 35 km/week after the stop — to rebuild",
                                      source_refs=[]),
                        StepObiettivo(element="Very long runs > 30 km",
                                      description="At least 2 long runs of 30+ km in preparation",
                                      status="non_avviato",
                                      notes="The stop wiped out 2 key long runs",
                                      source_refs=[log_l2]),
                    ],
                    strategie=[],
                    notes="Goal at risk. Consider postponing to November.",
                    source_refs=[log_l1],
                ),
            ],
            approcci=[
                ApproccioAllenamento(
                    title="Recovery + gradual return",
                    obiettivo_ref="OBJ-1",
                    tipo="recupero",
                    priority="primary",
                    description="Increase volume by 10% per week. Test long run every 2 weeks. Immediate stop if pain.",
                    strengths=["Conservative, reduces relapse risk"],
                    risks=["Volume may not reach 60 km before the race"],
                    dati_necessari=["Physiotherapist ok", "18 km test long run ok"],
                    source_refs=[],
                ),
                ApproccioAllenamento(
                    title="Scenario B — November marathon",
                    obiettivo_ref="OBJ-1",
                    tipo="altro",
                    priority="fallback",
                    description="If the knee doesn't hold: postpone to a November 2026 marathon.",
                    strengths=["Eliminates serious-injury risk", "Better preparation"],
                    risks=["Client disappointment — communicate in advance"],
                    dati_necessari=[],
                    source_refs=[],
                ),
            ],
            limitazioni_fisiche=[
                LimitazioneFisica(
                    title="Left knee — serious injury risk",
                    issue_type="infortunio",
                    severity="critical",
                    description="Knee pain during the 25 km long run. 2-week stop. Physiotherapist report not yet available.",
                    fonte="Session 3 log — 29/04/2026",
                    raccomandazione="No volume increase without the physiotherapist's ok. Progressive long runs: 18 km → 22 km → 27 km.",
                    source_refs=[log_l2],
                ),
            ],
            valutazioni_aderenza=[
                ValutazioneAderenza(
                    nome="Left knee",
                    role="fisioterapista",
                    affidabilita_score=0.72,
                    dichiarazione_chiave="Pain at km 22 of the 25 km long run. Forced 2-week stop.",
                    strengths=["Documented event"],
                    vulnerabilities=["May have healed with physiotherapy"],
                    domande_approfondimento=["18 km test", "22 km test", "Physiotherapist report"],
                    source_refs=[log_l2],
                ),
                ValutazioneAderenza(
                    nome="Aerobic base",
                    role="expert",
                    affidabilita_score=0.55,
                    dichiarazione_chiave="VO2max 42 — good aerobic base. With full preparation the sub-4h target is achievable.",
                    strengths=["Objective data"],
                    vulnerabilities=["Incomplete preparation"],
                    domande_approfondimento=["10 km pace test post-stop"],
                    source_refs=[log_l1],
                ),
            ],
            bilancio=BilancioProgressi(
                progresso_score=0.35,
                autonomia_score=0.45,
                progressi_chiave=["VO2max 42 — good base", "High motivation", "Physiotherapy in progress"],
                fattori_favorevoli=["Experienced runner", "Solid aerobic structure"],
                critical_gaps=["Physiotherapist report", "18 km test long run", "Knee response > 20 km"],
                valutazione_generale="Critical situation for the September goal. The go/no-go decision depends on the knee's recovery over the next 4 weeks. Prepare plan B (November) to avoid losing the season.",
            ),
            nota_cliente="Luca Ferrara, 42. Rome marathon on 22 September at risk due to a knee injury. Insufficient volume. Consider postponing to November.",
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Registry (English)
# ─────────────────────────────────────────────────────────────────────────────

def build_all_en() -> dict[str, CaseAnalysis]:
    cases = [build_demo_case_en(), build_demo_case_2_en(), build_demo_case_3_en()]
    return {c.case_id: c for c in cases}
