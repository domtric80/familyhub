# Risposta 051 — Export CSV audit, preset backend e filtri array

Data: 2026-06-29

## Implementato

### 1. Export CSV
- Nuovo metodo `adminAuditApi.exportCsv(params)` in `services/api.ts`
- Endpoint: `GET /admin/audit-logs/export.csv` con `responseType: 'blob'`
- In AuditPage: pulsante "Esporta CSV" nella testata card filtri
- Stato `exporting` per disabilitare il pulsante durante il download
- Il file scaricato è nominato `audit-YYYY-MM-DD.csv`

### 2. Preset backend
- Aggiunta interfaccia `AuditPreset` in `types/index.ts`
- `AuditLogFilters` ora include `presets?: AuditPreset[]`
- Al mount, `adminAuditApi.filters()` popola sia `filters` che `presets`
- In AuditPage: barra di preset pills sopra i filtri (visibile solo se il backend li restituisce)
- Clic su preset: `applyPreset()` resetta tutti i filtri e applica `query`, `actions[]`, `resource_types[]` del preset
- Pulsante "Tutti" azzera il preset attivo

### 3. Filtri array (actions[], resource_types[])
- Nuovi stati `actionsFilter` e `resourceTypesFilter` in AuditPage
- La funzione `load()` invia `params['actions[]']` e `params['resource_types[]']` se non vuoti
- Questi vengono impostati dai preset; in futuro possono essere collegati a multi-select

### 4. Tipi
- Aggiornato import `AuditPreset` in `services/api.ts`
