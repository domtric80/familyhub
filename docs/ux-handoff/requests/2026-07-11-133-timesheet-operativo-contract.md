# Handoff UX/API - Modulo Timesheet operativo

Data: 2026-07-11  
Priorita: altissima  
Ambito: `Turni`, `Timesheet`, `Educatori`, `Paghe`

## 1. Decisione architetturale

Il `Timesheet` non deve riutilizzare direttamente il record di assegnazione turno come unico contenitore del consuntivo.

Separazione obbligatoria:

- `Turno pianificato`
- `Presenza registrata`
- `Consuntivo approvato`

In UI questa distinzione deve essere visibile.

## 2. Oggetti funzionali da rappresentare

### A. Turno pianificato

Fonte:

- `staff_shift_assignments`

Serve a mostrare:

- cosa era previsto
- orario teorico
- struttura
- operatore

### B. Evento presenza

Fonte:

- `staff_attendance_events`

Serve a mostrare:

- entrata
- uscita
- pausa inizio/fine
- eventuali correzioni manuali

### C. Entry timesheet

Fonte:

- `staff_timesheet_entries`

Serve a mostrare:

- pianificato vs lavorato
- minuti ordinari
- minuti straordinari
- minuti pausa
- anomalie
- stato approvazione

## 3. Pagine da prevedere

### 3.1 Operatore - `Le mie presenze`

Funzioni:

- pulsante `Timbra entrata`
- pulsante `Timbra uscita`
- pulsante `Inizia pausa`
- pulsante `Termina pausa`
- lista giornaliera delle timbrature
- tabella delle proprie entry timesheet
- badge anomalie
- stato entry (`draft`, `computed`, `submitted`, `approved`, `rejected`, `locked`)

### 3.2 Coordinatore - `Verifica timesheet`

Filtri:

- struttura
- educatore
- periodo
- stato
- anomalie presenti

Tabella:

- data
- educatore
- turno pianificato
- entrata reale
- uscita reale
- minuti lavorati
- differenza vs pianificato
- straordinari
- anomalie
- stato
- azioni

Azioni:

- apri dettaglio
- approva
- rifiuta
- aggiungi rettifica

### 3.3 Direzione / amministrazione - `Export presenze`

Funzioni:

- selezione struttura
- periodo mensile
- tipo export (`CSV paghe`, `PDF presenze`)
- storico export generati

## 4. UX del dettaglio entry

Il drawer o dettaglio deve avere sezioni distinte:

### `Pianificato`

- turno
- orario teorico
- durata teorica

### `Presenze registrate`

- elenco eventi cronologici
- fonte evento (`web`, `mobile`, `manual`, `system`)
- geolocalizzazione se disponibile

### `Consuntivo`

- minuti ordinari
- minuti straordinari
- pausa
- scostamento
- stato

### `Rettifiche`

- tipo rettifica
- minuti delta
- motivo
- richiedente
- approvatore

### `Audit`

- chi ha timbrato
- chi ha corretto
- chi ha approvato

## 5. Regole UX da rispettare

- mai modificare in place un consuntivo già approvato senza traccia
- mostrare chiaramente quando una entry deriva da turno pianificato vs lavoro non pianificato
- non mescolare il calendario turni con il consuntivo presenze nella stessa tabella principale
- evidenziare le anomalie prima delle ore

## 6. Box informazioni da aggiungere

Titolo:

- `Come funziona il timesheet`

Testo sintetico:

- il turno pianificato indica cosa era previsto
- la timbratura registra cosa è successo realmente
- il timesheet confronta pianificato e lavorato
- eventuali scostamenti vengono approvati dal coordinatore prima dell'export

## 7. Stati da usare senza inventarne altri

Per le entry timesheet:

- `draft`
- `computed`
- `submitted`
- `approved`
- `rejected`
- `locked`

Per le rettifiche:

- `pending`
- `approved`
- `rejected`
- `cancelled`

## 8. Roadmap frontend consigliata

### Step 1

- schermata operatore `Le mie presenze`
- pulsanti timbratura
- lista eventi presenza

### Step 2

- tabella coordinatore di verifica
- badge anomalie
- azioni approva/rifiuta

### Step 3

- rettifiche
- export mensile
- storico export

### Step 4

- dashboard ore
- geofencing visuale
- KPI avanzati

## 9. Perimetro RBAC da assumere in UI

Ruoli e capacità previste lato backend:

- `DIRETTORE`
  - piena visibilità presenze e timesheet della struttura
  - approvazione, lock ed export
- `COORDINATORE`
  - visibilità struttura
  - approvazione e rettifiche
  - export
- `REFERENTE_STRUTTURA`
  - perimetro equivalente a `COORDINATORE`
- `EDUCATORE`
  - timbra i propri eventi
  - legge i propri consuntivi
  - invia il proprio timesheet
  - apre richiesta rettifica
- `EDUCATORE_NOTTURNO`
  - stesso perimetro dell'educatore sul modulo timesheet
- `PEDIATRA` e `PSICOLOGO`
  - nessuna operatività di timbratura
  - sola lettura dove esposta dal backend

Regola UX:

- non mostrare azioni di approvazione a ruoli operativi
- non mostrare azioni di timbratura a ruoli di sola supervisione
- leggere sempre la matrice permessi API restituita dal backend, senza hardcodificare bypass aggiuntivi

## 10. Stato backend attuale - Fase 1 implementata

Endpoint già disponibili:

- `POST /api/staff/attendance-events`
- `GET /api/staff/timesheets/me`
- `GET /api/admin/timesheets`
- `GET /api/admin/timesheets/{timesheetEntry}`

Comportamento effettivo già implementato:

- ogni timbratura crea un `staff_attendance_event`
- il backend ricalcola subito la `staff_timesheet_entry` della giornata
- se esiste un turno pianificato, il consuntivo usa `planned_starts_at`, `planned_ends_at` e `planned_minutes`
- sono già valorizzati:
  - `worked_minutes`
  - `break_minutes`
  - `ordinary_minutes`
  - `overtime_minutes`
  - `night_minutes`
  - `absence_minutes`
  - `variance_minutes`
  - `anomaly_flags_json`

Anomalie oggi esposte dal backend:

- `missing_clock_in`
- `missing_clock_out`
- `unplanned_work`
- `late_clock_in`
- `early_clock_out`
- `no_break_logged`

Vincoli da rispettare lato UX nella Fase 1:

- l'operatore timbra solo per se stesso
- il dettaglio admin deve mostrare anche la sequenza eventi che ha generato il consuntivo
- i pulsanti `approva`, `rifiuta`, `rettifica`, `export`, `lock` non vanno esposti come operativi reali finché non sarà completata la Fase 2/3 backend
