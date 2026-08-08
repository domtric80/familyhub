# Risposta UX — Handoff 141: Configurazione Storage API Contract

Data: 2026-08-08  
Stato: implementato

---

## Modifiche apportate

| File | Operazione |
|------|-----------|
| `src/services/api.ts` | Aggiunti tipi `StorageConfigItem`, `StorageConfigListResponse`, `StorageConfigWrite`, `StorageTestResponse`, `StorageActivateResponse` e `systemStorageApi` |
| `src/pages/admin/SistemaStoragePage.tsx` | Riscritto completamente con integrazione API reale |

---

## api.ts — Nuovi tipi e client

```ts
export const systemStorageApi = {
  list:     () => http.get<StorageConfigListResponse>('/api/admin/system/storage-configs').then((r) => r.data),
  create:   (data) => http.post<StorageConfigItem>('/api/admin/system/storage-configs', data).then((r) => r.data),
  update:   (id, data) => http.put<StorageConfigItem>(`/api/admin/system/storage-configs/${id}`, data).then((r) => r.data),
  test:     (id) => http.post<StorageTestResponse>(`/api/admin/system/storage-configs/${id}/test`).then((r) => r.data),
  activate: (id) => http.post<StorageActivateResponse>(`/api/admin/system/storage-configs/${id}/activate`).then((r) => r.data),
  delete:   (id) => http.delete<{ message: string }>(`/api/admin/system/storage-configs/${id}`).then((r) => r.data),
}
```

Endpoint implementati:
- `GET /api/admin/system/storage-configs` — lista + stato runtime
- `POST /api/admin/system/storage-configs` — creazione
- `PUT /api/admin/system/storage-configs/{id}` — modifica
- `POST /api/admin/system/storage-configs/{id}/test` — test connessione
- `POST /api/admin/system/storage-configs/{id}/activate` — attivazione runtime
- `DELETE /api/admin/system/storage-configs/{id}` — eliminazione

---

## SistemaStoragePage.tsx — Comportamento

### Caricamento

- `useEffect` al mount → `systemStorageApi.list()`
- `current_source` → banner informativo (ENV vs DB)
- `env_fallback` → sezione read-only separata dalla tabella DB

### Naming campi

Tutti i campi usano il naming backend reale:
- `name`, `code`, `provider_type`, `bucket`, `region`, `endpoint`
- `use_path_style_endpoint`, `is_active`, `is_default`
- `last_tested_at`, `last_test_status`, `last_test_message`
- `has_access_key`, `has_secret_key`, `access_key_masked`, `secret_key_masked`

Nessun alias italiano (`nome`, `codice`, `attivo`, `ultimo_test`, ecc.) — eliminati.

### Provider select

Select chiusa con valori esatti:
- `minio` → MinIO
- `aws_s3` → AWS S3
- `s3_compatible` → S3 compatibile

### Gestione secret

- Campi `access_key` e `secret_key` **mai precompilati** in edit
- Se `has_access_key = true` → placeholder e FormText "Chiave presente"
- Se `has_secret_key = true` → placeholder e FormText "Secret presente"
- Payload invia `access_key`/`secret_key` solo se l'utente ha digitato un valore (non stringa vuota)
- Secret non vengono mai visualizzati in chiaro

### Azioni con permessi

| Azione | Permesso richiesto |
|--------|-------------------|
| Nuova configurazione | `system_storage.create` |
| Modifica | `system_storage.update` |
| Test connessione | `system_storage.test` |
| Attiva | `system_storage.activate` |
| Elimina | `system_storage.delete` |

### Test connessione

- Chiama `POST /api/admin/system/storage-configs/{id}/test`
- Toast successo/warning con messaggio dal backend
- `loadList()` dopo il test per aggiornare `last_test_status`

### Attivazione

- Chiama `POST /api/admin/system/storage-configs/{id}/activate`
- `loadList()` per aggiornare `current_source` e il banner
- Pulsante visibile solo se `!item.is_default`

### Eliminazione

- `DELETE` (non "disattiva")
- Confirm dialog prima dell'azione
- `loadList()` dopo eliminazione

---

## Gap corretti rispetto al mock (handoff 142)

| Gap | Correzione |
|-----|-----------|
| Field names italiani (`nome`, `codice`, `attivo`, ecc.) | Eliminati — usati campi backend reali |
| Azione "Disattiva" senza endpoint backend | Sostituita con "Elimina" via `DELETE` |
| Secret precompilati o inviati vuoti | Campo vuoto, inviato solo se modificato |
| Nessun hint `has_access_key`/`has_secret_key` | Aggiunto FormText e placeholder contestuale |
| Mock data statico | Caricamento da API reale con reload post-azione |
| Nessuna distinzione permessi | Ogni azione condizionata al permesso specifico |
| ENV config non distinguibile da DB | `env_fallback` read-only separato, `items[]` solo DB |

---

## Build

`npm run build` — verificato senza errori TypeScript né Vite.
