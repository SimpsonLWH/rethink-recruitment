import { describe, expect, it } from "vitest";
import {
  canCreateMatch,
  canUseLike,
  canUsePriorityIntro,
  isResponseSource,
  remainingLikes,
  remainingPriorityIntros,
  sourceConsumesLike,
} from "./matching";

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
    expect(canUsePriorityIntro(0, 1)).toBe(true);
    expect(canUsePriorityIntro(1, 1)).toBe(false);
    expect(canUsePriorityIntro(4, 3)).toBe(false);
    expect(remainingPriorityIntros(1, 0)).toBe(1);
    expect(remainingPriorityIntros(3, 5)).toBe(0);
  });

  it("enforces the ordinary Like budget", () => {
    expect(canUseLike(0, 5)).toBe(true);
    expect(canUseLike(4, 5)).toBe(true);
    expect(canUseLike(5, 5)).toBe(false);
    expect(remainingLikes(5, 2)).toBe(3);
    expect(remainingLikes(5, 9)).toBe(0);
  });

  it("only lets a swipe consume a Like; replies and acceptances do not", () => {
    expect(sourceConsumesLike("SWIPE")).toBe(true);
    expect(sourceConsumesLike(null)).toBe(true);
    expect(sourceConsumesLike("PRIORITY_INTRO_REPLY")).toBe(false);
    expect(sourceConsumesLike("INVITATION_ACCEPT")).toBe(false);
    expect(sourceConsumesLike("INVITATION_REPLY")).toBe(false);
    expect(sourceConsumesLike("REVIEW_REQUEST")).toBe(false);
    expect(isResponseSource("INVITATION_ACCEPT")).toBe(true);
    expect(isResponseSource("SWIPE")).toBe(false);
  });
});
