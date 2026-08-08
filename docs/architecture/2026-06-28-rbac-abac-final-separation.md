# FamilyHub · Separazione finale RBAC / ABAC

Data: 2026-06-28
Stato: approvata per implementazione

## 1. Regola definitiva

- **RBAC** governa accesso al sistema e ai dati applicativi del database
- **ABAC** governa accesso documentale

## 2. RBAC

RBAC continua a decidere:

- accesso al software
- struttura in cui l'utente opera
- permessi CRUD sui moduli
- visibilità e modifica dei dati del minore nel database

Quindi per leggere o modificare il minore servono:

1. ruolo attivo in `user_facility_roles`
2. permesso corretto nella struttura
3. assegnazione attiva al minore se l'utente non è privilegiato

Permessi applicati:

- `minors.read`
- `minors.update`
- `minor_profiles.read`
- `minor_profiles.update`
- altri permessi modulo-specifici coerenti

## 3. ABAC

ABAC viene applicato ai documenti.

Attributi usati:

- classificazione documento
- policy del sito per la classificazione
- ruolo utente nella struttura
- assegnazione attiva al minore

Formula:

`ALLOW_DOCUMENT = RBAC documentale valido AND ruolo ammesso per classificazione AND assegnazione attiva al minore`

## 4. Assegnazione minore

L'assegnazione minore è solo un legame operativo:

- `user_id`
- `minor_id`
- `facility_id`
- periodo validità
- stato attivo
- note

Non contiene più:

- ruolo duplicato
- livello dati duplicato

## 5. UX obbligatoria

La UX deve riflettere questo modello:

- nessun campo `ruolo assegnazione`
- nessun campo `livello accesso`
- gestione singola dalla scheda minore
- gestione bulk dalla scheda utente e dalla scheda minore

## 6. Compatibilità tecnica

I campi legacy `assignment_role_code` e `access_level` restano temporaneamente nel database solo per compatibilità tecnica, ma:

- non vengono più richiesti in input
- non devono più comparire nel frontend
- non devono più essere usati per autorizzazione
