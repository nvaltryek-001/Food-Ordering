$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "     FOODSENSE AI - INDIAN FOOD DATASET" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$BACKEND = Join-Path $PWD "backend"
$DATA = Join-Path $BACKEND "data\food"
$PROCESSED = Join-Path $BACKEND "data\processed"

New-Item -ItemType Directory -Force -Path $DATA | Out-Null
New-Item -ItemType Directory -Force -Path $PROCESSED | Out-Null

$CSV = Join-Path $DATA "indian_food_101.csv"
$JSON = Join-Path $PROCESSED "indian_food_master.json"

$url = "https://gist.githubusercontent.com/innopreneur/00bc01212e063ad2d9e1930d9995cdca/raw/indian-food-101.csv"

Write-Host "[1/4] Downloading Indian Food 101..." -ForegroundColor Yellow

Invoke-WebRequest `
    -Uri $url `
    -OutFile $CSV

if (!(Test-Path $CSV)) {
    throw "Indian food dataset download failed."
}

Write-Host "Dataset downloaded." -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] Normalizing Indian food records..." -ForegroundColor Yellow

$rows = Import-Csv $CSV

$master = @()

foreach ($row in $rows) {

    $region = $row.region

    if ([string]::IsNullOrWhiteSpace($region) -or $region -eq "-1") {
        $region = "All India"
    }

    $state = $row.state

    if ([string]::IsNullOrWhiteSpace($state) -or $state -eq "-1") {
        $state = "India"
    }

    $diet = $row.diet

    if ([string]::IsNullOrWhiteSpace($diet)) {
        $diet = "Unknown"
    }

    $master += [PSCustomObject]@{
        name = $row.name
        ingredients = $row.ingredients
        diet = $diet
        prepTime = $row.prep_time
        cookTime = $row.cook_time
        flavor = $row.flavor_profile
        course = $row.course
        state = $state
        region = $region
    }
}

$master | ConvertTo-Json -Depth 5 |
    Set-Content $JSON -Encoding UTF8

Write-Host "Master dataset created." -ForegroundColor Green
Write-Host ""

Write-Host "[3/4] Dataset statistics..." -ForegroundColor Yellow

Write-Host "Total food records: $($master.Count)" -ForegroundColor Green

$master |
    Group-Object region |
    Sort-Object Count -Descending |
    ForEach-Object {
        Write-Host "  $($_.Name): $($_.Count)"
    }

Write-Host ""

Write-Host "[4/4] Dataset ready." -ForegroundColor Yellow

Write-Host ""
Write-Host "CSV:" -ForegroundColor Cyan
Write-Host $CSV

Write-Host ""
Write-Host "JSON:" -ForegroundColor Cyan
Write-Host $JSON

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "     INDIAN FOOD DATASET READY" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""