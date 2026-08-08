# FamilyHub · Flusso autenticazione e MFA

## Obiettivo

Definire in modo operativo il comportamento backend del login e della Multi-Factor Authentication,
così che backend, UX team e QA lavorino sullo stesso contratto.

## Stato attuale

Endpoint coinvolti:

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /auth/mfa/status`
- `POST /auth/mfa/setup`
- `POST /auth/mfa/confirm`
- `POST /auth/mfa/recovery-codes/regenerate`
- `POST /auth/mfa/disable`

Specifica ufficiale:

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## Regole backend

### Login

Input:

- `email`
- `password`
- `device_name`
- `otp` opzionale

Comportamento:

1. se email/password non combaciano → `422 Credenziali non valide`
2. se utente disattivato → `403 Utente disattivato`
3. se MFA è confermata ed attiva:
   - senza OTP valida → `422` con `mfa_required: true`
   - con OTP valida → login consentito

### MFA status

Endpoint:

- `GET /auth/mfa/status`

Restituisce:

- `required`
- `enabled`
- `confirmed`
- `recovery_codes_remaining`

### Setup MFA

Endpoint:

- `POST /auth/mfa/setup`

Restituisce:

- `secret`
- `otp_auth_url`
- `recovery_codes`
- `confirmed=false`

Nota:

- lo stato `mfa_required` viene attivato in preparazione, ma l’enforcement reale avviene solo dopo conferma

### Conferma MFA

Endpoint:

- `POST /auth/mfa/confirm`

Richiede:

- `code` OTP a 6 cifre

Effetto:

- marca MFA come confermata
- da quel momento il login richiede OTP valida

### Rigenerazione recovery codes

Endpoint:

- `POST /auth/mfa/recovery-codes/regenerate`

Richiede:

- `code` OTP valido

Restituisce:

- nuovo set di `recovery_codes`

### Disattivazione MFA

Endpoint:

- `POST /auth/mfa/disable`

Effetto:

- pulisce secret, recovery codes e conferma
- disabilita enforcement MFA

## Regole QA

Da verificare sempre:

- login senza MFA attiva
- login con MFA attiva e OTP mancante
- login con MFA attiva e OTP valida
- status MFA coerente dopo setup/confirm/disable
- recovery codes rigenerate solo con OTP valida

## Supporto operativo

Per ripristino accesso amministratore esiste il comando:

- `php artisan familyhub:reset-admin-access --disable-mfa`

Uso tipico:

- reset password amministratore
- riattivazione account
- disattivazione MFA in caso di lockout operativo

