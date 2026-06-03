# Digital Trainer — Google Play Store (closed testing) · copy + prep

_Data: 2026-06-03 · App pubblica: **Digital Trainer** · Assistente: **Aria** · Stato: **avviato/bozza**_
_Tenuto separato dalla spec value-messaging (`docs/superpowers/specs/2026-06-03-digital-trainer-value-messaging-design.md`)._
_Conformità: niente claim medici/sanitari, niente promesse di risultati, niente superlativi ingannevoli._

---

## ⚠️ Vincolo da sapere subito: 12 tester per 14 giorni

Per gli **account developer personali creati dopo il 13/11/2023** Google richiede, prima di poter
chiedere l'accesso alla **produzione**, una **closed test con ≥12 tester** opt-in e **attivi per 14
giorni consecutivi**. (Era 20, ridotto a 12 a dic 2024.) Account *organizzazione* o personali
pre-13/11/2023 ne sono esenti.

→ **Impatto per noi:** oggi abbiamo ~2 tester. Per arrivare alla produzione su Play servono **12
tester reali** per 14 giorni filati. Decidere come reclutarli (cerchia trainer, gruppi, ecc.) è un
prerequisito, non un dettaglio. Per la sola *closed testing* in sé bastano meno persone, ma il
conteggio 12×14gg è la porta verso la produzione.

Fonti: vedi in fondo.

---

## Passi setup closed testing (promemoria)

1. Play Console → app → **Testing → Closed testing → Create track** (nome track).
2. **Testers**: aggiungi le email Gmail dei tester (lista) **oppure** abilita l'opt-in link da condividere.
3. **Countries/Regions**: includi i paesi dove vivono i tester (almeno l'Italia).
4. **Upload AAB firmato** (wrapper Capacitor già presente — vedi backlog APK), scrivi le **release notes**, submit.
5. **Store listing** completa (titolo, descrizioni, grafica) + sezioni **Policy → App content**.
6. **App access** (Policy → App content): l'app richiede login Supabase → fornisci a Google un
   **account demo** (Name = "Demo login", Username, Password, Instructions su cosa sblocca) così i
   reviewer entrano. ⚠️ NON mettere credenziali reali in repo: si inseriscono solo in Play Console.
7. Review closed testing ~24h (account nuovi fino a 3 giorni).
8. Dopo 14 giorni con ≥12 tester attivi → **Publishing overview → Production → Request production
   access** + questionario sull'esperienza di test.

---

## Copy bozza (da rifinire)

### Nome app
**Digital Trainer** _(verificare disponibilità/eventuale suffisso se occupato)_

### Short description (≤ 80 caratteri)
> Gestisci i clienti e fatti aiutare da Aria: schede, progressi, bozze su misura.

_(78 char — alternative da valutare:)_
- `Aria, il tuo assistente AI: schede clienti, progressi e bozze personalizzate.` (77)
- `Clienti, allenamenti e progressi in un posto. Con Aria che ti prepara le bozze.` (79)

### Full description (bozza — allineata alla spina dorsale)
> **Digital Trainer non tiene solo l'elenco dei tuoi clienti.**
> Aria, l'assistente del personal trainer, lavora sui dettagli reali di ognuno — condizioni,
> progressi, obiettivi — e ti prepara le bozze su cui lavori, in una frazione del tempo. Aria
> propone, tu decidi e personalizzi.
>
> **Cosa puoi fare con Aria**
> • Chiedile qualsiasi cosa su un cliente dalla chat: conosce già la sua scheda e risponde subito.
> • Prima di un'analisi, dalle istruzioni aggiuntive per orientare cosa guardare.
> • Detta la sessione a voce in palestra: Aria la struttura nella scheda.
> • Lascia che legga progressi, log e misurazioni nel tempo: individua plateau e propone progressioni.
> • Ottieni bozze pronte da rifinire: piano settimanale, scheda mensile periodizzata, report
>   progresso, nota nutrizionale orientativa, messaggio al cliente.
>
> **Pensato per il lavoro vero**
> Aria si basa solo sui dati reali della scheda, non inventa, e tiene conto di condizioni e limiti
> del cliente. Per dieta e questioni mediche rimanda sempre a nutrizionista, dietologo o medico:
> le note sono orientative, le decisioni restano tue. I dati dei tuoi clienti restano sul tuo
> dispositivo.
>
> _Digital Trainer è in fase di test: il tuo feedback aiuta a migliorarlo._

### Release notes (closed testing — bozza)
> Prima versione di test di Digital Trainer. Crea schede cliente, registra le sessioni (anche a
> voce), e lascia che Aria prepari piani, report e messaggi su misura. Segnalaci cosa funziona e
> cosa no: digitaltrainer.dev@gmail.com

### App access — istruzioni per i reviewer (bozza, le credenziali vanno SOLO in Play Console)
> L'app richiede registrazione via email. Per la revisione: usare l'account demo fornito (campo
> Username/Password). Dopo l'accesso, al primo avvio può comparire l'avviso e il setup del PIN; il
> PIN demo è [DA DEFINIRE]. Da lì si accede a tutte le funzioni: creazione scheda cliente, upload
> materiale, chat con Aria, analisi e bozze.

---

## Da decidere / TODO
- [ ] **Reclutamento 12 tester** per la soglia produzione (oggi ~2).
- [ ] Account demo per i reviewer (email + password + PIN) — generare e inserire SOLO in Play Console.
- [ ] Grafica store: icona, feature graphic, screenshot (non in scope di questo file).
- [ ] Scegliere short description definitiva tra le varianti.
- [ ] Verificare categoria Play (Salute e fitness vs Produttività) e relative policy.

---

## Fonti (ricerca 2026-06-03)
- [App testing requirements for new personal developer accounts — Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Set up an open, closed, or internal test — Play Console Help](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en)
- [Everything about the 12 testers requirement — Play Developer Community](https://support.google.com/googleplay/android-developer/community-guide/255621488/everything-about-the-12-testers-requirement?hl=en)
- [The Complete Guide to Google Play Closed Testing in 2026 — Testers Community](https://www.testerscommunity.com/blog/google-play-closed-testing-setup-step-by-step)
