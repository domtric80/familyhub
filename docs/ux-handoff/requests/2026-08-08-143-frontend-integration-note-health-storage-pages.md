# FamilyHub — Frontend integration note — Health + Storage pages

Data: 2026-08-08  
Owner backend: Codex  
Target team: frontend / UX integration

## Obiettivo

Allineare in modo puntuale le pagine già presenti:

- `frontend/src/pages/admin/SistemaHealthPage.tsx`
- `frontend/src/pages/admin/SistemaStoragePage.tsx`

al backend reale già disponibile.

Questo documento è operativo e file-based: indica cosa cambiare, cosa eliminare e quali payload usare.

## File 1 — `frontend/src/pages/admin/SistemaHealthPage.tsx`

## Stato attuale da correggere

La pagina è ancora basata su mock locali:

- `ServiceStatus = 'ok' | 'warning' | 'error' | 'unknown'`
- `INITIAL_SERVICES` hardcoded
- chiavi servizio mock:
  - `api`
  - `postgres`
  - `queue`
  - `clamav`
  - `minio`

Questi valori non corrispondono al backend.

## Backend reale da usare

### Endpoint lettura

`GET /api/admin/system/health`

### Endpoint refresh manuale

`POST /api/admin/system/health/run`

### Shape response

```json
{
  "generated_at": "2026-08-08T20:10:00+02:00",
  "storage_config_source": "ENV",
  "summary": {
    "ok": 5,
    "warning": 2,
    "error": 1,
    "not_configured": 1
  },
  "services": [
    {
      "service": "api_backend",
      "label": "API backend",
      "status": "ok",
      "checked_at": "2026-08-08T20:10:00+02:00",
      "latency_ms": 1.25,
      "message": "API applicativa disponibile.",
      "error": null,
      "meta": {}
    }
  ]
}
```

## Modifiche richieste nel file

### 1. Sostituire il tipo `ServiceStatus`

Usare:

```ts
type ServiceStatus = 'ok' | 'warning' | 'error' | 'not_configured'
```

Non usare più `unknown`.

### 2. Sostituire `ServiceHealth`

Usare il naming backend reale:

```ts
interface SystemHealthServiceItem {
  service: string
  label: string
  status: ServiceStatus
  checked_at?: string | null
  latency_ms?: number | null
  message: string
  error?: string | null
  meta: Record<string, unknown>
}
```

### 3. Eliminare `INITIAL_SERVICES`

La lista servizi deve arrivare solo dal backend.

Stato iniziale consigliato:

```ts
const [services, setServices] = useState<SystemHealthServiceItem[]>([])
const [summary, setSummary] = useState({ ok: 0, warning: 0, error: 0, not_configured: 0 })
const [storageConfigSource, setStorageConfigSource] = useState<'ENV' | 'DB' | null>(null)
```

### 4. Cambiare `StatusDot`

Mantenere lo stile ma mappare:

- `ok`
- `warning`
- `error`
- `not_configured`

Label consigliate:

- `ok` → `Operativo`
- `warning` → `Warning`
- `error` → `Errore`
- `not_configured` → `Non configurato`

### 5. Banner alto pagina

Sostituire il banner attuale “modulo in implementazione backend” con banner runtime:

- se `storage_config_source === 'ENV'`:
  - `Lo storage attivo è letto dal file ambiente (.env).`
- se `storage_config_source === 'DB'`:
  - `Lo storage attivo è gestito da configurazione amministrativa.`

### 6. Pulsante refresh

Il pulsante deve:

- chiamare `POST /api/admin/system/health/run`
- aggiornare `services`, `summary`, `storage_config_source`
- mostrare toast successo: `Controllo servizi completato.`

### 7. Prima apertura pagina

Alla mount:

- chiamare `GET /api/admin/system/health`
- popolare stato pagina

### 8. KPI

Non calcolare dai servizi manualmente se è già presente `summary`.

