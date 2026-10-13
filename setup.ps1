$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "`nFoodSense AI setup" -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js is required. Install Node.js 22 LTS, then reopen PowerShell." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm was not found. Reinstall Node.js with npm." }
Write-Host "Node: $(node --version); npm: $(npm --version)"
foreach ($dir in @("backend", "frontend")) {
  $path = Join-Path $Root $dir
  Write-Host "`nInstalling $dir dependencies..." -ForegroundColor Yellow
  Push-Location $path
  try { npm ci; if ($LASTEXITCODE -ne 0) { throw "npm ci failed in $dir (exit $LASTEXITCODE)" } }
  finally { Pop-Location }
}
if (Get-Command py -ErrorAction SilentlyContinue) {
  $py = Join-Path $Root "ai\.venv"
  if (-not (Test-Path $py)) { py -3.11 -m venv $py; if ($LASTEXITCODE -ne 0) { Write-Warning "Python 3.11 venv could not be created. Install Python 3.11/3.12 and create ai\.venv manually." } }
  $pip = Join-Path $py "Scripts\python.exe"
  if (Test-Path $pip) {
    & $pip -m pip install --upgrade pip
    if ($LASTEXITCODE -ne 0) { throw "pip upgrade failed" }
    & $pip -m pip install -r (Join-Path $Root "ai\requirements.txt")
    if ($LASTEXITCODE -ne 0) { Write-Warning "AI dependency installation failed; web/API setup can still be used. See ai/requirements.txt." }
  }
} else { Write-Warning "Python launcher 'py' not found; skipping AI environment setup." }
foreach ($pair in @(@("backend\.env.example","backend\.env"), @("frontend\.env.example","frontend\.env"), @("ai\.env.example","ai\.env"))) {
  $source = Join-Path $Root $pair[0]; $target = Join-Path $Root $pair[1]
  if ((Test-Path $source) -and -not (Test-Path $target)) { Copy-Item $source $target; Write-Host "Created $($pair[1]) from example; review values before running." }
}
Write-Host "`nSetup step finished. Configure backend\.env before starting the API." -ForegroundColor Green
