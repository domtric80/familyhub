# 2026-08-10  Turni planner: contract planned vs actual

## Obiettivo
Esporre nel planner e nella settimana personale dati sintetici del turno effettivo senza cambiare il modello dati e senza introdurre una nuova entit API distinta.

## Scelta implementativa
Invece di creare subito un endpoint separato `actual shifts`, il backend arricchisce l'assegnazione turno con un sotto-blocco `actual` derivato dall'ultima `staff_timesheet_entry` legata a `shift_assignment_id`.

## Vantaggi
- compatibile con il frontend esistente
- consente a UX di progettare la distinzione planned/actual gi da ora
- non richiede migrazioni DB
- mantiene la fonte canonica del consuntivo nel timesheet

## Dati aggiunti
Per assegnazione:
- stato effettivo
- actual start/end
- worked/planned/variance/overtime/absence minutes
- anomaly flags

Per blocco settimanale:
- `actual_started_count`
- `actual_completed_count`
- `actual_coverage_gap`
- `anomaly_count`

## Copertura test
Esteso `StaffShiftApiTest` con caso completo:
- assegnazione turno
- clock_in/clock_out
- verifica week view coordinatore
- verifica my-week educatore
