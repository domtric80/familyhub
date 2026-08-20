# UX handoff response — 196

**Data risposta:** 2026-08-19
**Handoff:** 196 — Visite ed esami sanitari
**Stato:** implementato

---

## Nuovi tipi (`frontend/src/types/index.ts`)

```typescript
HealthEventCategory, HealthEventStatus, HealthEventOptions
HealthEvent, HealthEventWrite, HealthEventUpdate
HealthEventAlert
```

## Nuova API (`frontend/src/services/api.ts`)

```typescript
healthEventApi: { options(facility_id), list, create, get, update, alerts }
```

- `healthEventApi.options(facility_id)` richiede `facility_id` obbligatorio
- Nessun endpoint DELETE (non esposto dal backend)

## Nuovo componente — `VisiteMinoreTab` (`tabs/VisiteMinoreTab.tsx`)

**Caricamento:** `healthEventApi.options(facilityId)` + `healthEventApi.list({ minor_id })` + `healthEventApi.alerts({ facility_id, days: 30 })` + `minorApi.listDocuments(minorId)` in parallelo.

**Struttura:**
- Alert box informativo (differenza Programmato / Completato / Annullato)
- Banner alert da `GET /health/events/alerts`
- Filtri: categoria e stato (entrambi da select API, mai testo libero)
- Tabella eventi — **senza testi clinici** (motivo, risultati, note di esito)
- Pulsante occhio → pannello dettaglio clinico inline (solo lì compaiono i testi)
- Pannello dettaglio con pulsante "Modifica"

**Validazione occurred_at:**
- Stato `COMPLETED` → `occurred_at` obbligatorio
- Stato `CANCELLED` → `occurred_at` vietato (campo disabilitato in UI)
- Validazione eseguita prima del submit sia in creazione che in modifica

**Modal creazione / modifica:**
- categoria, stato, medico, ente sanitario → solo select da `HealthEventOptions`
- documento collegato → da `minorApi.listDocuments()`, mai URL storage diretto
- testi clinici (reason, clinical_findings, outcome_notes) → textarea solo nel form autorizzato

**Gestione errori:**
- 403 → "Accesso clinico negato. Richiedi i permessi al coordinatore."
- 422 → mostra messaggio backend

## Integrazione in MinoreDetailPage

- Tab type esteso: aggiunto `'visite'`
- `tabs` array: aggiunta entry `{ key: 'visite', label: 'Visite ed esami', icon: <FileText> }`
- `<TabPane tabId='visite'>` con `<VisiteMinoreTab minorId facilityId />`
- Tab separato da `'farmaci'` (come richiesto dalla spec)

## Vincoli rispettati

- `facility_id` sempre passato a `healthEventApi.options()` (obbligatorio)
- Categorie, stati, medici, enti solo da select API
- Nessun delete nel frontend
- Testi clinici mai in tabelle generali, solo nel dettaglio autorizzato
- Documenti collegati via endpoint protetto, nessun URL storage diretto
- 403 gestito come "accesso clinico negato"
- 422 mostra messaggio dal backend
- Box Informazioni con distinzione programmato/completato/annullato

## File modificati / creati

| File | Tipo |
|---|---|
| `frontend/src/types/index.ts` | Modifica (nuovi tipi 196) |
| `frontend/src/services/api.ts` | Modifica (healthEventApi) |
| `frontend/src/pages/minori/tabs/VisiteMinoreTab.tsx` | Nuovo |
| `frontend/src/pages/minori/MinoreDetailPage.tsx` | Modifica (Tab type + tabs array + TabPane visite) |
