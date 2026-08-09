# UX Handoff — 2026-08-09 — Dashboard timesheet coordinatore

## Contesto
Backend completato per lo step roadmap **1D Dashboard timesheet coordinatore**.

Obiettivo: fornire una vista unica con KPI e liste operative già aggregate dal backend, senza costringere il frontend a ricostruire la logica da più endpoint.

## Endpoint nuovo
`GET /api/admin/timesheets/dashboard-summary`

### Query params supportati
- `facility_id` opzionale ma consigliato
- `staff_member_id` opzionale
- `date_from` opzionale
- `date_to` opzionale

Uso previsto UX:
- struttura selezionata in dashboard
- periodo corrente come default

## Response shape
```json
{
  "summary": {
    "entries_total": 42,
    "submitted_entries_count": 6,
    "approved_or_locked_entries_count": 28,
    "open_anomalies_count": 4,
    "overtime_minutes_total": 510,
    "absence_reconciliations_count": 3,
    "absence_reconciled_minutes_total": -120,
    "pending_adjustments_count": 2
  },
  "open_anomalies": [],
  "top_overtime_entries": [],
  "absence_reconciliations": [],
  "pending_adjustments": []
}
```

## Significato KPI

### `entries_total`
Numero totale entry timesheet nel filtro selezionato.

### `submitted_entries_count`
Entry in stato `submitted`.

### `approved_or_locked_entries_count`
Entry in stato `approved` oppure `locked`.

### `open_anomalies_count`
Entry con anomalie ancora operative, cioè con `anomaly_flags` presenti e stato:
- `draft`
- `computed`
- `submitted`
- `rejected`

Non include le entry già `locked`.

### `overtime_minutes_total`
Somma dei `overtime_minutes` già ricalcolati dal backend.

### `absence_reconciliations_count`
Numero di rettifiche approvate di tipo `absence_reconciliation`.

### `absence_reconciled_minutes_total`
Somma dei `delta_minutes` delle rettifiche approvate di tipo `absence_reconciliation`.
Può essere negativa.

### `pending_adjustments_count`
Numero totale rettifiche `pending` nel filtro selezionato.

## Blocchi lista

### 1) `open_anomalies`
Massimo 8 righe.

Shape per riga:
```json
{
  "id": 77,
  "work_date": "2026-07-28",
  "status": "submitted",
  "variance_minutes": -60,
  "overtime_minutes": 0,
  "absence_minutes": 60,
  "anomaly_flags": ["late_clock_in", "early_clock_out"],
  "facility": { "id": 2, "name": "Arcobaleno" },
  "staff_member": {
    "id": 9,
    "first_name": "Luca",
    "last_name": "Verdi",
    "display_name": "Verdi Luca",
    "employee_code": "EDU-001"
  }
}
```

### 2) `top_overtime_entries`
Massimo 8 righe, ordinate per `overtime_minutes` decrescente.

### 3) `absence_reconciliations`
Massimo 8 righe, solo rettifiche approvate di tipo `absence_reconciliation`.

Shape:
```json
{
  "id": 15,
  "timesheet_entry_id": 77,
  "delta_minutes": -30,
  "reason": "Riconciliazione assenza parziale autorizzata.",
  "reviewed_at": "2026-08-09T18:20:00+02:00",
  "timesheet_entry": {
    "id": 77,
    "work_date": "2026-07-28",
    "facility": { "id": 2, "name": "Arcobaleno" },
    "staff_member": {
      "id": 9,
      "first_name": "Luca",
      "last_name": "Verdi",
      "display_name": "Verdi Luca",
      "employee_code": "EDU-001"
    }
  }
}
```

### 4) `pending_adjustments`
Massimo 8 righe, solo rettifiche `pending`.

## Uso UX consigliato

### KPI card
Sostituire o integrare le card calcolate lato client con:
- anomalie aperte
- straordinari struttura
- assenze riconciliate
- rettifiche da approvare

### Tabelle/box
Creare 4 box operativi:
- `Anomalie aperte`
- `Top straordinari`
- `Assenze riconciliate`
- `Rettifiche da approvare`

### CTA consigliati
- anomalie aperte → link a `Verifica timesheet`
- top straordinari → link a `Verifica timesheet`
- assenze riconciliate → link a `Verifica timesheet` o `Export presenze`
- rettifiche da approvare → link a `Verifica timesheet`

## Note importanti
- `pending_adjustments_count` è il totale reale, non il numero di righe mostrate
- le liste sono volutamente limitate a 8 righe per dashboard
- per drill-down completo continuare a usare pagine dedicate già esistenti

## Checklist QA UX
- cambio struttura aggiorna summary
- filtro periodo aggiorna KPI
- anomalie aperte mostra solo entry non chiuse
- top straordinari ordinati decrescente
- rettifiche pending coerenti con coda revisione
- assenze riconciliate coerenti con rettifiche approvate di tipo specifico
