# Gap Analysis — Avvicinamenti familiari e Diario educativo

Data: 2026-07-02  
Ambito: FamilyHub — verifica copertura funzionale rispetto ai requisiti di progetto  
Stato documento: valido come baseline tecnica, progettuale e commerciale

## 1. Obiettivo

Questo documento chiarisce, in modo formale, la differenza tra:

- funzionalità già implementate nel backend/API
- funzionalità già esposte in interfaccia
- funzionalità richieste dal progetto ma non ancora completate

Serve per:

- pianificare lo sviluppo reale
- evitare incomprensioni tra backend, UX e stakeholder
- supportare la consegna documentale del progetto
- presentare correttamente lo stato di avanzamento in fase commerciale

## 2. Sintesi esecutiva

Alla data del 2026-07-02:

- il modulo `Avvicinamenti` esiste in versione `v1 operativa`
- il modulo `Diario educativo` esiste in versione `v1 operativa`
- entrambe le aree hanno già:
  - modello dati iniziale
  - endpoint API CRUD
  - controlli autorizzativi RBAC + accesso al minore
  - audit/storico base
  - documentazione OpenAPI
  - handoff UX iniziale

Tuttavia, rispetto ai requisiti funzionali di prodotto, la copertura è ancora `parziale`.

In particolare:

- `Avvicinamenti` oggi gestisce singoli eventi/step operativi
- `Diario educativo` oggi gestisce singole voci diario
- non sono ancora presenti i workflow avanzati, i dati clinico-evolutivi strutturati, la firma di chiusura turno, il passaggio consegne formale e la messaggistica interna cifrata

## 3. Stato attuale verificato

### 3.1 Avvicinamenti

Copertura tecnica attuale:

- CRUD operativo avvicinamenti
- anagrafica `tipi avvicinamento`
- relazione con:
  - minore
  - contatto del minore
  - operatore supervisore
  - struttura
- campi base:
  - titolo
  - obiettivo
  - luogo
  - date pianificate
  - date effettive
  - stato
  - note esito
  - prossimi passi
- audit/storico su create/update/delete

Riferimenti:

- `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\MinorApproachController.php`
- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-080-avvicinamenti-api-and-ui-contract.md`

### 3.2 Diario educativo

Copertura tecnica attuale:

- CRUD operativo voci diario
- anagrafica `tipi voce diario`
- campi base:
  - minore
  - tipologia
  - data/ora osservazione
  - titolo
  - contenuto
  - follow-up richiesto
  - note follow-up
- audit/storico base

Riferimenti:

- `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\MinorJournalController.php`
- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-082-diario-del-minore-api-and-ui-contract.md`

## 4. Gap analysis — Avvicinamenti familiari

| Requisito | Stato attuale | Copertura | Evoluzione necessaria |
| --- | --- | --- | --- |
| Visite in struttura, uscite, telefonate, videochiamate | Gestibili solo come tipologie generiche di avvicinamento | Parziale | Introdurre tipologie standard di dominio e, se necessario, campi specifici per modalità incontro |
| Provvedimento autorizzativo con scadenza e alert rinnovo | Non presente | Assente | Nuova entità relazionale per provvedimento, date validità, allegato, alert rinnovo, stato attivo/scaduto |
| Valutazione reazione del minore prima/durante/dopo | Non presente | Assente | Nuova struttura dati osservativa multi-fase collegata all'avvicinamento |
| Note riservate psicologo / coordinatore | Non presente | Assente | Campo o tabella separata con visibilità ristretta per ruolo e audit rafforzato |
| Diario evolutivo con grafico trend | Non presente | Assente | KPI/eventi strutturati e serie temporale da calcolare lato API |
| Sospensione motivata con firma del responsabile | Non presente | Assente | Stato sospeso, motivazione obbligatoria, firma/validazione responsabile, audit dedicato |

### 4.1 Valutazione sintetica

Il modulo attuale è utile come `registro operativo degli incontri`, ma non è ancora sufficiente per rappresentare l'intero ciclo gestionale e autorizzativo degli avvicinamenti familiari.

### 4.2 Evoluzione proposta

Ordine consigliato:

1. provvedimento autorizzativo
2. reazione del minore prima/durante/dopo
3. sospensione motivata con firma
4. note riservate
5. diario evolutivo e trend

### 4.3 Addendum backend 2026-07-02

Nel corso della stessa data è stata introdotta una prima estensione backend del modulo `Avvicinamenti`:

