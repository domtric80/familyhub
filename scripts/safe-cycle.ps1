param(
  [Parameter(Mandatory = $true)]
  [string]$Command,
  [string]$ProjectRoot = "C:\Projects\FamilyHUB",
  [switch]$AllowEmptyAfter
)

$ErrorActionPreference = "Stop"

function Get-DbSnapshot {
  param([string]$Root)

  $raw = powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\db-guard.ps1") -ProjectRoot $Root
  return ($raw | ConvertFrom-Json)
}

function Test-UnsafeDataLoss {
  param(
    [psobject]$Before,
    [psobject]$After
  )

  $criticalSets = @('users', 'facilities', 'organizations')

  foreach ($set in $criticalSets) {
    $beforeValue = [int]$Before.$set
    $afterValue = [int]$After.$set

    if ($beforeValue -gt 0 -and $afterValue -eq 0) {
      return $true
    }
  }

  if ([int]$Before.minors -gt 0 -and [int]$After.minors -eq 0) {
    return $true
  }

  return $false
}

Write-Host "[FamilyHub] Backup obbligatorio pre-ciclo in esecuzione..."
powershell -ExecutionPolicy Bypass -File (Join-Path $ProjectRoot "scripts\db-backup.ps1") -ProjectRoot $ProjectRoot -WriteLatestPointer

Write-Host "[FamilyHub] Snapshot DB pre-ciclo..."
$before = Get-DbSnapshot -Root $ProjectRoot
Write-Host ("[FamilyHub] Stato pre-ciclo: " + ($before | ConvertTo-Json -Compress))

Write-Host "[FamilyHub] Esecuzione comando protetto..."
try {
  Invoke-Expression $Command
}
catch {
  Write-Host "[FamilyHub] Comando fallito. Nessun restore automatico: dati lasciati invariati per analisi."
  throw
}

Write-Host "[FamilyHub] Snapshot DB post-ciclo..."
$after = Get-DbSnapshot -Root $ProjectRoot
Write-Host ("[FamilyHub] Stato post-ciclo: " + ($after | ConvertTo-Json -Compress))

if (-not $AllowEmptyAfter -and (Test-UnsafeDataLoss -Before $before -After $after)) {
  Write-Host "[FamilyHub] ATTENZIONE: rilevato azzeramento inatteso di dati critici. Avvio restore automatico..."
  powershell -ExecutionPolicy Bypass -File (Join-Path $ProjectRoot "scripts\db-restore.ps1") -ProjectRoot $ProjectRoot
  throw "Guard-rail DB attivato: restore automatico eseguito dopo azzeramento inatteso."
}

Write-Host "[FamilyHub] Guard-rail DB completato senza perdita dati rilevata."
