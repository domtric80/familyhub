# UAT — correzione health servizi e runtime Docker

## Problemi rilevati

Durante il gate UAT della release `1.5.0` la pagina Health Servizi mostrava tre falsi o reali degradamenti:

1. Redis risultava degradato nonostante rispondesse correttamente.
2. Il worker risultava degradato quando era attivo ma non elaborava job.
3. Lo scheduler locale non era definito nel Compose.

ClamAV risultava inoltre non configurato nonostante il relativo container fosse attivo.

## Cause

- PhpRedis restituisce `true` al comando `PING`, mentre il controllo accettava solo la stringa `PONG`.
- L'heartbeat worker veniva scritto esclusivamente prima dell'elaborazione di un job.
- `docker-compose.yml` non dichiarava il servizio `scheduler`.
- Il check ClamAV leggeva `env()` a runtime, che non è affidabile con la configurazione Laravel in cache.

## Correzioni

- normalizzazione della risposta Redis;
- heartbeat worker registrato anche sull'evento di polling `Queue::looping`;
- servizio `scheduler` aggiunto allo stack locale;
- script scheduler condiviso tra locale e produzione;
- lettura della configurazione ClamAV tramite `config('document_security.scan.*')`;
- avvio del server PHP senza il wrapper `artisan serve`, così tutte le variabili Docker restano disponibili al processo HTTP;
- rimozione di migrazioni, bootstrap e reset admin dal processo worker;
- reset automatico admin disabilitato per default.

## Criteri UAT

- Redis, worker, scheduler e ClamAV risultano `ok` con tutti i container attivi.
- Un worker senza job continua a mantenere un heartbeat recente.
- Il riavvio di app, worker e scheduler non cambia password, MFA o dati applicativi.
- Il Compose locale e quello di produzione superano `docker compose config --quiet`.

## Guardrail credenziali e dati

- `FAMILYHUB_ENSURE_LOCAL_ADMIN_PASSWORD` è `false` per default.
- Il reset admin resta esclusivamente un comando manuale di recupero autorizzato.
- Worker e scheduler non eseguono migrazioni, seed o bootstrap.
- Nessun volume e nessuna tabella vengono eliminati durante l'applicazione del fix.
