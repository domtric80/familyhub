# Handoff UX/API — Messaggistica interna cifrata v1

Data: 2026-07-03  
Area: `Team > Messaggistica interna`  
Priorità: alta  
Tipo richiesta: nuovo modulo operativo + contratto UI vincolante

## 1. Obiettivo

Introdurre una `messaggistica interna cifrata per team` con queste regole:

- conversazioni interne di struttura
- conversazioni interne collegate a un singolo minore
- testo cifrato lato backend prima del salvataggio database
- partecipanti espliciti
- enforcement su struttura, ruolo e assegnazione al minore
- audit su apertura conversazione, creazione conversazione e invio messaggio

Questa v1 **non** introduce:

- realtime websocket
- allegati in chat
- inoltro messaggi
- chat pubbliche aperte a tutta la struttura senza partecipanti definiti

## 2. Endpoint disponibili

### Lista conversazioni

- `GET /api/internal-messages/threads`

Filtri supportati:

- `facility_id`
- `minor_id`
- `thread_type` = `facility | minor`

Uso UX:

- lista principale conversazioni
- badge non letti
- filtro “solo conversazioni minore”

### Opzioni partecipanti

- `GET /api/internal-messages/options/participants`

Query obbligatorie/minime:

- `facility_id`

Query opzionale:

- `minor_id`

Regole:

- se passo solo `facility_id`, backend restituisce utenti attivi della struttura
- se passo anche `minor_id`, backend restituisce solo utenti della struttura che hanno accesso attivo a quel minore

### Crea conversazione

- `POST /api/internal-messages/threads`

### Dettaglio conversazione

- `GET /api/internal-messages/threads/{thread}`

### Invia messaggio

- `POST /api/internal-messages/threads/{thread}/messages`

### Marca come letto

- `POST /api/internal-messages/threads/{thread}/mark-read`

## 3. Modello conversazione

Campi dominio principali:

- `facility_id`
- `minor_id` nullable
- `thread_type`
- `subject`
- `topic`
- `participants[]`
- `messages[]`
- `last_message_at`
- `unread_count`

Valori `thread_type`:

- `facility` → conversazione team di struttura
- `minor` → conversazione riservata riferita a uno specifico minore

## 4. Regole backend da rispettare in UI

### 4.1 Conversazione `facility`

- `minor_id` deve essere assente
- il creatore deve avere permesso `internal_messages.create` sulla struttura
- tutti i partecipanti devono avere un ruolo attivo nella stessa struttura

### 4.2 Conversazione `minor`

- `minor_id` obbligatorio
- il minore deve appartenere alla struttura selezionata
- il creatore deve avere permesso `internal_messages.create`
- il creatore deve anche avere accesso attivo al minore
- il dettaglio conversazione è accessibile solo ai partecipanti
- per le conversazioni minore ogni partecipante deve risultare coerente con il perimetro del minore

### 4.3 Crittografia

Il frontend **non cifra** il contenuto.

Il frontend invia testo normale:

- `message_body` in creazione thread
- `body` in invio messaggio

Il backend:

- cifra prima del salvataggio
- restituisce il testo già decifrato in response

### 4.4 Audit

Il frontend non deve simulare log.

Il backend registra audit per:

- creazione conversazione
- apertura conversazione
- invio messaggio

## 5. Payload create thread

Request:

```json
{
  "facility_id": 1,
  "minor_id": 12,
  "thread_type": "minor",
  "subject": "Confronto equipe su rientro famigliare",
  "topic": "Allineamento operativo",
  "participant_user_ids": [7, 11, 18],
  "message_body": "Primo messaggio della conversazione."
}
```

Note:

- `minor_id` va inviato solo quando `thread_type = minor`
- il creatore viene aggiunto automaticamente ai partecipanti dal backend

## 6. Payload send message

Request:

```json
{
  "body": "Aggiornamento operativo sul turno di oggi."
}
```

## 7. Response thread

Campi minimi su cui UX può contare:

- `id`
- `facility_id`
- `minor_id`
- `thread_type`
- `subject`
- `topic`
- `last_message_at`
- `archived_at`
- `unread_count`
- `facility`
- `minor`
- `participants`
- `latest_message`
- `messages`
- `created_by`
- `updated_by`

## 8. Layout UX richiesto

### 8.1 Pagina lista conversazioni

Blocchi obbligatori:

1. **Header pagina**
   - titolo sezione
   - pulsante `Nuova conversazione`
   - pulsante `Informazioni`

2. **Filtri**
   - struttura
   - tipo conversazione (`Tutte`, `Di struttura`, `Per minore`)
   - minore (abilitato solo se coerente col filtro/struttura)

3. **Lista thread**
   - oggetto
   - struttura
   - minore opzionale
   - numero partecipanti
   - ultimo messaggio / ultima attività
   - badge non letti
   - icona o badge `Struttura` / `Minore`

### 8.2 Drawer/modal nuova conversazione

Campi obbligatori:

- struttura
- tipo conversazione
- minore (solo se `thread_type = minor`)
- oggetto
- topic opzionale
- selezione partecipanti multipla
- testo primo messaggio

Regole UX:

- se `thread_type = facility`, nascondere il campo minore
- se `thread_type = minor`, il campo minore diventa obbligatorio
- cambiare dataset partecipanti quando cambia `facility_id`
- restringere ulteriormente i partecipanti quando viene selezionato `minor_id`

### 8.3 Vista dettaglio conversazione

Blocchi obbligatori:

- header con oggetto, badge tipo e struttura
- box meta con minore collegato se presente
- elenco partecipanti
- timeline messaggi
- composer nuovo messaggio
- azione `Segna come letto` se utile nel layout

## 9. Copy funzionale consigliato

### Tipo conversazione

- `facility` → `Conversazione di struttura`
- `minor` → `Conversazione riservata sul minore`

### Empty state lista

> Non risultano ancora conversazioni per i filtri selezionati.

### Empty state dettaglio

> Nessun messaggio presente in questa conversazione.

### Nota sicurezza

> I messaggi vengono salvati in forma cifrata e sono visibili solo agli utenti autorizzati.

## 10. Error handling UX

### `403`

Mostrare messaggi lato UI chiari:

- “Non hai accesso a questa conversazione.”
- “Non puoi avviare una conversazione su questo minore.”
- “Non puoi inviare messaggi in questa conversazione.”

### `422`

Associare errori ai campi:

- struttura
- minore
- partecipanti
- oggetto
- testo messaggio

Non mostrare raw exception o payload tecnico.

## 11. Regole importanti per UX

- non introdurre campi “ruolo conversazione” manuali
- non introdurre permessi frontend inventati
- non dedurre lato client chi può vedere un thread: usare il backend
- non mostrare mai riferimenti a crittografia tecnica o chiavi
- non simulare “utente online/offline”

## 12. Sorgenti

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\InternalMessageController.php`
- `C:\Projects\FamilyHUB\backend\app\Services\InternalMessageAccessService.php`
- `C:\Projects\FamilyHUB\backend\config\internal_messages.php`
