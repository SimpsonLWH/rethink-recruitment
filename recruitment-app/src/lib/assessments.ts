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

/**
 * How a question is answered.
 * - code: write one JavaScript function, marked against test cases.
 * - choice: pick one option; the answer key is a hidden test case.
 * - numeric: type a number (decimals or a simple fraction); marked with a tolerance.
 */
export type OaProblemKind = "code" | "choice" | "numeric";

/**
 * Integrity mode for a sitting.
 * - NONE: no monitoring.
 * - PROCTORED: browser events (tab switches, focus loss, fullscreen exits,
 *   paste attempts) are logged and shown to the reviewing employer.
 * - LOCKDOWN: proctored, plus fullscreen is required, copy/paste and the
 *   context menu are blocked, and repeated violations submit the sitting.
 * Neither mode uses the camera or microphone, and neither is a secure exam
 * browser: a determined person can still use a second device.
 */
export type ProctoringMode = "NONE" | "PROCTORED" | "LOCKDOWN";

export const PROCTORING_MODES: ProctoringMode[] = ["NONE", "PROCTORED", "LOCKDOWN"];

export function isProctoringMode(value: unknown): value is ProctoringMode {
  return typeof value === "string" && PROCTORING_MODES.includes(value as ProctoringMode);
}

/** Lockdown submits the sitting automatically after this many violations. */
export const LOCKDOWN_MAX_VIOLATIONS = 3;
/** Seconds of grace after a timer reaches zero before a submission is flagged late. */
export const TIMER_GRACE_SECONDS = 90;

export type IntegrityEventType =
  | "tab_hidden"
  | "window_blur"
  | "fullscreen_exit"
  | "paste_blocked"
  | "copy_blocked"
  | "context_menu"
  | "devtools_key";

export const INTEGRITY_EVENT_TYPES: IntegrityEventType[] = [
  "tab_hidden",
  "window_blur",
  "fullscreen_exit",
  "paste_blocked",
  "copy_blocked",
  "context_menu",
  "devtools_key",
];

/** Events that count towards the lockdown violation limit. */
export const VIOLATION_EVENTS: IntegrityEventType[] = ["tab_hidden", "fullscreen_exit"];

export const INTEGRITY_EVENT_LABELS: Record<IntegrityEventType, string> = {
  tab_hidden: "Left the test tab",
  window_blur: "Window lost focus",
  fullscreen_exit: "Exited fullscreen",
  paste_blocked: "Paste attempt",
  copy_blocked: "Copy attempt",
  context_menu: "Right-click menu",
  devtools_key: "Developer-tools shortcut",
};

export interface IntegrityEvent {
  type: IntegrityEventType;
  /** Seconds since the sitting started. */
  atSeconds: number;
}

/** What the browser reports with a submission. Never trusted for the score. */
export interface IntegrityReport {
  events: IntegrityEvent[];
  autoSubmitted: boolean;
  reason: "time" | "violations" | null;
}

/** What the server stores and shows to the reviewing employer. */
export interface IntegritySummary {
  mode: ProctoringMode;
  durationMinutes: number;
  elapsedSeconds: number;
  overTime: boolean;
  counts: Partial<Record<IntegrityEventType, number>>;
  violations: number;
  autoSubmitted: boolean;
  reason: "time" | "violations" | null;
  events: IntegrityEvent[];
}

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
  kind: OaProblemKind;
  title: string;
  difficulty: AssessmentDifficulty;
  statement: string;
  /** Code questions only; empty for choice and numeric questions. */
  functionName: string;
  starterCode: string;
  /** Choice questions only. */
  options?: string[];
  /** Numeric questions only: absolute tolerance. */
  tolerance?: number;
  testCases: OaTestCase[];
}

export interface PublicOaExample {
  args: unknown[];
  expected: unknown;
}

export interface PublicOaProblem {
  id: string;
  kind: OaProblemKind;
  options: string[];
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
    const kind: OaProblemKind =
      record.kind === "choice" || record.kind === "numeric" ? record.kind : "code";
    if (typeof record.id !== "string" || typeof record.title !== "string" || typeof record.statement !== "string") {
      continue;
    }
    if (
      kind === "code" &&
      (typeof record.functionName !== "string" ||
        !FUNCTION_NAME.test(record.functionName) ||
        typeof record.starterCode !== "string")
    ) {
      continue;
    }
    const options =
      kind === "choice" && Array.isArray(record.options)
        ? record.options.filter((option): option is string => typeof option === "string")
        : undefined;
    if (kind === "choice" && (!options || options.length < 2)) continue;
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
      kind,
      title: record.title,
      difficulty,
      statement: record.statement,
      functionName: kind === "code" ? String(record.functionName) : "",
      starterCode: kind === "code" ? String(record.starterCode) : "",
      ...(options ? { options } : {}),
      ...(kind === "numeric" && typeof record.tolerance === "number" && record.tolerance >= 0
        ? { tolerance: record.tolerance }
        : {}),
      testCases,
    });
  }
  return problems;
}

