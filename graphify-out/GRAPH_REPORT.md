# Graph Report - .  (2026-06-27)

## Corpus Check
- 5 files · ~116,768 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 882 nodes · 1963 edges · 64 communities (53 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.63)
- Token cost: 59,160 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend Main & UploadExport|Backend Main & Upload/Export]]
- [[_COMMUNITY_Demo Data (ITEN)|Demo Data (IT/EN)]]
- [[_COMMUNITY_App Lock (PINBiometria)|App Lock (PIN/Biometria)]]
- [[_COMMUNITY_Case Domain Model & Merge|Case Domain Model & Merge]]
- [[_COMMUNITY_Background Analysis Manager|Background Analysis Manager]]
- [[_COMMUNITY_AI Service & Aria Docs Hub|AI Service & Aria Docs Hub]]
- [[_COMMUNITY_AI Provider Routing|AI Provider Routing]]
- [[_COMMUNITY_Account, Profile & Chat UI|Account, Profile & Chat UI]]
- [[_COMMUNITY_Aria Bar, Drafts & Redaction|Aria Bar, Drafts & Redaction]]
- [[_COMMUNITY_Drafting Workspace & Plans|Drafting Workspace & Plans]]
- [[_COMMUNITY_NPM Dependencies|NPM Dependencies]]
- [[_COMMUNITY_Onboarding Wizard|Onboarding Wizard]]
- [[_COMMUNITY_Case Detail Hooks & Helpers|Case Detail Hooks & Helpers]]
- [[_COMMUNITY_Aria Setup & Personalization|Aria Setup & Personalization]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Help, Storage & Value Hints|Help, Storage & Value Hints]]
- [[_COMMUNITY_SPR Export Encryption|SPR Export Encryption]]
- [[_COMMUNITY_Settings Units & Prefs Store|Settings Units & Prefs Store]]
- [[_COMMUNITY_Validation & Product Soul|Validation & Product Soul]]
- [[_COMMUNITY_Legal-to-Fitness Vocabulary Cleanup|Legal-to-Fitness Vocabulary Cleanup]]
- [[_COMMUNITY_Auth & Account Controls|Auth & Account Controls]]
- [[_COMMUNITY_Nightshift Theme Redesign|Nightshift Theme Redesign]]
- [[_COMMUNITY_Value Panels & Messaging|Value Panels & Messaging]]
- [[_COMMUNITY_PWA Manifest|PWA Manifest]]
- [[_COMMUNITY_Settings Page & Prefs|Settings Page & Prefs]]
- [[_COMMUNITY_App Lock Test Harness|App Lock Test Harness]]
- [[_COMMUNITY_i18n Catalogs (ITEN)|i18n Catalogs (IT/EN)]]
- [[_COMMUNITY_AI Instructions Modal|AI Instructions Modal]]
- [[_COMMUNITY_Mock API  Demo Data|Mock API / Demo Data]]
- [[_COMMUNITY_Theme Module|Theme Module]]
- [[_COMMUNITY_Analyze Endpoint Contract|Analyze Endpoint Contract]]
- [[_COMMUNITY_Android Instrumented Tests|Android Instrumented Tests]]
- [[_COMMUNITY_Analysis Jobs Tests|Analysis Jobs Tests]]
- [[_COMMUNITY_Session Expiry|Session Expiry]]
- [[_COMMUNITY_Redaction Engine|Redaction Engine]]
- [[_COMMUNITY_Auth Onboarding Check|Auth Onboarding Check]]
- [[_COMMUNITY_Deploy Targets (VercelNetlify)|Deploy Targets (Vercel/Netlify)]]
- [[_COMMUNITY_Backend Deploy & AI Deps|Backend Deploy & AI Deps]]
- [[_COMMUNITY_Settings Prefs Check|Settings Prefs Check]]
- [[_COMMUNITY_Value Messaging Check|Value Messaging Check]]
- [[_COMMUNITY_Value Intro Content|Value Intro Content]]
- [[_COMMUNITY_Value Cadence Check|Value Cadence Check]]
- [[_COMMUNITY_Android MainActivity|Android MainActivity]]
- [[_COMMUNITY_Draft Workspace UI Check|Draft Workspace UI Check]]
- [[_COMMUNITY_Session Expiry Check|Session Expiry Check]]
- [[_COMMUNITY_No-FOUC Theme Script|No-FOUC Theme Script]]
- [[_COMMUNITY_Render Backend Deploy|Render Backend Deploy]]
- [[_COMMUNITY_AGENTS.md Instructions|AGENTS.md Instructions]]
- [[_COMMUNITY_Onboarding Spotlight Wizard|Onboarding Spotlight Wizard]]
- [[_COMMUNITY_OpenAI Client (DeepSeek)|OpenAI Client (DeepSeek)]]
- [[_COMMUNITY_Value Messaging Harness|Value Messaging Harness]]

