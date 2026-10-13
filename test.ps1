$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$failed = $false
Write-Host "`nChecking backend JavaScript syntax..." -ForegroundColor Cyan
Get-ChildItem (Join-Path $Root "backend") -Recurse -Filter *.js | ForEach-Object {
  node --check $_.FullName
  if ($LASTEXITCODE -ne 0) { Write-Error "Syntax check failed: $($_.FullName)"; $failed = $true }
}
Write-Host "`nRunning backend integration smoke test (requires API already running and configured)..." -ForegroundColor Cyan
Push-Location (Join-Path $Root "backend")
try {
  if (Test-Path "scripts/full-test.js") {
    node scripts/full-test.js
    if ($LASTEXITCODE -ne 0) { Write-Warning "Integration test failed; ensure MongoDB is connected and API is running."; $failed = $true }
  }
} finally { Pop-Location }
if ($failed) { exit 1 }
Write-Host "Checks completed." -ForegroundColor Green
