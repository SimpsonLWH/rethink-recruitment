/**
 * Deterministic assessment rules. No model call, network call or hidden
 * ranking lives here: questions are drawn from a pool, answers are checked
 * server-side, and the score belongs to one assessment version only.
 */

export type AssessmentDifficulty = "EASY" | "MEDIUM" | "ADVANCED";

export interface AssessmentOption {
  id: string;
  label: string;
}

export interface AssessmentQuestion {
  id: string;
  prompt: string;
  options: AssessmentOption[];
  correctOptionId: string;
  explanation: string;
}

export interface PublicAssessmentQuestion {
  id: string;
  prompt: string;
  options: AssessmentOption[];
}

export type AssessmentAnswers = Record<string, string>;

export interface ScoredQuestion {
  questionId: string;
  prompt: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  correct: boolean;
  explanation: string;
}

export interface AssessmentScore {
  score: number;
  correctCount: number;
  total: number;
  questions: ScoredQuestion[];
}

export interface AttemptStateInput {
  attemptCount: number;
  retakeLimit: number;
  latestSubmittedAt: string | Date | null;
  cooldownHours: number;
  now?: Date;
}

export interface AttemptState {
  allowed: boolean;
  reason: "ready" | "cooldown" | "limit";
  cooldownUntil: string | null;
  nextAttemptNumber: number;
}

const DIFFICULTIES: AssessmentDifficulty[] = ["EASY", "MEDIUM", "ADVANCED"];

export function isAssessmentDifficulty(value: string): value is AssessmentDifficulty {
  return DIFFICULTIES.includes(value as AssessmentDifficulty);
}

export function parseQuestionBank(json: string | null | undefined): AssessmentQuestion[] {
  if (!json) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  const questions: AssessmentQuestion[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.prompt !== "string") continue;
    if (!Array.isArray(record.options) || record.options.length < 2) continue;
    const options: AssessmentOption[] = [];
    for (const option of record.options) {
      if (!option || typeof option !== "object") continue;
      const optionRecord = option as Record<string, unknown>;
      if (typeof optionRecord.id !== "string" || typeof optionRecord.label !== "string") continue;
      options.push({ id: optionRecord.id, label: optionRecord.label });
    }
    if (options.length < 2) continue;
    if (typeof record.correctOptionId !== "string" || !options.some((option) => option.id === record.correctOptionId)) {
      continue;
    }
    questions.push({
      id: record.id,
      prompt: record.prompt,
      options,
      correctOptionId: record.correctOptionId,
      explanation: typeof record.explanation === "string" ? record.explanation : "",
    });
  }
  return questions;
}

export function publicQuestion(question: AssessmentQuestion): PublicAssessmentQuestion {
  return { id: question.id, prompt: question.prompt, options: question.options };
}

export function publicQuestions(
  questions: AssessmentQuestion[],
  presentedQuestionIds: string[],
): PublicAssessmentQuestion[] {
  const byId = new Map(questions.map((question) => [question.id, question] as const));
  return presentedQuestionIds
    .map((id) => byId.get(id))
    .filter((question): question is AssessmentQuestion => Boolean(question))
    .map(publicQuestion);
}

function mulberry32(seed: number) {
  let value = seed >>> 0;
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
 * Draws a random subset of questions. The caller supplies the random source so
 * tests can be deterministic; the API uses crypto randomness.
 */
export function selectQuestionIds(
  questions: AssessmentQuestion[],
  count: number,
  random: () => number = Math.random,
): string[] {
  const pool = questions.slice();
  for (let index = pool.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = pool[index];
    pool[index] = pool[swapIndex];
    pool[swapIndex] = current;
  }
  return pool.slice(0, Math.max(0, Math.min(count, pool.length))).map((question) => question.id);
}

export function scoreAnswers(
  questions: AssessmentQuestion[],
  presentedQuestionIds: string[],
  answers: AssessmentAnswers,
): AssessmentScore {
  const byId = new Map(questions.map((question) => [question.id, question] as const));
  const scored: ScoredQuestion[] = [];
  for (const questionId of presentedQuestionIds) {
    const question = byId.get(questionId);
    if (!question) continue;
    const selectedOptionId = answers[questionId] ?? null;
    const correct = selectedOptionId === question.correctOptionId;
    scored.push({
      questionId,
      prompt: question.prompt,
      selectedOptionId,
      correctOptionId: question.correctOptionId,
      correct,
      explanation: question.explanation,
    });
  }
  const total = scored.length;
  const correctCount = scored.filter((entry) => entry.correct).length;
  return {
    score: total === 0 ? 0 : Math.round((correctCount / total) * 100),
    correctCount,
    total,
    questions: scored,
  };
}

export function assertCompleteAnswers(
  presentedQuestionIds: string[],
  answers: AssessmentAnswers,
): { ok: true } | { ok: false; missing: string[] } {
  const missing = presentedQuestionIds.filter((questionId) => !answers[questionId]);
  return missing.length ? { ok: false, missing } : { ok: true };
}

function asDate(value: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function cooldownUntil(latestSubmittedAt: string | Date | null, cooldownHours: number): Date | null {
  const latest = asDate(latestSubmittedAt);
  if (!latest) return null;
  return new Date(latest.getTime() + Math.max(0, cooldownHours) * 60 * 60 * 1000);
}

export function attemptState(input: AttemptStateInput): AttemptState {
  const now = input.now ?? new Date();
  const nextAttemptNumber = input.attemptCount + 1;
  const latest = asDate(input.latestSubmittedAt);
  const until = cooldownUntil(latest, input.cooldownHours);

  if (input.attemptCount > input.retakeLimit) {
    return {
      allowed: false,
      reason: "limit",
      cooldownUntil: until?.toISOString() ?? null,
      nextAttemptNumber,
    };
  }
  if (input.attemptCount > 0 && until && now.getTime() < until.getTime()) {
    return {
      allowed: false,
      reason: "cooldown",
      cooldownUntil: until.toISOString(),
      nextAttemptNumber,
    };
  }
  return {
    allowed: true,
    reason: "ready",
    cooldownUntil: until?.toISOString() ?? null,
    nextAttemptNumber,
  };
}

export function bestScore(scores: Array<number | null | undefined>): number | null {
  const valid = scores.filter((score): score is number => typeof score === "number");
  return valid.length ? Math.max(...valid) : null;
}

/** Deterministic RNG for tests and composed feed ordering. */
export function seededRandom(seed: string | number): () => number {
  const numericSeed = typeof seed === "number" ? seed : hashString(seed);
  return mulberry32(numericSeed);
}
