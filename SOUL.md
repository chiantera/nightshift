# SOUL.md — SchedaPRO

> La ragione per cui esiste questo prodotto.

---

## Missione

**Trasforma il caos della scheda cliente in un piano chiaro.**

Il personal trainer passa fino al 30% del suo tempo di lavoro ad amministrare: scrivere note dopo la sessione, aggiornare fogli Excel, costruire schede mensili, cercare vecchie misurazioni, rispondere a messaggi su WhatsApp. Tempo sottratto al coaching vero.

SchedaPRO lo taglia a zero.

---

## Tesi

> Un trainer con Aria è 10× più veloce di un trainer con Excel.

Aria non sostituisce il trainer — è il suo secondo cervello. Ascolta i log delle sessioni, legge le misurazioni, trova i plateau, genera la scheda della settimana. Il trainer verifica, personalizza, consegna.

---

## Chi è il trainer target

- Personal trainer freelance italiano, 5-30 clienti
- Lavora in palestra o a domicilio
- Tiene traccia dei clienti su carta, Note, WhatsApp, o un'app usa-e-getta
- Non ha un software dedicato, o ha provato Trainerize/True Coach e ha mollato perché "troppo americano"
- Sa fare il suo lavoro molto bene — il problema è l'amministrazione

---

## Cosa NON è SchedaPRO

- Non è un'app per l'utente finale (il cliente). È per il trainer.
- Non è un sostituto del fisioterapista o del medico. Aria rimanda sempre ai professionisti sanitari.
- Non è un'app per catene di palestre o box corporate. È per il freelance.
- Non è Trainerize in italiano. È un'intelligenza artificiale che conosce il tuo cliente.

---

## Design philosophy

- **Mobile-first, una mano sola.** Il trainer è in palestra. Niente desktop.
- **Dark + bordeaux.** Elegante, non sportivo-neon. Si vende come tool professionale.
- **Velocità di pensiero.** L'interazione AI deve essere più rapida del pensiero del trainer.
- **Bozze verificabili.** Tutto ciò che genera Aria è una bozza. Il trainer ha sempre l'ultima parola.
- **Privacy per default.** I dati del cliente non escono dal dispositivo senza consenso esplicito.

---

## Aria

Aria è il coach AI di SchedaPRO. Non è un chatbot generico — è una specialista di fitness e coaching con 15 anni di esperienza immaginaria nei centri fitness italiani.

- Sa cosa è la periodizzazione a blocchi.
- Sa che "plateau" non significa "problema del cliente" — significa problema del piano.
- Sa quando dire "vai dal fisio" e non si vergogna a dirlo.
- Si rivolge al trainer con rispetto professionale.
- Non inventa misurazioni. Non inventa progressi. Cita sempre la fonte.

---

## Smell tests

Prima di aggiungere una feature, chiediti:

1. **Risolve un problema reale del trainer, o è solo una feature cool?**
2. **Si usa con una mano sola in palestra?**
3. **Aria può aiutare in modo verificabile, o sta inventando?**
4. **Il trainer capisce l'output senza un manuale?**
5. **Aggiunge latenza al workflow, o la elimina?**

Se la risposta a 1, 2, 4, 5 non è "sì", non costruirla.
