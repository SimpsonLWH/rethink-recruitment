/**
 * CSV helpers for the audit export. Values are quoted, internal quotes are
 * doubled, and text that starts with a spreadsheet formula character is
 * prefixed with an apostrophe so a synthetic name or reason cannot become a
 * formula in Excel or Sheets.
 */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  const isNumber = typeof value === "number";
  if (!isNumber && /^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(",");
}
