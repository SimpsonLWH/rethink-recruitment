import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ClipboardCheck,
  Download,
  FileText,
  History,
  Link2,
  Link2Off,
  ListChecks,
  MapPin,
  MessageCircle,
  Minus,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Timer,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { Avatar } from "@/components/brand/avatar";
import { IntegrityNote } from "@/components/assessments/integrity-badge";
import { ClaimCheckControl } from "@/components/screening/claim-check-control";
import { DecisionPanel } from "@/components/screening/decision-panel";
import { KitActions } from "@/components/screening/kit-actions";
import { PrintPacketButton } from "@/components/screening/print-packet-button";
import {
  ClaimStatusBadge,
  CriterionKindBadge,
  CriterionStatusBadge,
  EvidenceStateBadge,
  RunStatusBadge,
} from "@/components/screening/screening-badges";
import { ScreeningNoteForm } from "@/components/screening/screening-note-form";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { RATING_LABEL, screeningStageLabel, type InterviewKit } from "@/lib/screening";
import { assessmentTitle } from "@/lib/ui-copy";
import { cn, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ roleId: string; candidateId: string }> }): Promise<Metadata> {
  const { roleId, candidateId } = await params;
  const repo = getRepository();
  const role = await repo.getRoleById(roleId);
  const candidate = await repo.getCandidateById(candidateId);
  return {
    title: role && candidate ? candidate.name + " · pre-screen for " + role.title : "Pre-screen packet",
  };
}

function artifactHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "artifact";
  }
}

function kitText(candidateName: string, roleTitle: string, kit: InterviewKit): string {
  const agenda = kit.agenda.map((item) => "- " + item.label + " (" + item.minutes + " min)").join("\n");
  const questions = kit.questions
    .map(
      (question, index) =>
        "Q" +
        (index + 1) +
        ". " +
        question.prompt +
        "\n   Listen for: " +
        question.listenFor +
        "\n   Follow-up: " +
        question.followUp +
        "\n   Time: " +
        question.minutes +
        " min · " +
        question.sourceLabel,
    )
    .join("\n\n");
  return candidateName + " — " + roleTitle + "\nPre-screen conversation kit · " + kit.totalMinutes + " minutes\n\nAgenda\n" + agenda + "\n\nQuestions\n" + questions + "\n";
}

const AUDIT_LABEL: Record<string, string> = {
  OPENED: "Packet opened",
  CLAIM_CHECKED: "Claim check saved",
  NOTE_ADDED: "Note added",
  DECISION_RECORDED: "Decision recorded",
  DECISION_REOPENED: "Decision reopened",
};

