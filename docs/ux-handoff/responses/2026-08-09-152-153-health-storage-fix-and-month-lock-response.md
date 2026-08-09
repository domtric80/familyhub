# Risposta UX — Handoff 152 + 153: Fix route health/storage + Lock mensile timesheet

Data: 2026-08-09

---

## Handoff 152 — Fix route doppio prefisso `/api/api/`

### Stato: già corretto

Gli endpoint in `api.ts` usano path relativi senza prefisso `/api` (es. `/admin/system/health`) e `axios` ha `baseURL = '/api'`. Il risultato finale è corretto: `/api/admin/system/health`.

Nessuna modifica necessaria — il bug descritto era già assente nel codice attuale.

### Verifica

```ts
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'
const http = axios.create({ baseURL: BASE_URL })

// Questi path sono già corretti:
http.get('/admin/system/health')           // → /api/admin/system/health ✓
http.get('/admin/system/storage-configs')  // → /api/admin/system/storage-configs ✓
```

---

## Handoff 153 — Lock mensile timesheet

### Implementato

#### Tipi (`types/index.ts`)
- `TimesheetMonthLock`
- `TimesheetMonthLockUser`
- `TimesheetMonthLockCreate`
- `TimesheetMonthLockResponse` (con `entries_locked`)
- `TimesheetMonthUnlockResponse` (con `entries_unlocked`)

#### API (`api.ts`) — `timesheetMonthLockApi`
- `list(facility_id?)` → `GET /admin/timesheet-month-locks`
- `lock(data)` → `POST /admin/timesheet-month-locks`
- `unlock(id)` → `POST /admin/timesheet-month-locks/{id}/unlock`

#### Pagina `TimesheetLockPage.tsx` (`/turni/lock`)
- Guard permesso `staff_timesheet_entries.lock` (403 → alert full-page)
- Alert informativo sugli effetti del lock
- Filtro per struttura (select)
- Tabella lock: Struttura | Periodo | Stato | Bloccato il | Bloccato da | Riaperto il | Riaperto da | Note | Azioni
- Badge: `Bloccato` (danger) / `Riaperto` (success)
- CTA "Chiudi mese" → modal con form (Struttura, Anno, Mese, Note)
- 422 dal backend → mostrato inline nel modal (messaggio originale)
- "Riapri" → confirm + `unlock()` → toast con count entry riaperte
- Toast successo chiusura con count entry bloccate

#### Sidebar
Nuova voce `Lock mensili` → `/turni/lock` (tra Verifica timesheet e Export presenze)

#### Router (`App.tsx`)
`<Route path='/turni/lock' element={<TimesheetLockPage />} />`

---

## Fix encoding RuoliPage

In parallelo: risolto problema di doppia codifica UTF-8 (Windows-1252) in `RuoliPage.tsx`.
Erano corrotti ~120 caratteri italiani (à, è, é, ì, ò, —, …) ora tutti correttamente `à è é ì ò — …`.

---

## TypeScript

`tsc -b --noEmit` → 0 errori.
