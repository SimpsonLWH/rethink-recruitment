"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Clock3, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { EvidenceStateBadge, RunStatusBadge } from "@/components/screening/screening-badges";
import type {
  ClaimSummary,
  EvidenceState,
  ScreeningRunStatus as RunStatus,
} from "@/lib/screening";
import type { AssessmentFeedState } from "@/lib/repo";
import { cn, formatRelativeTime } from "@/lib/utils";

export interface ScreeningQueueItemView {
  candidateId: string;
  name: string;
  monogram: string;
  palette: string;
  headline: string;
  location: string;
  availability: string;
  evidenceState: AssessmentFeedState;
  score: number | null;
  requiredScore: number | null;
  assessmentTitle: string | null;
  runStatus: RunStatus | null;
  openItems: number;
  mustHaveAssessed: number;
  mustHaveTotal: number;
  summaryState: EvidenceState;
  summaryHeadline: string;
  claims: ClaimSummary;
  hasNotes: boolean;
  waitingSince: string | null;
  overdue: boolean;
}

type Filter = "all" | "checking" | "ready" | "decided";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "checking", label: "Needs checking" },
  { id: "ready", label: "Ready to discuss" },
  { id: "decided", label: "Decided" },
];

function runStatusOf(item: ScreeningQueueItemView): RunStatus {
  return item.runStatus ?? "OPEN";
}

export function ScreeningQueue({ roleId, items }: { roleId: string; items: ScreeningQueueItemView[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      all: items.length,
      checking: items.filter((item) => item.openItems > 0 && runStatusOf(item) === "OPEN").length,
      ready: items.filter((item) => runStatusOf(item) === "OPEN" && item.summaryState === "ENOUGH_TO_DISCUSS").length,
      decided: items.filter((item) => runStatusOf(item) !== "OPEN").length,
    }),
    [items],
  );

  const needle = query.trim().toLowerCase();
  const visible = items.filter((item) => {
    if (needle && !(item.name + " " + item.headline).toLowerCase().includes(needle)) return false;
    if (filter === "checking") return item.openItems > 0 && runStatusOf(item) === "OPEN";
    if (filter === "ready") return runStatusOf(item) === "OPEN" && item.summaryState === "ENOUGH_TO_DISCUSS";
    if (filter === "decided") return runStatusOf(item) !== "OPEN";
    return true;
  });

  return (
    <section aria-labelledby="queue-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="queue-heading" className="text-[18px] font-semibold leading-tight">
            Screening queue
          </h2>
          <p className="mt-1 text-[12px] text-ink-muted">
            Event order, never a score order. {counts.checking} of {counts.all} still need a check.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Find a candidate</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a candidate"
              className="h-10 w-[190px] rounded-md border border-line bg-surface pl-8 pr-2.5 text-[11.5px] text-ink outline-none placeholder:text-ink-faint focus:border-accent sm:h-8"
            />
          </label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter the queue">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition sm:h-8",
                filter === option.id
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {option.label}
              <span className={cn("tabular-nums", filter === option.id ? "text-white/70" : "text-ink-faint")}>{counts[option.id]}</span>
            </button>
          ))}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center">
          <p className="text-[14px] font-medium text-ink">Nothing in this view.</p>
          <p className="mx-auto mt-1 max-w-md text-[12px] leading-6 text-ink-muted">
            Switch back to all candidates. A candidate only leaves the queue when a human records a decision.
          </p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {visible.map((item) => (
            <Link
              key={item.candidateId}
              href={"/prescreen/" + roleId + "/" + item.candidateId}
              className="group block px-4 py-4 transition hover:bg-accent-tint/40 sm:px-5"
            >
              <div className="flex items-start gap-3">
                <Avatar name={item.name} monogram={item.monogram} palette={item.palette} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold leading-tight text-ink">{item.name}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">{item.headline}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      {runStatusOf(item) === "OPEN" ? <EvidenceStateBadge state={item.summaryState} /> : null}
                      <RunStatusBadge status={runStatusOf(item)} />
                    </div>
                  </div>

                  <p className="mt-2 text-[11.5px] leading-5 text-ink-soft">{item.summaryHeadline}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <ClipboardCheck className="h-3 w-3 text-ink-faint" aria-hidden />
                      {item.mustHaveAssessed}/{item.mustHaveTotal} must-haves evidenced
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-ink-faint" aria-hidden />
                      {item.claims.verified} checked · {item.claims.withArtifact} with an artifact
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3 w-3 text-ink-faint" aria-hidden />
                      {item.openItems} open check{item.openItems === 1 ? "" : "s"}
                    </span>
                    {item.waitingSince && runStatusOf(item) === "OPEN" ? (
                      <span className={cn("inline-flex items-center gap-1", item.overdue ? "font-medium text-amber-800" : "text-ink-faint")}>
                        <Clock3 className="h-3 w-3" aria-hidden />
                        {item.overdue ? "Past the review target" : "Waiting " + formatRelativeTime(item.waitingSince)}
                      </span>
                    ) : null}
                    {item.hasNotes ? <span className="text-ink-faint">Has reviewer notes</span> : null}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.assessmentTitle ? (
                        <span className="rounded border border-line bg-paper px-2 py-0.5 text-[10px] text-ink-muted">
                          {item.assessmentTitle}
                          {item.score !== null && item.requiredScore !== null
                            ? " · " + item.score + "/100 vs bar " + item.requiredScore
                            : item.score !== null
                              ? " · " + item.score + "/100"
                              : " · no result"}
                        </span>
                      ) : (
                        <span className="rounded border border-line bg-paper px-2 py-0.5 text-[10px] text-ink-muted">No work sample yet</span>
                      )}
                      <span className="text-[10px] text-ink-faint">{item.availability}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
                      Open packet <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
