# Handoff UX/API ? Coda revisione rettifiche dashboard timesheet

Data: 2026-08-09  
Ambito: `Turni > Dashboard timesheet`  
Priorit?: alta

---

## Obiettivo

Introdurre una vista rapida, leggibile e operativa della coda rettifiche timesheet.

Questa vista non sostituisce `Verifica timesheet`, ma serve per:

- capire subito quante rettifiche sono da lavorare
- filtrare la coda per struttura / periodo / stato
- aprire velocemente la verifica operativa

---

## Endpoint attivi

### `GET /api/admin/timesheet-adjustments`

Permesso richiesto:

- `staff_timesheet_adjustments.read`

Filtri supportati:

- `facility_id`
- `staff_member_id`
- `status`
- `adjustment_type`
- `date_from`
- `date_to`

Risposta:

- array di righe coda con:
  - identificativo rettifica
  - entry timesheet collegata
  - struttura
  - operatore
  - turno/data
  - delta minuti
  - motivazione
  - stato
  - data creazione
  - dati revisione (`reviewed_at`, `review_notes`)

### `GET /api/admin/timesheet-adjustments/kpis`

Permesso richiesto:

- `staff_timesheet_adjustments.read`

Filtri supportati:

- `facility_id`
- `staff_member_id`
- `date_from`
- `date_to`

Risposta:

```json
{
  "pending_count": 3,
  "approved_count": 6,
  "rejected_count": 1,
  "average_review_hours": 4.25
}
```

---

## Impatto frontend richiesto

### Pagina `Turni > Dashboard timesheet`

Aggiungere un blocco chiamato:

- `Coda revisione rettifiche`

#### KPI superiori

Mostrare quattro card:

- `Rettifiche pending`
- `Rettifiche approvate`
- `Rettifiche rifiutate`
- `Tempo medio revisione`

#### Filtro stato rapido

Select con valori:

- `Solo pending`
- `Solo approved`
- `Solo rejected`
- `Tutti gli stati`

#### Tabella coda

Colonne minime:

- `Struttura`
- `Operatore`
- `Data`
- `Tipo`
- `Delta`
- `Stato`
- `Richiesta`
- `Revisione`
- `Azioni`

Campo `Richiesta`:

- `created_at`
- `reason`

Campo `Revisione`:

- se presente `reviewed_at`
- se presenti `review_notes`
- altrimenti placeholder neutro `?`

Campo `Azioni`:

- bottone `Apri`
- l?azione porta a `Turni > Verifica timesheet`

---

## Regole UX

- questa pagina ? una vista di smistamento e monitoraggio
- non deve duplicare qui la logica completa di approvazione/rifiuto se gi? presente su `Verifica timesheet`
- deve essere comprensibile anche a colpo d?occhio
- il default consigliato per lo stato ? `pending`

---

## QA minima richiesta

1. aprire dashboard timesheet come coordinatore
2. verificare presenza KPI rettifiche
3. verificare default filtro `pending`
4. verificare popolamento tabella coda
5. cambiare filtro stato e verificare aggiornamento elenco
6. usare `Apri` e controllare continuit? verso `Verifica timesheet`
