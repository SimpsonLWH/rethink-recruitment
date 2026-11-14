"use client";

import { useMemo, useState } from "react";
import { Info, MapPin } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { DecisionActions } from "@/components/discovery/decision-actions";
import { EvidenceSheet } from "@/components/review/evidence-sheet";
import { ReviewModuleCard } from "@/components/review/review-modules";
import { buildReviewModules } from "@/lib/profile";
import type { CandidateDetail, FactView, PriorityIntroState, RoleDetail } from "@/lib/repo";

interface WhyLine {
  summary: string;
  notes?: string[];
  onOpen?: () => void;
}

export function ReviewCard({
  candidate,
  activeRole,
  priorityIntroState,
  busy,
  why,
  onPass,
  onLike,
  onPriorityIntro,
}: {
  candidate: CandidateDetail;
  activeRole: RoleDetail;
  priorityIntroState: PriorityIntroState;
  busy: boolean;
  why?: WhyLine;
  onPass: () => void;
  onLike: () => void;
  onPriorityIntro: () => void;
}) {
  const modules = useMemo(() => buildReviewModules(candidate, 4), [candidate]);
  const [evidence, setEvidence] = useState<{ title: string; facts: FactView[] } | null>(null);

  return (
    <>
      <article
        className="overflow-hidden rounded-[24px] border border-line bg-surface shadow-card"
        data-testid="review-card"
      >
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar name={candidate.name} monogram={candidate.monogram} palette={candidate.palette} size="sm" />
              <div className="min-w-0">
                <h2 className="font-display text-[26px] leading-none tracking-[-0.04em] sm:text-[30px]">{candidate.name}</h2>
                <p className="mt-1 text-[12px] text-ink-soft">{candidate.headline}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-faint">
                  <MapPin className="h-3 w-3" /> {candidate.location}
                </p>
              </div>
            </div>
            <p className="text-right text-[11px] leading-5 text-ink-faint">
              Reviewing for
              <br />
              <span className="font-medium text-ink-soft">{activeRole.title}</span>
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-3 border-y border-line py-2">
            <div className="min-w-0">
              <p className="flex items-start gap-1.5 text-[12px] leading-5 text-ink-muted">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
                <span>
                  <span className="font-medium text-ink-soft">Why you&apos;re seeing this: </span>
                  {why?.summary ?? "In event order — no filter applied."}
                </span>
              </p>
              {why?.notes && why.notes.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-5 text-[11px] text-ink-faint">
                  {why.notes.map((note) => (
                    <span key={note}>{note}</span>
                  ))}
                </div>
              )}
            </div>
            {why?.onOpen && (
              <button
                type="button"
                onClick={why.onOpen}
                className="shrink-0 text-[11px] font-medium text-accent underline decoration-accent/30 underline-offset-4"
                data-testid="review-why"
              >
                See the facts
              </button>
            )}
          </div>

          <div className="mt-3 grid items-start gap-2 sm:grid-cols-2">
            {modules.map((module) => (
              <ReviewModuleCard
                key={module.id}
                module={module}
                candidateFacts={candidate.facts}
                onOpen={(title, facts) => setEvidence({ title, facts })}
              />
            ))}
          </div>

        </div>

        <div className="border-t border-line px-4 py-2">
          <DecisionActions
            displayName={candidate.name}
            remaining={priorityIntroState.remaining}
            busy={busy}
            onPass={onPass}
            onLike={onLike}
            onPriorityIntro={onPriorityIntro}
          />
        </div>
      </article>

      <EvidenceSheet
        open={Boolean(evidence)}
        onOpenChange={(open) => {
          if (!open) setEvidence(null);
        }}
        title={evidence?.title ?? "Source facts"}
        facts={evidence?.facts ?? []}
      />
    </>
  );
}
