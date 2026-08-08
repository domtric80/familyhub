param(
  [string]$ProjectRoot = "C:\Projects\FamilyHUB"
)

$ErrorActionPreference = "Stop"

$composeFile = Join-Path $ProjectRoot "docker-compose.yml"

$sql = @"
SELECT json_build_object(
  'users', (SELECT COUNT(*) FROM users),
  'minors', (SELECT COUNT(*) FROM minors),
  'staff_members', (SELECT COUNT(*) FROM staff_members),
  'facilities', (SELECT COUNT(*) FROM facilities),
  'organizations', (SELECT COUNT(*) FROM organizations)
);
"@

$result = $sql | docker compose -f $composeFile exec -T postgres `
  psql -U familyhub -d familyhub -t -A

($result | Out-String).Trim()