## God Nodes (most connected - your core abstractions)
1. `useT()` - 61 edges
2. `t()` - 59 edges
3. `userKey()` - 28 edges
4. `OcrInput` - 24 edges
5. `build_demo_case()` - 23 edges
6. `build_demo_case_3()` - 21 edges
7. `build_demo_case_en()` - 21 edges
8. `build_demo_case_3_en()` - 21 edges
9. `build_demo_case_2()` - 18 edges
10. `build_demo_case_2_en()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Perceived Value / Willingness to Pay (validation metric)` --semantically_similar_to--> `Feature Smell Tests`  [INFERRED] [semantically similar]
  05-validation/session-notes-template.md → SOUL.md
- `sprExport.ts (.spr encrypted export)` --semantically_similar_to--> `domain/redaction.ts anonymization`  [INFERRED] [semantically similar]
  CLAUDE.md → README.md
- `_lang_directive (AI output language routing)` --implements--> `backend/app/ai_service.py`  [INFERRED]
  CURRENT-TASK.md → CLAUDE.md
- `ocr_adapter.py (Mistral OCR)` --conceptually_related_to--> `backend/app/ai_service.py`  [INFERRED]
  README.md → CLAUDE.md
- `value/personalization.ts combineAriaInstructions()` --shares_data_with--> `backend/app/ai_service.py`  [INFERRED]
  README.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Resilient background analysis flow** — readme_analysis_manager, readme_analyze_jobs_endpoint, claude_ai_service, claude_case_merge [EXTRACTED 0.85]
- **Bilingual IT/EN system** — current_task_i18n, current_task_lang_directive, current_task_demo_data_en, current_task_settings_store [EXTRACTED 0.85]
- **Deploy topology: Vercel + Render (Netlify abandoned)** — readme_vercel_deploy, readme_render_deploy, current_task_netlify_abandoned [EXTRACTED 0.85]

## Communities (64 total, 11 thin omitted)

### Community 0 - "Backend Main & Upload/Export"
Cohesion: 0.06
Nodes (61): ABC, Any, _add_inline(), _archive_upload_response(), BriefExportRequest, create_analysis_job(), export_brief(), _extract_docx_from_path() (+53 more)

### Community 1 - "Demo Data (IT/EN)"
Cohesion: 0.13
Nodes (50): _build_all(), build_demo_case(), build_demo_case_2(), build_demo_case_3(), build_all_en(), build_demo_case_2_en(), build_demo_case_3_en(), build_demo_case_en() (+42 more)

### Community 2 - "App Lock (PIN/Biometria)"
Cohesion: 0.12
Nodes (38): bumpConfig(), cfgKey(), clearLock(), constantTimeEqual(), disableBiometric(), dismissSetup(), emit(), fromB64() (+30 more)

### Community 3 - "Case Domain Model & Merge"
Cohesion: 0.08
Nodes (38): runningAnalysisCount(), useAnalysisTick(), caseAnalysisToSummary(), buildUserContextMaterial(), AnalisiProgressi, ApproccioAllenamento, Appuntamento, BilancioProgressi (+30 more)

