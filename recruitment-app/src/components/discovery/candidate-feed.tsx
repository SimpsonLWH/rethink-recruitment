"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { toast } from "sonner";
import { DecisionActions } from "@/components/discovery/decision-actions";
import { EvidenceStatus } from "@/components/evidence/evidence-status";
import { MatchDialog } from "@/components/discovery/match-dialog";
import { PriorityIntroDialog } from "@/components/discovery/priority-intro-dialog";
import { ShortcutConfirmDialog } from "@/components/discovery/shortcut-confirm-dialog";
import type { AssessmentRequirementEvidence, CandidateFeedCard, DecisionResult, InterestState } from "@/lib/repo";
import { likesLeftLabel, signalStatusLabel } from "@/lib/ui-copy";

function signalDot(status: string) {
  if (status === "exact") return "bg-emerald-500";
  if (status === "related") return "bg-amber-500";
  if (status === "not_met") return "bg-rose-500";
  return "bg-line-strong";
}

export function CandidateFeedDeck({
  main,
  belowBar,
  initialInterest,
  personaName,
}: {
  main: CandidateFeedCard[];
  belowBar: CandidateFeedCard[];
  initialInterest: InterestState;
  personaName: string;
}) {
  const [index, setIndex] = useState(0);
  const [interest, setInterest] = useState(initialInterest);
  const [busy, setBusy] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [shortcutAction, setShortcutAction] = useState<"PASS" | "LIKE" | "PRIORITY_INTRO" | null>(null);
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchName, setMatchName] = useState("");
  const [matchSubtitle, setMatchSubtitle] = useState("");

  const current = main[index];

  const openMatch = useCallback((id: string) => {
    if (!current) return;
    setMatchId(id);
    setMatchName(current.role.employer.name);
    setMatchSubtitle(current.role.title);
    setMatchOpen(true);
  }, [current]);

  const decide = useCallback(
    async (action: "LIKE" | "PASS" | "PRIORITY_INTRO", reason?: string) => {
      if (!current || busy) return;
      if (action === "LIKE" && interest.likesRemaining <= 0) {
        toast.error("No likes left for this event. You can still accept an invitation or a Priority intro.");
        return;
      }
      if (action === "PRIORITY_INTRO" && interest.remaining <= 0) {
        toast.error("No Priority intros left for this event.");
        return;
      }
      setBusy(true);
      try {
        const response = await fetch("/api/decisions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ roleId: current.role.id, action, reason }),
        });
        const data = (await response.json()) as DecisionResult & { error?: string };
        if (!response.ok) {
          toast.error(data.error ?? "Could not save that decision.");
          return;
        }
        setInterest((previous) => ({
          ...previous,
          remaining: data.priorityIntrosRemaining,
          used: previous.total - data.priorityIntrosRemaining,
          likesRemaining: data.likesRemaining,
          likesUsed: previous.likesTotal - data.likesRemaining,
        }));
        setIntroOpen(false);
        setIndex((value) => value + 1);
        if (data.matched && data.matchId) {
          openMatch(data.matchId);
        } else {
          toast.success(
            action === "PASS"
              ? "Passed. No penalty, no ranking."
              : action === "PRIORITY_INTRO"
                ? "Priority intro sent. It counts as a yes on your side."
                : "Like sent. A match needs both sides.",
          );
        }
      } catch {
        toast.error("Network hiccup. Try again.");
      } finally {
        setBusy(false);
      }
    },
    [current, busy, interest, openMatch],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Escape" && shortcutAction) {
        setShortcutAction(null);
        return;
      }
      if (introOpen || matchOpen || shortcutAction || !current || busy) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setShortcutAction("PASS");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (interest.likesRemaining <= 0) {
          toast.error("No likes left for this event.");
          return;
        }
        setShortcutAction("LIKE");
      } else if (event.key.toLowerCase() === "p") {
        event.preventDefault();
        if (interest.remaining <= 0) {
          toast.error("No Priority intros left for this event.");
          return;
        }
        setIntroOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, busy, interest.likesRemaining, interest.remaining, introOpen, matchOpen, shortcutAction]);

  if (!current) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-[24px] border border-dashed border-line-strong bg-surface px-6 py-14 text-center" data-testid="candidate-feed-finished">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">End of this mixed feed</p>
          <h2 className="mt-3 font-display text-[30px] leading-tight">That&apos;s the deck for now.</h2>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-6 text-ink-muted">
            Nothing was auto-rejected or ranked. Below-bar roles stay visible with their evidence. Check your
            invitations and updates, or take an assessment to add evidence.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/invitations" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">
              Invitations <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/updates" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-[12px] font-medium text-ink">
              Updates
            </Link>
            <Link href="/assessments" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-[12px] font-medium text-ink">
              Assessments
            </Link>
          </div>
        </div>
        <BelowBar cards={belowBar} />
      </div>
    );
  }

  const evidence = current.evidence;
  const requirements: AssessmentRequirementEvidence[] =
    evidence?.requirements ??
    (current.role.assessment
      ? [
          {
            assessment: current.role.assessment,
            score: null,
            requiredScore: current.role.requiredScore ?? 0,
            meets: false,
          },
        ]
      : []);

  return (
    <>
      <div className="mx-auto w-full max-w-[920px]" data-testid="candidate-feed">
        <article className="rounded-xl border border-line bg-surface shadow-card">
          <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-paper font-display text-[15px] font-semibold text-ink-soft">
                {current.role.employer.logoMark}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink-soft">{current.role.employer.name}</p>
                <p className="mt-0.5 truncate text-[12px] text-ink-muted">{current.role.employer.tagline}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-[10px] text-ink-faint">No ranking</span>
              <Link href={"/roles/" + current.role.id} className="inline-flex items-center gap-1 text-[10px] font-medium text-ink lg:hidden">
                Read role <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </header>

          <div className="grid gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_290px] lg:gap-8">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Open role</p>
              <h2 className="mt-2 font-sans text-[30px] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-[36px]">{current.role.title}</h2>
              <p className="mt-2 text-[12px] text-ink-muted lg:hidden">
                {current.role.employmentType} · {current.role.workMode} · {current.role.location}
              </p>
              <p className="mt-4 max-w-[58ch] text-[14px] leading-6 text-ink-soft">{current.role.summary}</p>
              <div className="mt-4 hidden flex-wrap gap-1.5 sm:flex">
                {current.role.skills.slice(0, 4).map((skill) => (
                  <span key={skill} className="rounded border border-line bg-paper px-2 py-0.5 text-[11px] text-ink-muted">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mt-4 hidden max-w-[58ch] border-l border-line-strong pl-3 lg:block">
                <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-ink-faint">The problem</p>
                <p className="mt-1 line-clamp-3 text-[12px] leading-5 text-ink-soft">{current.role.problemNow}</p>
              </div>
            </div>

            <aside className="border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Your evidence</p>
                <span className="text-[9px] text-ink-faint">Exact version</span>
              </div>
              <EvidenceStatus requirements={requirements} className="mt-2" align="right" />

              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Experience signals</p>
                <div className="mt-2 space-y-2">
                  {current.signals.some((signal) => signal.status !== "unknown") ? (
                    current.signals
                      .filter((signal) => signal.status !== "unknown")
                      .slice(0, 3)
                      .map((signal) => (
                      <div key={signal.signal.id} className="flex items-center gap-2">
                        <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + signalDot(signal.status)} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-[11px] text-ink-soft">{signal.signal.label}</span>
                        <span className="shrink-0 text-[10px] text-ink-muted">{signalStatusLabel(signal.status)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-ink-muted">No structured signals stated.</p>
                  )}
                </div>
              </div>

              <div className="mt-5 hidden border-t border-line pt-3 lg:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Role details</p>
                <dl className="mt-2 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-[11px] text-ink-faint">Employment</dt>
                    <dd className="text-right text-[11px] text-ink-soft">{current.role.employmentType}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-[11px] text-ink-faint">Work mode</dt>
                    <dd className="text-right text-[11px] text-ink-soft">{current.role.workMode}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-[11px] text-ink-faint">Location</dt>
                    <dd className="text-right text-[11px] text-ink-soft">{current.role.location}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>

          <footer className="hidden flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-6 lg:flex">
            <p className="text-[11px] text-ink-faint">Evidence only. The team sets the bar.</p>
            <Link href={"/roles/" + current.role.id} className="inline-flex items-center gap-1 text-[11px] font-medium text-ink">
              Read the role <ArrowRight className="h-3 w-3" />
            </Link>
          </footer>
        </article>

        <DecisionActions
          className="mt-6"
          displayName={current.role.title}
          remaining={interest.remaining}
          likesRemaining={interest.likesRemaining}
          busy={busy}
          onPass={() => void decide("PASS")}
          onLike={() => void decide("LIKE")}
          onPriorityIntro={() => setIntroOpen(true)}
        />
        <p className="mt-4 hidden text-center text-[12px] text-ink-faint lg:block">
          {likesLeftLabel(interest.likesRemaining)} · {interest.remaining} Priority intro{interest.remaining === 1 ? "" : "s"} left
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-[920px]">
        <BelowBar cards={belowBar} />
      </div>

      <PriorityIntroDialog
        open={introOpen}
        onOpenChange={setIntroOpen}
        recipientName={current.role.employer.name}
        remaining={interest.remaining}
        busy={busy}
        onSend={(reason) => decide("PRIORITY_INTRO", reason)}
      />
      <ShortcutConfirmDialog
        open={Boolean(shortcutAction)}
        action={shortcutAction}
        displayName={current.role.title}
        busy={busy}
        onCancel={() => setShortcutAction(null)}
        onConfirm={() => {
          if (!shortcutAction) return;
          const action = shortcutAction;
          setShortcutAction(null);
          void decide(action);
        }}
      />
      <MatchDialog
        open={matchOpen}
        onOpenChange={setMatchOpen}
        personaName={personaName}
        matchName={matchName}
        matchSubtitle={matchSubtitle}
        matchId={matchId}
      />
    </>
  );
}

function BelowBar({ cards }: { cards: CandidateFeedCard[] }) {
  if (cards.length === 0) return null;
  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5" data-testid="candidate-below-bar">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
        <div>
          <h3 className="text-[14px] font-semibold text-ink">Roles below the team&apos;s stated bar</h3>
          <p className="mt-1 text-[12px] leading-5 text-ink-muted">
            These are not auto-rejections. Your evidence is shown and a human can still review the role. The
            assessment result itself is final for this cycle.
          </p>
        </div>
      </div>
      <div className="mt-3 divide-y divide-line border-t border-line">
        {cards.map((card) => (
          <div key={card.role.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-ink">{card.role.title}</p>
              <p className="mt-0.5 text-[11px] text-ink-muted">{card.role.employer.name}</p>
              <EvidenceStatus
                className="mt-2"
                requirements={
                  card.evidence?.requirements ??
                  (card.role.assessment
                    ? [{ assessment: card.role.assessment, score: null, requiredScore: card.role.requiredScore ?? 0, meets: false }]
                    : [])
                }
              />
            </div>
            <div className="flex items-center gap-3">
              {card.role.assessment ? (
                <Link href={"/assessments/" + card.role.assessment.id} className="text-[11px] font-medium text-accent">
                  View assessment
                </Link>
              ) : null}
              <Link href={"/roles/" + card.role.id} className="text-[11px] font-medium text-ink-muted">
                View role
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}