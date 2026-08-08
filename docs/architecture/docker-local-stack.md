# FamilyHub Local Docker Stack

## Obiettivo

Questo stack serve per sviluppare e testare localmente le funzionalità già implementate senza dipendere da installazioni locali di PHP, Node o PostgreSQL.

## Servizi

- `nginx`
  - entrypoint locale della web app
  - disponibile su `http://localhost:8100`
- `frontend`
  - Vite dev server
- `app`
  - Laravel API
- `worker`
  - queue worker
- `app-init`
  - bootstrap una tantum di database e seed
- `postgres`
  - database locale
- `redis`
  - sessioni, cache, queue
- `minio`
  - object storage compatibile S3
- `mc`
  - crea bucket MinIO privato
- `safeline`
  - opzionale, attivabile solo con profile `edge`

## Accessi locali

- app web / api: `http://localhost:8100`
- API health: `http://localhost:8100/api/health`
- MinIO API S3: `http://localhost:9000`
- MinIO console: `http://localhost:9001`

## Avvio consigliato

### 0. Preparazione variabili stack

```powershell
Copy-Item .env.example .env
```

Aggiorna almeno:

- `APP_KEY`
- `DB_PASSWORD`
- `MINIO_ROOT_PASSWORD`

Per generare una chiave applicativa valida:

```powershell
docker compose run --rm app php artisan key:generate --show
```

### 1. Bootstrap iniziale

```powershell
docker compose up -d postgres redis minio mc
docker compose run --rm app-init
```

### 2. Avvio sviluppo

```powershell
docker compose up -d app worker frontend nginx
```

### 3. Stack completo con WAF locale

```powershell
docker compose --profile edge up -d
```

## Credenziali locali iniziali

- admin API:
  - email: `admin@familyhub.local`
  - password: `password`

## Note

- `safeline` non è obbligatorio per il normale sviluppo locale
- `nginx` viene esposto direttamente su `8100` per evitare conflitti con altri servizi locali
- `app-init` esegue migration e seed sul database PostgreSQL locale
- lo stack legge le variabili da `C:\Projects\FamilyHUB\.env`
- `minio` espone sia API S3 (`9000`) sia console (`9001`)
