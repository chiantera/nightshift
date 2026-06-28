# Graph Report - .  (2026-06-27)

## Corpus Check
- 165 files · ~123,138 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 963 nodes · 2142 edges · 71 communities (57 shown, 14 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.55)
- Token cost: 60,074 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Demo Data (ITEN)|Demo Data (IT/EN)]]
- [[_COMMUNITY_Case Domain & Analysis Hooks|Case Domain & Analysis Hooks]]
- [[_COMMUNITY_App Lock (PINBiometria)|App Lock (PIN/Biometria)]]
- [[_COMMUNITY_Case Detail & Plan Prompts|Case Detail & Plan Prompts]]
- [[_COMMUNITY_Drafting Workspace|Drafting Workspace]]
- [[_COMMUNITY_AI Service & Provider Chain|AI Service & Provider Chain]]
- [[_COMMUNITY_Account, Profile & Chat UI|Account, Profile & Chat UI]]
- [[_COMMUNITY_OCR Adapters|OCR Adapters]]
- [[_COMMUNITY_Agent Docs & Architecture Hub|Agent Docs & Architecture Hub]]
- [[_COMMUNITY_NPM Dependencies|NPM Dependencies]]
- [[_COMMUNITY_Backend Main & UploadExtract|Backend Main & Upload/Extract]]
- [[_COMMUNITY_Maxx Entitlement Service|Maxx Entitlement Service]]
- [[_COMMUNITY_First-Run Wizard & Overlay|First-Run Wizard & Overlay]]
- [[_COMMUNITY_Background Analysis Manager|Background Analysis Manager]]
- [[_COMMUNITY_Stripe Connect Service|Stripe Connect Service]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Help, Storage & Value Hints|Help, Storage & Value Hints]]
- [[_COMMUNITY_i18n Catalogs (ITEN)|i18n Catalogs (IT/EN)]]
- [[_COMMUNITY_Local Storage & Data Section|Local Storage & Data Section]]
- [[_COMMUNITY_SPR Export Encryption|SPR Export Encryption]]
- [[_COMMUNITY_Settings Units & Prefs|Settings Units & Prefs]]
- [[_COMMUNITY_Backend Endpoints (chatcheckoutconnect)|Backend Endpoints (chat/checkout/connect)]]
- [[_COMMUNITY_Onboarding Wizard|Onboarding Wizard]]
- [[_COMMUNITY_Validation & Product Soul|Validation & Product Soul]]
- [[_COMMUNITY_Legal-to-Fitness Cleanup|Legal-to-Fitness Cleanup]]
- [[_COMMUNITY_Auth & Account Controls|Auth & Account Controls]]
- [[_COMMUNITY_Nightshift Theme Redesign|Nightshift Theme Redesign]]
- [[_COMMUNITY_Value Panels & Messaging|Value Panels & Messaging]]
- [[_COMMUNITY_PWA Manifest|PWA Manifest]]
- [[_COMMUNITY_Stripe Maxx Checkout Service|Stripe Maxx Checkout Service]]
- [[_COMMUNITY_Settings Page & Prefs Store|Settings Page & Prefs Store]]
- [[_COMMUNITY_App Lock Test Harness|App Lock Test Harness]]
- [[_COMMUNITY_Connect Tests|Connect Tests]]
- [[_COMMUNITY_AI Instructions Modal|AI Instructions Modal]]
- [[_COMMUNITY_Mock API  Demo Data|Mock API / Demo Data]]
- [[_COMMUNITY_Theme Module|Theme Module]]
- [[_COMMUNITY_Analyze Endpoint Contract|Analyze Endpoint Contract]]
- [[_COMMUNITY_Date Formatters|Date Formatters]]
- [[_COMMUNITY_Android Instrumented Tests|Android Instrumented Tests]]
- [[_COMMUNITY_Provider Fallback Tests|Provider Fallback Tests]]
- [[_COMMUNITY_Analysis Jobs Tests|Analysis Jobs Tests]]
- [[_COMMUNITY_Checkout Tests|Checkout Tests]]
- [[_COMMUNITY_Session Expiry|Session Expiry]]
- [[_COMMUNITY_Redaction Engine|Redaction Engine]]
- [[_COMMUNITY_Auth Onboarding Check|Auth Onboarding Check]]
- [[_COMMUNITY_Settings Prefs Check|Settings Prefs Check]]
- [[_COMMUNITY_Value Messaging Check|Value Messaging Check]]
- [[_COMMUNITY_Value Intro Content|Value Intro Content]]
- [[_COMMUNITY_Value Cadence Check|Value Cadence Check]]
- [[_COMMUNITY_Android MainActivity|Android MainActivity]]
- [[_COMMUNITY_Analysis Progress Banner|Analysis Progress Banner]]
- [[_COMMUNITY_Draft Workspace UI Check|Draft Workspace UI Check]]
- [[_COMMUNITY_Session Expiry Check|Session Expiry Check]]
- [[_COMMUNITY_OCR Block Model|OCR Block Model]]
- [[_COMMUNITY_No-FOUC Theme Script|No-FOUC Theme Script]]
- [[_COMMUNITY_OCR Upload Test|OCR Upload Test]]
- [[_COMMUNITY_Render Deploy Config|Render Deploy Config]]
- [[_COMMUNITY_Value Messaging Harness|Value Messaging Harness]]

