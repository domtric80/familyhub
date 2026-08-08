# FamilyHub · Procedura guard-rail database

Data: 2026-06-28
Stato: attiva

## Obiettivo

Impedire che un ciclo tecnico cancelli o azzeri inavvertitamente:

- utenti
- minori
- strutture
- organizzazioni

## Script ufficiali

- `C:\Projects\FamilyHUB\scripts\db-backup.ps1`
- `C:\Projects\FamilyHUB\scripts\db-guard.ps1`
- `C:\Projects\FamilyHUB\scripts\db-restore.ps1`
- `C:\Projects\FamilyHUB\scripts\safe-cycle.ps1`

## Regola operativa

Non eseguire più direttamente comandi rischiosi sul progetto.

Usare sempre:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Projects\FamilyHUB\scripts\safe-cycle.ps1 -Command "<comando>"
```

## Cosa fa il guard-rail

### Prima del comando

- crea un backup SQL
- aggiorna `latest.json`
- legge snapshot logico del DB

### Dopo il comando

- rilegge snapshot logico del DB
- confronta i conteggi chiave
- se trova un azzeramento inatteso, esegue restore automatico

## Dati sentinella monitorati

- `users`
- `minors`
- `staff_members`
- `facilities`
- `organizations`

## Esempio di uso

Migrazione:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Projects\FamilyHUB\scripts\safe-cycle.ps1 -Command "docker compose -f C:\Projects\FamilyHUB\docker-compose.yml exec -T app php artisan migrate --force"
```

Restart servizi:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Projects\FamilyHUB\scripts\safe-cycle.ps1 -Command "docker compose -f C:\Projects\FamilyHUB\docker-compose.yml restart app worker nginx"
```

## Uso del restore manuale

Restore ultimo backup:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Projects\FamilyHUB\scripts\db-restore.ps1
```

Restore file specifico:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Projects\FamilyHUB\scripts\db-restore.ps1 -BackupFile "C:\Projects\FamilyHUB\backups\db\familyhub-YYYYMMDD-HHMMSS.sql"
```

## Nota importante

Il guard-rail riduce molto il rischio, ma non sostituisce la disciplina:

- niente `migrate:fresh`
- niente `db:wipe`
- niente reset volumi Postgres
- niente bootstrap distruttivi sul DB condiviso
