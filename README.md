# Digital Trainer · SchedaPRO

> **Trasforma il caos della scheda cliente in un piano chiaro.**

Coach AI mobile-first per personal trainer freelance italiani. Aria — l'assistente AI di
SchedaPRO — ascolta i log delle sessioni, legge le misurazioni, trova i plateau e genera la
scheda della settimana. Il trainer verifica, personalizza, consegna. **Tutto ciò che genera
Aria è una bozza: l'ultima parola è sempre del professionista.**

| | |
|---|---|
| **App live** | https://digitaltrainer.netlify.app |
| **Repo** | `chiantera/schedapro` |
| **Frontend** | React 19 + Vite 6 + TypeScript → Netlify |
| **Backend** | FastAPI (Python) → Render |
| **Auth** | Supabase (progetto condiviso `plt-alpha`) |
| **Persistenza** | IndexedDB locale (i dati cliente restano sul dispositivo) |
| **Wrapper mobile** | Capacitor (Android) |

---

## Cos'è (e cosa non è)

SchedaPRO è per il **personal trainer freelance** (5–30 clienti) che oggi gestisce i clienti su
carta, Note, WhatsApp o Excel. Sostituisce l'amministrazione, non il coaching.

**Non è:** un'app per il cliente finale, un sostituto del medico/fisioterapista, un tool per
catene di palestre, né "Trainerize in italiano". È un'AI che conosce il tuo cliente.

Aria rimanda **sempre** ai professionisti sanitari per qualsiasi aspetto di salute, non inventa
misurazioni o progressi, e cita la fonte di ogni affermazione. Vedi [`SOUL.md`](SOUL.md).

---

## Funzionalità principali

- **Schede cliente intelligenti** — sessioni, progressi, misurazioni e obiettivi in un'unica scheda.
- **Analisi AI con fonti** — Aria estrae progressi, plateau e raccomandazioni; ogni dato rimanda al log o alla misurazione originale.
- **Analisi in background resiliente** — l'analisi gira come job sul server e sopravvive a navigazione, lock del telefono e refresh; al rientro vedi progresso o risultati.
- **Istruzioni per Aria** — prima di un'analisi o di una bozza puoi aggiungere istruzioni facoltative che orientano la risposta (modale pre-flight).
- **Piani generati dall'AI** — schede settimanali/mensili personalizzate, da verificare e consegnare.
- **Chat con Aria** — assistente che conosce la scheda del cliente attiva.
- **Dettatura vocale** — note a fine allenamento parlate; trascrizione automatica (Groq Whisper).
- **Appuntamenti** — sessioni, check-in, gare e visite in un calendario chiaro.
- **Anonimizzazione** — sostituisci nomi reali con pseudonimi prima di inviare contenuti all'AI.
- **Export `.spr` cifrato** — backup portabile della scheda; i dati restano del trainer.
- **Configurazione Aria** — wizard al primo accesso (specializzazioni, formato bozze, tono); modificabile in qualsiasi momento dal Profilo. Le preferenze alimentano ogni analisi e bozza via `combineAriaInstructions()`.
- **Focus di Aria** — preset di focus (prevenzione infortuni, plateau, aderenza…) selezionabili nel modale pre-analisi; combinati con le istruzioni libere del trainer.
- **Spazio lavoro user-scoped** — ogni chiave localStorage è sotto `spr:{userId}:*`; due trainer sullo stesso dispositivo non condividono dati, setup o stato chat.
- **Onboarding guidato** — wizard spotlight al primo accesso (mostra i passi "dentro il drawer" solo quando il drawer è aperto) + pannello guida sulla login page.
- **Blocco con PIN** — PIN a 4 cifre (+ sblocco biometrico opzionale via WebAuthn) che protegge i dati locali; richiesto all'apertura e dopo inattività. Recupero via re-login.

---

## Struttura del codebase

