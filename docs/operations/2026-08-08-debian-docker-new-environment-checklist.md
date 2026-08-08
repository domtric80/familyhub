# FamilyHub — Checklist deploy su nuovo ambiente Debian/Docker

Data: 2026-08-08

## Obiettivo
Questa guida serve per installare FamilyHub su un ambiente diverso da quello attuale, ad esempio:
- nuova VPS Debian
- server di staging
- server di produzione
- ambiente di test isolato

L'obiettivo è avere un deploy ripetibile, documentato e indipendente dal PC locale di sviluppo.

## Modello raccomandato
Per i nuovi ambienti si raccomanda:
- sistema operativo `Debian 12`
- deploy tramite `Docker` + `docker compose`
- repository Git clonato dal remoto GitHub
- segreti esterni al repository
- HTTPS davanti al container Nginx
- WAF/reverse proxy davanti all'app se esposto su Internet

## Prerequisiti infrastrutturali minimi

### Staging
- 2 vCPU
- 4 GB RAM
- 60 GB SSD/NVMe
- IP pubblico o accesso VPN
- DNS dedicato, ad esempio `staging.familyhub.example`

### Produzione iniziale
- 4 vCPU
- 8 GB RAM
- 100–120 GB SSD/NVMe
- IP pubblico statico
- snapshot/backup provider attivi
- dominio dedicato, ad esempio `app.familyhub.example`

## Cosa serve prima del deploy

### 1. Accessi
- accesso SSH con chiave pubblica
- utente amministrativo non-root
- permessi `sudo`
- accesso al repository GitHub privato

### 2. DNS
Configurare almeno:
- record `A` per dominio applicativo
- eventuale record `A` o `CNAME` per staging

Esempio:
- `app.familyhub.example` -> IP VPS produzione
- `staging.familyhub.example` -> IP VPS staging

### 3. Segreti e parametri per ambiente
Per ogni ambiente servono valori propri, separati:
- `APP_KEY`
- `APP_URL`
- `SANCTUM_STATEFUL_DOMAINS`
- `SESSION_DOMAIN`
- `POSTGRES_*`
- `REDIS_*`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_BUCKET`
- `MAIL_*`
- eventuali `VITE_*`

Importante:
- non riusare automaticamente i segreti di un altro ambiente
- staging e produzione devono avere database diversi
- staging e produzione devono avere bucket/storage separati

## Checklist provisioning server Debian 12

### 1. Aggiornare il server
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Installare pacchetti base
```bash
sudo apt install -y ca-certificates curl gnupg git ufw fail2ban
```

### 3. Hardening SSH minimo
Verificare `/etc/ssh/sshd_config`:
```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
```

Poi:
```bash
sudo systemctl reload ssh
```

### 4. Firewall
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Installazione Docker su Debian 12

### 1. Repository Docker ufficiale
```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
```

### 2. Installazione engine + compose
```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 3. Verifica
```bash
sudo docker version
sudo docker compose version
```

### 4. Utente deploy nel gruppo docker
```bash
sudo usermod -aG docker $USER
newgrp docker
```

## Deploy FamilyHub su nuovo ambiente

### 1. Creare cartella applicativa
```bash
sudo mkdir -p /opt/familyhub
sudo chown -R $USER:$USER /opt/familyhub
cd /opt/familyhub
```

### 2. Clonare il repository
```bash
git clone https://github.com/domtric80/familyhub.git .
```

### 3. Preparare file ambiente produzione
Partire da:
- `infra/env/backend.prod.env.example`

Creare un file ambiente reale sul server, ad esempio:
- `/opt/familyhub/.env.prod`

Esempio:
```bash
cp infra/env/backend.prod.env.example .env.prod
chmod 600 .env.prod
```

Poi valorizzare correttamente:
- dominio reale
- password forti
- `APP_KEY`
- credenziali SMTP
- bucket/storage
- session domain e sanctum domains

### 4. Generare `APP_KEY`
Se manca, generarla temporaneamente con il container backend o con PHP locale.
Approccio consigliato:
```bash
docker run --rm -it -v $(pwd)/backend:/app -w /app php:8.4-cli-alpine sh
```
Poi installare il minimo necessario oppure generarla in altro ambiente già funzionante.

