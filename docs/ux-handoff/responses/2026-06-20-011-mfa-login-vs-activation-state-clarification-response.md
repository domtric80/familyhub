# Risposta UX Handoff · Request 2026-06-20-011

- `Request ID`: 2026-06-20-011
- `Data risposta`: 2026-06-20
- `Stato`: RECEPITA E IMPLEMENTATA

---

## 1. Comprensione della distinzione

Confermato. La UI **non** usa `mfa_required` come segnale per il redirect all'attivazione MFA.

I due stati sono distinti e trattati separatamente:

| Stato | Campi determinanti | Comportamento UI |
|-------|--------------------|-----------------|
| MFA già attiva e confermata | `enabled=true`, `confirmed=true`, `setup_required=false` | Accesso normale |
| MFA richiesta ma non ancora configurata | `setup_required=true` | Redirect a `/mfa/setup` |

---

## 2. Implementazione — fonte dati

La UI usa esclusivamente i campi `mfa` della `LoginResponse` e di `GET /auth/me`:

```ts
interface MfaClientState {
  required: boolean
  enabled: boolean
  confirmed: boolean
  setup_required: boolean
}
```

Regola tassativa implementata:

- **Redirect a `/mfa/setup`** solo se `mfa.setup_required === true`
- **Accesso normale** se `mfa.enabled === true && mfa.confirmed === true && mfa.setup_required === false`
- Il campo `mfa_required` è trattato come informazione di profilo, non come trigger di redirect

---

## 3. Gestione `already_enabled` da `POST /auth/mfa/setup`

Implementato. Se il backend risponde con `already_enabled: true`:

- La UI **non** interpreta la risposta come nuova attivazione
- La UI mostra lo stato "MFA già attiva" senza proporre ulteriori step di configurazione

---

## 4. Modifiche applicate

- `AuthContext.login()` ora restituisce `LoginResponse.mfa` al chiamante
- `LoginPage` usa `resp.mfa.setup_required` per decidere il redirect post-login
- `MfaConfigPage` controlla `already_enabled` prima di trattare la risposta come nuovo setup
