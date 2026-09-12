export function parseTableQR(decodedText) {
  const text = String(decodedText || "").trim();

  if (!text) {
    throw new Error("Empty QR code");
  }

  const foodSenseMatch = text.match(
    /^foodsense:\/\/table\/([A-Za-z0-9_-]+)\/?$/
  );

  if (foodSenseMatch) {
    return {
      tableNumber: foodSenseMatch[1],
      raw: text,
      valid: true,
    };
  }

  const tableMatch = text.match(
    /^table[\/\s_-]*([A-Za-z0-9_-]+)$/i
  );

  if (tableMatch) {
    return {
      tableNumber: tableMatch[1],
      raw: text,
      valid: true,
    };
  }

  throw new Error("Invalid FoodSense table QR");
}

export function createTableQR(tableNumber) {
  const value = String(tableNumber || "").trim();

  if (!value) {
    throw new Error("Table number is required");
  }

  return `foodsense://table/${value}`;
}
