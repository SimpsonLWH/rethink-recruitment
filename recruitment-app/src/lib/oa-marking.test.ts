import { describe, expect, it } from "vitest";
import { canonicalResult, checkExamples, markProblem, markSubmissions } from "./oa-marking";
import type { OaProblem } from "./assessments";
import { seedAssessments } from "../../prisma/seed-data/assessments";

const sumProblem: OaProblem = {
  id: "sum",
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
  return {
    problems: assessment.problems.map((problem) => ({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      statement: problem.statement,
      functionName: problem.functionName,
      starterCode: problem.starterCode,
      testCases: problem.testCases.map((test) => ({
        id: test.id,
        args: test.args,
        expected: test.expected,
        hidden: test.hidden !== false,
      })),
    })),
    submissions: Object.fromEntries(assessment.problems.map((problem) => [problem.id, problem.solution])),
  };
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
});
