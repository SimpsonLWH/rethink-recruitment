"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { toast } from "sonner";
import { MatchDialog } from "@/components/discovery/match-dialog";
import { PriorityIntroDialog } from "@/components/discovery/priority-intro-dialog";
import { FeedPanel } from "@/components/review/feed-panel";
import { FeedWhySheet } from "@/components/review/feed-why-sheet";
import { ReviewCard } from "@/components/review/review-card";
import { PRIORITY_INTRO } from "@/lib/brand";
import {
  matchCandidates,
  type CandidateFeedMatch,
  type FeedCriterion,
} from "@/lib/feed";
import type { CandidateDetail, DecisionResult, PriorityIntroState, RoleDetail } from "@/lib/repo";

function shortCriterion(criterion: { kind: string; value: string; years?: number; skill?: string }): string {
  if (criterion.kind === "EXPERIENCE") {
    return (criterion.years ?? 0) + "+ years" + (criterion.skill ? " " + criterion.skill : "");
  }
  return criterion.value;
}

function emptyMatch(candidateId: string): CandidateFeedMatch {
  return {
    candidateId,
    criteria: [],
    state: "in_feed",
    inFeed: true,
    hasNotMet: false,
    hasUnknown: false,
    hasRelated: false,
  };
}

export function EmployerDiscovery({
  candidates,
  activeRole,
  employerName,
  initialPriorityIntroState,
}: {
  candidates: CandidateDetail[];
  activeRole: RoleDetail;
  employerName: string;
  initialPriorityIntroState: PriorityIntroState;
}) {
  const candidateById = useMemo(() => new Map(candidates.map((candidate) => [candidate.id, candidate])), [candidates]);
  const [applied, setApplied] = useState<FeedCriterion[] | null>(null);
  const [broadened, setBroadened] = useState(false);
  const [manualInclude, setManualInclude] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(initialPriorityIntroState.remaining);
  const [busy, setBusy] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchName, setMatchName] = useState("");
  const [matchSubtitle, setMatchSubtitle] = useState("");
  const [recentlyInterested, setRecentlyInterested] = useState<string | null>(null);
  const [whyCandidateId, setWhyCandidateId] = useState<string | null>(null);

  const matches = useMemo(() => {
    if (!applied) return candidates.map((candidate) => emptyMatch(candidate.id));
    return matchCandidates(candidates, applied);
  }, [candidates, applied]);

  const deckIds = useMemo(() => {
    if (!applied) return candidates.map((candidate) => candidate.id);
    return matches
      .filter(
        (match) =>
          match.state === "in_feed" ||
          (broadened && match.state === "not_stated") ||
          manualInclude.includes(match.candidateId),
      )
      .map((match) => match.candidateId);
  }, [applied, matches, broadened, manualInclude, candidates]);

  const currentId = deckIds[index];
  const current = currentId ? candidateById.get(currentId) : undefined;
  const currentMatch = currentId ? matches.find((match) => match.candidateId === currentId) ?? null : null;
  const notStatedMatches = applied ? matches.filter((match) => match.state === "not_stated") : [];
  const outsideMatches = applied ? matches.filter((match) => match.state === "outside") : [];
  const interestedCandidate = recentlyInterested ? candidateById.get(recentlyInterested) : undefined;
  const whyCandidate = whyCandidateId ? candidateById.get(whyCandidateId) : null;
  const whyMatch = whyCandidateId ? matches.find((match) => match.candidateId === whyCandidateId) ?? null : null;

  useEffect(() => {
    setIndex(0);
  }, [applied, broadened]);

  const resetFeed = useCallback(() => {
    setApplied(null);
    setBroadened(false);
    setManualInclude([]);
    setIndex(0);
  }, []);

  const applyFeed = useCallback((criteria: FeedCriterion[]) => {
    setApplied(criteria);
    setBroadened(false);
    setManualInclude([]);
    setIndex(0);
  }, []);

  const includeCandidate = useCallback((candidateId: string) => {
    setManualInclude((current) => (current.includes(candidateId) ? current : [...current, candidateId]));
  }, []);

  const decide = useCallback(
    async (action: "LIKE" | "PASS" | "PRIORITY_INTRO", reason?: string) => {
      if (!current || busy) return;
      if (action === "PRIORITY_INTRO" && remaining <= 0) {
        toast.error("No " + PRIORITY_INTRO.plural.toLowerCase() + " left for this event.");
        return;
      }
      setBusy(true);
      try {
        const response = await fetch("/api/decisions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            roleId: activeRole.id,
            candidateId: current.id,
            action,
            reason,
          }),
        });
        const data = (await response.json()) as DecisionResult & { error?: string };
        if (!response.ok) {
          toast.error(data.error ?? "Could not save that decision.");
          setBusy(false);
          return;
        }
        if (action === "PRIORITY_INTRO") {
          setRemaining(data.priorityIntrosRemaining);
          setIntroOpen(false);
        }
        if (action !== "PASS") setRecentlyInterested(current.id);
        setMatchId(data.matchId);
        setMatchName(current.name);
        setMatchSubtitle(activeRole.title);
        setIndex((value) => value + 1);
        setBusy(false);
        if (data.matched) setMatchOpen(true);
        else {
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
        setBusy(false);
      }
    },
    [current, busy, remaining, activeRole.id, activeRole.title],
  );

  const whyForCurrent = useMemo(() => {
    if (!currentMatch || !applied) return undefined;
    const matched = currentMatch.criteria.filter((entry) => entry.status === "exact" || entry.status === "related");
    const notes = currentMatch.criteria
      .filter((entry) => entry.status === "unknown" || entry.status === "uncertain" || entry.status === "related")
      .map((entry) => {
        if (entry.status === "related") return entry.relatedSkill ? entry.relatedSkill + " related, not exact" : "Related skill, not exact";
        if (entry.status === "uncertain") return shortCriterion(entry.criterion) + " · duration uncertain";
        return shortCriterion(entry.criterion) + " · not stated";
      });
    const summary =
      currentMatch.state === "outside"
        ? "Outside your criteria — you chose to review anyway."
        : matched.length > 0
          ? matched.map((entry) => shortCriterion(entry.criterion) + (entry.status === "related" ? " (related)" : "")).join(" · ")
          : "Not stated — shown anyway because unknown is not a fail.";
    return {
      summary,
      notes,
      onOpen: () => setWhyCandidateId(currentId ?? null),
    };
  }, [currentMatch, applied, currentId]);

  return (
    <div data-testid="employer-discovery" className="mx-auto flex w-full max-w-[860px] flex-col">
      <FeedPanel
        className="order-2 mt-4 lg:order-1 lg:mt-0"
        applied={applied}
        matches={matches}
        broadened={broadened}
        onApply={applyFeed}
        onBroaden={() => setBroadened(true)}
        onReset={resetFeed}
      />

      <div className="order-1 lg:order-2 lg:mt-4">
        {current ? (
          <ReviewCard
            key={current.id}
            candidate={current}
            activeRole={activeRole}
            priorityIntroState={{
              total: initialPriorityIntroState.total,
              used: initialPriorityIntroState.used,
              remaining,
              received: initialPriorityIntroState.received,
            }}
            busy={busy}
            why={whyForCurrent}
            onPass={() => void decide("PASS")}
            onLike={() => void decide("LIKE")}
            onPriorityIntro={() => setIntroOpen(true)}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {applied ? "No one states every criterion" : "That's the whole deck"}
            </p>
            <h2 className="mt-3 font-display text-[30px] leading-tight">
              {applied ? "Unknown is not a fail." : "You reviewed everyone."}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[13px] leading-6 text-ink-muted">
              {applied
                ? "The Not stated section below still shows profiles that do not state one or more criteria. Broaden the feed to include them, or reset the criteria."
                : "Nothing was auto-rejected. Check matches and " + PRIORITY_INTRO.plural.toLowerCase() + ", or switch personas."}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {applied && notStatedMatches.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBroadened(true)}
                  className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-[12px] font-medium text-white"
                >
                  Include not-stated profiles
                </button>
              )}
              <button
                type="button"
                onClick={resetFeed}
                className="inline-flex h-10 items-center rounded-full border border-line px-4 text-[12px] font-medium text-ink"
              >
                Reset feed
              </button>
              <Link href="/matches" className="inline-flex h-10 items-center gap-1 rounded-full border border-line px-4 text-[12px] font-medium text-ink">
                Matches <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {interestedCandidate && (
        <div className="order-3 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3" data-testid="full-profile-unlocked">
          <p className="text-[12px] leading-5 text-ink-soft">
            <span className="font-medium text-ink">{interestedCandidate.name}</span> — you expressed interest. The full
            profile and employer Q&amp;A are unlocked.
          </p>
          <Link
            href={"/candidates/" + interestedCandidate.id}
            className="inline-flex h-10 items-center gap-1 rounded-full bg-accent px-3 text-[11px] font-medium text-white"
          >
            Open full profile <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {applied && (
        <div className="order-3 mt-8 space-y-6">
          {notStatedMatches.length > 0 && (
            <section data-testid="not-stated-section">
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">Not stated — still visible</h3>
                  <p className="mt-1 text-[12px] leading-5 text-ink-muted">
                    These profiles do not state one or more criteria. They are not a failure, and they are not dropped.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBroadened(true)}
                  disabled={broadened}
                  className="text-[11px] font-medium text-accent disabled:text-ink-faint"
                  data-testid="feed-include-not-stated"
                >
                  {broadened ? "Included in the deck" : "Include all in deck"}
                </button>
              </div>
              <div className="mt-3 divide-y divide-line border-y border-line">
                {notStatedMatches.map((match) => {
                  const candidate = candidateById.get(match.candidateId);
                  if (!candidate) return null;
                  const notes = match.criteria
                    .filter((entry) => entry.status === "unknown" || entry.status === "uncertain")
                    .map((entry) => shortCriterion(entry.criterion) + (entry.status === "uncertain" ? " (duration uncertain)" : ""));
                  return (
                    <div key={match.candidateId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-ink">{candidate.name}</p>
                        <p className="mt-0.5 text-[12px] text-ink-muted">
                          <span className="font-medium text-ink-soft">Not stated: </span>
                          {notes.join(" · ") || "a criterion"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setWhyCandidateId(candidate.id)}
                          className="text-[11px] font-medium text-ink-muted"
                        >
                          Why
                        </button>
                        <button
                          type="button"
                          onClick={() => includeCandidate(candidate.id)}
                          className="text-[11px] font-medium text-accent"
                        >
                          {manualInclude.includes(candidate.id) || broadened ? "In deck" : "Include"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {outsideMatches.length > 0 && (
            <section data-testid="outside-criteria">
              <div className="border-t border-line pt-5">
                <h3 className="text-[15px] font-semibold text-ink">Outside your criteria</h3>
                <p className="mt-1 text-[12px] leading-5 text-ink-muted">
                  These profiles state otherwise for at least one criterion. They stay visible; a human can still
                  review them.
                </p>
              </div>
              <div className="mt-3 divide-y divide-line border-y border-line">
                {outsideMatches.map((match) => {
                  const candidate = candidateById.get(match.candidateId);
                  if (!candidate) return null;
                  const notes = match.criteria
                    .filter((entry) => entry.status === "not_met")
                    .map((entry) => shortCriterion(entry.criterion) + " · " + entry.explanation);
                  return (
                    <div key={match.candidateId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-ink">{candidate.name}</p>
                        <p className="mt-0.5 text-[12px] leading-5 text-ink-muted">{notes.join(" · ")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setWhyCandidateId(candidate.id)}
                          className="text-[11px] font-medium text-ink-muted"
                        >
                          Why
                        </button>
                        <button
                          type="button"
                          onClick={() => includeCandidate(candidate.id)}
                          className="text-[11px] font-medium text-accent"
                        >
                          {manualInclude.includes(candidate.id) ? "In deck" : "Review anyway"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className="flex items-start gap-2 text-[12px] leading-5 text-ink-faint">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <p>Showing {matches.length} profiles. This is a discovery filter, not a ranking or a judgement of a person.</p>
              <Link
                href="/how-it-works#feed"
                className="mt-1 inline-block font-medium text-ink underline decoration-line-strong underline-offset-4"
              >
                How the feed works
              </Link>
            </div>
          </div>
        </div>
      )}

      <PriorityIntroDialog
        open={introOpen}
        onOpenChange={setIntroOpen}
        recipientName={current?.name ?? "this candidate"}
        remaining={remaining}
        busy={busy}
        onSend={(reason) => decide("PRIORITY_INTRO", reason)}
      />

      <MatchDialog
        open={matchOpen}
        onOpenChange={setMatchOpen}
        personaName={employerName}
        matchName={matchName}
        matchSubtitle={matchSubtitle}
        matchId={matchId}
      />

      <FeedWhySheet
        open={Boolean(whyCandidateId)}
        onOpenChange={(open) => {
          if (!open) setWhyCandidateId(null);
        }}
        candidate={whyCandidate ?? null}
        match={whyMatch ?? null}
      />
    </div>
  );
}