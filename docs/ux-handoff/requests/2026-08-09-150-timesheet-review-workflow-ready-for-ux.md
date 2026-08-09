# Messaggio UX ? backend timesheet review workflow pronto

Data: 2026-08-09  
Priorit?: alta  
Ambito: `Turni > Verifica timesheet`, `Turni > Le mie presenze`

---

## Stato

Il backend del workflow rettifiche timesheet ? **pronto** e validato.

Contratto completo da usare:

- `docs/ux-handoff/requests/2026-08-09-149-timesheet-adjustments-review-workflow-contract.md`

---

## Cosa ? cambiato davvero

Da ora la rettifica non nasce pi? approvata.

Flusso corretto:

1. creazione richiesta
2. stato `pending`
3. approvazione o rifiuto
4. ricalcolo minuti solo su `approved`

---

## Endpoint da usare

- `POST /api/admin/timesheets/{timesheetEntry}/adjustments`
- `POST /api/admin/timesheets/{timesheetEntry}/adjustments/{adjustment}/approve`
- `POST /api/admin/timesheets/{timesheetEntry}/adjustments/{adjustment}/reject`

OpenAPI aggiornata:

- `docs/api/openapi.yaml`

---

## Azioni richieste a UX

### VerificaTimesheetPage

- mostrare le rettifiche `pending/approved/rejected`
- aggiungere azioni inline o da modal per:
  - approvare rettifica pending
  - rifiutare rettifica pending
- mostrare anche metadati revisione:
  - `reviewed_at`
  - `review_notes`

### MiePresenzePage

- sola lettura
- mostrare anche esito revisione e note revisione quando presenti

---

## Regola da non violare

Le rettifiche **non** modificano lo storico timbrature.

Cambiano il consuntivo solo quando lo stato diventa `approved`.

---

## QA minimo richiesto

1. creare rettifica
2. verificare stato iniziale `pending`
3. verificare che i minuti non cambino subito
4. approvare e verificare ricalcolo
5. creare nuova rettifica e rifiutarla
6. verificare nessun impatto sul consuntivo

---

## Nota

Il vecchio handoff `147` non va usato come comportamento finale del workflow revisione, perch? ? stato superato da `149`.
