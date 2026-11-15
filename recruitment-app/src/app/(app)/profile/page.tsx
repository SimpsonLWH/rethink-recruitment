import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { CandidateHero } from "@/components/profile/candidate-hero";
import { FactCard } from "@/components/profile/fact-card";
import { HighlightStudio } from "@/components/profile/highlight-studio";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { assessmentTitle } from "@/lib/ui-copy";
import { IntegrityNote } from "@/components/assessments/integrity-badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Your structured profile: one factual source you can tailor for a team.",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;
  const repo = getRepository();
  const event = await repo.getEvent();

  if (session.side === "candidate") {
    const candidate = session.candidate;
    const linkedExample = candidate.facts.find((fact) => fact.evidenceUrl);
    const sampleText = [
      candidate.facts[0]?.claim ?? "I care about work that makes the next person's day easier.",
      "I also try to make the work legible to the next person, so I keep a short write-up of what changed and why.",
      linkedExample?.evidenceUrl ? "Here is one example: " + linkedExample.evidenceUrl : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="animate-fade-up">
        <PageHeader
          title="Profile"
          description="Your structured experience, projects and assessment results."
          action={
            <Link href="/profile/edit" className={cn(buttonVariants({ variant: "primary", size: "md" }))}>
              Edit profile <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        />

        <div className="mx-auto w-full max-w-4xl">
          <CandidateHero candidate={candidate} nameAs="h2" />

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Profile completeness</p>
              <p className="mt-2 text-[15px] font-medium text-ink">
                {candidate.profileCompletion.completed} of {candidate.profileCompletion.total} pieces
              </p>
              <p className="mt-1 text-[12px] leading-5 text-ink-muted">
                {candidate.profileCompletion.complete
                  ? "Your structured profile is complete."
                  : "Missing: " + candidate.profileCompletion.missing.join(", ") + "."}
              </p>
              <Link href="/profile/edit" className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-accent">
                Add or edit evidence <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Discovery visibility</p>
              <p className="mt-2 text-[15px] font-medium text-ink">
                {candidate.discoveryOptIn ? "Discoverable to teams" : "Hidden from discovery"}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-ink-muted">
                {candidate.discoveryOptIn
                  ? "Recruiters can find you outside roles you swiped on and invite you to look."
                  : "Recruiters cannot find or invite you outside a role you swiped on."}
              </p>
              <Link href="/profile/edit" className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-accent">
                Change visibility <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-line bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Assessment results</p>
                <p className="mt-1 text-[12px] text-ink-muted">One score per assessment family, version and difficulty. No aggregate.</p>
              </div>
              <Link href="/assessments" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-[12px] font-medium text-ink">
                Open assessments <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {candidate.assessmentResults.length ? (
              <div className="mt-4 divide-y divide-line border-y border-line">
                {candidate.assessmentResults.map((result) => (
                  <div key={result.assessment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-[13px] font-medium text-ink">
                        {assessmentTitle(result.assessment.title)} · {result.assessment.version}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-muted">
                        {result.assessment.difficulty.toLowerCase()} · {result.score === null ? "attempt in progress" : "final"}
                      </p>
                      <IntegrityNote integrity={result.integrity} className="mt-0.5" />
                    </div>
                    <p className="text-[13px] font-semibold text-ink">{result.score === null ? "In progress" : result.score + "/100"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-[13px] text-ink-muted">No assessment results yet.</p>
            )}
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[22px] font-semibold leading-tight">The prompt record</h2>
                <p className="mt-2 text-[14px] leading-6 text-ink-muted">
                  Facts, projects, and preferences. Evidence links are optional.
                </p>
              </div>
              <p className="text-[12px] text-ink-faint">{candidate.facts.length} items</p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {candidate.facts.map((fact, index) => (
                <FactCard
                  key={fact.id}
                  fact={fact}
                  featured={index === 0}
                  className={index === 0 ? "md:col-span-2" : undefined}
                />
              ))}
            </div>
          </section>

          <section className="mt-12 border-t border-line pt-10">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Optional · always self-claimed</p>
              <h2 className="mt-3 text-[24px] font-semibold leading-tight">Turn a longer answer into highlights.</h2>
              <p className="mt-3 text-[15px] leading-7 text-ink-muted">
                Paste a longer answer and choose which lines join your record; extraction never changes provenance.{" "}
                <Link href="/how-it-works#ai" className="font-medium text-ink underline decoration-line-strong underline-offset-4">
                  How extraction works
                </Link>
                .
              </p>
            </div>
            <HighlightStudio sampleText={sampleText} candidateName={candidate.name} />
          </section>
        </div>
      </div>
    );
  }

  const employer = session.employer;
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Your team, in your own words."
        description="Candidates see prompts, not a logo wall. Keep it specific, honest about the work, and clear about what good looks like."
      />

      <div className="mx-auto w-full max-w-4xl">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-[#EFE7DB] text-[20px] font-semibold tracking-[-0.01em] text-ink-soft">
              {employer.logoMark}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-[32px] leading-none tracking-[-0.03em]">{employer.name}</h2>
              <p className="mt-3 text-[15px] font-medium leading-6 text-ink-soft">{employer.tagline}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-5 text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" aria-hidden /> {employer.industry}
                </span>
                <span>{employer.teamSize}</span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" aria-hidden /> {employer.location}
                </span>
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-ink-muted">{employer.about}</p>
        </Card>

        <section className="mt-10 border-t border-line pt-8">
          <h2 className="text-[22px] font-semibold leading-tight">The team prompts</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {employer.prompts.map((prompt, index) => (
              <article
                key={prompt.prompt}
                className={cn("rounded-xl border border-line bg-surface p-6", index === 0 && "sm:col-span-2")}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{prompt.prompt}</p>
                <p className={cn("mt-3 leading-7 text-ink-soft", index === 0 ? "text-[17px]" : "text-[16px]")}>
                  {prompt.answer}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 border-t border-line pt-8">
          <h2 className="text-[22px] font-semibold leading-tight">Open roles</h2>
          <div className="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {employer.roles.map((role) => (
              <div key={role.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold leading-6 text-ink">{role.title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-ink-muted">
                    {role.employmentType} · {role.workMode} · {role.location}
                    {role.portfolioRequired ? "" : " · No portfolio required"}
                  </p>
                </div>
                <Link
                  href={"/roles/" + role.id}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
                >
                  View role <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-8 text-[12px] leading-6 text-ink-faint">
          At {event.name} · {event.dateLabel} · {event.city}. Switch the role you are hiring for in the sidebar.
        </p>
      </div>
    </div>
  );
}
