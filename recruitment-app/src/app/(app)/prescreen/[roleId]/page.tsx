import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardCheck, Clock3, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { PlanEditor } from "@/components/screening/plan-editor";
import { ScreeningQueue, type ScreeningQueueItemView } from "@/components/screening/screening-queue";
import { screeningPlanIsCurrent } from "@/lib/screening";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { assessmentTitle } from "@/lib/ui-copy";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ roleId: string }> }): Promise<Metadata> {
  const { roleId } = await params;
  const role = await getRepository().getRoleById(roleId);
  return { title: role ? "Pre-screen · " + role.title : "Pre-screen" };
}

export default async function PrescreenRolePage({ params }: { params: Promise<{ roleId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/enter");
  if (session.side !== "employer") redirect("/dashboard");
  const { roleId } = await params;
  const repo = getRepository();
  const queue = await repo.getScreeningQueue(roleId, session.employer.id, session.reviewerName);
  if (!queue) notFound();
  const { role, items } = queue;

  const views: ScreeningQueueItemView[] = items.map((item) => {
    const primary = role.requirements[0];
    const waitingSince = item.run?.createdAt ?? item.evidence?.lastSubmittedAt ?? null;
    const overdue =
      (item.run?.status ?? "OPEN") === "OPEN" &&
      Boolean(waitingSince) &&
      Date.now() - new Date(waitingSince!).getTime() > role.reviewDueHours * 60 * 60 * 1000;
    const result = primary
      ? item.candidate.assessmentResults.find((entry) => entry.assessment.id === primary.assessmentId) ?? null
      : null;
    return {
      candidateId: item.candidate.id,
      name: item.candidate.name,
      monogram: item.candidate.monogram,
      palette: item.candidate.palette,
      headline: item.candidate.headline,
      location: item.candidate.location,
      availability: item.candidate.availability,
      evidenceState: item.state,
      score: result?.score ?? null,
      requiredScore: primary?.requiredScore ?? null,
      assessmentTitle: primary?.assessment ? assessmentTitle(primary.assessment.title) : null,
      runStatus: item.run?.status ?? null,
      openItems: item.openItems,
      mustHaveAssessed: item.summary.mustHaveAssessed,
      mustHaveTotal: item.summary.mustHaveTotal,
      summaryState: item.summary.state,
      summaryHeadline: item.summary.headline,
      claims: item.claimSummary,
      hasNotes: Boolean(item.run?.notes.length),
      waitingLabel: waitingSince ? (overdue ? "Past the review target" : "Waiting " + formatRelativeTime(waitingSince)) : null,
      overdue,
    };
  });

  const openItems = items.filter((item) => (item.run?.status ?? "OPEN") === "OPEN");
  const totalOpen = openItems.reduce((total, item) => total + item.openItems, 0);
  const belowBar = items.filter((item) => item.state === "BELOW").length;
  const ready = openItems.filter((item) => item.summary.state === "ENOUGH_TO_DISCUSS").length;
  const decided = items.filter((item) => item.run && item.run.status !== "OPEN").length;
  const overdue = views.filter((item) => item.overdue).length;
  const planIsCurrent = screeningPlanIsCurrent(role.screeningPlan, role.requirements, role.evidenceSignals);

  return (
    <div className="animate-fade-up" data-testid="prescreen-role">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <Link href="/prescreen" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All pre-screen queues
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
          <Link href="/prescreen/decisions" className="text-ink-muted hover:text-ink">Decision log</Link>
          <Link href={"/roles/" + role.id + "/edit"} className="text-ink-muted hover:text-ink">
            Edit role card
          </Link>
          <Link href={"/roles/" + role.id} className="text-ink-muted hover:text-ink">
            Public role
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-accent/25 bg-accent-tint px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent-deep">
                Live role
              </span>
              <span className="text-[11px] text-ink-muted">{role.employer.name}</span>
            </div>
            <h1 className="mt-2 text-[clamp(1.55rem,2.5vw,2.1rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-ink">{role.title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-ink-faint" aria-hidden /> {role.workMode} · {role.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <UserRound className="h-3.5 w-3.5 text-ink-faint" aria-hidden /> Review owner: {role.reviewOwnerName ?? role.employer.contactName}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5 text-ink-faint" aria-hidden /> Reply target: {role.reviewDueHours}h
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-line bg-paper px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Stated bar</p>
            <div className="mt-1.5 space-y-1">
              {role.requirements.map((requirement) => (
                <p key={requirement.assessmentId} className="text-[11.5px] text-ink-soft">
                  {requirement.assessment ? assessmentTitle(requirement.assessment.title) : "Assessment"} · bar {requirement.requiredScore}/100
                </p>
              ))}
              {role.evidenceSignals.slice(0, 3).map((signal) => (
                <p key={signal.id} className="text-[11.5px] text-ink-muted">
                  {signal.label}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4 sm:grid-cols-4">
          {[
            { label: "In the queue", value: items.length, note: "event order" },
            { label: "Open checks", value: totalOpen, note: "criteria + claims" },
            { label: "Ready to discuss", value: ready, note: "record complete" },
            { label: "Decided", value: decided, note: "with a reason" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-[22px] font-semibold leading-none tabular-nums text-ink">{stat.value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">{stat.label}</p>
              <p className="text-[10px] text-ink-faint">{stat.note}</p>
            </div>
          ))}
        </div>
        {belowBar > 0 ? (
          <p className="mt-4 flex items-start gap-2 rounded-md border border-line bg-paper px-3 py-2 text-[11px] leading-5 text-ink-muted">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden />
            {belowBar} candidate{belowBar === 1 ? " sits" : "s sit"} below the stated work-sample bar and {belowBar === 1 ? "stays" : "stay"} in
            this queue. A below-bar score is context, not a rejection.
          </p>
        ) : null}
        {overdue > 0 ? (
          <p className="mt-2 flex items-start gap-2 rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-900">
            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {overdue} open packet{overdue === 1 ? " is" : "s are"} past the {role.reviewDueHours}h reply target. The queue keeps them visible rather than hiding them.
          </p>
        ) : null}
      </section>

      <section className="mt-6" aria-labelledby="plan-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="plan-heading" className="text-[15px] font-semibold leading-tight">
              The screening plan
            </h2>
            <p className="mt-0.5 text-[11.5px] text-ink-muted">
              {role.screeningPlanUpdatedAt
                ? "Plan v" + role.screeningPlanVersion + " · edited by " + (role.screeningPlanUpdatedBy ?? "the hiring team") + " · " + formatRelativeTime(role.screeningPlanUpdatedAt) + ". Each criterion has a source."
                : "Plan v" + role.screeningPlanVersion + " · derived from the role card before anyone was reviewed. Each criterion has a source."}
            </p>
          </div>
          <PlanEditor roleId={role.id} initialPlan={role.screeningPlan} />
        </div>
        {!planIsCurrent ? (
          <div className="mt-3 rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-900">
            The plan&apos;s assessment or signal sources differ from the current role card. If the role card changed, open{" "}
            <span className="font-medium">Edit plan</span> and reset it from the role card before relying on these criteria.
          </div>
        ) : null}
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {role.screeningPlan.map((criterion) => (
            <div key={criterion.id} className="rounded-lg border border-line bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                  {criterion.kind === "MUST_HAVE" ? "Must have" : criterion.kind === "NICE_TO_HAVE" ? "Nice to have" : "Conversation"}
                </span>
                <span className="text-[9.5px] uppercase tracking-[0.1em] text-ink-faint">{criterion.source.toLowerCase()}</span>
              </div>
              <p className="mt-1 truncate text-[12.5px] font-medium text-ink" title={criterion.label}>
                {criterion.label}
              </p>
              <p className="mt-1 line-clamp-2 text-[10.5px] leading-4 text-ink-muted">{criterion.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8">
        <ScreeningQueue roleId={role.id} items={views} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3 text-[11px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <ClipboardCheck className="h-3.5 w-3.5 text-ink-faint" aria-hidden /> {items.length} candidates from the event record
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-ink-faint" aria-hidden /> A decision needs a reason and a human confirmation
        </span>
        <Link href="/prescreen" className="ml-auto inline-flex items-center gap-1 font-medium text-accent">
          Back to all queues <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
