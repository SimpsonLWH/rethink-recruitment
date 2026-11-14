"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, Code2, Loader2, Play, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AssessmentAttemptView, AssessmentSubmissionView } from "@/lib/repo";
import type { OaMarking, ProblemMark, PublicOaProblem } from "@/lib/assessments";

interface CheckResult {
  result: ProblemMark;
}

function signatureLabel(problem: PublicOaProblem) {
  const firstLine = problem.starterCode.split("\n")[0] ?? "";
  return firstLine.replace(/\s*\{\s*$/, "");
}

function valueLabel(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function markTone(mark: ProblemMark) {
  if (mark.total === 0) return "neutral";
  if (mark.passed === mark.total) return "pass";
  if (mark.passed > 0) return "partial";
  return "fail";
}

function MarkBadge({ mark }: { mark: ProblemMark }) {
  const tone = markTone(mark);
  const label = tone === "pass" ? "Passed" : tone === "partial" ? "Partial" : "Failed";
  const Icon = tone === "pass" ? CheckCircle2 : XCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
        tone === "pass" ? "bg-emerald-100 text-emerald-800" : tone === "partial" ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-900",
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

function ResultView({
  attempt,
  marking,
}: {
  attempt: AssessmentAttemptView;
  marking: OaMarking;
}) {
  const passed = marking.problems.reduce((total, mark) => total + mark.passed, 0);
  const total = marking.problems.reduce((total, mark) => total + mark.total, 0);
  const hasBreakdown = marking.problems.length > 0 && total > 0;
  return (
    <div className="mx-auto max-w-3xl" data-testid="assessment-result">
      <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Final assessment score</p>
            <h2 className="mt-3 font-display text-[64px] leading-none tracking-[-0.06em]">{marking.score}<span className="text-[28px] text-ink-faint">/100</span></h2>
            <p className="mt-3 text-[14px] leading-6 text-ink-muted">
              {attempt.assessment.family} {attempt.assessment.version} · {attempt.assessment.difficulty.toLowerCase()}
              {hasBreakdown ? " · " + passed + " of " + total + " test cases passed" : ""}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-paper px-4 py-3 text-right">
            <p className="flex items-center justify-end gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
              Closed
            </p>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">Final for this cycle</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-accent/25 bg-accent-tint p-4 text-[12px] leading-5 text-ink-soft">
          <span className="font-medium text-ink">No retake.</span> This score is now the assessment evidence on your
          profile for this recruiting cycle. A below-bar score stays visible to recruiters in the secondary review view;
          it does not auto-reject you, and it does not reopen this assessment.
        </div>

        {hasBreakdown ? (
          <div className="mt-6 space-y-3">
            {marking.problems.map((mark, index) => (
              <div key={mark.problemId} className="rounded-2xl border border-line bg-paper p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-6 text-ink">
                      {index + 1}. {mark.title}
                    </p>
                    <p className="mt-1 text-[12px] text-ink-muted">
                      {mark.passed} of {mark.total} tests passed
                    </p>
                  </div>
                  <MarkBadge mark={mark} />
                </div>
                {mark.error ? (
                  <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-[11px] leading-5 text-ink-muted">
                    First failing test: {mark.error}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-line bg-paper p-4 text-[12px] leading-5 text-ink-muted">
            Per-problem breakdown is not available for this seeded result. The score is recorded against the exact
            assessment version.
          </p>
        )}

        <p className="mt-4 text-[11px] leading-5 text-ink-faint">
          Hidden tests are not shown. Scores are not comparable across families, versions or difficulties.
        </p>

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

export function AssessmentRunner({
  attempt,
  embedded = false,
}: {
  attempt: AssessmentAttemptView;
  embedded?: boolean;
}) {
  const [problemIndex, setProblemIndex] = useState(0);
  const [submissions, setSubmissions] = useState<Record<string, string>>(() =>
    Object.fromEntries(attempt.problems.map((problem) => [problem.id, problem.starterCode])),
  );
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submission, setSubmission] = useState<AssessmentSubmissionView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const current = attempt.problems[problemIndex];
  const draftKey = "rivet-oa-draft-" + attempt.id;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(draftKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        const next: Record<string, string> = {};
        for (const problem of attempt.problems) {
          const value = parsed[problem.id];
          next[problem.id] = typeof value === "string" ? value : problem.starterCode;
        }
        setSubmissions(next);
      }
    } catch {
      // A missing or malformed draft should not block the attempt.
    }
    setDraftLoaded(true);
  }, [attempt.problems, draftKey]);

  useEffect(() => {
    if (!draftLoaded) return;
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(submissions));
    } catch {
      // Storage can be unavailable; the attempt still works for this session.
    }
  }, [draftKey, draftLoaded, submissions]);

  const allWritten = useMemo(
    () => attempt.problems.every((problem) => Boolean((submissions[problem.id] ?? "").trim())),
    [attempt.problems, submissions],
  );

  if (attempt.submittedAt && attempt.marking) {
    return <ResultView attempt={attempt} marking={attempt.marking} />;
  }

  if (submission) {
    return <ResultView attempt={attempt} marking={submission.marking} />;
  }

  if (!current) return null;

  function updateCode(code: string) {
    if (!current) return;
    setSubmissions((previous) => ({ ...previous, [current.id]: code }));
    setCheck(null);
  }

  function resetProblem() {
    if (!current) return;
    updateCode(current.starterCode);
    toast.success("Starter code restored for this problem.");
  }

  async function runExamples() {
    if (!current || checking || busy) return;
    setChecking(true);
    setError(null);
    try {
      const response = await fetch("/api/assessments/attempts/" + attempt.id + "/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ problemId: current.id, code: submissions[current.id] ?? "" }),
      });
      const data = (await response.json()) as CheckResult & { error?: string };
      if (!response.ok || !data.result) {
        toast.error(data.error ?? "Could not run the examples.");
        return;
      }
      setCheck(data);
    } catch {
      toast.error("Network hiccup. Try running the examples again.");
    } finally {
      setChecking(false);
    }
  }

  async function submitFinal() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/assessments/attempts/" + attempt.id + "/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submissions, assessmentId: attempt.assessment.id }),
      });
      const data = (await response.json()) as AssessmentSubmissionView & { error?: string };
      if (!response.ok || !data.marking) {
        setError(data.error ?? "Could not submit that attempt.");
        setConfirmOpen(false);
        return;
      }
      setSubmission(data);
      setConfirmOpen(false);
      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        // Ignore storage cleanup failures.
      }
    } catch {
      setError("Network hiccup. Your attempt is still open; try again.");
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  function onEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const nextCode = target.value.slice(0, start) + "  " + target.value.slice(end);
    updateCode(nextCode);
    window.requestAnimationFrame(() => {
      target.selectionStart = start + 2;
      target.selectionEnd = start + 2;
    });
  }

  return (
    <div className="animate-fade-up" data-testid="assessment-runner">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            {attempt.assessment.family} · {attempt.assessment.version} · {attempt.assessment.difficulty.toLowerCase()}
          </p>
          <h1 className="mt-2 font-display text-[34px] leading-none tracking-[-0.04em]">{attempt.assessment.title}</h1>
          <p className="mt-2 text-[12px] leading-5 text-ink-muted">
            One attempt. No retake. Hidden tests run when you submit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!embedded ? (
            <Link href="/assessments" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[12px] font-medium text-ink-muted">
              <ArrowLeft className="h-3.5 w-3.5" /> Leave
            </Link>
          ) : null}
          <Button variant="primary" size="md" onClick={() => setConfirmOpen(true)} disabled={busy || !allWritten} data-testid="assessment-submit">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {busy ? "Marking..." : "Submit final answers"}
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {attempt.problems.map((problem, index) => {
            const answered = Boolean((submissions[problem.id] ?? "").trim());
            return (
              <button
                key={problem.id}
                type="button"
                onClick={() => {
                  setProblemIndex(index);
                  setCheck(null);
                }}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[12px] font-medium transition",
                  index === problemIndex
                    ? "border-accent bg-accent-tint text-accent-deep"
                    : "border-line bg-surface text-ink-muted hover:border-line-strong",
                )}
                data-testid={"problem-tab-" + index}
              >
                <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[10px]", answered ? "bg-accent text-white" : "border border-line-strong text-ink-faint")}>
                  {answered ? <Check className="h-2.5 w-2.5" /> : index + 1}
                </span>
                Problem {index + 1}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-ink-faint">
          Draft saved in this browser. The attempt is not marked until you submit.
        </p>
      </div>

      {error ? (
        <div role="alert" className="mt-4 rounded-xl border border-rose-300/70 bg-rose-50 px-4 py-3 text-[12px] leading-5 text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
        <section className="rounded-[22px] border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Problem {problemIndex + 1} of {attempt.problems.length}
              </p>
              <h2 className="mt-2 text-[20px] font-semibold leading-snug text-ink">{current.title}</h2>
            </div>
            <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              {current.difficulty.toLowerCase()}
            </span>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-[13px] leading-6 text-ink-soft">{current.statement}</p>

          <div className="mt-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
              <Code2 className="h-3.5 w-3.5" /> Signature
            </p>
            <pre className="mt-2 overflow-x-auto rounded-xl border border-line bg-paper px-3 py-2 font-mono text-[12px] leading-5 text-ink">
              {signatureLabel(current)}
            </pre>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Public examples</p>
            <div className="mt-2 space-y-2">
              {current.examples.map((example, index) => (
                <div key={index} className="rounded-xl border border-line bg-paper p-3 font-mono text-[11px] leading-5 text-ink-soft">
                  <p className="text-ink-faint">Call {index + 1}</p>
                  <p className="mt-0.5 break-words">{current.functionName}({example.args.map(valueLabel).join(", ")})</p>
                  <p className="mt-1 text-ink-faint">expected</p>
                  <p className="break-words">{valueLabel(example.expected)}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-5 text-ink-faint">
              {current.testCount} {current.testCount === 1 ? "test" : "tests"} in total, including the public{" "}
              {current.examples.length === 1 ? "example" : "examples"}. Hidden tests are not shown.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border border-ink/15 bg-ink">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-medium text-paper/70">
              <Code2 className="h-3.5 w-3.5" />
              solution.js
            </div>
            <button
              type="button"
              onClick={resetProblem}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-medium text-paper/75 transition hover:border-white/30 hover:text-paper"
            >
              <RotateCcw className="h-3 w-3" /> Reset starter
            </button>
          </div>
          <textarea
            value={submissions[current.id] ?? ""}
            onChange={(event) => updateCode(event.target.value)}
            onKeyDown={onEditorKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={"Code for " + current.title}
            data-testid="assessment-code"
            className="block min-h-[360px] w-full resize-y border-0 bg-ink px-4 py-4 font-mono text-[13px] leading-6 text-paper outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70"
          />
          <div className="border-t border-white/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void runExamples()}
                disabled={checking || busy}
                data-testid="run-examples"
                className="border-white/20 bg-white/10 text-paper hover:border-white/35 hover:bg-white/15"
              >
                {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                {checking ? "Running..." : "Run public examples"}
              </Button>
              <p className="text-[11px] text-paper/55">Examples only. Hidden tests run on submit.</p>
            </div>
            {check ? (
              <div
                className={cn(
                  "mt-3 rounded-lg border px-3 py-2 text-[11px] leading-5",
                  check.result.passed === check.result.total
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                    : "border-amber-400/30 bg-amber-400/10 text-amber-100",
                )}
                data-testid="example-check-result"
              >
                {check.result.passed} of {check.result.total} public examples passed.
                {check.result.error ? " " + check.result.error : ""}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-line bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={problemIndex === 0}
            onClick={() => {
              setProblemIndex((value) => Math.max(0, value - 1));
              setCheck(null);
            }}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={problemIndex >= attempt.problems.length - 1}
            onClick={() => {
              setProblemIndex((value) => Math.min(attempt.problems.length - 1, value + 1));
              setCheck(null);
            }}
          >
            Next problem <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[11px] text-ink-faint">
            {allWritten ? "All problems have code." : "Write code for every problem to submit."}
          </p>
          <Button variant="primary" size="sm" onClick={() => setConfirmOpen(true)} disabled={busy || !allWritten}>
            Review and submit
          </Button>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] leading-5 text-ink-faint">
        Synthetic demo. Not proctored or validated. Code runs in a demo marker, not a real engineer-grade sandbox.
      </p>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent data-testid="submit-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Submit final answers?</DialogTitle>
            <DialogDescription>
              This is the only sitting for this assessment in the recruiting cycle. Marking runs immediately against
              hidden tests. You cannot reopen, edit or retake this attempt after you submit.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-accent/25 bg-accent-tint px-3.5 py-3 text-[12px] leading-5 text-ink-soft">
            {attempt.problems.length} problems · {attempt.assessment.family} {attempt.assessment.version} · score out of 100
          </div>
          <DialogFooter>
            <Button variant="secondary" size="md" onClick={() => setConfirmOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={() => void submitFinal()} disabled={busy} data-testid="confirm-submit">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {busy ? "Submitting..." : "Submit final answers"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
