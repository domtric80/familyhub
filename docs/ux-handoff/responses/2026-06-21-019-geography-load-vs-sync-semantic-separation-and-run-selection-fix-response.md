# Risposta UX 019 — Separazione semantica Sync vs Scarico + fix selezione dataset

## Stato
Implementato ✅ — `tsc --noEmit` 0 errori

---

## File toccati

| File | Modifica |
|------|----------|
| `src/pages/anagrafiche/ScaricaGeografiaPage.tsx` | Riscrittura completa con nuova UX |
| `src/types/index.ts` | Aggiornato `GeoLoadRunOption` con nuovi campi |

---

## Aggiornamento tipo `GeoLoadRunOption`

Aggiunti i campi restituiti dal backend aggiornato:

```ts
export interface GeoLoadRunOption {
  id: number
  scope?: string | null
  status: SyncRunStatus
  source?: string | null           // nuovo
  dataset?: string | null          // nuovo
  display_name?: string | null     // nuovo
  available_levels?: string[] | null  // nuovo
  is_loadable?: boolean | null     // nuovo
  started_at?: string | null
  finished_at?: string | null
  summary?: Record<string, unknown> | null
}
```

---

## Modifiche UX applicate

### Box esplicativo
Aggiunto `Alert color='info'` in cima alla pagina con la distinzione:
- **Sincronizzazione** → verifica sorgenti, acquisisce dati raw
- **Scarico** → inserisce nel DB applicativo dati raw già acquisiti

### Step 1 — Dataset
- Label rinominata: `Dataset disponibile da scaricare`
- Select mostra `display_name — Run #id` invece di `#id — status (scope)`
- Il frontend filtra lato client i run con `is_loadable === false`

### Empty state
Se `GET /admin/geography-load/runs` restituisce array vuoto:
> "Nessun dataset scaricabile disponibile. Eseguire prima una sincronizzazione valida."

### Step 2 — Sorgente in sola lettura
La sorgente non è più una select libera. Viene mostrata come `Badge` in sola lettura, precompilata dal dataset scelto. Affianco: elenco dei livelli disponibili in formato leggibile.

### Azioni condizionali per `available_levels`
I pulsanti di caricamento vengono mostrati solo se il livello è incluso in `available_levels` del dataset selezionato (o se `available_levels` è assente, per compatibilità retroattiva):

| `available_levels` | Pulsanti visibili |
|--------------------|-------------------|
| `["countries"]` (GeoNames) | solo "Carica nazioni nel database" |
| `["countries","regions","provinces","cities"]` (Seed/ISTAT) | tutti |

### CTA aggiornate
- `Carica nazioni nel database`
- `Carica regioni nel database`
- `Carica province nel database`
- `Carica città nel database`
- `Carica tutto nel database`

Sottotesto statico sotto le azioni: `I dati verranno inseriti nel database applicativo`.

---

## Gestione stati

| Stato | Come gestito |
|-------|-------------|
| `loading` runs | Spinner nella label + select disabilitata |
| `empty` runs | Alert warning con messaggio esplicito |
| `error` runs | Alert danger con messaggio dell'errore |
| `forbidden` | Alert warning su azioni + pulsanti disabilitati |
| `error` execute | Alert danger nella card risultato + toast.error |
| `success` execute | Alert success + contatori nazioni/regioni/province/città |

---

## Note compatibilità
- Se `available_levels` non è presente nella response (backend vecchio), tutti i livelli restano visibili.
- La sorgente viene letta direttamente da `selectedRun.source`, eliminando la possibilità di inviare combinazioni run/source incoerenti al backend.
