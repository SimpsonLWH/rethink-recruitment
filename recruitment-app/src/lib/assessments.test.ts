import { describe, expect, it } from "vitest";
import {
  attemptState,
  parseProblemBank,
  publicProblems,
  seededRandom,
  type OaProblem,
} from "./assessments";

function problem(id: string): OaProblem {
  return {
    id,
    title: "Problem " + id,
    difficulty: "EASY",
    statement: "Do the thing.",
    functionName: "solve" + id,
    starterCode: "function solve" + id + "(value) {\n}\n",
    testCases: [
      { id: id + "-public", args: [1], expected: 2, hidden: false },
      { id: id + "-hidden", args: [2], expected: 4, hidden: true },
    ],
  };
}

const bank = [problem("A"), problem("B")];

describe("OA problem handling", () => {
  it("parses a valid bank and drops malformed problems", () => {
    const parsed = parseProblemBank(
      JSON.stringify([
        ...bank,
        { id: "bad", title: "No cases", statement: "x", functionName: "nope", starterCode: "", testCases: [] },
        { id: "bad2", title: "Bad name", statement: "x", functionName: "1nope", starterCode: "", testCases: [{ args: [], expected: 1 }] },
      ]),
    );
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe("A");
    expect(parsed[0].testCases[1].hidden).toBe(true);
  });

  it("returns public problems without hidden cases or answer keys", () => {
    const [publicProblem] = publicProblems(bank);
    expect(publicProblem.examples).toHaveLength(1);
    expect(publicProblem.examples[0].expected).toBe(2);
    expect(publicProblem.testCount).toBe(2);
    expect(JSON.stringify(publicProblem)).not.toContain("hidden");
    expect(JSON.stringify(publicProblem)).not.toContain("4");
  });

  it("allows exactly one sitting and never a second", () => {
    expect(attemptState(0)).toEqual({ allowed: true, reason: "ready" });
    expect(attemptState(1)).toEqual({ allowed: false, reason: "limit" });
    expect(attemptState(2)).toEqual({ allowed: false, reason: "limit" });
  });

  it("keeps the deterministic feed RNG stable", () => {
    expect([seededRandom("demo")(), seededRandom("demo")()]).toEqual([seededRandom("demo")(), seededRandom("demo")()]);
  });
});
