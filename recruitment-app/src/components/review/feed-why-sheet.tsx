"use client";

import { Info } from "lucide-react";
import { ProvenanceBadge } from "@/components/brand/evidence-badges";
import type { CandidateFeedMatch, FeedCriterionStatus } from "@/lib/feed";
import type { CandidateDetail, FactView } from "@/lib/repo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_LABEL: Record<FeedCriterionStatus, string> = {
  exact: "Exact",
  related: "Related",
  unknown: "Not stated",
  uncertain: "Duration uncertain",
  not_met: "States otherwise",
};

const STATUS_TONE: Record<FeedCriterionStatus, string> = {
  exact: "text-accent",
  related: "text-accent-deep",
  unknown: "text-ink-muted",
  uncertain: "text-ink-muted",
  not_met: "text-ink-muted",
};

export function FeedWhySheet({
  open,
  onOpenChange,
  candidate,
  match,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateDetail | null;
  match: CandidateFeedMatch | null;
}) {
  if (!candidate || !match) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="feed-why-sheet">
        <DialogHeader>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
            <Info className="h-3.5 w-3.5" /> Why you&apos;re seeing this
          </p>
          <DialogTitle className="mt-1 text-[28px]">{candidate.name}</DialogTitle>
          <DialogDescription>
            A discovery filter, not a ranking. Each criterion below shows the facts it matched, or why it did not.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
          {match.criteria.length === 0 && (
            <p className="rounded-2xl border border-line bg-paper p-4 text-[13px] text-ink-muted">
              No criteria are applied. This profile is in the event&apos;s seeded order.
            </p>
          )}
          {match.criteria.map((result) => {
            const facts: FactView[] = result.factIds
              .map((id) => candidate.facts.find((fact) => fact.id === id))
              .filter((fact): fact is FactView => Boolean(fact));
            return (
              <article key={result.criterion.id} className="rounded-2xl border border-line bg-paper p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-ink">{result.criterion.label}</p>
                  <p className={"text-[11px] font-semibold uppercase tracking-[0.1em] " + STATUS_TONE[result.status]}>
                    {STATUS_LABEL[result.status]}
                  </p>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-ink-muted">{result.explanation}</p>
                {result.countedMonths !== undefined && (
                  <p className="mt-1 text-[11px] text-ink-faint">
                    Counted: {result.countedMonths} months from dated evidence.
                  </p>
                )}
                {result.selfDescribedYears !== undefined && (
                  <p className="mt-1 text-[11px] text-ink-faint">
                    Self-described: {result.selfDescribedYears} years, not added to dated evidence.
                  </p>
                )}
                {result.relatedSkill && (
                  <p className="mt-1 text-[11px] text-ink-faint">
                    Related skill: {result.relatedSkill}, labelled and never counted as an exact match.
                  </p>
                )}
                {facts.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-line pt-2">
                    {facts.map((fact) => (
                      <div key={fact.id}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">{fact.prompt}</p>
                        <p className="mt-1 text-[12px] leading-5 text-ink-soft">{fact.claim}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                          <ProvenanceBadge provenance={fact.provenance} />
                          {fact.evidenceUrl && <span>Evidence link attached</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <p className="border-t border-line pt-3 text-[11px] leading-5 text-ink-faint">
          Unknown is not a failure. Related skills are labelled, never exact. Under-bar dated evidence is visible in
          Outside your criteria, not silently rejected.
        </p>
      </DialogContent>
    </Dialog>
  );
}
