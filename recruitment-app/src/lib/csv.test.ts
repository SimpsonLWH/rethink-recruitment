import { describe, expect, it } from "vitest";
import { csvCell, csvRow } from "./csv";

describe("csvCell", () => {
  it("quotes values and doubles internal quotes", () => {
    expect(csvCell("plain")).toBe('"plain"');
    expect(csvCell('he said "no"')).toBe('"he said ""no"""');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
  });

  it("handles null and numbers", () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
    expect(csvCell(2.5)).toBe('"2.5"');
  });

  it("prevents spreadsheet formula injection in text", () => {
    expect(csvCell("=HYPERLINK(\"https://example.com\")")).toBe('"\'=HYPERLINK(""https://example.com"")"');
    expect(csvCell("+SUM(A1:A2)")).toBe('"\'+SUM(A1:A2)"');
    expect(csvCell("-2")).toBe('"\'-2"');
    expect(csvCell("@import")).toBe('"\'@import"');
  });

  it("does not prefix a numeric negative value", () => {
    expect(csvCell(-2)).toBe('"-2"');
  });

  it("joins a row with commas", () => {
    expect(csvRow(["a", 1, null])).toBe('"a","1",""');
  });
});
