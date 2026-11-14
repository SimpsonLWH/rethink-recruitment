import { describe, expect, it } from "vitest";
import { composeFeed, FEED_MIX, shuffle } from "./feed-composition";

interface Card {
  id: string;
  cohort: "interested" | "discovery";
}

const interested: Card[] = [
  { id: "i1", cohort: "interested" },
  { id: "i2", cohort: "interested" },
];
const discovery: Card[] = [
  { id: "d1", cohort: "discovery" },
  { id: "d2", cohort: "discovery" },
  { id: "d3", cohort: "discovery" },
];

describe("feed composition", () => {
  it("keeps a fixed one-to-one demo mix before the deterministic shuffle", () => {
    expect(FEED_MIX).toEqual({ interested: 1, discovery: 1 });
  });

  it("surfaces both cohorts, without duplicates, and never returns a cohort field", () => {
    const mixed = composeFeed({
      interested,
      discovery,
      keyOf: (card) => card.id,
      salt: "candidate:demo",
    });
    expect(mixed).toHaveLength(5);
    expect(new Set(mixed.map((card) => card.id)).size).toBe(5);
    expect(mixed.filter((card) => card.cohort === "interested")).toHaveLength(2);
    expect(JSON.stringify(mixed)).not.toContain("cohortLabel");
  });

  it("is deterministic for the same viewer and input", () => {
    const first = composeFeed({ interested, discovery, keyOf: (card) => card.id, salt: "same" });
    const second = composeFeed({ interested, discovery, keyOf: (card) => card.id, salt: "same" });
    expect(first.map((card) => card.id)).toEqual(second.map((card) => card.id));
  });

  it("fills from the remaining cohort when one side is empty", () => {
    expect(composeFeed({ interested: [], discovery, keyOf: (card) => card.id, salt: "x" })).toHaveLength(3);
    expect(composeFeed({ interested, discovery: [], keyOf: (card) => card.id, salt: "x" })).toHaveLength(2);
  });

  it("shuffle leaves the input untouched", () => {
    const input = [1, 2, 3, 4];
    const output = shuffle(input, "salt");
    expect(input).toEqual([1, 2, 3, 4]);
    expect(output.sort()).toEqual([1, 2, 3, 4]);
  });
});
