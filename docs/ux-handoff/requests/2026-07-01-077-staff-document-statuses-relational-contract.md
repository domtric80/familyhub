# UX Request 077 — Stati documenti staff solo da anagrafica

- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `Backend già aggiornato`: `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\Admin\StaffMemberController.php`
- `Nuova anagrafica`: `GET/POST/PUT/DELETE /api/admin/staff-document-statuses`

## Obiettivo

Eliminare `status` come testo libero dai documenti dello staff.

Da ora il backend usa come campo corretto:

- `status_code`

con relazione:

- `status_lookup`

e label pronta UI:

- `status_label`

Il vecchio `status` resta accettato solo come valore legacy di retrocompatibilità backend/database.

## Lookup da usare

Per tutte le select/modali relative ai documenti staff:

- `GET /api/lookups/staff-document-statuses`

Per la pagina amministrativa della nuova anagrafica stati documento staff:

- `GET /api/admin/staff-document-statuses`
- `POST /api/admin/staff-document-statuses`
- `GET /api/admin/staff-document-statuses/{staff_document_status}`
- `PUT /api/admin/staff-document-statuses/{staff_document_status}`
- `DELETE /api/admin/staff-document-statuses/{staff_document_status}`

## Impatti UI obbligatori

### 1. Scheda operatore / tab Documenti

Quando il backend restituisce `documents[]` nella scheda operatore:

- mostrare `status_label`
- fallback tecnico `status_lookup.name`
- non mostrare più `status` come fonte primaria

Se esiste form create/update documento staff:

- usare select da lookup
- inviare `status_code`

### 2. Nuova pagina admin `Stati documenti staff`

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

- se lo stato è già usato da documenti staff, il backend risponde `409`

## Nota importante

Questo task **non** modifica `attachment.security_status`.

Restano due piani distinti:

- `attachment.security_status` = sicurezza / quarantena / antivirus
- `staff_document.status_code` = stato gestionale del documento staff

## Esempio response documento staff

```json
{
  "id": 12,
  "staff_member_id": 5,
  "document_type_id": 3,
  "attachment_id": 44,
  "status_code": "EXPIRED",
  "status_label": "Scaduto",
  "status_lookup": {
    "id": 2,
    "code": "EXPIRED",
    "name": "Scaduto"
  }
}
```
