# Changelog

Tutte le modifiche rilevanti di FamilyHub vengono tracciate in questo file.

Formato ispirato a Keep a Changelog e Semantic Versioning.

## [1.5.0] - 2026-08-20

### Added
- introdotto il profilo professionale degli educatori con competenze, lingue, specializzazioni, documenti, certificazioni e requisiti per struttura
- aggiunte valutazioni periodiche dei professionisti, dashboard HR e verifica consultiva dell'idoneita ai turni
- introdotta la bacheca di struttura con circolari, destinatari e presa visione tracciata
- esteso il modulo Attivita con calendario, promemoria personali e media subordinati al consenso documentale
- aggiunto il workflow Incidenti e segnalazioni con severita, transizioni, analisi ed eventuali notifiche esterne
- aggiunti i moduli Farmaci e somministrazioni ed Eventi sanitari, visite, esami e accessi in pronto soccorso
- aggiunta la checklist QA/UAT completa per la release candidate `v1.5.0-RC1`

### Changed
- aggiornati frontend React, contratti OpenAPI, guide operative e handoff UX per i moduli `188-196`
- stabilizzato il bootstrap di una nuova installazione PostgreSQL e il relativo ambiente di test
- rimossi dal repository gli asset Cuba originali non necessari al runtime e non redistribuibili
- separati i processi applicazione, worker e scheduler nel runtime Docker senza migrazioni o reset credenziali al riavvio dei processi asincroni

### Fixed
- corretto il controllo Health di Redis con PhpRedis e reso affidabile l'heartbeat dei worker anche quando la coda è inattiva
- allineato il controllo ClamAV alla configurazione Laravel compatibile con config cache
- corretto il contratto frontend della pianificazione turni da `eligibility.staff` a `eligibility.rows`
- nascosto Audit senza `audit_logs.read` e gestito esplicitamente il `403` sugli accessi diretti

### Security
- rafforzata la supply chain GitHub con CI, CodeQL, dependency review, Scorecard, Dependabot, secret scanning e push protection
- aggiunti controlli RBAC, isolamento per struttura/minore e audit ai nuovi moduli HR, sanitari e operativi
- mantenuto il fail-closed sui media attivita quando consenso, antivirus o storage non consentono l'operazione
- audit Composer e npm runtime completati senza vulnerabilita note

### Notes
- tutte le migrazioni della release sono additive; non eseguire `migrate:fresh`, reset o reseed distruttivi
- prima del deploy eseguire un backup verificato e poi `php artisan migrate --force`
- verifiche automatiche locali: suite completa con 185 test e 1.564 asserzioni; build Vite e audit dipendenze superati
- validazione manuale completata e verbalizzata in `docs/qa/2026-08-21-v1.5.0-uat-execution.md`

## [1.4.0] - 2026-08-15

### Added
- completato il workflow Avvicinamenti con rinnovo del provvedimento, trend per tipologia, elenco rinnovi imminenti e firma applicativa della sospensione
- introdotti i turni del Diario educativo: apertura, chiusura firmata applicativamente, collegamento delle voci e blocco delle registrazioni chiuse
- aggiunta ricerca full-text del Diario educativo su PostgreSQL, con filtri per periodo, turno e consegne ancora da leggere
- resa disponibile la presa visione delle consegne tramite endpoint autenticato e auditato
- aggiunti contratti UX/API e guide operative per Avvicinamenti e Diario educativo

### Changed
- il form del Diario non può più indicare manualmente utente e data della presa visione: questi dati sono derivati dall'account autenticato
- le pagine React Avvicinamenti e Diario sono riallineate ai nuovi endpoint e ai flag restituiti dal backend
- allineati `VERSION`, badge README e metadata del package frontend alla versione corrente

### Security
- audit della lettura delle note riservate degli avvicinamenti, del rinnovo autorizzativo, della firma sospensione, della firma turno e della presa visione consegne
- le voci appartenenti a turni firmati non possono essere modificate o eliminate
- il motore di ricerca è eseguito lato backend e applica gli stessi vincoli di accesso al minore della lista ordinaria

### Notes
- introdotta la migrazione additiva `2026_08_14_120000_create_minor_journal_shifts_table`
- prima dell'applicazione locale è stato creato un dump di backup; nessun reset dati eseguito
- verifiche eseguite: `MinorApproachApiTest`, `MinorJournalApiTest`, build React/Vite

## [1.3.0] - 2026-08-13

