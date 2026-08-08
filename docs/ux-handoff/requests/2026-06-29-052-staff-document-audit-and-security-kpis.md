# Richiesta UX 052 · Audit documenti staff e dashboard KPI sicurezza

Data: 2026-06-29
Stato: READY_FOR_UX_IMPLEMENTATION
Priorità: ALTA

## 1. Nuovi endpoint documenti staff

### `GET /api/admin/staff-members/{staff_member}/documents/{document}/preview`

- preview inline
- audit globale `staff_document_preview`

### `GET /api/admin/staff-members/{staff_member}/documents/{document}/download`

- download file
- audit globale `staff_document_download`

## 2. KPI sicurezza

### `GET /api/admin/audit-logs/kpis`

Response:

- `summary.login_failures`
- `summary.document_access_events`
- `summary.permission_change_events`
- `summary.minor_read_events`
- `summary.total_events`
- `top_actors[]`
- `resource_breakdown[]`
- `action_breakdown[]`
- `daily_series[]`

## 3. Uso UI consigliato

### Card KPI

- Login falliti
- Accessi documenti
- Modifiche permessi
- Letture minori
- Eventi totali

### Tabelle secondarie

- top 5 attori
- top resource type
- breakdown per azione

### Grafici consigliati

- line chart `daily_series`
- donut/bar `resource_breakdown`
- donut/bar `action_breakdown`

## 4. Audit documentale

I preset `solo documenti` devono includere:

- `minor_document_preview`
- `minor_document_download`
- `staff_document_preview`
- `staff_document_download`
