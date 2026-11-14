/**
 * Deterministic online-assessment rules. No model call and no hidden ranking:
 * a sitting is one set of coding problems, answers are marked against test
 * cases on the server, and the score belongs to one assessment version only.
 *
 * One attempt per candidate per assessment per recruiting cycle. There is no
 * cooldown and no retake. That rule is enforced by the database unique key and
 * by the repository, not just by the interface.
 */

export type AssessmentDifficulty = "EASY" | "MEDIUM" | "ADVANCED";

export interface OaTestCase {
  id: string;
  /** Arguments passed to the submitted function, in order. */
  args: unknown[];
  /** JSON-compatible value the function must return. */
  expected: unknown;
  /** Hidden cases are used for marking only and never sent to the browser. */
  hidden: boolean;
}

export interface OaProblem {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
  statement: string;
  functionName: string;
  starterCode: string;
  testCases: OaTestCase[];
}

export interface PublicOaExample {
  args: unknown[];
  expected: unknown;
}

export interface PublicOaProblem {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
  statement: string;
  functionName: string;
  starterCode: string;
  examples: PublicOaExample[];
  testCount: number;
}

export type OaSubmissions = Record<string, string>;

export interface ProblemMark {
  problemId: string;
  title: string;
  passed: number;
  total: number;
  error: string | null;
}

export interface OaMarking {
  score: number;
  passedTests: number;
  totalTests: number;
  problems: ProblemMark[];
}

export interface AttemptState {
  allowed: boolean;
  reason: "ready" | "limit";
}

const DIFFICULTIES: AssessmentDifficulty[] = ["EASY", "MEDIUM", "ADVANCED"];
const FUNCTION_NAME = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function isAssessmentDifficulty(value: string): value is AssessmentDifficulty {
  return DIFFICULTIES.includes(value as AssessmentDifficulty);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function parseProblemBank(json: string | null | undefined): OaProblem[] {
  if (!json) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  const problems: OaProblem[] = [];
  for (const entry of raw) {
    const record = asRecord(entry);
    if (!record) continue;
    if (
      typeof record.id !== "string" ||
      typeof record.title !== "string" ||
      typeof record.statement !== "string" ||
      typeof record.functionName !== "string" ||
      !FUNCTION_NAME.test(record.functionName) ||
      typeof record.starterCode !== "string"
    ) {
      continue;
    }
    const difficulty = typeof record.difficulty === "string" && isAssessmentDifficulty(record.difficulty)
      ? record.difficulty
      : "MEDIUM";
    if (!Array.isArray(record.testCases) || record.testCases.length === 0) continue;

    const testCases: OaTestCase[] = [];
    for (const testEntry of record.testCases) {
      const test = asRecord(testEntry);
      if (!test || typeof test.id !== "string" || !Array.isArray(test.args)) continue;
      if (!Object.prototype.hasOwnProperty.call(test, "expected")) continue;
      testCases.push({
        id: test.id,
        args: test.args,
        expected: test.expected,
        hidden: test.hidden !== false,
      });
    }
    if (testCases.length === 0) continue;

    problems.push({
      id: record.id,
      title: record.title,
      difficulty,
      statement: record.statement,
      functionName: record.functionName,
      starterCode: record.starterCode,
      testCases,
    });
  }
  return problems;
}

export function publicProblem(problem: OaProblem): PublicOaProblem {
  return {
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    statement: problem.statement,
    functionName: problem.functionName,
    starterCode: problem.starterCode,
    examples: problem.testCases
      .filter((test) => !test.hidden)
      .map((test) => ({ args: test.args, expected: test.expected })),
    testCount: problem.testCases.length,
  };
}

export function publicProblems(problems: OaProblem[]): PublicOaProblem[] {
  return problems.map(publicProblem);
}

/**
 * The one-and-done rule. It reads a count, not a clock: the second sitting is
 * never allowed, so there is no cooldown to wait out.
 */
export function attemptState(attemptCount: number): AttemptState {
  return attemptCount > 0
    ? { allowed: false, reason: "limit" }
    : { allowed: true, reason: "ready" };
}

/** Deterministic RNG used by the seeded feed and tests, not by OA marking. */
export function seededRandom(seed: string | number): () => number {
  let value = typeof seed === "number" ? seed : hashString(seed);
  value >>>= 0;
  return function random() {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