### Added
- completato il blocco operativo `Turni / Timesheet` con calendario mensile struttura, sostituzioni turno, chiusura e firma operatore, gestione scostamenti e anomalie
- introdotto il modello relazionale `staff_shift_substitutions` con endpoint amministrativi dedicati per attivare e chiudere sostituzioni sui turni pianificati
- aggiunte nuove guide operative per `Timesheet` e `Policy documentale ABAC`
- aggiunti handoff UX/API consolidati per timesheet, ABAC e chiusura del modulo Minori

### Changed
- chiuso funzionalmente il modulo `Minori` lato backend con dashboard riepilogativa, trend PEI, storico, audit pseudonimizzato e narrativa protetta
- aggiornati i contratti OpenAPI per modulo Minori, audit, turni, sostituzioni e policy documentale
- riallineate le pagine frontend di audit, dettaglio minore, pianificazione turni e mia settimana al comportamento reale del backend
- estesa la documentazione operativa e di rilascio per il nuovo assetto `Minori + Turni + ABAC`

### Security
- cifrati a riposo i campi sensibili del profilo minore e delle diagnosi cliniche
- oscurati nell'audit payload i campi narrativi e clinici sensibili
- introdotto l'uso del pseudonimo pubblico del minore nei log e negli export audit non strettamente clinici
- resi più robusti preview e download documentali tramite streaming controllato e audit separato

### Fixed
- stabilizzata la timeline progressiva PEI e il riepilogo dashboard del minore
- corretti i flussi di preview/download documenti nei test e nei casi con metadata storage non affidabili
- riallineate le viste timesheet/frontend ai nuovi campi di sostituzione, anomalie e stato operativo

### Notes
- nessun reset dati eseguito durante questa release
- verifiche eseguite: `MinorApiTest`, `MinorPermissionAlignmentApiTest`, `MinorNoteApiTest`, `AuditApiTest`, `StaffShiftApiTest`
## [1.2.2] - 2026-08-10

### Changed
- riallineata la UX amministrativa di geografia con breadcrumb navigabili e ripristino dello stato di navigazione tra nazioni, regioni, province e cittÃ 
- completato il CRUD frontend della pagina `Organizzazioni` con modale coerente al comportamento reale del backend
- documentati i fix UX/backend del blocco geografia con handoff dedicati e note tecniche di supporto

### Fixed
- risolto il crash di memoria nella pagina `Educatori`: il campo `CittÃ  nascita` non carica piÃ¹ l'intero archivio cittÃ  ma usa ricerca asincrona con risultati limitati
- corretto il contratto lookup cittÃ : `GET /api/lookups/cities` ora restituisce `[]` senza filtri e supporta ricerca controllata con `q`, `id`, `limit` e filtri geografici
- corretto l'endpoint amministrativo nazioni e le liste gerarchiche regioni/province per restituire viste flat coerenti con il frontend
- risolto il problema di encoding caratteri speciali in `MessaggioDetailPage`
- corretta la validazione frontend nella pagina `Organizzazioni` che poteva mostrare errori di campo obbligatorio anche con input compilato

### Security
- ridotto il rischio di esaurimento memoria lato backend evitando preload massivi del dataset geografico in anagrafiche staff
- mantenuti i controlli server-side sui lookup geografici limitando dimensione e forma delle risposte

### Notes
- release di patch senza reset dati e senza modifiche distruttive al database
- verifiche eseguite: build frontend Vite e test backend geografici mirati
## [1.2.1] - 2026-08-09

### Changed
- allineata la configurazione seed di default dei provider geografia per nuove installazioni
- il provider `ISTAT` ora nasce preconfigurato in modalitÃ  `remote_file` con URL CSV ufficiale, senza richiedere setup manuale iniziale
- confermata come configurazione standard la coppia di provider predefiniti `GEONAMES` + `ISTAT`

### Fixed
- evitato il caso in cui una nuova installazione trovasse `ISTAT` attivo ma non realmente utilizzabile perchÃ© inizializzato come `local_file` senza `source_path`
- resa coerente la prima esperienza di import geografico per Italia e nazioni estere subito dopo il bootstrap

## [1.2.0] - 2026-08-09

### Added
- export presenze `PDF` per il modulo `Turni / Timesheet` con gli stessi preset amministrativi del CSV (`payroll`, `review`, `labor_consultant`)
- generazione server-side del report PDF timesheet con audit dedicato sullâ€™export
- classificazione ABAC dei thread di `Messaggistica interna` con supporto ai codici `internal`, `restricted`, `clinical`, `judicial`
- filtro backend/frontend per `classification_code` su lista conversazioni e opzioni partecipanti
- handoff UX/API dedicati per export PDF timesheet e messaggistica classificata