- metadati provvedimento autorizzativo
- stato autorizzazione calcolato `active / expiring / expired`
- livelli reazione del minore `prima / durante / dopo`
- note riservate psicologo/coordinatore con masking backend per ruolo
- stato `suspended` con motivazione e metadata sospensione
- endpoint trend `GET /api/approaches/trend`

Questa evoluzione riduce il gap ma **non chiude ancora**:

- allegati/gestione documentale del provvedimento
- workflow di rinnovo completo
- firma forte del responsabile
- UX definitiva del grafico trend
- audit dedicato di lettura note riservate

## 5. Gap analysis — Diario educativo

| Requisito | Stato attuale | Copertura | Evoluzione necessaria |
| --- | --- | --- | --- |
| Registro eventi turno (alimentazione, igiene, sonno, umore) | Esiste solo una voce diario libera | Parziale | Introdurre modello strutturato per turno e sottosezioni evento |
| Segnalazioni urgenti con livelli priorità (verde/giallo/rosso) | Non presente | Assente | Aggiungere classificazione priorità e workflow alert |
| Firma digitale obbligatoria a chiusura turno | Non presente | Assente | Nuova chiusura turno con firma obbligatoria e blocco modifica successiva |
| Passaggio consegne formale con presa visione | Non presente | Assente | Workflow handover con mittente, destinatario, timestamp e conferma lettura |
| Ricerca full-text per minore / data / parola chiave | Filtri base soltanto | Parziale | Indice di ricerca full-text e API dedicate |
| Messaggistica interna cifrata per team | Non presente | Assente | Modulo separato con cifratura applicativa, thread, destinatari e audit |

### 5.1 Valutazione sintetica

Il modulo attuale è una `base di journaling osservativo`, ma non è ancora un vero `registro educativo di turno` conforme a un utilizzo operativo completo di comunità/casa famiglia.

### 5.2 Evoluzione proposta

Ordine consigliato:

1. registro turno strutturato
2. segnalazioni urgenti con priorità
3. chiusura turno con firma
4. passaggio consegne con presa visione
5. ricerca full-text
6. messaggistica interna cifrata

## 6. Priorità di sviluppo consigliata

### Fase 1 — chiusura funzionale minima operativa

- Avvicinamenti:
  - provvedimento autorizzativo
  - reazione del minore
  - sospensione motivata
- Diario educativo:
  - registro turno strutturato
  - urgenze con priorità

### Fase 2 — compliance operativa e responsabilità

- firma digitale/validazione chiusura turno
- passaggio consegne formale
- note riservate con visibilità limitata

### Fase 3 — qualità del dato e supporto decisionale

- trend evolutivo avvicinamenti
- ricerca full-text
- dashboard dedicate

### Fase 4 — comunicazione sicura interna

- messaggistica interna cifrata per team

## 7. Impatti architetturali previsti

Le prossime estensioni richiederanno:

- nuove tabelle relazionali dedicate
- audit più granulare
- enforcement ABAC su contenuti riservati
- eventuale gestione firma applicativa o firma avanzata in base al valore legale richiesto
- indicatori e query aggregate per dashboard/trend
- possibile motore di ricerca full-text dedicato, oppure uso di capacità native DB se sufficienti

## 8. Linea guida di comunicazione verso UX

Il team UX non deve considerare i moduli `Avvicinamenti` e `Diario educativo` come “completi” solo perché esiste una pagina operativa.

Deve invece distinguerli in questo modo:

- `v1 disponibile`: pagina CRUD funzionante
- `feature avanzata pianificata`: requisiti di dominio non ancora coperti

Questo evita che la UI presenti come definitive funzionalità che sono, in realtà, solo una prima baseline.

## 9. Linea guida per presentazione commerciale

Quando il progetto viene presentato a stakeholder, partner o committenti, la formulazione corretta è:

- piattaforma con moduli core già attivati
- architettura sicura e documentata
- tracciabilità audit e controllo accessi già impostati
- estensioni funzionali avanzate già analizzate e pianificate

Non è corretto presentare lo stato attuale come copertura completa dei processi di:

- avvicinamento familiare evoluto
- diario educativo di turno completo

## 10. Output documentali collegati

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-080-avvicinamenti-api-and-ui-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-082-diario-del-minore-api-and-ui-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-083-avvicinamenti-diario-gap-roadmap-contract.md`
- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 11. Decisione operativa suggerita

La scelta più solida è proseguire con:

1. consolidamento dei moduli `Avvicinamenti` e `Diario educativo`
2. chiusura della gap analysis in backlog attuabile
3. rilascio incrementale con documentazione aggiornata ad ogni step

In questo modo il progetto rimane:

- vendibile
- verificabile
- manutenibile
- allineato al requisito di sicurezza by design
