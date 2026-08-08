# UX Request 074 — Qualifiche operatori solo da anagrafica

- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `Backend già aggiornato`: `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\Admin\StaffMemberController.php`
- `Nuova anagrafica`: `GET/POST/PUT/DELETE /api/admin/staff-qualifications`

## Obiettivo

Eliminare `qualification` come testo libero dall’anagrafica operatori / educatori.

Da ora il backend usa come campo corretto:

- `qualification_code`

con relazione:

- `qualification_lookup`

e label pronta UI:

- `qualification_label`

Il vecchio `qualification` resta accettato solo come alias legacy backend.

## Lookup da usare

Per tutte le select/modali:

- `GET /api/lookups/staff-qualifications`

Per la pagina amministrativa della nuova anagrafica qualifiche:

- `GET /api/admin/staff-qualifications`
- `POST /api/admin/staff-qualifications`
- `GET /api/admin/staff-qualifications/{staff_qualification}`
- `PUT /api/admin/staff-qualifications/{staff_qualification}`
- `DELETE /api/admin/staff-qualifications/{staff_qualification}`

## Impatti UI obbligatori

### 1. Pagina `Educatori` / `Operatori`

Nel form create/update:

- rimuovere input text `qualification`
- usare select obbligatoriamente da lookup
- inviare `qualification_code`

In tabella elenco / dettaglio:

- mostrare `qualification_label`
- fallback tecnico `qualification_lookup.name`

### 2. Wizard creazione account educatore

Nel payload `staff_member.*`:

- usare `staff_member.qualification_code`
- non usare più `staff_member.qualification` nei nuovi componenti

### 3. Nuova pagina admin `Qualifiche operatori`

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

- se la qualifica è già usata da operatori, il backend risponde `409`

## Esempio payload corretto

```json
{
  "facility_id": 1,
  "employee_code": "EDU-001",
  "first_name": "Mario",
  "last_name": "Rossi",
  "qualification_code": "EDUCATORE",
  "status": "active"
}
```

## Nota compatibilità

Il backend continua a tollerare `qualification` per non rompere componenti vecchi, ma UX deve considerarlo deprecato immediatamente.
