$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "        FOODSENSE AI - BACKEND FINALIZER" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# ====================================================
# 1. CHECK PROJECT
# ====================================================

Write-Host "[1/8] Checking backend project..." -ForegroundColor Yellow

if (!(Test-Path "server.js")) {
    throw "server.js not found. Run this script from the backend folder."
}

if (!(Test-Path "package.json")) {
    throw "package.json not found."
}

Write-Host "Backend project found." -ForegroundColor Green
Write-Host ""

# ====================================================
# 2. INSTALL DEPENDENCIES
# ====================================================

Write-Host "[2/8] Installing dependencies..." -ForegroundColor Yellow

npm install

if ($LASTEXITCODE -ne 0) {
    throw "npm install failed."
}

Write-Host "Dependencies installed successfully." -ForegroundColor Green
Write-Host ""

# ====================================================
# 3. TEST MONGODB
# ====================================================

Write-Host "[3/8] Testing MongoDB..." -ForegroundColor Yellow

$mongoService = Get-Service MongoDB -ErrorAction SilentlyContinue

if ($null -eq $mongoService) {
    throw "MongoDB Windows service not found."
}

if ($mongoService.Status -ne "Running") {
    throw "MongoDB is not running."
}

Write-Host "MongoDB service: RUNNING" -ForegroundColor Green

$mongosh = Get-Command mongosh -ErrorAction SilentlyContinue

if ($null -ne $mongosh) {

    mongosh "mongodb://127.0.0.1:27017/foodsense_ai" `
        --quiet `
        --eval "db.runCommand({ ping: 1 })"

    if ($LASTEXITCODE -ne 0) {
        throw "MongoDB ping failed."
    }

    Write-Host "MongoDB ping: SUCCESS" -ForegroundColor Green
}

Write-Host ""

# ====================================================
# 4. SEED DATABASE
# ====================================================

Write-Host "[4/8] Seeding FoodSense AI database..." -ForegroundColor Yellow

npm run seed

if ($LASTEXITCODE -ne 0) {
    throw "Database seed failed."
}

Write-Host "Database seed completed." -ForegroundColor Green
Write-Host ""

# ====================================================
# 5. DOWNLOAD DATASETS
# ====================================================

Write-Host "[5/8] Downloading GitHub review datasets..." -ForegroundColor Yellow

if (Test-Path "scripts\download-datasets.ps1") {

    powershell -ExecutionPolicy Bypass `
        -File "scripts\download-datasets.ps1"

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "WARNING: Dataset download returned an error." -ForegroundColor Yellow
        Write-Host "Backend build will continue." -ForegroundColor Yellow
    }
    else {
        Write-Host "GitHub datasets downloaded successfully." -ForegroundColor Green
    }

}
else {
    Write-Host "Dataset download script not found." -ForegroundColor Yellow
}

Write-Host ""

# ====================================================
# 6. NORMALIZE DATASETS
# ====================================================

Write-Host "[6/8] Normalizing review datasets..." -ForegroundColor Yellow

if (Test-Path "scripts\normalize-datasets.js") {

    npm run normalize

    if ($LASTEXITCODE -ne 0) {

        Write-Host ""
        Write-Host "WARNING: Dataset normalization failed." -ForegroundColor Yellow
        Write-Host "This does NOT stop the API server." -ForegroundColor Yellow
        Write-Host "We will fix the dataset parser separately if needed." -ForegroundColor Yellow

    }
    else {

        Write-Host "Dataset normalization completed." -ForegroundColor Green

    }

}
else {
    Write-Host "Normalization script not found." -ForegroundColor Yellow
}

Write-Host ""

# ====================================================
# 7. START BACKEND SERVER
# ====================================================

Write-Host "[7/8] Starting FoodSense AI API server..." -ForegroundColor Yellow

# Check whether port 5000 is already being used
$portCheck = Get-NetTCPConnection `
    -LocalPort 5000 `
    -State Listen `
    -ErrorAction SilentlyContinue

if ($null -eq $portCheck) {

    Write-Host "Starting server on port 5000..." -ForegroundColor Cyan

    Start-Process powershell `
        -ArgumentList "-NoProfile -Command `"Set-Location '$PWD'; npm start`"" `
        -WindowStyle Normal

    Start-Sleep -Seconds 5

}
else {

    Write-Host "Port 5000 is already in use." -ForegroundColor Yellow
    Write-Host "Assuming FoodSense backend is already running." -ForegroundColor Yellow

}

Write-Host ""

# ====================================================
# 8. API TESTS
# ====================================================

Write-Host "[8/8] Testing FoodSense AI API..." -ForegroundColor Yellow

$healthUrl = "http://localhost:5000/api/health"

$healthSuccess = $false

for ($i = 1; $i -le 10; $i++) {

    try {

        $health = Invoke-RestMethod `
            -Uri $healthUrl `
            -Method Get `
            -TimeoutSec 5

        $healthSuccess = $true
        break

    }
    catch {

        Write-Host "Waiting for server... attempt $i/10" -ForegroundColor DarkYellow
        Start-Sleep -Seconds 2

    }
}

if (!$healthSuccess) {

    Write-Host ""
    Write-Host "API health check FAILED." -ForegroundColor Red
    Write-Host "Check the server window for the actual error." -ForegroundColor Red
    exit 1

}

Write-Host "Health API: SUCCESS" -ForegroundColor Green

Write-Host ""
Write-Host "Testing Foods API..." -ForegroundColor Yellow

try {

    $foods = Invoke-RestMethod `
        -Uri "http://localhost:5000/api/foods" `
        -Method Get `
        -TimeoutSec 10

    Write-Host "Foods API: SUCCESS" -ForegroundColor Green

}
catch {

    Write-Host "Foods API returned an error." -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Yellow

}

# ====================================================
# FINAL REPORT
# ====================================================

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "          BACKEND BUILD COMPLETED" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Project" -ForegroundColor Cyan
Write-Host "FoodSense AI - Food Ordering & Review Analyzer"
Write-Host ""

Write-Host "Backend URL" -ForegroundColor Cyan
Write-Host "http://localhost:5000"
Write-Host ""

Write-Host "Health API" -ForegroundColor Cyan
Write-Host "http://localhost:5000/api/health"
Write-Host ""

Write-Host "Foods API" -ForegroundColor Cyan
Write-Host "http://localhost:5000/api/foods"
Write-Host ""

Write-Host "MongoDB" -ForegroundColor Cyan
Write-Host "mongodb://127.0.0.1:27017/foodsense_ai"
Write-Host ""

Write-Host "Manager Account" -ForegroundColor Cyan
Write-Host "Email    : manager@foodsense.ai"
Write-Host "Password : Manager@123"
Write-Host ""

Write-Host "====================================================" -ForegroundColor Green
Write-Host " NEXT: CONNECT REACT FRONTEND TO THIS API" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""