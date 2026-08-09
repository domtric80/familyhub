# UX Handoff — 2026-08-09 — Export timesheet amministrativo evoluto

## Contesto
Backend completato per lo step roadmap **1C Export amministrativo evoluto** del modulo `Turni / Timesheet`.

## Obiettivo
Mantenere un solo endpoint di export CSV, ma consentire alla UI di scegliere il **preset di esportazione** in base all’uso:

- `payroll` → export paghe sintetico
- `review` → export controllo/revisione coordinatore-amministrazione
- `labor_consultant` → export dettagliato per consulente del lavoro

## Endpoint
`GET /api/admin/timesheets/export.csv`

### Query params
- `facility_id` obbligatorio
- `year` obbligatorio
- `month` obbligatorio
- `format=csv` obbligatorio
- `preset` opzionale:
  - `payroll`
  - `review`
  - `labor_consultant`

Se `preset` non è passato, il backend usa `payroll`.

## Regole backend
L’export include solo entry in stato:
- `approved`
- `locked`

Errori `422`:
- parametri mancanti/non validi

Errore `404`:
- nessuna entry approvata o bloccata nel periodo selezionato

## Preset disponibili

### 1) `payroll`
Pensato per paghe/amministrazione veloce.

Colonne:
- `entry_id`
- `work_date`
- `facility`
- `staff_member`
- `employee_code`
- `shift_template`
- `planned_minutes`
- `worked_minutes`
- `break_minutes`
- `ordinary_minutes`
- `overtime_minutes`
- `night_minutes`
- `absence_minutes`
- `variance_minutes`
- `status`
- `approved_adjustments_minutes`
- `approved_adjustments_count`
- `pending_adjustments_count`

### 2) `review`
Pensato per revisione interna e controllo workflow.

Colonne:
- `entry_id`
- `work_date`
- `facility`
- `staff_member`
- `employee_code`
- `shift_template`
- `status`
- `submitted_at`
- `submitted_by`
- `approved_at`
- `approved_by`
- `locked_at`
- `anomalies`
- `requested_adjustments_count`
- `pending_adjustments_count`
- `approved_adjustments_count`
- `rejected_adjustments_count`
- `approved_adjustments_minutes`
- `adjustments_detail`
- `notes`

### 3) `labor_consultant`
Pensato per esportazione più completa verso consulente del lavoro.

Colonne:
- `entry_id`
- `work_date`
- `facility`
- `staff_member`
- `employee_code`
- `qualification`
- `shift_template`
- `planned_minutes`
- `worked_minutes`
- `break_minutes`
- `ordinary_minutes`
- `overtime_minutes`
- `night_minutes`
- `absence_minutes`
- `variance_minutes`
- `status`
- `approved_adjustments_minutes`
- `adjustments_detail`
- `submitted_at`
- `approved_at`
- `locked_at`

## Campo `adjustments_detail`
È una stringa leggibile, aggregata dal backend, ad esempio:

`#12 manual_correction +30min [approved] req:2026-08-09 18:10 note:Rettifica per chiusura turno registrata in ritardo. review:2026-08-09 18:12 by Mario Rossi`

UX non deve parsarla: va mostrata/esportata così com’è.

## Comportamento UI richiesto

### Pagina `Export presenze`
Aggiornare il blocco scelta formato/preset:

- mantenere `Formato = CSV`
- aggiungere nuova select/radio `Preset export`

Valori consigliati:
- `CSV paghe`
- `CSV revisione`
- `CSV consulente lavoro`

### Testi guida suggeriti
- `CSV paghe`: export sintetico per conteggi mensili e straordinari
- `CSV revisione`: include workflow approvazioni, anomalie e dettaglio rettifiche
- `CSV consulente lavoro`: include anche qualifica operatore e dettaglio amministrativo

### Naming file lato UI
Il backend restituisce già un filename coerente; se il browser non lo preserva, usare:
- `timesheet_payroll_{facility}_{yyyy}_{mm}.csv`
- `timesheet_review_{facility}_{yyyy}_{mm}.csv`
- `timesheet_labor_consultant_{facility}_{yyyy}_{mm}.csv`

## Checklist QA UX
- export default senza `preset` → funziona come `payroll`
- export `review` scarica intestazioni corrette
- export `labor_consultant` scarica intestazioni corrette
- gestione toast errore `404`
- gestione messaggio backend `422`
- nessun riferimento residuo a “solo CSV paghe disponibile”
