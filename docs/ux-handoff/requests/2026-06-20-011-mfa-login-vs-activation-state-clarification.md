# MFA · distinzione obbligatoria tra MFA attiva e MFA da attivare

- `Request ID`: 2026-06-20-011
- `Stato`: OPEN
- `Priorità`: CRITICA
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Problema

La UI non deve trattare `mfa_required = true` come sinonimo di “utente da portare alla schermata di attivazione MFA”.

Esistono due stati diversi:

- MFA già attiva e confermata
- MFA richiesta ma setup non ancora completato

## 2. Fonte corretta da usare

Usare i nuovi campi:

- `LoginResponse.mfa`
- `GET /auth/me -> user.mfa`

Campi disponibili:

- `required`
- `enabled`
- `confirmed`
- `setup_required`

## 3. Regola UX tassativa

### Redirect a pagina attivazione MFA

Consentito solo se:

- `setup_required = true`

### Accesso normale all'applicazione

Consentito se:

- `enabled = true`
- `confirmed = true`
- `setup_required = false`

## 4. Regola su `POST /auth/mfa/setup`

Se MFA è già attiva:

- il backend risponde con `already_enabled = true`
- la UI non deve interpretare questa risposta come nuova attivazione da rifare
- la UI deve mostrare stato “MFA già attiva”

## 5. Risposta richiesta

Creare risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-20-011-mfa-login-vs-activation-state-clarification-response.md`
