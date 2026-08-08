# Risposta UX — Handoff 136: Timesheet allineamento API backend/frontend

Data: 2026-07-31  
Stato: implementato (allineamento già attivo)

---

## Riepilogo

Le route canoniche erano già state implementate durante il lavoro su Handoff 133. Il presente handoff conferma e formalizza l'allineamento già in produzione. Nessuna modifica aggiuntiva necessaria.

---

## Endpoint canonici attivi

### Operatore

| Endpoint | Metodo API frontend | Stato |
|----------|---------------------|-------|
| `GET /api/staff/attendance-events/today` | `attendanceApi.myToday()` | ✅ attivo |
| `GET /api/staff/attendance-events?timesheet_entry_id={id}` | `attendanceApi.listForEntry(id)` | ✅ attivo |
| `POST /api/staff/attendance-events` | `attendanceApi.clockEvent({ event_type })` | ✅ attivo |
| `GET /api/staff/timesheets/me` | `timesheetApi.myEntries()` → `.items[]` | ✅ attivo |
| `POST /api/staff/timesheets/{id}/submit` | `timesheetApi.submit(id)` | ✅ attivo |

### Admin / Coordinatore

| Endpoint | Metodo API frontend | Stato |
|----------|---------------------|-------|
| `GET /api/admin/timesheets` | `timesheetApi.list(filters)` | ✅ attivo |
| `GET /api/admin/timesheets/{id}` | `timesheetApi.get(id)` | ✅ attivo |
| `POST /api/admin/timesheets/{id}/approve` | `timesheetApi.approve(id)` | ✅ attivo |
| `POST /api/admin/timesheets/{id}/reject` | `timesheetApi.reject(id, reason)` | ✅ attivo |
| `GET /api/admin/timesheets/export.csv` | `timesheetApi.exportMonthly(params)` | ✅ attivo |

---

## Route legacy rimosse

Nessuna delle route deprecate è presente nel codice sorgente frontend:

- `POST /api/staff-attendance/clock` — rimossa
- `GET /api/staff-attendance/my-today` — rimossa
- `GET /api/staff-attendance` — rimossa
- `GET /api/staff-timesheet/my-entries` — rimossa
- `POST /api/staff-timesheet/entries/{id}/submit` — rimossa
- `GET /api/admin/staff-timesheet-entries` — rimossa
- `GET /api/admin/staff-timesheet-entries/{id}` — rimossa
- `POST /api/admin/staff-timesheet-entries/{id}/approve` — rimossa
- `POST /api/admin/staff-timesheet-entries/{id}/reject` — rimossa
- `POST /api/admin/staff-timesheet-entries/{id}/adjustments` — rimossa
- `GET /api/admin/staff-timesheet-entries/export` — rimossa

---

## Mapping campi backend → view-model

Implementato in `normalizeTimesheetEntry()` in `src/services/api.ts`:

| Campo backend | Campo view-model | Note |
|---------------|------------------|------|
| `planned_starts_at` | `planned_start` | fallback su `planned_start` se già mappato |
| `planned_ends_at` | `planned_end` | |
| `actual_starts_at` | `actual_start` | |
| `actual_ends_at` | `actual_end` | |
| `variance_minutes` | `delta_minutes` | fallback su `delta_minutes` |
| `anomaly_flags_json[]` | `has_anomaly` + `anomaly_notes` | `has_anomaly = flags.length > 0`; `anomaly_notes` = join etichette umane |
| `source_type` | `source` | fallback su `source` |

Flag anomalia supportate con etichette italiane:
`missing_clock_in`, `missing_clock_out`, `unplanned_work`, `late_clock_in`, `early_clock_out`, `no_break_logged`

La normalizzazione avviene nel layer API (`services/api.ts`), i componenti React ricevono già il view-model.

---

## Funzioni disabilitate

### Rettifiche timesheet

`timesheetApi.addAdjustment()` restituisce `Promise.reject(...)` con messaggio esplicativo.

Nelle pagine `Le mie presenze` e `Verifica timesheet`:
- La sezione rettifiche è **solo informativa** (mostra eventuali rettifiche esistenti in sola lettura)
- Nessun pulsante di inserimento rettifica operativo
- Il footer del modal mostra: *"Rettifiche avanzate disponibili in una fase backend successiva."*

### PDF export

In `ExportPresenzePage`:
- L'unica opzione disponibile è `CSV paghe`
- Il messaggio informativo è visibile: *"Il PDF presenze verrà riattivato quando sarà disponibile il generatore backend dedicato."*

---

## Regole UI operative

### Pulsante "Invia" (operatore)

Visibile per stati: `draft`, `computed`, `rejected`  
Nascosto per stati: `submitted`, `approved`, `locked`

Implementato in `MiePresentePage.tsx` (tabella e modal dettaglio).

### Pulsanti "Approva" / "Rifiuta" (coordinatore)

Visibili solo per stato `submitted`.  
Implementato in `VerificaTimesheetPage.tsx` (riga tabella e modal dettaglio).

---

## File coinvolti

| File | Ruolo |
|------|-------|
| `src/services/api.ts` | `attendanceApi` + `timesheetApi` canonici; `normalizeTimesheetEntry`; `normalizeAttendanceEvent` |
| `src/types/index.ts` | `TimesheetEntry` (view-model), `AttendanceEvent`, `TimesheetEntryStatus` |
| `src/pages/turni/MiePresentePage.tsx` | Timbrature + entry operatore |
| `src/pages/turni/VerificaTimesheetPage.tsx` | Revisione e approvazione coordinatore |
| `src/pages/turni/ExportPresenzePage.tsx` | Export CSV (solo formato attivo) |
