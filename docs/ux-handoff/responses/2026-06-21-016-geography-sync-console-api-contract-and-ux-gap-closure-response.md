# Response — UX Handoff 016: Contratto API reale console sync + chiusura gap menu permessi

**Data:** 2026-06-21  
**Handoff:** 016  
**Stato:** ✅ Tutti i punti implementati

---

## 1. Menu capability-aware

**File modificati:** `menuItems.ts`, `Sidebar.tsx`

### `menuItems.ts`
Aggiunto campo opzionale `permission?: string` all'interfaccia `MenuItem`.

Voce "Sinc. geografia" aggiornata:
```ts
{ title: 'Sinc. geografia', icon: 'map', type: 'link', path: '/anagrafiche/geografia-sync', permission: 'geography_sync.read' }
```

### `Sidebar.tsx`
Importato `hasPermission` da `useAuth`. Funzione `canSee` aggiornata:
```ts
const canSee = (item: MenuItem) =>
  (!item.roles || item.roles.some(r => hasRole([r]))) &&
  (!item.permission || hasPermission(item.permission))
```

La voce menu è ora nascosta per tutti gli utenti senza `geography_sync.read`. Si applica anche ai figli tramite `item.children.filter(canSee)` già presente.

---

## 2. API adapter con envelope `data`

**File modificato:** `services/api.ts`

Tutti i metodi GET di `adminGeoSyncApi` aggiornati per estrarre `r.data.data`:

```ts
latestRun: () => http.get<{ data: SyncRun }>('...').then(r => r.data.data)
runs:      () => http.get<{ data: SyncRun[] }>('...').then(r => r.data.data)
run:       (id) => http.get<{ data: SyncRun }>('...').then(r => r.data.data)
issues:    (runId) => http.get<{ data: SyncIssue[] }>('...').then(r => r.data.data)
decisions: (runId) => http.get<{ data: SyncDecision[] }>('...').then(r => r.data.data)
```

`startRun` aggiornato con tipo di risposta corretto `{ message, data: SyncRun, exit_code }`.  
`publish` rimane `r.data` → restituisce `{ message: string }` che viene mostrato via toast.

---

## 3. Publish 409 come stato atteso

**File modificato:** `GeografiaSyncPage.tsx`

`handlePublish` ora differenzia:
- **403** → toast.error + chiude modale
- **409** → mostra `Alert color='info'` con il messaggio backend nel modale (non chiude, non toast.error)
- **altri errori** → toast.error + chiude modale

Nel modale, quando `publishMsg` è valorizzato:
- L'Alert warning è sostituito dall'Alert info con il messaggio 409
- Il bottone "Pubblica" è nascosto
- Il bottone diventa "Chiudi"

---

## 4. Empty state decisioni

**File modificato:** `GeografiaSyncPage.tsx`

Testo aggiornato da "Nessuna decisione registrata per questo run." a:

> **Nessuna decisione di publish disponibile per questo run.**

Questo è lo stato normale per run in dry-run o nelle prime iterazioni pipeline.

---

## 5. Aggiornamento tipi TypeScript

**File modificato:** `types/index.ts`

### `SyncRunStatus`
Valori aggiornati da UPPERCASE a lowercase per allineamento backend:
```ts
'queued' | 'running' | 'completed' | 'completed_with_warnings' | 'failed' | 'rolled_back'
```

### `SyncRun`
Campi aggiornati ai nomi reali backend:
- `files_read` → `source_file_count`
- `records_processed` → `raw_record_count`
- `records_created` / `records_updated` / `records_deactivated` → rimossi (non nel contratto attuale)
- `issues_count` → `issue_count`
- Aggiunti: `run_uuid`, `trigger_mode`, `normalized_record_count`, `published_record_count`, `stats`, `summary`

### `SyncIssue`
- `source` → `source_system`
- `source_key` → `source_record_key`
- Rimosso `status: IssueStatus` (non nel contratto backend)
- Aggiunti: `target_table`, `target_record_id`, `resolved_at`, `resolution_notes`, `details`

### `SyncDecision`
- `entity_type` → `entity_level`
- `source` → `source_system`
- `source_key` → `source_record_key`
- `reason` → `reason_code`

---

## 6. Modal Avvia verifica

Scope e sorgente aggiornati da `<Input type='text'>` a `<Input type='select'>` con i valori documentati:

- **Scope:** `full`, `italy_admin_seed` (o vuoto = tutti)
- **Sorgente:** `geonames`, `seed` (o vuoto = tutte)

---

## 7. Verifica build

`npx tsc --noEmit` → **0 errori**

---

## 8. Comportamenti invariati

- 404/503 da qualsiasi endpoint → Alert warning "API non ancora disponibile" (non crash)
- Filtri issue: client-side su dati già caricati (nessuna paginazione backend)
- Capability `geography_sync.run` → pulsante "Avvia verifica" visibile
- Capability `geography_sync.publish` → pulsante "Pubblica modifiche sicure" visibile
- Click su riga in Storico → seleziona run + passa al tab Issue
