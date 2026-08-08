# UX Request 075 — Stati operatori solo da anagrafica

- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `Backend già aggiornato`: `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\Admin\StaffMemberController.php`
- `Nuova anagrafica`: `GET/POST/PUT/DELETE /api/admin/staff-statuses`

## Obiettivo

Eliminare `status` come testo libero dall’anagrafica operatori / educatori.

Da ora il backend usa come campo corretto:

- `status_code`

con relazione:

- `status_lookup`

e label pronta UI:

- `status_label`

Il vecchio `status` resta accettato solo come alias legacy backend.

## Lookup da usare

Per tutte le select/modali:

- `GET /api/lookups/staff-statuses`

Per la pagina amministrativa della nuova anagrafica stati operatore:

- `GET /api/admin/staff-statuses`
- `POST /api/admin/staff-statuses`
- `GET /api/admin/staff-statuses/{staff_status}`
- `PUT /api/admin/staff-statuses/{staff_status}`
- `DELETE /api/admin/staff-statuses/{staff_status}`

## Impatti UI obbligatori

### 1. Pagina `Educatori` / `Operatori`

Nel form create/update:

- rimuovere input text `status`
- usare select obbligatoriamente da lookup
- inviare `status_code`

In tabella elenco / dettaglio:

- mostrare `status_label`
- fallback tecnico `status_lookup.name`

### 2. Wizard creazione account educatore

Nel payload `staff_member.*`:

- usare `staff_member.status_code`
- non usare più `staff_member.status` nei nuovi componenti

### 3. Nuova pagina admin `Stati operatori`

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

- se lo stato è già usato da operatori, il backend risponde `409`

## Esempio payload corretto

```json
{
  "facility_id": 1,
  "employee_code": "EDU-001",
  "first_name": "Mario",
  "last_name": "Rossi",
  "qualification_code": "EDUCATORE",
  "status_code": "ACTIVE"
}
```

## Nota compatibilità

Il backend continua a tollerare `status` per non rompere componenti vecchi, ma UX deve considerarlo deprecato immediatamente.
