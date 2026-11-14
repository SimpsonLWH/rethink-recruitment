import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Eye, LockKeyhole } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { CandidateHero } from "@/components/profile/candidate-hero";
import { FactCard } from "@/components/profile/fact-card";
import { AskProfile } from "@/components/profile/ask-profile";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ candidateId: string }> }): Promise<Metadata> {
  const { candidateId } = await params;
  const candidate = await getRepository().getCandidateById(candidateId);
  return { title: candidate ? candidate.name : "Candidate" };
}

export default async function CandidateProfilePage({ params }: { params: Promise<{ candidateId: string }> }) {
  const session = await getSession();
  if (!session) return null;
  if (session.side === "candidate") redirect("/profile");
  const { candidateId } = await params;
  const repo = getRepository();
  const candidate = await repo.getCandidateById(candidateId);
  if (!candidate) notFound();

  // The full profile opens only after the employer has said yes to this person.
  const interested = await repo.hasEmployerInterest(candidate.id, session.employer.id);
  const role = session.activeRole ? await repo.getRoleById(session.activeRole.id) : null;

  if (!interested) {
    return (
      <div className="animate-fade-up" data-testid="candidate-profile-gated">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to review
          </Link>
          <Link
            href="/discovery"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
          >
            Discovery lane <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <section className="rounded-xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <Avatar name={candidate.name} monogram={candidate.monogram} palette={candidate.palette} size="lg" />
              <div className="min-w-0">
                <h1 className="font-display text-[30px] leading-[1.02] tracking-[-0.03em]">{candidate.name}</h1>
                <p className="mt-1.5 text-[13px] leading-5 text-ink-soft">{candidate.headline}</p>
                <p className="mt-1 text-[12px] text-ink-faint">{candidate.location}</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-line bg-paper p-4">
              <p className="flex items-center gap-2 text-[12px] font-semibold text-ink">
                <LockKeyhole className="h-3.5 w-3.5 text-ink-muted" aria-hidden /> Full profile is gated
              </p>
              <p className="mt-1.5 text-[12px] leading-5 text-ink-muted">
                You have seen {candidate.name.split(" ")[0]}&apos;s headline and assessment evidence in the review feed.
                The prompt record, evidence links and the questions you can ask unlock when you express interest in this
                candidate.
              </p>
              <ul className="mt-3 space-y-1.5 text-[12px] leading-5 text-ink-muted">
                <li className="flex items-start gap-2">
                  <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden /> Full prompt record and
                  evidence links
                </li>
                <li className="flex items-start gap-2">
                  <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden /> Answers drawn from their
                  record
                </li>
                <li className="flex items-start gap-2">
                  <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden /> A conversation if they say
                  yes too
                </li>
              </ul>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/discover"
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-4 text-[12px] font-medium text-white"
              >
                Review in the feed <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
              <Link
                href="/discovery"
                className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line px-4 text-[12px] font-medium text-ink"
              >
                Open discovery lane
              </Link>
              {role && (
                <Link
                  href={"/roles/" + role.id}
                  className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line px-4 text-[12px] font-medium text-ink"
                >
                  <Building2 className="h-3.5 w-3.5" aria-hidden /> {role.title}
                </Link>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to discovery
        </Link>
        {role && (
          <Link
            href={"/roles/" + role.id}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
          >
            <Building2 className="h-3.5 w-3.5" aria-hidden /> {role.title}
          </Link>
        )}
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <CandidateHero candidate={candidate} />

        <section className="mt-10 border-t border-line pt-8">
          <h2 className="text-[24px] font-semibold leading-tight">The prompt record</h2>
          <p className="mt-2 text-[14px] leading-6 text-ink-muted">
            Read the claims, then inspect how each one is labelled. Evidence and provenance stay separate.
          </p>
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
          <h2 className="text-[24px] font-semibold leading-tight">Questions, answered from the record.</h2>
          <p className="mt-2 text-[14px] leading-6 text-ink-muted">
            Answers cite the facts above and never add new information.{" "}
            <Link href="/how-it-works#ai" className="font-medium text-ink underline decoration-line-strong underline-offset-4">
              How answers work
            </Link>
            .
          </p>
          <div className="mt-5">
            <AskProfile candidate={candidate} />
          </div>
        </section>
      </div>
    </div>
  );
}
