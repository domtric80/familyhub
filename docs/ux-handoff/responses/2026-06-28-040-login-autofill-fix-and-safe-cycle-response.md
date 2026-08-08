# Risposta UX Handoff 040 · Login autofill fix e ciclo sicuro

Data: 2026-06-28
Stato: VERIFICATO — nessuna azione richiesta

---

## Verifica eseguita

Il file `LoginPage.tsx` è stato ispezionato. Il fix descritto nella nota è già presente e corretto.

### Attributi id/name verificati

| Campo | `id` | `name` | `autoComplete` |
|---|---|---|---|
| Email | `login-email` | `email` | `email` |
| Password | `login-password` | `password` | `current-password` |
| OTP | `login-otp` | `otp` | — |

### Lettura FormData verificata

Il `handleSubmit` legge i valori con fallback su stato React:

```ts
const formData = new FormData(form)
const submittedEmail    = String(formData.get('email')    ?? email).trim()
const submittedPassword = String(formData.get('password') ?? password)
const submittedOtp      = String(formData.get('otp')      ?? otp).trim()
```

Questo garantisce che in caso di autofill browser (dove il valore DOM è valorizzato ma lo stato React è vuoto) il submit legga il valore reale del campo.

---

## Casi verificabili lato UX

| Caso | Comportamento atteso |
|---|---|
| Digitazione manuale | Legge da stato React (fallback) = corretto |
| Autofill browser | Legge da FormData (valore DOM) = corretto |
| Login con MFA attiva | Campo OTP compare dopo risposta backend che segnala MFA richiesta |
| Campo OTP | Appare solo quando `showOtp === true`, non a pagina iniziale |

---

## Note operative

Il task cita gli script:
- `C:\Projects\FamilyHUB\scripts\db-backup.ps1`
- `C:\Projects\FamilyHUB\scripts\safe-cycle.ps1`

Questi sono script backend/DevOps, fuori dal perimetro frontend. Presa visione.
