# FamilyHub — Risposta handoff UX — 170 + 171 + 172 + 173

Data: 2026-08-13  
Riferimenti: `2026-08-13-170-calendario-mensile.md`, `2026-08-13-171-sostituzioni-operative.md`, `2026-08-13-172-chiusura-turno.md`, `2026-08-13-173-scostamenti-anomalie.md`

---

## Handoff 170 — Calendario mensile struttura

### Implementato

**Nuova pagina:** `frontend/src/pages/turni/CalendarioMensileStrutturePage.tsx`

- Selector struttura + navigazione mese (< / >)
- 6 card KPI mensili da `month_summary`: copertura pianificata, copertura effettiva, gap pianificati, gap effettivi, anomalie, sostituzioni attive
- Griglia calendario 7 colonne (Lun–Dom), offset corretto con `(getDay() + 6) % 7`
- Colorazione cella per stato giornaliero:
  - 🔴 Rosso: `actual_coverage_gap_total > 0` oppure `anomaly_count > 0`
  - 🟡 Giallo: `coverage_gap_total > 0` (gap solo pianificato)
  - 🟢 Verde: nessun gap o anomalia
- Click su giorno → `DayDetailPanel` (pannello laterale fisso, backdrop overlay)
- `DayDetailPanel`: breakdown turni del giorno, per ogni assegnazione mostra titolare + effettivo + badge "Sostituito" se `has_active_substitution`, badge anomalia se `actual.has_anomaly`
- Legenda colori in footer calendario

**Router:** `<Route path='/turni/calendario-mensile' element={<CalendarioMensileStrutturePage />} />`

**Sidebar:** aggiunto link "Calendario mensile" sotto voce Pianificazione nel gruppo Turni

**API:** `shiftAssignmentsApi.monthView({ facility_id, year, month })` → `GET /api/admin/staff-shifts/month`

### Regole rispettate

- Colorazione cella sempre da dati backend (`summary.actual_coverage_gap_total`, `summary.coverage_gap_total`, `summary.anomaly_count`), mai ricalcolata in frontend
- KPI mensili da `month_summary`, non aggregati in frontend

---

## Handoff 171 — Sostituzioni operative in PianificazionePage

### Implementato

In `frontend/src/pages/turni/PianificazionePage.tsx`, i chip assegnazione nella griglia settimanale mostrano ora:

- **Sfondo ambra** (`#fff8e1`) + bordo arancio se `has_active_substitution`
- **Nome titolare** in grigio barrato visivamente quando sostituito
- **Riga effettivo** `↳ {staffName(effective_staff_member)}` in grassetto ambra
- **Badge "Sostituito"** (`badge-light-warning`, font 9px) affiancato al nome effettivo
- **Badge "Anomalia"** (`badge-light-danger`) se `actual.has_anomaly`, indipendente dalla sostituzione

### Regole rispettate

- `effective_staff_member` mostrato solo se `has_active_substitution && effective_staff_member != null`
- I campi `has_active_substitution` e `effective_staff_member` sono letti dal payload del backend, mai inferiti in frontend

---

## Handoff 172 — Chiusura e firma turno in MiaSettimanaPage

### Implementato

In `frontend/src/pages/turni/MiaSettimanaPage.tsx`, la `AssignmentCard` mostra:

**Stato operativo:**

| Stato `op.state` | Badge |
|---|---|
| `open` | `badge-light-secondary` |
| `in_progress` | `badge-light-warning` |
| `closed` | `badge-light-info` |
| `signed` | `badge-light-primary` |
| `approved` | `badge-light-success` |
| `locked` | `badge-light-dark` |
| `cancelled` | `badge-light-danger` |

**Informazioni aggiuntive:**
- Badge "Sostituzione attiva" se `has_active_substitution`
- Badge "Anomalie" (danger) se `op.has_open_anomalies`
- Box sostituzione con titolare / effettivo / motivo
- Minuti lavorati da `actual.worked_minutes` (se presente)

