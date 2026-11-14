"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Info } from "lucide-react";
import { toast } from "sonner";
import { MatchDialog } from "@/components/discovery/match-dialog";
import { PriorityIntroDialog } from "@/components/discovery/priority-intro-dialog";
import { ShortcutConfirmDialog } from "@/components/discovery/shortcut-confirm-dialog";
import { EvidenceStatus } from "@/components/evidence/evidence-status";
import { ReviewCard } from "@/components/review/review-card";
import { EmptyState } from "@/components/brand/empty-state";
import { Users } from "lucide-react";
import type { AssessmentRequirementEvidence, DecisionResult, EmployerFeed, EmployerFeedCard, InterestState, RoleDetail } from "@/lib/repo";

function difficultyLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function EmployerFeedDeck({
  feed,
  activeRole,
  employerName,
  initialInterest,
}: {
  feed: EmployerFeed;
  activeRole: RoleDetail;
  employerName: string;
  initialInterest: InterestState;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<EmployerFeedCard | null>(null);
  const [interest, setInterest] = useState(initialInterest);
  const [busy, setBusy] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [shortcutAction, setShortcutAction] = useState<"PASS" | "LIKE" | "PRIORITY_INTRO" | null>(null);
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchName, setMatchName] = useState("");
  const [matchSubtitle, setMatchSubtitle] = useState("");

  const current = selected ?? feed.main[index];

  const decide = useCallback(
    async (card: EmployerFeedCard, action: "LIKE" | "PASS" | "PRIORITY_INTRO", reason?: string) => {
      if (busy) return;
      if (action === "LIKE" && interest.likesRemaining <= 0) {
        toast.error("No Likes left for this event. A response to an accepted invitation still works.");
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
          body: JSON.stringify({ roleId: activeRole.id, candidateId: card.candidate.id, action, reason }),
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
        setSelected(null);
        setIndex((value) => value + 1);
        if (data.matched && data.matchId) {
          setMatchId(data.matchId);
          setMatchName(card.candidate.name);
          setMatchSubtitle(activeRole.title);
          setMatchOpen(true);
        } else {
          toast.success(
            action === "PASS"
              ? "Passed. No penalty. If they had expressed interest, an honest update was sent."
              : action === "PRIORITY_INTRO"
                ? "Priority intro sent. It counts as a yes on your side."
                : "Like sent. A match needs both sides.",
          );
        }
        router.refresh();
      } catch {
        toast.error("Network hiccup. Try again.");
      } finally {
        setBusy(false);
      }
    },
    [activeRole.id, activeRole.title, busy, interest, router],
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

  return (
    <>
      <div className="mx-auto w-full max-w-[860px]" data-testid="employer-feed">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Your stated bar</p>
            <p className="mt-1 text-[12px] text-ink-soft">
              {activeRole.assessment
                ? activeRole.assessment.family + " " + activeRole.assessment.version + " · " + difficultyLabel(activeRole.assessment.difficulty) + " · bar " + (activeRole.requiredScore ?? "not set")
                : "No live role card"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-ink-muted">
            <span>{interest.likesRemaining} Likes left</span>
            <span>{interest.remaining} Priority intros left</span>
            <Link href="/roles" className="font-medium text-accent">Edit role card</Link>
          </div>
        </div>

        {current ? (
          <>
            {selected ? (
              <div className="mb-3 rounded-xl border border-accent/25 bg-accent-tint px-3 py-2 text-[12px] text-ink-soft">
                Reviewing a candidate below your stated bar. Your decision is still human.
                <button type="button" onClick={() => setSelected(null)} className="ml-2 font-medium text-accent">Back to feed</button>
              </div>
            ) : null}
            <ReviewCard
              key={current.candidate.id}
              candidate={current.candidate}
              activeRole={activeRole}
              priorityIntroState={interest}
              likesRemaining={interest.likesRemaining}
              evidence={current.evidence}
              busy={busy}
              onPass={() => void decide(current, "PASS")}
              onLike={() => void decide(current, "LIKE")}
              onPriorityIntro={() => setIntroOpen(true)}
            />
            <p className="mt-3 text-center text-[11px] text-ink-faint">
              {feed.main.length} in the mixed feed · below-bar and no-evidence candidates stay visible below · no ranking
            </p>
          </>
        ) : (
          <EmptyState
            icon={Users}
            title="That's the mixed feed."
            body="Nothing was auto-rejected. Below-bar candidates and candidates without assessment evidence are still listed below, and discovery is a separate lane."
            action={
              <Link href="/discovery" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">
                Open discovery lane <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
        )}

        <SecondarySection
          title="Below your stated bar (review anyway)"
          body="These candidates scored below the bar you set. They are not auto-rejected. The named owner and review expectation are visible."
          cards={feed.belowBar}
          activeRole={activeRole}
          onReview={(card) => setSelected(card)}
        />
        <SecondarySection
          title="No assessment yet, still visible"
          body="No score is not a failure. These candidates can still be reviewed, invited to evidence, or passed by a human."
          cards={feed.notEvidenced}
          activeRole={activeRole}
          onReview={(card) => setSelected(card)}
        />
      </div>

      {current ? (
        <PriorityIntroDialog
          open={introOpen}
          onOpenChange={setIntroOpen}
          recipientName={current.candidate.name}
          remaining={interest.remaining}
          busy={busy}
          onSend={(reason) => decide(current, "PRIORITY_INTRO", reason)}
        />
      ) : null}
      <ShortcutConfirmDialog
        open={Boolean(shortcutAction)}
        action={shortcutAction}
        displayName={current?.candidate.name ?? "this candidate"}
        busy={busy}
        onCancel={() => setShortcutAction(null)}
        onConfirm={() => {
          if (!shortcutAction || !current) return;
          const action = shortcutAction;
          setShortcutAction(null);
          void decide(current, action);
        }}
      />
      <MatchDialog
        open={matchOpen}
        onOpenChange={setMatchOpen}
        personaName={employerName}
        matchName={matchName}
        matchSubtitle={matchSubtitle}
        matchId={matchId}
      />
    </>
  );
}

function SecondarySection({
  title,
  body,
  cards,
  activeRole,
  onReview,
}: {
  title: string;
  body: string;
  cards: EmployerFeedCard[];
  activeRole: RoleDetail;
  onReview: (card: EmployerFeedCard) => void;
}) {
  if (cards.length === 0) return null;
  return (
    <section className="mt-6 rounded-xl border border-line bg-surface p-4 sm:p-5" data-testid={title.includes("Below") ? "below-bar-section" : "no-evidence-section"}>
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
        <div>
          <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-[12px] leading-5 text-ink-muted">{body}</p>
          <p className="mt-1 text-[11px] text-ink-faint">
            Review owner: {activeRole.reviewOwnerName ?? activeRole.employer.contactName} · expected within {activeRole.reviewDueHours}h of a review request
          </p>
        </div>
      </div>
      <div className="mt-3 divide-y divide-line border-t border-line">
        {cards.map((card) => (
          <div key={card.candidate.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-ink">{card.candidate.name}</p>
              <EvidenceStatus
                className="mt-2"
                requirements={
                  (card.evidence?.requirements ??
                    (activeRole.assessment
                      ? [{ assessment: activeRole.assessment, score: null, requiredScore: activeRole.requiredScore ?? 0, meets: false }]
                      : [])) as AssessmentRequirementEvidence[]
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Link href={"/candidates/" + card.candidate.id} className="text-[11px] font-medium text-ink-muted">Profile</Link>
              <button type="button" onClick={() => onReview(card)} className="text-[11px] font-medium text-accent">
                Review anyway
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}