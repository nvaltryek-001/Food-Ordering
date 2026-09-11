# ============================================================
# FoodSense AI Dataset Downloader
# GitHub datasets for review/sentiment analysis
# ============================================================

Write-Host ""
Write-Host "Downloading FoodSense AI datasets..." -ForegroundColor Cyan
Write-Host ""

New-Item -ItemType Directory -Force -Path "data\github" | Out-Null

# ------------------------------------------------------------
# Dataset 1
# Restaurant Reviews - 1000 rows
# ------------------------------------------------------------

$url1 = "https://raw.githubusercontent.com/aadimangla/Restaurant-Reviews-Sentiment-Analysis/master/Dataset/Restaurant_Reviews.tsv"

try {
    Invoke-WebRequest `
        -Uri $url1 `
        -OutFile "data\github\restaurant_reviews.tsv" `
        -UseBasicParsing

    Write-Host "✅ Restaurant Reviews dataset downloaded" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Restaurant Reviews download failed" -ForegroundColor Yellow
}

# ------------------------------------------------------------
# Dataset 2
# CRSD - Customer Review Sentiment Dataset
# ~10k reviews
# ------------------------------------------------------------

$url2 = "https://raw.githubusercontent.com/Infinitode/CRSD/main/data.csv"

try {
    Invoke-WebRequest `
        -Uri $url2 `
        -OutFile "data\github\customer_review_sentiment.csv" `
        -UseBasicParsing

    Write-Host "✅ Customer Review Sentiment dataset downloaded" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ CRSD download failed" -ForegroundColor Yellow
}

# ------------------------------------------------------------
# Dataset 3
# Restaurant Review Sentiment Analysis project
# Clone only repository metadata/code.
# Dataset can be used as an additional source.
# ------------------------------------------------------------

if (!(Test-Path "data\github\restaurant-sentiment-project")) {

    git clone `
        --depth 1 `
        https://github.com/manthanpatel98/Restaurant-Review-Sentiment-Analysis.git `
        data\github\restaurant-sentiment-project

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Restaurant sentiment project downloaded" -ForegroundColor Green
    }
}

# ------------------------------------------------------------
# Dataset 4
# Amazon Fine Food Review project reference
# We DO NOT download the 250+ MB CSV automatically.
# ------------------------------------------------------------

$amazonInfo = @"
Amazon Fine Food Reviews
Source:
https://github.com/bansalkanav/Amazon_fine_food_review

Dataset:
568,454 food reviews

The complete Reviews.csv is intentionally NOT downloaded
automatically because it is hundreds of MB.

Use it later for model training if required.
"@

Set-Content `
    "data\github\amazon_fine_food_source.txt" `
    $amazonInfo `
    -Encoding UTF8

# ------------------------------------------------------------
# Dataset 5
# Yelp sample reviews
# ------------------------------------------------------------

if (!(Test-Path "data\github\yelp-sample")) {

    git clone `
        --depth 1 `
        https://github.com/luminati-io/Yelp-dataset-samples.git `
        data\github\yelp-sample

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Yelp sample dataset downloaded" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Datasets prepared!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

Get-ChildItem `
    "data\github" `
    -Recurse `
    -File |
    Select-Object FullName, Length |
    Format-Table -AutoSize

Write-Host ""
Write-Host "Important:" -ForegroundColor Yellow
Write-Host "The Amazon Fine Food dataset is intentionally not downloaded automatically because it is very large." -ForegroundColor Yellow
Write-Host ""
