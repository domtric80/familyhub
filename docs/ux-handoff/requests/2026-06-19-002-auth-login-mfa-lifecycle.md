# Autenticazione · Login, stato MFA e recovery codes

- `Request ID`: 2026-06-19-002
- `Stato`: OPEN
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Contesto

Il backend ha formalizzato e ampliato il ciclo MFA:

- endpoint stato MFA
- endpoint rigenerazione recovery codes
- comportamento login con MFA documentato in modo esplicito

## 2. Impatto frontend

Il frontend deve poter supportare:

- verifica stato MFA utente autenticato
- wizard setup/conferma MFA
- rigenerazione recovery codes
- gestione stati errore login con MFA richiesta

## 3. Endpoint coinvolti

- `POST /auth/login`
- `GET /auth/mfa/status`
- `POST /auth/mfa/setup`
- `POST /auth/mfa/confirm`
- `POST /auth/mfa/recovery-codes/regenerate`
- `POST /auth/mfa/disable`

## 4. Comportamenti da recepire

### Login

Se MFA è attiva e confermata:

- senza OTP valida → `422`
- payload include `mfa_required: true`

### Stato MFA

Il frontend deve leggere:

- `required`
- `enabled`
- `confirmed`
- `recovery_codes_remaining`

### Rigenerazione recovery codes

Richiede OTP valida dell’utente già autenticato.

## 5. Stati UI da gestire

- login standard
- login che richiede OTP
- setup MFA in corso
- MFA confermata
- recovery codes mostrate
- recovery codes rigenerate
- MFA disabilitata

## 6. Errori da gestire

- `422 Credenziali non valide`
- `422 Codice MFA non valido o mancante`
- `422 Codice MFA non valido`
- `403 Utente disattivato`

## 7. Checklist UX team

- [ ] login con stato MFA previsto
- [ ] step OTP previsto
- [ ] schermata stato MFA prevista
- [ ] rigenerazione recovery codes prevista
- [ ] messaggi errore coerenti con backend

## 8. Richiesta di risposta UX

Creare risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-19-002-auth-login-mfa-lifecycle-response.md`

