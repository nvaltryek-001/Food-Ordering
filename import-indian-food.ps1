$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "       IMPORT INDIAN FOOD INTO MONGODB" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "$PWD\backend"

Write-Host "[1/3] Creating import script..." -ForegroundColor Yellow

$js = @'
import "dotenv/config";
import fs from "fs";
import mongoose from "mongoose";

const uri =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/foodsense_ai";

const file =
  "data/processed/indian_food_master.json";

const foods = JSON.parse(
  fs.readFileSync(file, "utf8")
);

await mongoose.connect(uri);

const db = mongoose.connection.db;

const collection = db.collection("foods");

console.log("MongoDB connected.");
console.log(`Importing ${foods.length} Indian foods...`);

const operations = [];

for (const food of foods) {

  const name = String(food.name || "").trim();

  if (!name) continue;

  const price =
    food.diet?.toLowerCase() === "non vegetarian"
      ? 199
      : 129;

  operations.push({
    updateOne: {
      filter: {
        name: name
      },
      update: {
        $set: {
          name: name,
          description:
            `${name} - ${food.course || "Indian cuisine"} from ${food.state || "India"}.`,
          price: price,
          region: food.region || "All India",
          state: food.state || "India",
          category: food.course || "Main Course",
          diet: food.diet || "Unknown",
          ingredients: food.ingredients || "",
          prepTime: Number(food.prepTime) || 0,
          cookTime: Number(food.cookTime) || 0,
          flavor: food.flavor || "",
          source: "Indian Food 101",
          score: 4.0,
          rating: 4.0,
          reviewCount: 0,
          updatedAt: new Date()
        }
      },
      upsert: true
    }
  });
}

if (operations.length) {

  const result = await collection.bulkWrite(
    operations,
    { ordered: false }
  );

  console.log("");
  console.log("MongoDB import completed.");
  console.log("Matched:", result.matchedCount);
  console.log("Modified:", result.modifiedCount);
  console.log("Inserted:", result.upsertedCount);
}

const count = await collection.countDocuments();

console.log("");
console.log("Total foods in MongoDB:", count);

await mongoose.disconnect();
'@

Set-Content `
    -Path "scripts\import-indian-food.js" `
    -Value $js `
    -Encoding UTF8

Write-Host "Import script created." -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Importing dataset..." -ForegroundColor Yellow

node scripts/import-indian-food.js

if ($LASTEXITCODE -ne 0) {
    throw "Food dataset import failed."
}

Write-Host ""
Write-Host "[3/3] Import successful." -ForegroundColor Green

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "       INDIAN FOOD DATABASE READY" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green