# 2026-08-13 — Timesheet: anomalie avanzate e dashboard coordinatore estesa

## Obiettivo
Chiudere il modulo `Turni / Timesheet` rendendo il backend più aderente all'uso operativo reale:

- rilevare anomalie più significative del semplice scostamento orario
- dare al coordinatore una vista aggregata per operatore e per struttura
- esplicitare a UX che la geolocalizzazione degli eventi è già disponibile nei payload di dettaglio

## Nuove anomalie calcolate

Il service `StaffTimesheetService` aggiunge ora questi flag in `anomaly_flags_json`:

- `overtime_detected`
- `absence_detected`
- `maximum_daily_hours_exceeded`
- `minimum_rest_violation`
- `weekly_hours_threshold_exceeded`

## Soglie applicate

- `minimum_rest_violation` → riposo tra una entry chiusa e la successiva inferiore a `11 ore`
- `maximum_daily_hours_exceeded` → lavorato effettivo oltre `12 ore`
- `weekly_hours_threshold_exceeded` → totale lavorato negli ultimi `7 giorni` oltre `48 ore`

Queste soglie sono attualmente lato backend, costanti applicative, non ancora parametrizzate da UI.

## Dashboard coordinatore estesa

L'endpoint `GET /api/admin/timesheets/dashboard-summary` espone ora nuovi KPI:

- `night_minutes_total`
- `minimum_rest_violations_count`
- `maximum_daily_hours_violations_count`
- `weekly_hours_threshold_exceeded_count`
- `staff_with_open_anomalies_count`

e due nuove collezioni:

- `staff_totals[]`
- `facility_totals[]`

## Geolocalizzazione eventi presenza

Non è stato introdotto un nuovo endpoint.

La geolocalizzazione era già disponibile nei dettagli presenza e resta leggibile in:

- `GET /api/admin/timesheets/{id}` → `attendance_events[].geo_latitude`, `attendance_events[].geo_longitude`

Quindi UX può mostrare subito:

- coordinate grezze
- badge “posizione disponibile / non disponibile”
- link mappa esterno costruito lato frontend

senza attendere altro backend.

## Copertura test

Esteso `StaffTimesheetApiTest` con validazione di:

- riposo minimo violato
- superamento ore giornaliere
- aggregati `staff_totals`
- aggregati `facility_totals`
- presenza coordinate geo nel dettaglio entry
