# UX Handoff  2026-08-10  Turni: planned vs actual nel planner settimanale

## Scopo
Backend aggiornato per esporre nel modulo `Turni / Pianificazione` il confronto tra turno pianificato e turno effettivo, senza rompere il contratto esistente.

## Endpoint impattati
- `GET /api/admin/staff-shifts`
- `GET /api/admin/staff-shifts/{id}`
- `GET /api/admin/staff-shifts/week`
- `GET /api/staff-shifts/my-week`
- `POST /api/admin/staff-shifts`
- `PUT /api/admin/staff-shifts/{id}`

## Nuovo blocco dati per ogni assegnazione turno
Ogni `assignment` mantiene i campi gi esistenti e aggiunge:

```json
{
  "actual": {
    "timesheet_entry_id": 123,
    "status": "computed",
    "started": true,
    "completed": true,
    "planned_start": "2026-07-13T08:00:00+02:00",
    "planned_end": "2026-07-13T16:00:00+02:00",
    "actual_start": "2026-07-13T08:15:00+02:00",
    "actual_end": "2026-07-13T16:20:00+02:00",
    "planned_minutes": 480,
    "worked_minutes": 485,
    "break_minutes": 0,
    "ordinary_minutes": 480,
    "overtime_minutes": 5,
    "absence_minutes": 0,
    "variance_minutes": 5,
    "has_anomaly": true,
    "anomaly_flags": ["late_clock_in"]
  }
}
```

## Nuovi campi per ogni blocco settimana/template in `GET /admin/staff-shifts/week`
Per ogni `day.shifts[]`:

```json
{
  "actual_started_count": 1,
  "actual_completed_count": 1,
  "actual_coverage_gap": 0,
  "anomaly_count": 1
}
```

## Semantica backend
- `assigned_count`: quante persone sono pianificate
- `coverage_gap`: gap sul pianificato rispetto al minimo richiesto
- `actual_started_count`: quante assegnazioni hanno almeno una timbratura di inizio
- `actual_completed_count`: quante assegnazioni hanno chiusura effettiva completa
- `actual_coverage_gap`: gap sulla copertura effettiva completata
- `anomaly_count`: quante assegnazioni del blocco hanno almeno un flag anomalia

## Istruzioni UX
### Planner coordinatore
UX pu ora mostrare, per ogni blocco turno:
- copertura prevista (`assigned_count/minimum_staff_required`)
- copertura effettiva (`actual_completed_count/minimum_staff_required`)
- badge anomalie se `anomaly_count > 0`

### Card singola assegnazione
UX pu mostrare:
- stato pianificato (`status` assignment)
- stato effettivo (`actual.status`)
- orario previsto vs orario effettivo
- indicatori rapidi:
  - `started`
  - `completed`
  - `has_anomaly`

### Vista personale educatore
La pagina `my-week` pu ora distinguere chiaramente:
- turno assegnato ma non iniziato
- turno iniziato
- turno completato
- turno con anomalia

## Compatibilit
- nessun campo esistente rimosso
- frontend attuale non si rompe se ignora i nuovi campi
- i nuovi campi sono additivi
