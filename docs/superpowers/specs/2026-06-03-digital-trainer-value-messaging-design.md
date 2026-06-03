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
