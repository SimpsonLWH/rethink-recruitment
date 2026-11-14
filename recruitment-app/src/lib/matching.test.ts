import { describe, expect, it } from "vitest";
import { canCreateMatch, canUsePriorityIntro, remainingPriorityIntros } from "./matching";

describe("mutual matching", () => {
  it("only creates a match from two yes actions", () => {
    expect(canCreateMatch("LIKE", "LIKE")).toBe(true);
    expect(canCreateMatch("PRIORITY_INTRO", "LIKE")).toBe(true);
    expect(canCreateMatch("LIKE", "PRIORITY_INTRO")).toBe(true);
  });

  it("never matches a one-sided yes or any pass", () => {
    expect(canCreateMatch("LIKE", null)).toBe(false);
    expect(canCreateMatch("LIKE", undefined)).toBe(false);
    expect(canCreateMatch("LIKE", "PASS")).toBe(false);
    expect(canCreateMatch("PASS", "PRIORITY_INTRO")).toBe(false);
    expect(canCreateMatch("PASS", "PASS")).toBe(false);
  });

  it("enforces an equal, hard Priority intro budget", () => {
    expect(canUsePriorityIntro(0, 3)).toBe(true);
    expect(canUsePriorityIntro(2, 3)).toBe(true);
    expect(canUsePriorityIntro(3, 3)).toBe(false);
    expect(canUsePriorityIntro(4, 3)).toBe(false);
    expect(remainingPriorityIntros(3, 1)).toBe(2);
    expect(remainingPriorityIntros(3, 5)).toBe(0);
  });
});
