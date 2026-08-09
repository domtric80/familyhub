# UX Handoff — 2026-08-09 — Export presenze PDF

## Contesto
Backend completato per il nuovo export PDF del modulo `Turni / Timesheet`, senza modificare il flusso CSV già esistente.

## Obiettivo
Consentire alla UI di scaricare il **report mensile presenze in PDF** usando gli stessi filtri e preset già disponibili per il CSV.

## Endpoint nuovo
`GET /api/admin/timesheets/export.pdf`

### Query params
- `facility_id` obbligatorio
- `year` obbligatorio
- `month` obbligatorio
- `preset` opzionale:
  - `payroll`
  - `review`
  - `labor_consultant`

Se `preset` non è passato, il backend usa `payroll`.

## Regole backend
- il PDF include solo entry in stato `approved` o `locked`
- stesso dataset logico del CSV
- stesso controllo permessi del CSV:
  - permesso richiesto `staff_timesheet_entries.export`

## Risposte
### `200 OK`
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="timesheet_{preset}_{facilityId}_{yyyy}_{mm}.pdf"`

### `404`
Nessuna entry approvata o bloccata nel periodo selezionato.

### `422`
Parametri mancanti o non validi.

## Contenuto PDF
Header documento:
- titolo `Export presenze`
- struttura
- periodo (`mm/yyyy`)
- data/ora generazione
- numero righe esportate
- preset selezionato

Tabella:
- colonne coerenti con il preset scelto
- righe coerenti con i dati dell’export CSV

Footer:
- nota informativa che il report include solo entry approvate o bloccate

## UI richiesta
Pagina interessata: `Turni > Export presenze`

### Modifica richiesta
Aggiungere selezione **Formato export** con due opzioni:
- `CSV`
- `PDF`

Comportamento:
- se `CSV` → usare endpoint esistente `GET /api/admin/timesheets/export.csv`
- se `PDF` → usare nuovo endpoint `GET /api/admin/timesheets/export.pdf`

### Preset
I preset restano identici per entrambi i formati:
- `CSV/PDF paghe`
- `CSV/PDF revisione`
- `CSV/PDF consulente lavoro`

Testi guida consigliati:
- `Paghe` → export sintetico per conteggi mensili e straordinari
- `Revisione` → include workflow approvazioni, anomalie e dettaglio rettifiche
- `Consulente lavoro` → include anche qualifica operatore e dettaglio amministrativo

## Adeguamento service layer frontend
È già disponibile lato codice shared:
- `timesheetApi.exportMonthly(...)` per CSV
- `timesheetApi.exportMonthlyPdf(...)` per PDF

UX/frontend non deve reinventare la chiamata HTTP.

## Checklist QA UX
- formato `PDF` scarica un file `.pdf`
- preset `review` e `labor_consultant` funzionano anche in PDF
- gestione toast `404`
- gestione errori `422`
- nessun riferimento residuo a “PDF non disponibile”
- naming file coerente con `Content-Disposition`
