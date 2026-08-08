# Handoff UX/API — Modulo Attività: RBAC e accesso ai minori

Data: 2026-06-29  
Priorità: alta  
Ambito: UX / QA / comprensione comportamento backend

## 1. Contesto

È stato riallineato il backend del modulo `Attività` per usare la stessa logica già corretta su `Uscite`:

- **RBAC** sui permessi del modulo
- **assegnazione attiva al minore** come secondo livello di controllo
- eccezione per i soli ruoli privilegiati configurati lato backend

In precedenza il controller `Attività` usava controlli misti basati su `minors.read` / `minors.update`, mentre le route erano già protette con permessi `minor_activities.*`. Questo rendeva il comportamento ambiguo nei test.

## 2. Regole corrette backend

### 2.1 Permessi usati dal modulo Attività

Le operazioni ora seguono questa mappa:

- elenco attività → `minor_activities.read`
- dettaglio attività → `minor_activities.read`
- creazione attività → `minor_activities.create`
- modifica attività → `minor_activities.update`
- eliminazione attività → `minor_activities.delete`

### 2.2 Regola di accesso al minore

Per vedere o operare su un’attività legata a un minore, il backend richiede:

1. il permesso RBAC corretto per la struttura
2. una **assegnazione attiva** al minore

Condizioni assegnazione attiva:
- `is_active = true`
- `valid_from <= oggi`
- `valid_to is null OR valid_to >= oggi`

### 2.3 Ruoli privilegiati

Possono vedere/operare senza assegnazione puntuale al minore:

- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

## 3. Impatto per UX

### 3.1 Cosa non deve fare il frontend

UX non deve assumere che il solo permesso di ruolo basti per creare/modificare attività.

Un utente può avere:
- `minor_activities.create = true`

ma ricevere comunque `403` se:
- non è assegnato al minore
- non è in ruolo privilegiato

### 3.2 Messaggi consigliati

Quando il backend risponde `403` sulle attività, evitare messaggi troppo generici.  
Meglio distinguere:

- **permesso mancante**
  - “Non hai il permesso per gestire le attività.”

- **minore non assegnato**
  - “Non puoi operare su questo minore perché non risulti assegnato.”

Se il frontend non riesce a distinguere le due cause dal payload, usare almeno una formula neutra che includa entrambi gli aspetti:

- “Operazione non consentita: verifica permessi di ruolo e assegnazione al minore.”

## 4. Comportamento atteso nelle pagine

### 4.1 Elenco attività

- deve mostrare solo attività dei minori visibili all’utente
- se un utente non ha accesso a un minore, non deve vedere neppure le sue attività in elenco

### 4.2 Form nuova attività

- la select dei minori deve essere intesa come elenco già filtrato dal backend / dai dati disponibili
- il fatto che il minore compaia nella select **non sostituisce** il controllo backend
- il backend resta autoritativo

### 4.3 Azioni riga

Pulsanti modifica/elimina:
- possono essere mostrati in base ai permessi UI
- ma il backend esegue comunque la validazione finale

## 5. Test QA suggeriti

### Caso A — educatore assegnato

- ruolo con `minor_activities.create`
- assegnazione attiva al minore
- atteso: `POST /api/activities` → `201`

### Caso B — educatore non assegnato

- ruolo con `minor_activities.create`
- nessuna assegnazione al minore
- atteso: `POST /api/activities` → `403`

### Caso C — ruolo privilegiato

- `COORDINATORE` o `DIRETTORE`
- nessuna assegnazione puntuale
- atteso: accesso consentito secondo i permessi RBAC del ruolo

## 6. Nota importante per i test UX

Non usare `admin@familyhub.local` per validare i limiti di accesso operativi:

- è utente bootstrap
- è associato a ruolo `SUPER_ADMIN`
- quindi non rappresenta il comportamento di un utente operativo normale

