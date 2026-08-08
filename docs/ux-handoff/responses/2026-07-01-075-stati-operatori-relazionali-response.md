# UX Handoff Response — Task 075
## Stati operatori: anagrafica relazionale e aggiornamento EducatoriPage

**Data risposta:** 2026-07-01  
**Task di riferimento:** 075  
**File modificati/creati:** 5  

---

## Nuovi tipi TypeScript

**File:** `frontend/src/types/index.ts`

```ts
interface StaffStatus {
  id: number
  code: string
  name: string
  description?: string | null
  sort_order?: number | null
  is_active: boolean
}
```

`StaffMember` aggiornato:
```ts
status_code?: string | null
status_label?: string | null
status_lookup?: { id: number; code: string; name: string } | null
```

`StaffMemberWrite`: aggiunto `status_code?: string | null` (legacy `status` mantenuto opzionale).  
`EducatorAccountPayload.staff_member`: aggiunto `status_code?: string | null`.

---

## API

**File:** `frontend/src/services/api.ts`

- `lookupsApi.staffStatuses()` → `GET /api/lookups/staff-statuses` → `StaffStatus[]`
- `adminStaffStatusApi` con CRUD completo su `/api/admin/staff-statuses`

---

## EducatoriPage aggiornata

**File:** `frontend/src/pages/educatori/EducatoriPage.tsx`

- Caricamento `lookupsApi.staffStatuses()` in `load()` parallelo
- `EMPTY_FORM`: `status_code: ''` invece di `status: 'active'`
- `openEdit`: legge `item.status_code ?? ''`
- `handleSave`: invia `status_code: form.status_code || null`
- Tabella: mostra `status_label ?? status_lookup?.name ?? status ?? '—'` con badge
- Form: la select "Stato" è ora popolata da lookup anziché hardcoded (active/inactive/suspended)

---

## Nuova pagina: Stati operatori

**File:** `frontend/src/pages/anagrafiche/StatiOperatoriPage.tsx`

CRUD identico al pattern `QualificheOperatoriPage`:
- Elenco (codice, nome, descrizione, ordine, stato anagrafica)
- Modal crea/modifica: `code` readonly in edit, forzato uppercase
- Gestione `409` su delete (stato in uso da operatori)

**Route:** `/anagrafiche/stati-operatori`  
**Sidebar:** voce "Stati operatori" aggiunta dopo "Qualifiche" in `menuItems.ts`

---

## Note tecniche

- Tutti e 5 i file: 0 errori di parsing TypeScript
- Il filtro lista educatori (`filterStatus`) usa ancora valori hardcoded come parametro query API — non è un campo form, non richiede aggiornamento
