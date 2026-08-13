# UX Handoff 174 - Timesheet master handoff finale

Data: 2026-08-13
Ambito: `Turni`, `Le mie presenze`, `Verifica timesheet`, `Dashboard timesheet`, `Lock mese`, `Export`
Priorita: Alta

## Stato backend

Backend Timesheet pronto.

Questo documento chiude il blocco `Timesheet` lato backend e serve come indice unico per il team UX, che puo lavorare in asincrono senza dover ricostruire la mappa delle dipendenze.

---

## 1. Cosa consideriamo incluso nel modulo Timesheet

Il blocco `Timesheet` comprende:

1. eventi presenza
2. consuntivo entry timesheet
3. chiusura e firma operativa
4. revisione entry da parte del coordinatore
5. rettifiche
6. dashboard e anomalie
7. blocco mensile
8. export CSV/PDF
9. integrazione con turni pianificati e sostituzioni

---

## 2. Pagine UX da realizzare

### A. `Turni > I miei turni`

Fonte principale:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-170-turni-calendario-mensile-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-171-turni-sostituzioni-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-172-turni-chiusura-firma-contract.md`

Contenuto minimo:

- calendario personale mese
- settimana personale
- dettaglio turno
- chiusura e firma turno
- evidenza sostituzioni attive

### B. `Turni > Pianificazione`

Fonte principale:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-11-131-turni-h24-settimanali-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-10-166-turni-planned-vs-actual-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-170-turni-calendario-mensile-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-171-turni-sostituzioni-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-173-turni-scostamenti-anomalie-contract.md`

Contenuto minimo:

- planner settimanale
- calendario mensile struttura
- storico sostituzioni
- vista scostamenti e anomalie

### C. `Turni > Le mie presenze`

Fonte principale:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-11-133-timesheet-operativo-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-31-136-timesheet-api-alignment-and-frontend-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-172-turni-chiusura-firma-contract.md`

Contenuto minimo:

- lista delle proprie entry
- dettaglio entry
- stato consuntivo
- anomalie
- eventuali rettifiche collegate

### D. `Turni > Verifica timesheet`

Fonte principale:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-09-149-timesheet-adjustments-review-workflow-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-09-150-timesheet-review-workflow-ready-for-ux.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-09-151-timesheet-review-queue-dashboard-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-167-timesheet-advanced-anomalies-and-dashboard-contract.md`

Contenuto minimo:

- filtro per struttura, operatore, periodo, stato
- lista entry timesheet
- dettaglio entry
- approva/rifiuta
- gestione rettifiche

### E. `Turni > Dashboard timesheet`

Fonte principale:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-09-155-timesheet-coordinator-dashboard-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-167-timesheet-advanced-anomalies-and-dashboard-contract.md`

Contenuto minimo:

- KPI
- anomalie aperte
- top straordinari
- riconciliazioni assenza
- rettifiche pending
- totali per operatore
- totali per struttura

### F. `Turni > Chiusura mese`

Fonte principale:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-09-153-timesheet-month-lock-contract.md`

Contenuto minimo:

- storico lock mese
- azione blocca mese
- azione sblocca mese
- evidenza impatto del lock

### G. `Turni > Export`

Fonte principale:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-09-154-timesheet-export-advanced-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-09-156-timesheet-pdf-export-contract.md`

Contenuto minimo:

- scelta struttura
- scelta periodo
- preset export
- download CSV
- download PDF

---

## 3. Regola architetturale da non violare

UX non deve mai trattare come equivalenti:

- turno pianificato
- evento presenza
- entry timesheet

Tre oggetti diversi, tre livelli diversi.

In particolare:

- `staff_shift_assignment` = piano
- `staff_attendance_event` = fatto grezzo
- `staff_timesheet_entry` = consuntivo

---

## 4. Dipendenze logiche tra le pagine

Ordine mentale corretto per UX:

1. vedere i turni
2. registrare/leggere presenze
3. chiudere il turno
4. verificare il consuntivo
5. rettificare se serve
6. approvare
7. bloccare il mese
8. esportare

Se la UI mescola questi livelli, l'utilizzatore perde controllo del processo.

---

## 5. Endpoints principali da usare

### Operatore

- `GET /api/staff-shifts/my-week`
- `GET /api/staff-shifts/my-month`
- `POST /api/staff-shifts/{shift_assignment}/submit`
- `GET /api/staff/timesheets/me`
- `POST /api/staff/timesheets/{timesheetEntry}/submit`
- `POST /api/staff/attendance-events`

### Coordinatore / amministrazione

- `GET /api/admin/staff-shifts/week`
- `GET /api/admin/staff-shifts/month`
- `GET /api/admin/staff-shifts/exceptions`
- `GET /api/admin/staff-shifts/{shift_assignment}/substitutions`
- `POST /api/admin/staff-shifts/{shift_assignment}/substitutions`
- `POST /api/admin/staff-shifts/{shift_assignment}/substitutions/{substitution}/cancel`
- `GET /api/admin/timesheets`
- `GET /api/admin/timesheets/{timesheetEntry}`
- `POST /api/admin/timesheets/{timesheetEntry}/approve`
- `POST /api/admin/timesheets/{timesheetEntry}/reject`
- `POST /api/admin/timesheets/{timesheetEntry}/adjustments`
- `POST /api/admin/timesheets/{timesheetEntry}/adjustments/{adjustment}/approve`
- `POST /api/admin/timesheets/{timesheetEntry}/adjustments/{adjustment}/reject`
- `GET /api/admin/timesheet-adjustments`
- `GET /api/admin/timesheet-adjustments/kpis`
- `GET /api/admin/timesheets/dashboard-summary`
- `GET /api/admin/timesheet-month-locks`
- `POST /api/admin/timesheet-month-locks`
- `POST /api/admin/timesheet-month-locks/{monthLock}/unlock`
- `GET /api/admin/timesheets/export.csv`
- `GET /api/admin/timesheets/export.pdf`

Specifica sorgente:

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

---

## 6. Regole UX obbligatorie

### A. Usare sempre i KPI backend

Non ricostruire i numeri da liste parziali lato client.

### B. Usare sempre gli stati backend

Non inferire approvazioni o lock da segnali indiretti.

### C. Distinguere firma operativa e approvazione amministrativa

Sono due fasi diverse.

### D. Mostrare sempre le anomalie con evidenza

Le anomalie sono parte del dominio, non solo warning cosmetici.

### E. Non nascondere le sostituzioni

Quando un turno e coperto da un sostituto, la UI deve mostrare sia titolare sia effettivo.

---

## 7. Checklist finale per UX

- [ ] Vista personale turni operatore collegata agli endpoint `my-week` e `my-month`
- [ ] Chiusura/firma turno collegata a `POST /api/staff-shifts/{shift_assignment}/submit`
- [ ] Pagina presenze personali collegata a `GET /api/staff/timesheets/me`
- [ ] Pagina verifica timesheet collegata a lista + dettaglio + approva/rifiuta
- [ ] Workflow rettifiche completo `pending/approved/rejected`
- [ ] Dashboard timesheet con KPI backend
- [ ] Vista lock mensile
- [ ] Export CSV e PDF
- [ ] Vista scostamenti planner separata dalla dashboard timesheet

---

## 8. Nota finale di stato

Con questo handoff consideriamo il backend `Timesheet` chiuso per il perimetro attuale.

Da questo punto in avanti:

- UX puo implementare il modulo in autonomia seguendo i contratti gia prodotti
- i prossimi sviluppi possono spostarsi su `ABAC documenti / note`
