# Handoff UX/API — Documenti minore: ente rilascio relazionale

Data: 2026-07-02  
Area: `Minori > Documenti`  
Priorità: alta

## Obiettivo

Eliminare `issued_by` come campo libero primario nei nuovi componenti UX.

Backend introduce anagrafica relazionale riusabile:

- lookup pubblico: `GET /api/lookups/document-issuers`
- CRUD admin: `GET|POST|PUT|DELETE /api/admin/document-issuers`
- campo canonico upload: `document_issuer_id`

`issued_by` resta accettato solo come alias legacy backend e viene ancora restituito per compatibilità.

## Contratto backend

### Lookup pubblico

`GET /api/lookups/document-issuers`

Risposta:

```json
[
  {
    "id": 1,
    "code": "COMUNE",
    "name": "Comune",
    "description": "Comune o ufficio anagrafe.",
    "sort_order": 10,
    "is_active": true
  }
]
```

### Upload documento minore

`POST /api/minors/{minor}/documents`

Campi canonici nuovi:

- `document_issuer_id` → intero, opzionale ma preferito
- `classification_code` → stringa, già introdotto

Campi legacy ancora tollerati:

- `issued_by`
- `classification`

### Risposta documento minore

Nuovi campi da usare in UI:

- `document_issuer_id`
- `issuer_label`
- `document_issuer`

Compatibilità:

- `issued_by` ancora presente

## Esempio risposta

```json
{
  "id": 14,
  "minor_id": 2,
  "document_type_id": 1,
  "attachment_id": 31,
  "document_issuer_id": 1,
  "issued_by": "Comune",
  "issuer_label": "Comune",
  "classification_code": "restricted",
  "classification_label": "Riservato",
  "document_issuer": {
    "id": 1,
    "code": "COMUNE",
    "name": "Comune",
    "description": "Comune o ufficio anagrafe.",
    "sort_order": 10,
    "is_active": true
  }
}
```

## Azioni richieste a UX

- sostituire input testo `issued_by` con select lookup `document_issuer_id`
- mostrare `issuer_label` nelle card/tabella dettaglio documenti
- usare `issued_by` solo come fallback di compatibilità temporaneo
- non costruire enum hardcoded frontend

## Nota operativa

Se manca il lookup, il backend può ancora accettare `issued_by`, ma i nuovi form non devono più usarlo come input principale.
