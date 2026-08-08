# Runtime produzione FamilyHub

## File inclusi
- `docker-compose.prod.yml`
- `infra/nginx/familyhub.prod.conf`
- `infra/supervisor/familyhub.conf`
- `infra/env/backend.prod.env.example`

## Uso rapido
1. Copiare `infra/env/backend.prod.env.example` in un file reale `.env` di produzione fuori dal repository oppure mantenerlo sul server con permessi restrittivi.
2. Aggiornare dominio, segreti, SMTP e password.
3. Preparare i certificati TLS host in `/etc/letsencrypt/live/familyhub/` oppure adattare i path Nginx.
4. Avviare bootstrap frontend:
   - `docker compose -f docker-compose.prod.yml run --rm frontend-build`
5. Inizializzare bucket MinIO:
   - `docker compose -f docker-compose.prod.yml run --rm mc`
6. Avviare stack:
   - `docker compose -f docker-compose.prod.yml up -d postgres redis minio clamav app worker scheduler nginx`

## Note
- Questo compose non espone PostgreSQL, Redis o MinIO su Internet.
- Il frontend viene buildato in volume dedicato e servito da Nginx.
- Per un WAF esterno davanti al container Nginx, pubblicare il reverse proxy sulla VPS e inoltrare verso `nginx:443` o adattare le porte host.
- `familyhub.prod.conf` usa un path TLS placeholder: sostituire `familyhub` con il nome reale del certificato.
