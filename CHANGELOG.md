# Changelog

Tutte le modifiche rilevanti di FamilyHub vengono tracciate in questo file.

Formato ispirato a Keep a Changelog e Semantic Versioning.

## [1.2.2] - 2026-08-10

### Changed
- riallineata la UX amministrativa di geografia con breadcrumb navigabili e ripristino dello stato di navigazione tra nazioni, regioni, province e città
- completato il CRUD frontend della pagina `Organizzazioni` con modale coerente al comportamento reale del backend
- documentati i fix UX/backend del blocco geografia con handoff dedicati e note tecniche di supporto

### Fixed
- risolto il crash di memoria nella pagina `Educatori`: il campo `Città nascita` non carica più l'intero archivio città ma usa ricerca asincrona con risultati limitati
- corretto il contratto lookup città: `GET /api/lookups/cities` ora restituisce `[]` senza filtri e supporta ricerca controllata con `q`, `id`, `limit` e filtri geografici
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
- il provider `ISTAT` ora nasce preconfigurato in modalità `remote_file` con URL CSV ufficiale, senza richiedere setup manuale iniziale
- confermata come configurazione standard la coppia di provider predefiniti `GEONAMES` + `ISTAT`

### Fixed
- evitato il caso in cui una nuova installazione trovasse `ISTAT` attivo ma non realmente utilizzabile perché inizializzato come `local_file` senza `source_path`
- resa coerente la prima esperienza di import geografico per Italia e nazioni estere subito dopo il bootstrap

## [1.2.0] - 2026-08-09

### Added
- export presenze `PDF` per il modulo `Turni / Timesheet` con gli stessi preset amministrativi del CSV (`payroll`, `review`, `labor_consultant`)
- generazione server-side del report PDF timesheet con audit dedicato sull’export
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
- filtro partecipanti lato backend irrigidito: un utente non autorizzato alla classificazione del thread non può essere selezionato né incluso nel payload finale

### Fixed
- ripristinato il percorso PDF presenze precedentemente lasciato sospeso lato UX con backend ora disponibile
- mantenuta retrocompatibilità sulla creazione thread: in assenza di `classification_code` il backend applica automaticamente `internal`

## [1.1.1] - 2026-08-08

### Security
- bonifica completa delle dipendenze frontend e backend con audit `npm` e `composer` riportati a zero vulnerabilità note
- rimozione della dipendenza `xlsx` dal frontend per eliminare una superficie di attacco non necessaria nella preview browser
- introduzione di overrides frontend su dipendenze transitive vulnerabili (`brace-expansion`, `nanoid`, `postcss`)
- separazione esplicita tra permesso RBAC di preview (`attachments.read`) e permesso RBAC di download (`attachments.download`)

### Changed
- aggiornati pacchetti frontend critici (`react-router-dom`, `axios`, `react-hook-form`, `eslint`, `typescript-eslint` e correlati)
- aggiornati pacchetti backend/transitivi Laravel con riallineamento di `guzzlehttp/guzzle`, `guzzlehttp/psr7`, `league/commonmark` e dipendenze correlate
- anteprima documenti browser limitata a formati sicuri/gestibili inline; i fogli Excel restano scaricabili ma non più renderizzati lato client

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
- moduli operativi per minori, uscite, attività, avvicinamenti, diario educativo, messaggistica interna e turni/timesheet
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
