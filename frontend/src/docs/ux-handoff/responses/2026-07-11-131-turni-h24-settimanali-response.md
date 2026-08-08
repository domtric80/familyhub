# Risposta UX — Handoff 131: Modulo Turni H24

Data: 2026-07-11  
Stato: implementato

---

## Cosa è stato implementato

### Tipi TypeScript (`types/index.ts`)

Aggiunti:

- `ShiftAssignmentStatus` — union type `'planned' | 'confirmed' | 'completed' | 'cancelled'`
- `StaffShiftTemplate` / `StaffShiftTemplateWrite`
- `StaffShiftAssignment` / `StaffShiftAssignmentWrite`
- `ShiftWeekAssignment`, `ShiftWeekBlock`, `ShiftWeekDay`, `StaffShiftWeekView`
- `MyWeekAssignment`, `StaffShiftMyWeek`

### API client (`services/api.ts`)

Aggiunti due export:

**`shiftTemplatesApi`**
- `list(params?)` → `GET /admin/staff-shift-templates`
- `get(id)` → `GET /admin/staff-shift-templates/{id}`
- `create(data)` → `POST /admin/staff-shift-templates`
- `update(id, data)` → `PUT /admin/staff-shift-templates/{id}`
- `delete(id)` → `DELETE /admin/staff-shift-templates/{id}`

**`shiftAssignmentsApi`**
- `list(params?)` → `GET /admin/staff-shifts`
- `get(id)` → `GET /admin/staff-shifts/{id}`
- `create(data)` → `POST /admin/staff-shifts`
- `update(id, data)` → `PUT /admin/staff-shifts/{id}`
- `delete(id)` → `DELETE /admin/staff-shifts/{id}`
- `weekView(params)` → `GET /admin/staff-shifts/week`
- `myWeek(params)` → `GET /staff-shifts/my-week`

---

### Pagine nuove

#### A. Modelli turno — `/turni/modelli`

File: `pages/turni/ModelliTurnoPage.tsx`

- Tabella con struttura, codice, nome, fascia oraria, minimo richiesto, ordine, stato
- Filtro per struttura
- Modal create/edit con tutti i campi del contratto
- Eliminazione con gestione 409 (modelli con assegnazioni collegate non eliminabili — toast specifico)
- InfoDrawer con guida contestuale

#### B. Pianificazione settimanale — `/turni`

File: `pages/turni/PianificazionePage.tsx`

Sostituisce il precedente placeholder `TurniPage.tsx`.

- Selezione struttura + navigazione settimana (← settimana / oggi / settimana →)
- Griglia CSS grid 7 colonne (una per giorno, intestazione con data)
- Per ogni giorno: blocchi turno da `weekView.days[].shifts[]`
- Ogni blocco mostra:
  - Nome turno + fascia oraria
  - Badge `assegnati/minimo`
  - Gap negativo se scoperto
  - Lista operatori assegnati con pulsante rimozione rapida
  - Pulsante "+ Aggiungi" che apre modal pre-compilata sul turno/giorno
- Colori copertura:
  - Verde `#e8f8f0 / #28a745` — copertura completa
  - Giallo `#fff8e1 / #ff9f43` — parziale (gap > 0)
  - Rosso `#ffeaea / #e74c3c` — scoperto (assigned_count = 0)
- Modal nuova assegnazione con: data, modello turno, operatore, stato, note
- Gestione 422 su sovrapposizione turni (toast specifico)
- InfoDrawer con legenda colori e spiegazione gap

#### C. La mia settimana — `/turni/mia-settimana`

File: `pages/turni/MiaSettimanaPage.tsx`

- Chiama `GET /staff-shifts/my-week`
- Se 404 → messaggio "account non collegato a operatore"
- Mostra carta per ogni giorno della settimana (sette righe fisse)
- Il giorno odierno è evidenziato con bordo viola
- Ogni assegnazione mostra: nome turno, fascia oraria calcolata (starts_at/ends_at), struttura, badge stato, note
- Nessun dato di altri operatori (garantito dal backend)
- InfoDrawer con spiegazione della vista

---

### Routing (`App.tsx`)

```
/turni              → PianificazionePage  (sostituisce TurniPage)
/turni/modelli      → ModelliTurnoPage    (nuovo)
/turni/mia-settimana → MiaSettimanaPage  (nuovo)
/turni/timesheet    → TimesheetPage       (immutato, placeholder)
```

### Sidebar (`menuItems.ts`)

Il sottomenu Turni ora ha 4 voci:
- Pianificazione settimanale → `/turni`
- Modelli turno → `/turni/modelli`
- La mia settimana → `/turni/mia-settimana`
- Timesheet → `/turni/timesheet` (placeholder)

---

## Comportamenti e vincoli rispettati

- Solo i 4 stati previsti nel contratto (`planned`, `confirmed`, `completed`, `cancelled`)
- Nessun campo relativo a timbrature, straordinari, firme fine turno o paghe
- La vista personale non fa vedere turni di altri (responsabilità backend con `/staff-shifts/my-week`)
- La rimozione rapida di un'assegnazione dalla griglia chiede conferma con `confirm()`
- Il modello turno non è eliminabile se ha assegnazioni (409 gestito con toast specifico)
- Il sistema segnala la sovrapposizione turni tramite errore 422 del backend