## God Nodes (most connected - your core abstractions)
1. `useT()` - 65 edges
2. `t()` - 61 edges
3. `userKey()` - 28 edges
4. `OcrInput` - 26 edges
5. `build_demo_case()` - 23 edges
6. `build_demo_case_3()` - 21 edges
7. `build_demo_case_en()` - 21 edges
8. `build_demo_case_3_en()` - 21 edges
9. `build_demo_case_2()` - 18 edges
10. `build_demo_case_2_en()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Perceived Value / Willingness to Pay (validation metric)` --semantically_similar_to--> `Feature Smell Tests`  [INFERRED] [semantically similar]
  05-validation/session-notes-template.md → SOUL.md
- `Groq Whisper (speech-to-text)` --semantically_similar_to--> `Mistral (AI provider + OCR)`  [INFERRED] [semantically similar]
  README.md → CLAUDE.md
- `App-lock (PIN + WebAuthn biometrics)` --semantically_similar_to--> `72h forced logout / session expiry`  [INFERRED] [semantically similar]
  README.md → CURRENT-TASK.md
- `backend/requirements.txt` --references--> `DeepSeek (AI provider, default)`  [INFERRED]
  backend/requirements.txt → CLAUDE.md
- `Tester Outreach Messages` --references--> `Aria — AI Coach Specialist`  [INFERRED]
  05-validation/tester-outreach.md → SOUL.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Play Store Closed Testing Launch Flow** — 06_brand_play_store_testing_copy_twelve_testers, 06_brand_play_store_testing_copy_demo_account, 05_validation_tester_outreach_doc [INFERRED 0.75]
