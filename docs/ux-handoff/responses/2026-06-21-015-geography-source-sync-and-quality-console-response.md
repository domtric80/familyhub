# Response — UX Handoff 015: Console sincronizzazione geografia

**Data:** 2026-06-21  
**Handoff:** 015 — Console sincronizzazione geografia e qualità dato  
**Stato:** ✅ Pagina implementata — backend in pianificazione

---

## 1. Struttura pagina

### Componente

`src/pages/anagrafiche/GeografiaSyncPage.tsx`

### Route

`/anagrafiche/geografia-sync`

### Voce menu

`Anagrafiche > Sinc. geografia` (aggiunta a `menuItems.ts`)

---

## 2. Sezioni implementate

| Sezione | Tab | Descrizione |
|---------|-----|-------------|
| Stato ultimo run | `latest` | Card riepilogo con badge stato, metriche, CTA |
| Storico run | `storico` | Tabella 11 colonne, click su riga → tab Issue con run selezionato |
| Issue qualità | `issue` | Filtri (severità, tipo, livello, sorgente, solo bloccanti) + tabella 8 colonne |
| Decisioni di sincronizzazione | `decisioni` | Tabella 8 colonne |

Tab Issue e Decisioni mostrano il run selezionato dallo Storico tramite badge `#ID`.

---

## 3. Badge stati run

| Stato | Colore |
|-------|--------|
| `QUEUED` | grigio (secondary) |
| `RUNNING` | blu (info) |
| `COMPLETED` | verde (success) |
| `COMPLETED_WITH_WARNINGS` | giallo (warning) |
| `FAILED` | rosso (danger) |
| `ROLLED_BACK` | scuro (dark) |

---

## 4. Issue qualità

Evidenza visiva per riga:
- `critical` / `error` → `table-danger` (sfondo rosso chiaro)
- `warning` → `table-warning` (sfondo giallo chiaro)
- `info` → nessuna evidenza extra

Badge severità: `critical` e `error` condividono colore `danger`, `warning` = warning, `info` = info.

Filtri applicati client-side sulle issue già caricate per il run selezionato.

---

## 5. Decisioni

Azioni badge:

| Azione | Colore |
|--------|--------|
| `create` | verde |
| `update` | blu |
| `deactivate` | giallo |
| `skip` | grigio |
| `manual_review` | scuro |

---

## 6. Modali

### Avvia verifica

Campi: `scope` (text, opzionale), `source` (text, opzionale), `dry_run` (checkbox, default: true).  
Gestione errori: 403 → permesso insufficiente, 409 → run già in esecuzione.

### Pubblica modifiche sicure

Messaggio esplicito: "Saranno pubblicate **solo** le decisioni non bloccate da issue critiche o errori."  
CTA: `Pubblica` / `Annulla`.

---

## 7. Gestione permessi

| Capability | Effetto |
|------------|---------|
| Mancante `geography_sync.read` | Pagina mostra `Alert color='warning'` — nessun dato caricato |
| `geography_sync.read` | Accesso sola lettura — tutti i tab visibili |
| `geography_sync.run` | Pulsante `Avvia verifica` visibile |
| `geography_sync.publish` | Pulsante `Pubblica modifiche sicure` visibile |

La voce menu `Sinc. geografia` è attualmente visibile a tutti gli utenti autenticati. Filtraggio per capability sul menu richiede un'estensione futura del componente `Sidebar` (vedi nota sotto).

---

## 8. Gestione errori

| Codice | Comportamento |
|--------|--------------|
| 401 | Gestito globalmente dall'interceptor axios (redirect login) |
| 403 | Alert con messaggio "Permesso insufficiente" |
| 404 / 503 | Alert giallo "API non ancora disponibile" (stato atteso finché backend non è implementato) |
| 409 | Modal avvia: "Un run è già in esecuzione" |
| 422 | Non atteso su questa pagina (nessun form con validazione field-by-field) |
| 500 | Messaggio generico dall'`ae.message` |

---

## 9. API definite in `services/api.ts`

```ts
export const adminGeoSyncApi = {
  latestRun:  () => GET /admin/geography-sync/runs/latest
  runs:       () => GET /admin/geography-sync/runs
  run:        (id) => GET /admin/geography-sync/runs/{id}
  issues:     (runId) => GET /admin/geography-sync/runs/{runId}/issues
  decisions:  (runId) => GET /admin/geography-sync/runs/{runId}/decisions
  startRun:   (data: SyncRunRequest) => POST /admin/geography-sync/runs
  publish:    (runId) => POST /admin/geography-sync/runs/{runId}/publish
}
```

---

## 10. Tipi TypeScript aggiunti a `types/index.ts`

```ts
SyncRunStatus, SyncRun, IssueSeverity, IssueStatus, SyncIssue,
DecisionAction, SyncDecision, SyncRunRequest
```

---

## 11. Nota — voce menu condizionale per capability

La spec richiede: "senza `geography_sync.read`: voce menu nascosta".

Il componente `Sidebar` attuale non supporta filtri per-item basati su capabilities. La voce è visibile ma la pagina mostra un Alert di permesso insufficiente. Quando il backend distribuirà le capabilities, si può aggiungere un campo `permission?: string` alle voci in `menuItems.ts` e filtrare in `Sidebar.tsx` con `hasPermission()`.

---

## 12. Stato backend

Tutti gli endpoint restituiranno 404 finché il backend non implementa la pipeline. L'UI gestisce questo caso con un Alert warning ("API non ancora disponibile") senza crashare.
