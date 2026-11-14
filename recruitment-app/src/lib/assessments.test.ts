import { describe, expect, it } from "vitest";
import {
  attemptState,
  integrityLine,
  parseNumericAnswer,
  summariseIntegrity,
  parseProblemBank,
  publicProblems,
  seededRandom,
  type OaProblem,
} from "./assessments";

function problem(id: string): OaProblem {
  return {
    id,
    kind: "code",
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

  it("never exposes a choice or numeric answer key", () => {
    const [choice] = publicProblems([
      {
        id: "q",
        kind: "choice",
        title: "Q",
        difficulty: "EASY",
        statement: "?",
        functionName: "",
        starterCode: "",
        options: ["one", "two"],
        testCases: [{ id: "q-key", args: [], expected: 1, hidden: false }],
      },
    ]);
    expect(choice.kind).toBe("choice");
    expect(choice.options).toEqual(["one", "two"]);
    expect(choice.examples).toEqual([]);
  });

  it("parses numeric answers as decimals, fractions and percentages", () => {
    expect(parseNumericAnswer("0.5")).toBe(0.5);
    expect(parseNumericAnswer("1/8")).toBe(0.125);
    expect(parseNumericAnswer("12.5%")).toBe(0.125);
    expect(parseNumericAnswer("-3")).toBe(-3);
    expect(parseNumericAnswer("1,081")).toBe(1081);
    expect(parseNumericAnswer("1/0")).toBeNull();
    expect(parseNumericAnswer("abc")).toBeNull();
    expect(parseNumericAnswer("")).toBeNull();
  });

  it("summarises integrity from the server clock and drops unknown events", () => {
    const summary = summariseIntegrity({
      mode: "LOCKDOWN",
      durationMinutes: 10,
      startedAt: new Date(0),
      submittedAt: new Date(13 * 60_000),
      report: {
        events: [
          { type: "tab_hidden", atSeconds: 30 },
          { type: "fullscreen_exit", atSeconds: 60 },
          { type: "paste_blocked", atSeconds: 90 },
          { type: "made_up" as never, atSeconds: 100 },
        ],
        autoSubmitted: false,
        reason: null,
      },
    });
    expect(summary?.elapsedSeconds).toBe(780);
    expect(summary?.overTime).toBe(true);
    expect(summary?.violations).toBe(2);
    expect(summary?.events).toHaveLength(3);
    expect(integrityLine(summary)).toContain("Lockdown");
    expect(integrityLine(summary)).toContain("3 events flagged");
    expect(integrityLine(summary)).toContain("after the time limit");
  });

  it("stores nothing for an untimed, unproctored sitting", () => {
    expect(
      summariseIntegrity({ mode: "NONE", durationMinutes: 0, startedAt: new Date(0), submittedAt: new Date(1), report: null }),
    ).toBeNull();
  });
});
