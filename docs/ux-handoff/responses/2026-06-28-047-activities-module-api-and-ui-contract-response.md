# Risposta UX 047 — Modulo Attività: API contract e UI operativa

**Data:** 2026-06-28
**Task:** UX-047 — Activities module API and UI contract

---

## Cosa è stato implementato

### 1. Nuovi tipi TypeScript (`types/index.ts`)

Aggiunti in fondo al file:

- **`ActivityType`** — anagrafica tipo attività (id, code, name, description, sort_order, is_active)
- **`ActivityTypeWrite`** — payload creazione/modifica tipo
- **`ActivityStatus`** — union type `'planned' | 'in_progress' | 'completed' | 'cancelled'`
- **`Activity`** — entità attività operativa con relazioni opzionali `minor` e `activity_type`
- **`ActivityWrite`** — payload creazione/modifica attività

### 2. Nuovi metodi API (`services/api.ts`)

**`lookupsApi.activityTypes()`**
- `GET /lookups/activity-types` — lista tipi attività per select nei form

**`adminActivityTypeApi`** (CRUD admin)
- `list()` → `GET /admin/activity-types`
- `get(id)` → `GET /admin/activity-types/{id}`
- `create(data)` → `POST /admin/activity-types`
- `update(id, data)` → `PUT /admin/activity-types/{id}`
- `delete(id)` → `DELETE /admin/activity-types/{id}`

**`activityApi`** (operativo)
- `list(params?)` → `GET /activities` con filtri `facility_id`, `minor_id`, `activity_type_id`, `status`
- `get(id)` → `GET /activities/{id}`
- `create(data)` → `POST /activities`
- `update(id, data)` → `PUT /activities/{id}`
- `patch(id, data)` → `PATCH /activities/{id}`
- `delete(id)` → `DELETE /activities/{id}`

### 3. Pagina anagrafica `TipiAttivitaPage` (`pages/anagrafiche/TipiAttivitaPage.tsx`)

CRUD completo per i tipi attività, identico al pattern di `TipiUscitaPage`:
- Tabella: Codice, Nome, Descrizione, Ordine, Attivo, Azioni
- Modal crea/modifica con campi: code, name, description, sort_order, is_active
- Confirm delete con gestione 409 (tipo in uso)
- Toast success/error
- Breadcrumb: Home → Anagrafiche → Tipi attività

### 4. Pagina operativa `AttivitaPage` (`pages/attivita/AttivitaPage.tsx`)

Sostituisce il placeholder `ComingSoon` con pagina CRUD completa:

**Filtri panel** (Card separata sopra la tabella):
- Struttura (select facilityApi)
- Minore (select filtrata per struttura se selezionata)
- Tipo attività (select lookupsApi.activityTypes)
- Stato (planned / in_progress / completed / cancelled)
- Pulsante "Nuova attività"

**Tabella** con colonne: Minore, Tipo, Titolo, Luogo, Inizio pianificato (dd/mm/yyyy HH:mm), Fine pianificata, Stato (badge colore), PEI, Azioni

**Badge stato:**
- `planned` → `bg-info`
- `in_progress` → `bg-warning text-dark`
- `completed` → `bg-success`
- `cancelled` → `bg-secondary`

**Modal crea/modifica (size lg)** con tutti i campi:
- Minore (select), Tipo attività (select)
- Titolo, Descrizione (textarea), Luogo
- Inizio/Fine pianificati (datetime-local)
- Inizio/Fine effettivi (datetime-local)
- Stato (select controllato)
- Riferimento PEI, Note esito (textarea)

**Gestione `apiMissing`:** se `GET /activities` risponde 404, la pagina mostra banner giallo informativo invece di un errore bloccante. Il resto dell'UI rimane disponibile per quando il backend sarà attivo.

**Toast:**
- Creazione: "Attività registrata con successo."
- Aggiornamento: "Attività aggiornata con successo."
- Eliminazione: "Attività eliminata con successo."

### 5. Router (`App.tsx`)

Aggiunta rotta:
```tsx
<Route path='/anagrafiche/tipi-attivita' element={<TipiAttivitaPage />} />
```

### 6. Menu sidebar (`layout/sidebar/menuItems.ts`)

Aggiunta voce sotto Anagrafiche, dopo "Tipi uscita":
```ts
{ title: 'Tipi attività', icon: 'bookmark', type: 'link', path: '/anagrafiche/tipi-attivita' },
```

---

## Verifica build

```
tsc --noEmit -p tsconfig.app.json → EXIT:0
```

Nessun errore TypeScript.

---

## Note backend

Il modulo assume i seguenti endpoint lato backend:

| Metodo | Path | Scopo |
|--------|------|-------|
| GET | `/lookups/activity-types` | Lista tipi (pubblica per i form) |
| GET/POST/PUT/DELETE | `/admin/activity-types[/{id}]` | CRUD anagrafica tipi |
| GET | `/activities` | Lista attività con filtri query string |
| POST | `/activities` | Crea attività |
| GET/PUT/PATCH/DELETE | `/activities/{id}` | Leggi/modifica/cancella singola attività |

La pagina operativa gestisce gracefully un 404 su `GET /activities` mostrando un banner "API non ancora disponibile" — nessun errore bloccante finché il backend non è pronto.
