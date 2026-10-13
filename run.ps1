param([switch]$IncludeAI)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
foreach ($path in @("backend\.env","frontend\.env")) {
  if (-not (Test-Path (Join-Path $Root $path))) { throw "Missing $path. Run .\setup.ps1 and configure environment files first." }
}
$backend = Join-Path $Root "backend"
$frontend = Join-Path $Root "frontend"
Start-Process powershell -ArgumentList @("-NoExit","-Command","Set-Location '$backend'; npm start")
Start-Process powershell -ArgumentList @("-NoExit","-Command","Set-Location '$frontend'; npm run dev -- --host 127.0.0.1")
if ($IncludeAI) {
  $python = Join-Path $Root "ai\.venv\Scripts\python.exe"
  if (-not (Test-Path $python)) { throw "AI venv not found. Install Python 3.11/3.12 and AI requirements first." }
  $ai = Join-Path $Root "ai"
  Start-Process powershell -ArgumentList @("-NoExit","-Command","Set-Location '$ai'; & '$python' -m uvicorn app:app --host 127.0.0.1 --port 8000")
}
Write-Host "Started service terminals. Frontend: http://localhost:5173 | API: http://localhost:5000/api/health | AI: http://127.0.0.1:8000/health (optional)" -ForegroundColor Green
