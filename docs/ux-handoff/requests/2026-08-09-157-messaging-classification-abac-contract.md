# UX Handoff — 2026-08-09 — Messaggistica interna classificata ABAC

## Contesto
Backend esteso per allineare la `Messaggistica interna cifrata` alla stessa matrice ABAC già usata per documenti e note sensibili.

## Obiettivo
Ogni thread può ora essere associato a una classificazione documentale:

- `internal`
- `restricted`
- `clinical`
- `judicial`

Il backend usa queste classificazioni per:
- filtrare i partecipanti selezionabili
- consentire o negare apertura thread
- validare la creazione thread

## Retrocompatibilità
Se il frontend **non invia** `classification_code`, il backend usa:

- `internal`

Questo evita regressioni sulla UI attuale mentre UX completa l’integrazione.

## Delta API

### 1) Creazione thread
`POST /api/internal-messages/threads`

Nuovo campo request:
- `classification_code` opzionale in questa fase di transizione

Comportamento:
- se omesso → backend salva `internal`
- se presente → backend valida che il creatore e tutti i partecipanti siano autorizzati a quella classificazione

Nuovi errori possibili:
- `classification_code`
  - `La classificazione selezionata non è consentita per il tuo profilo o per il contesto scelto.`
- `participant_user_ids`
  - `Uno o più partecipanti non sono autorizzati alla classificazione selezionata.`

### 2) Lista thread
`GET /api/internal-messages/threads`

Nuovo filtro opzionale:
- `classification_code`

### 3) Opzioni partecipanti
`GET /api/internal-messages/options/participants`

Nuovo query param opzionale:
- `classification_code`

Se valorizzato:
- il backend restituisce solo utenti autorizzati a quella classificazione

Se omesso:
- comportamento invariato rispetto alla versione corrente

### 4) Payload thread
Ogni thread ora espone:
- `classification_code`
- `classification_label`
- `document_classification`

## Regole backend

### Regola 1 — permesso modulo
Resta necessario il permesso RBAC:
- `internal_messages.read`
- `internal_messages.create`
- `internal_messages.update`

### Regola 2 — classificazione
La visibilità dipende anche dalla classificazione del thread.

Esempio:
- un `EDUCATORE` può leggere `internal`
- non può leggere un thread `clinical` se il ruolo non è autorizzato in policy documentale

### Regola 3 — contesto minore
Per thread di tipo `minor`, oltre alla classificazione:
- serve assegnazione attiva al minore

## Impatto UI richiesto

### Fase 1 — immediata, senza bloccare UX
La UI può continuare a funzionare anche senza il nuovo campo, perché il backend userà `internal`.

### Fase 2 — da integrare appena possibile
Nel modal/drawer `Nuova conversazione` aggiungere:

- select `Classificazione`

Valori da caricare da:
- `GET /api/lookups/document-classifications`
  oppure
- `GET /api/auth/me` se la UI usa già le capabilities utente

### Comportamento consigliato
Quando cambia `classification_code`:
- ricaricare i partecipanti con
  - `GET /api/internal-messages/options/participants?facility_id=X&minor_id=Y&classification_code=Z`
- pulire la selezione partecipanti esistente

### Lista / dettaglio thread
Mostrare badge classificazione:
- `Interno`
- `Riservato`
- `Clinico`
- `Giudiziario`

## Checklist QA UX
- [ ] creazione thread senza `classification_code` continua a funzionare (`internal`)
- [ ] cambiando classificazione, i partecipanti disponibili vengono rifiltrati
- [ ] un partecipante non autorizzato non è più selezionabile se il filtro classificazione è attivo
- [ ] thread `clinical` non è leggibile da ruolo non autorizzato
- [ ] badge classificazione visibile in lista e dettaglio

## File backend di riferimento
- `backend/app/Http/Controllers/Api/InternalMessageController.php`
- `backend/app/Http/Requests/InternalMessages/StoreInternalMessageThreadRequest.php`
- `backend/app/Services/InternalMessageAccessService.php`
- `backend/tests/Feature/InternalMessageApiTest.php`
