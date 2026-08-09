# FamilyHub Frontend — Riepilogo modifiche per commit

Data: 2026-08-09  
Stato: pronto per commit, push e aggiornamento release notes  
Versione suggerita: `1.2.0` (nuove feature) oppure `1.1.2` (se si vuole mantenere patch)

---

## File modificati

| File | Tipo | Motivo |
|------|------|--------|
| `frontend/src/pages/anagrafiche/RuoliPage.tsx` | fix + feature | Fix encoding UTF-8 + auto-uncheck policy D |
| `frontend/src/pages/turni/MiePresentePage.tsx` | feature | Colonne revisione rettifiche in sola lettura |
| `frontend/src/types/index.ts` | feature | Tipi lock mensile timesheet |
| `frontend/src/services/api.ts` | feature | Client `timesheetMonthLockApi` |
| `frontend/src/pages/turni/TimesheetLockPage.tsx` | feature | **NUOVA** pagina lock mensili |
| `frontend/src/App.tsx` | feature | Route `/turni/lock` |
| `frontend/src/layout/sidebar/menuItems.ts` | feature | Voce sidebar "Lock mensili" |

---

## Dettaglio modifiche

### 1. Fix encoding caratteri italiani — `RuoliPage.tsx`

**Problema:** 117 caratteri italiani (à, è, é, ì, ò, —, …) erano corrotti da doppia codifica UTF-8/Windows-1252 e apparivano come `ÃƒÂ¬`, `Ã¢â‚¬â€`, ecc. nelle modali RBAC.

**Fix:** sostituzione sistematica di tutte le sequenze corrotte con i caratteri Unicode corretti. Zero impatto funzionale, solo correzione visiva.

---

### 2. Policy documentale ABAC — auto-uncheck D su deselezione R — `RuoliPage.tsx`

**Handoff:** 148

**Modifica:** nel handler onChange della checkbox R (lettura), aggiunta la rimozione automatica di D (download) da `policyDownloadChecked` quando R viene deselezionato.

```tsx
// Prima
if (e.target.checked) s.add(cls.code); else s.delete(cls.code)

// Dopo
if (e.target.checked) {
  s.add(cls.code)
} else {
  s.delete(cls.code)
  const ds = new Set(policyDownloadChecked)
  ds.delete(cls.code)
  setPolicyDownloadChecked(ds)
}
```

**Regola rispettata:** D non può esistere senza R. Il backend già validava questo vincolo; ora la UI è coerente.

---

### 3. Rettifiche timesheet — revisione visibile in Le mie presenze — `MiePresentePage.tsx`

**Handoff:** 149

**Modifica:** aggiunta funzione `fmtDateTime()` e due nuove colonne alla tabella rettifiche (sola lettura per l'operatore):
- `Creata il` → `adjustment.created_at`
- `Revisione` → `adjustment.reviewed_at` + `adjustment.review_notes`

---

### 4. Lock mensile timesheet — **nuova feature completa**

**Handoff:** 153

#### `types/index.ts`
Aggiunti:
- `TimesheetMonthLockUser`
- `TimesheetMonthLock`
- `TimesheetMonthLockCreate`
- `TimesheetMonthLockResponse` (con `entries_locked`)
- `TimesheetMonthUnlockResponse` (con `entries_unlocked`)

#### `api.ts`
Aggiunto `timesheetMonthLockApi`:
```ts
list(facility_id?)  → GET  /admin/timesheet-month-locks
lock(data)          → POST /admin/timesheet-month-locks
unlock(id)          → POST /admin/timesheet-month-locks/{id}/unlock
```

#### `TimesheetLockPage.tsx` (nuova)
- Guard permesso `staff_timesheet_entries.lock`
- Filtro struttura
- Tabella lock con tutti i campi del contratto API
- Modal "Chiudi mese" con form struttura/anno/mese/note
- Errori 422 mostrati inline (messaggio originale backend)
- Azione "Riapri mese" con confirm + toast con count entry
- Route: `/turni/lock`
- Sidebar: voce "Lock mensili" tra Verifica timesheet e Export presenze

---

### 5. Fix route health/storage — nessuna modifica necessaria

**Handoff:** 152

Verificato: gli endpoint `systemHealthApi` e `systemStorageApi` usano già i path corretti (`/admin/system/...`) con `baseURL='/api'`. Il bug del doppio prefisso `/api/api/` non era presente nel codice attuale.

---

## Suggerimento release notes

```markdown
### Frontend v1.2.0

**Fix**
- RuoliPage: corretti 117 caratteri italiani corrotti da doppia codifica UTF-8 nelle modali RBAC
- Policy documentale: deselezione "Lettura" rimuove automaticamente "Download" nella UI ruoli

**Feature**
- Le mie presenze: tabella rettifiche mostra ora data creazione e esito revisione (approvato/rifiutato)
- Turni › Lock mensili: nuova pagina per chiusura e riapertura contabile mensile per struttura
  - filtro per struttura
  - form chiusura con anno/mese/note
  - gestione errori 422 backend (entry non approvate, rettifiche pending, mese già bloccato)
  - azione riapertura con contatore entry sbloccate
```

---

## TypeScript

`tsc -b --noEmit` → **0 errori** su tutti i file modificati.
