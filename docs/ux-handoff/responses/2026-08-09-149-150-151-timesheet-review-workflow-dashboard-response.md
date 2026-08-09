# Risposta UX — Handoff 149 + 150 + 151: Workflow revisione rettifiche timesheet + Dashboard

Data: 2026-08-09  
Stato: implementato (149 quasi tutto già presente; 151 già completo; fix puntuale su MiePresentePage)

---

## Handoff 149 + 150 — Workflow revisione rettifiche

### Stato pre-handoff

La grande maggioranza era già implementata dalla sessione precedente (handoff 147).

### Checklist VerificaTimesheetPage

- [x] Rettifiche nascono con `status = pending` (comportamento backend, non UI)
- [x] CTA creazione: `Invia richiesta`
- [x] Toast creazione: `Richiesta di rettifica registrata e in attesa di approvazione.`
- [x] Tabella rettifiche: Tipo | Δ min | Motivo | Stato | Creata il | Revisione | Azioni
- [x] Colonna Revisione: mostra `reviewed_at` + `review_notes` se presenti, altrimenti `—`
- [x] Colonna Azioni: pulsanti `✓` e `✗` visibili solo per rettifiche `pending`
- [x] Modal approvazione: note facoltative, CTA `Conferma approvazione`
- [x] Modal rifiuto: motivazione obbligatoria, CTA `Conferma rifiuto`
- [x] `timesheetApi.approveAdjustment(timesheetId, adjustmentId, notes?)` → `POST /api/admin/timesheets/{id}/adjustments/{adj}/approve`
- [x] `timesheetApi.rejectAdjustment(timesheetId, adjustmentId, notes)` → `POST /api/admin/timesheets/{id}/adjustments/{adj}/reject`
- [x] Toast post-revisione: `Rettifica approvata.` / `Rettifica rifiutata.`
- [x] Permesso guard: pulsanti revisione controllati da `canReview` (`staff_timesheet_adjustments.approve`)

### Checklist MiePresentePage ← **fix di questa sessione**

- [x] Tabella rettifiche: aggiunta colonna `Creata il` (`created_at`) in sola lettura
- [x] Tabella rettifiche: aggiunta colonna `Revisione` con `reviewed_at` + `review_notes` in sola lettura
- [x] Nessun pulsante azione lato operatore

---

## Handoff 151 — Dashboard timesheet: coda revisione rettifiche

### Stato pre-handoff

Già completamente implementato in `TimesheetPage.tsx`.

### Checklist

- [x] KPI card: `Rettifiche pending` da `adjustmentKpis.pending_count`
- [x] KPI card: `Rettifiche approvate` da `adjustmentKpis.approved_count`
- [x] KPI card: `Rettifiche rifiutate` da `adjustmentKpis.rejected_count`
- [x] KPI card: `Tempo medio revisione` da `adjustmentKpis.average_review_hours`
- [x] Sezione `Coda revisione rettifiche` visibile solo se `canReview`
- [x] Filtro stato rapido: `pending` (default) / `approved` / `rejected` / tutti
- [x] Tabella: Struttura | Operatore | Data | Tipo | Delta | Stato | Richiesta | Revisione | Azioni
- [x] Colonna Richiesta: `created_at` + `reason`
- [x] Colonna Revisione: `reviewed_at` + `review_notes` se presenti, altrimenti `—`
- [x] Bottone `Apri` → naviga a `/turni/verifica` (navigazione su lista, non su entry singola)
- [x] Endpoint: `GET /api/admin/timesheet-adjustments` con filtri `facility_id`, `date_from`, `date_to`, `status`
- [x] Endpoint KPI: `GET /api/admin/timesheet-adjustments/kpis`
- [x] Sidebar: voce `Dashboard timesheet` → `/turni/timesheet`

---

## Regola funzionale rispettata

Le rettifiche `pending` e `rejected` **non** entrano nel consuntivo minuti. Solo le `approved` contribuiscono al Δ finale. Questa logica è lato backend; il frontend mostra il `delta_minutes` dell'entry che riflette già solo le `approved`.

---

## TypeScript

`tsc -b --noEmit` → 0 errori.
