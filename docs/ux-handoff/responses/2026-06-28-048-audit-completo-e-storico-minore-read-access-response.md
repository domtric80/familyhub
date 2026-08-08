# Response 048 — Audit completo e storico minore: read-access

**Data risposta:** 2026-06-28
**Riferimento handoff:** 048

---

## Riepilogo implementazione

### Nuovi tipi (types/index.ts)

Aggiunte tre interfacce:
- `AuditLog` — rappresenta un singolo evento audit con campi `occurred_at_utc`, `ip_address`, `actor_display_name`, `actor_role_name`, `operation_summary`, `action`, `resource_type`, `resource_label`, `resource_id`, `facility`, `minor`, `old_values_json`, `new_values_json`
- `AuditLogFilters` — risposta di `/admin/audit-logs/filters` con array `actions` e `resource_types`
- `PaginatedResponse<T>` — wrapper generico per le risposte paginate Laravel (`data`, `current_page`, `last_page`, `per_page`, `total`, `from`, `to`)

### Nuovi endpoint (services/api.ts)

Aggiunto `adminAuditApi`:
- `list(params?)` — GET `/admin/audit-logs` con supporto filtri: `q`, `facility_id`, `minor_id`, `actor_user_id`, `action`, `resource_type`, `resource_id`, `date_from`, `date_to`, `per_page`, `page`
- `filters()` — GET `/admin/audit-logs/filters`

### StoricoTab aggiornato (MinoreDetailPage.tsx)

Introdotte mappe:
- `EVENT_BADGE` — badge colorato per tipo evento: `badge-light-info` per `minor_viewed`/`minor_history_viewed`, `badge-light-warning` per `minor_document_downloaded`, `badge-light-primary` come default
- `EVENT_LABEL` — label italiane per 10 event_type comuni

Comportamento aggiornato:
- Il badge mostra la label italiana (o il codice raw se non mappato)
- La select filtro mostra anch'essa le label italiane
- Se `metadata.operation_summary` è presente → mostrato come riga di descrizione principale
- Se `metadata.ip_address` è presente → mostrato come riga secondaria grigia piccola "IP: x.x.x.x"
- Il blocco `<details>Metadata</details>` ora esclude `operation_summary` e `ip_address` (già mostrati inline), e appare solo se restano altri campi nel metadata

### Rotta e menu

- Rotta `/admin/audit` registrata in App.tsx
- Voce "Audit log" aggiunta al menu Amministrazione in menuItems.ts

---

## Note backend attese

Il backend deve esporre:
- `GET /admin/audit-logs` (paginato, filtri via query string)
- `GET /admin/audit-logs/filters` (restituisce `{ actions: string[], resource_types: string[] }`)

Se gli endpoint non esistono ancora, la pagina mostra il banner giallo "API non disponibile" senza errori bloccanti.

Gli eventi read-access (`minor_viewed`, `minor_history_viewed`, `minor_document_downloaded`) devono popolare `metadata` con `operation_summary` e `ip_address` per essere visualizzati correttamente nel tab Storico del minore.
