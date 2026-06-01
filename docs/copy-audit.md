# Copy & domain-leakage audit — Digital Trainer (2026-06-01)

Deep audit of the fitness app (fork of the legal PLT). Persona/tabs/types are
already fitness; what remains is **legal leakage** (icons, "Aula Mode", demo
text, some prompts/schema keys) and **placeholder/awkward copy**. Prioritized,
with `file:line` (approx — re-grep) and suggested fix. Execute after the reset.

## P0 — Legal icons in the UI (most jarring) — `Gavel` / `Scale` / `ShieldAlert`
Replace with fitness lucide icons (Dumbbell, Activity, TrendingUp, Target, HeartPulse, ClipboardList) and trim the imports.
- `screens/CaseDetailView.tsx`: hero topline `Gavel` (~2134); "Vista sessione" buttons `Gavel` (~2224, ~2718); Aula overlay `Gavel` (~486); "Obiettivi e progressi" `Scale` (~715); "Bilancio progressi" `Scale` (~985); "Limitazioni fisiche" `ShieldAlert` (~870) → `HeartPulse`; drafting cards `Scale`/`ShieldAlert` (~1068/1069). Trim import (~L5–6).
- `components/ChatPanel.tsx`: quick-actions `Scale` (~61) + `ShieldAlert` (~62); trim import (~L3).
- `components/MultiFileUploadDrawer.tsx`: medical tab `Scale` (~138) + drop-zone `Scale` (~191) → `HeartPulse`/`FileText`; trim import (~L4).
- `main.tsx`: remove dead imports `Scale, ShieldAlert, ShieldOff` (~L7; keep `ShieldCheck`).
- `domain/helpers.tsx`: `riskIcon()` ShieldOff/Alert/Check (~L13–15) → AlertTriangle/AlertCircle/CheckCircle2 (optional).

## P1 — "Aula Mode" (courtroom) → "Vista/Modalità Sessione"  · `screens/CaseDetailView.tsx`
- Visible `AULA MODE` (~486) → `VISTA SESSIONE`. Slide `01 — Il caso` (~500) → `Il cliente`. `Prossima udienza / scadenza` (~504) → `Prossimo appuntamento / scadenza`. `03 — Contraddizioni da usare` (~538) → `Incongruenze da chiarire`. Tooltip `Apri una nuova bozza di preparazione udienza` (~2275) → `Prepara una bozza per questo appuntamento`. Draft prompt body "priorità difensive/atti…" (~2282) → training-prep language.
- `styles.css`: `.aula-witness-prosecution/-defense/-neutral` (~916–918) likely dead/mismatched vs fitness roles — verify/rename or drop. (`.aula-*` other classes can stay internal.)

## P1 — Offline demo reply is fully legal · `data/mockApi.ts` (~L69, 89–101)
Rewrite DEMO_REPLY: `fascicolo`→`scheda`, `accuse/strategie difensive/testimoni`→`obiettivi/approcci/valutazioni di aderenza`, `Analisi legale`→`Analisi AI`, `Aula Mode`→`Vista Sessione`, `memorie/ricorsi/eccezioni`→`piani/schede/report`, `Nuovo fascicolo`→`Nuova scheda`.

## P1 — Upload drawer legal placeholders · `components/MultiFileUploadDrawer.tsx`
- URL placeholder `…/sentenza…` (~149) → `…/articolo…`. Label example `Cass. Pen. sez. I n. 1234/2023` (~159) → `Referto visita ortopedica 03/2026`. Medical-tab textarea label `Testo della sentenza` (~262) → `Testo del documento`. Privacy note exposes `source_ref` (~203) → `…può citarli come fonte…`.

## P1 — "fascicolo" leftover in visible strings
- `screens/CaseDetailView.tsx`: `← Torna ai fascicoli` (~2100) → `← Torna ai clienti`; rule titles "tutti i fascicoli" (~1175, ~1180) → `tutte le schede`; empty-state `Clicca una card viola in "Analisi legale"…` (~1372) → reference the "Genera con Aria" box; `Workspace redazione atti` (~1371) → `Bozze e piani`.
- `draftArtifacts.ts`: `DRAFT_PLAINTEXT_EXPORT_WARNING` says `.plt` + "fascicolo" (~60) → `.spr` + "scheda"; privacy line "del fascicolo" (~154) → "della scheda".

## P1 — Backend Pro-recommendation legal keys · `backend/app/ai_service.py`
- `serious_charge` (~171, used ~205) → `high_attention_level`; `custody_or_precautionary_measure` (~172, used ~212) → `physical_contraindication` (Italian labels already fitness). Docstring "lawyer-anxiety moments" (~185) → high-stakes coaching moments.

## P1 — Placeholder dev tooltips (≈20+) — replace each with a real action
- `title="Esegui azione"`, `title="Azione secondaria"`, `title="Conferma operazione principale"`, `title="Azione rapida sul documento"`, `title="Esegui prompt rapido"` across `CaseDetailView.tsx` (430, 493, 1185, 1196, 1202, 1223, 1225, 1335, 2199, 2296, 2430, 2560, 2714–2717) `main.tsx` (111, 350, 361, 556) `ChatPanel.tsx` (93). Use verb-phrases (e.g. "Elimina questo documento", "Crea la scheda cliente", "Importa una scheda .spr", "Analizza i documenti con l'AI").

## P2 — Terminology consistency & don't-leak-infra
- Unify: `documenti`↔`materiali`; `contraddizioni`↔`incongruenze` (chat already says "incongruenza"); `Analizza con AI`↔`Avvia Analisi AI`; `Note trainer`↔`Note del trainer`.
- Don't expose infra: `Backend non raggiungibile` (main ~477), `Sto svegliando il server` (main ~613), `Chunk` (CaseDetailView ~392) → user-friendly wording.
- Plurals: replace `elemento/i`, `errore/i` slash-forms (drawer ~313/315) with proper singular/plural.
- Dashes: `--` → em dash `—` (auth headline main ~334–342).
- `Fallback` (CaseDetailView ~666) → `Ripiego`. Disclaimer "formatori e superiori" (main ~368) → "la tua formazione professionale" (self-employed PT).

## P2 — Schema names that read legal (cosmetic, leak into JSON) · backend
- `procedural_deadlines`/`deadline_type` → `appuntamenti`/`tipo_appuntamento` (models.py ~91–93, 254; ai_service schema ~103, instructions ~317; demo_data ~129/328/484/649). Larger refactor.
- `EvidenceItem`/`evidence` → optional `MetricaItem`/`metriche`.

## P2 — Dead legal code · `draftArtifacts.ts`
- `DraftArtifactType` still includes `memoria|cassazione|eccezione|crossExam|strategy|witnessCrossExam` (~L1); `DRAFT_PRECEDENT_GUARDRAIL` (~47–58) all legal; `DRAFT_LABELS` legal entries (~62–68); Cassazione warning (~248). Fitness UI only uses 5 fitness keys — prune the legal entries (confirm no path emits them into Aria prompts).

## Confirmed clean (no action)
Persona = Aria; tabs fitness; domain types fitness (`analisi_progressi`, `obiettivi`, roles cliente/medico/fisio/nutrizionista); `prompts/aria.ts`/`pianoDrafts.ts`/`redaction.ts` fitness; demo cases fitness (the demo client "Giulia Esposito" is a real client name, not the old persona); `.spr` export; Anonimizza/Redigi guardrail respected; auth intro + disclaimer + Aria empty-state copy are the strongest existing copy (use as tone reference).
