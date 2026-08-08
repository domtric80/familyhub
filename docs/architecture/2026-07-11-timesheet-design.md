# FamilyHub — Disegno architetturale modulo Timesheet

Data: 2026-07-11  
Stato: proposta esecutiva pre-implementazione  
Ambito: `Turni`, `Timesheet`, `Paghe`, `Audit`, `Educatori`

## 1. Obiettivo

Trasformare il modulo `Turni` da sola pianificazione a vero `Timesheet` operativo, senza rompere il modello già introdotto.

Principio chiave:

- `Turno pianificato` e `consuntivo lavorato` restano entità diverse

Questo evita di perdere:

- il piano originario
- gli scostamenti reali
- la tracciabilità di correzioni e approvazioni

## 2. Entità relazionali proposte

## 2.1 Entità già esistenti

- `staff_shift_templates`
- `staff_shift_assignments`
- `staff_members`
- `facilities`
- `users`

## 2.2 Nuove entità

### `staff_attendance_events`

Eventi grezzi di presenza.

Uso:

- clock-in
- clock-out
- break-start
- break-end
- manual-adjustment

Campi principali:

- `id`
- `facility_id`
- `staff_member_id`
- `shift_assignment_id` nullable
- `event_type`
- `occurred_at`
- `source_type` (`web`, `mobile`, `manual`, `system`)
- `geo_latitude` nullable
- `geo_longitude` nullable
- `geo_accuracy_meters` nullable
- `device_fingerprint` nullable
- `ip_address` nullable
- `notes` nullable
- `created_by_user_id` nullable
- `superseded_by_event_id` nullable
- `created_at`
- `updated_at`

### `staff_timesheet_entries`

Consuntivo giornaliero/turno derivato.

Una entry rappresenta il risultato “lavorabile” ai fini operativi e paghe.

Campi principali:

- `id`
- `facility_id`
- `staff_member_id`
- `shift_assignment_id` nullable
- `work_date`
- `planned_starts_at` nullable
- `planned_ends_at` nullable
- `actual_starts_at` nullable
- `actual_ends_at` nullable
- `planned_minutes`
- `worked_minutes`
- `break_minutes`
- `ordinary_minutes`
- `overtime_minutes`
- `night_minutes`
- `absence_minutes`
- `variance_minutes`
- `status` (`draft`, `computed`, `submitted`, `approved`, `rejected`, `locked`)
- `anomaly_flags_json`
- `notes` nullable
- `submitted_at` nullable
- `submitted_by_user_id` nullable
- `approved_at` nullable
- `approved_by_user_id` nullable
- `locked_at` nullable
- `export_batch_id` nullable
- `created_at`
- `updated_at`

### `staff_timesheet_adjustments`

Rettifiche strutturate alla entry.

Uso:

- straordinario autorizzato
- assenza giustificata
- ferie
- permesso
- malattia
- correzione oraria

Campi principali:

- `id`
- `timesheet_entry_id`
- `adjustment_type`
- `minutes_delta`
- `reason_code`
- `reason_text`
- `requested_by_user_id`
- `approved_by_user_id` nullable
- `status` (`pending`, `approved`, `rejected`, `cancelled`)
- `effective_from` nullable
- `effective_to` nullable
- `created_at`
- `updated_at`

### `staff_timesheet_export_batches`

Snapshot di chiusura/esportazione.

Campi principali:

- `id`
- `facility_id`
- `period_from`
- `period_to`
- `export_type` (`payroll_csv`, `attendance_pdf`, `internal_review`)
- `status` (`draft`, `generated`, `delivered`, `void`)
- `generated_by_user_id`
- `file_path` nullable
- `checksum_sha256` nullable
- `created_at`
- `updated_at`

## 3. Regole di dominio

### 3.1 Separazione piano / consuntivo

- `staff_shift_assignments` resta il piano
- `staff_timesheet_entries` resta il consuntivo
- nessun update sul piano deve alterare retroattivamente il consuntivo approvato

### 3.2 Event sourcing leggero

