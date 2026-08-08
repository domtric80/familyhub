# Handoff UX/API — Messaggistica interna: fix allineamento endpoint partecipanti

Data: 2026-07-05  
Area: `Team > Messaggistica interna`  
Priorità: alta  
Tipo: bugfix contratto frontend/backend

## Problema corretto

Durante i test funzionali la UI mostrava:

- `Endpoint partecipanti non ancora disponibile sul backend.`

La causa non era l’assenza dell’endpoint backend, ma un **disallineamento del client frontend**:

1. il frontend chiamava il path errato  
   - errato: `GET /api/internal-messages/participant-options`
   - corretto: `GET /api/internal-messages/options/participants`
2. il frontend si aspettava un array diretto, mentre il backend restituisce un oggetto:
   - `{ facility_id, minor_id, users: [...] }`
3. il frontend usava anche un path errato per la presa visione thread:
   - errato: `POST /api/internal-messages/threads/{id}/read`
   - corretto: `POST /api/internal-messages/threads/{id}/mark-read`

## Contratto reale da usare

### Partecipanti nuova conversazione

- `GET /api/internal-messages/options/participants`

Query:

- `facility_id` obbligatorio
- `minor_id` opzionale

Response:

```json
{
  "facility_id": 1,
  "minor_id": 12,
  "users": [
    {
      "id": 5,
      "display_name": "Mario Rossi",
      "role_name": "Educatore"
    }
  ]
}
```

### Mark as read

- `POST /api/internal-messages/threads/{thread}/mark-read`

## Impatto UX

- La UI non deve più interpretare il 404 come “feature mancante” se il backend è aggiornato.
- La lista partecipanti va letta da `response.users`.
- Se il backend non risponde o è su versione precedente, mostrare messaggio neutro:
  - `Servizio partecipanti non disponibile o backend non aggiornato.`

## Nessun cambiamento di comportamento funzionale

Le regole modulo restano invariate:

- conversazione `facility` → utenti attivi della struttura
- conversazione `minor` → solo utenti con accesso attivo al minore
- cifratura lato backend
- audit su creazione/apertura/invio

## File backend di riferimento

- `C:\Projects\FamilyHUB\backend\routes\api.php`
- `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\InternalMessageController.php`

## File frontend corretti

- `C:\Projects\FamilyHUB\frontend\src\services\api.ts`
- `C:\Projects\FamilyHUB\frontend\src\pages\messaggi\MessaggiPage.tsx`
- `C:\Projects\FamilyHUB\frontend\src\types\index.ts`
