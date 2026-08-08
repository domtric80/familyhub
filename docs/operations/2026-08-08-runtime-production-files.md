# Runtime produzione FamilyHub

## File inclusi
- `docker-compose.prod.yml`
- `backend/Dockerfile.prod`
- `backend/.dockerignore`
- `frontend/Dockerfile.prod`
- `frontend/nginx/default.conf`
- `frontend/.dockerignore`
- `infra/nginx/familyhub.prod.conf`
- `infra/supervisor/familyhub.conf`
- `infra/env/backend.prod.env.example`

## Cosa cambia rispetto alla bozza iniziale
- backend e frontend vengono buildati come immagini Docker immutabili;
- in produzione non viene più montato il codice applicativo dal filesystem host;
- rimangono persistenti solo i volumi dati (`postgres`, `redis`, `minio`, `clamav`) e lo storage pubblico Laravel necessario per `/storage`;
- il reverse proxy TLS (`nginx`) inoltra il traffico al container `frontend` e alle API `app`.

## Uso rapido
1. Copiare `infra/env/backend.prod.env.example` in un file reale `.env` di produzione fuori dal repository oppure mantenerlo sul server con permessi restrittivi.
2. Aggiornare dominio, segreti, SMTP, password, bucket e chiavi applicative.
3. Preparare i certificati TLS host in `/etc/letsencrypt/live/familyhub/` oppure adattare i path Nginx.
4. Build immagini immutabili:
   - `docker compose -f docker-compose.prod.yml build --pull`
5. Inizializzare bucket MinIO:
   - `docker compose -f docker-compose.prod.yml run --rm mc`
6. Avviare stack:
   - `docker compose -f docker-compose.prod.yml up -d postgres redis minio clamav app worker scheduler frontend nginx`

## Note operative
- Questo compose non espone PostgreSQL, Redis o MinIO su Internet.
- `public_storage` è l'unico volume applicativo condiviso tra backend e Nginx per gli asset pubblici Laravel.
- `familyhub.prod.conf` usa un path TLS placeholder: sostituire `familyhub` con il nome reale del certificato.
- Se davanti a `nginx` si monta un WAF/reverse proxy esterno, pubblicare solo `80/443` della VPS e lasciare interni gli altri servizi.
- Per aggiornare il software in produzione: `git pull`, poi `docker compose -f docker-compose.prod.yml build --pull` e infine `docker compose -f docker-compose.prod.yml up -d`.
