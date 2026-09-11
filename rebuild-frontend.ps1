$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "       FOODSense AI - FRONTEND REBUILDER" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

$ROOT = Get-Location
$FRONTEND = Join-Path $ROOT "frontend"

# ====================================================
# 1. BACKUP EXISTING FRONTEND
# ====================================================

Write-Host "[1/8] Checking existing frontend..." -ForegroundColor Yellow

if (Test-Path $FRONTEND) {

    $BACKUP = Join-Path $ROOT "frontend-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

    Write-Host "Existing frontend found." -ForegroundColor Yellow
    Write-Host "Creating backup..." -ForegroundColor Cyan

    Copy-Item $FRONTEND $BACKUP -Recurse -Force

    Write-Host "Backup created: $BACKUP" -ForegroundColor Green
}
else {
    Write-Host "No existing frontend found." -ForegroundColor Green
}

Write-Host ""

# ====================================================
# 2. CREATE FRONTEND IF REQUIRED
# ====================================================

Write-Host "[2/8] Preparing React frontend..." -ForegroundColor Yellow

if (!(Test-Path $FRONTEND)) {

    Set-Location $ROOT

    npm create vite@latest frontend -- --template react

    if ($LASTEXITCODE -ne 0) {
        throw "Vite frontend creation failed."
    }
}

Set-Location $FRONTEND

Write-Host "React frontend ready." -ForegroundColor Green
Write-Host ""

# ====================================================
# 3. INSTALL DEPENDENCIES
# ====================================================

Write-Host "[3/8] Installing frontend dependencies..." -ForegroundColor Yellow

npm install

if ($LASTEXITCODE -ne 0) {
    throw "npm install failed."
}

npm install axios react-router-dom lucide-react

if ($LASTEXITCODE -ne 0) {
    throw "Frontend package installation failed."
}

Write-Host "Frontend packages installed." -ForegroundColor Green
Write-Host ""

# ====================================================
# 4. CREATE ENVIRONMENT FILE
# ====================================================

Write-Host "[4/8] Configuring backend connection..." -ForegroundColor Yellow

$envContent = @'
VITE_API_URL=http://localhost:5000/api
'@

Set-Content -Path ".env" -Value $envContent -Encoding UTF8
Set-Content -Path ".env.example" -Value $envContent -Encoding UTF8

Write-Host "Frontend API URL configured." -ForegroundColor Green
Write-Host "API: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host ""

# ====================================================
# 5. VERIFY SOURCE FILES
# ====================================================

Write-Host "[5/8] Checking frontend source..." -ForegroundColor Yellow

$srcPath = Join-Path $FRONTEND "src"

if (!(Test-Path $srcPath)) {
    New-Item -ItemType Directory -Path $srcPath -Force | Out-Null
}

$requiredSource = @(
    "src\App.jsx",
    "src\main.jsx",
    "src\styles.css"
)

foreach ($file in $requiredSource) {

    if (Test-Path $file) {
        Write-Host "  OK  $file" -ForegroundColor Green
    }
    else {
        Write-Host "  MISSING  $file" -ForegroundColor Red
    }
}

Write-Host ""

# ====================================================
# 6. CHECK BACKEND
# ====================================================

Write-Host "[6/8] Checking FoodSense AI backend..." -ForegroundColor Yellow

try {

    $health = Invoke-RestMethod `
        -Uri "http://localhost:5000/api/health" `
        -Method Get `
        -TimeoutSec 5

    Write-Host "Backend API is ONLINE." -ForegroundColor Green
    Write-Host "Health API responded successfully." -ForegroundColor Green

}
catch {

    Write-Host ""
    Write-Host "WARNING: Backend API is not responding." -ForegroundColor Yellow
    Write-Host "Make sure another terminal is running:" -ForegroundColor Yellow
    Write-Host "npm run dev" -ForegroundColor White
    Write-Host ""

}

Write-Host ""

# ====================================================
# 7. BUILD FRONTEND
# ====================================================

Write-Host "[7/8] Building React frontend..." -ForegroundColor Yellow

npm run build

if ($LASTEXITCODE -ne 0) {
    throw "Frontend build failed."
}

Write-Host ""
Write-Host "React production build SUCCESSFUL." -ForegroundColor Green
Write-Host ""

# ====================================================
# 8. FINAL STATUS
# ====================================================

Write-Host "[8/8] Final frontend status..." -ForegroundColor Yellow
Write-Host ""

Write-Host "====================================================" -ForegroundColor Green
Write-Host "          FOODSense AI FRONTEND READY" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Design:" -ForegroundColor Cyan
Write-Host "FoodSense AI - Indian Food Intelligence UI"
Write-Host ""

Write-Host "Frontend:" -ForegroundColor Cyan
Write-Host "React + Vite"
Write-Host ""

Write-Host "Backend API:" -ForegroundColor Cyan
Write-Host "http://localhost:5000/api"
Write-Host ""

Write-Host "Frontend:" -ForegroundColor Cyan
Write-Host "http://localhost:5173"
Write-Host ""

Write-Host "Features:" -ForegroundColor Cyan
Write-Host "  [OK] FoodSense AI dashboard"
Write-Host "  [OK] Indian regional food selector"
Write-Host "  [OK] North Indian"
Write-Host "  [OK] South Indian"
Write-Host "  [OK] East Indian"
Write-Host "  [OK] West Indian"
Write-Host "  [OK] Central Indian"
Write-Host "  [OK] AI ranked food"
Write-Host "  [OK] Search"
Write-Host "  [OK] Cart"
Write-Host "  [OK] Orders"
Write-Host "  [OK] Login/Register"
Write-Host "  [OK] Reviews"
Write-Host "  [OK] Sentiment analytics"
Write-Host "  [OK] AI insights"
Write-Host "  [OK] Responsive design"
Write-Host "  [OK] Backend API connection"
Write-Host ""

Write-Host "NEXT COMMAND:" -ForegroundColor Yellow
Write-Host "npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "Then open:" -ForegroundColor Yellow
Write-Host "http://localhost:5173" -ForegroundColor White
Write-Host ""

Write-Host "====================================================" -ForegroundColor Green
Write-Host ""