# FamilyHub — Roadmap esecutiva modulo Timesheet

Data: 2026-07-11

## Fase 1 — Base operativa

Obiettivo:

- registrare presenze reali
- calcolare il consuntivo minimo

Deliverable:

- tabella `staff_attendance_events`
- tabella `staff_timesheet_entries`
- timbratura entrata/uscita/pausa
- vista personale operatore
- confronto pianificato vs lavorato

## Fase 2 — Governo e controllo

Obiettivo:

- rendere il consuntivo verificabile e approvabile

Deliverable:

- anomalie automatiche
- rettifiche timesheet
- approvazione coordinatore
- rifiuto e rinvio
- audit completo

## Fase 3 — Chiusura amministrativa

Obiettivo:

- usare il timesheet per il ciclo presenze/paghe

Deliverable:

- chiusura periodo
- export CSV paghe
- export PDF foglio presenze
- snapshot export

## Fase 4 — Evoluzione avanzata

Obiettivo:

- aumentare qualità del controllo e supporto direzionale

Deliverable:

- dashboard ore struttura/educatore
- geolocalizzazione opzionale
- notifiche anomalie
- regole riposo minimo / tetto ore
- gestione sostituzioni collegata al timesheet

## Dipendenze

- modulo `Turni` già attivo
- collegamento `User` ↔ `StaffMember`
- RBAC strutturale
- audit log

## Rischi da evitare

- mescolare pianificato e consuntivo nella stessa tabella
- permettere edit silenziosi dei consuntivi approvati
- usare il login come prova presenza
- bloccare la timbratura solo perché manca geolocalizzazione

