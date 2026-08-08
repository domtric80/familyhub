# UX Request 073 — Tipi documento: scope solo relazionale

- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `Backend già aggiornato`: `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\Admin\DocumentTypeController.php`
- `Lookup coinvolte`: `GET /api/lookups/document-scopes`, `GET /api/lookups/document-types`

## Obiettivo

Eliminare definitivamente l’interpretazione di `scope` come campo testuale libero nel frontend.

Da ora il backend espone e accetta il campo:

- `document_scope_code`

Il vecchio campo:

- `scope`

resta accettato solo in retrocompatibilità backend, ma **UX non deve più usarlo** in nuovi form, modali, grid o adapter.

## Contratto API aggiornato

### `GET /api/lookups/document-types`

Ogni record espone:

- `id`
- `code`
- `name`
- `document_scope_code`
- `document_scope`

Non fare affidamento sul campo `scope`.

### `POST /api/admin/document-types`
### `PUT /api/admin/document-types/{document_type}`

Payload corretto:

```json
{
  "code": "COURT_NOTE",
  "name": "Nota giudiziaria",
  "document_scope_code": "minor"
}
```

Il valore di `document_scope_code` deve arrivare da una select popolata da:

- `GET /api/lookups/document-scopes`
  oppure
- `GET /api/admin/document-scopes`

## Istruzioni UI

- Nel form “Tipo documento” sostituire il binding del campo scope con `document_scope_code`.
- La label utente deve restare “Scope” oppure “Ambito documento”, ma il valore deve provenire solo da lookup.
- Nessun input text libero.
- In tabella elenco, se serve mostrare una colonna leggibile, usare:
  - `document_scope.name`
  - oppure `document_scope_code` come fallback tecnico

## Nota compatibilità

Se qualche componente UX esistente legge ancora `scope`, va considerato un debito tecnico da correggere subito. Il backend lo nasconde già nelle nuove risposte per evitare regressioni semantiche.
