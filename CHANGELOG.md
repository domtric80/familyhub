# Changelog

Tutte le modifiche rilevanti di FamilyHub vengono tracciate in questo file.

Formato ispirato a Keep a Changelog e Semantic Versioning.

## [1.1.1] - 2026-08-08

### Security
- bonifica completa delle dipendenze frontend e backend con audit `npm` e `composer` riportati a zero vulnerabilitÃ  note
- rimozione della dipendenza `xlsx` dal frontend per eliminare una superficie di attacco non necessaria nella preview browser
- introduzione di overrides frontend su dipendenze transitive vulnerabili (race-expansion, 
anoid, postcss)
- separazione esplicita tra permesso RBAC di preview (ttachments.read) e permesso RBAC di download (ttachments.download)

### Changed
- aggiornati pacchetti frontend critici (`react-router-dom`, `axios`, `react-hook-form`, `eslint`, `typescript-eslint` e correlati)
- aggiornati pacchetti backend/transitivi Laravel con riallineamento di `guzzlehttp/guzzle`, `guzzlehttp/psr7`, `league/commonmark` e dipendenze correlate
- anteprima documenti browser limitata a formati sicuri/gestibili inline; i fogli Excel restano scaricabili ma non piÃ¹ renderizzati lato client

### Fixed
- eliminato il percorso di preview XLS/XLSX che dipendeva da librerie con advisory aperti`r`n- introdotto parser sicuro server-side per `xlsx` con audit dedicato di preview strutturata
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
- moduli operativi per minori, uscite, attivitï¿½, avvicinamenti, diario educativo, messaggistica interna e turni/timesheet
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
