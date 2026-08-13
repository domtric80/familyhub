# UX Handoff — 2026-08-13 — Timesheet avanzato: anomalie, dashboard e geo eventi

## Ambito

- `Turni > Dashboard coordinatore`
- `Turni > Verifica timesheet`
- `Turni > Le mie presenze`

Backend completato per il blocco finale di maturazione operativa del modulo `Timesheet`.

---

## 1. Nuovi flag anomalia disponibili

Ogni `TimesheetEntry.anomaly_flags_json` può ora includere anche:

- `overtime_detected`
- `absence_detected`
- `maximum_daily_hours_exceeded`
- `minimum_rest_violation`
- `weekly_hours_threshold_exceeded`

### Label UX consigliate

| Codice | Label |
|---|---|
| `overtime_detected` | Straordinario rilevato |
| `absence_detected` | Assenza / copertura incompleta |
| `maximum_daily_hours_exceeded` | Superamento ore giornaliere |
| `minimum_rest_violation` | Riposo minimo non rispettato |
| `weekly_hours_threshold_exceeded` | Superamento soglia settimanale |

Non introdurre input libero: usare mappa label frontend.

---

## 2. Endpoint impattato — Dashboard coordinatore

### `GET /api/admin/timesheets/dashboard-summary`

Nuovi campi in `summary`:

```json
{
  "night_minutes_total": 30,
  "minimum_rest_violations_count": 1,
  "maximum_daily_hours_violations_count": 1,
  "weekly_hours_threshold_exceeded_count": 0,
  "staff_with_open_anomalies_count": 1
}
```

Nuovi campi per ogni riga `open_anomalies[]`:

```json
{
  "actual_start": "2026-07-30T06:00:00+02:00",
  "actual_end": "2026-07-30T14:00:00+02:00",
  "night_minutes": 0
}
```

Nuove collezioni:

### `staff_totals[]`

```json
{
  "staff_member": {
    "id": 12,
    "first_name": "Luca",
    "last_name": "Verdi",
    "display_name": "Verdi Luca",
    "employee_code": "EDU-001"
  },
  "entries_total": 8,
  "worked_minutes_total": 2520,
  "ordinary_minutes_total": 2280,
  "overtime_minutes_total": 240,
  "night_minutes_total": 120,
  "absence_minutes_total": 60,
  "anomaly_entries_count": 2,
  "minimum_rest_violations_count": 1,
  "maximum_daily_hours_violations_count": 0,
  "pending_adjustments_count": 1
}
```

### `facility_totals[]`

```json
{
  "facility": {
    "id": 3,
    "name": "Arcobaleno"
  },
  "entries_total": 44,
  "worked_minutes_total": 18420,
  "ordinary_minutes_total": 16980,
  "overtime_minutes_total": 1440,
  "night_minutes_total": 510,
  "absence_minutes_total": 360,
  "anomaly_entries_count": 6
}
```

---

## 3. Cosa deve fare UX — Dashboard coordinatore

### KPI aggiuntivi da mostrare

Aggiungere card o righe KPI per:

- `Ore notturne`
- `Violazioni riposo minimo`
- `Superamenti ore giornaliere`
- `Operatori con anomalie aperte`

### Nuove sezioni consigliate

#### A. `Ore per operatore`

Tabella con colonne:

- Operatore
- Entry
- Ore lavorate
- Ore straordinarie
- Ore notturne
- Assenze
- Anomalie
- Rettifiche pending

#### B. `Totali per struttura`

Tabella con colonne:

- Struttura
- Entry
- Ore lavorate
- Ore straordinarie
- Ore notturne
- Assenze
- Entry con anomalie

### Priorità visiva

Le anomalie:

- `minimum_rest_violation`
- `maximum_daily_hours_exceeded`
- `weekly_hours_threshold_exceeded`

devono avere resa visiva più forte rispetto a `late_clock_in` o `early_clock_out`.

---

## 4. Cosa deve fare UX — Dettaglio entry timesheet

In:

- `Turni > Verifica timesheet`
- `Turni > Le mie presenze`

per ogni riga di `attendance_events[]` usare anche:

- `geo_latitude`
- `geo_longitude`

### Rendering richiesto

Per ogni evento presenza:

- mostra `sorgente`
- mostra `ora`
- mostra badge:
  - `Posizione disponibile`
  - `Posizione assente`

Se coordinate presenti:

- mostra link esterno mappa, ad esempio OpenStreetMap o Google Maps
- non chiedere nuovo endpoint backend

### Formula link mappa

Esempio OSM:

```text
https://www.openstreetmap.org/?mlat={LAT}&mlon={LON}#map=17/{LAT}/{LON}
```

---

## 5. QA minima richiesta a UX

### Dashboard

- [ ] I nuovi KPI leggono i valori reali del backend
- [ ] Le tabelle `staff_totals` e `facility_totals` non vanno in crash se vuote
- [ ] Le nuove anomalie hanno label leggibile

### Dettaglio entry

- [ ] Se esiste `geo_latitude/geo_longitude`, compare il link mappa
- [ ] Se non esistono coordinate, compare stato coerente “posizione assente”
- [ ] Nessun campo testuale libero introdotto per i flag

---

## 6. Nota importante

Questo handoff **non** richiede nuove chiamate frontend aggiuntive oltre ai payload già esposti.

Il backend è già pronto.
