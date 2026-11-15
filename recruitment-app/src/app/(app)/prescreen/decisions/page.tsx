import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, Download, History } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { PageHeader } from "@/components/brand/page-header";
import { RunStatusBadge } from "@/components/screening/screening-badges";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { cn, formatDuration, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Decision log",
  description: "Every recorded pre-screen decision, its reason, basis, author and timing.",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "ADVANCE", label: "Moved to interview" },
  { id: "HOLD", label: "On hold" },
  { id: "DECLINE", label: "Not moving forward" },
] as const;

export default async function DecisionLogPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/enter");
  if (session.side !== "employer") redirect("/dashboard");

  const params = await searchParams;
  const requested = params.status;
  const status = requested === "ADVANCE" || requested === "HOLD" || requested === "DECLINE" ? requested : "all";
  const repo = getRepository();
  const all = await repo.getScreeningDecisions(session.employer.id, { limit: 200 });
  const visible = status === "all" ? all : all.filter((decision) => decision.status === status);

  const counts = {
    all: all.length,
    ADVANCE: all.filter((decision) => decision.status === "ADVANCE").length,
    HOLD: all.filter((decision) => decision.status === "HOLD").length,
    DECLINE: all.filter((decision) => decision.status === "DECLINE").length,
  };
  const durations = all
    .filter((decision) => decision.decidedAt)
    .map((decision) => (new Date(decision.decidedAt!).getTime() - new Date(decision.createdAt).getTime()) / (60 * 60 * 1000))
    .filter((hours) => Number.isFinite(hours) && hours >= 0)
    .sort((left, right) => left - right);
  const median = durations.length ? durations[Math.floor(durations.length / 2)] : null;

  return (
    <div className="animate-fade-up" data-testid="decision-log">
      <div className="pb-4">
        <Link href="/prescreen" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Pre-screen queues
        </Link>
      </div>

      <PageHeader
        title="Decision log"
        description="Every recorded pre-screen decision, with its reason, basis, author and timing. This is an internal record, not a candidate score."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Decisions", value: counts.all, note: "recorded" },
          { label: "Moved to interview", value: counts.ADVANCE, note: "no automatic message" },
          { label: "On hold", value: counts.HOLD, note: "review again later" },
          { label: "Not moving forward", value: counts.DECLINE, note: "outcome optional" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{stat.label}</p>
            <p className="mt-1.5 text-[26px] font-semibold leading-none tabular-nums text-ink">{stat.value}</p>
            <p className="mt-1 text-[10.5px] text-ink-faint">{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-2.5">
        <p className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
          <Clock3 className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
          Median time from packet open to decision:{" "}
          <span className="font-medium text-ink">{median === null ? "not enough records" : formatDuration(median)}</span>
        </p>
        <p className="inline-flex items-center gap-1.5 text-[10.5px] text-ink-faint">
          <History className="h-3.5 w-3.5" aria-hidden /> Timing is operational context, not a performance score.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter decisions">
        {FILTERS.map((filter) => (
          <Link
            key={filter.id}
            href={filter.id === "all" ? "/prescreen/decisions" : "/prescreen/decisions?status=" + filter.id}
            aria-current={status === filter.id ? "page" : undefined}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition sm:h-8",
              status === filter.id ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {filter.label}
            <span className={cn("tabular-nums", status === filter.id ? "text-white/70" : "text-ink-faint")}>{counts[filter.id]}</span>
          </Link>
        ))}
        </div>
        <a
          href="/api/screening/decisions/export"
          download
          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-[11px] font-medium text-ink-muted transition hover:border-line-strong hover:text-ink sm:h-8"
        >
          <Download className="h-3.5 w-3.5" aria-hidden /> Export CSV
        </a>
      </div>

      {visible.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-line-strong bg-surface px-5 py-10 text-center">
          <p className="text-[14px] font-medium text-ink">No decisions in this view.</p>
          <p className="mx-auto mt-1 max-w-md text-[12px] leading-6 text-ink-muted">
            A decision appears here only when a reviewer rates the criteria, writes a reason and confirms it.
          </p>
          <Link href="/prescreen" className="mt-3 inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-[12px] font-medium text-white">
            Open a queue
          </Link>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {visible.map((decision) => {
            const hours = decision.decidedAt
              ? (new Date(decision.decidedAt).getTime() - new Date(decision.createdAt).getTime()) / (60 * 60 * 1000)
              : null;
            const href = "/prescreen/" + decision.roleId + "/" + decision.candidateId;
            return (
              <article key={decision.runId} className="px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar name={decision.candidateName} monogram={decision.candidateMonogram} palette={decision.candidatePalette} size="sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={href} className="text-[14px] font-semibold text-ink hover:text-accent">
                          {decision.candidateName}
                        </Link>
                        <RunStatusBadge status={decision.status} />
                        {decision.outcomeSentAt ? (
                          <span className="rounded-full border border-accent/25 bg-accent-tint px-2 py-0.5 text-[9.5px] font-medium text-accent-deep">
                            Outcome sent
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-muted">{decision.roleTitle}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-ink-faint">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" aria-hidden /> Closed in {hours === null ? "—" : formatDuration(hours)}
                    </span>
                    <span>{decision.decidedBy ?? "Reviewer"}</span>
                    <span>{decision.assignedReviewerName ? "Assigned to " + decision.assignedReviewerName : "Unassigned"}</span>
                    <span>{decision.decidedAt ? formatRelativeTime(decision.decidedAt) : "time unknown"}</span>
                  </div>
                </div>

                {decision.reason ? <p className="mt-2 max-w-3xl text-[12px] leading-6 text-ink-soft">{decision.reason}</p> : null}
                {decision.basis ? <p className="mt-1 max-w-3xl text-[10.5px] leading-5 text-ink-faint">Basis: {decision.basis}</p> : null}

                <div className="mt-2 flex flex-wrap items-center gap-4 text-[10.5px] font-medium">
                  <Link href={href} className="inline-flex items-center gap-1 text-accent">
                    Open packet <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                  <a href={"/api/screening/" + decision.roleId + "/" + decision.candidateId + "/export"} download className="inline-flex items-center gap-1 text-ink-muted hover:text-ink">
                    <Download className="h-3 w-3" aria-hidden /> Export record
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
