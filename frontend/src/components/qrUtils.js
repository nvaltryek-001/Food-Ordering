export function getTableFromQR(value) {

  if (!value) {
    return null;
  }

  try {

    const url = new URL(value);

    return (
      url.searchParams.get("table") ||
      url.searchParams.get("tableNumber")
    );

  } catch {

    const match =
      String(value).match(
        /(?:table|tableNumber)[=:\/-]+([A-Za-z0-9_-]+)/i
      );

    return match ? match[1] : value;

  }
}


export function saveTableFromQR(value) {

  const table = getTableFromQR(value);

  if (table) {

    localStorage.setItem(
      "foodsense_table",
      table
    );

  }

  return table;
}


export function getCurrentTable() {

  return localStorage.getItem(
    "foodsense_table"
  );

}
