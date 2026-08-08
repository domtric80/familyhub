# FamilyHub — Handoff UX/API — Configurazione Storage

Data: 2026-08-08  
Owner backend: Codex  
Scope: pagina amministrativa `Amministrazione > Sistema > Configurazione Storage`

## Stato backend

Il backend è ora operativo con:

- configurazioni storage salvate in DB
- credenziali cifrate a riposo
- fallback automatico a `.env`
- possibilità di test connessione
- possibilità di attivare una configurazione come runtime corrente

## Regola sicurezza fondamentale

I segreti non vengono mai restituiti in chiaro.

La UI riceve solo:

- `access_key_masked`
- `secret_key_masked`
- `has_access_key`
- `has_secret_key`

Quindi:

- mai tentare di rileggere o precompilare i secret reali
- nei form di modifica mostrare campo vuoto con placeholder
- se l’utente non inserisce un nuovo secret, il backend mantiene quello esistente

## Permessi

- `system_storage.read`
- `system_storage.create`
- `system_storage.update`
- `system_storage.activate`
- `system_storage.test`
- `system_storage.delete`

Ruoli oggi previsti:

- `SUPER_ADMIN`: tutti
- `DIRETTORE`: read/create/update/activate/test
- `COORDINATORE`: read/test
- `REFERENTE_STRUTTURA`: read/test

## Endpoint

### 1. Elenco + sorgente runtime attuale

`GET /api/admin/system/storage-configs`

Response:

```json
{
  "current_source": "ENV",
  "active_config_id": null,
  "active_config": null,
  "env_fallback": {
    "provider_type": "minio",
    "bucket": "familyhub-private",
    "region": "eu-south-1",
    "endpoint": "http://minio:9000",
    "use_path_style_endpoint": true,
    "access_key_masked": "****yhub",
    "secret_key_masked": "****-min",
    "disk": "s3"
  },
  "items": []
}
```

### 2. Creazione configurazione

`POST /api/admin/system/storage-configs`

Request body:

```json
{
  "code": "MINIO_MAIN",
  "name": "MinIO principale",
  "provider_type": "minio",
  "bucket": "familyhub-private",
  "region": "eu-south-1",
  "endpoint": "http://minio:9000",
  "use_path_style_endpoint": true,
  "access_key": "familyhub",
  "secret_key": "change-me-minio",
  "prefix": "released",
  "is_active": true,
  "is_default": false
}
```

### 3. Modifica configurazione

`PUT /api/admin/system/storage-configs/{storageConfig}`  
`PATCH /api/admin/system/storage-configs/{storageConfig}`

Regola importante:

- se `access_key` o `secret_key` non vengono inviati, restano invariati
- se vengono inviati come stringa vuota, vengono azzerati

### 4. Test connessione

`POST /api/admin/system/storage-configs/{storageConfig}/test`

Response:

```json
{
  "status": "ok",
  "message": "Connessione storage verificata con successo.",
  "tested_at": "2026-08-08T20:40:00+02:00"
}
```

### 5. Attivazione runtime

`POST /api/admin/system/storage-configs/{storageConfig}/activate`

Response:

```json
{
  "message": "Configurazione storage attivata.",
  "current_source": "DB",
  "item": {
    "id": 3,
    "code": "MINIO_MAIN",
    "name": "MinIO principale",
    "provider_type": "minio",
    "bucket": "familyhub-private",
    "endpoint": "http://minio:9000",
    "use_path_style_endpoint": true,
    "is_active": true,
    "is_default": true,
    "access_key_masked": "****yhub",
    "secret_key_masked": "****-nio",
    "has_access_key": true,
    "has_secret_key": true
  }
}
```

### 6. Eliminazione configurazione

`DELETE /api/admin/system/storage-configs/{storageConfig}`

Response:

```json
{
  "message": "Configurazione storage eliminata."
}
```

## Oggetto configurazione storage

Ogni item in `items[]` o `active_config` ha struttura:

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
  "has_secret_key": true,
  "created_at": "2026-08-08T20:30:00+02:00",
  "updated_at": "2026-08-08T20:40:00+02:00"
}
```

## Valori ammessi

### `provider_type`

- `minio`
- `aws_s3`
- `s3_compatible`

UX deve usare select chiusa, non campo libero.

## Regole UI

### Banner stato runtime

Se `current_source = ENV`:

- mostrare banner informativo: `Lo storage attivo è letto dal file ambiente (.env).`

Se `current_source = DB`:

- mostrare banner informativo: `Lo storage attivo è gestito da configurazione amministrativa.`

### Tabella elenco

Colonne consigliate:

- nome
- codice
- provider
- bucket
- endpoint
- region
- path style
- attiva
- default
- ultimo test
- esito ultimo test
- azioni

### Azioni riga

- `Modifica`
- `Test connessione`
- `Attiva`
- `Elimina`

### Form create/edit

Campi:

- `code`
- `name`
- `provider_type`
- `bucket`
- `region`
- `endpoint`
- `use_path_style_endpoint`
- `access_key`
- `secret_key`
- `prefix`
- `is_active`
- `is_default`

### UX secret fields

- in edit, se `has_access_key = true`, mostrare hint tipo `Chiave presente`
- in edit, se `has_secret_key = true`, mostrare hint tipo `Secret presente`
- i campi non vanno precompilati
- se l’utente vuole cambiare la chiave, inserisce un nuovo valore

## Error handling

- `403` → pagina permesso insufficiente
- `422` → errori form sui campi
- `500` → toast errore generico

## QA checklist UX

- creare configurazione senza rompere il fallback `.env`
- verificare che i secret non vengano mai mostrati in chiaro dopo il save
- test connessione aggiorna esito ultimo test in tabella
- attivazione cambia `current_source` a `DB`
- edit senza reinserire i secret non deve svuotarli
- delete non deve mostrare o loggare segreti

