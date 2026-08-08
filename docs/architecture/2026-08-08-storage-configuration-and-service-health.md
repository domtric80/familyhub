# Storage configuration e service health — disegno v1.1

Data: 2026-08-08
Target: post `v1.0.0`

## Obiettivo
Introdurre due capacità amministrative mancanti ma importanti:
1. configurazione storage S3-compatible da interfaccia amministrativa
2. pagina health dei servizi/componenti con stato operativo sintetico

## Situazione attuale
### Storage
Oggi la configurazione storage è solo ambiente/file-based:
- `backend/config/filesystems.php`
- `.env`
- `infra/env/backend.prod.env.example`
- `infra/env/backend.prod.env.template`

Parametri principali:
- `FILESYSTEM_DISK`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_DEFAULT_REGION`
- `AWS_BUCKET`
- `AWS_ENDPOINT`
- `AWS_USE_PATH_STYLE_ENDPOINT`

Questo consente già l'uso di:
- MinIO locale
- AWS S3
- Wasabi
- OVH Object Storage / altro endpoint S3 compatibile

### Health
Oggi esiste solo `GET /api/health`, che indica la disponibilità dell'API ma non lo stato dei servizi dipendenti.

## Nuova area amministrativa proposta
### Sezione
`Amministrazione > Sistema`

### Sottosezioni
- `Configurazione Storage`
- `Health Servizi`
- in futuro: `Configurazione Mail`, `Configurazione Antivirus`, `Segreti/integrazioni`, `Diagnostica`

## Configurazione Storage — requisiti

### Obiettivo funzionale
Consentire all'amministratore di scegliere e testare il backend di storage documentale senza agire solo su file `.env`.

### Provider supportati
- MinIO
- AWS S3
- S3 compatibile generico

### Campi UI minimi
- stato configurazione: attiva/non attiva
- provider
- label configurazione
- bucket
- region
- endpoint
- use path style endpoint: sì/no
- access key
- secret key
- prefisso opzionale
- flag `configurazione predefinita`
- pulsante `Test connessione`
- pulsante `Attiva`

### Requisito sicurezza fondamentale
Le credenziali non devono essere salvate in chiaro nel DB.

#### Obbligatorio
- `access_key` cifrata nel DB
- `secret_key` cifrata nel DB
- eventuali token/provider secrets cifrati nel DB
- visualizzazione parziale mascherata in UI (`****last4`)
- audit log su create/update/activate/test

#### Implementazione consigliata
- cifratura applicativa con `Crypt::encryptString()` / `Crypt::decryptString()` Laravel
- chiave di cifratura derivata da `APP_KEY`
- campi DB dedicati, ad esempio:
  - `access_key_encrypted`
  - `secret_key_encrypted`

#### Nota architetturale
Questa soluzione protegge i dati a riposo nel DB ma non sostituisce un secret manager dedicato.

### Evoluzione futura consigliata
Per ambienti più sensibili:
- supporto Vault / secret manager esterno
- possibilità di memorizzare nel DB solo un riferimento segreto e non il valore completo
- rotazione chiavi applicative governata

### Modello dati proposto
Tabella esempio: `system_storage_configs`
- `id`
- `code`
- `name`
- `provider_type` (`minio`, `aws_s3`, `s3_compatible`)
- `bucket`
- `region`
- `endpoint`
- `use_path_style_endpoint`
- `access_key_encrypted`
- `secret_key_encrypted`
- `prefix`
- `is_active`
- `is_default`
- `last_tested_at`
- `last_test_status`
- `last_test_message`
- `created_by_user_id`
- `updated_by_user_id`
- timestamps

### Policy di attivazione
- una sola configurazione storage `default` attiva alla volta
- cambio configurazione tracciato in audit
- test connessione obbligatorio prima dell'attivazione in produzione

### Compatibilità con `.env`
Per evitare rotture:
- se non esiste configurazione DB attiva, il sistema continua a usare `.env`
- se esiste configurazione DB attiva, il sistema usa quella
- da UI deve essere visibile chiaramente la sorgente attuale: `ENV` oppure `DB`

## Health Servizi — requisiti

### Obiettivo funzionale
Mostrare in una pagina unica lo stato sintetico dei componenti critici, con pallino verde/giallo/rosso e ultimo controllo.

### Componenti da controllare in v1.1
- API backend
- database PostgreSQL
- Redis
- queue worker
- scheduler
- storage documentale attivo
- antivirus ClamAV
- SMTP/mail transport
- MinIO console solo se provider attivo è MinIO locale

### Stato visuale
- verde: `ok`
- giallo: `warning/degraded`
- rosso: `error/unreachable`
- grigio: `not configured/not applicable`

### Dati mostrati per ogni componente
- nome servizio
- stato
- ultimo controllo
- latenza o durata test
- messaggio sintetico
- dettaglio tecnico espandibile

### Endpoint backend proposti
- `GET /api/admin/system/health`
- `POST /api/admin/system/health/run`
- `GET /api/admin/system/storage-configs`
- `POST /api/admin/system/storage-configs`
- `PUT /api/admin/system/storage-configs/{id}`
- `POST /api/admin/system/storage-configs/{id}/test`
- `POST /api/admin/system/storage-configs/{id}/activate`

### RBAC proposto
Permessi dedicati:
- `system_health.read`
- `system_health.run`
- `system_storage.read`
- `system_storage.create`
- `system_storage.update`
- `system_storage.activate`
- `system_storage.test`

### Audit obbligatorio
Tracciare almeno:
- creazione configurazione storage
- modifica configurazione storage
- attivazione/disattivazione configurazione storage
- esecuzione test connessione storage
- esecuzione check health manuale
- esito check critici falliti

## Sequenza implementativa consigliata
1. introdurre versioning ufficiale `v1.0.0`
2. aggiungere `Health Servizi` read-only con fonte dai servizi reali
3. introdurre tabella configurazioni storage cifrate
4. introdurre test connessione storage
5. introdurre attivazione da UI con fallback `.env`

## Decisione sicurezza già fissata
Le credenziali salvate da pannello amministrativo:
- non devono mai essere mostrate integralmente dopo il salvataggio
- non devono essere esportate in chiaro nei log
- non devono essere serializzate in audit in forma leggibile
- devono essere cifrate a riposo nel DB
