# Bootstrap self-healing

## Obiettivo

Evitare ambienti runtime senza dati minimi essenziali:

- ruoli e permessi
- lookup applicativi
- geografia minima
- utente admin bootstrap
- assegnazione `SUPER_ADMIN` su struttura demo

## Comando principale

`php artisan familyhub:ensure-bootstrap`

## Proprietà

- idempotente
- non cancella dati esistenti
- ripristina solo il minimo mancante
- può forzare la password admin quando serve

## Opzioni utili

- `--admin-email=...`
- `--admin-password=...`
- `--force-admin-password`
- `--disable-admin-mfa`
- `--seed-missing-only`

## Integrazione Docker

Il comando è eseguito da:

- `C:\Projects\FamilyHUB\backend\docker\app\init-app.sh`
- `C:\Projects\FamilyHUB\backend\docker\app\start-app.sh`
- `C:\Projects\FamilyHUB\backend\docker\app\start-worker.sh`

Questo riduce il rischio di:

- login assente dopo restart
- seed parziale
- runtime senza admin operativo

## Ripristino rapido accesso

`php artisan familyhub:reset-admin-access admin@familyhub.local --password=password --disable-mfa`

Se l'utente non esiste, il comando richiama automaticamente il bootstrap minimo.