- **Product Soul: Mission, Target Trainer, Aria** — soul_md_mission, soul_md_target_trainer, soul_md_aria [INFERRED 0.80]
- **Value panel system (rev2)** — plans_2026_06_03_value_panels_rev2_panel_modal, plans_2026_06_03_value_panels_rev2_first_run_wizard, plans_2026_06_03_value_panels_rev2_info_panel_modal, plans_2026_06_03_value_panels_rev2_cadence_helpers, plans_2026_06_03_value_panels_rev2_overlay_gate [EXTRACTED 1.00]
- **Nightshift theme foundation** — plans_2026_06_06_nightshift_redesign_tokens, plans_2026_06_06_nightshift_redesign_theme_module, plans_2026_06_06_nightshift_redesign_no_fouc, plans_2026_06_06_nightshift_redesign_theme_toggle [EXTRACTED 1.00]
- **Settings prefs to display pipeline** — plans_2026_06_08_settings_page_settings_store, plans_2026_06_08_settings_page_format_helpers, specs_2026_06_08_settings_page_design_canonical_storage [EXTRACTED 1.00]
- **AI provider fallback chain DeepSeek→Mistral→z.ai→Anthropic** — concept_deepseek, concept_mistral, concept_zai, concept_anthropic [EXTRACTED 1.00]
- **Stripe payments + Connect + webhook + Supabase tables** — concept_stripe, concept_stripe_connect, concept_stripe_webhook, concept_maxx_members_table, concept_trainer_connect_table [EXTRACTED 1.00]
- **Deploy topology: Vercel frontend + Render backend + Supabase** — concept_vercel, concept_render, concept_supabase, concept_react_frontend, concept_fastapi_backend [EXTRACTED 1.00]

## Communities (71 total, 14 thin omitted)

### Community 0 - "Demo Data (IT/EN)"
Cohesion: 0.13
Nodes (50): _build_all(), build_demo_case(), build_demo_case_2(), build_demo_case_3(), build_all_en(), build_demo_case_2_en(), build_demo_case_3_en(), build_demo_case_en() (+42 more)

### Community 1 - "Case Domain & Analysis Hooks"
Cohesion: 0.06
Nodes (43): runningAnalysisCount(), useAnalysisTick(), caseAnalysisToSummary(), buildUserContextMaterial(), AnalisiProgressi, ApproccioAllenamento, Appuntamento, BilancioProgressi (+35 more)

### Community 2 - "App Lock (PIN/Biometria)"
Cohesion: 0.12
Nodes (38): bumpConfig(), cfgKey(), clearLock(), constantTimeEqual(), disableBiometric(), dismissSetup(), emit(), fromB64() (+30 more)

### Community 3 - "Case Detail & Plan Prompts"
Cohesion: 0.08
Nodes (20): useAnalysisState(), riskColor(), riskIcon(), riskLabel(), PIANO_PROMPTS, AnalisiProgressiTab(), AnonModal(), AulaModeOverlay() (+12 more)

### Community 4 - "Drafting Workspace"
Cohesion: 0.07
Nodes (36): buildCaseContext(), DraftingWorkspace(), baseCase, first, flagged, html, md, nextPriorityPrompt (+28 more)

### Community 5 - "AI Service & Provider Chain"
Cohesion: 0.11
Nodes (34): _active_providers(), _analysis_prompt_policy(), analyze_case(), _anthropic_client(), _anthropic_complete(), _anthropic_stream(), _build_analysis_user_message(), _complete_with_fallback() (+26 more)

### Community 6 - "Account, Profile & Chat UI"
Cohesion: 0.11
Nodes (28): AccountControls(), ProfileDrawer(), requestLogout(), AriaPromptBar(), ChatDrawer(), FabRestoreButton(), FloatingChatButton(), t() (+20 more)

### Community 7 - "OCR Adapters"
Cohesion: 0.18
Nodes (23): ABC, MistralOcrAdapter, OcrAdapter, PptxAdapter, PypdfAdapter, Extract text from PPTX files using python-pptx., Stable boundary between case analysis and replaceable OCR engines., Extract text from XLSX files using openpyxl. (+15 more)

### Community 8 - "Agent Docs & Architecture Hub"
Cohesion: 0.08
Nodes (34): AGENTS.md — SchedaPRO agent instructions, backend/requirements.txt, CLAUDE.md — SchedaPRO agent instructions, AI provider fallback chain, ai_service.py (provider routing, Flash/Pro), Anthropic (AI provider, fallback), App-lock (PIN + WebAuthn biometrics), Aria (AI persona) (+26 more)

### Community 9 - "NPM Dependencies"
Cohesion: 0.06
Nodes (32): dependencies, @capacitor/android, @capacitor/cli, @capacitor/core, lucide-react, qrcode.react, react, react-dom (+24 more)

