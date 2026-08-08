# FamilyHub — Guida deploy produzione e hardening

## Obiettivo

Questa guida descrive il profilo minimo consigliato per pubblicare FamilyHub in produzione su VPS Linux, con attenzione a:

- segregazione dei servizi
- protezione dei segreti
- esposizione minima della superficie pubblica
- logging, backup e ripristino
- aggiornabilità senza interrompere il servizio

## Profilo infrastrutturale consigliato

Per un primo ambiente di produzione:

- VPS Debian 12
- 4 vCPU
- 8 GB RAM
- 120 GB SSD/NVMe
- IP pubblico statico
- snapshot provider attivi

Se il carico cresce, separare almeno:

- database PostgreSQL
- object storage MinIO/S3
- reverse proxy / WAF

## Topologia consigliata

```text
Internet
  |
WAF / Reverse Proxy
  |
Nginx
  |-- Frontend statico React
  \-- API Laravel (PHP-FPM)
         |-- Redis
         |-- PostgreSQL
         \-- Storage S3/MinIO
```

## Hardening di base sistema operativo

### Utenti e accesso SSH

- creare un utente amministrativo dedicato, non usare `root` per lavoro ordinario
- disabilitare login SSH diretto di `root`
- usare solo autenticazione con chiave pubblica
- cambiare eventualmente la porta SSH solo come misura secondaria, non primaria
- attivare `fail2ban` o equivalente

Esempio `/etc/ssh/sshd_config`:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 3
AllowUsers deploy familyhub-admin
```

Riavvio:

```bash
sudo systemctl reload ssh
```

### Aggiornamenti e pacchetti

- attivare aggiornamenti di sicurezza automatici
- installare solo pacchetti necessari
- rimuovere servizi non usati

```bash
sudo apt update
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### Firewall

Esporre solo:

- `22/tcp` SSH
- `80/tcp` HTTP
- `443/tcp` HTTPS

Bloccare verso Internet pubblico:

- PostgreSQL `5432`
- Redis `6379`
- MinIO `9000/9001`

Esempio `ufw`:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Hardening applicativo

### Variabili ambiente e segreti

Non salvare segreti nel repository.

Gestire separatamente:

- `APP_KEY`
- credenziali database
- credenziali Redis se abilitate
- credenziali SMTP
- chiavi S3 / MinIO
- eventuali token esterni

Requisiti:

- permessi file `.env` limitati
- owner corretto (`www-data` o utente deploy secondo setup)
- backup cifrati dei segreti

Esempio:

```bash
sudo chown www-data:www-data /var/www/familyhub/backend/.env
sudo chmod 640 /var/www/familyhub/backend/.env
```

### Laravel

Impostazioni minime produzione in `backend/.env`:

```text
APP_ENV=production
APP_DEBUG=false
APP_URL=https://example.com
LOG_CHANNEL=stack
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
```

Dopo ogni deploy:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Sessioni e autenticazione

- cookie solo `Secure` in HTTPS
- MFA obbligatoria per ruoli amministrativi
- timeout inattività coerente con la policy del progetto
- logging dei login falliti e dei reset MFA

### Storage documentale

Per dati sensibili:

- non esporre bucket come pubblici
- usare accesso applicativo firmato o mediato dal backend
- separare area quarantena da area file rilasciati
- mantenere antivirus/scansione attivi nel flusso upload

## Reverse proxy e WAF

### Raccomandazione

Per il primo rilascio:

- Nginx come reverse proxy applicativo
- WAF dedicato davanti, ad esempio SafeLine se è il prodotto scelto dal progetto

Nginx non deve esporre header inutili:

```nginx
server_tokens off;
proxy_hide_header X-Powered-By;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

Abilitare rate limiting almeno su:

- login
- MFA verify
- upload documenti
- endpoint sensibili admin

## TLS

- usare solo HTTPS
- redirect permanente da HTTP a HTTPS
- certificati Let’s Encrypt o equivalenti
- disabilitare protocolli legacy

Indicazioni minime:

- TLS 1.2+
- preferenza TLS 1.3 se supportata
- HSTS solo dopo verifica completa del dominio

## Database PostgreSQL

### Hardening

- bind su `127.0.0.1` o rete privata
- utente applicativo dedicato, non superuser
- password lunga e casuale
- backup automatici giornalieri
- retention minima 7–14 giorni

Controllare:

- `listen_addresses`
- `pg_hba.conf`
- accesso solo dal nodo applicativo

### Backup

Esempio:

```bash
pg_dump -Fc -U familyhub_user -d familyhub > /secure-backup/familyhub_$(date +%F).dump
```

Requisiti:

- backup cifrati a riposo
- copia off-site
- test periodico di restore

## Redis

- non esporre Redis pubblicamente
- bind locale o rete privata
- password se non completamente isolato
- disabilitare modalità insicure e accessi remoti non necessari

## Queue worker e scheduler

- usare Supervisor o systemd
- restart automatico in caso di crash
- log separati
- limiti di memoria e tempo coerenti

Verificare periodicamente:

- code bloccate
- job falliti
- saturazione worker

## Logging e audit

Dato che FamilyHub tratta dati sensibili:

- conservare audit log separati da semplici log applicativi
- proteggere i log da modifica non autorizzata
- centralizzare se possibile
- ruotare i log
- monitorare:
  - login falliti
  - accessi documentali
  - modifiche RBAC
  - errori upload/scansione documenti

## Backup e disaster recovery

Minimo richiesto:

- backup database giornaliero
- backup configurazioni `.env`, Nginx, Supervisor
- backup storage documentale
- restore testato

Checklist restore:

1. ripristino VM o VPS
2. ripristino repository / build
3. ripristino `.env`
4. ripristino database
5. ripristino storage documentale
6. validazione login, upload, preview, audit

## Monitoraggio

Almeno questi controlli:

- uptime HTTP/HTTPS
- stato PHP-FPM
- stato queue worker
- spazio disco
- RAM
- CPU
- latenza DB
- errori `5xx`

## Checklist pre-go-live

- DNS configurato
- HTTPS attivo
- firewall applicato
- root login SSH disabilitato
- MFA verificata su ruoli amministrativi
- `.env` protetto e fuori dal repository
- `APP_DEBUG=false`
- bucket/storage non pubblici
- backup configurati e testati
- restore testato almeno una volta
- WAF attivo e verificato
- health check applicativo verificato
- audit log verificato
- policy sessione verificata

## Checklist post-go-live

- controllo errori applicativi 24h
- controllo saturazione RAM/CPU
- controllo job queue
- controllo upload documenti
- controllo invio mail
- controllo audit login e accessi documentali

## Nota operativa

Per FamilyHub è preferibile una strategia di deploy conservativa:

- snapshot VPS prima di modifiche strutturali
- backup DB prima di migrazioni
- deploy in finestra controllata
- rollback documentato
