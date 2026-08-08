# UX Handoff Response — Task 074
## Qualifiche operatori: anagrafica relazionale e aggiornamento EducatoriPage

**Data risposta:** 2026-07-01  
**Task di riferimento:** 074  
**File modificati/creati:** 5  

---

## Nuovi tipi TypeScript

**File:** `frontend/src/types/index.ts`

```ts
interface StaffQualification {
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
qualification_code?: string | null
qualification_label?: string | null
qualification_lookup?: { id: number; code: string; name: string } | null
```

`StaffMemberWrite` aggiornato: aggiunto `qualification_code?: string | null` (legacy `qualification` mantenuto opzionale per retrocompat.)

`EducatorAccountPayload.staff_member`: aggiunto `qualification_code?: string | null`.

---

## API

**File:** `frontend/src/services/api.ts`

- `lookupsApi.staffQualifications()` → `GET /api/lookups/staff-qualifications` → `StaffQualification[]`
- `adminStaffQualificationApi` con CRUD completo:
  - `list()` → `GET /api/admin/staff-qualifications`
  - `get(id)` → `GET /api/admin/staff-qualifications/{id}`
  - `create(data)` → `POST /api/admin/staff-qualifications`
  - `update(id, data)` → `PUT /api/admin/staff-qualifications/{id}`
  - `delete(id)` → `DELETE /api/admin/staff-qualifications/{id}`

---

## EducatoriPage aggiornata

**File:** `frontend/src/pages/educatori/EducatoriPage.tsx`

- Caricamento `lookupsApi.staffQualifications()` in `load()` parallelo alle altre chiamate
- `EMPTY_FORM`: `qualification_code: ''` invece di `qualification: ''`
- `openEdit`: legge `item.qualification_code ?? ''`
- `handleSave`: invia `qualification_code: form.qualification_code || null`
- Tabella: mostra `qualification_label ?? qualification_lookup?.name ?? qualification ?? '—'`
- Form: il campo "Qualifica professionale" è ora una `<select>` popolata da lookup, non più testo libero

---

## Nuova pagina: Qualifiche operatori

**File:** `frontend/src/pages/anagrafiche/QualificheOperatoriPage.tsx`

CRUD completo con:
- Elenco (codice, nome, descrizione, ordine, stato)
- Modal crea/modifica con campi: `code` (readonly in edit), `name`, `description`, `sort_order`, `is_active`
- Modal conferma eliminazione con gestione `409` (qualifica in uso da operatori)
- `code` forzato in uppercase, non modificabile dopo creazione

**Route:** `/anagrafiche/qualifiche-operatori`  
**Sidebar:** voce "Qualifiche" aggiunta in `menuItems.ts` nella sezione Anagrafiche

---

## Note tecniche

- Tutti e 5 i file: 0 errori di parsing TypeScript
- Il vecchio campo `qualification` (testo libero) resta in `StaffMemberWrite` come opzionale per retrocompat., ma non viene più usato nei nuovi form
- Il backend risponde `409` se si tenta di eliminare una qualifica assegnata a operatori esistenti — gestito nel modal con messaggio esplicativo
