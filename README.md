# FamilyHub

[![Versione](https://img.shields.io/badge/version-1.3.0-7366ff)](CHANGELOG.md)
[![Licenza](https://img.shields.io/badge/license-source--available-orange)](LICENSE.md)
[![Security](https://img.shields.io/badge/security-policy-success)](SECURITY.md)
[![Release Process](https://img.shields.io/badge/release-process-blue)](docs/releases/RELEASE-PROCESS.md)

Applicativo gestionale per strutture residenziali e servizi educativi, con backend Laravel, frontend React/Vite e stack infrastrutturale Docker.

## Modello del progetto

`FamilyHub` adotta un modello:

- **software disponibile gratuitamente**
- **codice sorgente visibile**
- **uso interno consentito**
- **servizi professionali a pagamento**

Questo repository **non** e distribuito con una licenza open source OSI, ma con una licenza **source-available** che consente l'uso interno gratuito e limita rivendita, redistribuzione commerciale e SaaS concorrente.

Documenti chiave:

- `LICENSE.md`  termini di licenza del repository
- `COMMERCIAL.md`  modello commerciale e servizi professionali
- `docs/deliverables/2026-08-11-familyhub-manifesto-etico-commerciale.md`  manifesto etico-commerciale del progetto

Documenti di governance:

- `SECURITY.md`
- `docs/releases/RELEASE-PROCESS.md`

## Requisiti

### Opzione A  Avvio con Docker
- Docker Engine 24+
- Docker Compose v2+
- 8 GB RAM consigliati
- porte libere: `8100`, `5173`, `5432`, `6379`, `9000`, `9001`

### Opzione B  Installazione Linux senza Docker
- Debian 12 / Ubuntu 24.04 LTS consigliati
- PHP 8.3 con estensioni: `bcmath`, `ctype`, `curl`, `fileinfo`, `intl`, `json`, `mbstring`, `openssl`, `pdo_pgsql`, `redis`, `tokenizer`, `xml`, `zip`
- Composer 2.7+
- Node.js 22 LTS + npm 10+
- PostgreSQL 16+
- Redis 7+
- Nginx
- Supervisor o systemd per code worker
- MinIO oppure storage S3 compatibile

## Struttura repository
- `backend/`  API Laravel
- `frontend/`  UI React/Vite
- `infra/`  appunti e componenti infrastrutturali
- `docs/`  documentazione funzionale, API e handoff UX
- `vendor-assets/`  asset vendor di supporto; non fanno parte della supply chain runtime dell'applicativo

## Note sicurezza repository
- i manifest `package.json` dei template vendor non runtime non vengono tracciati nel repository applicativo
- gli audit di sicurezza rilevanti per FamilyHub riguardano solo:
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `backend/composer.json`
  - `backend/composer.lock`
  - `backend/package.json` se usato in bootstrap locale Laravel/Vite

## Installazione con Docker

### 1. Preparazione
```powershell
cd C:\Projects\FamilyHUB
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
```

### 2. Configurazione minima
Aggiornare almeno questi valori:

- file radice `.env`
- file `backend/.env`

Valori da verificare:
- `APP_ENV`
- `APP_URL`
- `FRONTEND_URL`
- `DB_*`
- `REDIS_*`
- `MINIO_*` oppure storage S3 compatibile
- `SANCTUM_STATEFUL_DOMAINS`
- `SESSION_DOMAIN`

### 3. Bootstrap servizi
```powershell
docker compose up -d postgres redis minio mc
docker compose run --rm app php artisan key:generate --show
```

Inserire la chiave generata in `backend/.env` come `APP_KEY`, poi eseguire:

```powershell
docker compose run --rm app-init
docker compose up -d app worker frontend nginx
```

### 4. Verifica
- Web/API: [http://localhost:8100](http://localhost:8100)
- Health API: [http://localhost:8100/api/health](http://localhost:8100/api/health)
- Frontend dev diretto: [http://localhost:5173](http://localhost:5173)
- MinIO API: [http://localhost:9000](http://localhost:9000)
- MinIO Console: [http://localhost:9001](http://localhost:9001)

### 5. Comandi utili Docker
```powershell
# migrazioni
docker compose exec app php artisan migrate

# test backend
docker compose exec app php artisan test

# build frontend
docker compose exec frontend npm run build

# log servizi
docker compose logs -f app worker frontend nginx
```

### 6. WAF locale opzionale
```powershell
docker compose --profile edge up -d
```

Questo profilo avvia il layer edge locale per test della catena reverse proxy/WAF.

## Installazione Linux senza Docker

Di seguito una procedura base per Debian 12 / Ubuntu 24.04.

### 1. Pacchetti di sistema
```bash
sudo apt update
sudo apt install -y nginx postgresql redis-server supervisor unzip git curl \
  php8.3 php8.3-fpm php8.3-cli php8.3-pgsql php8.3-redis php8.3-curl \
  php8.3-xml php8.3-mbstring php8.3-zip php8.3-bcmath php8.3-intl
```

Installare Composer:
```bash
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
sudo mv composer.phar /usr/local/bin/composer
rm composer-setup.php
```

Installare Node.js 22 LTS:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Deploy codice
```bash
cd /var/www
sudo git clone https://github.com/domtric80/familyhub.git
sudo chown -R $USER:$USER familyhub
cd familyhub
```

### 3. Backend Laravel
```bash
cd /var/www/familyhub/backend
cp .env.example .env
composer install --no-dev --optimize-autoloader
php artisan key:generate
```

Configurare `backend/.env` con:
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://tuo-dominio`
- connessione PostgreSQL
- Redis
- credenziali MinIO/S3
- mail se prevista
- CORS/Sanctum coerenti con il dominio frontend

Creare database e lanciare migrazioni:
```bash
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
```

Ottimizzazioni produzione:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 4. Frontend React/Vite
```bash
cd /var/www/familyhub/frontend
npm ci
npm run build
```

Se il frontend usa `.env.production`, creare il file con gli endpoint corretti prima del build.

### 5. Nginx
Esempio minimo `/etc/nginx/sites-available/familyhub`:

```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/familyhub/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /storage/ {
        alias /var/www/familyhub/backend/public/storage/;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

Abilitare il sito:
```bash
sudo ln -s /etc/nginx/sites-available/familyhub /etc/nginx/sites-enabled/familyhub
sudo nginx -t
sudo systemctl reload nginx
```

### 6. PHP-FPM e queue worker
Avvio API Laravel con PHP-FPM. Per le code usare Supervisor.

Esempio `/etc/supervisor/conf.d/familyhub-worker.conf`:
```ini
[program:familyhub-worker]
command=php /var/www/familyhub/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
directory=/var/www/familyhub/backend
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/familyhub-worker.log
stopwaitsecs=3600
```

Poi:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start familyhub-worker:*
```

### 7. Scheduler Laravel
```bash
crontab -e
```
Aggiungere:
```cron
* * * * * cd /var/www/familyhub/backend && php artisan schedule:run >> /dev/null 2>&1
```

### 8. HTTPS
Configurare TLS con Let's Encrypt:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

## Aggiornamento applicazione

### Docker
```powershell
cd C:\Projects\FamilyHUB
git pull
docker compose build
docker compose up -d
docker compose exec app php artisan migrate --force
```

### Linux senza Docker
```bash
cd /var/www/familyhub
git pull
cd backend && composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
cd ../frontend && npm ci && npm run build
sudo systemctl reload nginx
sudo supervisorctl restart familyhub-worker:*
```

## Note operative
- Non versionare .env, dump database, backup locali, log e archivi temporanei.
- Il repository non deve contenere pacchetti ZIP di template o screenshot di lavoro.
- Per produzione e consigliato un reverse proxy/WAF dedicato davanti a Nginx.

## Documentazione aggiuntiva
- Hardening produzione: docs/security/2026-08-08-production-deploy-hardening.md
- Deploy nuovo ambiente Debian/Docker: docs/operations/2026-08-08-debian-docker-new-environment-checklist.md
- Template .env.prod: infra/env/backend.prod.env.template
- Primo accesso VPS OVH/Aruba: docs/operations/2026-08-08-ovh-aruba-first-access-checklist.md
- Changelog: CHANGELOG.md
- Release notes v1.3.0: docs/releases/2026-08-13-v1.3.0.md
- Disegno storage config + health servizi: docs/architecture/2026-08-08-storage-configuration-and-service-health.md