### Community 10 - "Backend Main & Upload/Extract"
Cohesion: 0.11
Nodes (24): Any, _archive_upload_response(), create_analysis_job(), _extract_docx_from_path(), _extract_pdf_or_ocr_from_path(), _extract_pptx_from_path(), _extract_text_from_path(), _extract_xlsx_from_path() (+16 more)

### Community 11 - "Maxx Entitlement Service"
Cohesion: 0.10
Nodes (19): get_membership(), grant_entitlement(), handle_stripe_event(), Maxx membership / entitlement store (Supabase `maxx_members`) + Stripe webhook., Apply a verified Stripe event to the membership store., Return {active, plan, expires_at} for the caller. active=False if no row,     no, _service_headers(), _supabase_base() (+11 more)

### Community 12 - "First-Run Wizard & Overlay"
Cohesion: 0.12
Nodes (21): FirstRunWizard(), hasCompleteAriaSetup(), Props, closeOverlay(), emit(), listeners, openOverlay(), PanelModal() (+13 more)

### Community 13 - "Background Analysis Manager"
Cohesion: 0.14
Nodes (25): abortAnalysis(), AnalysisState, AnalysisStatus, clearState(), clearTimer(), dismissAnalysis(), emit(), finalize() (+17 more)

### Community 14 - "Stripe Connect Service"
Cohesion: 0.14
Nodes (23): connect_configured(), create_onboarding_link(), create_payment_session(), get_or_create_account(), _get_row(), get_status(), get_user_id(), Stripe Connect (Express) onboarding for trainers collecting from their clients. (+15 more)

### Community 15 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+11 more)

### Community 16 - "Help, Storage & Value Hints"
Cohesion: 0.26
Nodes (14): HelpSection(), setStorageUser(), userKey(), InfoPanelModal(), areSuggestionsEnabled(), clearLoginOptOuts(), getLastShown(), isOptedOut() (+6 more)

### Community 17 - "i18n Catalogs (IT/EN)"
Cohesion: 0.17
Nodes (13): en, Catalog, CATALOGS, interpolate(), Params, renderRich(), translate(), it (+5 more)

### Community 18 - "Local Storage & Data Section"
Cohesion: 0.20
Nodes (14): db, main, DataSection(), dbClaimLegacyCases(), dbDelete(), dbGet(), dbList(), dbSave() (+6 more)

### Community 19 - "SPR Export Encryption"
Cohesion: 0.21
Nodes (16): caseData, encryptedText, plain, assertSupportedContainer(), base64ToBytes(), bytesToBase64(), decryptSprContainer(), deriveAesKey() (+8 more)

### Community 20 - "Settings Units & Prefs"
Cohesion: 0.19
Nodes (13): AriaSection(), Seg(), UnitsSection(), formatLength(), formatWeight(), AppPrefs, DEFAULT_PREFS, getPrefs() (+5 more)

### Community 21 - "Backend Endpoints (chat/checkout/connect)"
Cohesion: 0.12
Nodes (17): _add_inline(), BriefExportRequest, chat_endpoint(), connect_payment(), export_brief(), get_analysis_job(), PaymentRequest, Poll an analysis job. 404 if unknown (e.g. lost to a cold start). (+9 more)

### Community 22 - "Onboarding Wizard"
Cohesion: 0.17
Nodes (13): Hole, OnboardingWizard(), Screen, Step, STEPS, tooltipStyle(), dismissOnboarding(), Handler (+5 more)

### Community 23 - "Validation & Product Soul"
Cohesion: 0.20
Nodes (12): Session Notes Template (Tester Validation), Perceived Value / Willingness to Pay (validation metric), Cold Start Warm-up (~30-50s first access), Tester Outreach Messages, Reviewer Demo Account (App Access), Google Play Store Closed Testing Copy + Prep, 12 Testers / 14 Days Play Production Requirement, Aria — AI Coach Specialist (+4 more)

