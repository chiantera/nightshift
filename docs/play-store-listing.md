# Google Play Console — Digital Trainer (Internal Testing)

Materiali e checklist per pubblicare l'app in Internal testing. Generato il 2026-07-02.

## Identità app

| Campo | Valore |
|---|---|
| Nome app | Digital Trainer |
| Package name | `com.digitaltrainer.myapp` |
| Tipo | App, Gratis |
| Lingua predefinita | Italiano (it-IT) — aggiungere traduzione inglese (en-US) |
| Categoria | Salute e fitness |
| AAB da caricare | `android-twa/app-release-bundle.aab` (versionCode 1, versionName 1.0.0) |
| Privacy policy URL | `https://nightshift-ruby.vercel.app/privacy.html` |

## Scheda store — Italiano (predefinita)

**Nome (max 30):** `Digital Trainer`

**Descrizione breve (max 80):**
```
Il coach AI per personal trainer: schede clienti, progressi e piani chiari.
```

**Descrizione completa (max 4000):**
```
Trasforma il caos della scheda cliente in un piano di allenamento chiaro.

Digital Trainer è l'app pensata per i personal trainer che vogliono gestire i propri clienti in modo professionale, con l'aiuto di Aria, il tuo secondo cervello AI.

COSA PUOI FARE
• Schede clienti complete: obiettivi, progressi, appuntamenti, note e documenti in un unico posto.
• Analisi AI dei progressi: Aria individua plateau, incongruenze e rischi, e ti propone raccomandazioni concrete.
• Piani di allenamento in bozza: genera proposte modificabili e adattale al tuo metodo.
• Chatta con Aria su ogni scheda per ragionare su casi specifici.
• Detta a voce, carica foto e documenti: l'AI estrae e struttura le informazioni.
• Anonimizzazione integrata: rimuovi i dati identificativi prima dell'analisi.

I TUOI DATI, SOTTO CONTROLLO
• Le schede restano salvate sul tuo dispositivo.
• Esporta e importa archivi cifrati .spr protetti da password.
• Blocco app con PIN e biometria.

MODALITÀ FLASH E PRO
La modalità Flash è gratuita, per sempre. Con Maxx sblocchi la modalità Pro: ragionamento profondo, analisi più ricche e raccomandazioni di qualità superiore.

Digital Trainer non è un dispositivo medico e non fornisce diagnosi: è uno strumento professionale di supporto al lavoro del trainer.
```

## Store listing — English (en-US)

**Name (max 30):** `Digital Trainer`

**Short description (max 80):**
```
The AI coach for personal trainers: client sheets, progress and clear plans.
```

**Full description (max 4000):**
```
Turn messy client notes into a clear training plan.

Digital Trainer is the app for personal trainers who want to manage their clients professionally, with the help of Aria, your AI second brain.

WHAT YOU CAN DO
• Complete client sheets: goals, progress, appointments, notes and documents in one place.
• AI progress analysis: Aria spots plateaus, inconsistencies and risks, and suggests concrete recommendations.
• Draft training plans: generate editable proposals and adapt them to your method.
• Chat with Aria about any client sheet to reason through specific cases.
• Dictate by voice, upload photos and documents: the AI extracts and structures the information.
• Built-in anonymisation: strip identifying data before AI analysis.

YOUR DATA, UNDER CONTROL
• Client sheets stay on your device.
• Export and import encrypted, password-protected .spr archives.
• App lock with PIN and biometrics.

FLASH AND PRO MODES
Flash mode is free, forever. Maxx unlocks Pro mode: deep reasoning, richer analysis and higher-quality recommendations.

Digital Trainer is not a medical device and provides no diagnosis: it is a professional tool supporting the trainer's work.
```

## Grafiche

| Asset | File | Note |
|---|---|---|
| Icona app 512×512 | `frontend/public/icon-512.png` | già pronta |
| Feature graphic 1024×500 | `docs/play-feature-graphic.png` | generata |
| Screenshot telefono (min 2, max 8) | **da fare a mano** | dall'app installata o Chrome mobile; 16:9 o 9:16, min 320px |

## Data safety form (risposte)

- **Raccoglie dati?** Sì.
- **Email address** → Account management. Raccolto, non condiviso. Obbligatorio. Cifrato in transito. L'utente può richiederne la cancellazione.
- **Health info** (schede clienti inserite dall'utente) → App functionality. Trattato **ephemeralmente** verso i provider AI per l'analisi; l'archivio permanente resta sul dispositivo dell'utente. Non condiviso a fini commerciali.
- **Purchase history** (stato abbonamento Maxx) → App functionality. Pagamenti gestiti da Stripe; noi conserviamo solo piano attivo + scadenza.
- **Cifratura in transito:** Sì (HTTPS ovunque).
- **Meccanismo di richiesta cancellazione:** email a digitaltrainer.dev@gmail.com (indicato in privacy policy).
- **Non** raccogliamo: posizione, contatti, identificatori pubblicitari, analytics di terze parti.

## Content rating (questionario IARC)

- Categoria: Utility/Productivity/Other.
- Violenza/sesso/droghe/gioco d'azzardo: No.
- Contenuti generati dall'utente condivisi con altri utenti: No (le schede restano locali).
- Esito atteso: **PEGI 3 / Everyone**.

## Checklist passi su Play Console (manuale)

1. **Crea app**: nome "Digital Trainer", lingua predefinita Italiano, App, Gratis, accetta dichiarazioni.
2. **Release → Testing → Internal testing → Create new release**: carica `app-release-bundle.aab`. Al primo upload accetta **Play App Signing** (Google gestisce la chiave di firma; la nostra è la upload key).
3. **Testers**: crea una email list con i tester (fino a 100), salva, condividi il link opt-in che Play genera.
4. **Grow → Store presence → Main store listing**: incolla i testi IT sopra; aggiungi la traduzione EN (Add language → English US); carica icona, feature graphic, screenshot.
5. **Policy → App content**: privacy policy URL, data safety (risposte sopra), content rating, target audience (18+, app professionale), dichiarazioni (no ads).
6. **⚠️ Dopo il primo upload — assetlinks (passo mio):** Play Console → **Test and release → Setup → App signing** (App integrity): copia lo **SHA-256 dell'App signing key certificate** e comunicamelo — lo aggiungo come seconda fingerprint in `frontend/public/.well-known/assetlinks.json` e rideploylo. Senza questo, l'app installata da Play mostra la barra del browser in alto.

## Note tecniche

- L'app è una **TWA (Trusted Web Activity)**: mostra https://nightshift-ruby.vercel.app dentro Chrome, senza UI browser. Ogni deploy web aggiorna l'app **senza** ricaricare l'AAB su Play.
- Serve ricaricare un nuovo AAB solo se cambiano: package, icone/splash native, colori nativi, host, versione TWA. In quel caso: bump `appVersionCode`/`appVersionName` in `android-twa/twa-manifest.json` → `bubblewrap update --skipVersionUpgrade && bubblewrap build` (password nel file locale `~/keystores/digitaltrainer-upload.txt`).
- **Upload keystore**: `~/keystores/digitaltrainer-upload.keystore` (fuori dal repo, password in `digitaltrainer-upload.txt` accanto). **Fai un backup fuori da questa macchina.** Se persa, si può chiedere a Google il reset della upload key (Play App Signing attivo).
- Fingerprint upload key (già in assetlinks.json): `0F:E3:CF:82:81:92:1C:EA:AA:97:01:86:3E:05:ED:96:D1:76:EE:3A:88:FF:EC:92:66:73:BF:1A:47:86:CA:A0`
