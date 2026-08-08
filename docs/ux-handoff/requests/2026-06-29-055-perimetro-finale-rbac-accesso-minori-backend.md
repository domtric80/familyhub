# Handoff UX/API — Perimetro finale RBAC + accesso minori

Data: 2026-06-29  
Priorità: alta  
Ambito: UX / QA / allineamento finale comportamento backend

## 1. Obiettivo

Questo documento riassume il comportamento **definitivo** del backend per tutte le funzioni operative collegate ai minori:

- scheda minore
- storico
- profilo
- contatti
- documenti
- attività
- uscite
- assegnazioni minore

## 2. Regola generale

Per quasi tutte le operazioni sui minori il backend applica due livelli:

1. **RBAC**
   - il ruolo deve avere il permesso corretto

2. **Assegnazione attiva al minore**
   - l’utente deve risultare assegnato al minore
   - salvo ruoli privilegiati

### Assegnazione attiva = condizioni

- `is_active = true`
- `valid_from <= oggi`
- `valid_to is null OR valid_to >= oggi`

### Ruoli privilegiati

Questi ruoli possono operare senza assegnazione puntuale:

- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

## 3. Matrice semantica backend

### 3.1 Lista minori

- endpoint: `GET /api/minors`
- permesso: `minors.read`
- visibilità:
  - ruoli privilegiati → tutti i minori della struttura/ambito
  - altri ruoli → solo minori assegnati

### 3.2 Scheda minore completa

- endpoint: `GET /api/minors/{minor}`
- permesso richiesto: `minor_profiles.read`
- motivo:
  - la risposta contiene dati anagrafici + profilo + contatti + documenti visibili
  - quindi è considerata vista sensibile, non semplice lettura base

### 3.3 Storico minore

- endpoint: `GET /api/minors/{minor}/history`
- permesso richiesto: `minor_profiles.read`
- motivo:
  - lo storico è considerato dato sensibile

### 3.4 Profilo minore

- update profilo:
  - `PUT/PATCH /api/minors/{minor}/profile`
  - permesso: `minor_profiles.update`

### 3.5 Contatti minore

- crea contatto:
  - `POST /api/minors/{minor}/contacts`
  - permesso: `minor_contacts.create`

- aggiorna contatto:
  - `PUT/PATCH /api/minors/{minor}/contacts/{contact}`
  - permesso: `minor_contacts.update`

Nota importante:  
il backend è stato riallineato per non richiedere più `minor_profiles.update` durante la gestione contatti.

### 3.6 Documenti minore

- upload:
  - permesso: `attachments.upload`
- preview/download:
  - permesso: `attachments.read`
- in più:
  - regole ABAC/classificazione documentale
  - assegnazione attiva al minore

### 3.7 Attività

- lista/dettaglio:
  - `minor_activities.read`
- creazione:
  - `minor_activities.create`
- modifica:
  - `minor_activities.update`
- eliminazione:
  - `minor_activities.delete`

### 3.8 Uscite

- lista/dettaglio:
  - `minor_exits.read`
- creazione:
  - `minor_exits.create`
- modifica/transizioni:
  - `minor_exits.update`
- eliminazione:
  - `minor_exits.delete`

### 3.9 Assegnazioni minore

- elenco assegnazioni:
  - `minor_user_assignments.read`
- creazione:
  - `minor_user_assignments.create`
- aggiornamento/bulk-sync:
  - `minor_user_assignments.update`
- revoca:
  - `minor_user_assignments.revoke`

## 4. Contratti API aggregati

### 4.1 Assegnazioni per minore

- `GET /api/admin/minors/{minor}/assigned-users`
- risposta:
  - `minor`
  - `assignments[]`

### 4.2 Assegnazioni per utente

- `GET /api/admin/users/{user}/assigned-minors`
- risposta:
  - `user`
  - `assignments[]`

Il frontend deve leggere **sempre** `response.assignments`.

## 5. Implicazioni pratiche per UX

### 5.1 Messaggi errore

Quando il backend restituisce `403`, il frontend dovrebbe distinguere dove possibile:

- permesso di ruolo mancante
- minore non assegnato
- documento non accessibile per ABAC/classificazione

Se non è possibile distinguere tecnicamente, usare formule esplicite ma neutrali:

- “Operazione non consentita: verifica permessi di ruolo e assegnazione al minore.”

### 5.2 Super Admin

Non usare `admin@familyhub.local` per collaudare i limiti operativi:

- è bootstrap user
- ha ruolo `SUPER_ADMIN`
- non rappresenta il comportamento degli operatori normali

### 5.3 Scheda minore

Poiché `GET /api/minors/{minor}` richiede `minor_profiles.read`, UX deve considerare la scheda completa come **vista sensibile**.

Conseguenza:
- un educatore assegnato può comparire nei flussi operativi
- ma non necessariamente può aprire tutta la scheda completa del minore

## 6. QA suggerito

- educatore assegnato con `minor_contacts.create` → crea contatto con successo
- educatore assegnato senza `minor_profiles.read` → non apre la scheda completa minore
- educatore assegnato con `minor_activities.create` → crea attività
- educatore non assegnato con `minor_activities.create` → `403`
- educatore assegnato con `minor_exits.create` → crea uscita
- educatore non assegnato con `minor_exits.create` → `403`
- pagina `Accesso al minore` coerente con `Assegnazioni Minori`

