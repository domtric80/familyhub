# FamilyHub Stack Blueprint v0.1

## Obiettivo

Questa bozza definisce il perimetro tecnico iniziale di FamilyHub con un approccio secure-by-default, interamente dockerizzabile in locale e portabile verso staging e produzione.

## Topologia

- `SafeLine` come WAF pubblico
- `Nginx` come reverse proxy applicativo
- `React + Vite` per frontend/PWA
- `Laravel 11` per backend API
- `PostgreSQL 16` come database primario
- `Redis 7` per cache, code e rate limiting
- `MinIO` come object storage privato compatibile S3
- `Worker` separato per code e job asincroni

## Zone di rete

- `edge_net`
  - Esposta verso Internet
  - Ospita solo `safeline` e `nginx`
- `app_net`
  - Ospita `nginx`, `frontend`, `app`, `worker`
  - Nessuna persistenza sensibile
- `data_net`
  - Ospita `app`, `worker`, `postgres`, `redis`, `minio`
  - Marcata `internal: true`
  - Mai esposta direttamente all'esterno

## Principi di sicurezza

- deny-by-default per route e permessi
- autenticazione obbligatoria per tutte le risorse protette
- MFA obbligatoria per ruoli sensibili
- allegati fuori dal filesystem pubblico
- audit log obbligatorio per letture e modifiche sensibili
- bucket MinIO privati con accesso tramite URL firmate
- database e Redis non pubblicati su porte host
- dati reali vietati in ambiente di sviluppo

## Servizi del compose

### `safeline`

- unico punto di ingresso pubblico
- applica regole WAF, anti-scan e protezioni perimetrali

### `nginx`

- reverse proxy verso frontend e backend
- applica header HTTP di sicurezza
- separa `/` da `/api/`

### `frontend`

- placeholder per bootstrap React/Vite
- in sviluppo potrà esporre Vite solo internamente a `nginx`

### `app`

- placeholder Laravel/PHP-FPM
- connesso sia a `app_net` sia a `data_net`
- legge configurazione DB/Redis/S3 via environment

### `worker`

- esegue code, export, notifiche, audit asincrono
- non esposto pubblicamente

### `postgres`

- database principale
- persistenza su volume dedicato

### `redis`

- cache, queue, throttling, eventuale blacklist token

### `minio`

- object storage privato
- bucket inizializzato tramite container `mc`

## Scelte intenzionali

- `PostgreSQL` scelto al posto di MariaDB per maggiore robustezza su vincoli, auditing e query evolute
- `MinIO` locale per evitare dipendenze premature da storage remoto
- `Docker Compose` per dev e staging iniziale, senza impedire futuro passaggio a orchestrazione diversa
- placeholder applicativi usati ora per fissare la topologia prima del bootstrap del codice

## Limiti attuali della bozza

- non include ancora Dockerfile custom per frontend e backend
- non include gestione TLS reale
- non include secret management centralizzato
- non include backup scheduler e monitoraggio
- `SafeLine` va verificato rispetto alla modalità di installazione supportata nel tuo ambiente

## Passi successivi

1. creare struttura repository `frontend/`, `backend/`, `infra/`, `docs/`
2. scaffold Laravel 11 e React/Vite
3. aggiungere Dockerfile dedicati
4. definire `.env.example` separati per ambiente
5. implementare auth, MFA, ruoli, strutture e audit log