export function publicProblem(problem: OaProblem): PublicOaProblem {
  return {
    id: problem.id,
    kind: problem.kind,
    options: problem.kind === "choice" ? problem.options ?? [] : [],
    title: problem.title,
    difficulty: problem.difficulty,
    statement: problem.statement,
    functionName: problem.functionName,
    starterCode: problem.starterCode,
    // Choice and numeric answer keys are never public, even if a seed marks them so.
    examples:
      problem.kind === "code"
        ? problem.testCases
            .filter((test) => !test.hidden)
            .map((test) => ({ args: test.args, expected: test.expected }))
        : [],
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

/**
 * Builds the stored integrity summary from the browser's report and the
 * server clock. The score never depends on it; it is context for a human.
 */
export function summariseIntegrity(input: {
  mode: ProctoringMode;
  durationMinutes: number;
  startedAt: Date;
  submittedAt: Date;
  report: IntegrityReport | null;
}): IntegritySummary | null {
  if (input.mode === "NONE" && input.durationMinutes <= 0) return null;
  const elapsedSeconds = Math.max(0, Math.round((input.submittedAt.getTime() - input.startedAt.getTime()) / 1000));
  const events = (input.report?.events ?? [])
    .filter((event) => INTEGRITY_EVENT_TYPES.includes(event.type))
    .slice(0, 200)
    .map((event) => ({
      type: event.type,
      atSeconds: Math.max(0, Math.min(Math.round(event.atSeconds), 24 * 3600)),
    }));
  const counts: Partial<Record<IntegrityEventType, number>> = {};
  for (const event of events) counts[event.type] = (counts[event.type] ?? 0) + 1;
  const violations = events.filter((event) => VIOLATION_EVENTS.includes(event.type)).length;
  const overTime =
    input.durationMinutes > 0 && elapsedSeconds > input.durationMinutes * 60 + TIMER_GRACE_SECONDS;
  return {
    mode: input.mode,
    durationMinutes: input.durationMinutes,
    elapsedSeconds,
    overTime,
    counts,
    violations,
    autoSubmitted: Boolean(input.report?.autoSubmitted),
    reason: input.report?.reason === "time" || input.report?.reason === "violations" ? input.report.reason : null,
    events: input.mode === "NONE" ? [] : events,
  };
}

export function parseIntegritySummary(json: string | null | undefined): IntegritySummary | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Partial<IntegritySummary>;
    if (!parsed || !isProctoringMode(parsed.mode) || typeof parsed.elapsedSeconds !== "number") return null;
    return {
      mode: parsed.mode,
      durationMinutes: typeof parsed.durationMinutes === "number" ? parsed.durationMinutes : 0,
      elapsedSeconds: parsed.elapsedSeconds,
      overTime: Boolean(parsed.overTime),
      counts: parsed.counts && typeof parsed.counts === "object" ? parsed.counts : {},
      violations: typeof parsed.violations === "number" ? parsed.violations : 0,
      autoSubmitted: Boolean(parsed.autoSubmitted),
      reason: parsed.reason === "time" || parsed.reason === "violations" ? parsed.reason : null,
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return null;
  }
}

/** One plain line for a reviewer. Advisory: it never changes a score or a decision. */
export function integrityLine(summary: IntegritySummary | null): string | null {
  if (!summary) return null;
  const parts: string[] = [];
  if (summary.mode === "LOCKDOWN") parts.push("Lockdown");
  else if (summary.mode === "PROCTORED") parts.push("Proctored");
  if (summary.durationMinutes > 0) {
    const minutes = Math.max(1, Math.round(summary.elapsedSeconds / 60));
    parts.push(minutes + " of " + summary.durationMinutes + " min");
  }
  if (summary.mode !== "NONE") {
    const flagged = Object.values(summary.counts).reduce((total, count) => total + (count ?? 0), 0);
    parts.push(flagged === 0 ? "no events flagged" : flagged + (flagged === 1 ? " event flagged" : " events flagged"));
  }
  if (summary.overTime) parts.push("submitted after the time limit");
  if (summary.autoSubmitted) {
    parts.push(summary.reason === "violations" ? "auto-submitted after lockdown warnings" : "auto-submitted at time");
  }
  return parts.join(" · ");
}

/** Parses "0.25", "-3", "1/4" or "25%" into a number. Returns null for anything else. */
export function parseNumericAnswer(raw: string): number | null {
  const value = raw.trim().replace(/,/g, "");
  if (!value) return null;
  const percent = /^(-?\d+(?:\.\d+)?)%$/.exec(value);
  if (percent) return Number(percent[1]) / 100;
  const fraction = /^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(value);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator === 0 ? null : Number(fraction[1]) / denominator;
  }
  if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