Nota pratica: conviene definire `APP_KEY` una sola volta e conservarla in modo sicuro. Non rigenerarla su un ambiente già in uso.

### 5. Certificati TLS
Prima opzione consigliata:
- WAF / reverse proxy esterno gestisce TLS
- il container `nginx` riceve traffico già filtrato oppure usa comunque certificati host

Se si usa Let's Encrypt direttamente sulla VPS, predisporre:
- `/etc/letsencrypt/live/<nome-certificato>/fullchain.pem`
- `/etc/letsencrypt/live/<nome-certificato>/privkey.pem`

Ricordarsi di aggiornare il placeholder nel file:
- `infra/nginx/familyhub.prod.conf`

### 6. Build immagini
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml build --pull
```

### 7. Inizializzare bucket MinIO
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm mc
```

### 8. Avvio stack
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d postgres redis minio clamav app worker scheduler frontend nginx
```

### 9. Verifiche iniziali
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=100 app
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=100 nginx
```

## Checklist post-deploy tecnico

### Applicazione
- [ ] `/api/health` risponde correttamente
- [ ] login disponibile
- [ ] MFA valida per gli utenti amministrativi
- [ ] preview/upload documenti funzionanti
- [ ] worker coda attivo
- [ ] scheduler attivo
- [ ] audit log popolato

### Sicurezza
- [ ] `APP_DEBUG=false`
- [ ] cookie secure attivi
- [ ] database non esposto pubblicamente
- [ ] redis non esposto pubblicamente
- [ ] minio non esposto pubblicamente
- [ ] WAF/reverse proxy verificato
- [ ] firewall attivo

### Dati
- [ ] bucket documentale creato
- [ ] upload antivirus attivo
- [ ] backup database configurato
- [ ] backup storage configurato
- [ ] restore test pianificato

## Strategia multi-ambiente

### Ambiente locale
Uso:
- sviluppo funzionale
- debug rapido
- test integrazione

Caratteristiche:
- `docker-compose.yml`
- URL locale tipo `http://localhost:8100`
- segreti non riusabili in produzione

### Ambiente staging
Uso:
- test UX
- QA funzionale
- verifica release candidate
- test deploy prima della produzione

Caratteristiche:
- infrastruttura simile alla produzione
- dati anonimi o sintetici
- mail disattivate o deviate
- bucket separato
- DB separato

### Ambiente produzione
Uso:
- utenti reali
- dati reali

Caratteristiche:
- WAF davanti
- backup automatici
- hardening completo
- monitoraggio attivo
- accesso SSH limitato

## Regole obbligatorie tra ambienti
- mai condividere database tra staging e produzione
- mai condividere bucket documentali tra staging e produzione
- mai rigenerare `APP_KEY` su un ambiente con dati già attivi
- ogni ambiente deve avere dominio, segreti e storage propri
- prima di ogni migrazione critica: backup DB e snapshot VPS

## Procedura di aggiornamento su ambiente remoto
```bash
cd /opt/familyhub
git pull
docker compose --env-file .env.prod -f docker-compose.prod.yml build --pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=100 app
```

Se necessario:
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec app php artisan migrate --force
```

## Procedura di rollback minima
1. fermare il deploy corrente se ha introdotto errore critico
2. tornare al commit Git precedente stabile
3. rebuild immagini
4. riavviare stack
5. se necessario, ripristinare DB da backup coerente

## Cosa manca ancora prima di un go-live reale
- parametrizzare definitivamente il dominio TLS reale nel file Nginx production
- decidere posizionamento finale WAF (`SafeLine` o altra soluzione)
- predisporre backup automatici DB + storage
- definire gestione segreti definitiva
- preparare runbook operativo di emergenza

## File di riferimento
- `docker-compose.prod.yml`
- `infra/nginx/familyhub.prod.conf`
- `infra/env/backend.prod.env.example`
- `docs/operations/2026-08-08-runtime-production-files.md`
- `docs/security/2026-08-08-production-deploy-hardening.md`
