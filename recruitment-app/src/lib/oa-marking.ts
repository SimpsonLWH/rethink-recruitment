/**
 * Server-side marking for the online assessment.
 *
 * Submitted code is executed in a fresh Node vm context per test case with a
 * hard timeout. This is a demo marker, not a security boundary: vm is not a
 * production code sandbox and the app does not claim proctoring or cheating
 * prevention. The important product rules live in the database and repository.
 */
import vm from "node:vm";
import type { OaMarking, OaProblem, OaSubmissions, ProblemMark } from "@/lib/assessments";

export const MAX_CODE_LENGTH = 20_000;
const TEST_TIMEOUT_MS = 400;
const MAX_ERROR_LENGTH = 180;

const NON_FINITE = "__rivet_non_finite__";
const UNDEFINED = "__rivet_undefined__";
const UNSUPPORTED = "__rivet_unsupported__";

interface TestRun {
  passed: boolean;
  error: string | null;
}

function truncateError(value: unknown): string {
  const message =
    value && typeof value === "object" && "message" in value
      ? String((value as { message?: unknown }).message ?? "")
      : String(value ?? "Unknown error.");
  return message.slice(0, MAX_ERROR_LENGTH) || "Unknown error.";
}

/** Stable JSON so object key order and array order compare safely. */
export function canonicalResult(value: unknown): string {
  const seen = new Set<object>();

  function walk(entry: unknown, depth: number): unknown {
    if (depth > 12) return UNSUPPORTED;
    if (entry === undefined) return UNDEFINED;
    if (entry === null || typeof entry === "string" || typeof entry === "boolean") return entry;
    if (typeof entry === "number") return Number.isFinite(entry) ? entry : NON_FINITE;
    if (typeof entry === "bigint" || typeof entry === "symbol" || typeof entry === "function") {
      return UNSUPPORTED;
    }
    if (Array.isArray(entry)) {
      if (seen.has(entry)) return UNSUPPORTED;
      seen.add(entry);
      const mapped = entry.map((item) => walk(item, depth + 1));
      seen.delete(entry);
      return mapped;
    }
    if (typeof entry === "object") {
      if (seen.has(entry as object)) return UNSUPPORTED;
      seen.add(entry as object);
      const record = entry as Record<string, unknown>;
      const mapped: Record<string, unknown> = {};
      for (const key of Object.keys(record).sort()) {
        mapped[key] = walk(record[key], depth + 1);
      }
      seen.delete(entry as object);
      return mapped;
    }
    return UNSUPPORTED;
  }

  try {
    return JSON.stringify(walk(value, 0));
  } catch {
    return UNSUPPORTED;
  }
}

function cloneArgs(args: unknown[]): unknown[] {
  return JSON.parse(JSON.stringify(args)) as unknown[];
}

function runOneTest(problem: OaProblem, code: string, args: unknown[], expected: unknown): TestRun {
  const context = vm.createContext({});
  const wrapper = `"use strict";\n(() => {\n${code}\n; globalThis.__candidate = typeof ${problem.functionName} === "function" ? ${problem.functionName} : null;\n})();`;

  try {
    vm.runInContext(wrapper, context, { timeout: TEST_TIMEOUT_MS });
  } catch (error) {
    return { passed: false, error: truncateError(error) };
  }

  const candidate = context.__candidate;
  if (typeof candidate !== "function") {
    return {
      passed: false,
      error: "Define a function named " + problem.functionName + ".",
    };
  }

  context.__args = cloneArgs(args);
  try {
    vm.runInContext("globalThis.__result = globalThis.__candidate.apply(null, globalThis.__args);", context, {
      timeout: TEST_TIMEOUT_MS,
    });
  } catch (error) {
    return { passed: false, error: truncateError(error) };
  }

  const actual = context.__result;
  let actualCanonical: string;
  try {
    actualCanonical = canonicalResult(actual);
  } catch (error) {
    return { passed: false, error: truncateError(error) };
  }
  const expectedCanonical = canonicalResult(expected);
  return { passed: actualCanonical === expectedCanonical, error: null };
}

export function markProblem(problem: OaProblem, code: string): ProblemMark {
  const trimmed = code.trim();
  if (!trimmed) {
    return {
      problemId: problem.id,
      title: problem.title,
      passed: 0,
      total: problem.testCases.length,
      error: "No code submitted.",
    };
  }
  if (trimmed.length > MAX_CODE_LENGTH) {
    return {
      problemId: problem.id,
      title: problem.title,
      passed: 0,
      total: problem.testCases.length,
      error: "Code is too long. Keep it under " + MAX_CODE_LENGTH.toLocaleString("en-US") + " characters.",
    };
  }

  let passed = 0;
  let firstError: string | null = null;
  for (const test of problem.testCases) {
    const run = runOneTest(problem, trimmed, test.args, test.expected);
    if (run.passed) {
      passed += 1;
    } else if (!firstError) {
      firstError = run.error ?? "A test did not match the expected result.";
    }
  }

  return {
    problemId: problem.id,
    title: problem.title,
    passed,
    total: problem.testCases.length,
    error: firstError,
  };
}

export function markSubmissions(
  problems: OaProblem[],
  submissions: OaSubmissions,
): OaMarking {
  const marks = problems.map((problem) => markProblem(problem, submissions[problem.id] ?? ""));
  const passedTests = marks.reduce((total, mark) => total + mark.passed, 0);
  const totalTests = marks.reduce((total, mark) => total + mark.total, 0);
  return {
    score: totalTests === 0 ? 0 : Math.round((passedTests / totalTests) * 100),
    passedTests,
    totalTests,
    problems: marks,
  };
}

/** Runs only the public examples. Used by the "Run examples" control. */
export function checkExamples(problem: OaProblem, code: string): ProblemMark {
  const examples = problem.testCases.filter((test) => !test.hidden);
  const trimmed = code.trim();
  if (!trimmed) {
    return { problemId: problem.id, title: problem.title, passed: 0, total: examples.length, error: "No code submitted." };
  }
  if (trimmed.length > MAX_CODE_LENGTH) {
    return { problemId: problem.id, title: problem.title, passed: 0, total: examples.length, error: "Code is too long." };
  }
  let passed = 0;
  let firstError: string | null = null;
  for (const test of examples) {
    const run = runOneTest(problem, trimmed, test.args, test.expected);
    if (run.passed) {
      passed += 1;
    } else if (!firstError) {
      firstError = run.error ?? "A sample did not match the expected result.";
    }
  }
  return {
    problemId: problem.id,
    title: problem.title,
    passed,
    total: examples.length,
    error: firstError,
  };
}
