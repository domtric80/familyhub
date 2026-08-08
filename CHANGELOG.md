# Changelog

Tutte le modifiche rilevanti di FamilyHub vengono tracciate in questo file.

Formato ispirato a Keep a Changelog e Semantic Versioning.

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