```text
schedapro/
├── backend/                       FastAPI · deploy Render (root dir: backend)
│   └── app/
│       ├── main.py                Route API: health, cases, analyze-text,
│       │                          analyze-jobs (background), chat, upload,
│       │                          fetch-url, transcribe, export-brief
│       ├── ai_service.py          Routing provider, policy Flash/Pro, schema analisi fitness
│       ├── models.py              Contratti Pydantic (CaseAnalysis, AnalyzeJob*, …)
│       ├── ocr_adapter.py         Boundary OCR (Mistral)
│       ├── ocr_models.py          Modelli OCR
│       ├── demo_data.py           Seed demo (3 clienti: Marco, Giulia, Luca)
│       └── tests/                 Contract test pytest (31/31)
│
├── frontend/                      React + Vite · deploy Netlify
│   ├── src/
│   │   ├── main.tsx               Shell React, App, AuthScreen + AuthTour, routing schermate
│   │   ├── config.ts              Config runtime (API URL, flag)
│   │   ├── supabaseClient.ts      Client Supabase condiviso (auth)
│   │   ├── db.ts                  Persistenza IndexedDB
│   │   ├── sprExport.ts           Export/import file `.spr` (plain + cifrato)
│   │   ├── draftArtifacts.ts      Wrapper bozze + buildDraftPrompt()
│   │   ├── dateUtils.ts           Formattazione date
│   │   ├── tokens.css             Design token (dark + bordeaux)
│   │   ├── styles.css             UI mobile-first
│   │   ├── domain/
│   │   │   ├── types.ts           Tipi condivisi (AnalisiProgressi, Obiettivo, Appuntamento…)
│   │   │   ├── caseContext.ts     buildCaseContext() / materiale utente per l'AI
│   │   │   ├── caseMerge.ts       Merge AI (analisi_progressi)
│   │   │   ├── redaction.ts       Helper anonimizzazione
│   │   │   └── helpers.tsx        Utility UI di dominio
│   │   ├── prompts/
│   │   │   ├── aria.ts            Persona/system prompt di Aria
│   │   │   ├── pianoDrafts.ts     PIANO_PROMPTS (schede di allenamento)
│   │   │   └── redaction.ts       Prompt rileva/applica anonimizzazione
│   │   ├── components/
│   │   │   ├── AccountControls.tsx     Profilo + logout rapido + gestione blocco PIN/biometria
│   │   │   ├── AiInstructionsModal.tsx Modale pre-flight "istruzioni per Aria"
│   │   │   ├── AriaPromptBar.tsx       Barra prompt Aria (home + scheda)
│   │   │   ├── ChatPanel.tsx           Chat drawer + FAB
│   │   │   └── MultiFileUploadDrawer.tsx  Caricamento materiale
│   │   ├── screens/
│   │   │   └── CaseDetailView.tsx  Dettaglio scheda cliente (lazy)
│   │   ├── analysis/
│   │   │   ├── analysisManager.ts  Job analisi a livello app (poll, resume, merge)
│   │   │   ├── AnalysisProgressBanner.tsx  Banner analisi non-bloccante + abort
│   │   │   └── analysis-progress.css
│   │   ├── lock/                  App-lock (PIN + biometria opzionale)
│   │   │   ├── appLock.ts          Stato lock + PIN PBKDF2 + WebAuthn + idle/recupero
│   │   │   ├── LockGate.tsx        Cancello: setup → sblocco → app
│   │   │   ├── LockScreen.tsx      Tastierino PIN 4 cifre + sblocco biometrico
│   │   │   ├── LockSetup.tsx       Prompt "proteggi con PIN" + PinSetForm
│   │   │   └── lock.css
│   │   ├── auth/
│   │   │   └── sessionExpiry.ts    TTL sessione 72h (ri-accettazione avviso, auto-logout)
│   │   ├── storage/
│   │   │   └── userStorage.ts      Namespace localStorage per userId (spr:{id}:*)
│   │   ├── value/                 Comunicazione del valore di Aria
│   │   │   ├── seen.ts             Flag "già visto" + toggle suggerimenti + cadenza oraria/opt-out
│   │   │   ├── personalization.ts  Setup Aria (specializzazioni, formato, tono) + focus preset
│   │   │   ├── AriaCapabilities.tsx  Contenuto valore condiviso (wizard + Profilo)
│   │   │   ├── PanelModal.tsx        Shell visiva riusabile (clic sul backdrop = chiude)
│   │   │   ├── FirstRunWizard.tsx    Wizard setup Aria (editMode per modifica da Profilo)
│   │   │   ├── InfoPanelModal.tsx    Pannello contestuale in-app
│   │   │   ├── ContextualHint.tsx    Hint contestuali una-tantum
│   │   │   ├── overlayGate.ts        Mette in pausa il tour mentre un pannello è aperto
│   │   │   └── value.css
│   │   ├── onboarding/            Modulo wizard spotlight portabile
│   │   │   ├── OnboardingWizard.tsx
│   │   │   ├── wizardBus.ts
│   │   │   └── onboarding.css
│   │   └── data/mockApi.ts        Mock API per dev/test
│   ├── scripts/                   Test script Node (check-*.mjs)
│   ├── android/                   Wrapper Capacitor
│   └── package.json
│
├── demo/marco-bianchi-seed.js     Seed demo lato frontend
├── docs/                          Note di implementazione e audit copy
├── render.yaml                    Config deploy backend (Render)
├── netlify.toml                   Config deploy frontend (Netlify)
├── CLAUDE.md / AGENTS.md          Istruzioni agente (sincronizzate)
├── CURRENT-TASK.md                Handoff e backlog correnti
└── SOUL.md                        Filosofia di prodotto e smell test
```

