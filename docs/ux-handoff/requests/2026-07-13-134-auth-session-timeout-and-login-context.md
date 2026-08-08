# Handoff UX/API 134 — Sessione autenticata e sessione pagina login

## Obiettivo

Rendere coerente il comportamento sicurezza richiesto:

1. sessione autenticata valida **fino a 8 ore massime**
2. sessione autenticata invalida dopo **60 minuti di inattività**
3. pagina login non riutilizzabile oltre **10 minuti** senza refresh

---

## Nuove regole backend

### 1. Sessione autenticata API

Ogni bearer token login:

- ha durata assoluta massima: `8 ore`
- scade per inattività: `60 minuti`

Comportamento:

- se l’utente continua a lavorare con richieste entro 60 minuti, la sessione resta valida
- anche se resta attivo, oltre 8 ore complessive il token viene invalidato
- alla prima chiamata successiva alla scadenza backend risponde `401`

Messaggi backend possibili:

- `Sessione scaduta per inattività oltre 60 minuti.`
- `Sessione scaduta: durata massima di 8 ore raggiunta.`

### 2. Sessione pagina login

La pagina login ora richiede un contesto temporaneo:

- endpoint: `GET /api/auth/login-context`
- il backend restituisce un token temporaneo valido `10 minuti`
- il token va inviato nel body del login come `login_context_token`

Se il token manca o è scaduto:

- backend risponde `419`
- messaggio: `Sessione login scaduta. Ricarica la pagina ed effettua nuovamente l’accesso.`

---

## Endpoint nuovi / modificati

### `GET /api/auth/login-context`

Risposta:

```json
{
  "token": "string",
  "issued_at": "2026-07-13T08:00:00Z",
  "expires_at": "2026-07-13T08:10:00Z"
}
```

### `POST /api/auth/login`

Body aggiornato:

```json
{
  "email": "utente@familyhub.local",
  "password": "******",
  "otp": "123456",
  "device_name": "browser ua",
  "login_context_token": "string"
}
```

Note:

- `otp` resta opzionale al primo step
- `login_context_token` è obbligatorio per il flusso UI reale

---

## Cosa deve fare il frontend

### Schermata login

Alla mount della pagina:

1. chiamare `GET /api/auth/login-context`
2. salvare `token`
3. disabilitare submit finché il token non è disponibile

Al submit login:

1. inviare sempre `login_context_token`
2. se arriva `419`
   - mostrare messaggio: `Sessione login scaduta. Ricarica la pagina e riprova.`
   - tornare allo step credenziali
   - rigenerare automaticamente un nuovo contesto login

### Gestione scadenza sessione autenticata

Se una chiamata API risponde `401`:

- eseguire logout locale
- redirect a `/login`
- opzionale ma consigliato: toast `Sessione scaduta`

---

## QA minimo richiesto a UX

### Caso A — login page scaduta

1. aprire `/login`
2. attendere oltre 10 minuti senza inviare
3. inserire credenziali
4. atteso:
   - backend `419`
   - UI mostra errore sessione login scaduta
   - UI rigenera contesto

### Caso B — sessione attiva ma non inattiva

1. login riuscito
2. usare il sistema con richieste periodiche < 60 min
3. atteso:
   - nessun logout anticipato

### Caso C — inattività

1. login riuscito
2. nessuna attività > 60 minuti
3. prima richiesta successiva
4. atteso:
   - `401`
   - ritorno a login

### Caso D — durata assoluta

1. login riuscito
2. attività continua anche senza periodi di inattività
3. superate 8 ore
4. atteso:
   - token invalidato
   - nuova autenticazione richiesta

