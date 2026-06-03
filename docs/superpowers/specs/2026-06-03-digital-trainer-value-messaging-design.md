# Design — Comunicare il valore di Digital Trainer (value messaging)

_Data: 2026-06-03 · Repo: `chiantera/schedapro` · App pubblica: **Digital Trainer** · Assistente: **Aria**_

## Problema

Al primo impatto l'app si presenta come "l'ennesimo gestionale clienti per palestra".
Feedback del primo tester (cugino, tech-savvy): _bella, user-friendly, ma ce ne sono tante così._
Il differenziatore reale — **Aria** e la profondità di personalizzazione — è invisibile finché
non lo si spiega a voce. Serve far capire **cosa fa l'app e perché è diversa** nei punti dove
l'utente la incontra, senza suonare gonfio (anti-corny).

Non è un problema del tester: è un problema di comunicazione del prodotto.

## Obiettivo

Comunicare il valore e il differenziatore su 4 superfici, ancorati a una "spina dorsale" condivisa
così tutto suona coerente. Niente claim medici, niente promesse di risultati, niente hype.

## Spina dorsale del messaggio (base di tutte le copy)

**Posizionamento (una riga):**
> Digital Trainer non tiene solo l'elenco dei tuoi clienti. Aria lavora sui dettagli reali di
> ognuno — condizioni, progressi, obiettivi — e ti prepara le bozze su cui lavori, in una
> frazione del tempo.

**Frame:** via di mezzo tra «amplifica la TUA personalizzazione» e «profondità che nessun'altra
app raggiunge». Aria propone, **il trainer decide e personalizza** — questo pattern risponde
direttamente all'obiezione del tester ("l'AI può fare solo fino a un certo punto") invece di negarla.

**Proof-point concreti (cosa fa Aria, non aggettivi):**
1. **Chiedi ad Aria qualsiasi cosa su un cliente dalla chat (FAB):** conosce già tutta la scheda,
   risponde all'istante (modello flash) con consigli e dubbi mirati su quel cliente.
2. **Istruzioni aggiuntive prima dell'analisi:** un campo libero che mandi col prompt e che
   orienta cosa Aria guarda — controllo fine sull'output prima ancora di generarlo.
3. **Adatta a condizioni mediche e limiti** del cliente (infortuni, patologie); rimanda al
   medico/fisioterapista quando serve.
4. **Legge progressi, log e misurazioni** nel tempo: individua plateau, propone deload/progressione
   sui numeri reali del cliente.
5. **Note vocali in palestra → scheda strutturata:** detti la sessione a voce, Aria la struttura.
6. **Bozze pronte da rifinire:** piano settimana, scheda mensile periodizzata (accumulo →
   intensificazione → deload), report progresso, nota nutrizionale orientativa, messaggio al
   cliente. Tutto sui dati reali della scheda — Aria non inventa, cita le fonti, tu verifichi e consegni.

**Regole di voce (anti-corny):**
- Vietate le formule «rivoluziona / il futuro del / potenzia al massimo / mai più». Frasi brevi,
  concrete, verbi d'azione.
- Sempre il pattern «Aria propone, **tu decidi e personalizzi**».
- Onestà sui limiti = vendita: la **nota nutrizionale è orientativa**, NON un piano dietetico
  medico, e rimanda a nutrizionista/dietologo. Nessuna diagnosi. Questo segnala serietà.

## Vincolo chiave: il login non torna dopo il signup

Dopo la registrazione l'utente vede solo la schermata **PIN**, mai più il login. Quindi la
sezione-valore sul login serve **solo al primo impatto / ai tester che la aprono da fresco**: il
messaggio che deve *ricorrere* va portato **dentro l'app**, non sul login.

## Le superfici

