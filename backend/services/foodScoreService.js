export function calculateFoodScore(food, sentiment) {
  let change = 0;

  if (sentiment === "positive") {
    change = 0.2;
  }

  if (sentiment === "neutral") {
    change = 0;
  }

  if (sentiment === "negative") {
    change = -0.2;
  }

  const oldScore =
    Number(food.score || food.rating || 4);

  const newScore = Math.max(
    1,
    Math.min(
      5,
      Number(
        (oldScore + change).toFixed(1)
      )
    )
  );

  return {
    oldScore,
    newScore,
    change
  };
}
