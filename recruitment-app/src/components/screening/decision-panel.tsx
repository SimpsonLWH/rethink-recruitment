"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, PauseCircle, RotateCcw, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RunStatusBadge } from "@/components/screening/screening-badges";
import {
  RATING_LABEL,
  validateScreeningDecision,
  type CriterionCheck,
  type CriterionRating,
  type CriterionResult,
  type ScreeningDecision,
  type ScreeningRunStatus,
} from "@/lib/screening";
import { cn } from "@/lib/utils";

const RATINGS: CriterionRating[] = ["MEETS", "PARTLY", "NOT_YET", "NOT_ASSESSED"];

const DECISIONS: Array<{
  value: ScreeningDecision;
  label: string;
  description: string;
  icon: typeof ArrowRight;
}> = [
  {
    value: "ADVANCE",
    label: "Move to interview",
    description: "The record supports a conversation. Nobody is notified automatically.",
    icon: ArrowRight,
  },
  {
    value: "HOLD",
    label: "Hold for more evidence",
    description: "Keep them in the queue. Nothing is sent and nobody is rejected.",
    icon: PauseCircle,
  },
  {
    value: "DECLINE",
    label: "Not moving forward",
    description: "Recorded internally with your reason. No automatic rejection message.",
    icon: XCircle,
  },
];

function initialRating(result: CriterionResult, checks: CriterionCheck[]): CriterionRating {
  const existing = checks.find((check) => check.criterionId === result.criterion.id);
  if (existing) return existing.rating;
  if (result.status === "MET") return "MEETS";
  if (result.status === "PARTLY" || result.status === "OPEN") return "PARTLY";
  if (result.status === "NOT_MET") return "NOT_YET";
  return "NOT_ASSESSED";
}

