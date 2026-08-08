# Richiesta UX 049 · Modulo Audit: pagina, filtri, paginazione e log auth

Data: 2026-06-29
Stato: READY_FOR_UX_IMPLEMENTATION
Priorità: ALTA

## 1. Obiettivo

Realizzare la pagina Audit amministrativa come console di consultazione completa.

## 2. Endpoint disponibili

### `GET /api/admin/audit-logs`

Elenco paginato dei log audit.

#### Filtri query supportati

- `q`
- `facility_id`
- `minor_id`
- `actor_user_id`
- `action`
- `resource_type`
- `resource_types[]`
- `resource_id`
- `date_from`
- `date_to`
- `per_page`

#### Comportamento

- ordinamento backend: `occurred_at_utc desc`, poi `id desc`
- response paginata Laravel

Campi UI principali per ogni record:

- `occurred_at_utc`
- `ip_address`
- `actor_display_name`
- `actor_role_name`
- `operation_summary`
- `action`
- `resource_type`
- `resource_id`
- `resource_label`
- `facility`
- `minor`
- `old_values_json`
- `new_values_json`

### `GET /api/admin/audit-logs/filters`

Restituisce valori distinti già presenti nel DB e preset pronti:

- `actions`
- `resource_types`
- `presets`

### `GET /api/admin/audit-logs/{auditLog}`

Dettaglio singolo record audit per drawer/modale dettaglio.

### `GET /api/admin/audit-logs/export.csv`

Export CSV dei log filtrati correntemente.

## 3. Eventi nuovi già tracciati

### Accessi minore

- `minor_viewed`
- `minor_history_viewed`
- `minor_document_downloaded`

### Auth / sicurezza

- `auth_login`
- `auth_logout`
- `auth_failed`
- `auth_blocked`
- `mfa_failed`
- `mfa_setup`
- `mfa_confirm`
- `mfa_disable`
- `mfa_recovery_codes_regenerated`
- `mfa_read`

### RBAC

- modifica permessi ruolo con `operation_summary` esplicita e diff `old_values_json` / `new_values_json`

## 4. Regole pagina Audit

- vista tabellare principale con paginazione server-side
- filtri in testata
- colonna principale `Operazione` = `operation_summary`
- drawer/modale dettaglio per mostrare `old_values_json` e `new_values_json`
- se `minor` presente, mostrare nome + codice interno del minore
- se `facility` presente, mostrare nome struttura
- azione export CSV che riusa gli stessi filtri della tabella

## 5. Regole pagina Minore → Storico

Continuare a usare `GET /api/minors/{minor}/history`.

Per gli eventi di lettura/download:

- usare `metadata.operation_summary` come descrizione
- mostrare `metadata.ip_address` se presente

## 6. Nota importante

Non costruire frasi lato frontend per audit.  
Usare sempre `operation_summary` se disponibile.
