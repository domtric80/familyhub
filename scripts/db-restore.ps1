param(
  [string]$ProjectRoot = "C:\Projects\FamilyHUB",
  [string]$BackupDir = "C:\Projects\FamilyHUB\backups\db",
  [string]$BackupFile
)

$ErrorActionPreference = "Stop"

$composeFile = Join-Path $ProjectRoot "docker-compose.yml"
$latestPointer = Join-Path $BackupDir "latest.json"

if ([string]::IsNullOrWhiteSpace($BackupFile)) {
  if (!(Test-Path $latestPointer)) {
    throw "Nessun latest.json trovato in $BackupDir"
  }

  $latest = Get-Content $latestPointer -Raw | ConvertFrom-Json
  $BackupFile = $latest.backup_file
}

if (!(Test-Path $BackupFile)) {
  throw "Backup file non trovato: $BackupFile"
}

Write-Host "[FamilyHub] Ripristino database da backup: $BackupFile"

@'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO familyhub;
GRANT ALL ON SCHEMA public TO public;
'@ | docker compose -f $composeFile exec -T postgres psql -U familyhub -d familyhub | Out-Null

Get-Content $BackupFile | docker compose -f $composeFile exec -T postgres `
  psql -U familyhub -d familyhub | Out-Null

Write-Host "[FamilyHub] Ripristino completato."