### Community 4 - "Background Analysis Manager"
Cohesion: 0.09
Nodes (38): abortAnalysis(), AnalysisState, AnalysisStatus, clearState(), clearTimer(), dismissAnalysis(), emit(), finalize() (+30 more)

### Community 5 - "AI Service & Aria Docs Hub"
Cohesion: 0.06
Nodes (41): CLAUDE.md / AGENTS.md byte-identical mirror, backend/app/ai_service.py, Anthropic (fallback AI provider), Aria (AI persona), prompts/aria.ts SYSTEM_PROMPT_IT, domain/caseContext.ts buildCaseContext(), screens/CaseDetailView.tsx, domain/caseMerge.ts mergeWithAi() (+33 more)

### Community 6 - "AI Provider Routing"
Cohesion: 0.10
Nodes (37): _analysis_prompt_policy(), analyze_case(), _anthropic_complete(), _anthropic_stream(), _build_analysis_user_message(), _deepseek_complete(), _deepseek_stream(), _flash_model() (+29 more)

### Community 7 - "Account, Profile & Chat UI"
Cohesion: 0.10
Nodes (29): AccountControls(), ProfileDrawer(), requestLogout(), AriaPromptBar(), ChatDrawer(), FabRestoreButton(), FloatingChatButton(), t() (+21 more)

### Community 8 - "Aria Bar, Drafts & Redaction"
Cohesion: 0.07
Nodes (16): Props, UserProfile, wizardBus, PIANO_PROMPTS, REDACT_APPLY_PROMPT(), REDACT_DETECT_PROMPT(), AnonModal(), markdownToLines() (+8 more)

### Community 9 - "Drafting Workspace & Plans"
Cohesion: 0.08
Nodes (35): buildCaseContext(), DraftingWorkspace(), baseCase, first, flagged, html, md, nextPriorityPrompt (+27 more)

### Community 10 - "NPM Dependencies"
Cohesion: 0.06
Nodes (31): dependencies, @capacitor/android, @capacitor/cli, @capacitor/core, lucide-react, react, react-dom, @supabase/supabase-js (+23 more)

### Community 11 - "Onboarding Wizard"
Cohesion: 0.11
Nodes (17): Hole, OnboardingWizard(), Screen, Step, STEPS, tooltipStyle(), dismissOnboarding(), Handler (+9 more)

### Community 12 - "Case Detail Hooks & Helpers"
Cohesion: 0.17
Nodes (19): useAnalysisState(), riskColor(), riskIcon(), riskLabel(), currentLocale(), renderRich(), AnalisiProgressiTab(), AulaModeOverlay() (+11 more)

### Community 13 - "Aria Setup & Personalization"
Cohesion: 0.18
Nodes (17): hasCompleteAriaSetup(), Props, PanelModal(), AriaFocusPreset, AriaSetup, buildTrainerPreferenceInstructions(), combineAriaInstructions(), daysSince() (+9 more)

### Community 14 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+11 more)

### Community 15 - "Help, Storage & Value Hints"
Cohesion: 0.26
Nodes (14): HelpSection(), setStorageUser(), userKey(), InfoPanelModal(), areSuggestionsEnabled(), clearLoginOptOuts(), getLastShown(), isOptedOut() (+6 more)

### Community 16 - "SPR Export Encryption"
Cohesion: 0.21
Nodes (16): caseData, encryptedText, plain, assertSupportedContainer(), base64ToBytes(), bytesToBase64(), decryptSprContainer(), deriveAesKey() (+8 more)

### Community 17 - "Settings Units & Prefs Store"
Cohesion: 0.20
Nodes (12): AriaSection(), Seg(), UnitsSection(), formatLength(), formatWeight(), AppPrefs, DEFAULT_PREFS, getPrefs() (+4 more)

### Community 18 - "Validation & Product Soul"
Cohesion: 0.20
Nodes (12): Session Notes Template (Tester Validation), Perceived Value / Willingness to Pay (validation metric), Cold Start Warm-up (~30-50s first access), Tester Outreach Messages, Reviewer Demo Account (App Access), Google Play Store Closed Testing Copy + Prep, 12 Testers / 14 Days Play Production Requirement, Aria — AI Coach Specialist (+4 more)