### Community 24 - "Legal-to-Fitness Cleanup"
Cohesion: 0.17
Nodes (12): Aula Mode to Vista Sessione rename, Dead legal code in draftArtifacts, DEMO_REPLY offline legal copy, Legal Icons in UI (Gavel/Scale/ShieldAlert), Legal Leakage Copy Audit, Backend Pro-recommendation legal keys, Legal-reading schema names (procedural_deadlines/evidence), Procedural Deadlines Implementation Plan (+4 more)

### Community 25 - "Auth & Account Controls"
Cohesion: 0.18
Nodes (12): AccountControls (Profilo + Logout), analysisManager.ts frontend job manager, App-lock (PIN + biometria), Auth state fixes (dev bypass, refresh, signup), AuthHelp non-blocking helper, Background analysis jobs, Disclaimer with mandatory checkbox, Port-back-to-PLT changelog (+4 more)

### Community 26 - "Nightshift Theme Redesign"
Cohesion: 0.23
Nodes (12): personalization.ts saved Aria setup, overlayGate.ts deadlock fix, heroMetric helper in personalization.ts, No-FOUC pre-paint theme script, Nightshift Redesign Implementation Plan, theme.ts get/set/resolve + applyTheme, Theme toggle in Profile drawer, tokens.css dual-theme rewrite (+4 more)

### Community 27 - "Value Panels & Messaging"
Cohesion: 0.24
Nodes (12): Cadence + opt-out helpers (shouldShowHourly), FirstRunWizard sequential first-run, InfoPanelModal contextual panel, PanelModal reusable shell, Logout escape button on PIN LockScreen, Value Panels rev2 Implementation Plan, Anti-corny voice rules, Message backbone / positioning (+4 more)

### Community 28 - "PWA Manifest"
Cohesion: 0.17
Nodes (11): background_color, categories, description, display, icons, lang, name, orientation (+3 more)

### Community 29 - "Stripe Maxx Checkout Service"
Cohesion: 0.22
Nodes (10): CheckoutRequest, create_checkout(), Create a Stripe Checkout Session for the Maxx plan and return its URL.      Retu, create_maxx_checkout_session(), _plan_config(), Stripe Checkout for the Maxx subscription.  Gated on env, like the AI provider c, True only when both the secret key and the Maxx price ID are present., Return (mode, price_id) for a plan, falling back to the standard Maxx plan. (+2 more)

### Community 30 - "Settings Page & Prefs Store"
Cohesion: 0.22
Nodes (11): Per-user local data namespaces (userStorage.ts), format.ts formatWeight/formatLength, LockManager extracted to own file, Settings Page Implementation Plan, Settings sections (Account/Profilo/Aspetto/Aria/Unità/Privacy/Dati/Aiuto/Info), SettingsScreen page shell, settingsStore.ts AppPrefs store, Apply-immediately persistence model (+3 more)

### Community 31 - "App Lock Test Harness"
Cohesion: 0.18
Nodes (10): cfg, gate, lockManager, lockMod, main, privacy, raw, screen (+2 more)

### Community 33 - "AI Instructions Modal"
Cohesion: 0.27
Nodes (8): AiInstructionsModal(), AiInstructionsRequest, MultiFileUploadDrawer(), buildPersonalizationSignals(), ARIA_FOCUS_PRESETS, ariaSetupLabels(), focusInstruction(), focusLabel()

### Community 34 - "Mock API / Demo Data"
Cohesion: 0.25
Nodes (6): CaseAnalysis, CaseSummary, demoData, installMockApi(), makeAnalyzedCase(), pickFirstCase()

### Community 35 - "Theme Module"
Cohesion: 0.39
Nodes (7): AppearanceSection(), applyTheme(), getThemeChoice(), ResolvedTheme, resolveTheme(), setThemeChoice(), ThemeChoice

