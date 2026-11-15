import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  FileSearch,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { PageHeader } from "@/components/brand/page-header";
import { RunStatusBadge } from "@/components/screening/screening-badges";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pre-screen",
  description: "Interviewer-led pre-screening built on verified work samples and checkable claims, not CV scanning.",
};

export default async function PrescreenDeskPage() {
  const session = await getSession();
  if (!session) redirect("/enter");
  if (session.side !== "employer") redirect("/dashboard");

  const repo = getRepository();
  const [summaries, decisions] = await Promise.all([
    repo.getScreeningRoles(session.employer.id),
    repo.getRecentScreeningDecisions(session.employer.id, 5),
  ]);
  if (session.employer.roles.length === 0) redirect("/onboarding/role");

  const totals = summaries.reduce(
    (total, summary) => ({
      candidates: total.candidates + summary.counts.total,
      checking: total.checking + summary.counts.needsChecking,
      ready: total.ready + summary.counts.readyToDiscuss,
      overdue: total.overdue + summary.counts.overdue,
      decided: total.decided + summary.counts.advanced + summary.counts.held + summary.counts.declined,
    }),
    { candidates: 0, checking: 0, ready: 0, overdue: 0, decided: 0 },
  );

  return (
    <div className="animate-fade-up" data-testid="prescreen-desk">
      <PageHeader
        title="Pre-screen"
        description="Read verified work, not AI-polished prose. Every candidate here has a work sample or a checkable record. No CV keywords, no AI guesswork, no auto-reject."
        action={
          <Link
            href="/roles"
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line bg-surface px-4 text-[12px] font-medium text-ink"
          >
            <ClipboardList className="h-3.5 w-3.5" aria-hidden /> Role cards
          </Link>
        }
      />

      <section className="overflow-hidden rounded-xl bg-navy text-white" aria-labelledby="prescreen-loop">
        <div className="grid gap-px bg-navy-line sm:grid-cols-3">
          {[
            {
              n: "01",
              title: "A stated bar, not a keyword list",
              body: "Each role turns its assessment bar and signals into a short screening plan. Must-haves are explicit before anyone is reviewed.",
              icon: ListChecks,
            },
            {
              n: "02",
              title: "The record is checked, not scanned",
              body: "A work-sample score, a live artifact, an employer confirmation. Candidate prose stays prose until a human checks it.",
              icon: BadgeCheck,
            },
            {
              n: "03",
              title: "Leave with a kit and a decision",
              body: "A time-boxed conversation kit, a criterion scorecard and an audit trail. A human decides; nothing is auto-rejected.",
              icon: MessageSquareText,
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.n} className="bg-navy p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-4 w-4 text-accent-bright" aria-hidden />
                  <span className="text-[10px] font-semibold tracking-[0.16em] text-white/35">{step.n}</span>
                </div>
                <h2 className="mt-4 text-[14px] font-semibold leading-snug text-white">{step.title}</h2>
                <p className="mt-1.5 text-[11.5px] leading-5 text-white/60">{step.body}</p>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-navy-line px-5 py-3 text-[11px] text-white/55 sm:px-6">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-bright" aria-hidden /> Human decision recorded with a reason
          </span>
          <span className="inline-flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-accent-bright" aria-hidden /> No AI CV detector
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileSearch className="h-3.5 w-3.5 text-accent-bright" aria-hidden /> No keyword filter
          </span>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "In the queue", value: totals.candidates, note: "across live roles" },
          { label: "Need a check", value: totals.checking, note: "open criteria or prose" },
          { label: "Ready to discuss", value: totals.ready, note: "record checked" },
          { label: "Decided", value: totals.decided, note: "with a reason" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{stat.label}</p>
            <p className="mt-1.5 text-[26px] font-semibold leading-none tabular-nums text-ink">{stat.value}</p>
            <p className="mt-1 text-[10.5px] text-ink-faint">{stat.note}</p>
          </div>
        ))}
      </div>

      {totals.overdue > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-[11.5px] leading-5 text-amber-900">
          <span className="font-semibold">{totals.overdue} open packet{totals.overdue === 1 ? " is" : "s are"} past the reply target.</span>{" "}
          Open a role queue to see which candidates need attention; the queue keeps them visible.
        </div>
      ) : null}

      <section className="mt-8" aria-labelledby="roles-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="roles-heading" className="text-[18px] font-semibold leading-tight">
              Your role queues
            </h2>
            <p className="mt-1 text-[12px] text-ink-muted">Open a role to see every candidate in event order, with the checks that remain.</p>
          </div>
          <Link href="/roles/new" className="text-[11px] font-medium text-accent">
            Add a role card
          </Link>
        </div>

        {summaries.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-ink-faint" aria-hidden />
            <p className="mt-2 text-[14px] font-medium text-ink">No live role cards yet.</p>
            <p className="mx-auto mt-1 max-w-md text-[12px] leading-6 text-ink-muted">
              A live role card states the assessment bar and signals that become the screening plan.
            </p>
            <Link href="/roles/new" className="mt-3 inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-[12px] font-medium text-white">
              Create a role card
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {summaries.map((summary) => (
              <Link
                key={summary.role.id}
                href={"/prescreen/" + summary.role.id}
                className="group flex flex-col rounded-xl border border-line bg-surface p-5 transition hover:border-accent/45 hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[16px] font-semibold leading-tight text-ink">{summary.role.title}</h3>
                    <p className="mt-1 text-[11.5px] text-ink-muted">
                      {summary.role.employer.name} · {summary.role.workMode} · {summary.role.location}
                    </p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 border-y border-line py-2.5 text-center">
                  {[
                    { label: "Queue", value: summary.counts.total },
                    { label: "To check", value: summary.counts.needsChecking },
                    { label: "Ready", value: summary.counts.readyToDiscuss },
                    { label: "Decided", value: summary.counts.advanced + summary.counts.held + summary.counts.declined },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-[15px] font-semibold tabular-nums leading-none text-ink">{stat.value}</p>
                      <p className="mt-1 text-[9.5px] uppercase tracking-[0.1em] text-ink-faint">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {summary.plan.slice(0, 4).map((criterion) => (
                    <span
                      key={criterion.id}
                      className="inline-flex max-w-full items-center gap-1.5 truncate rounded border border-line bg-paper px-2 py-1 text-[10.5px] text-ink-muted"
                      title={criterion.detail}
                    >
                      <span
                        className={
                          criterion.kind === "MUST_HAVE"
                            ? "h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                            : criterion.kind === "NICE_TO_HAVE"
                              ? "h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                              : "h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint"
                        }
                        aria-hidden
                      />
                      <span className="truncate">{criterion.label}</span>
                    </span>
                  ))}
                  {summary.plan.length > 4 ? (
                    <span className="inline-flex items-center rounded border border-line bg-paper px-2 py-1 text-[10.5px] text-ink-faint">
                      +{summary.plan.length - 4}
                    </span>
                  ) : null}
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px] text-ink-faint">
                  <span>
                    {summary.lastActivityAt ? "Last activity " + formatRelativeTime(summary.lastActivityAt) : "No packet opened yet"}
                    {summary.counts.overdue > 0 ? <span className="ml-2 font-medium text-amber-800">{summary.counts.overdue} past target</span> : null}
                  </span>
                  <span className="font-medium text-accent">Open queue</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8" aria-labelledby="recent-decisions">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="recent-decisions" className="text-[18px] font-semibold leading-tight">
              Recent decisions
            </h2>
            <p className="mt-1 text-[12px] text-ink-muted">Every one has a reason, a basis and a named reviewer. No decision is sent to a candidate automatically.</p>
          </div>
          <Link href="/prescreen/decisions" className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
            All decisions <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {decisions.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-line-strong bg-surface p-6 text-center">
            <p className="text-[12.5px] text-ink-muted">No pre-screen decisions recorded yet. Open a queue and read the first record.</p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {decisions.map((decision) => (
              <Link
                key={decision.runId}
                href={"/prescreen/" + decision.roleId + "/" + decision.candidateId}
                className="group flex items-start gap-3 px-4 py-3.5 transition hover:bg-accent-tint/40 sm:px-5"
              >
                <Avatar name={decision.candidateName} monogram={decision.candidateMonogram} palette={decision.candidatePalette} size="xs" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12.5px] font-medium text-ink">{decision.candidateName}</p>
                    <RunStatusBadge status={decision.status} />
                  </div>
                  <p className="mt-0.5 text-[10.5px] text-ink-faint">
                    {decision.roleTitle}
                    {decision.decidedBy ? " · " + decision.decidedBy : ""}
                    {decision.decidedAt ? " · " + formatRelativeTime(decision.decidedAt) : ""}
                  </p>
                  {decision.reason ? <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-ink-muted">{decision.reason}</p> : null}
                </div>
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border border-line bg-surface" aria-labelledby="why-heading">
        <div className="grid gap-px bg-line md:grid-cols-2">
          <div className="bg-surface p-5 sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">The AI CV loop</p>
            <h2 id="why-heading" className="mt-2 text-[18px] font-semibold leading-snug text-ink">
              A model writes the CV. Another model reads it.
            </h2>
            <ul className="mt-4 space-y-2.5 text-[12px] leading-6 text-ink-muted">
              {[
                "Keyword filters reward whoever uses the right nouns, not whoever can do the work.",
                "AI-written prose is polished in the same way, so it compresses the differences between people.",
                "A CV scanner produces a number with no artifact behind it, and no record of who decided.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <XCircle className="mt-1 h-3.5 w-3.5 shrink-0 text-rose-600" aria-hidden /> {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-accent-tint/50 p-5 sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-deep">This pre-screen</p>
            <h2 className="mt-2 text-[18px] font-semibold leading-snug text-ink">A short record a person can check.</h2>
            <ul className="mt-4 space-y-2.5 text-[12px] leading-6 text-ink-soft">
              {[
                "The assessment bar is exact, versioned and taken once. It is a work sample with a known difficulty.",
                "Every claim keeps its artifact and its status: checked, artifact only, for the conversation, or still prose.",
                "The decision records who, when and why, against the criteria that were stated before the review.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <BadgeCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden /> {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="border-t border-line px-5 py-3 text-[10.5px] leading-5 text-ink-faint sm:px-6">
          Rivet does not guess whether a CV was written with AI, and it does not score a person. It removes the need for the
          guess by putting verified work in front of the reviewer.
        </p>
      </section>
    </div>
  );
}