### Community 19 - "Legal-to-Fitness Vocabulary Cleanup"
Cohesion: 0.17
Nodes (12): Aula Mode to Vista Sessione rename, Dead legal code in draftArtifacts, DEMO_REPLY offline legal copy, Legal Icons in UI (Gavel/Scale/ShieldAlert), Legal Leakage Copy Audit, Backend Pro-recommendation legal keys, Legal-reading schema names (procedural_deadlines/evidence), Procedural Deadlines Implementation Plan (+4 more)

### Community 20 - "Auth & Account Controls"
Cohesion: 0.18
Nodes (12): AccountControls (Profilo + Logout), analysisManager.ts frontend job manager, App-lock (PIN + biometria), Auth state fixes (dev bypass, refresh, signup), AuthHelp non-blocking helper, Background analysis jobs, Disclaimer with mandatory checkbox, Port-back-to-PLT changelog (+4 more)

### Community 21 - "Nightshift Theme Redesign"
Cohesion: 0.23
Nodes (12): personalization.ts saved Aria setup, overlayGate.ts deadlock fix, heroMetric helper in personalization.ts, No-FOUC pre-paint theme script, Nightshift Redesign Implementation Plan, theme.ts get/set/resolve + applyTheme, Theme toggle in Profile drawer, tokens.css dual-theme rewrite (+4 more)

### Community 22 - "Value Panels & Messaging"
Cohesion: 0.24
Nodes (12): Cadence + opt-out helpers (shouldShowHourly), FirstRunWizard sequential first-run, InfoPanelModal contextual panel, PanelModal reusable shell, Logout escape button on PIN LockScreen, Value Panels rev2 Implementation Plan, Anti-corny voice rules, Message backbone / positioning (+4 more)

### Community 23 - "PWA Manifest"
Cohesion: 0.17
Nodes (11): background_color, categories, description, display, icons, lang, name, orientation (+3 more)

### Community 24 - "Settings Page & Prefs"
Cohesion: 0.22
Nodes (11): Per-user local data namespaces (userStorage.ts), format.ts formatWeight/formatLength, LockManager extracted to own file, Settings Page Implementation Plan, Settings sections (Account/Profilo/Aspetto/Aria/Unità/Privacy/Dati/Aiuto/Info), SettingsScreen page shell, settingsStore.ts AppPrefs store, Apply-immediately persistence model (+3 more)

### Community 25 - "App Lock Test Harness"
Cohesion: 0.18
Nodes (10): cfg, gate, lockManager, lockMod, main, privacy, raw, screen (+2 more)

### Community 26 - "i18n Catalogs (IT/EN)"
Cohesion: 0.31
Nodes (7): en, Catalog, CATALOGS, interpolate(), Params, translate(), it

### Community 27 - "AI Instructions Modal"
Cohesion: 0.31
Nodes (7): AiInstructionsModal(), AiInstructionsRequest, MultiFileUploadDrawer(), ARIA_FOCUS_PRESETS, ariaSetupLabels(), focusInstruction(), focusLabel()

### Community 28 - "Mock API / Demo Data"
Cohesion: 0.25
Nodes (6): CaseAnalysis, CaseSummary, demoData, installMockApi(), makeAnalyzedCase(), pickFirstCase()

### Community 29 - "Theme Module"
Cohesion: 0.39
Nodes (7): AppearanceSection(), applyTheme(), getThemeChoice(), ResolvedTheme, resolveTheme(), setThemeChoice(), ThemeChoice

### Community 30 - "Analyze Endpoint Contract"
Cohesion: 0.25
Nodes (8): POST /api/analyze-text endpoint, CaseAnalysis Pydantic Contract, DeepSeek Flash-first routing, Alpha PWA Scaffold (Option B), Source-ref grounding mandate, Pre-flight istruzioni per Aria modal, Non-destructive Ri-analizza, AnalyzeRequest.user_instructions field

