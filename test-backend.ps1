 $ErrorActionPreference = "Stop"

$API = "http://localhost:5000/api"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "          FOODSense AI BACKEND TEST" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# --------------------------------------------------
# HEALTH
# --------------------------------------------------

Write-Host "[1] Health API..." -ForegroundColor Yellow

$health = Invoke-RestMethod `
    -Uri "$API/health" `
    -Method GET

Write-Host "PASS" -ForegroundColor Green
$health | ConvertTo-Json

# --------------------------------------------------
# FOODS
# --------------------------------------------------

Write-Host ""
Write-Host "[2] Foods API..." -ForegroundColor Yellow

$foodsResponse = Invoke-RestMethod `
    -Uri "$API/foods" `
    -Method GET

$foods =
    if ($foodsResponse.foods) {
        $foodsResponse.foods
    }
    else {
        $foodsResponse
    }

if ($foods.Count -gt 0) {
    Write-Host "PASS - $($foods.Count) foods returned." -ForegroundColor Green
}
else {
    throw "Foods API returned no food."
}

# --------------------------------------------------
# REGISTER
# --------------------------------------------------

Write-Host ""
Write-Host "[3] Customer registration..." -ForegroundColor Yellow

$stamp = Get-Date -Format "yyyyMMddHHmmss"

$email = "test_$stamp@foodsense.ai"

$registerBody = @{
    name = "FoodSense Test User"
    email = $email
    password = "Test@12345"
} | ConvertTo-Json

try {

    $register = Invoke-RestMethod `
        -Uri "$API/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody

    Write-Host "PASS - Registration successful." -ForegroundColor Green

}
catch {

    Write-Host "Registration returned an error." -ForegroundColor Yellow
    Write-Host $_.ErrorDetails.Message
}

# --------------------------------------------------
# LOGIN
# --------------------------------------------------

Write-Host ""
Write-Host "[4] Customer login..." -ForegroundColor Yellow

$loginBody = @{
    email = $email
    password = "Test@12345"
} | ConvertTo-Json

$login = Invoke-RestMethod `
    -Uri "$API/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$token =
    $login.token

if (!$token) {
    $token = $login.accessToken
}

if (!$token) {
    throw "Login succeeded but no token was returned."
}

Write-Host "PASS - Customer login." -ForegroundColor Green

$headers = @{
    Authorization = "Bearer $token"
}

# --------------------------------------------------
# CREATE ORDER
# --------------------------------------------------

Write-Host ""
Write-Host "[5] Creating test order..." -ForegroundColor Yellow

$firstFood = $foods[0]

$foodId =
    $firstFood._id

if (!$foodId) {
    throw "Food ID missing from Foods API."
}

$orderBody = @{
    items = @(
        @{
            food = $foodId
            quantity = 1
        }
    )
    paymentMethod = "demo"
    paymentStatus = "paid"
} | ConvertTo-Json -Depth 5

$order = Invoke-RestMethod `
    -Uri "$API/orders" `
    -Method POST `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $orderBody

Write-Host "PASS - Order created." -ForegroundColor Green

$order | ConvertTo-Json -Depth 5

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "           BACKEND TEST PASSED" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""