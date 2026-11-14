import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";
import { AiStatusChip } from "@/components/brand/ai-status-chip";
import { EvidenceLegend, SyntheticTag } from "@/components/brand/evidence-badges";
import { CandidateHero } from "@/components/profile/candidate-hero";
import { FactCard } from "@/components/profile/fact-card";
import { FitBrief } from "@/components/profile/fit-brief";
import { AskProfile } from "@/components/profile/ask-profile";
import { Card } from "@/components/ui/card";
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

  const role = session.activeRole ? await repo.getRoleById(session.activeRole.id) : null;
  const matches = await repo.getMatches("employer", session.employer.id);
  const match = matches.find((item) => item.candidateId === candidateId && (!role || item.roleId === role.id));
  const fit = match && role ? await repo.getFitSummary(role.id, candidateId) : null;

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/discover" className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to discovery
        </Link>
        <div className="flex items-center gap-2">
          <SyntheticTag>Fictional candidate</SyntheticTag>
          {role && <Link href={"/roles/" + role.id} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[10px] font-semibold text-ink-muted transition hover:text-ink"><Building2 className="h-3 w-3" /> {role.title}</Link>}
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-5">
          <CandidateHero candidate={candidate} />
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint">The prompt record</p>
            <p className="mt-1 text-[11px] text-ink-muted">Read the claims, then inspect the two independent labels on each one.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {candidate.facts.map((fact, index) => (
              <FactCard key={fact.id} fact={fact} featured={index === 0} className={index === 0 ? "md:col-span-2" : undefined} />
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <AskProfile candidate={candidate} />
          {fit && <FitBrief fit={fit} />}
          {!match && role && (
            <Card className="p-5">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Advisory fit brief</p>
              <p className="mt-2 text-[10.5px] leading-5 text-ink-muted">A fit brief appears only after a mutual yes. It is text to inform the conversation, not a screening score.</p>
            </Card>
          )}
          <EvidenceLegend />
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint"><ShieldCheck className="h-3.5 w-3.5 text-moss" /> Master record, not a tailored view</p>
            <p className="mt-2 text-[10.5px] leading-5 text-ink-muted">This is the candidate&apos;s one factual record. Any per-company tailored version must be reviewed and approved by the candidate; the approved preview is what they choose to share.</p>
            <div className="mt-3 flex items-center justify-between"><AiStatusChip compact /><Link href="/about-ai" className="text-[10px] font-semibold text-ink-muted hover:text-ink">About AI</Link></div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
