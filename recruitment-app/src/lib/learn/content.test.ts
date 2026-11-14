import { describe, expect, it } from "vitest";
import { TRACKS, findItem } from "./content";
import { checkPractice, practiceView } from "./practice";

const SOLUTIONS: Record<string, string> = {
  "lp-js-vowels": "function countVowels(text) { return (text.match(/[aeiou]/gi) || []).length; }",
  "lp-js-chunk":
    "function chunk(items, size) { const out = []; for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size)); return out; }",
  "lp-js-topword":
    "function topWord(text) { const counts = new Map(); for (const w of text.toLowerCase().split(/[^a-z]+/)) { if (w) counts.set(w, (counts.get(w) || 0) + 1); } let best = ''; let n = 0; for (const [w, c] of counts) { if (c > n || (c === n && w < best)) { best = w; n = c; } } return best; }",
  "lp-al-bsearch":
    "function binarySearch(sorted, target) { let lo = 0, hi = sorted.length - 1; while (lo <= hi) { const mid = (lo + hi) >> 1; if (sorted[mid] === target) return mid; if (sorted[mid] < target) lo = mid + 1; else hi = mid - 1; } return -1; }",
  "lp-al-anagram":
    "function isAnagram(left, right) { return left.length === right.length && left.split('').sort().join('') === right.split('').sort().join(''); }",
  "lp-al-kadane":
    "function maxSubarray(values) { let cur = values[0], best = values[0]; for (let i = 1; i < values.length; i++) { cur = Math.max(values[i], cur + values[i]); best = Math.max(best, cur); } return best; }",
  "lp-q-cumret":
    "function cumulativeReturn(returns) { const total = returns.reduce((acc, r) => acc * (1 + r), 1) - 1; return Math.round(total * 10000) / 10000; }",
};

const ANSWERS: Record<string, string> = {
  "lp-js-sort": "1",
  "lp-al-logn": "1",
  "lp-q-bayes": "0.167",
  "lp-q-game": "0.2",
  "lp-q-squares": "2496",
  "lp-q-corr": "3",
};

describe("Prepare content", () => {
  it("has unique slugs and problem ids", () => {
    const ids = new Set<string>();
    for (const track of TRACKS) {
      const slugs = new Set(track.items.map((item) => item.slug));
      expect(slugs.size, track.slug).toBe(track.items.length);
      for (const item of track.items) {
        if (item.kind !== "practice") continue;
        expect(ids.has(item.problem.id), item.problem.id).toBe(false);
        ids.add(item.problem.id);
      }
    }
  });

  it("has a passing reference for every practice problem", () => {
    for (const track of TRACKS) {
      for (const item of track.items) {
        if (item.kind !== "practice") continue;
        const answer = item.problem.kind === "code" ? SOLUTIONS[item.problem.id] : ANSWERS[item.problem.id];
        expect(answer, "missing reference for " + item.problem.id).toBeTruthy();
        const result = checkPractice(item.problem.id, answer);
        if (result?.kind === "code") expect(result.allPassed, item.problem.id).toBe(true);
        else expect(result?.correct, item.problem.id).toBe(true);
      }
    }
  });

  it("does not reveal answers or explanations before a correct attempt", () => {
    const found = findItem("quant", "bayes-test");
    expect(found?.item.kind).toBe("practice");
    if (found?.item.kind !== "practice") return;
    const view = practiceView(found.item);
    expect(JSON.stringify(view)).not.toContain("0.16");
    const wrong = checkPractice(found.item.problem.id, "0.5");
    expect(wrong).toMatchObject({ kind: "answer", correct: false, explanation: null });
  });
});
