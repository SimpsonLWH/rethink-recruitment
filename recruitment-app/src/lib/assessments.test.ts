import { describe, expect, it } from "vitest";
import {
  assertCompleteAnswers,
  attemptState,
  bestScore,
  cooldownUntil,
  parseQuestionBank,
  publicQuestions,
  scoreAnswers,
  seededRandom,
  selectQuestionIds,
  type AssessmentQuestion,
} from "./assessments";

function question(id: string, correct = "b"): AssessmentQuestion {
  return {
    id,
    prompt: "Question " + id,
    options: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
      { id: "d", label: "D" },
    ],
    correctOptionId: correct,
    explanation: "Because B is the answer.",
  };
}

const bank = [question("q1"), question("q2"), question("q3"), question("q4"), question("q5"), question("q6")];

describe("assessment question handling", () => {
  it("parses a valid bank and drops malformed questions", () => {
    const parsed = parseQuestionBank(
      JSON.stringify([
        ...bank,
        { id: "bad", prompt: "No options", options: [], correctOptionId: "a" },
        { id: "bad2", prompt: "Unknown correct", options: [{ id: "a", label: "A" }], correctOptionId: "b" },
      ]),
    );
    expect(parsed).toHaveLength(6);
    expect(parsed[0].id).toBe("q1");
  });

  it("returns public questions without answer keys or explanations", () => {
    const publicList = publicQuestions(bank, ["q1", "q3"]);
    expect(publicList).toHaveLength(2);
    expect(publicList[0]).not.toHaveProperty("correctOptionId");
    expect(publicList[0]).not.toHaveProperty("explanation");
  });

  it("selects the requested number without duplicates", () => {
    const random = seededRandom("demo");
    const ids = selectQuestionIds(bank, 4, random);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(selectQuestionIds(bank, 4, seededRandom("demo"))).toEqual(ids);
  });

  it("scores only the presented questions and requires complete answers", () => {
    const complete = assertCompleteAnswers(["q1", "q2"], { q1: "b", q2: "b" });
    expect(complete.ok).toBe(true);
    const missing = assertCompleteAnswers(["q1", "q2"], { q1: "b" });
    expect(missing).toEqual({ ok: false, missing: ["q2"] });
    const score = scoreAnswers(bank, ["q1", "q2", "q3"], { q1: "b", q2: "a", q3: "b" });
    expect(score.correctCount).toBe(2);
    expect(score.total).toBe(3);
    expect(score.score).toBe(67);
  });

  it("applies the cooldown and attempt limit", () => {
    const now = new Date("2026-11-14T12:00:00.000Z");
    const ready = attemptState({
      attemptCount: 0,
      retakeLimit: 1,
      latestSubmittedAt: null,
      cooldownHours: 24,
      now,
    });
    expect(ready.allowed).toBe(true);
    expect(ready.nextAttemptNumber).toBe(1);

    const cooling = attemptState({
      attemptCount: 1,
      retakeLimit: 1,
      latestSubmittedAt: "2026-11-14T10:00:00.000Z",
      cooldownHours: 24,
      now,
    });
    expect(cooling.allowed).toBe(false);
    expect(cooling.reason).toBe("cooldown");
    expect(cooling.cooldownUntil).toBe("2026-11-15T10:00:00.000Z");

    const limited = attemptState({
      attemptCount: 2,
      retakeLimit: 1,
      latestSubmittedAt: "2026-11-13T10:00:00.000Z",
      cooldownHours: 24,
      now,
    });
    expect(limited.allowed).toBe(false);
    expect(limited.reason).toBe("limit");
  });

  it("uses the best score without comparing assessments", () => {
    expect(bestScore([0, 62, 84, null])).toBe(84);
    expect(bestScore([null, undefined])).toBeNull();
    expect(cooldownUntil("2026-11-14T10:00:00.000Z", 24)?.toISOString()).toBe("2026-11-15T10:00:00.000Z");
  });
});
