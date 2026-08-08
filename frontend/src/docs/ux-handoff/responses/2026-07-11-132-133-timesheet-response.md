# Risposta UX — Handoff 132 + 133: RBAC turni + Timesheet operativo

Data: 2026-07-11  
Stato: implementato

---

## Task 132 — Allineamento RBAC permessi turni

### Fix `RolePermissionsMatrix` (`types/index.ts`)

Aggiunto campo opzionale `all_permissions?: Permission[]` con nota di retrocompatibilità.

### Fix `RuoliPage.tsx` — `openDetail()`

Normalizzazione al momento del fetch:

```ts
const normalized = { ...raw, permissions: raw.all_permissions ?? raw.permissions ?? [] }
setDetailMatrix(normalized)
```

Il fallback garantisce che la matrice permessi sia sempre popolata indipendentemente da quale campo restituisce il backend.

### Pagine turni — nessun capability gate

Le pagine `PianificazionePage`, `ModelliTurnoPage`, `MiaSettimanaPage` non contengono guard basati su `isPrivileged` o `capabilities` — sono accessibili a tutti i ruoli con accesso alla sezione. La visibilità è controllata a livello di menu e routing, la protezione fine-grained è delegata al backend (403).

---

## Task 133 — Timesheet operativo

### Nuovi tipi (`types/index.ts`)

- `TimesheetEntryStatus` — `'draft' | 'computed' | 'submitted' | 'approved' | 'rejected' | 'locked'`
- `TimesheetAdjustmentStatus` — `'pending' | 'approved' | 'rejected' | 'cancelled'`
- `AttendanceEventType` — `'clock_in' | 'clock_out' | 'break_start' | 'break_end'`
- `AttendanceEventSource` — `'web' | 'mobile' | 'manual' | 'system'`
- `AttendanceEvent`, `TimesheetAdjustment`, `TimesheetEntry`, `TimesheetEntryFilters`, `TimesheetAdjustmentWrite`

Nessun tipo inventato oltre il contratto.

### Nuove API (`services/api.ts`)

**`attendanceApi`**
- `clockEvent(data)` → `POST /staff-attendance/clock`
- `myToday()` → `GET /staff-attendance/my-today`
- `listForEntry(id)` → `GET /staff-attendance?timesheet_entry_id=`

**`timesheetApi`**
- `myEntries(params?)` → `GET /staff-timesheet/my-entries`
- `list(params?)` → `GET /admin/staff-timesheet-entries`
- `get(id)` → `GET /admin/staff-timesheet-entries/{id}`
- `submit(id)` → `POST /staff-timesheet/entries/{id}/submit`
- `approve(id)` → `POST /admin/staff-timesheet-entries/{id}/approve`
- `reject(id, reason)` → `POST /admin/staff-timesheet-entries/{id}/reject`
- `addAdjustment(id, data)` → `POST /admin/staff-timesheet-entries/{id}/adjustments`
- `exportMonthly(params)` → `GET /admin/staff-timesheet-entries/export` (responseType: blob)

### Pagine implementate (Step 1 + Step 2 + Step 3 parziale)

#### `/turni/presenze` — Le mie presenze (`MiePresentePage.tsx`)

**Step 1 del contratto completato:**
- Pulsanti Timbra entrata / Timbra uscita / Inizia pausa / Termina pausa
- I pulsanti sono abilitati in base all'ultimo evento (`clock_in` → abilita uscita e pausa; `break_start` → solo fine pausa; etc.)
- Lista cronologica eventi di oggi con icona, label, ora, source
- Tabella entry timesheet personali con: data, turno, pianificato, lavorato, delta (colorato), icona anomalia, badge stato
- Modal dettaglio entry con sezioni separate: Pianificato / Consuntivo / Presenze registrate / Rettifiche
- Pulsante "Invia" per entry in stato `draft` o `computed`

#### `/turni/verifica` — Verifica timesheet (`VerificaTimesheetPage.tsx`)

**Step 2 del contratto completato:**
- Filtri: struttura, operatore (cascata da struttura), date from/to, stato, "solo anomalie"
- Tabella con tutte le colonne del contratto: data, operatore, turno, entrata reale, uscita reale, lavorato, Δ, straordinari, anomalia (icona), stato
- Badge KPI rapidi per entry in attesa e anomalie
- Azioni dirette da riga: approva (Check), rifiuta (X) per entry `submitted`
- Modal dettaglio con sezioni: Pianificato / Presenze / Consuntivo / Rettifiche
- Modal rifiuto con campo motivo obbligatorio
- Modal aggiunta rettifica (tipo, minuti delta, motivo)
- Anomalie evidenziate con sfondo giallo sulla riga

#### `/turni/export` — Export presenze (`ExportPresenzePage.tsx`)

**Step 3 parziale — export mensile:**
- Selezione struttura, anno, mese
- Scelta formato: CSV paghe / PDF presenze
- Alert informativo "solo entry approvate/bloccate"
- Download diretto tramite blob URL
- Storico sessione degli export generati (ultimi 5)
- Gestione 404 se non ci sono entry approvate nel periodo

### Routing (`App.tsx`)

```
/turni/presenze  → MiePresentePage
/turni/verifica  → VerificaTimesheetPage
/turni/export    → ExportPresenzePage
```

### Sidebar (`menuItems.ts`)

Aggiunto sotto "Turni":
- Le mie presenze → `/turni/presenze`
- Verifica timesheet → `/turni/verifica`
- Export presenze → `/turni/export`

### Vincoli rispettati

- I 6 stati entry e i 4 stati rettifica usati esattamente come da contratto, nessun valore inventato
- Separazione netta: turno pianificato ≠ presenza ≠ consuntivo — sezioni distinte nel drawer
- Mai modificare in place un consuntivo approvato: rettifiche aggiuntive con audit trail
- Le anomalie sono evidenziate prima dei numeri (icona AlertTriangle a sinistra dei dati)
- Nessuna geolocalizzazione visuale, nessun KPI avanzato (Steps 4 — non implementati)
