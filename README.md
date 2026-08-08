# FamilyHub

Stack locale di sviluppo per backend Laravel, frontend React/Vite e servizi infrastrutturali containerizzati.

## Avvio rapido

```powershell
cd C:\Projects\FamilyHUB
Copy-Item .env.example .env
docker compose up -d postgres redis minio mc
docker compose run --rm app php artisan key:generate --show
# incolla la chiave generata dentro .env come APP_KEY
docker compose run --rm app-init
docker compose up -d app worker frontend nginx
```

## Endpoint locali

- Web/API: `http://localhost:8100`
- Health API: `http://localhost:8100/api/health`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

## WAF locale opzionale

```powershell
docker compose --profile edge up -d
```

Questo avvia `SafeLine` davanti a `nginx` per prove locali della catena edge.
