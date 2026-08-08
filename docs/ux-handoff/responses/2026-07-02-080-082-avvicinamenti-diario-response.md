# Risposta UX Handoff — Task 080, 081, 082

Data: 2026-07-02
Sviluppatore frontend: Claude

---

## Task 080 — AvvicinamentiPage operativa

**Stato: IMPLEMENTATO**

File: `frontend/src/pages/avvicinamenti/AvvicinamentiPage.tsx`

Il placeholder `ComingSoon` è stato sostituito con la pagina operativa completa.

### Layout
- Card unica full-width con `CardHeader` (h5 + contatore + "Nuovo avvicinamento") e `CardBody`
- Filtri nella sezione `py-2 border-bottom mb-3`: Struttura / Minore / Tipologia / Stato
- Tabella `table-hover` + `thead table-light` con colonne: Minore, Tipologia, Titolo, Contatto coinvolto, Inizio pianificato, Stato, Azioni
- Click su riga → modale dettaglio (read-only, tutte le colonne)
- Bottoni Edit2 / Trash2 con `stopPropagation`

### Modale form
- Minore: select full list (disabilitata in modifica)
- Tipologia: da `GET /api/lookups/approach-types`
- Contatto coinvolto: caricato dinamicamente da `minorApi.contacts(minorId)` al cambio minore
- Supervisore: caricato da `staffMemberApi.list({ facility_id })` usando la struttura del minore selezionato
- Date: `datetime-local` con `lang="it"`, campi planned_start/end, actual_start/end
- Stato: select planned / in_progress / completed / cancelled
- Note esito + Prossimi passi: textarea

### Gestione errori
- 403 → messaggio neutro (permessi + assegnazione al minore)
- 422 → fieldErrors per campo
- InfoDrawer con permessi `approaches.*`

---

## Task 081 — TipiAvvicinamentoPage (admin)

**Stato: IMPLEMENTATO**

File: `frontend/src/pages/anagrafiche/TipiAvvicinamentoPage.tsx`
Route: `/anagrafiche/tipi-avvicinamento`
Sidebar: aggiunto in Anagrafiche

Pattern identico a StatiOperatoriPage:
- Tabella: code, name, description, sort_order, is_active (Badge)
- Modal crea/modifica: code (uppercase, disabilitato in edit), name, description, sort_order, is_active
- 409 → conflict message inline
- 422 → field errors
- Delete con 409 handling: "Tipo in uso da avvicinamenti esistenti."
- La select nella pagina Avvicinamenti usa `GET /api/lookups/approach-types` (non la lista admin)

---

## Task 082 — DiarioPage + TipiDiarioPage

**Stato: IMPLEMENTATO**

### DiarioPage operativa
File: `frontend/src/pages/diario/DiarioPage.tsx`

Il placeholder `ComingSoon` è stato sostituito con la pagina operativa completa.

Layout identico ad AvvicinamentiPage:
- Filtri `py-2 border-bottom`: Struttura / Minore / Tipologia
- Tabella: Data/ora obs., Minore, Tipologia, Titolo, Follow-up (badge `badge-light-warning` se attivo), Autore, Azioni
- Click riga → modale dettaglio con content in area pre-wrap e note follow-up in `alert-warning`
- 404 → banner "modulo non ancora disponibile" (graceful degradation)

Modale form:
- Minore (disabilitato in edit), Tipologia, Data/ora osservazione (`datetime-local` + `lang="it"`)
- Titolo, Content (textarea 6 righe)
- Follow-up checkbox → se attivo, compare textarea follow_up_notes

### TipiDiarioPage (admin)
File: `frontend/src/pages/anagrafiche/TipiDiarioPage.tsx`
Route: `/anagrafiche/tipi-diario`
Sidebar: aggiunto in Anagrafiche

Pattern identico a TipiAvvicinamentoPage con endpoint `/api/admin/journal-entry-types`.

---

## Modifiche infrastrutturali

### types/index.ts
Aggiunti:
- `ApproachType`, `Approach`, `ApproachWrite`, `ApproachStatus`
- `JournalEntryType`, `JournalEntry`, `JournalEntryWrite`

### services/api.ts
Aggiunti:
- `lookupsApi.approachTypes()` → `GET /api/lookups/approach-types`
- `lookupsApi.journalEntryTypes()` → `GET /api/lookups/journal-entry-types`
- `adminApproachTypeApi` → CRUD su `/api/admin/approach-types`
- `adminJournalEntryTypeApi` → CRUD su `/api/admin/journal-entry-types`
- `approachApi` → CRUD su `/api/approaches`
- `journalApi` → CRUD su `/api/journals`

### App.tsx
Aggiunte route: `/anagrafiche/tipi-avvicinamento`, `/anagrafiche/tipi-diario`

### menuItems.ts
Aggiunti in Anagrafiche: "Tipi avvicinamento", "Tipi voce diario"
