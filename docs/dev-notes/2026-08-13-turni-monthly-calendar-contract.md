# Turni — calendario mensile backend contract

Data: 2026-08-13
Ambito: Modulo Turni / Timesheet

## Obiettivo

Introdurre una vista mensile reale per il modulo Turni, coerente con:

- planner settimanale già esistente;
- separazione tra pianificato (`StaffShiftAssignment`) e consuntivo (`StaffTimesheetEntry`);
- necessità UX di costruire una griglia mensile per struttura e per singolo operatore.

## Endpoint nuovi

### Admin

- `GET /api/admin/staff-shifts/month`

Parametri:

- `facility_id` obbligatorio
- `year` obbligatorio
- `month` obbligatorio
- `staff_member_id` opzionale

### Staff

- `GET /api/staff-shifts/my-month`

Parametri:

- `year` obbligatorio
- `month` obbligatorio

## Semantica della vista mensile admin

La vista mensile admin mantiene la stessa semantica della vista settimanale:

- ogni giorno contiene blocchi per template turno;
- ogni blocco espone copertura pianificata e copertura effettiva;
- le assegnazioni serializzate mantengono il sotto-blocco `actual`.

### Payload principale

- `facility_id`
- `staff_member_id` opzionale
- `year`
- `month`
- `month_start`
- `month_end`
- `summary`
- `days[]`

### `summary`

- `days_in_month`
- `total_assignments`
- `planned_assignments_count`
- `confirmed_assignments_count`
- `completed_assignments_count`
- `cancelled_assignments_count`
- `days_with_coverage_gap_count`
- `days_with_actual_gap_count`
- `days_with_anomalies_count`
- `minimum_staff_required_total`
- `assigned_count_total`
- `actual_completed_count_total`

### `days[]`

Ogni giorno espone:

- `date`
- `day_of_week_iso`
- `is_weekend`
- `shifts[]`
- `summary`

### `days[].summary`

- `minimum_staff_required_total`
- `assigned_count_total`
- `coverage_gap_total`
- `actual_started_count_total`
- `actual_completed_count_total`
- `actual_coverage_gap_total`
- `anomaly_count`

## Semantica della vista mensile personale

La vista `my-month` non crea blocchi per template; è focalizzata sul singolo educatore/operatore.

### Payload principale

- `staff_member`
- `year`
- `month`
- `month_start`
- `month_end`
- `summary`
- `days[]`

### `summary`

- `days_in_month`
- `total_assignments`
- `completed_assignments_count`
- `days_with_assignments_count`
- `days_with_anomalies_count`
- `planned_minutes_total`
- `worked_minutes_total`

### `days[]`

- `date`
- `is_weekend`
- `assignments[]`
- `summary`

### `days[].summary`

- `assigned_count`
- `completed_count`
- `anomaly_count`
- `planned_minutes_total`
- `worked_minutes_total`

## Scelte implementative

- nessuna tabella nuova;
- nessuna migrazione;
- nessuna alterazione della logica settimanale esistente;
- riuso del serializer `serializeAssignment()` per garantire coerenza tra week/month;
- riuso del blocco `actual` come fonte canonica del confronto planned vs actual.

## Stato

Implementazione backend completata.

Test coperti in:

- `tests/Feature/StaffShiftApiTest.php`
