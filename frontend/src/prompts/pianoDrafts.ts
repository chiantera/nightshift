export const MEDICAL_DISCLAIMER = `\n\n---\n⚠️ **Bozza — da verificare prima della consegna al cliente.** Aria non è un medico: per dolori, sintomi o condizioni mediche, il cliente deve essere valutato da un medico o fisioterapista prima di continuare il percorso.`;

export const PIANO_PROMPTS: Record<string, { label: string; icon: string; prompt: string }> = {
  pianoSettimana: {
    label: 'Piano settimana',
    icon: 'Calendar',
    prompt: `Genera un piano di allenamento settimanale personalizzato per questo cliente.

Struttura il piano in questo formato:
1. Obiettivo della settimana (1 frase)
2. Struttura giorni (es. Lun/Mer/Ven = forza, Mar/Gio = cardio/mobilità, Sab/Dom = riposo)
3. Per ogni giorno di allenamento:
   - Nome sessione
   - Riscaldamento (5-10 min)
   - Parte principale: esercizi con serie × ripetizioni × carico suggerito (o RPE)
   - Defaticamento/stretching
4. Note trainer: punti tecnici su cui il cliente deve concentrarsi
5. Progressione rispetto alla settimana precedente (se ci sono dati)

Basa tutto sui dati reali della scheda: obiettivo, livello, storico sessioni, eventuali limitazioni.
Non inventare dati non presenti nella scheda.

${MEDICAL_DISCLAIMER}`,
  },
  schedaMensile: {
    label: 'Scheda mensile',
    icon: 'LayoutList',
    prompt: `Genera una scheda di allenamento mensile (4 settimane) per questo cliente.

Struttura:
1. Obiettivo del mese e indicatori di successo
2. Periodizzazione: come cambia il carico nelle 4 settimane (es. accumulo → intensificazione → deload)
3. Per ogni settimana: focus principale e struttura giorni
4. Esercizi principali per ogni fase con progressione di carico/volume
5. Check-in consigliati: quando misurare i progressi
6. Adattamenti da fare se il cliente è in plateau o mostra affaticamento

Basa tutto sui dati reali della scheda.
${MEDICAL_DISCLAIMER}`,
  },
  reportProgresso: {
    label: 'Report progresso',
    icon: 'TrendingUp',
    prompt: `Genera un report di progresso completo per questo cliente.

Struttura:
1. **Sommario** (2-3 frasi: stato generale, trend principale)
2. **Progressi oggettivi** (dati misurabili: pesi, circonferenze, performance — solo se presenti nella scheda)
3. **Aderenza al piano** (sessioni completate vs programmate, pattern di assenza)
4. **Punti di forza** del percorso
5. **Aree di miglioramento** o plateau rilevati
6. **Raccomandazioni** per le prossime 4 settimane
7. **Messaggio per il cliente** (tono motivante, in linguaggio semplice)

Usa solo dati reali presenti nella scheda. Se un dato non è disponibile, indicalo esplicitamente.
${MEDICAL_DISCLAIMER}`,
  },
  notaNutrizionale: {
    label: 'Nota nutrizionale',
    icon: 'Apple',
    prompt: `Genera una nota nutrizionale orientativa per supportare l'obiettivo di questo cliente.

IMPORTANTE: Questa è una nota orientativa generale, NON un piano dietetico medico.
Il trainer deve sempre consigliare al cliente di consultare un nutrizionista o dietologo per un piano personalizzato.

Contenuto:
1. Fabbisogno calorico orientativo (basato su obiettivo e livello di attività)
2. Ripartizione macronutrienti consigliata (proteine/carboidrati/grassi in %)
3. Timing dei pasti rispetto agli allenamenti
4. Alimenti da privilegiare per l'obiettivo
5. Alimenti da limitare
6. Idratazione raccomandata
7. Integratori di base eventualmente utili (solo comuni: proteine, creatina, vitamina D — niente prescrizioni)

Adatta al profilo del cliente nella scheda.
${MEDICAL_DISCLAIMER}`,
  },
  messaggioMotivazione: {
    label: 'Messaggio cliente',
    icon: 'MessageSquare',
    prompt: `Scrivi un messaggio di feedback e motivazione da inviare al cliente.

Il messaggio deve:
- Essere in prima persona come se fosse scritto dal trainer
- Riconoscere i progressi specifici del cliente (usa dati reali dalla scheda)
- Affrontare eventuali difficoltà o plateau con tono costruttivo
- Ricordare l'obiettivo e perché vale la pena continuare
- Indicare i prossimi passi concreti
- Chiudersi con una nota incoraggiante

Tono: professionale ma caldo, diretto, motivante. Non generico — personalizzato su questo cliente.
Lunghezza: 150-250 parole.`,
  },
};
