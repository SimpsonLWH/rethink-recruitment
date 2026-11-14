import { describe, expect, it } from "vitest";
import { canonicalResult, checkExamples, markProblem, markSubmissions } from "./oa-marking";
import type { OaProblem } from "./assessments";
import { seedAssessments } from "../../prisma/seed-data/assessments";
import { referenceSubmissions, storedProblems as toStored } from "../../prisma/seed-data/stored";

const sumProblem: OaProblem = {
  id: "sum",
  kind: "code",
  title: "Sum",
  difficulty: "EASY",
  statement: "Add the numbers.",
  functionName: "sum",
  starterCode: "function sum(numbers) {\n}\n",
  testCases: [
    { id: "sum-1", args: [[1, 2]], expected: 3, hidden: false },
    { id: "sum-2", args: [[0, 0]], expected: 0, hidden: true },
    { id: "sum-3", args: [[-1, 1]], expected: 0, hidden: true },
  ],
};

function storedProblems(assessmentSlug: string): { problems: OaProblem[]; submissions: Record<string, string> } {
  const assessment = seedAssessments.find((entry) => entry.slug === assessmentSlug);
  if (!assessment) throw new Error("missing seeded assessment " + assessmentSlug);
  return { problems: toStored(assessment), submissions: referenceSubmissions(assessment) };
}

describe("OA server-side marking", () => {
  it("produces a stable canonical form regardless of object key order", () => {
    expect(canonicalResult({ b: 2, a: [1, 2] })).toBe(canonicalResult({ a: [1, 2], b: 2 }));
    expect(canonicalResult(NaN)).not.toBe(canonicalResult(0));
    expect(canonicalResult(undefined)).not.toBe(canonicalResult(null));
  });

  it("marks correct code and keeps the score tied to passed tests", () => {
    const marking = markSubmissions([sumProblem], {
      sum: "function sum(numbers) { return numbers.reduce((total, value) => total + value, 0); }",
    });
    expect(marking.score).toBe(100);
    expect(marking.passedTests).toBe(3);
    expect(marking.totalTests).toBe(3);
    expect(marking.problems[0]).toMatchObject({ problemId: "sum", passed: 3, total: 3, error: null });
  });

  it("marks wrong code, empty code and thrown errors as failures without crashing", () => {
    const wrong = markProblem(sumProblem, "function sum(numbers) { return 0; }");
    expect(wrong.passed).toBe(2);
    expect(wrong.error).toBeTruthy();
    const empty = markProblem(sumProblem, "   ");
    expect(empty.passed).toBe(0);
    expect(empty.error).toBe("No code submitted.");
    const thrown = markProblem(sumProblem, "function sum() { throw new Error('nope'); }");
    expect(thrown.passed).toBe(0);
    expect(thrown.error).toBe("nope");
  });

  it("checks public examples only and does not reveal hidden expectations", () => {
    const check = checkExamples(sumProblem, "function sum(numbers) { return numbers[0] + numbers[1]; }");
    expect(check.passed).toBe(1);
    expect(check.total).toBe(1);
    expect(check.error).toBeNull();
  });

  it("times out a non-terminating submission instead of hanging", () => {
    const result = markProblem(sumProblem, "function sum() { while (true) {} }");
    expect(result.passed).toBe(0);
    expect(result.error).toBeTruthy();
  });

  it("has a reference solution for every seeded problem", () => {
    for (const assessment of seedAssessments.filter((entry) => entry.playable)) {
      const { problems, submissions } = storedProblems(assessment.slug);
      const marking = markSubmissions(problems, submissions);
      expect(marking.score, assessment.slug).toBe(100);
    }
  });

  it("marks multiple-choice and numeric answers against a hidden key", () => {
    const choice: OaProblem = {
      id: "c1",
      kind: "choice",
      title: "Pick",
      difficulty: "EASY",
      statement: "Pick B.",
      functionName: "",
      starterCode: "",
      options: ["A", "B", "C"],
      testCases: [{ id: "c1-key", args: [], expected: 1, hidden: true }],
    };
    const numeric: OaProblem = {
      id: "n1",
      kind: "numeric",
      title: "Quarter",
      difficulty: "EASY",
      statement: "One in four.",
      functionName: "",
      starterCode: "",
      tolerance: 0.001,
      testCases: [{ id: "n1-key", args: [], expected: 0.25, hidden: true }],
    };
    expect(markProblem(choice, "1").passed).toBe(1);
    expect(markProblem(choice, "2").passed).toBe(0);
    expect(markProblem(choice, "9").error).toMatch(/Pick one/);
    expect(markProblem(numeric, "1/4").passed).toBe(1);
    expect(markProblem(numeric, "25%").passed).toBe(1);
    expect(markProblem(numeric, "0.2504").passed).toBe(1);
    expect(markProblem(numeric, "0.3").passed).toBe(0);
    expect(markProblem(numeric, "a quarter").error).toMatch(/Enter a number/);
    expect(checkExamples(choice, "1").total).toBe(0);
  });

  it("weights every problem equally in a mixed sitting", () => {
    const choice: OaProblem = {
      id: "c1",
      kind: "choice",
      title: "Pick",
      difficulty: "EASY",
      statement: "Pick A.",
      functionName: "",
      starterCode: "",
      options: ["A", "B"],
      testCases: [{ id: "c1-key", args: [], expected: 0, hidden: true }],
    };
    const marking = markSubmissions([sumProblem, choice], {
      sum: "function sum(numbers) { return numbers.reduce((total, value) => total + value, 0); }",
      c1: "1",
    });
    expect(marking.score).toBe(50);
  });
});