### 1. Login — sezione valore sopra il form
- File: `frontend/src/main.tsx` (auth/login view), eventuale CSS in `frontend/src/styles.css`.
- Blocco conciso **sopra** il disclaimer esistente (che resta invariato): riga di posizionamento
  + **4** proof-point in lista breve. Mobile-first, nessuna nuova schermata, nessuna route.
- Selezione dei 4 più "wow" e comprensibili a freddo (chat contestuale, bozze, voce, adatta a
  condizioni); testo asciutto, niente sovraccarico.

### 1bis. Delivery in-app del valore (perché il login non ricorre)
- **Modale valore una-tantum al primo avvio:** all'ingresso (utente autenticato, prima volta) un
  modale «cosa fa / perché è diverso» (la spina dorsale, breve). Sequenza: **prima il modale
  valore (il perché) → poi parte il tour funzionale (il come)**. Mostrato **una sola volta**,
  dismissibile, ricordato in localStorage (es. chiave `spr:value-intro-seen`). NON ripetuto.
- **Hint contestuali una-tantum** ai momenti-chiave, non bloccanti, dismissibili, "visti" persistiti:
  - vicino al **FAB di Aria** → «Chiedile qualsiasi cosa su questo cliente — conosce già la scheda»
  - sul campo **istruzioni aggiuntive** → «Scrivi qui cosa vuoi che Aria guardi»
  - sulle **bozze** dopo l'analisi → «Bozze pronte da rifinire: piano, report, messaggio cliente»
- **Punto «Cosa fa Aria» sempre raggiungibile** da menu/account: pagina/scheda che riepiloga
  capacità e differenziatore, così il messaggio resta disponibile oltre il primo accesso.
- **Interruttore globale dei suggerimenti** (Profilo): l'utente può spegnere in un colpo solo TUTTI
  i suggerimenti in-app (modale valore + hint contestuali + tour spotlight). Default ON. **Non**
  tocca la pagina di login/avvisi. Preferenza in localStorage (`spr:suggestions-enabled`); i
  componenti valore controllano questo flag prima di mostrarsi.

### 2. Tour funzionale arricchito
- File: `frontend/src/onboarding/OnboardingWizard.tsx` (STEPS), copy nei campi `title`/`body`.
- Stessa struttura e stessi step: si riscrivono i `body` perché ognuno spieghi il **perché**,
  non solo «tocca qui». Es. passo Analisi: «Qui Aria legge i dati della scheda e prepara le
  bozze — piano, report, messaggio al cliente — pronte da rifinire».
- Nessun cambiamento di logica/bus eventi.

### 3. Copy d'invito (tester)
- File: `05-validation/tester-outreach.md`.
- Aggiornare le versioni WhatsApp (completa + secca) perché guidino col differenziatore
  (proof-point) invece di «app per gestire clienti». Mantenere avviso cold-start e link Netlify.

### 4. Copy testing Google Play Store
- File nuovo: `06-brand/play-store-testing-copy.md`.
- Contenuti: titolo app, short description (≤80 char), full description, note per i tester della
  closed/internal testing, sezione "what's new". Allineati alla spina dorsale.
- Conformità Play: niente claim medici/sanitari, niente promesse di risultati, niente superlativi
  ingannevoli; la nota nutrizionale descritta come orientativa.

## Fuori scope (YAGNI)
- Welcome **screen** permanente/route post-login: niente schermata fissa ricorrente (il valore
  ricorrente vive nei hint contestuali + voce «Cosa fa Aria»). Il modale valore al primo avvio è
  invece una-tantum, non una schermata permanente — non confonderli.
- Landing/hero marketing multi-pannello (rischio "sito marketing" corny, manutenzione in alpha).
- Screenshot/asset grafici nuovi per lo Store (si decideranno a parte se servono).

## Verifica
- Login toccato → `cd frontend && npm run build` + `npm run test:auth-onboarding`.
- Tour toccato → build + eventuale check del wizard se presente.
- Copy d'invito e Store → solo markdown, nessun test.
- Aggiornare README/doc se cambia copy utente-facing rilevante (regola standing).

