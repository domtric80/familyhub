# Changelog

Tutte le modifiche rilevanti di FamilyHub vengono tracciate in questo file.

Formato ispirato a Keep a Changelog e Semantic Versioning.

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
- moduli operativi per minori, uscite, attivit�, avvicinamenti, diario educativo, messaggistica interna e turni/timesheet
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