### Community 36 - "Analyze Endpoint Contract"
Cohesion: 0.25
Nodes (8): POST /api/analyze-text endpoint, CaseAnalysis Pydantic Contract, DeepSeek Flash-first routing, Alpha PWA Scaffold (Option B), Source-ref grounding mandate, Pre-flight istruzioni per Aria modal, Non-destructive Ri-analizza, AnalyzeRequest.user_instructions field

### Community 37 - "Date Formatters"
Cohesion: 0.57
Nodes (6): currentLocale(), formatDate(), formatDateFull(), formatShortDate(), intlLocale(), parseIsoDateAtNoon()

### Community 38 - "Android Instrumented Tests"
Cohesion: 0.36
Nodes (4): ExampleInstrumentedTest, ExampleUnitTest, RunWith, Test

### Community 41 - "Analysis Jobs Tests"
Cohesion: 0.52
Nodes (5): _fake_result(), _poll(), _request_body(), test_analysis_job_runs_in_background_and_returns_result(), test_analysis_job_surfaces_errors()

### Community 43 - "Session Expiry"
Cohesion: 0.53
Nodes (5): clearAcceptance(), ensureAcceptanceTs(), isSessionExpired(), readTs(), recordAcceptance()

### Community 44 - "Redaction Engine"
Cohesion: 0.47
Nodes (5): applyRedactionToCase(), mergeRedactionRules(), redactObj(), redactString(), RedactionRule

### Community 45 - "Auth Onboarding Check"
Cohesion: 0.33
Nodes (5): checks, __dirname, failed, src, supabaseClient

### Community 47 - "Value Messaging Check"
Cohesion: 0.40
Nodes (3): checks, __dirname, failed

### Community 48 - "Value Intro Content"
Cohesion: 0.70
Nodes (5): AriaCapabilities shared value content, ContextualHint one-time inline hint, Value Messaging Implementation Plan, seen.ts one-time flags + suggestions toggle, ValueIntroModal first-launch modal

## Knowledge Gaps
- **183 isolated node(s):** `version`, `dev`, `build`, `preview`, `test:auth-onboarding` (+178 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useT()` connect `Account, Profile & Chat UI` to `AI Instructions Modal`, `App Lock (PIN/Biometria)`, `Case Domain & Analysis Hooks`, `Case Detail & Plan Prompts`, `Theme Module`, `First-Run Wizard & Overlay`, `Help, Storage & Value Hints`, `i18n Catalogs (IT/EN)`, `Local Storage & Data Section`, `Settings Units & Prefs`, `Onboarding Wizard`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `t()` connect `Account, Profile & Chat UI` to `AI Instructions Modal`, `App Lock (PIN/Biometria)`, `Case Detail & Plan Prompts`, `Theme Module`, `Date Formatters`, `Drafting Workspace`, `Case Domain & Analysis Hooks`, `First-Run Wizard & Overlay`, `Help, Storage & Value Hints`, `i18n Catalogs (IT/EN)`, `Local Storage & Data Section`, `Settings Units & Prefs`, `Onboarding Wizard`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `OcrInput` connect `OCR Adapters` to `Demo Data (IT/EN)`, `Backend Main & Upload/Extract`, `Stripe Maxx Checkout Service`, `Backend Endpoints (chat/checkout/connect)`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `OcrInput` (e.g. with `BriefExportRequest` and `CheckoutRequest`) actually correct?**
  _`OcrInput` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Providers (in fallback order) whose API key is present in the env.`, `A strong, explicit output-language instruction for the model.      The JSON keys`, `Truncate material texts to stay within a total character budget.      Longest ma` to the rest of the system?**
  _249 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Demo Data (IT/EN)` be split into smaller, more focused modules?**
  _Cohesion score 0.13167636171337915 - nodes in this community are weakly interconnected._
- **Should `Case Domain & Analysis Hooks` be split into smaller, more focused modules?**
  _Cohesion score 0.06485671191553545 - nodes in this community are weakly interconnected._