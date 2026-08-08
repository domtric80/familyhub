# UX Request 078 — Classificazione documenti minore solo relazionale

- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `Backend già aggiornato`: `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\MinorController.php`
- `Lookup esistente riusata`: `GET /api/lookups/document-classifications`

## Obiettivo

Eliminare `classification` come stringa primaria nei documenti del minore.

Da ora il backend usa come campo corretto:

- `classification_code`

con relazione:

- `document_classification`

e label pronta UI:

- `classification_label`

Il vecchio `classification` resta accettato solo come alias legacy backend.

## Fonte corretta delle opzioni

Per l’upload documento minore la UI deve continuare a rispettare le classificazioni consentite per l’utente:

- `GET /api/auth/me` → `capabilities.document_classifications`

Come fallback tecnico può usare:

- `GET /api/lookups/document-classifications`

## Impatti UI obbligatori

### 1. Tab `Documenti` del minore

Nel form upload:

- inviare `classification_code`
- non inviare più `classification` nei nuovi componenti
- usare come source primaria le classificazioni consentite in `capabilities.document_classifications`

Nella lista documenti:

- mostrare `classification_label`
- fallback tecnico `document_classification.name`

### 2. Eventuali modali/dettagli documento

Se il documento viene mostrato in drawer, modal o tabella:

- usare `classification_label`
- non leggere più `classification` come fonte primaria

## Nota ABAC importante

La logica ABAC resta identica: il backend continua a valutare la classificazione documentale del record.

Questa attività cambia il **contratto dati**, non la policy di autorizzazione.

## Esempio payload corretto upload

```json
{
  "document_type_id": 3,
  "classification_code": "restricted"
}
```

## Esempio response corretta

```json
{
  "id": 12,
  "minor_id": 5,
  "document_type_id": 3,
  "attachment_id": 44,
  "classification_code": "clinical",
  "classification_label": "Clinico",
  "document_classification": {
    "id": 3,
    "code": "clinical",
    "name": "Clinico"
  }
}
```