---

# Revisione 2 — sistema a pannelli (2026-06-03, pomeriggio)

La v1 (sopra) è spedita. Deckard vuole evolvere il primo-avvio in **più pannelli nello stile del
`ValueIntroModal`** (che gli piace), ridistribuendovi le info del welcome/avviso del login.
**Il login resta invariato** (warning box + checkbox + 72h restano lì come sono).

## Decisioni prese

- **Wizard sequenziale** al primo avvio (una panel alla volta, indicatore a pallini, Avanti/Indietro).
- **Pannello avviso con checkbox** come ultimo passo del wizard: la checkbox è **sempre obbligatoria**
  per superare il pannello — il pulsante «Iniziamo» è disabilitato finché non è spuntata (come il box
  di avviso del login). Spuntarla + «Iniziamo» chiama `recordAcceptance()` (aggiorna il timestamp 72h).
  **L'avviso ignora il toggle suggerimenti** (è gate). _(Nota: i link footer «Esci per ora»/«Non
  mostrare più» dismettono comunque il wizard senza spuntare — è un'uscita, non un "andare oltre".)_
- **Cadenza pannelli di valore:** riappaiono se `>1h` da `lastShown`. Due controlli nel footer:
  «Esci per ora» (= `lastShown` → adesso, ritorna tra ~1h) e «Non mostrare più» (= opt-out **fino al
  prossimo login**, che può essere un nuovo utente → si resetta al login). Rispettano il toggle del Profilo.
- **Pannelli contestuali in-app:** appaiono **a ogni trigger** del contesto (nessun timer), con un
  **exit** (chiudi questa volta, niente persistenza) e un **opt-out fino al prossimo login** per
  ciascun pannello (per `id`). Rispettano il toggle del Profilo. Primo caso: alla **chiusura
  dell'upload drawer dopo aver aggiunto materiale** → pannello «Ecco cosa succede ora: qui comincia
  la magia — Aria leggerà il materiale e preparerà le bozze».
- **Pagina PIN:** aggiungere un bottone **«Logout»** (signOut) sulla `LockScreen`, così chi è sulla
  schermata PIN non resta bloccato (oltre a «PIN dimenticato?» che già esiste).

## Modello "opt-out fino al login"

Gli opt-out per i pannelli si memorizzano con prefisso `spr:optout:<key>`. Al login (dove già si
chiama `recordAcceptance()`) si chiama anche `clearLoginOptOuts()` che rimuove tutte le chiavi
`spr:optout:*`. Così «Non mostrare più» dura solo fino al prossimo accesso (eventualmente di un
altro utente).

## Moduli (estensione di `src/value/`)

- **`seen.ts`** (estendere): timestamp `getLastShown(key)`/`markShown(key)`, `shouldShowHourly(key)`
  (= toggle ON && non opt-out && `now-lastShown>1h`), `optOutUntilLogin(key)`/`isOptedOut(key)`,
  `clearLoginOptOuts()`. Mantiene `isSeen/markSeen` e `areSuggestionsEnabled/setSuggestionsEnabled`.
- **`PanelModal.tsx`** (nuovo): shell visiva riusabile (backdrop scuro + `.value-modal`), usata sia
  dal wizard sia dai pannelli contestuali.
- **`FirstRunWizard.tsx`** (nuovo, **sostituisce `ValueIntroModal`**): wizard sequenziale. Pannelli:
  (1) Benvenuto/cosa fa Aria, (2) Come la usi (4 proof-point), (3) Privacy (dal box privacy del
  login), (4) Avviso+checkbox (gate 72h). Indicatore a pallini, Avanti/Indietro, footer con «Esci
  per ora» / «Non mostrare più». Mostrato secondo la cadenza oraria; l'avviso secondo la regola 72h.
