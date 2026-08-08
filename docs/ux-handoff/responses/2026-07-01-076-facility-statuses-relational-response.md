# UX Handoff Response — Task 076
## Stati struttura: anagrafica relazionale e aggiornamento StrutturePage

**Data risposta:** 2026-07-01  
**Task di riferimento:** 076  
**File modificati/creati:** 6  

---

## Nuovi tipi TypeScript

**File:** `frontend/src/types/index.ts`

```ts
interface FacilityStatus {
  id: number
  code: string
  name: string
  description?: string | null
  sort_order?: number | null
  is_active: boolean
}
```

`Facility` aggiornato:
```ts
status?: string | null          // mantenuto opzionale (retrocompat.)
status_code?: string | null     // campo canonico
status_label?: string | null    // label pronta UI
status_lookup?: { id: number; code: string; name: string } | null
```

`FacilityWrite`: rimosso `status?: string | null`, aggiunto `status_code?: string | null`.

---

## API

**File:** `frontend/src/services/api.ts`

- `lookupsApi.facilityStatuses()` → `GET /api/lookups/facility-statuses` → `FacilityStatus[]`
- `adminFacilityStatusApi` con CRUD completo su `/api/admin/facility-statuses`

---

## StrutturePage aggiornata

**File:** `frontend/src/pages/admin/StrutturePage.tsx`

- Caricamento `lookupsApi.facilityStatuses()` in `loadFacilities()` parallelo
- `FacilityForm.status_code` sostituisce `status` (stringa libera)
- `emptyForm()`: `status_code: ''` (nessun default hardcoded)
- `openEdit`: legge `f.status_code ?? f.status ?? ''` (fallback per record legacy)
- `handleSubmit`: invia `status_code: form.status_code || null` (non più `status`)
- Tabella: mostra `status_label ?? status_lookup?.name ?? status` con badge; rimossa la funzione `statusBadge()` con mappa hardcoded
- Form: la select "Stato struttura" è ora popolata da lookup dinamico

---

## Nuova pagina: Stati struttura

**File:** `frontend/src/pages/anagrafiche/StatiStrutturaPage.tsx`

CRUD identico al pattern `StatiOperatoriPage`:
- Elenco (codice, nome, descrizione, ordine, stato anagrafica)
- Modal crea/modifica: `code` readonly in edit, forzato uppercase
- Gestione `409` su delete (stato in uso da strutture)

**Route:** `/anagrafiche/stati-struttura`  
**Sidebar:** voce "Stati struttura" aggiunta dopo "Stati operatori" in `menuItems.ts`

---

## Fix AuditKpiPage (bug contestuale)

**File:** `frontend/src/pages/admin/AuditKpiPage.tsx`  
**File:** `frontend/src/types/index.ts`

Corretti i nomi dei campi per allineamento all'OpenAPI reale:

| Campo usato (sbagliato) | Campo reale API |
|-------------------------|-----------------|
| `display_name`          | `actor_display_name` |
| `event_count`           | `total` |
| `label` (breakdown)     | `resource_type` / `action` |
| `count`                 | `total` |
| `date`                  | `day` |

Aggiunto `action_breakdown` al tipo `AuditKpi` (era assente).  
Aggiunto guard `?? 0` su tutti i `.toLocaleString()` per robustezza.

---

## Note tecniche

- Tutti e 6 i file: 0 errori di parsing
- Il vecchio campo `status` resta in `Facility` come opzionale per retrocompat. di lettura
- La pagina `UtentiPage` non è coinvolta: usa ancora `qualification` (legacy ancora accettato dal backend)
