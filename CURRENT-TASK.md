# CURRENT-TASK.md — SchedaPRO

Last updated: 2026-05-28

---

## Stato corrente

**Branch:** `main`  
**Ultimo commit:** Slice B+C+D+E — domain cleanup completo

### Cosa è stato fatto

| Slice | Stato | Descrizione |
|---|---|---|
| A — Git + Docs | ✅ | `CLAUDE.md`, `AGENTS.md`, `SOUL.md`, `CURRENT-TASK.md` creati |
| B — Backend schema fitness | ✅ | `models.py` riscritto (AnalisiProgressi, Obiettivo, Appuntamento, ecc.) |
| B — Backend ai_service | ✅ | `_ANALYSIS_SCHEMA` fitness, titolo API, CORS aggiornato |
| B — Backend main.py | ✅ | `title="SchedaPRO API"`, health endpoint aggiornato |
| C — Frontend types.ts | ✅ | Tutti i tipi legali → fitness (AnalisiProgressi, Obiettivo, Appuntamento…) |
| C — AriaPromptBar | ✅ | `GiuliaPromptBar.tsx` → `AriaPromptBar.tsx`, CSS `aria-prompt-*` |
| C — sprExport.ts | ✅ | Nuovo file `.spr` (era `.plt`), tutte le funzioni aggiornate |
| C — CaseDetailView.tsx | ✅ | Sweep completo: LegalAnalysisTab → AnalisiProgressiTab, tutti i campi rinominati |
| C — main.tsx | ✅ | Import aggiornati, `charge_summary` → `obiettivi_summary`, AriaPromptBar |
| C — caseContext.ts | ✅ | `buildCaseContext()` usa campi fitness |
| C — caseMerge.ts | ✅ | `mergeWithAi()` usa `analisi_progressi` |
| C — MultiFileUploadDrawer | ✅ | `fascicolo/giurisprudenza` → `scheda/documento_medico` |
| C — styles.css | ✅ | `.aria-prompt-*` CSS aggiunto in parallelo a `.giulia-prompt-*` |
| Build TypeScript | ✅ | `npm run build` → zero errori |

---

## Next steps (backlog immediato)

### Slice F — Demo + verifica end-to-end

- [ ] Backend: `uvicorn app.main:app --reload --port 8001` → `/api/health` risponde 200
- [ ] Frontend: `VITE_BYPASS_AUTH=true npm run dev -- --port 5174` → dashboard clienti
- [ ] Crea cliente "Marco Bianchi", aggiungi log sessione, analizza
- [ ] Verifica che Aria generi `analisi_progressi` con `obiettivi`, `approcci`, ecc.
- [ ] Testa export `.spr` (sia plain che protetto)
- [ ] Testa `AriaPromptBar` in home e in scheda cliente

### Slice G — Prompts audit

- [ ] Revedi `backend/app/ai_service.py` → `_SYSTEM_PROMPT`: è già Aria fitness?
- [ ] Rivedi `_ANALYSIS_SCHEMA`: i field name corrispondono esattamente ai modelli Pydantic?
- [ ] Rivedi `frontend/src/prompts/aria.ts` (ex `giulia.ts`): esiste ancora `giulia.ts` o è già rinominato?

### Slice H — Cleanup residuo

- [ ] Rimuovi `pltExport.ts` se non serve più (o tienilo per backward compat import)
- [ ] Rimuovi `prompts/documentDrafts.ts` se non è più importato da nessuno
- [ ] Rimuovi `components/GiuliaPromptBar.tsx` se non serve più
- [ ] Verifica backend tests: `python -m pytest tests/ -q`

### Backlog post-demo

- [ ] Auth Supabase
- [ ] Deploy: Render (backend) + Netlify (frontend)
- [ ] Onboarding flow (primo accesso trainer)
- [ ] Demo seed `marco-bianchi-seed.js`
- [ ] `documentDrafts.ts` legale → rimuovi o sostituisci con fitness placeholder

---

## Architettura attuale

```
/home/deckard/projects/schedapro/
  backend/     FastAPI, porta 8001
  frontend/    React+Vite, porta 5174
  demo/        Seed data (marco-bianchi-seed.js)
```

Backend deploy: Render (non ancora configurato)  
Frontend deploy: Netlify (non ancora configurato)  
PLT sibling: `/home/deckard/plt/alpha-pwa/` — non toccare
