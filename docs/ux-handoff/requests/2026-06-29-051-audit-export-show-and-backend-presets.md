# Richiesta UX 051 · Audit export CSV, dettaglio singolo e preset backend

Data: 2026-06-29
Stato: READY_FOR_UX_IMPLEMENTATION
Priorità: ALTA

## 1. Endpoint nuovi / completati

### `GET /api/admin/audit-logs/{auditLog}`

Dettaglio singolo record audit.

Uso:

- apertura drawer dettaglio
- refresh puntuale del record selezionato

### `GET /api/admin/audit-logs/export.csv`

Export CSV.

Accetta gli stessi filtri di `GET /api/admin/audit-logs`, inclusi:

- `q`
- `facility_id`
- `minor_id`
- `actor_user_id`
- `action`
- `actions[]`
- `resource_type`
- `resource_types[]`
- `resource_id`
- `date_from`
- `date_to`

## 2. Preset backend

`GET /api/admin/audit-logs/filters` ora restituisce anche:

```json
{
  "presets": [
    { "code": "today", "label": "Oggi", "query": { "date_from": "YYYY-MM-DD", "date_to": "YYYY-MM-DD" } },
    { "code": "last_24h", "label": "Ultime 24 ore", "query": { "date_from": "YYYY-MM-DD", "date_to": "YYYY-MM-DD" } },
    { "code": "last_7d", "label": "Ultimi 7 giorni", "query": { "date_from": "YYYY-MM-DD", "date_to": "YYYY-MM-DD" } },
    { "code": "auth_only", "label": "Solo autenticazione", "resource_types": ["auth_login", "auth_logout", "..."] },
    { "code": "auth_failures_only", "label": "Solo errori accesso", "actions": ["auth_failed", "auth_blocked", "mfa_failed"] },
    { "code": "minors_only", "label": "Solo minori", "resource_types": ["minor", "minor_history"] },
    { "code": "documents_only", "label": "Solo documenti", "resource_types": ["minor_document_preview", "minor_document_download"] },
    { "code": "permissions_only", "label": "Solo permessi", "resource_types": ["role_permissions"] },
    { "code": "sensitive_reads_only", "label": "Solo letture sensibili", "resource_types": ["minor", "minor_history", "..."] }
  ]
}
```

## 3. Regole UX obbligatorie

- UX non deve codificare i preset a mano.
- Deve leggere `presets` dal backend e usarli come sorgente primaria.
- Per i preset con `query`, applicare direttamente i parametri.
- Per i preset con `actions`, inviare `actions[]`.
- Per i preset con `resource_types`, inviare `resource_types[]`.

## 4. Drawer dettaglio

Quando l’utente clicca una riga:

1. usare subito i dati già in tabella
2. opzionalmente chiamare `GET /api/admin/audit-logs/{auditLog}` per dettaglio fresco
3. mostrare:
   - intestazione record
   - `operation_summary`
   - blocco `Prima`
   - blocco `Dopo`

## 5. Export CSV

Pulsante “Esporta CSV”:

- usa i filtri attivi
- richiama `GET /api/admin/audit-logs/export.csv`
- non richiede trasformazioni frontend
