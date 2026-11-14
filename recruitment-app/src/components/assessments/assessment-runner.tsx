"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  Expand,
  ListChecks,
  Loader2,
  Lock,
  Play,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Note } from "@/components/brand/note";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/assessments/code-editor";
import { IntegrityNote, ProctoringChip, proctoringLabel } from "@/components/assessments/integrity-badge";
import {
  enterFullscreen,
  formatClock,
  fullscreenSupported,
  leaveFullscreen,
  useCountdown,
  useProctor,
} from "@/components/assessments/use-proctor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { assessmentTitle, difficultyText, difficultyTone } from "@/lib/ui-copy";
import { cn } from "@/lib/utils";
import type { AssessmentAttemptView, AssessmentSubmissionView } from "@/lib/repo";
import {
  INTEGRITY_EVENT_LABELS,
  LOCKDOWN_MAX_VIOLATIONS,
  type IntegrityReport,
  type IntegritySummary,
  type OaMarking,
  type ProblemMark,
  type PublicOaProblem,
} from "@/lib/assessments";

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

function kindLabel(problem: PublicOaProblem) {
  if (problem.kind === "choice") return "Multiple choice";
  if (problem.kind === "numeric") return "Numeric answer";
  return "Coding";
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
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold",
        tone === "pass" ? "bg-emerald-100 text-emerald-800" : tone === "partial" ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-900",
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

function IntegrityDetail({ integrity }: { integrity: IntegritySummary }) {
  const entries = Object.entries(integrity.counts).filter(([, count]) => (count ?? 0) > 0);
  return (
    <div className="mt-6 rounded-lg border border-line bg-paper p-4" data-testid="integrity-detail">
      <p className="flex items-center gap-2 text-[12px] font-semibold text-ink">
        <ShieldCheck className="h-4 w-4 text-ink-muted" aria-hidden /> Sitting record · {proctoringLabel(integrity.mode)}
      </p>
      <IntegrityNote integrity={integrity} className="mt-1" />
      {entries.length > 0 ? (
        <ul className="mt-2 grid gap-1 text-[12px] text-ink-muted sm:grid-cols-2">
          {entries.map(([type, count]) => (
            <li key={type} className="flex justify-between rounded-md bg-surface px-2.5 py-1.5">
              <span>{INTEGRITY_EVENT_LABELS[type as keyof typeof INTEGRITY_EVENT_LABELS] ?? type}</span>
              <span className="font-medium tabular-nums text-ink">{count}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-[11px] leading-5 text-ink-faint">
        Shown to the employers you apply to as context for a human. It does not change your score and is not a
        cheating verdict.
      </p>
    </div>
  );
}

function ResultView({
  attempt,
  marking,
  integrity,
}: {
  attempt: AssessmentAttemptView;
  marking: OaMarking;
  integrity: IntegritySummary | null;
}) {
  const passed = marking.problems.reduce((total, mark) => total + mark.passed, 0);
  const total = marking.problems.reduce((total, mark) => total + mark.total, 0);
  const hasBreakdown = marking.problems.length > 0 && total > 0;
  return (
    <div className="mx-auto max-w-3xl" data-testid="assessment-result">
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="bg-navy px-6 py-5 text-white sm:px-8">
          <h1 className="sr-only">{assessmentTitle(attempt.assessment.title)} assessment result</h1>
          <p className="text-[12px] font-medium text-white/70">Test submitted · final score</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <p className="font-sans text-[56px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
              {marking.score}
              <span className="text-[24px] font-medium text-white/60">/100</span>
            </p>
            <div className="text-right">
              <p className="text-[14px] font-medium">{assessmentTitle(attempt.assessment.title)}</p>
              <p className="mt-0.5 text-[12px] text-white/70">
                Version {attempt.assessment.version}
                {hasBreakdown ? " · " + passed + " of " + total + " checks passed" : ""}
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-accent-bright" style={{ width: Math.max(2, marking.score) + "%" }} />
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <Note>
            <span className="font-medium text-ink">No retake.</span> This score is now the assessment evidence on your
            profile for this recruiting cycle. A below-bar score stays visible to recruiters in the secondary review
            view; it does not auto-reject you, and it does not reopen this assessment.
          </Note>

          {integrity ? <IntegrityDetail integrity={integrity} /> : null}

          {hasBreakdown ? (
            <div className="mt-6 divide-y divide-line overflow-hidden rounded-lg border border-line">
              {marking.problems.map((mark, index) => (
                <div key={mark.problemId} className="flex flex-wrap items-start justify-between gap-3 bg-surface p-4">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-6 text-ink">
                      Q{index + 1}. {mark.title}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {mark.total === 1 ? (mark.passed === 1 ? "Correct" : "Not correct") : mark.passed + " of " + mark.total + " tests passed"}
                    </p>
                    {mark.error && mark.total > 1 ? (
                      <p className="mt-1.5 rounded-md bg-paper px-2.5 py-1.5 text-[11px] leading-5 text-ink-muted">
                        First failing test: {mark.error}
                      </p>
                    ) : null}
                  </div>
                  <MarkBadge mark={mark} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-lg border border-line bg-paper p-4 text-[12px] leading-5 text-ink-muted">
              Per-problem breakdown is not available for this seeded result. The score is recorded against the exact
              assessment version.
            </p>
          )}

          <p className="mt-4 text-[11px] leading-5 text-ink-faint">
            Hidden tests and answer keys are not shown. Every question carries equal weight. Scores are not comparable
            across families, versions or difficulties.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/assessments" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-4 text-[13px] font-medium text-white hover:bg-accent-deep">
              Back to assessments <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/learn" className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line px-4 text-[13px] font-medium text-ink hover:bg-paper">
              Keep practising
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Preflight({
  attempt,
  onBegin,
  onExit,
}: {
  attempt: AssessmentAttemptView;
  onBegin: () => void;
  onExit?: () => void;
}) {
  const { assessment } = attempt;
  const lockdown = assessment.proctoring === "LOCKDOWN";
  const proctored = assessment.proctoring !== "NONE";
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const canFullscreen = useMemo(() => fullscreenSupported(), []);
  const resumed = Date.now() - new Date(attempt.startedAt).getTime() > 60_000;

  async function begin() {
    if (!agreed) return;
    setStarting(true);
    if (lockdown && canFullscreen) {
      const ok = await enterFullscreen();
      if (!ok) {
        toast.error("Fullscreen was blocked. Allow fullscreen for this site and try again.");
        setStarting(false);
        return;
      }
    }
    onBegin();
  }

  const rules: string[] = [];
  if (assessment.durationMinutes > 0) {
    rules.push(
      "You have " + assessment.durationMinutes + " minutes. The clock started when you opened this sitting" +
        (resumed ? " and is already running." : ".") +
        " Your answers submit automatically at zero.",
    );
  }
  if (lockdown) {
    rules.push("The test runs in fullscreen. Leaving fullscreen or switching tabs pauses the questions until you return.");
    rules.push(
      "Each time you leave counts as a warning. After " + LOCKDOWN_MAX_VIOLATIONS + " warnings your current answers are submitted automatically.",
    );
    rules.push("Copy, cut, paste, drag-and-drop and the right-click menu are disabled.");
  } else if (proctored) {
    rules.push("Tab switches, focus loss and paste attempts are logged with timestamps. Nothing is blocked.");
  }
  rules.push("One sitting per recruiting cycle. There is no retake.");

  return (
    <div className="flex min-h-full items-center justify-center bg-paper px-4 py-10" data-testid="assessment-preflight">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <div className="bg-navy px-6 py-5 text-white">
          <p className="text-[12px] text-white/70">Before you begin</p>
          <h1 className="mt-1 text-[22px] font-semibold leading-tight">{assessmentTitle(assessment.title)}</h1>
          <ProctoringChip mode={assessment.proctoring} durationMinutes={assessment.durationMinutes} className="mt-3 [&>span]:border-white/20 [&>span]:bg-white/10 [&>span]:text-white" />
        </div>
        <div className="p-6">
          <p className="text-[13px] font-semibold text-ink">
            {attempt.problems.length} questions · {assessment.family} {assessment.version}
          </p>
          <ul className="mt-3 space-y-2">
            {rules.map((rule) => (
              <li key={rule} className="flex gap-2.5 text-[13px] leading-6 text-ink-soft">
                <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          {proctored ? (
            <Note className="mt-4">
              <span className="font-medium text-ink">What is recorded:</span> only browser events and their times. No
              camera, microphone, screen recording or keystrokes. The log is shown to the employers who review this
              score, as context, never as an automatic decision.
            </Note>
          ) : null}
          {lockdown && !canFullscreen ? (
            <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-900">
              This browser does not support fullscreen, so tab switches are still logged but fullscreen is not enforced.
            </p>
          ) : null}
          <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-[13px] leading-6 text-ink">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#16833F]"
              data-testid="preflight-agree"
            />
            I understand the rules and I am ready to start.
          </label>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            {onExit ? (
              <button type="button" onClick={onExit} className="text-[13px] font-medium text-ink-muted hover:text-ink">
                Not now
              </button>
            ) : (
              <Link href="/assessments" className="text-[13px] font-medium text-ink-muted hover:text-ink">
                Not now
              </Link>
            )}
            <Button variant="primary" size="md" onClick={() => void begin()} disabled={!agreed || starting} data-testid="preflight-begin">
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : lockdown ? <Expand className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              {lockdown && canFullscreen ? "Enter fullscreen and begin" : resumed ? "Resume test" : "Begin test"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AwayOverlay({
  reason,
  violations,
  onReturn,
}: {
  reason: "tab_hidden" | "fullscreen_exit";
  violations: number;
  onReturn: () => void;
}) {
  const left = Math.max(0, LOCKDOWN_MAX_VIOLATIONS - violations);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/95 px-4" role="alertdialog" aria-modal="true" aria-labelledby="away-title" data-testid="lockdown-warning">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-600" aria-hidden />
        <h2 id="away-title" className="mt-3 text-[18px] font-semibold text-ink">
          {reason === "fullscreen_exit" ? "You left fullscreen" : "You left the test tab"}
        </h2>
        <p className="mt-2 text-[13px] leading-6 text-ink-muted">
          Warning {violations} of {LOCKDOWN_MAX_VIOLATIONS}.{" "}
          {left > 0
            ? left === 1
              ? "One more and your answers are submitted automatically."
              : left + " more and your answers are submitted automatically."
            : "Your answers are being submitted."}{" "}
          The timer keeps running.
        </p>
        {left > 0 ? (
          <Button variant="primary" size="md" className="mt-5 w-full" onClick={onReturn} data-testid="lockdown-return">
            <Expand className="h-4 w-4" /> Return to the test
          </Button>
        ) : (
          <Loader2 className="mx-auto mt-5 h-5 w-5 animate-spin text-ink-muted" />
        )}
      </div>
    </div>
  );
}

function ChoiceAnswer({
  problem,
  value,
  disabled,
  onChange,
}: {
  problem: PublicOaProblem;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-2.5" data-testid="choice-answer">
      <legend className="sr-only">Choose one answer for {problem.title}</legend>
      {problem.options.map((option, index) => {
        const selected = value === String(index);
        return (
          <label
            key={index}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3.5 text-[14px] transition",
              selected ? "border-accent bg-accent-tint text-ink" : "border-line bg-surface text-ink-soft hover:border-line-strong",
              disabled && "pointer-events-none opacity-60",
            )}
          >
            <input
              type="radio"
              name={"choice-" + problem.id}
              value={index}
              checked={selected}
              onChange={() => onChange(String(index))}
              className="h-4 w-4 accent-[#16833F]"
              data-testid={"choice-option-" + index}
            />
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line bg-paper text-[11px] font-semibold text-ink-muted">
              {String.fromCharCode(65 + index)}
            </span>
            <span>{option}</span>
          </label>
        );
      })}
      {value ? (
        <button type="button" onClick={() => onChange("")} className="text-[12px] font-medium text-ink-muted hover:text-ink">
          Clear selection
        </button>
      ) : null}
    </fieldset>
  );
}

function NumericAnswer({
  problem,
  value,
  disabled,
  onChange,
}: {
  problem: PublicOaProblem;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div data-testid="numeric-answer">
      <label htmlFor={"numeric-" + problem.id} className="text-[13px] font-medium text-ink">
        Your answer
      </label>
      <input
        id={"numeric-" + problem.id}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value.slice(0, 40))}
        placeholder="e.g. 0.25, 1/4 or 25%"
        className="mt-2 h-12 w-full max-w-sm rounded-lg border border-line-strong bg-surface px-4 font-mono text-[16px] text-ink outline-none focus:border-accent"
        data-testid="numeric-input"
      />
      <p className="mt-2 text-[12px] leading-5 text-ink-muted">
        Decimals, simple fractions (1/4) and percentages (25%) are accepted. No calculator in lockdown tests.
      </p>
    </div>
  );
}

export function AssessmentRunner({
  attempt,
  embedded = false,
  onExit,
}: {
  attempt: AssessmentAttemptView;
  embedded?: boolean;
  onExit?: () => void;
}) {
  const { assessment } = attempt;
  const needsPreflight = assessment.proctoring !== "NONE" || assessment.durationMinutes > 0;
  const [begun, setBegun] = useState(!needsPreflight);
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
  const submissionsRef = useRef(submissions);
  submissionsRef.current = submissions;
  const busyRef = useRef(false);

  const startedAtMs = useMemo(() => new Date(attempt.startedAt).getTime(), [attempt.startedAt]);
  const skewMs = useMemo(() => new Date(attempt.serverNow).getTime() - Date.now(), [attempt.serverNow]);
  const finished = Boolean((attempt.submittedAt && attempt.marking) || submission);
  const current = attempt.problems[problemIndex];
  const draftKey = "rivet-oa-draft-" + attempt.id;

  const submitRef = useRef<(auto: IntegrityReport["reason"]) => Promise<void>>(async () => {});
  const onViolationLimit = useCallback(() => void submitRef.current("violations"), []);
  const onExpire = useCallback(() => void submitRef.current("time"), []);

  const proctor = useProctor({
    mode: assessment.proctoring,
    active: begun && !finished,
    startedAtMs,
    onViolationLimit,
  });
  const remaining = useCountdown({
    durationMinutes: assessment.durationMinutes,
    startedAtMs,
    skewMs,
    active: begun && !finished,
    onExpire,
  });

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

  // Lock page scroll behind the fixed workspace.
  useEffect(() => {
    if (finished && !embedded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [embedded, finished]);

  const answered = useCallback(
    (problem: PublicOaProblem) => {
      return Boolean((submissions[problem.id] ?? "").trim());
    },
    [submissions],
  );
  const unanswered = attempt.problems.filter((problem) => !answered(problem)).length;

  const submitFinal = useCallback(
    async (auto: IntegrityReport["reason"] = null) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setError(null);
      const integrity: IntegrityReport | null =
        assessment.proctoring !== "NONE" || assessment.durationMinutes > 0
          ? { events: proctor.snapshot(), autoSubmitted: auto !== null, reason: auto }
          : null;
      try {
        const response = await fetch("/api/assessments/attempts/" + attempt.id + "/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ submissions: submissionsRef.current, assessmentId: assessment.id, integrity }),
        });
        const data = (await response.json()) as AssessmentSubmissionView & { error?: string };
        if (!response.ok || !data.marking) {
          setError(data.error ?? "Could not submit that attempt.");
          setConfirmOpen(false);
          busyRef.current = false;
          return;
        }
        if (auto === "time") toast.message("Time is up. Your answers were submitted.");
        if (auto === "violations") toast.message("Lockdown limit reached. Your answers were submitted.");
        setSubmission(data);
        setConfirmOpen(false);
        void leaveFullscreen();
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          // Ignore storage cleanup failures.
        }
      } catch {
        setError("Network hiccup. Your attempt is still open; try again.");
        setConfirmOpen(false);
        busyRef.current = false;
      } finally {
        setBusy(false);
      }
    },
    [assessment.durationMinutes, assessment.id, assessment.proctoring, attempt.id, draftKey, proctor],
  );
  submitRef.current = submitFinal;

  if (attempt.submittedAt && attempt.marking) {
    return <ResultView attempt={attempt} marking={attempt.marking} integrity={attempt.integrity} />;
  }

  if (submission) {
    const view = <ResultView attempt={attempt} marking={submission.marking} integrity={submission.result.integrity ?? null} />;
    return embedded ? (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-paper px-4 py-8 sm:px-6">
        {onExit ? (
          <div className="mx-auto mb-4 max-w-3xl">
            <button type="button" onClick={onExit} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink" data-testid="close-oa">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to assessment
            </button>
          </div>
        ) : null}
        {view}
      </div>
    ) : (
      view
    );
  }

  if (!current) return null;

  if (!begun) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-paper" data-testid="assessment-runner">
        <Preflight attempt={attempt} onBegin={() => setBegun(true)} onExit={onExit} />
      </div>
    );
  }

  function updateAnswer(value: string) {
    if (!current) return;
    setSubmissions((previous) => ({ ...previous, [current.id]: value }));
    setCheck(null);
  }

  function goTo(index: number) {
    setProblemIndex(Math.max(0, Math.min(attempt.problems.length - 1, index)));
    setCheck(null);
  }

  function resetProblem() {
    if (!current) return;
    updateAnswer(current.starterCode);
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

  const lowTime = remaining !== null && remaining <= 300;
  const isCode = current.kind === "code";
  const leave = onExit ? (
    <button
      type="button"
      onClick={() => {
        void leaveFullscreen();
        onExit();
      }}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-white/75 hover:bg-white/10 hover:text-white"
      data-testid="close-oa"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Exit
    </button>
  ) : (
    <Link href="/assessments" className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-white/75 hover:bg-white/10 hover:text-white">
      <ArrowLeft className="h-3.5 w-3.5" /> Exit
    </Link>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper" data-testid="assessment-runner">
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 bg-navy px-3 py-2 text-white sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          {assessment.proctoring === "LOCKDOWN" ? null : leave}
          <div className="min-w-0">
            <h1 className="truncate text-[14px] font-semibold leading-tight">{assessmentTitle(assessment.title)}</h1>
            <p className="text-[11px] text-white/60">
              {assessment.family} · {assessment.version} · {difficultyText(assessment.difficulty)}
              {assessment.proctoring !== "NONE" ? " · " + proctoringLabel(assessment.proctoring) : ""}
            </p>
          </div>
        </div>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto no-scrollbar sm:order-none sm:w-auto sm:flex-1 sm:justify-center" aria-label="Questions">
          {attempt.problems.map((problem, index) => {
            const done = answered(problem);
            return (
              <button
                key={problem.id}
                type="button"
                onClick={() => goTo(index)}
                aria-current={index === problemIndex ? "step" : undefined}
                aria-label={"Question " + (index + 1) + (done ? ", answered" : "")}
                className={cn(
                  "flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md border px-2 text-[12px] font-semibold tabular-nums transition",
                  index === problemIndex
                    ? "border-accent-bright bg-accent-bright text-navy"
                    : done
                      ? "border-white/25 bg-white/15 text-white"
                      : "border-white/20 text-white/70 hover:border-white/40 hover:text-white",
                )}
                data-testid={"problem-tab-" + index}
              >
                {index + 1}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {assessment.proctoring !== "NONE" ? (
            <span className="hidden items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] text-white/80 md:inline-flex" title="Browser events are logged for the reviewer">
              {assessment.proctoring === "LOCKDOWN" ? <Lock className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
              {assessment.proctoring === "LOCKDOWN" ? "Warnings " + proctor.violations + "/" + LOCKDOWN_MAX_VIOLATIONS : proctor.events.length + " logged"}
            </span>
          ) : null}
          {remaining !== null ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[13px] font-semibold tabular-nums",
                lowTime ? "bg-rose-600 text-white" : "bg-white/10 text-white",
              )}
              role="timer"
              aria-live={lowTime ? "polite" : "off"}
              aria-label={"Time left " + formatClock(remaining)}
              data-testid="assessment-timer"
            >
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              {formatClock(remaining)}
            </span>
          ) : null}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={busy}
            className="border-accent-bright bg-accent-bright text-navy hover:border-white hover:bg-white"
            data-testid="assessment-submit"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {busy ? "Marking..." : "Submit test"}
          </Button>
        </div>
      </header>

      {error ? (
        <div role="alert" className="shrink-0 border-b border-rose-300 bg-rose-50 px-4 py-2 text-[12px] leading-5 text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:overflow-hidden">
        <section className="border-b border-line bg-surface lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r" aria-labelledby="question-title">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <span className="font-semibold text-ink-muted">
                Question {problemIndex + 1} of {attempt.problems.length}
              </span>
              <span className="text-line-strong">|</span>
              <span className={cn("font-semibold", difficultyTone(current.difficulty))}>{difficultyText(current.difficulty)}</span>
              <span className="text-line-strong">|</span>
              <span className="text-ink-muted">{kindLabel(current)}</span>
            </div>
            <h2 id="question-title" className="mt-2 text-[20px] font-semibold leading-snug text-ink">
              {current.title}
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-[14px] leading-7 text-ink-soft">{current.statement}</p>

            {isCode ? (
              <>
                <div className="mt-6">
                  <p className="flex items-center gap-2 text-[12px] font-semibold text-ink">
                    <Code2 className="h-3.5 w-3.5" /> Function signature
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-md border border-line bg-paper px-3 py-2 font-mono text-[12px] leading-5 text-ink">
                    {signatureLabel(current)}
                  </pre>
                </div>
                <div className="mt-6">
                  <p className="text-[12px] font-semibold text-ink">Sample cases</p>
                  <div className="mt-2 space-y-2">
                    {current.examples.map((example, index) => (
                      <div key={index} className="overflow-hidden rounded-md border border-line font-mono text-[12px] leading-5">
                        <p className="border-b border-line bg-paper px-3 py-1.5 font-sans text-[11px] font-semibold text-ink-muted">Sample {index}</p>
                        <div className="grid gap-px bg-line sm:grid-cols-2">
                          <div className="bg-surface px-3 py-2">
                            <p className="font-sans text-[11px] text-ink-faint">Input</p>
                            <p className="mt-0.5 break-words text-ink">
                              {current.functionName}({example.args.map(valueLabel).join(", ")})
                            </p>
                          </div>
                          <div className="bg-surface px-3 py-2">
                            <p className="font-sans text-[11px] text-ink-faint">Expected output</p>
                            <p className="mt-0.5 break-words text-ink">{valueLabel(example.expected)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-ink-muted">
                    {current.testCount} {current.testCount === 1 ? "test" : "tests"} in total, including the{" "}
                    {current.examples.length === 1 ? "sample" : "samples"}. Hidden tests run when you submit.
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </section>

        <section className="flex min-h-0 flex-col bg-surface lg:bg-paper">
          {isCode ? (
            <>
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#1e1e1e] px-3 py-2">
                <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-white/80">
                  <Code2 className="h-3.5 w-3.5" /> JavaScript (Node)
                </span>
                <button
                  type="button"
                  onClick={resetProblem}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="h-3 w-3" /> Reset code
                </button>
              </div>
              <div className="min-h-[360px] flex-1 bg-[#1e1e1e]">
                <CodeEditor
                  problemId={current.id}
                  title={current.title}
                  value={submissions[current.id] ?? ""}
                  readOnly={busy}
                  onChange={updateAnswer}
                  fill
                />
              </div>
              <div className="shrink-0 border-t border-line bg-surface p-3">
                {check ? (
                  <div
                    className={cn(
                      "mb-3 rounded-md border px-3 py-2 text-[12px] leading-5",
                      check.result.passed === check.result.total
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                        : "border-amber-300 bg-amber-50 text-amber-900",
                    )}
                    data-testid="example-check-result"
                  >
                    <span className="font-semibold">
                      {check.result.passed === check.result.total ? "Sample cases passed." : "Sample cases need work."}
                    </span>{" "}
                    {check.result.passed} of {check.result.total} public examples passed.
                    {check.result.error ? " " + check.result.error : ""}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] text-ink-muted">Draft saved in this browser.</p>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => void runExamples()} disabled={checking || busy} data-testid="run-examples">
                      {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                      {checking ? "Running..." : "Run code"}
                    </Button>
                    {problemIndex < attempt.problems.length - 1 ? (
                      <Button variant="primary" size="sm" onClick={() => goTo(problemIndex + 1)}>
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm" onClick={() => setConfirmOpen(true)} disabled={busy}>
                        Review and submit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto p-5 sm:p-8">
                <div className="mx-auto max-w-xl">
                  {current.kind === "choice" ? (
                    <ChoiceAnswer problem={current} value={submissions[current.id] ?? ""} disabled={busy} onChange={updateAnswer} />
                  ) : (
                    <NumericAnswer problem={current} value={submissions[current.id] ?? ""} disabled={busy} onChange={updateAnswer} />
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line bg-surface p-3">
                <Button variant="secondary" size="sm" onClick={() => goTo(problemIndex - 1)} disabled={problemIndex === 0}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <p className="text-[12px] text-ink-muted">
                  {attempt.problems.length - unanswered} of {attempt.problems.length} answered
                </p>
                {problemIndex < attempt.problems.length - 1 ? (
                  <Button variant="primary" size="sm" onClick={() => goTo(problemIndex + 1)} data-testid="next-question">
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => setConfirmOpen(true)} disabled={busy}>
                    Review and submit
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {proctor.away && !busy ? (
        <AwayOverlay reason={proctor.away} violations={proctor.violations} onReturn={() => void proctor.returnToTest()} />
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent data-testid="submit-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Submit the test?</DialogTitle>
            <DialogDescription>
              This is the only sitting for this assessment in the recruiting cycle. Marking runs immediately against
              hidden tests and answer keys. You cannot reopen, edit or retake it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-line bg-paper px-3 py-2.5">
              <p className="text-[11px] text-ink-faint">Answered</p>
              <p className="text-[18px] font-semibold tabular-nums text-ink">
                {attempt.problems.length - unanswered}/{attempt.problems.length}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-paper px-3 py-2.5">
              <p className="text-[11px] text-ink-faint">{remaining !== null ? "Time left" : "Timer"}</p>
              <p className="text-[18px] font-semibold tabular-nums text-ink">{remaining !== null ? formatClock(remaining) : "None"}</p>
            </div>
          </div>
          {unanswered > 0 ? (
            <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-900">
              <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {unanswered === 1 ? "One question is" : unanswered + " questions are"} unanswered. Answer every question to submit
              by hand; only a timed or lockdown auto-submit accepts blanks.
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="secondary" size="md" onClick={() => setConfirmOpen(false)} disabled={busy}>
              Keep working
            </Button>
            <Button variant="primary" size="md" onClick={() => void submitFinal(null)} disabled={busy || unanswered > 0} data-testid="confirm-submit">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {busy ? "Submitting..." : "Submit final answers"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
