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
        toast.error("No Likes left for this event. You can still accept an invitation or a Priority intro.");
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
          toast.error("No Likes left for this event.");
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
            bestScore: null,
            requiredScore: current.role.requiredScore ?? 0,
            meets: false,
          },
        ]
      : []);

  return (
    <>
      <div className="mx-auto w-full max-w-[760px]" data-testid="candidate-feed">
        <div className="rounded-xl border border-line bg-surface p-4 shadow-card sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-paper font-display text-[15px] font-semibold text-ink-soft">
                {current.role.employer.logoMark}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink-soft">{current.role.employer.name}</p>
                <p className="mt-0.5 truncate text-[12px] text-ink-muted">{current.role.employer.tagline}</p>
              </div>
            </div>
            <span className="shrink-0 text-[10px] text-ink-faint">No ranking</span>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Open role</p>
            <h2 className="mt-2 font-sans text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[30px]">{current.role.title}</h2>
            <p className="mt-2 text-[12px] text-ink-muted">
              {current.role.employmentType} · {current.role.workMode} · {current.role.location}
            </p>
          </div>

          <EvidenceStatus requirements={requirements} className="mt-3" />

          <p className="mt-4 line-clamp-3 text-[14px] leading-6 text-ink-soft">{current.role.summary}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {current.role.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="rounded border border-line bg-paper px-2 py-0.5 text-[11px] text-ink-muted">
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <p className="text-[11px] text-ink-faint">Evidence only. The team sets the bar.</p>
            <Link href={"/roles/" + current.role.id} className="inline-flex items-center gap-1 text-[11px] font-medium text-ink">
              Read the role <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

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
          {interest.likesRemaining} Likes left · {interest.remaining} Priority intros left · a match needs both sides
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-[760px]">
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
            These are not auto-rejections. Your evidence is shown, and you can retake or add experience before a human
            reviews you.
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
                    ? [{ assessment: card.role.assessment, bestScore: null, requiredScore: card.role.requiredScore ?? 0, meets: false }]
                    : [])
                }
              />
            </div>
            <div className="flex items-center gap-3">
              {card.role.assessment ? (
                <Link href={"/assessments/" + card.role.assessment.id} className="text-[11px] font-medium text-accent">
                  {card.evidence?.canRetake ? "Retake" : "View assessment"}
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