# Risposta 052 — Staff document audit, KPI sicurezza e StoricoTab aggiornato

Data: 2026-06-29

## Implementato

### 1. StoricoTab — evento minor_document_viewed
- Aggiunto `minor_document_viewed: 'badge-light-warning'` in `EVENT_BADGE`
- Aggiunto `minor_document_viewed: 'Documento visualizzato'` in `EVENT_LABEL`
- Nella timeline, dopo il blocco IP, viene mostrato il nome documento se `metadata.document_name` è presente
- Formato: emoji 📄 + nome documento + classificazione in parentesi quadre se disponibile

### 2. KPI Sicurezza — nuovi tipi
Aggiunte in `types/index.ts`:
- `AuditKpiTopActor`
- `AuditKpiBreakdown`
- `AuditKpiDailySeries`
- `AuditKpi` (summary, top_actors, resource_breakdown, action_breakdown, daily_series)

### 3. AuditKpiPage — nuova pagina
Percorso: `src/pages/admin/AuditKpiPage.tsx`
- Al mount chiama `adminAuditApi.kpis()` → `GET /admin/audit-logs/kpis`
- Se 404 → banner giallo "KPI non ancora disponibili"
- 5 card riepilogative (login falliti, accessi documenti, modifiche permessi, letture minori, totale)
- Tabella Top Attori
- Tabella Breakdown risorse
- Tabella Breakdown azioni
- Tabella Serie giornaliera (max 30 giorni, ordinata desc)
- Nessuna dipendenza da Chart.js o recharts — solo tabelle reactstrap

### 4. Routing e menu
- Aggiunta rotta `/admin/audit-kpi` in `App.tsx`
- Aggiunta voce "KPI Sicurezza" nel menu Amministrazione dopo "Audit log"

### 5. adminAuditApi.kpis()
- Nuovo metodo in `services/api.ts`
- Endpoint: `GET /admin/audit-logs/kpis`
