import { publicProblem, type PublicOaProblem } from "@/lib/assessments";
import { markProblem, runPracticeTests, type PracticeTestResult } from "@/lib/oa-marking";
import { findPracticeByProblemId, type Practice } from "@/lib/learn/content";

export interface PracticeView {
  problem: PublicOaProblem;
  /** Every practice test is visible; for code problems these are all the tests. */
  tests: Array<{ args: unknown[]; expected: unknown }>;
  hint: string | null;
}

export type PracticeCheck =
  | { kind: "code"; results: PracticeTestResult[]; allPassed: boolean; explanation: string | null }
  | { kind: "answer"; correct: boolean; message: string | null; explanation: string | null };

export function practiceView(practice: Practice): PracticeView {
  const view = publicProblem(practice.problem);
  return {
    problem: view,
    tests:
      practice.problem.kind === "code"
        ? practice.problem.testCases.map((test) => ({ args: test.args, expected: test.expected }))
        : [],
    hint: practice.hint ?? null,
  };
}

/** Practice marking. Unlimited, nothing stored, explanation only after success. */
export function checkPractice(problemId: string, answer: string): PracticeCheck | null {
  const practice = findPracticeByProblemId(problemId);
  if (!practice) return null;
  if (practice.problem.kind === "code") {
    const results = runPracticeTests(practice.problem, answer);
    const allPassed = results.length > 0 && results.every((result) => result.passed);
    return { kind: "code", results, allPassed, explanation: allPassed ? practice.explanation ?? null : null };
  }
  const mark = markProblem(practice.problem, answer);
  const correct = mark.passed === mark.total && mark.total > 0;
  return {
    kind: "answer",
    correct,
    message: correct ? null : mark.error,
    explanation: correct ? practice.explanation ?? null : null,
  };
}
