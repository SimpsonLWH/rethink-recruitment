import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  FileSearch,
  Link2,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { FactCard } from "@/components/profile/fact-card";
import { IntegrityNote } from "@/components/assessments/integrity-badge";
import { isContextFact } from "@/lib/fact-meta";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { assessmentTitle } from "@/lib/ui-copy";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your evidence record",
  description: "The work sample and checkable claims a hiring team sees. No CV score, no AI detector.",
};

export default async function CandidateEvidencePage() {
  const session = await getSession();
  if (!session) redirect("/enter");
  if (session.side !== "candidate") redirect("/prescreen");

  const repo = getRepository();
  const event = await repo.getEvent();
  const candidate = session.candidate;
  const results = candidate.assessmentResults;
  const withScore = results.filter((result) => result.score !== null);
  const evidenceClaims = candidate.facts.filter((fact) => !isContextFact(fact));
  const contextFacts = candidate.facts.filter((fact) => isContextFact(fact));
  const linkedClaims = evidenceClaims.filter((fact) => Boolean(fact.evidenceUrl));
  const confirmedClaims = evidenceClaims.filter((fact) => fact.provenance === "EMPLOYER_CONFIRMED");

  return (
    <div className="animate-fade-up" data-testid="candidate-evidence-record">
      <PageHeader
        title="Your evidence record"
        description="The work and claims a hiring team can check. This is not a CV score, and no model scans your writing."
        action={
          <Link href="/profile/edit" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-4 text-[12px] font-medium text-white">
            Edit evidence <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Work samples", value: withScore.length, note: "final results" },
          { label: "Claims", value: evidenceClaims.length, note: evidenceClaims.length === candidate.facts.length ? "structured record" : contextFacts.length + " context notes" },
          { label: "Linked artifacts", value: linkedClaims.length, note: "available to check" },
          { label: "Employer-confirmed", value: confirmedClaims.length, note: "simulated demo" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{stat.label}</p>
            <p className="mt-1.5 text-[26px] font-semibold leading-none tabular-nums text-ink">{stat.value}</p>
            <p className="mt-1 text-[10.5px] text-ink-faint">{stat.note}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="samples-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="samples-heading" className="text-[18px] font-semibold leading-tight">
              Work samples
            </h2>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">
              One versioned sitting per assessment. A score is a floor against a stated bar, not a personality score.
            </p>
          </div>
          <Link href="/assessments" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-[12px] font-medium text-ink">
            Take an assessment <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        {results.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-line-strong bg-paper px-4 py-6 text-center">
            <Sparkles className="mx-auto h-4 w-4 text-ink-faint" aria-hidden />
            <p className="mt-2 text-[13px] font-medium text-ink">No work sample yet.</p>
            <p className="mx-auto mt-1 max-w-md text-[11.5px] leading-5 text-ink-muted">
              A short, role-relevant assessment is the strongest evidence in this record. Prepare first if you want; practice
              never counts as a sitting.
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-line border-y border-line">
            {results.map((result) => {
              const href = result.attemptId ? "/assessments/attempts/" + result.attemptId : "/assessments/" + result.assessment.id;
              return (
                <div key={result.assessment.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">{assessmentTitle(result.assessment.title)}</p>
                      <p className="mt-0.5 text-[11px] text-ink-muted">
                        {result.assessment.version} · {result.assessment.difficulty.toLowerCase()} ·{" "}
                        {result.lastSubmittedAt ? "submitted " + formatRelativeTime(result.lastSubmittedAt) : result.score === null ? "in progress" : "final"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[16px] font-semibold tabular-nums text-ink">
                        {result.score === null ? "In progress" : result.score + "/100"}
                      </p>
                      <Link href={href} className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
                        {result.score === null ? "Continue" : "Open result"} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
                  {result.integrity ? <IntegrityNote integrity={result.integrity} className="mt-1.5" /> : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-6" aria-labelledby="claims-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="claims-heading" className="text-[18px] font-semibold leading-tight">
              Claims and artifacts
            </h2>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">
              A hiring team can open the artifact or ask about the claim. A claim without an artifact stays prose until the conversation.
            </p>
          </div>
          <Link href="/profile/edit" className="text-[11px] font-medium text-accent">
            Add or edit claims
          </Link>
        </div>

        {evidenceClaims.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-line-strong bg-surface px-4 py-6 text-center">
            <p className="text-[13px] font-medium text-ink">No claims yet.</p>
            <p className="mx-auto mt-1 max-w-md text-[11.5px] leading-5 text-ink-muted">
              Add a project, a role or a result. Keep the artifact if you have one; it is optional, not a requirement.
            </p>
            <Link href="/profile/edit" className="mt-3 inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-[12px] font-medium text-white">
              Add a claim
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {evidenceClaims.map((fact) => (
              <FactCard key={fact.id} fact={fact} />
            ))}
          </div>
        )}

        {contextFacts.length ? (
          <div className="mt-4 rounded-xl border border-line bg-paper p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Context, not claims</p>
            <p className="mt-1 text-[11px] leading-5 text-ink-muted">
              These are preferences and working notes you chose to share. They are not checked against an artifact; they are
              useful in the conversation.
            </p>
            <ul className="mt-2 space-y-2">
              {contextFacts.map((fact) => (
                <li key={fact.id} className="text-[11.5px] leading-5 text-ink-soft">
                  <span className="font-medium text-ink">{fact.prompt}: </span>
                  {fact.claim}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-line bg-surface" aria-labelledby="how-read-heading">
        <div className="p-5 sm:p-6">
          <h2 id="how-read-heading" className="text-[18px] font-semibold leading-tight">
            How an interviewer reads this
          </h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-5 text-ink-muted">
            Rivet does not score your writing or guess whether a model helped you. It shows the reviewer the work and the claims,
            and where each claim stands.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: ClipboardCheck,
                title: "The work sample",
                body: "The exact assessment version and score against the role's stated bar. One sitting, never averaged.",
              },
              {
                icon: Link2,
                title: "The claim ledger",
                body: "A reviewer marks each claim checked, artifact-only, for conversation or still prose. Context stays context.",
              },
              {
                icon: MessageSquareText,
                title: "The conversation",
                body: "Open claims and work-sample gaps become questions with a listen-for, not a gotcha.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-lg border border-line bg-paper p-4">
                  <Icon className="h-4 w-4 text-accent" aria-hidden />
                  <p className="mt-2 text-[12.5px] font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-ink-muted">{item.body}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3 text-[10.5px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden /> No person score
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden /> No ranking
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden /> No automatic rejection
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileSearch className="h-3.5 w-3.5 text-accent" aria-hidden /> No AI CV detector
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-ink-faint">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Employer confirmations are simulated demo data
            </span>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3 text-[11px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5 text-ink-faint" aria-hidden /> {candidate.profileCompletion.completed}/{candidate.profileCompletion.total} profile pieces complete
        </span>
        <span>{event.name}</span>
        <Link href="/how-it-works#prescreen" className="ml-auto inline-flex items-center gap-1 font-medium text-accent">
          How the pre-screen works <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