export function DecisionPanel({
  roleId,
  candidateId,
  firstName,
  criteria,
  status,
  checks,
  reason,
  basis,
  decidedBy,
  decidedAt,
  outcomeSentAt,
}: {
  roleId: string;
  candidateId: string;
  firstName: string;
  criteria: CriterionResult[];
  status: ScreeningRunStatus;
  checks: CriterionCheck[];
  reason: string | null;
  basis: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  outcomeSentAt: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<ScreeningDecision>("ADVANCE");
  const [reasonDraft, setReasonDraft] = useState("");
  const [ratings, setRatings] = useState<Record<string, CriterionRating>>({});
  const [ratingNotes, setRatingNotes] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [sendOutcome, setSendOutcome] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [reopening, setReopening] = useState(false);

  // The router refresh can be served from a cached RSC in production after a
  // prior mutation. Keep the recorded decision in local state so the reviewer
  // never sees "In review" after they just recorded a decision.
  const [local, setLocal] = useState({ status, checks, reason, basis, decidedBy, decidedAt, outcomeSentAt });
  useEffect(() => {
    setLocal({ status, checks, reason, basis, decidedBy, decidedAt, outcomeSentAt });
  }, [status, checks, reason, basis, decidedBy, decidedAt, outcomeSentAt]);

  function openDecision() {
    setRatings(Object.fromEntries(criteria.map((result) => [result.criterion.id, initialRating(result, local.checks)])));
    setRatingNotes(
      Object.fromEntries(
        criteria.map((result) => [
          result.criterion.id,
          local.checks.find((check) => check.criterionId === result.criterion.id)?.note ?? "",
        ]),
      ),
    );
    setDecision("ADVANCE");
    setReasonDraft(local.reason ?? "");
    setConfirmed(false);
    setSendOutcome(false);
    setErrors([]);
    setOpen(true);
  }

  async function submit() {
    const criterionChecks: CriterionCheck[] = criteria.map((result) => ({
      criterionId: result.criterion.id,
      rating: ratings[result.criterion.id] ?? "NOT_ASSESSED",
      note: ratingNotes[result.criterion.id]?.trim() || undefined,
    }));
    const validation = validateScreeningDecision({
      decision,
      reason: reasonDraft,
      criterionChecks,
      confirmed,
    });
    if (validation.length) {
      setErrors(validation);
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      const response = await fetch("/api/screening/" + roleId + "/" + candidateId, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "decision",
          decision,
          reason: reasonDraft,
          criterionChecks,
          confirmed: true,
          sendOutcome: decision === "DECLINE" ? sendOutcome : false,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        packet?: { run: { status: ScreeningRunStatus; criterionChecks: CriterionCheck[]; decisionReason: string | null; decisionBasis: string | null; decidedBy: string | null; decidedAt: string | null; outcomeSentAt: string | null } };
      };
      if (!response.ok) throw new Error(payload.error ?? "Could not save the decision.");
      if (payload.packet) {
        const run = payload.packet.run;
        setLocal({
          status: run.status,
          checks: run.criterionChecks,
          reason: run.decisionReason,
          basis: run.decisionBasis,
          decidedBy: run.decidedBy,
          decidedAt: run.decidedAt,
          outcomeSentAt: run.outcomeSentAt,
        });
      }
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setErrors([caught instanceof Error ? caught.message : "Could not save the decision."]);
    } finally {
      setBusy(false);
    }
  }

  async function reopen() {
    setReopening(true);
    try {
      const response = await fetch("/api/screening/" + roleId + "/" + candidateId, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "reopen" }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        packet?: { run: { status: ScreeningRunStatus; criterionChecks: CriterionCheck[]; decisionReason: string | null; decisionBasis: string | null; decidedBy: string | null; decidedAt: string | null; outcomeSentAt: string | null } };
      };
      if (response.ok && payload.packet) {
        const run = payload.packet.run;
        setLocal({
          status: run.status,
          checks: run.criterionChecks,
          reason: run.decisionReason,
          basis: run.decisionBasis,
          decidedBy: run.decidedBy,
          decidedAt: run.decidedAt,
          outcomeSentAt: run.outcomeSentAt,
        });
      }
      router.refresh();
    } finally {
      setReopening(false);
    }
  }

  return (
    <>
      <section className="rounded-xl border border-line bg-surface p-4" aria-labelledby="decision-heading">
        <div className="flex items-center justify-between gap-2">
          <h2 id="decision-heading" className="text-[13px] font-semibold text-ink">
            Your decision
          </h2>
          <RunStatusBadge status={local.status} />
        </div>

        {local.status === "OPEN" ? (
          <>
            <p className="mt-2 text-[12px] leading-6 text-ink-muted">
              The record is prepared. Rate the criteria you reviewed and record what happens next. No automatic rejection, no
              score out of ten, no ranking.
            </p>
            <button
              type="button"
              onClick={openDecision}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-[13px] font-medium text-white transition hover:bg-accent-deep"
            >
              Record a decision <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </>
        ) : (
          <div className="mt-3">
            <dl className="space-y-2.5">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Reason</dt>
                <dd className="mt-0.5 text-[12px] leading-6 text-ink-soft">{local.reason}</dd>
              </div>
              {local.basis ? (
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Basis</dt>
                  <dd className="mt-0.5 text-[11px] leading-5 text-ink-muted">{local.basis}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Recorded</dt>
                <dd className="mt-0.5 text-[11px] leading-5 text-ink-muted">
                  {local.decidedBy ?? "Reviewer"} ·{" "}
                  {local.decidedAt ? new Date(local.decidedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "time unknown"}
                </dd>
              </div>
            </dl>
            {local.status === "DECLINE" ? (
              <p className="mt-3 rounded-md border border-line bg-paper px-3 py-2 text-[11px] leading-5 text-ink-muted">
                {local.outcomeSentAt
                  ? "A short candidate outcome was sent · " +
                    new Date(local.outcomeSentAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) +
                    "."
                  : "No candidate message was sent. This decision is internal."}
              </p>
            ) : (
              <p className="mt-3 rounded-md border border-line bg-paper px-3 py-2 text-[11px] leading-5 text-ink-muted">
                This is an internal pre-screen record. Use Matches to move a conversation or send an outcome.
              </p>
            )}
            <button
              type="button"
              onClick={reopen}
              disabled={reopening}
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-[12px] font-medium text-ink-muted transition hover:border-line-strong hover:text-ink"
            >
              {reopening ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <RotateCcw className="h-3.5 w-3.5" aria-hidden />}
              Reopen for more evidence
            </button>
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record your pre-screen decision</DialogTitle>
            <DialogDescription>
              This is your call, based on the record you just read. It will not send {firstName} an automatic rejection or
              create a match.
            </DialogDescription>
          </DialogHeader>

          <fieldset>
            <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Your read on each criterion</legend>
            <div className="mt-2 divide-y divide-line border-y border-line">
              {criteria.map((result) => {
                const rating = ratings[result.criterion.id] ?? "NOT_ASSESSED";
                const inputName = "rating-" + result.criterion.id.replace(/[^a-z0-9-]/gi, "-");
                return (
                  <div key={result.criterion.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-ink">{result.criterion.label}</p>
                        <p className="mt-0.5 text-[11px] leading-5 text-ink-muted">{result.evidenceLine}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] text-ink-muted">
                        {result.criterion.kind === "MUST_HAVE" ? "Must have" : result.criterion.kind === "NICE_TO_HAVE" ? "Nice to have" : "Conversation"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={"Your read on " + result.criterion.label}>
                      {RATINGS.map((value) => (
                        <label
                          key={value}
                          className={cn(
                            "inline-flex h-10 cursor-pointer items-center rounded-md border px-2.5 text-[11px] font-medium transition sm:h-8",
                            rating === value
                              ? "border-accent bg-accent-tint text-accent-deep"
                              : "border-line bg-surface text-ink-muted hover:border-line-strong",
                          )}
                        >
                          <input
                            type="radio"
                            name={inputName}
                            value={value}
                            checked={rating === value}
                            onChange={() => setRatings((current) => ({ ...current, [result.criterion.id]: value }))}
                            className="sr-only"
                          />
                          {RATING_LABEL[value]}
                        </label>
                      ))}
                    </div>
                    <input
                      value={ratingNotes[result.criterion.id] ?? ""}
                      onChange={(event) =>
                        setRatingNotes((current) => ({ ...current, [result.criterion.id]: event.target.value }))
                      }
                      maxLength={300}
                      placeholder="Optional note for this criterion"
                      aria-label={"Note for " + result.criterion.label}
                      className="mt-2 h-9 w-full rounded-md border border-line bg-surface px-2.5 text-[11.5px] text-ink outline-none placeholder:text-ink-faint focus:border-accent"
                    />
                  </div>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">What happens next</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {DECISIONS.map((option) => {
                const Icon = option.icon;
                const active = decision === option.value;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "cursor-pointer rounded-lg border p-3 transition",
                      active ? "border-accent bg-accent-tint" : "border-line bg-surface hover:border-line-strong",
                    )}
                  >
                    <input
                      type="radio"
                      name="screening-decision"
                      value={option.value}
                      checked={active}
                      onChange={() => {
                        setDecision(option.value);
                        if (option.value !== "DECLINE") setSendOutcome(false);
                      }}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                      <Icon className="h-3.5 w-3.5" aria-hidden /> {option.label}
                    </span>
                    <span className="mt-1 block text-[10.5px] leading-4 text-ink-muted">{option.description}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {decision === "DECLINE" ? (
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-md border border-line bg-paper p-3">
              <input
                type="checkbox"
                checked={sendOutcome}
                onChange={(event) => setSendOutcome(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-line-strong accent-[#16833F]"
              />
              <span className="text-[11.5px] leading-5 text-ink-soft">
                Send a short outcome to {firstName} when I save. It says the team is not taking this further at this stage and
                that other roles stay open. Nothing is sent unless I tick this.
              </span>
            </label>
          ) : null}

          <div className="mt-5">
            <label htmlFor="decision-reason" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Why this decision
            </label>
            <textarea
              id="decision-reason"
              value={reasonDraft}
              onChange={(event) => setReasonDraft(event.target.value)}
              rows={3}
              maxLength={1200}
              aria-invalid={errors.length > 0}
              aria-describedby={errors.length ? "decision-errors" : undefined}
              placeholder="Name the evidence you relied on, and what you are still unsure about."
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-[13px] leading-6 text-ink outline-none focus:border-accent"
            />
            <p className="mt-1 text-[10px] text-ink-faint">{reasonDraft.trim().length}/1200 · stored on the record with your name and the time.</p>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-md border border-line bg-paper p-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line-strong accent-[#16833F]"
            />
            <span className="text-[11.5px] leading-5 text-ink-soft">
              I reviewed the evidence and this decision is mine. I am not relying on a hidden score, an AI verdict or an
              automatic filter.
            </span>
          </label>

          {errors.length ? (
            <ul id="decision-errors" className="mt-3 space-y-1 rounded-md border border-rose-200 bg-rose-50 p-3 text-[11.5px] leading-5 text-rose-800" role="alert">
              {errors.map((error) => (
                <li key={error} className="flex items-start gap-1.5">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
                </li>
              ))}
            </ul>
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-[12px] font-medium text-ink-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-[12px] font-medium text-white disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
              Save decision
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