- **`InfoPanelModal.tsx`** (nuovo): pannello contestuale singolo. Props `{ id, title, children, onClose }`.
  Ritorna `null` se toggle OFF o opt-out attivo. Footer: «Ho capito» (onClose) + «Non mostrare più»
  (opt-out + onClose). Header con × (exit).
- **`value.css`** (estendere): stili pallini wizard, footer, bottoni Avanti/Indietro.

## Cablaggi

- `main.tsx`: `<ValueIntroModal />` → `<FirstRunWizard />` (stessa posizione, prima del tour).
- `CaseDetailView.tsx`: alla chiusura dell'upload drawer (`onClose`, riga ~2881) se è stato aggiunto
  materiale (c'erano item `done` in coda), `setShowPostUpload(true)`; render
  `{showPostUpload && <InfoPanelModal id="post-upload" … onClose={()=>setShowPostUpload(false)}>}`.
- `lock/LockScreen.tsx` + `lock/LockGate.tsx`: nuovo prop `onLogout` passato da `LockGate`
  (`() => supabase.auth.signOut()`), reso come bottone «Logout» accanto a «PIN dimenticato?».
- Login (`AuthScreen.handleSubmit`): chiamare `clearLoginOptOuts()` insieme a `recordAcceptance()`.

## Overlay gate (fix deadlock pannello ↔ tour)

Problema: il tour spotlight (z-index 10000/10001) si disegnava **sopra** i pannelli valore
(`value-modal-backdrop`, z-index 1000) → «Ho capito»/«Iniziamo» coperti e non cliccabili, mentre il
backdrop del pannello disabilitava il pulsante che il tour invitava a premere (es. «Analizza con AI»
dopo la chiusura dell'upload drawer, e «Nuovo cliente» al primo avvio col `FirstRunWizard`). Deadlock.

Fix: `value/overlayGate.ts` (pub/sub ref-count via `useSyncExternalStore`). `FirstRunWizard` e
`InfoPanelModal` chiamano `openOverlay()/closeOverlay()` mentre sono aperti; `OnboardingWizard` usa
`useAnyOverlayOpen()` e **si mette in pausa** (return null) finché un pannello è aperto. In più, il
`value-modal-backdrop` passa a z-index **10002** (sopra il tour) come garanzia. Effetto collaterale
voluto: «comincia la magia» appare PRIMA dello step «Analizza con AI» (il tour riparte alla chiusura).

## Fix: clic sul backdrop chiude il pannello (no-trap)

Sintomo riportato: dopo un login fresco il `FirstRunWizard` (cadenza oraria) copre la UI con il
suo backdrop (`value-modal-backdrop`, pointer-events:auto, z10002); cliccando l'area scura attorno
alla card **non succedeva nulla** → l'utente si sentiva intrappolato («clicco sul layer, non
raggiungo la UI»). Fix: `PanelModal` accetta `onBackdrop` e chiama il dismiss quando il clic è
sul backdrop (`e.target === e.currentTarget`, non sulla card). `FirstRunWizard` → `exitForNow`,
`InfoPanelModal` → `onClose`. Verificato in browser (Playwright, viewport mobile 390px): dopo il
clic sul velo il pannello si chiude e il centro pagina torna cliccabile (`app-shell`).
Nota: il pannello renderizza correttamente con contenuto (screenshot di QA); se su un device
appare "vuoto" sospettare bundle PWA in cache (hard-refresh / clear site data).

## Verifica (rev 2)
- `npm run build` + `npm run test:value-messaging` (esteso) + `npm run test:auth-onboarding`.
- QA live su Netlify: primo avvio = wizard a pannelli → avviso+checkbox; riapparizione dopo 1h;
  «Esci per ora» / «Non mostrare più»; pannello post-upload; bottone Logout sulla pagina PIN.
- Porting a PLT invariato come piano (rebrand Aria→GiulIA, copy legale, mai citazioni Cassazione verificate).
