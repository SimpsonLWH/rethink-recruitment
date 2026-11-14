"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AssessmentAttemptView } from "@/lib/repo";

interface SubmissionResult {
  score: number;
  correctCount: number;
  total: number;
  questions: Array<{
    questionId: string;
    prompt: string;
    selectedOptionId: string | null;
    correctOptionId: string;
    correct: boolean;
    explanation: string;
  }>;
}

export function AssessmentRunner({ attempt }: { attempt: AssessmentAttemptView }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const current = attempt.questions[index];
  const answered = useMemo(() => Object.keys(answers).length, [answers]);
  const allAnswered = answered === attempt.questions.length;

  async function submit() {
    if (busy || !allAnswered) return;
    setBusy(true);
    try {
      const response = await fetch("/api/assessments/attempts/" + attempt.id + "/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = (await response.json()) as SubmissionResult & { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not submit that attempt.");
        return;
      }
      setResult(data);
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl" data-testid="assessment-result">
        <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Result recorded</p>
          <h2 className="mt-3 font-display text-[44px] leading-none">{result.score}/100</h2>
          <p className="mt-3 text-[14px] leading-6 text-ink-muted">
            {result.correctCount} of {result.total} correct · {attempt.assessment.family} {attempt.assessment.version} ·{" "}
            {attempt.assessment.difficulty.toLowerCase()}
          </p>
          <p className="mt-2 text-[12px] leading-5 text-ink-faint">
            This is one assessment result, not a universal score or a match percentage. It is only comparable with the
            same family, version and difficulty.
          </p>
          <div className="mt-6 space-y-3">
            {result.questions.map((question, questionIndex) => (
              <div key={question.questionId} className="rounded-2xl border border-line bg-paper p-4">
                <p className="text-[13px] font-medium leading-6 text-ink">
                  {questionIndex + 1}. {question.prompt}
                </p>
                <p className={question.correct ? "mt-2 text-[12px] text-accent" : "mt-2 text-[12px] text-ink-muted"}>
                  {question.correct ? "Correct" : "Not quite"}: {question.explanation}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/assessments" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">
              Back to assessments <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/discover" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-[12px] font-medium text-ink">
              See role evidence
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="mx-auto max-w-2xl" data-testid="assessment-runner">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            {attempt.assessment.family} · {attempt.assessment.version} · {attempt.assessment.difficulty.toLowerCase()}
          </p>
          <p className="mt-1 text-[12px] text-ink-faint">
            Question {index + 1} of {attempt.questions.length} · no timer, no proctoring
          </p>
        </div>
        <p className="text-[12px] text-ink-faint">{answered}/{attempt.questions.length} answered</p>
      </div>

      <div className="mt-6 rounded-[24px] border border-line bg-surface p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Question {index + 1}</p>
        <h2 className="mt-3 text-[20px] leading-8 text-ink">{current.prompt}</h2>
        <div className="mt-6 space-y-2.5">
          {current.options.map((option) => {
            const selected = answers[current.id] === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setAnswers((previous) => ({ ...previous, [current.id]: option.id }))}
                className={
                  selected
                    ? "flex w-full items-start gap-3 rounded-2xl border border-accent bg-accent-tint px-4 py-3 text-left text-[14px] leading-6 text-ink"
                    : "flex w-full items-start gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-left text-[14px] leading-6 text-ink-soft transition hover:border-line-strong"
                }
                data-testid={"assessment-option-" + option.id}
              >
                <span className={selected ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white" : "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink-faint"}>
                  {selected ? <Check className="h-3 w-3" /> : null}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={index === 0 || busy}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
        >
          Back
        </Button>
        {index < attempt.questions.length - 1 ? (
          <Button
            variant="primary"
            size="sm"
            disabled={!answers[current.id]}
            onClick={() => setIndex((value) => Math.min(attempt.questions.length - 1, value + 1))}
            data-testid="assessment-next"
          >
            Next question <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            disabled={busy || !allAnswered}
            onClick={() => void submit()}
            data-testid="assessment-submit"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Submit assessment
          </Button>
        )}
      </div>
      <p className="mt-4 text-center text-[11px] leading-5 text-ink-faint">
        Synthetic demo assessment. It is not proctored, validated or a substitute for a human decision.
      </p>
    </div>
  );
}
