# FamilyHub — Checklist primo accesso VPS OVH/Aruba

Data: 2026-08-08

## Obiettivo
Questa checklist serve per il primo accesso a una VPS nuova OVH o Aruba prima ancora del deploy applicativo.

Va eseguita nell'ordine indicato, così il server parte subito con un livello minimo corretto di sicurezza e ordine operativo.

## Dati che devi avere prima di iniziare
- IP pubblico della VPS
- utente iniziale fornito dal provider (`root` o utente admin equivalente)
- password iniziale temporanea oppure chiave SSH già associata
- dominio che userai per FamilyHub
- tua chiave pubblica SSH locale

## Step 0 — Conservazione credenziali provider
Appena la VPS viene creata:
- salvare pannello provider, IP, credenziali iniziali, data creazione
- verificare se il provider ha snapshot automatici attivi
- verificare se ci sono regole firewall cloud lato provider
- annotare sistema operativo installato (`Debian 12`)

## Step 1 — Primo accesso SSH
Dal tuo PC:
```bash
ssh root@IP_DELLA_VPS
```
oppure, se il provider usa un utente diverso:
```bash
ssh NOME_UTENTE@IP_DELLA_VPS
```

Se il login avviene con password, cambiarla il prima possibile.

## Step 2 — Aggiornamento immediato sistema
```bash
apt update && apt upgrade -y
reboot
```

Rientrare via SSH dopo il riavvio.

## Step 3 — Creare utente amministrativo dedicato
Esempio:
```bash
adduser familyhub-admin
usermod -aG sudo familyhub-admin
```

## Step 4 — Installare la tua chiave pubblica SSH
Sul server, per l'utente nuovo:
```bash
mkdir -p /home/familyhub-admin/.ssh
nano /home/familyhub-admin/.ssh/authorized_keys
```

Incollare la chiave pubblica, poi:
```bash
chown -R familyhub-admin:familyhub-admin /home/familyhub-admin/.ssh
chmod 700 /home/familyhub-admin/.ssh
chmod 600 /home/familyhub-admin/.ssh/authorized_keys
```

## Step 5 — Verificare accesso col nuovo utente
Dal tuo PC:
```bash
ssh familyhub-admin@IP_DELLA_VPS
```

Non proseguire finché questo accesso non funziona.

## Step 6 — Disabilitare accessi deboli SSH
Modificare:
```bash
nano /etc/ssh/sshd_config
```

Impostazioni minime consigliate:
```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 3
```

Applicare:
```bash
systemctl reload ssh
```

Importante: tenere aperta la sessione corrente finché non hai verificato che il nuovo accesso SSH funziona davvero.

## Step 7 — Installare utility base
```bash
apt install -y ca-certificates curl gnupg git ufw fail2ban htop unzip
```

## Step 8 — Attivare firewall VPS
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status verbose
```

Se cambi porta SSH, aprire prima la nuova porta e solo dopo chiudere la precedente.

## Step 9 — Verificare firewall provider
### OVH
Controllare nel pannello:
- IP pubblico corretto
- eventuale firewall network attivo
- regole aperte solo per `22`, `80`, `443`

### Aruba
Controllare nel pannello:
- gruppo sicurezza o regole rete
- porte effettivamente esposte
- eventuali regole NAT o accesso console emergenza

## Step 10 — Impostare hostname server
Esempio staging:
```bash
hostnamectl set-hostname familyhub-staging
```

Esempio produzione:
```bash
hostnamectl set-hostname familyhub-prod
```

## Step 11 — Verificare DNS base
Dal server:
```bash
hostname
ping -c 2 1.1.1.1
ping -c 2 github.com
```

Dal tuo PC, quando punti il dominio:
```bash
nslookup app.familyhub.example
```

## Step 12 — Preparare directory applicativa
Con utente admin:
```bash
mkdir -p /opt/familyhub
chown -R familyhub-admin:familyhub-admin /opt/familyhub
```

## Step 13 — Installare Docker
Seguire la guida:
- `docs/operations/2026-08-08-debian-docker-new-environment-checklist.md`

## Step 14 — Preparare repository GitHub privato
Se usi HTTPS con credenziali/token:
- verificare accesso GitHub

Se usi chiave SSH dedicata deploy:
```bash
ssh-keygen -t ed25519 -C "familyhub-vps"
cat ~/.ssh/id_ed25519.pub
```

Poi aggiungere la chiave deploy su GitHub e testare:
```bash
ssh -T git@github.com
```

## Step 15 — Copiare template environment
Sul server:
```bash
cd /opt/familyhub
cp infra/env/backend.prod.env.template .env.prod
chmod 600 .env.prod
```

Poi compilare il file con i valori reali.

## Step 16 — Snapshot prima del deploy
Prima del primo deploy vero:
- creare snapshot provider
- annotare che è la baseline pulita post-hardening

## Step 17 — Checklist fine bootstrap VPS
- [ ] accesso SSH con utente dedicato funzionante
- [ ] login root disabilitato
- [ ] login password disabilitato
- [ ] firewall VPS attivo
- [ ] firewall provider verificato
- [ ] server aggiornato
- [ ] hostname impostato
- [ ] Docker installato
- [ ] accesso GitHub pronto
- [ ] directory `/opt/familyhub` pronta
- [ ] snapshot baseline eseguito

## Errori da evitare
- fare deploy restando utente `root`
- lasciare `PasswordAuthentication yes`
- aprire pubblicamente `5432`, `6379`, `9000`, `9001`
- usare la stessa password tra staging e produzione
- rigenerare `APP_KEY` a server già operativo
- dimenticare snapshot/backup prima delle migrazioni

## Passo successivo
Dopo questa checklist si passa a:
- `docs/operations/2026-08-08-debian-docker-new-environment-checklist.md`
