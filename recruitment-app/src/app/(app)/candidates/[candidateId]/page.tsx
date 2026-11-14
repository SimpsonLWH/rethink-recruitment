import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
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
  if (!interested) redirect("/discover");

  const role = session.activeRole ? await repo.getRoleById(session.activeRole.id) : null;

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
          <h2 className="font-display text-[26px] leading-tight">The prompt record</h2>
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
          <h2 className="font-display text-[26px] leading-tight">Questions, answered from the record.</h2>
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
