# FamilyHub · Runtime Docker frontend

## Obiettivo

Fornire al team frontend/webdesigner tutte le informazioni operative necessarie
per lavorare sul container frontend senza ambiguità.

## Servizio Docker

Definizione attuale in:

- `C:\Projects\FamilyHUB\docker-compose.yml`

Servizio:

- `frontend`

## Immagine e container

- base image: `node:22-alpine`
- Dockerfile: `C:\Projects\FamilyHUB\frontend\Dockerfile`
- working directory container: `/workspace/frontend`

## Comando di avvio

Il servizio frontend parte con:

- `npm install && npm run dev -- --host 0.0.0.0 --port 5173`

Quindi il dev server gira nel container su:

- `5173`

ed è esposto verso l’utente tramite Nginx sulla porta locale:

- `8100`

## Flusso richieste browser

Browser utente:

- `http://localhost:8100`

Routing interno:

- browser → `nginx` → `frontend` per asset/UI
- browser → `nginx` → `app` per `/api/*`

## Montaggi volume

Il servizio frontend usa:

- bind mount codice: `./frontend:/workspace/frontend`
- volume dedicato moduli Node:
  - `frontend_node_modules:/workspace/frontend/node_modules`

## Implicazione importante

Il volume `frontend_node_modules` può restare incoerente rispetto al codice sorgente o al `package.json`.
Quando succede, il team frontend può vedere errori di modulo mancante anche se il package è dichiarato.

## Comandi operativi standard

### Stato container

- `docker compose ps frontend nginx`

### Log frontend

- `docker compose logs -f frontend`

### Shell nel container

- `docker compose exec frontend sh`

### Install dipendenze

- `docker compose exec frontend npm install`

### Build manuale

- `docker compose exec frontend npm run build`

### Lint manuale

- `docker compose exec frontend npm run lint`

## Reset completo dipendenze frontend

Se il team frontend trova errori del tipo:

- modulo non trovato
- type declarations mancanti
- volume `node_modules` incoerente

eseguire nell’ordine:

1. `docker compose stop frontend`
2. `docker volume rm familyhub_frontend_node_modules`
3. `docker compose up -d frontend`
4. attendere il nuovo `npm install`

In alternativa:

1. `docker compose down`
2. `docker volume rm familyhub_frontend_node_modules`
3. `docker compose up -d`

## Dipendenze attese dal frontend

Da `C:\Projects\FamilyHUB\frontend\package.json`:

### runtime

- `react`
- `react-dom`
- `react-router-dom`
- `react-feather`
- `axios`

### dev

- `typescript`
- `vite`
- `@vitejs/plugin-react`
- `eslint`
- plugin eslint collegati

## Se il build fallisce

Verificare:

1. che `package.json` sia aggiornato
2. che `package-lock.json` sia coerente
3. che `frontend_node_modules` non sia obsoleto
4. che il team stia lavorando nel path corretto:
   - host: `C:\Projects\FamilyHUB\frontend`
   - container: `/workspace/frontend`

## File chiave per il team frontend

- `C:\Projects\FamilyHUB\frontend\package.json`
- `C:\Projects\FamilyHUB\frontend\Dockerfile`
- `C:\Projects\FamilyHUB\frontend\vite.config.ts`
- `C:\Projects\FamilyHUB\frontend\tsconfig.json`
- `C:\Projects\FamilyHUB\docker-compose.yml`

## Nota di processo

Il backend non modifica più il frontend.
Ogni richiesta funzionale verso il team frontend deve passare tramite:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\`