**CTA "Chiudi e firma turno":**
- Visibile solo se `op.can_submit === true`
- Apre modal con campo `notes` opzionale (maxLength 4000) e avviso anomalie se presenti
- Chiama `shiftAssignmentsApi.submitMyShift(assignmentId, { notes })` → `POST /api/staff-shifts/{id}/submit`
- Errori backend mostrati inline nel modal, non swallowed silenziosamente
- Dopo firma: stato `signed` → testo "In attesa di approvazione"; stato `approved` → testo verde "Approvato"

### Regole rispettate

- `can_submit` è il gatekeeper lato backend; il frontend non valuta altri criteri
- Stato operativo da `op.label` (se presente) oppure da `op.state`, mai da `status` dell'assignment
- Note facoltative, mai obbligatorie

---

## Handoff 173 — Tab "Scostamenti e anomalie" in PianificazionePage

### Implementato

In `frontend/src/pages/turni/PianificazionePage.tsx`:

**Navigazione a tab:**
- Tab 1: "Vista settimanale" (contenuto esistente)
- Tab 2: "Scostamenti e anomalie" → `ScostamentiPanel`

**`ScostamentiPanel` — funzionalità:**
- Selector struttura + date range (settimana corrente di default)
- 5 KPI cards: totale, critici, warning, info, sostituzioni attive
- Filtri: intervallo date, severità, tipo eccezione
- Tabella eccezioni ordinata per `SEVERITY_ORDER` (critical → warning → info) poi `shift_date`
- Colonne: Severità, Data, Turno, Tipo, Messaggio, Copertura pianificata / effettiva

**Tipi eccezione gestiti:**

| `exception_type` | Label |
|---|---|
| `planned_gap` | Gap pianificato |
| `actual_gap` | Gap effettivo |
| `timesheet_anomaly` | Anomalia timesheet |
| `active_substitution` | Sostituzione attiva |

**Severità badge:**

| `severity` | Badge |
|---|---|
| `critical` | `badge-light-danger` |
| `warning` | `badge-light-warning` |
| `info` | `badge-light-info` |

**API:** `shiftAssignmentsApi.exceptions({ facility_id, date_from, date_to })` → `GET /api/admin/staff-shifts/exceptions`

### Regole rispettate

- Severità sempre da backend (`ShiftExceptionSeverity`), mai ricalcolata in frontend
- `planned_gap` e `actual_gap` mostrati come tipi distinti, mai collassati
- `SEVERITY_ORDER` usato solo per ordinamento visivo nella tabella, non per filtrare

---

## Riepilogo stato implementazione Turni

| Handoff | Pagina | Stato |
|---|---|---|
| 131 | `PianificazionePage` — griglia settimanale | ✅ |
| 131 | `MiaSettimanaPage` — vista personale operatore | ✅ |
| 133 | `MiePresentePage` — presenze personali | ✅ |
| 133 | `VerificaTimesheetPage` — verifica coordinatore | ✅ |
| 133 | `TimesheetCoordDashboardPage` — dashboard KPI | ✅ |
| 170 | `CalendarioMensileStrutturePage` — calendario mensile struttura | ✅ |
| 171 | Sostituzione in `PianificazionePage` (chip + badge) | ✅ |
| 172 | Chiusura e firma turno in `MiaSettimanaPage` | ✅ |
| 173 | Tab scostamenti e anomalie in `PianificazionePage` | ✅ |
| — | `TimesheetLockPage` — chiusura mese | ⏳ già implementata |
| — | `ExportPresenzePage` — export avanzato | ⏳ già implementata |

---

## Prossimi step

Da valutare con backend i seguenti endpoint non ancora integrati lato coordinator:

- `POST /api/admin/staff-shifts/{id}/approve` — approvazione firma coordinatore
- `POST /api/admin/staff-shifts/{id}/lock` — lock amministrativo turno
- Vista calendario mensile personale operatore (`GET /api/staff-shifts/my-month`) — già tipizzata e API client presente, non ancora pagina dedicata se non come futura estensione di `MiaSettimanaPage`
