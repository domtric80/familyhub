param(
  [string]$ProjectRoot = "C:\Projects\FamilyHUB",
  [string]$BackupDir = "C:\Projects\FamilyHUB\backups\db",
  [switch]$WriteLatestPointer
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $BackupDir "familyhub-$timestamp.sql"

docker compose -f (Join-Path $ProjectRoot "docker-compose.yml") exec -T postgres `
  pg_dump -U familyhub -d familyhub --no-owner --no-privileges |
  Set-Content -Path $backupFile

if ($WriteLatestPointer) {
  $meta = [ordered]@{
    created_at = (Get-Date).ToString("s")
    backup_file = $backupFile
  } | ConvertTo-Json

  Set-Content -Path (Join-Path $BackupDir "latest.json") -Value $meta
}

Write-Host "Backup creato: $backupFile"
