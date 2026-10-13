$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Checking backend syntax..." -ForegroundColor Cyan
Get-ChildItem (Join-Path $Root "backend") -Recurse -Filter *.js | ForEach-Object {
  node --check $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Backend syntax error: $($_.FullName)" }
}
Write-Host "Building frontend..." -ForegroundColor Cyan
Push-Location (Join-Path $Root "frontend")
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Frontend build failed (exit $LASTEXITCODE)" }
} finally { Pop-Location }
Write-Host "Build checks passed." -ForegroundColor Green
