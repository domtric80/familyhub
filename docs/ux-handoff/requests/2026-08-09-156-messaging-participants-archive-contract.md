# Handoff UX/API — Messaggistica interna: partecipanti, filtri e archiviazione

Data: 2026-08-09  
Area: `Team > Messaggistica interna`  
Priorità: alta  
Tipo richiesta: aggiornamento contratto UI su backend esistente

## 1. Obiettivo del delta

Questo handoff aggiorna il modulo `Messaggistica interna cifrata` con tre estensioni backend già disponibili:

- metadati ruolo nei partecipanti selezionabili
- filtri lista su `topic` e `archived`
- azione esplicita di archiviazione conversazione

In più, viene irrigidita una regola importante:

- per i thread di tipo `minor`, **tutti i partecipanti selezionati** devono avere **assegnazione attiva al minore** al momento della creazione

Il frontend non deve aggirare né simulare questa logica.

---

## 2. Endpoint aggiornati / disponibili

### 2.1 Lista conversazioni

- `GET /api/internal-messages/threads`

Filtri supportati:

- `facility_id`
- `minor_id`
- `thread_type` = `facility | minor`
- `topic`
- `archived` = `true | false`

Regola operativa:

- se `archived` non viene passato, il backend restituisce **solo conversazioni non archiviate**
- se `archived=true`, il backend restituisce **solo archiviate**
- se `archived=false`, il backend restituisce **solo non archiviate**

### 2.2 Opzioni partecipanti

- `GET /api/internal-messages/options/participants`

Query:

- `facility_id` obbligatorio
- `minor_id` opzionale

Nuovi campi per ogni utente in risposta:

- `display_name`
- `role_code`
- `role_name`
- `is_minor_scoped`

Significato:

- `role_code` / `role_name`: ruolo attivo dell’utente nella struttura selezionata
- `is_minor_scoped`: `true` solo se l’utente ha accesso attivo a quel minore nel filtro corrente

### 2.3 Archiviazione conversazione

- `POST /api/internal-messages/threads/{thread}/archive`

Response:

```json
{
  "message": "Conversazione archiviata.",
  "thread": {
    "id": 14,
    "archived_at": "2026-08-09T19:04:00+02:00"
  }
}
```

---

## 3. Regole backend vincolanti

## 3.1 Thread di struttura (`facility`)

- `minor_id` assente
- partecipanti appartenenti alla struttura

## 3.2 Thread di minore (`minor`)

- `minor_id` obbligatorio
- il minore deve appartenere alla struttura selezionata
- il creatore deve avere accesso attivo al minore
- **ogni partecipante selezionato** deve avere accesso attivo al minore

Se questa regola non è rispettata, il backend risponde:

- `422`
- errore su `participant_user_ids`

Messaggio atteso:

> Uno o più partecipanti non hanno accesso attivo al minore selezionato.

Il frontend deve mostrare questo errore in modo leggibile vicino al campo partecipanti.

---

## 4. Impatto UI richiesto

## 4.1 Pagina lista conversazioni

Aggiornare filtri con:

- `Struttura`
- `Tipo conversazione`
- `Minore`
- `Topic` (input o select libera, in base alla UX già impostata)
- `Archiviate`
  - `Solo attive`
  - `Solo archiviate`
  - `Tutte` opzionale solo se implementata come doppia chiamata o stato esplicito

Nota:

- per semplicità backend, il filtro raccomandato è binario `archiviate sì/no`

## 4.2 Drawer / modal nuova conversazione

Nel multiselect partecipanti mostrare per ogni voce:

- nome visualizzato
- email
- ruolo in struttura (`role_name`)

Esempio label:

> Rossi Mario — Educatore — mario.rossi@familyhub.local

Se è selezionato un minore:

- i partecipanti devono provenire da `GET .../options/participants?facility_id=X&minor_id=Y`
- non usare dataset struttura “grezzo”

## 4.3 Azione archivia

Ogni thread in lista/dettaglio può esporre l’azione:

- `Archivia conversazione`

Comportamento richiesto:

- conferma utente
- chiamata `POST /api/internal-messages/threads/{thread}/archive`
- refresh lista
- il thread sparisce dalla vista standard se il filtro non include archiviate

---

## 5. Comportamenti vietati lato frontend

Il frontend **non deve**:

- inventare chi può partecipare a un thread minore
- riusare la lista utenti struttura quando il thread è `minor`
- lasciare visibili thread archiviati come se fossero attivi senza distinguerli
- simulare archivio locale senza refresh backend

---

## 6. Checklist QA UX

- [ ] selezionando `facility` senza minore, la lista partecipanti mostra utenti struttura con ruolo
- [ ] selezionando `minor`, la lista partecipanti mostra solo utenti con accesso attivo a quel minore
- [ ] errore `422 participant_user_ids` viene mostrato in modo leggibile
- [ ] archiviazione rimuove il thread dalla lista standard
- [ ] filtro `archived=true` mostra i thread archiviati
- [ ] filtro `topic` restringe correttamente la lista

---

## 7. Sorgenti da leggere

- `docs/api/openapi.yaml`
- `backend/app/Http/Controllers/Api/InternalMessageController.php`
- `backend/app/Http/Requests/InternalMessages/StoreInternalMessageThreadRequest.php`
- `backend/tests/Feature/InternalMessageApiTest.php`

