# FamilyHub Security Baseline v0.1

## Baseline obbligatoria

- TLS end-to-end in staging e produzione
- MFA obbligatoria per `SUPER_ADMIN`, `DIRETTORE`, `COORDINATORE`, `PSICOLOGO`
- password hashing con `Argon2id`
- session timeout e revoca sessioni
- rate limiting su login, ricerca, export, download
- audit trail per accessi, visualizzazioni, modifiche, cancellazioni, export
- pseudonimizzazione nei log applicativi
- cifratura applicativa per campi ultra-sensibili
- separazione dei dati per `struttura_id`
- principle of least privilege su utenti, container e rete

## Dati da proteggere con priorità massima

- dati identificativi dei minori
- profili clinici e psico-educativi
- documenti giudiziari
- referti, farmaci, allegati sanitari
- log di accesso e storico modifiche

## Misure applicative

- policy centralizzate Laravel per ogni risorsa
- validazione forte di input e file upload
- nessun file servito da directory pubblica
- URL firmate a scadenza breve per i download
- export PDF/CSV tracciati in audit
- separazione forte tra ruolo `ADMIN_IT` e dati minori

## Misure infrastrutturali

- DB e Redis non esposti pubblicamente
- WAF davanti al reverse proxy
- host Linux hardened in staging/prod
- backup cifrati e test di restore
- monitoraggio accessi amministrativi

## Misure di sviluppo

- niente dati reali in locale
- secret fuori dal repository
- pipeline con test, static analysis e vulnerability scan
- review obbligatoria per codice che tocca auth, permessi, export, audit
