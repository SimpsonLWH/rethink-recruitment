import type { OaProblem } from "../../src/lib/assessments";
import type { SeedAssessment, SeedAssessmentProblem } from "./types";

/**
 * Converts a seed problem into the stored problem-bank shape. Choice and
 * numeric answer keys become a single hidden test case, so they are never sent
 * to the browser by publicProblem().
 */
export function storedProblem(problem: SeedAssessmentProblem): OaProblem {
  if (problem.kind === "choice") {
    return {
      id: problem.id,
      kind: "choice",
      title: problem.title,
      difficulty: problem.difficulty,
      statement: problem.statement,
      functionName: "",
      starterCode: "",
      options: problem.options,
      testCases: [{ id: problem.id + "-key", args: [], expected: problem.answer, hidden: true }],
    };
  }
  if (problem.kind === "numeric") {
    return {
      id: problem.id,
      kind: "numeric",
      title: problem.title,
      difficulty: problem.difficulty,
      statement: problem.statement,
      functionName: "",
      starterCode: "",
      ...(problem.tolerance !== undefined ? { tolerance: problem.tolerance } : {}),
      testCases: [{ id: problem.id + "-key", args: [], expected: problem.answer, hidden: true }],
    };
  }
  return {
    id: problem.id,
    kind: "code",
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
  };
}

export function storedProblems(assessment: SeedAssessment): OaProblem[] {
  return assessment.problems.map(storedProblem);
}

/** Reference answers that must score 100. Used by the seed assertion and tests. */
export function referenceSubmissions(assessment: SeedAssessment): Record<string, string> {
  return Object.fromEntries(
    assessment.problems.map((problem) => {
      if (problem.kind === "choice") return [problem.id, String(problem.answer)];
      if (problem.kind === "numeric") return [problem.id, String(problem.answer)];
      return [problem.id, problem.solution];
    }),
  );
}
