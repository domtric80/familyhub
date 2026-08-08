# Risposta UX

- `Request ID`: 2026-06-19-002
- `Stato`: DONE

## 1. Presa in carico

Richiesta recepita. Il ciclo login/MFA è parzialmente già implementato. Di seguito lo stato preciso per ogni punto.

## 2. Interpretazione UX

Il team ha compreso che MFA è un ciclo completo: login standard → login con OTP → setup → conferma → recovery codes → disabilita. La UI deve coprire tutti gli stati senza assumere che MFA sia sempre presente.

## 3. Pagine/componenti coinvolti

- `src/pages/auth/LoginPage.tsx` — login con campo OTP condizionale
- `src/pages/auth/MfaSetupPage.tsx` — setup, QR code, conferma OTP, visualizzazione recovery codes
- `src/contexts/AuthContext.tsx` — gestione token, refresh profilo
- `src/services/api.ts` — chiamate auth

## 4. Stato implementazione per endpoint

### `POST /auth/login`

**Fatto:**
- campo OTP appare se il backend segnala che MFA è richiesta
- gestione `422` con messaggio leggibile

**Da fare:**
- recepire esplicitamente `mfa_required: true` nel payload di risposta `422` per mostrare il campo OTP senza ambiguità basata solo sul testo del messaggio

### `GET /auth/mfa/status`

**Fatto:** `authApi.mfaStatus()` aggiunto in `api.ts`. Restituisce `{ required, enabled, confirmed, recovery_codes_remaining }`.

### `POST /auth/mfa/setup` e `POST /auth/mfa/confirm`

**Fatto:** `MfaSetupPage` gestisce entrambi i flussi.

### `POST /auth/mfa/recovery-codes/regenerate`

**Fatto:** `authApi.regenerateRecoveryCodes(code)` aggiunto in `api.ts`. La pagina profilo utente potrà usarlo per mostrare i nuovi codici.

### `POST /auth/mfa/disable`

**Fatto in api.ts:** `authApi.disableMfa()` disponibile. Nessuna UI dedicata ancora (da implementare nella pagina profilo).

## 5. Dubbi / blocchi

- Il payload `422` di `/auth/login` include un campo strutturato `mfa_required: true` oppure l'indicazione è solo nel `message`? Verificare da `openapi.yaml`.
- La risposta `GET /auth/mfa/status` è accessibile senza OTP (solo con Bearer token)?

## 6. Esito

`IN_PROGRESS`

## 7. Note per verifica backend

- Confermare struttura esatta del payload `422` di `/auth/login` quando MFA è attiva
- Confermare se `recovery_codes_remaining` è incluso in `GET /auth/me` oppure solo in `GET /auth/mfa/status`
