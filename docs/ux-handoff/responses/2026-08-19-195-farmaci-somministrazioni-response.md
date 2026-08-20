# UX handoff response — 195

**Data risposta:** 2026-08-19
**Handoff:** 195 — Farmaci e somministrazioni
**Stato:** implementato

---

## Nuovi tipi (`frontend/src/types/index.ts`)

```typescript
MedicationOption, MedicationOptions
MedicationSchedule, MedicationScheduleWrite
MedicationAdministration, MedicationAdministrationWrite
MedicationPlan, MedicationPlanWrite, MedicationPlanUpdate
MedicationPlanAlert
Medication, MedicationWrite
```

## Nuove API (`frontend/src/services/api.ts`)

```typescript
medicationOptionsApi: { get(facility_id) }
medicationPlanApi: { list, create, get, update, alerts, addSchedule, listAdministrations, addAdministration }
medicationAdminApi: { list, create, update, delete }
```

- `medicationOptionsApi.get(facility_id)` richiede `facility_id` obbligatorio → backend verifica `minor_health.read`

## Nuovo componente — `FarmaciMinoreTab` (`tabs/FarmaciMinoreTab.tsx`)

**Caricamento:** `medicationOptionsApi.get(facilityId)` + `medicationPlanApi.list({ minor_id })` + `medicationPlanApi.alerts({ minor_id })` + `minorApi.listDocuments(minorId)` in parallelo.

**Struttura:**
- Alert box informativo (testo verbatim dalla specifica)
- Banner alert scadenze da `GET /health/medication-plans/alerts`
- Tab Attivi / Storico
- Tabella piani cliccabile → pannello dettaglio inline
- Pannello dettaglio: orari settimanali, registro somministrazioni con badge firma

**Modal nuovo piano:**
- Tutti i campi sono select (farmaco, unità, via, frequenza, prescrittore → da `MedicationOptions`)
- Documento ricetta → da `minorApi.listDocuments()`, mai URL S3
- 409 → "Piano già esistente per questo farmaco nel periodo indicato"

**Modal somministrazione:**
- Warning prominente: "non modificabile né cancellabile"
- Esito da select enum (nessun testo libero)
- Firma mostrata come "Firma applicativa autenticata" (non firma digitale qualificata)

**Azioni mostrate solo da `can_update` / `can_add_administration`** restituiti dal backend.

## Integrazione in MinoreDetailPage

- Tab type esteso: aggiunto `'farmaci'`
- `tabs` array: aggiunta entry `{ key: 'farmaci', label: 'Farmaci', icon: <AlertTriangle> }`
- `<TabPane tabId='farmaci'>` con `<FarmaciMinoreTab minorId facilityId />`

## Vincoli rispettati

- `facility_id` sempre passato a `medicationOptionsApi.get()` (obbligatorio)
- Nessun testo libero per farmaco, unità, via, esito, prescrittore
- Azioni da `can_*` backend, non da logica ruolo
- Somministrazioni immutabili una volta registrate
- "Firma applicativa autenticata", non "firma digitale qualificata"
- Documento ricetta via endpoint documentale protetto del minore
- Nessun URL S3/MinIO esposto
- 409 gestito come duplicato/stato incompatibile

## File modificati / creati

| File | Tipo |
|---|---|
| `frontend/src/types/index.ts` | Modifica (nuovi tipi 195) |
| `frontend/src/services/api.ts` | Modifica (medicationOptionsApi, medicationPlanApi, medicationAdminApi) |
| `frontend/src/pages/minori/tabs/FarmaciMinoreTab.tsx` | Nuovo |
| `frontend/src/pages/minori/MinoreDetailPage.tsx` | Modifica (Tab type + tabs array + TabPane farmaci) |
