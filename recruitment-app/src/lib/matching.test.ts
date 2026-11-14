import { describe, expect, it } from "vitest";
import { canCreateMatch, canUseRose, remainingRoses } from "./matching";

describe("mutual matching", () => {
  it("only creates a match from two yes actions", () => {
    expect(canCreateMatch("LIKE", "LIKE")).toBe(true);
    expect(canCreateMatch("ROSE", "LIKE")).toBe(true);
    expect(canCreateMatch("LIKE", "ROSE")).toBe(true);
  });

  it("never matches a one-sided yes or any pass", () => {
    expect(canCreateMatch("LIKE", null)).toBe(false);
    expect(canCreateMatch("LIKE", undefined)).toBe(false);
    expect(canCreateMatch("LIKE", "PASS")).toBe(false);
    expect(canCreateMatch("PASS", "ROSE")).toBe(false);
    expect(canCreateMatch("PASS", "PASS")).toBe(false);
  });

  it("enforces an equal, hard rose budget", () => {
    expect(canUseRose(0, 3)).toBe(true);
    expect(canUseRose(2, 3)).toBe(true);
    expect(canUseRose(3, 3)).toBe(false);
    expect(canUseRose(4, 3)).toBe(false);
    expect(remainingRoses(3, 1)).toBe(2);
    expect(remainingRoses(3, 5)).toBe(0);
  });
});
