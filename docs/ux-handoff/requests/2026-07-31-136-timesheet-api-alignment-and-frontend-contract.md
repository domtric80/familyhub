# Handoff UX/API - Timesheet allineato backend/frontend

Data: 2026-07-31  
Codice richiesta: `136`  
Ambito: `Turni > Timesheet > Presenze > Export`

## 1. Obiettivo

Allineare il frontend timesheet ai **veri endpoint backend** attivi, eliminando le route legacy/non esistenti e chiarendo cosa è **operativo oggi** e cosa è **previsto per fasi successive**.

## 2. Endpoint canonici da usare da ora

### Operatore

- `GET /api/staff/attendance-events/today`
  - ritorna **array diretto** di eventi presenza della giornata corrente
- `GET /api/staff/attendance-events?timesheet_entry_id={id}`
  - ritorna **array diretto** degli eventi legati alla entry richiesta
- `POST /api/staff/attendance-events`
  - crea timbratura
- `GET /api/staff/timesheets/me`
  - ritorna oggetto:
    - `staff_member`
    - `items[]`
- `POST /api/staff/timesheets/{timesheetEntry}/submit`
  - invia entry a stato `submitted`

### Coordinatore / Admin

- `GET /api/admin/timesheets`
- `GET /api/admin/timesheets/{timesheetEntry}`
- `POST /api/admin/timesheets/{timesheetEntry}/approve`
- `POST /api/admin/timesheets/{timesheetEntry}/reject`
- `GET /api/admin/timesheets/export.csv?facility_id={id}&year={yyyy}&month={mm}&format=csv`

## 3. Endpoint da NON usare più

Rimuovere ogni riferimento frontend a:

- `POST /api/staff-attendance/clock`
- `GET /api/staff-attendance/my-today`
- `GET /api/staff-attendance`
- `GET /api/staff-timesheet/my-entries`
- `POST /api/staff-timesheet/entries/{id}/submit`
- `GET /api/admin/staff-timesheet-entries`
- `GET /api/admin/staff-timesheet-entries/{id}`
- `POST /api/admin/staff-timesheet-entries/{id}/approve`
- `POST /api/admin/staff-timesheet-entries/{id}/reject`
- `POST /api/admin/staff-timesheet-entries/{id}/adjustments`
- `GET /api/admin/staff-timesheet-entries/export`

Sono route legacy / mai esposte dal backend reale.

## 4. Mapping campi backend -> frontend

Il backend restituisce i nomi veri database/Laravel:

- `planned_starts_at`
- `planned_ends_at`
- `actual_starts_at`
- `actual_ends_at`
- `variance_minutes`
- `anomaly_flags_json`
- `source_type`

Il frontend deve mapparli in view-model:

- `planned_start`
- `planned_end`
- `actual_start`
- `actual_end`
- `delta_minutes`
- `has_anomaly`
- `anomaly_notes`
- `source`

### Regola anomaly

- `has_anomaly = anomaly_flags_json.length > 0`
- `anomaly_notes = join label umano delle flag`

Flag oggi possibili:

- `missing_clock_in`
- `missing_clock_out`
- `unplanned_work`
- `late_clock_in`
- `early_clock_out`
- `no_break_logged`

## 5. Pagine UX: stato operativo reale

### `Le mie presenze`

Operativo ora:

- timbra entrata
- timbra uscita
- timbra pausa start/end
- vede timbrature odierne
- vede proprie entry timesheet
- invia entry `draft/computed/rejected`

### `Verifica timesheet`

Operativo ora:

- filtri
- elenco entry
- dettaglio entry
- approvazione
- rifiuto con motivazione

### `Export presenze`

Operativo ora:

- solo formato `CSV`
- solo entry in stato `approved` o `locked`

## 6. Funzioni previste ma NON ancora operative

### Rettifiche timesheet

La UI può mantenere il riferimento informativo, ma:

- non deve presentare il pulsante come funzione attiva
- non deve mostrare modal di inserimento operativa
- non deve invocare endpoint adjustment

Messaggio UX consigliato:

- `Rettifiche avanzate disponibili in una fase backend successiva.`

### PDF presenze

Non esiste ancora generatore backend PDF.

Quindi:

- non mostrare radio/selector PDF come opzione attiva
- non costruire nome file `.pdf`
- non fare fallback finto lato UI

Messaggio UX consigliato:

- `Il PDF presenze verrà riattivato quando sarà disponibile il generatore backend dedicato.`

## 7. Regole di comportamento UI

### Operatore

- pulsante `Invia` visibile per stati:
  - `draft`
  - `computed`
  - `rejected`
- pulsante `Invia` non visibile per:
  - `submitted`
  - `approved`
  - `locked`

### Coordinatore

- `Approva` e `Rifiuta` visibili solo se stato `submitted`
- in tabella lista usare:
  - `actual_start`
  - `actual_end`
  - non dedurre gli orari dalla lista eventi se il backend lista non li fornisce

## 8. Audit funzionale già attivo

Le seguenti azioni producono audit backend:

- registrazione timbratura
- submit timesheet
- approve timesheet
- reject timesheet
- export CSV timesheet

UX può mostrare il testo:

- `Ogni operazione del timesheet è registrata in audit.`

## 9. QA checklist per il team frontend

### A. Operatore

- login come educatore
- timbra entrata
- timbra inizio pausa
- timbra fine pausa
- timbra uscita
- apri `Le mie presenze`
- verifica comparsa eventi giornata
- verifica entry con stato `computed`
- invia entry
- verifica stato `submitted`

### B. Coordinatore

- apri `Verifica timesheet`
- filtra per struttura
- apri dettaglio
- rifiuta entry con motivazione
- verifica stato `rejected`
- rientra come educatore e reinvia
- torna come coordinatore e approva
- verifica stato `approved`

### C. Export

- apri `Export presenze`
- scegli struttura / anno / mese
- scarica CSV
- verificare presenza intestazioni e righe

## 10. Azione richiesta al team UX/frontend

1. riallineare `src/services/api.ts` alle route canoniche sopra
2. rimuovere uso route legacy timesheet
3. disattivare UI rettifiche operative
4. limitare export al solo `CSV`
5. usare mapping campi backend -> view-model come descritto

## 11. Nota finale

Questo handoff **sostituisce** il vecchio contratto timesheet dove alcune route erano state anticipate rispetto al backend reale.