`staff_attendance_events` è la fonte grezza.

`staff_timesheet_entries` è la vista consolidata calcolata dagli eventi.

### 3.3 Lock contabile

Una entry `approved` o `locked`:

- non si modifica direttamente
- ogni correzione successiva genera `adjustment` o nuova revisione auditata

### 3.4 Turni notte e cross-day

Il sistema deve supportare turni che attraversano la mezzanotte:

- `work_date` = data di riferimento del turno
- `actual_ends_at` può cadere nel giorno successivo

### 3.5 Geolocalizzazione opzionale

La geolocalizzazione:

- non blocca la timbratura
- arricchisce audit e verifica
- può generare flag di anomalia se fuori area attesa

## 4. Flussi operativi

## 4.1 Flusso standard

1. coordinatore pianifica il turno
2. educatore esegue `clock-in`
3. educatore esegue eventuali pause
4. educatore esegue `clock-out`
5. backend ricalcola la `timesheet_entry`
6. entry va in `submitted` o `computed`
7. coordinatore approva o rettifica
8. entry va in `approved`
9. a fine periodo, export paghe o foglio presenze

## 4.2 Flusso senza turno pianificato

Supportato per casi eccezionali:

- reperibilità
- sostituzione urgente
- recupero manuale

In quel caso:

- `shift_assignment_id = null`
- entry marcata con anomalia `unplanned_work`

## 4.3 Flusso straordinario

1. entry mostra scostamento positivo
2. utente o coordinatore apre `adjustment`
3. coordinatore approva
4. il delta confluisce in `overtime_minutes`

## 5. Anomalie da calcolare

`anomaly_flags_json` deve poter contenere:

- `late_clock_in`
- `early_clock_out`
- `missing_clock_out`
- `missing_clock_in`
- `overlap_detected`
- `no_break_logged`
- `outside_expected_geofence`
- `unplanned_work`
- `exceeded_weekly_limit`
- `rest_window_violation`

## 6. Permessi applicativi suggeriti

Nuove risorse RBAC:

- `staff_attendance_events.create/read/update`
- `staff_timesheet_entries.read/update/submit/approve/lock/export`
- `staff_timesheet_adjustments.create/read/update/approve`
- `staff_timesheet_exports.read/create`

Perimetro suggerito:

- `EDUCATORE`
  - crea i propri eventi presenza
  - legge le proprie entry
  - può sottomettere o chiedere rettifica sulle proprie entry
- `COORDINATORE`
  - legge e approva tutte le entry della struttura
  - gestisce rettifiche e anomalie
- `DIRETTORE`
  - supervisione, lock finale, export
- `ADMIN_IT`
  - nessun accesso ai contenuti timesheet salvo metadata tecnici se si conferma policy zero-trust

## 7. Audit obbligatorio

Eventi da auditare sempre:

- clock-in
- clock-out
- break-start / break-end
- correzione manuale
- approvazione entry
- rifiuto entry
- lock mensile
- export paghe

Formato minimo coerente col progetto:

- data
- ip
- utente
- operazione
- prima/dopo

## 8. Dipendenze verso altri moduli

- `Turni`: fonte del pianificato
- `Educatori/Operatori`: anagrafica professionale
- `Ruoli/RBAC`: autorizzazioni
- `Audit`: tracciabilità
- `Documenti staff`: eventuale allegato giustificativi
- `Diario educativo`: in futuro possibile coerenza tra chiusura turno e timesheet

## 9. Decisioni tecniche consigliate

- non usare il login utente come prova di presenza
- non salvare il consuntivo solo come campo dentro `staff_shift_assignments`
- non consentire delete fisico delle entry approvate
- introdurre export come snapshot, non come query volatile

## 10. Fasi implementative

### Fase A

- attendance events
- timesheet entries
- compute planned vs actual

### Fase B

- adjustments
- approval flow
- anomaly flags

### Fase C

- export CSV paghe
- export PDF presenze
- period lock

### Fase D

- geofencing opzionale
- notifiche
- dashboard avanzate