### Changed
- esteso il contratto API della messaggistica con `classification_code`, `classification_label` e `document_classification`
- aggiornato il modal di nuova conversazione per rifiltrare i partecipanti in base alla classificazione selezionata
- aggiornate le pagine frontend `Export presenze` e `Messaggistica` in coerenza con i nuovi endpoint backend
- roadmap e draft release interni riallineati alla chiusura del blocco `Turni + Messaggistica`

### Security
- la messaggistica interna ora riusa la stessa matrice ABAC dei documenti sensibili per impedire apertura e creazione thread non coerenti con ruolo, struttura e minore
- filtro partecipanti lato backend irrigidito: un utente non autorizzato alla classificazione del thread non puÃ² essere selezionato nÃ© incluso nel payload finale

### Fixed
- ripristinato il percorso PDF presenze precedentemente lasciato sospeso lato UX con backend ora disponibile
- mantenuta retrocompatibilitÃ  sulla creazione thread: in assenza di `classification_code` il backend applica automaticamente `internal`

## [1.1.1] - 2026-08-08

### Security
- bonifica completa delle dipendenze frontend e backend con audit `npm` e `composer` riportati a zero vulnerabilitÃ  note
- rimozione della dipendenza `xlsx` dal frontend per eliminare una superficie di attacco non necessaria nella preview browser
- introduzione di overrides frontend su dipendenze transitive vulnerabili (`brace-expansion`, `nanoid`, `postcss`)
- separazione esplicita tra permesso RBAC di preview (`attachments.read`) e permesso RBAC di download (`attachments.download`)

### Changed
- aggiornati pacchetti frontend critici (`react-router-dom`, `axios`, `react-hook-form`, `eslint`, `typescript-eslint` e correlati)
- aggiornati pacchetti backend/transitivi Laravel con riallineamento di `guzzlehttp/guzzle`, `guzzlehttp/psr7`, `league/commonmark` e dipendenze correlate
- anteprima documenti browser limitata a formati sicuri/gestibili inline; i fogli Excel restano scaricabili ma non piÃ¹ renderizzati lato client

### Fixed
- eliminato il percorso di preview XLS/XLSX che dipendeva da librerie con advisory aperti
- introdotto parser sicuro server-side per `xlsx` con audit dedicato di preview strutturata
- release metadata allineati alla patch `1.1.1`

## [1.1.0] - 2026-08-08

### Added
- pagina amministrativa `Health Servizi` con monitoraggio backend di API, database, Redis, worker, scheduler, storage, antivirus, SMTP e console MinIO quando applicabile
- pagina amministrativa `Configurazione Storage` con gestione runtime `ENV`/`DB`
- configurazioni storage persistite in database con test connessione, attivazione runtime e audit dedicato
- endpoint amministrativi `/api/admin/system/health*` e `/api/admin/system/storage-configs*`
- documentazione OpenAPI e handoff UX/QA dedicati per health e storage

### Changed
- frontend amministrativo allineato ai contratti API reali per `SistemaHealthPage` e `SistemaStoragePage`
- sidebar amministrativa estesa con accesso a `Storage documentale` e `Health servizi`
- override runtime del filesystem S3 applicato da configurazione DB attiva con fallback automatico a `.env`

### Security
- credenziali storage salvate da pannello cifrate a riposo con `Crypt` e mai restituite in chiaro via API
- RBAC esteso con permessi `system_health.*` e `system_storage.*`

### Fixed
- build frontend production corretta rimuovendo BOM residuo da `frontend/package.json`

## [1.0.0] - 2026-08-08

### Added
- piattaforma gestionale FamilyHub con backend Laravel e frontend React/Vite
- autenticazione con MFA, session timeout e auditing di sicurezza
- RBAC applicativo e ABAC documentale per i dati sensibili
- moduli operativi per minori, uscite, attivitÃ , avvicinamenti, diario educativo, messaggistica interna e turni/timesheet
- anagrafiche amministrative e geografiche con provider configurabili
- storage documentale compatibile S3 con supporto MinIO
- stack Docker locale e stack Docker production con immagini immutabili
- documentazione tecnica, handoff UX e checklist deploy multi-ambiente

### Security
- protezione documenti con quarantena, scansione antivirus e audit preview/download
- MFA per accessi amministrativi
- separazione ambienti e hardening deploy produzione documentato

### Notes
- questa release definisce la baseline stabile `v1.0.0`
- da questa versione in avanti il progetto segue versionamento `major.minor.patch`
- le future release devono avere release notes dedicate in `docs/releases/`

