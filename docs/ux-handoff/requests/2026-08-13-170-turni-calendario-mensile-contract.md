# UX Handoff 170 — Turni: calendario mensile struttura + calendario mensile operatore

Data: 2026-08-13
Ambito: `Turni > Pianificazione`, `Turni > I miei turni`
Priorità: Alta

## Stato backend

Backend pronto.

Questo handoff è pensato per permettere al team UX di lavorare **in asincrono** senza dover ricostruire la semantica dei payload.

---

## 1. Endpoint nuovi

### A. Calendario mensile struttura

`GET /api/admin/staff-shifts/month`

#### Query params

- `facility_id` **required**
- `year` **required**
- `month` **required**
- `staff_member_id` optional

#### Uso consigliato

- default: calendario mensile di tutta la struttura;
- opzionale: filtro su singolo operatore dentro la stessa struttura.

### B. Calendario mensile operatore autenticato

`GET /api/staff-shifts/my-month`

#### Query params

- `year` **required**
- `month` **required**

#### Uso consigliato

- pagina personale “i miei turni del mese”;
- non mostra i turni di altri operatori.

---

## 2. Contratto — calendario mensile struttura

### Payload root

```json
{
  "facility_id": 3,
  "staff_member_id": null,
  "year": 2026,
  "month": 8,
  "month_start": "2026-08-01",
  "month_end": "2026-08-31",
  "summary": { "...": "..." },
  "days": [ "..."]
}
```

### `summary`

```json
{
  "days_in_month": 31,
  "total_assignments": 44,
  "planned_assignments_count": 10,
  "confirmed_assignments_count": 24,
  "completed_assignments_count": 8,
  "cancelled_assignments_count": 2,
  "days_with_coverage_gap_count": 5,
  "days_with_actual_gap_count": 7,
  "days_with_anomalies_count": 4,
  "minimum_staff_required_total": 93,
  "assigned_count_total": 88,
  "actual_completed_count_total": 72
}
```

### `days[]`

Ogni giorno contiene:

```json
{
  "date": "2026-08-10",
  "day_of_week_iso": 1,
  "is_weekend": false,
  "shifts": [ "..."],
  "summary": {
    "minimum_staff_required_total": 3,
    "assigned_count_total": 2,
    "coverage_gap_total": 1,
    "actual_started_count_total": 1,
    "actual_completed_count_total": 1,
    "actual_coverage_gap_total": 2,
    "anomaly_count": 1
  }
}
```

### `days[].shifts[]`

Ogni blocco turno usa la stessa semantica della vista settimanale:

```json
{
  "shift_template": {
    "id": 7,
    "code": "DAY",
    "name": "Turno giorno"
  },
  "minimum_staff_required": 2,
  "assigned_count": 2,
  "coverage_gap": 0,
  "actual_started_count": 1,
  "actual_completed_count": 1,
  "actual_coverage_gap": 1,
  "anomaly_count": 1,
  "assignments": [ "..."]
}
```

### `assignments[]`

Ogni assegnazione mantiene il contratto già noto e include il blocco:

- `actual.timesheet_entry_id`
- `actual.status`
- `actual.started`
- `actual.completed`
- `actual.planned_start`
- `actual.planned_end`
- `actual.actual_start`
- `actual.actual_end`
- `actual.planned_minutes`
- `actual.worked_minutes`
- `actual.break_minutes`
- `actual.ordinary_minutes`
- `actual.overtime_minutes`
- `actual.absence_minutes`
- `actual.variance_minutes`
- `actual.has_anomaly`
- `actual.anomaly_flags[]`

---

## 3. Contratto — calendario mensile operatore

### Payload root

```json
{
  "staff_member": {
    "id": 12,
    "first_name": "Luca",
    "last_name": "Verdi"
  },
  "year": 2026,
  "month": 8,
  "month_start": "2026-08-01",
  "month_end": "2026-08-31",
  "summary": { "...": "..." },
  "days": [ "..."]
}
```

### `summary`

```json
{
  "days_in_month": 31,
  "total_assignments": 14,
  "completed_assignments_count": 9,
  "days_with_assignments_count": 11,
  "days_with_anomalies_count": 2,
  "planned_minutes_total": 6720,
  "worked_minutes_total": 6890
}
```

### `days[]`

```json
{
  "date": "2026-08-12",
  "is_weekend": false,
  "assignments": [ "..."],
  "summary": {
    "assigned_count": 1,
    "completed_count": 1,
    "anomaly_count": 1,
    "planned_minutes_total": 480,
    "worked_minutes_total": 510
  }
}
```

---

## 4. Cosa deve fare UX — vista struttura

### Obiettivo

Costruire un vero calendario mensile e non una semplice tabella lineare.

### Minimo richiesto

Per ogni giorno del mese mostrare:

- giorno calendario;
- eventuale badge weekend;
- uno o più blocchi turno;
- copertura pianificata;
- copertura effettiva;
- alert se c’è gap o anomalia.

### Gerarchia visiva consigliata

#### Livello giorno

- numero giorno
- stato sintetico:
  - verde = copertura piena
  - giallo = gap pianificato
  - rosso = gap effettivo o anomalie

#### Livello blocco turno

Per ogni template turno:

- nome turno
- `assigned_count / minimum_staff_required`
- `actual_completed_count / minimum_staff_required`
- badge anomalie se `anomaly_count > 0`

#### Livello assegnazione

In drawer/modal/popover:

- operatore
- stato assegnazione
- stato effettivo (`actual.status`)
- orario previsto vs effettivo
- flag anomalia

---

## 5. Cosa deve fare UX — vista personale operatore

### Obiettivo

Fornire una lettura mensile semplice dell’operatore autenticato.

### Minimo richiesto

Per ogni giorno:

- se ha turni o no;
- quanti turni ha;
- se il giorno presenta anomalie;
- minuti pianificati vs minuti lavorati.

### Vista consigliata

- griglia mensile
- click sul giorno -> elenco turni del giorno
- alternativa mobile: lista per giorni del mese

---

## 6. Regole da non reinterpretare lato UX

UX non deve:

- calcolare da sé coperture o gap;
- dedurre lo stato operativo dal solo `status` dell’assegnazione;
- inferire il consuntivo fuori dal blocco `actual`.

Usare sempre i campi già esposti dal backend.

---

## 7. QA minima richiesta

### Vista struttura

- [ ] mese corretto da `month_start` a `month_end`
- [ ] giorni senza turni renderizzati senza crash
- [ ] `coverage_gap_total` visibile in modo coerente
- [ ] `actual_coverage_gap_total` distinto dal gap pianificato
- [ ] `anomaly_count` visibile senza leggere le singole entry

### Vista personale

- [ ] mostra solo i turni dell’utente autenticato
- [ ] somma corretta minuti pianificati/lavorati
- [ ] giorni senza assegnazioni mostrati come vuoti

---

## 8. Nota importante

Questo handoff copre solo **step 1: calendario mensile**.

Non include ancora:

- sostituzioni;
- ferie/malattia/permessi tipizzati;
- notifiche turno;
- drag-and-drop planner.

Questi arriveranno in step successivi con handoff separati.