export default async function ScreeningPacketPage({ params }: { params: Promise<{ roleId: string; candidateId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/enter");
  if (session.side !== "employer") redirect("/dashboard");
  const { roleId, candidateId } = await params;
  const packet = await getRepository().getScreeningPacket(roleId, candidateId, session.employer.id);
  if (!packet) notFound();

  const { role, candidate, evidence, summary, criteria, claims, claimSummary, kit, run } = packet;
  const firstName = candidate.name.split(" ")[0];
  const criterionNotes = new Map(
    run.criterionChecks
      .filter((check) => Boolean(check.note))
      .map((check) => [check.criterionId, check.note!] as const),
  );

  return (
    <div className="animate-fade-up" data-testid="prescreen-packet">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <Link href={"/prescreen/" + role.id} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {role.title} queue
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted" data-print-hide="true">
          <span>{run.events.length} record events</span>
          <span>{screeningStageLabel(run.stage)}</span>
          <span>Updated {formatRelativeTime(run.updatedAt)}</span>
          <PrintPacketButton />
          <a
            href={"/api/screening/" + role.id + "/" + candidate.id + "/export"}
            download
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-[11px] font-medium text-ink-muted transition hover:border-line-strong hover:text-ink sm:h-8"
          >
            <Download className="h-3.5 w-3.5" aria-hidden /> Export record
          </a>
          <Link href={"/roles/" + role.id} className="font-medium text-ink-muted hover:text-ink">
            Role card
          </Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-3.5">
            <Avatar name={candidate.name} monogram={candidate.monogram} palette={candidate.palette} size="lg" />
            <div className="min-w-0">
              <h1 className="text-[clamp(1.4rem,2.2vw,1.9rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-ink">{candidate.name}</h1>
              <p className="mt-1 text-[13px] text-ink-soft">{candidate.headline}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-ink-faint" aria-hidden /> {candidate.location}
                </span>
                <span>{candidate.availability}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-1.5">
              {run.status === "OPEN" ? <EvidenceStateBadge state={summary.state} /> : null}
              <RunStatusBadge status={run.status} />
            </div>
            <p className="text-[11px] text-ink-faint">
              Pre-screening for <span className="font-medium text-ink-soft">{role.title}</span>
            </p>
            <p className="text-[10.5px] text-ink-faint">Reviewer: {packet.reviewerName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line bg-paper px-5 py-3 text-[11px] text-ink-muted sm:px-6">
          {evidence ? (
            evidence.requirements.map((requirement) => (
              <span key={requirement.assessment.id} className="inline-flex items-center gap-1.5">
                <ClipboardCheck className={cn("h-3.5 w-3.5", requirement.meets ? "text-accent" : "text-rose-600")} aria-hidden />
                <span>
                  {assessmentTitle(requirement.assessment.title)} · {requirement.score ?? "—"}/100 vs bar {requirement.requiredScore}
                </span>
              </span>
            ))
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-ink-faint" aria-hidden /> No work-sample result on the record yet
            </span>
          )}
          {claimSummary.withArtifact > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-ink-faint" aria-hidden /> {claimSummary.withArtifact} linked artifact{claimSummary.withArtifact === 1 ? "" : "s"}
            </span>
          ) : null}
          <span className="ml-auto inline-flex items-center gap-1.5 text-ink-faint">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> No person score. No ranking.
          </span>
        </div>
        {evidence?.integrity ? (
          <div className="border-t border-line bg-surface px-5 py-2 sm:px-6">
            <IntegrityNote integrity={evidence.integrity} />
          </div>
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
        <div className="contents lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-4">
          <div className="order-1 lg:col-start-2 lg:row-start-1">
            <DecisionPanel
              roleId={role.id}
              candidateId={candidate.id}
              firstName={firstName}
              criteria={criteria}
              status={run.status}
              checks={run.criterionChecks}
              reason={run.decisionReason}
              basis={run.decisionBasis}
              decidedBy={run.decidedBy}
              decidedAt={run.decidedAt}
              outcomeSentAt={run.outcomeSentAt}
            />
          </div>
          <div className="order-3 space-y-4">

                      <section className="rounded-xl border border-line bg-surface p-4" aria-labelledby="kit-heading">
                        <div className="flex items-center justify-between gap-2">
                          <h2 id="kit-heading" className="text-[13px] font-semibold text-ink">
                            Conversation kit
                          </h2>
                          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] text-ink-muted">
                            <Timer className="h-3 w-3" aria-hidden /> {kit.totalMinutes} min
                          </span>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-5 text-ink-muted">
                          Built from the open criteria and unchecked claims. No model decides; you can change any question.
                        </p>

                        <div className="mt-3 rounded-md border border-line bg-paper px-3 py-2">
                          {kit.agenda.map((item) => (
                            <div key={item.label} className="flex items-baseline justify-between gap-2 py-0.5 text-[10.5px]">
                              <span className="text-ink-muted">{item.label}</span>
                              <span className="tabular-nums text-ink-faint">{item.minutes} min</span>
                            </div>
                          ))}
                        </div>

                        <ol className="mt-3 space-y-3">
                          {kit.questions.map((question, index) => (
                            <li key={question.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-[9.5px] font-semibold text-white">
                                  {index + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-[11.5px] font-medium leading-5 text-ink">{question.prompt}</p>
                                  <p className="mt-1 text-[10.5px] leading-5 text-ink-muted">
                                    <span className="font-medium text-ink-soft">Listen for: </span>
                                    {question.listenFor}
                                  </p>
                                  <p className="mt-0.5 text-[10.5px] leading-5 text-ink-faint">Follow-up: {question.followUp}</p>
                                  <p className="mt-1 text-[9.5px] uppercase tracking-[0.08em] text-ink-faint">
                                    {question.minutes} min · {question.sourceLabel}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>

                        <div className="mt-4">
                          <KitActions text={kitText(candidate.name, role.title, kit)} />
                        </div>
                      </section>

                      <p className="rounded-xl border border-line bg-paper px-4 py-3 text-[10.5px] leading-5 text-ink-faint">
                        The brief and kit are prepared deterministically from this record. They are not a recommendation, a score or a
                        prediction. A human reads the evidence and owns the decision.
                      </p>
          </div>
        </div>

        <div className="order-2 space-y-5 lg:col-start-1 lg:row-start-1">
          {packet.workSamples.length ? (
            <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="work-sample-heading">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 id="work-sample-heading" className="text-[16px] font-semibold leading-tight">
                    Work sample, question by question
                  </h2>
                  <p className="mt-0.5 text-[11.5px] text-ink-muted">Per-question checks, not hidden test details. Use it to ask where the work was hard.</p>
                </div>
                <span className="text-[10px] text-ink-faint">Scored by the server</span>
              </div>
              <div className="mt-4 space-y-4">
                {packet.workSamples.map((sample) => (
                  <div key={sample.assessmentId} className="rounded-lg border border-line bg-paper p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[12.5px] font-medium text-ink">{assessmentTitle(sample.title)}</p>
                      <span className="rounded border border-line bg-surface px-2 py-0.5 text-[10px] text-ink-muted">
                        {sample.score ?? "—"}/100 vs bar {sample.requiredScore} · {sample.version}
                      </span>
                    </div>
                    {sample.problems.length ? (
                      <ul className="mt-2.5 space-y-1.5">
                        {sample.problems.map((problem) => {
                          const full = problem.passed === problem.total;
                          const none = problem.passed === 0;
                          return (
                            <li key={problem.problemId} className="flex items-start gap-2 text-[11.5px] leading-5">
                              <span
                                className={cn(
                                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                                  full ? "bg-accent-tint text-accent-deep" : none ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800",
                                )}
                                aria-hidden
                              >
                                {full ? <Check className="h-3 w-3" /> : none ? <XCircle className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              </span>
                              <span className="min-w-0 flex-1 text-ink-soft">{problem.title}</span>
                              <span className="shrink-0 tabular-nums text-[10.5px] text-ink-faint">
                                {problem.passed}/{problem.total} checks
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-2 text-[11px] leading-5 text-ink-faint">
                        Question-level detail was not stored for this seeded sitting. The score is still exact; ask about the work directly.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="brief-heading">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 id="brief-heading" className="text-[16px] font-semibold leading-tight">
                  Pre-screen brief
                </h2>
                <p className="mt-0.5 text-[11.5px] text-ink-muted">A summary of the checkable record, not a verdict. The decision is yours.</p>
              </div>
              <Sparkles className="h-4 w-4 text-accent" aria-hidden />
            </div>
            <p className="mt-3 text-[13.5px] font-medium leading-6 text-ink">{summary.headline}</p>

            <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-deep">
                  <Check className="h-3.5 w-3.5" aria-hidden /> What the record supports
                </p>
                <ul className="mt-2 space-y-1.5">
                  {summary.supporting.length ? (
                    summary.supporting.map((line) => (
                      <li key={line} className="flex items-start gap-1.5 text-[11.5px] leading-5 text-ink-soft">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden /> {line}
                      </li>
                    ))
                  ) : (
                    <li className="text-[11.5px] leading-5 text-ink-muted">Nothing is verified yet.</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden /> What is still open
                </p>
                <ul className="mt-2 space-y-1.5">
                  {summary.open.length ? (
                    summary.open.slice(0, 6).map((line) => (
                      <li key={line} className="flex items-start gap-1.5 text-[11.5px] leading-5 text-ink-muted">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-600" aria-hidden /> {line}
                      </li>
                    ))
                  ) : (
                    <li className="text-[11.5px] leading-5 text-ink-muted">No open items on the record.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-line bg-paper px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Close next</p>
              <ul className="mt-1.5 space-y-1">
                {summary.nextActions.map((action) => (
                  <li key={action} className="flex items-start gap-1.5 text-[11.5px] leading-5 text-ink-soft">
                    <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden /> {action}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface" aria-labelledby="criteria-heading">
            <div className="flex flex-wrap items-end justify-between gap-2 px-5 pt-5">
              <div>
                <h2 id="criteria-heading" className="text-[16px] font-semibold leading-tight">
                  The bar, criterion by criterion
                </h2>
                <p className="mt-0.5 text-[11.5px] text-ink-muted">Set before the review. The evidence status is system-derived; your read is yours.</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="inline-flex items-center gap-1 text-[10px] text-ink-faint">
                  <ListChecks className="h-3.5 w-3.5" aria-hidden /> {summary.mustHaveAssessed}/{summary.mustHaveTotal} must-haves with evidence
                </span>
                <span className="text-[10px] text-ink-faint">
                  Plan v{packet.planVersion} · {packet.planIsCurrent ? "current" : "frozen at decision"}
                </span>
              </div>
            </div>
            {!packet.planIsCurrent ? (
              <p className="mx-5 mt-4 rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-900">
                The role plan is now v{packet.currentPlanVersion}. This packet keeps v{packet.planVersion}, the criteria the
                recorded decision was made against.
              </p>
            ) : null}
            <div className="mt-4 divide-y divide-line border-t border-line">
              {criteria.map((result) => (
                <div key={result.criterion.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CriterionKindBadge kind={result.criterion.kind} />
                        <span className="text-[9.5px] uppercase tracking-[0.1em] text-ink-faint">{result.criterion.source.toLowerCase()}</span>
                      </div>
                      <p className="mt-1 text-[13px] font-medium text-ink">{result.criterion.label}</p>
                      <p className="mt-1 text-[11.5px] leading-5 text-ink-muted">{result.criterion.detail}</p>
                      <p className="mt-1.5 text-[11.5px] leading-5 text-ink-soft">{result.evidenceLine}</p>
                      {criterionNotes.has(result.criterion.id) ? (
                        <p className="mt-1.5 border-l-2 border-accent/35 pl-2 text-[11px] leading-5 text-ink-muted">
                          <span className="font-medium text-ink-soft">Your note: </span>
                          {criterionNotes.get(result.criterion.id)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <CriterionStatusBadge status={result.status} />
                      {result.humanRating ? (
                        <span className="text-[10px] text-ink-faint">Your read: {RATING_LABEL[result.humanRating].toLowerCase()}</span>
                      ) : null}
                    </div>
                  </div>
                  <details className="mt-2">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[10.5px] font-medium text-ink-muted hover:text-ink">
                      Question to ask <span className="text-ink-faint" aria-hidden>›</span>
                    </summary>
                    <p className="mt-1 pl-3 text-[11.5px] leading-5 text-ink-soft">“{result.criterion.ask}”</p>
                  </details>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface" aria-labelledby="claims-heading">
            <div className="px-5 pt-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 id="claims-heading" className="text-[16px] font-semibold leading-tight">
                    Claims: checked or still prose
                  </h2>
                  <p className="mt-0.5 max-w-xl text-[11.5px] leading-5 text-ink-muted">
                    A CV sentence is not evidence. Each claim keeps its source and artifact status, so the reviewer can tell the difference.
                  </p>
                </div>
                <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[10px] text-ink-muted">{claimSummary.total} claims</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-ink-muted">
                <span>{claimSummary.verified} checked</span>
                <span>{claimSummary.linked} artifact only</span>
                <span>{claimSummary.needsConversation} for conversation</span>
                <span>{claimSummary.unchecked} still prose</span>
                <span>{claimSummary.notCheckable} not checkable</span>
                {claimSummary.context > 0 ? <span>{claimSummary.context} context</span> : null}
              </div>
            </div>
            {claims.length === 0 ? (
              <p className="mx-5 mt-4 rounded-md border border-dashed border-line-strong bg-paper px-3 py-4 text-[11.5px] leading-5 text-ink-muted">
                No claims on this record yet. The work sample is the evidence; ask about the work directly.
              </p>
            ) : (
            <div className="mt-4 divide-y divide-line border-t border-line">
              {claims.map((claim) => (
                <article key={claim.claim.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <ClaimStatusBadge status={claim.status} />
                    <span className="inline-flex items-center gap-1 text-[10px] text-ink-faint">
                      {claim.claim.provenance === "EMPLOYER_CONFIRMED" ? (
                        <BadgeCheck className="h-3 w-3" aria-hidden />
                      ) : (
                        <FileText className="h-3 w-3" aria-hidden />
                      )}
                      {claim.claim.provenance === "EMPLOYER_CONFIRMED" ? "Employer-confirmed" : "From the candidate"}
                    </span>
                    {claim.claim.evidenceUrl ? (
                      <a
                        href={claim.claim.evidenceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-[10.5px] font-medium text-accent underline decoration-accent/30 underline-offset-2"
                      >
                        {claim.claim.linkStatus === "WORKS" ? <Link2 className="h-3 w-3" aria-hidden /> : <Link2Off className="h-3 w-3" aria-hidden />}
                        {claim.claim.linkStatus === "WORKS" ? "Open artifact · " + artifactHost(claim.claim.evidenceUrl) : "Artifact link · last check failed"}
                        <ArrowUpRight className="h-3 w-3" aria-hidden />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-ink-faint">
                        <Link2Off className="h-3 w-3" aria-hidden /> No artifact
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[12.5px] leading-6 text-ink">{claim.claim.claim}</p>
                  {claim.claim.image ? (
                    <div className="mt-2 overflow-hidden rounded-md border border-line bg-paper">
                      <Image
                        src={claim.claim.image}
                        alt={"Artifact preview attached to the claim: " + claim.claim.claim.slice(0, 80)}
                        width={640}
                        height={360}
                        unoptimized
                        className="h-auto w-full max-w-md"
                      />
                      <p className="border-t border-line px-2.5 py-1 text-[9.5px] text-ink-faint">Synthetic artifact preview · not a live capture</p>
                    </div>
                  ) : null}
                  <p className="mt-1 text-[10.5px] leading-5 text-ink-faint">
                    {claim.basis}
                    {claim.claim.skillTags.length ? " · " + claim.claim.skillTags.slice(0, 4).join(", ") : ""}
                  </p>
                  {claim.note ? (
                    <p className="mt-2 rounded-md border border-line bg-paper px-2.5 py-2 text-[11px] leading-5 text-ink-muted">
                      <span className="font-medium text-ink-soft">Check note: </span>
                      {claim.note}
                    </p>
                  ) : null}
                  {claim.status === "CONTEXT" ? (
                    <p className="mt-2 text-[10.5px] text-ink-faint">No check needed. This is context for the conversation.</p>
                  ) : (
                    <ClaimCheckControl
                      roleId={role.id}
                      candidateId={candidate.id}
                      factId={claim.claim.id}
                      status={claim.status}
                      note={claim.note}
                    />
                  )}
                </article>
              ))}
            </div>
            )}
          </section>

          <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="notes-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 id="notes-heading" className="inline-flex items-center gap-1.5 text-[16px] font-semibold leading-tight">
                  <StickyNote className="h-4 w-4 text-ink-faint" aria-hidden /> Reviewer notes
                </h2>
                <p className="mt-0.5 text-[11.5px] text-ink-muted">What you saw and what still needs asking. These stay internal to the hiring team.</p>
              </div>
              <ScreeningNoteForm roleId={role.id} candidateId={candidate.id} />
            </div>
            {run.notes.length ? (
              <div className="mt-4 space-y-3 border-t border-line pt-4">
                {[...run.notes].reverse().map((note) => (
                  <div key={note.id} className="rounded-lg border border-line bg-paper px-3.5 py-3">
                    <p className="text-[12px] leading-6 text-ink-soft">{note.body}</p>
                    <p className="mt-1.5 text-[10px] text-ink-faint">
                      {note.author} · {formatRelativeTime(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 border-t border-line pt-4 text-[11.5px] text-ink-muted">No notes yet. Write down what you checked; the next reviewer will need it.</p>
            )}
          </section>

          <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="audit-heading">
            <h2 id="audit-heading" className="inline-flex items-center gap-1.5 text-[16px] font-semibold leading-tight">
              <History className="h-4 w-4 text-ink-faint" aria-hidden /> Audit trail
            </h2>
            <p className="mt-0.5 text-[11.5px] text-ink-muted">Append-only record of what a person did, in order.</p>
            <ol className="mt-4 space-y-3 border-t border-line pt-4">
              {[...run.events].reverse().map((event) => (
                <li key={event.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-medium text-ink">{AUDIT_LABEL[event.kind] ?? event.kind}</p>
                    <p className="mt-0.5 break-words text-[11px] leading-5 text-ink-muted">{event.detail}</p>
                    <p className="mt-0.5 text-[10px] text-ink-faint">
                      {event.actor} · {formatRelativeTime(event.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
