# UX Request 076 — Stati strutture solo da anagrafica

- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `Backend già aggiornato`: `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\Admin\FacilityController.php`
- `Nuova anagrafica`: `GET/POST/PUT/DELETE /api/admin/facility-statuses`

## Obiettivo

Eliminare `status` come testo libero dalla pagina `Strutture`.

Da ora il backend usa come campo corretto:

- `status_code`

con relazione:

- `status_lookup`

e label pronta UI:

- `status_label`

Il vecchio `status` resta accettato solo come alias legacy backend.

## Lookup da usare

Per tutte le select/modali:

- `GET /api/lookups/facility-statuses`

Per la pagina amministrativa della nuova anagrafica stati struttura:

- `GET /api/admin/facility-statuses`
- `POST /api/admin/facility-statuses`
- `GET /api/admin/facility-statuses/{facility_status}`
- `PUT /api/admin/facility-statuses/{facility_status}`
- `DELETE /api/admin/facility-statuses/{facility_status}`

## Impatti UI obbligatori

### 1. Pagina `Strutture`

Nel form create/update:

- rimuovere input text `status`
- usare select obbligatoriamente da lookup
- inviare `status_code`

In tabella elenco / dettaglio:

- mostrare `status_label`
- fallback tecnico `status_lookup.name`

### 2. Nuova pagina admin `Stati struttura`

Campi:

- `code`
- `name`
- `description`
- `sort_order`
- `is_active`

Azioni:

- elenco
- crea
- modifica
- elimina

Vincolo:

- se lo stato è già usato da strutture, il backend risponde `409`

## Esempio payload corretto

```json
{
  "organization_id": 1,
  "code": "FH-ROMA-01",
  "name": "FamilyHub Roma Demo",
  "address_line": "Via Demo 1",
  "city_id": 123,
  "postal_code": "00100",
  "capacity": 20,
  "status_code": "ACTIVE"
}
```

## Nota compatibilità

Il backend continua a tollerare `status` per non rompere componenti vecchi, ma UX deve considerarlo deprecato immediatamente.