Usare direttamente:

- `summary.ok`
- `summary.warning`
- `summary.error`
- `summary.not_configured`

### 9. Drawer dettaglio

Mostrare:

- `service`
- `error`
- `meta`

Non mostrare:

- token
- chiavi
- secret

Anche se il backend oggi non li invia, la UI non deve prevederli.

### 10. Gestione servizi assenti

`minio_console` può non esserci.

Quindi:

- niente placeholder dedicato
- niente tabella fissa a servizi predefiniti

Renderizzare solo ciò che arriva in `services[]`.

## File 2 — `frontend/src/pages/admin/SistemaStoragePage.tsx`

## Stato attuale da correggere

La pagina usa un modello mock italiano:

- `nome`
- `codice`
- `provider`
- `path_style`
- `attivo`
- `ultimo_test`
- `test_esito`

Il backend usa naming diverso.

## Backend reale da usare

### Endpoint

- `GET /api/admin/system/storage-configs`
- `POST /api/admin/system/storage-configs`
- `PUT /api/admin/system/storage-configs/{storageConfig}`
- `PATCH /api/admin/system/storage-configs/{storageConfig}`
- `POST /api/admin/system/storage-configs/{storageConfig}/test`
- `POST /api/admin/system/storage-configs/{storageConfig}/activate`
- `DELETE /api/admin/system/storage-configs/{storageConfig}`

### Shape item reale

```json
{
  "id": 3,
  "code": "MINIO_MAIN",
  "name": "MinIO principale",
  "provider_type": "minio",
  "bucket": "familyhub-private",
  "region": "eu-south-1",
  "endpoint": "http://minio:9000",
  "use_path_style_endpoint": true,
  "prefix": "released",
  "is_active": true,
  "is_default": true,
  "last_tested_at": "2026-08-08T20:40:00+02:00",
  "last_test_status": "ok",
  "last_test_message": "Connessione storage verificata con successo.",
  "access_key_masked": "****yhub",
  "secret_key_masked": "****-nio",
  "has_access_key": true,
  "has_secret_key": true
}
```

## Modifiche richieste nel file

### 1. Sostituire `StorageConfig`

Usare:

```ts
type StorageProvider = 'minio' | 'aws_s3' | 's3_compatible'
type StorageSource = 'ENV' | 'DB'

interface SystemStorageConfigItem {
  id: number
  code: string
  name: string
  provider_type: StorageProvider
  bucket: string
  region?: string | null
  endpoint?: string | null
  use_path_style_endpoint: boolean
  prefix?: string | null
  is_active: boolean
  is_default: boolean
  last_tested_at?: string | null
  last_test_status?: 'ok' | 'warning' | 'error' | 'not_configured' | null
  last_test_message?: string | null
  access_key_masked?: string | null
  secret_key_masked?: string | null
  has_access_key: boolean
  has_secret_key: boolean
}
```

### 2. Eliminare `MOCK_CONFIGS`

Lo stato iniziale deve arrivare dal backend:

```ts
const [items, setItems] = useState<SystemStorageConfigItem[]>([])
const [currentSource, setCurrentSource] = useState<'ENV' | 'DB' | null>(null)
const [activeConfigId, setActiveConfigId] = useState<number | null>(null)
const [envFallback, setEnvFallback] = useState<Record<string, unknown> | null>(null)
```

### 3. Prima apertura pagina

Alla mount:

- chiamare `GET /api/admin/system/storage-configs`
- popolare:
  - `items`
  - `currentSource`
  - `activeConfigId`
  - `envFallback`

### 4. Tabella

Sostituire le colonne italiane mock con i campi reali backend:

- `name`
- `code`
- `provider_type`
- `bucket`
- `endpoint`
- `region`
- `use_path_style_endpoint`
- `is_active`
- `is_default`
- `last_tested_at`
- `last_test_status`

### 5. Badge esito test

Usare `last_test_status`, non `test_esito`.

