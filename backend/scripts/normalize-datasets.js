import fs from "fs";
import path from "path";

const output = {
  generatedAt: new Date().toISOString(),
  sources: [],
  statistics: {
    totalRecords: 0,
    positive: 0,
    neutral: 0,
    negative: 0
  },
  samples: []
};

function addRecord(
  text,
  rating,
  sentiment,
  source
) {
  if (!text) return;

  output.statistics.totalRecords++;

  if (sentiment === "positive") {
    output.statistics.positive++;
  }

  if (sentiment === "neutral") {
    output.statistics.neutral++;
  }

  if (sentiment === "negative") {
    output.statistics.negative++;
  }

  if (output.samples.length < 500) {
    output.samples.push({
      text,
      rating,
      sentiment,
      source
    });
  }
}

/*
  Restaurant Reviews TSV
*/

const tsv =
  "data/github/restaurant_reviews.tsv";

if (fs.existsSync(tsv)) {
  const lines =
    fs.readFileSync(
      tsv,
      "utf8"
    )
    .split(/\r?\n/)
    .slice(1);

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts =
      line.split("\t");

    const text =
      parts[0]?.trim();

    const liked =
      parts[1]?.trim();

    addRecord(
      text,
      liked === "1" ? 5 : 1,
      liked === "1"
        ? "positive"
        : "negative",
      "Restaurant Reviews"
    );
  }

  output.sources.push({
    name: "Restaurant Reviews",
    records: lines.length
  });
}

/*
  CRSD CSV
*/

const crsd =
  "data/github/customer_review_sentiment.csv";

if (fs.existsSync(crsd)) {
  const lines =
    fs.readFileSync(
      crsd,
      "utf8"
    )
    .split(/\r?\n/);

  const header =
    lines.shift();

  const columns =
    header
      ?.split(",")
      .map(x => x.trim().toLowerCase());

  const textIndex =
    columns?.findIndex(
      x =>
        x === "review" ||
        x === "text" ||
        x === "content"
    );

  const sentimentIndex =
    columns?.findIndex(
      x =>
        x === "sentiment" ||
        x === "label"
    );

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts =
      line.split(",");

    const text =
      textIndex >= 0
        ? parts[textIndex]
        : "";

    const rawSentiment =
      sentimentIndex >= 0
        ? parts[sentimentIndex]
        : "";

    const s =
      String(
        rawSentiment
      ).toLowerCase();

    let sentiment =
      "neutral";

    if (
      s.includes("positive") ||
      s === "1"
    ) {
      sentiment = "positive";
    }

    if (
      s.includes("negative") ||
      s === "-1"
    ) {
      sentiment = "negative";
    }

    addRecord(
      text,
      sentiment === "positive"
        ? 5
        : sentiment === "negative"
          ? 1
          : 3,
      sentiment,
      "CRSD"
    );
  }

  output.sources.push({
    name: "CRSD",
    records: lines.length
  });
}

fs.mkdirSync(
  "data/processed",
  {
    recursive: true
  }
);

fs.writeFileSync(
  "data/processed/review_dataset.json",
  JSON.stringify(
    output,
    null,
    2
  )
);

console.log("");
console.log(
  "=========================================="
);
console.log(
  "Review Dataset Normalization Complete"
);
console.log(
  "=========================================="
);
console.log("");

console.log(
  "Total:",
  output.statistics.totalRecords
);

console.log(
  "Positive:",
  output.statistics.positive
);

console.log(
  "Neutral:",
  output.statistics.neutral
);

console.log(
  "Negative:",
  output.statistics.negative
);

console.log("");
console.log(
  "Output:",
  "data/processed/review_dataset.json"
);