### Community 31 - "Android Instrumented Tests"
Cohesion: 0.36
Nodes (4): ExampleInstrumentedTest, ExampleUnitTest, RunWith, Test

### Community 33 - "Analysis Jobs Tests"
Cohesion: 0.52
Nodes (5): _fake_result(), _poll(), _request_body(), test_analysis_job_runs_in_background_and_returns_result(), test_analysis_job_surfaces_errors()

### Community 34 - "Session Expiry"
Cohesion: 0.53
Nodes (5): clearAcceptance(), ensureAcceptanceTs(), isSessionExpired(), readTs(), recordAcceptance()

### Community 35 - "Redaction Engine"
Cohesion: 0.47
Nodes (5): applyRedactionToCase(), mergeRedactionRules(), redactObj(), redactString(), RedactionRule

### Community 36 - "Auth Onboarding Check"
Cohesion: 0.33
Nodes (5): checks, __dirname, failed, src, supabaseClient

### Community 37 - "Deploy Targets (Vercel/Netlify)"
Cohesion: 0.40
Nodes (5): Netlify (abandoned deploy target), Capacitor Android wrapper, Nightshift design system (dark/Daylight themes), React 19 + Vite 6 frontend (Vercel), Vercel deploy (nightshift-ruby.vercel.app)

### Community 38 - "Backend Deploy & AI Deps"
Cohesion: 0.40
Nodes (5): render.yaml — Backend Deploy Config, anthropic (AI fallback dependency), fastapi, groq (Whisper STT), mistralai (OCR)

### Community 40 - "Value Messaging Check"
Cohesion: 0.40
Nodes (3): checks, __dirname, failed

### Community 41 - "Value Intro Content"
Cohesion: 0.70
Nodes (5): AriaCapabilities shared value content, ContextualHint one-time inline hint, Value Messaging Implementation Plan, seen.ts one-time flags + suggestions toggle, ValueIntroModal first-launch modal

## Knowledge Gaps
- **190 isolated node(s):** `version`, `dev`, `build`, `preview`, `test:auth-onboarding` (+185 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useT()` connect `Account, Profile & Chat UI` to `App Lock (PIN/Biometria)`, `Case Domain Model & Merge`, `Background Analysis Manager`, `Aria Bar, Drafts & Redaction`, `Onboarding Wizard`, `Case Detail Hooks & Helpers`, `Aria Setup & Personalization`, `Help, Storage & Value Hints`, `Settings Units & Prefs Store`, `i18n Catalogs (IT/EN)`, `AI Instructions Modal`, `Theme Module`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `t()` connect `Account, Profile & Chat UI` to `App Lock (PIN/Biometria)`, `Case Domain Model & Merge`, `Background Analysis Manager`, `Aria Bar, Drafts & Redaction`, `Drafting Workspace & Plans`, `Onboarding Wizard`, `Case Detail Hooks & Helpers`, `Aria Setup & Personalization`, `Help, Storage & Value Hints`, `Settings Units & Prefs Store`, `i18n Catalogs (IT/EN)`, `AI Instructions Modal`, `Theme Module`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `userKey()` connect `Help, Storage & Value Hints` to `Background Analysis Manager`, `Onboarding Wizard`, `Aria Setup & Personalization`, `Settings Units & Prefs Store`, `Theme Module`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `OcrInput` (e.g. with `BriefExportRequest` and `MistralOcrAdapter`) actually correct?**
  _`OcrInput` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `A strong, explicit output-language instruction for the model.      The JSON keys`, `Truncate material texts to stay within a total character budget.      Longest ma`, `Assemble the analysis user prompt from (truncated) materials + request.      Ext` to the rest of the system?**
  _232 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Main & Upload/Export` be split into smaller, more focused modules?**
  _Cohesion score 0.06151742993848257 - nodes in this community are weakly interconnected._
- **Should `Demo Data (IT/EN)` be split into smaller, more focused modules?**
  _Cohesion score 0.13167636171337915 - nodes in this community are weakly interconnected._