Valori possibili:

- `ok`
- `warning`
- `error`
- `not_configured`
- `null`

### 6. Banner runtime

Se `currentSource === 'ENV'`:

- mostrare banner informativo `.env`

Se `currentSource === 'DB'`:

- mostrare banner informativo configurazione amministrativa

### 7. Create

Il form deve inviare:

```json
{
  "code": "...",
  "name": "...",
  "provider_type": "minio",
  "bucket": "...",
  "region": "...",
  "endpoint": "...",
  "use_path_style_endpoint": true,
  "access_key": "...",
  "secret_key": "...",
  "prefix": "...",
  "is_active": true,
  "is_default": false
}
```

### 8. Edit

In modifica:

- non precompilare `access_key`
- non precompilare `secret_key`
- mostrare solo hint:
  - `Chiave presente`
  - `Secret presente`

Regola submit:

- se il campo non è stato toccato, non inviarlo
- se l’utente lo svuota intenzionalmente, inviare stringa vuota

### 9. Test connessione

La riga deve chiamare:

`POST /api/admin/system/storage-configs/{id}/test`

Poi:

- aggiornare l’item nella tabella
- mostrare toast col risultato

### 10. Attivazione

La riga deve chiamare:

`POST /api/admin/system/storage-configs/{id}/activate`

Poi:

- aggiornare `currentSource`
- aggiornare `activeConfigId`
- aggiornare `items`
- mostrare toast: `Configurazione storage attivata.`

### 11. Eliminazione

Usare:

`DELETE /api/admin/system/storage-configs/{id}`

Correzione importante:

- il pulsante non deve più chiamarsi “Disattiva”
- il backend oggi fa delete, non disable logico

Label UI consigliata:

- `Elimina`

### 12. Configurazioni ENV

Il backend non restituisce record `ENV` dentro `items[]` come riga pseudo-editabile.

Quindi:

- usare `envFallback` come box informativo separato
- non simulare una configurazione ENV come riga CRUD normale

## File 3 — `frontend/src/App.tsx`

Verificare che le route restino:

- `/admin/sistema/health`
- `/admin/sistema/storage`

Nessuna modifica concettuale richiesta oltre all’eventuale wiring API.

## File 4 — `frontend/src/layout/sidebar/menuItems.ts`

Verificare label finali consigliate:

- `Storage documentale`
- `Health servizi`

Se oggi c’è una label troppo generica come `Storage`, preferire `Storage documentale`.

## API layer consigliato

Creare o aggiornare un modulo dedicato, ad esempio:

- `frontend/src/services/systemApi.ts`

Con metodi:

```ts
getHealth()
runHealth()
getStorageConfigs()
createStorageConfig(payload)
updateStorageConfig(id, payload)
testStorageConfig(id)
activateStorageConfig(id)
deleteStorageConfig(id)
```

## Gestione errori

### `403`

- pagina o blocco con messaggio permesso insufficiente

### `422`

- errori campo per campo nel form storage

### `500`

- toast errore
- non cancellare dati già caricati in pagina

## QA rapida per frontend

### Health

- [ ] mount pagina chiama `GET /api/admin/system/health`
- [ ] pulsante run chiama `POST /api/admin/system/health/run`
- [ ] stati mostrati correttamente con `not_configured`
- [ ] nessun servizio hardcoded

### Storage

- [ ] mount pagina chiama `GET /api/admin/system/storage-configs`
- [ ] create usa naming backend reale
- [ ] edit non reinvia secret vuoti in automatico
- [ ] test aggiorna esito
- [ ] activate aggiorna runtime source
- [ ] delete usa endpoint `DELETE`
- [ ] `envFallback` mostrato come box, non come riga CRUD

## Conclusione

Se il team frontend applica questo documento insieme ai contratti `140`, `141` e `142`, l’integrazione delle due pagine può considerarsi chiusa senza ulteriori assunzioni lato UI.