---

## API backend (FastAPI)

| Metodo | Endpoint | Scopo |
|---|---|---|
| GET  | `/api/health` | Health check |
| GET  | `/api/cases` | Elenco schede |
| GET  | `/api/cases/{case_id}` | Dettaglio scheda |
| GET  | `/api/demo-case` | Scheda demo |
| POST | `/api/analyze-text` | Analisi AI sincrona del materiale (Flash/Pro) |
| POST | `/api/analyze-jobs` | Avvia un'analisi in background → `job_id` |
| GET  | `/api/analyze-jobs/{job_id}` | Stato/risultato del job (polling) |
| POST | `/api/chat` | Chat Aria (streaming) |
| POST | `/api/upload` | Upload + OCR documenti |
| POST | `/api/fetch-url` | Importa contenuto da URL |
| POST | `/api/transcribe` | Trascrizione note vocali |
| POST | `/api/export-brief` | Export sintesi scheda |

Docs interattive: `/docs` sul backend.

---

## Sviluppo locale

### Backend (porta 8409)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
ALLOWED_ORIGINS=http://localhost:5409 uvicorn app.main:app --host 127.0.0.1 --port 8409
```

### Frontend (porta 5409)

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8409 VITE_BYPASS_AUTH=true npm run dev -- --port 5409
```

`VITE_BYPASS_AUTH=true` salta Supabase in locale (solo localhost). I build deployati usano Supabase.

---

## Verifica

**Backend**

```bash
cd backend && source .venv/bin/activate && python -m pytest tests/ -q
```

**Frontend**

```bash
cd frontend
npm run build                # tsc -b && vite build
npm run test:spr-export
npm run test:local-case-scope
npm run test:draft-workspace
npm run test:draft-workspace-ui
npm run test:auth-onboarding
npm run test:app-lock
npm run test:session-expiry
npm run test:value-messaging
npm run test:value-cadence
```

---

## Deploy

- **Frontend → Netlify:** `netlify deploy --dir=dist --prod` (config in `netlify.toml`).
- **Backend → Render:** redeploy automatico su push a `main` (config in `render.yaml`).

---

## Variabili d'ambiente

I segreti **non** sono nel repo (`.env` è in `.gitignore`; committa solo `.env.example`).

- Backend: chiavi provider AI, OCR (Mistral), STT (Groq), `ALLOWED_ORIGINS`, env `SPR_*`.
- Frontend: `VITE_API_URL`, credenziali Supabase, `VITE_BYPASS_AUTH` (solo dev).

---

## Privacy & guardrail

- I dati cliente vivono in IndexedDB **sul dispositivo**; all'AI va solo ciò che il trainer sceglie.
- OCR (Mistral), STT (Groq) e le chiamate LLM sono superfici di trasferimento dati esterne: trattarle come tali.
- Aria produce **bozze verificabili**, mai decisioni. Per la salute rimanda sempre a un professionista sanitario.
- Usa "Anonimizza" per mascherare i dati; preferisci pseudonimi per i nomi reali dei clienti.

---

*Prodotto gemello (dominio legale): PLT — `/home/deckard/projects/plt/alpha-pwa/` — non toccare.*
