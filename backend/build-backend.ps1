$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   FoodSense AI - Backend Builder" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# -------------------------------------------------
# 1. Check Node.js
# -------------------------------------------------

Write-Host "[1/10] Checking Node.js..." -ForegroundColor Yellow

node -v
npm -v

Write-Host "Node.js detected." -ForegroundColor Green
Write-Host ""

# -------------------------------------------------
# 2. Check MongoDB
# -------------------------------------------------

Write-Host "[2/10] Checking MongoDB..." -ForegroundColor Yellow

$mongoService = Get-Service MongoDB -ErrorAction SilentlyContinue

if ($null -eq $mongoService) {
    Write-Host "MongoDB Windows service was not found." -ForegroundColor Red
    Write-Host "Install/start MongoDB before running the backend." -ForegroundColor Red
    exit 1
}

if ($mongoService.Status -eq "Running") {
    Write-Host "MongoDB is already RUNNING." -ForegroundColor Green
}
else {
    Write-Host "MongoDB is not running." -ForegroundColor Red
    Write-Host "Start MongoDB manually as Administrator." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# -------------------------------------------------
# 3. Create package.json
# -------------------------------------------------

Write-Host "[3/10] Repairing package.json..." -ForegroundColor Yellow

$packageJson = @'
{
  "name": "foodsense-ai-backend",
  "version": "1.0.0",
  "description": "FoodSense AI - Food Ordering and Review Analyzer Backend",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "seed": "node scripts/seed.js",
    "datasets": "powershell -ExecutionPolicy Bypass -File scripts/download-datasets.ps1",
    "normalize": "node scripts/normalize-datasets.js"
  },
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "dotenv": "^17.2.2",
    "express": "^5.1.0",
    "express-rate-limit": "^8.1.0",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.18.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.10"
  }
}
'@

Set-Content -Path "package.json" -Value $packageJson -Encoding UTF8

Write-Host "package.json repaired." -ForegroundColor Green
Write-Host ""

# -------------------------------------------------
# 4. Install dependencies
# -------------------------------------------------

Write-Host "[4/10] Installing backend dependencies..." -ForegroundColor Yellow

npm install

Write-Host "Dependencies installed." -ForegroundColor Green
Write-Host ""

# -------------------------------------------------
# 5. Verify important packages
# -------------------------------------------------

Write-Host "[5/10] Verifying packages..." -ForegroundColor Yellow

$packages = @(
    "express",
    "mongoose",
    "cors",
    "dotenv",
    "bcryptjs",
    "jsonwebtoken",
    "helmet",
    "morgan",
    "express-rate-limit"
)

foreach ($package in $packages) {

    if (Test-Path "node_modules\$package") {
        Write-Host "  OK  $package" -ForegroundColor Green
    }
    else {
        Write-Host "  FAIL  $package" -ForegroundColor Red
    }
}

if (Test-Path "node_modules\nodemon") {
    Write-Host "  OK  nodemon" -ForegroundColor Green
}
else {
    Write-Host "  FAIL  nodemon" -ForegroundColor Red
}

Write-Host ""

# -------------------------------------------------
# 6. Create .env if missing
# -------------------------------------------------

Write-Host "[6/10] Checking environment configuration..." -ForegroundColor Yellow

if (!(Test-Path ".env")) {

$envContent = @'
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/foodsense_ai
JWT_SECRET=foodsense_ai_change_this_secret
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://127.0.0.1:8000
'@

    Set-Content -Path ".env" -Value $envContent -Encoding UTF8

    Write-Host ".env created." -ForegroundColor Green
}
else {
    Write-Host ".env already exists." -ForegroundColor Green
}

Write-Host ""

# -------------------------------------------------
# 7. Check backend structure
# -------------------------------------------------

Write-Host "[7/10] Checking backend structure..." -ForegroundColor Yellow

$requiredFiles = @(
    "server.js",
    "package.json",
    ".env",
    "config\database.js",
    "controllers\authController.js",
    "middleware\auth.js",
    "models\User.js",
    "models\Food.js",
    "models\Order.js",
    "models\Review.js",
    "routes\auth.js",
    "routes\food.js",
    "routes\order.js",
    "routes\review.js",
    "routes\analytics.js",
    "routes\health.js",
    "services\sentimentService.js",
    "services\foodScoreService.js",
    "scripts\seed.js"
)

$missingFiles = @()

foreach ($file in $requiredFiles) {

    if (Test-Path $file) {
        Write-Host "  OK  $file" -ForegroundColor Green
    }
    else {
        Write-Host "  MISSING  $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {

    Write-Host ""
    Write-Host "Some backend files are missing." -ForegroundColor Red
    Write-Host "Do not start the server yet." -ForegroundColor Red
    Write-Host ""

    foreach ($file in $missingFiles) {
        Write-Host "Missing: $file" -ForegroundColor Red
    }

    exit 1
}

Write-Host ""

# -------------------------------------------------
# 8. Test MongoDB connection
# -------------------------------------------------

Write-Host "[8/10] Testing MongoDB..." -ForegroundColor Yellow

$mongosh = Get-Command mongosh -ErrorAction SilentlyContinue

if ($null -ne $mongosh) {

    try {

        mongosh "mongodb://127.0.0.1:27017/foodsense_ai" --quiet --eval "db.runCommand({ ping: 1 })"

        Write-Host "MongoDB connection test successful." -ForegroundColor Green

    }
    catch {

        Write-Host "MongoDB connection test failed." -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }

}
else {

    Write-Host "mongosh command not found." -ForegroundColor Yellow
    Write-Host "MongoDB Windows service is running, so continuing." -ForegroundColor Yellow
}

Write-Host ""

# -------------------------------------------------
# 9. Check npm scripts
# -------------------------------------------------

Write-Host "[9/10] Checking npm scripts..." -ForegroundColor Yellow

npm run

Write-Host ""

# -------------------------------------------------
# 10. Final status
# -------------------------------------------------

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       BACKEND BUILD COMPLETED" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Project:" -ForegroundColor Cyan
Write-Host "FoodSense AI - Food Ordering & Review Analyzer"
Write-Host ""

Write-Host "Backend:" -ForegroundColor Cyan
Write-Host "http://localhost:5000"
Write-Host ""

Write-Host "Health API:" -ForegroundColor Cyan
Write-Host "http://localhost:5000/api/health"
Write-Host ""

Write-Host "MongoDB:" -ForegroundColor Cyan
Write-Host "mongodb://127.0.0.1:27017/foodsense_ai"
Write-Host ""

Write-Host "Manager Login:" -ForegroundColor Cyan
Write-Host "Email: manager@foodsense.ai"
Write-Host "Password: Manager@123"
Write-Host ""

Write-Host "NEXT STEP:" -ForegroundColor Yellow
Write-Host "Run: npm run seed" -ForegroundColor White
Write-Host ""

Write-Host "Then:" -ForegroundColor Yellow
Write-Host "Run: npm run dev" -ForegroundColor White
Write-Host ""