import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { EvidenceLink } from "@/components/brand/evidence-link";
import { EngineBadge, ProvenanceBadge, SyntheticTag } from "@/components/brand/evidence-badges";
import { PageHeader } from "@/components/brand/page-header";
import { TailoringSteps } from "@/components/tailoring/tailoring-steps";
import { StartTailoringButton } from "@/components/tailoring/start-tailoring-button";
import { Card } from "@/components/ui/card";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Approved preview",
  description: "Exactly what the employer sees: approved lines only, with their source provenance.",
};

export default async function TailoringPreviewPage({ params }: { params: Promise<{ roleId: string }> }) {
  const session = await getSession();
  if (!session) return null;
  if (session.side !== "candidate") redirect("/matches");
  const { roleId } = await params;
  const repo = getRepository();
  const [role, draft] = await Promise.all([
    repo.getRoleById(roleId),
    repo.getTailoringDraft(session.candidate.id, roleId),
  ]);
  if (!role) notFound();

  if (!draft) {
    return (
      <div className="animate-fade-up">
        <Link href="/tailor" className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted"><ArrowLeft className="h-3.5 w-3.5" /> Tailoring</Link>
        <div className="mt-6 rounded-[26px] border border-line bg-surface p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-rose" />
          <h1 className="mt-4 font-display text-[32px]">No tailored version yet</h1>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-6 text-ink-muted">Generate suggestions first, then approve at least one line. The employer preview only exists after your approval.</p>
          <div className="mt-5 flex justify-center"><StartTailoringButton roleId={role.id} /></div>
        </div>
      </div>
    );
  }

  if (draft.status !== "APPROVED") {
    return (
      <div className="animate-fade-up">
        <Link href={"/tailor/" + role.id} className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted"><ArrowLeft className="h-3.5 w-3.5" /> Back to review</Link>
        <div className="mt-6 rounded-[26px] border border-line bg-surface p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose" />
          <h1 className="mt-4 font-display text-[32px]">Not approved yet</h1>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-6 text-ink-muted">The employer preview is locked until you approve at least one suggestion. Nothing from this draft is visible to the employer.</p>
          <Link href={"/tailor/" + role.id} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[12px] font-semibold text-paper">Continue review <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
    );
  }

  const approved = draft.items.filter((item) => item.status === "APPROVED").sort((a, b) => a.order - b.order);

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/tailor" className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted transition hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Tailoring</Link>
        <div className="flex items-center gap-2">
          <SyntheticTag />
          <EngineBadge engine={draft.engine} />
        </div>
      </div>
      <div className="mt-5">
        <PageHeader
          eyebrow="Approved preview · candidate-controlled"
          title="What they see."
          description="This is the exact approved version: only the lines you approved, in order, with provenance carried from their source facts. No new experience was added."
          action={<span className="inline-flex items-center gap-1.5 rounded-full border border-moss/25 bg-moss/10 px-3 py-2 text-[10px] font-semibold text-moss"><Check className="h-3.5 w-3.5" /> Approved {draft.approvedAt ? new Date(draft.approvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}</span>}
        />
      </div>
      <div className="mb-5"><TailoringSteps current={3} /></div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="overflow-hidden rounded-[30px] border border-line bg-surface">
          <div className="border-b border-line bg-[#F3EDE4] px-5 py-3 sm:px-7">
            <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><BadgeCheck className="h-3.5 w-3.5 text-moss" /> Candidate-approved profile · shared for this role</p>
          </div>
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
              <div className="flex items-start gap-4">
                <Avatar name={session.candidate.name} monogram={session.candidate.monogram} palette={session.candidate.palette} size="lg" />
                <div>
                  <h2 className="font-display text-[32px] leading-none tracking-[-0.03em]">{session.candidate.name}</h2>
                  <p className="mt-2 text-[12px] text-ink-muted">{session.candidate.headline}</p>
                  <p className="mt-1 text-[10px] text-ink-faint">Tailored for {role.title} at {role.employer.name}</p>
                </div>
              </div>
              <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-muted">{approved.length} approved {approved.length === 1 ? "line" : "lines"}</span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {approved.map((item, index) => {
                const text = item.editedText ?? item.suggestedText;
                const provenances = Array.from(new Set(item.sourceFacts.map((fact) => fact.provenance)));
                const linkedFacts = item.sourceFacts.filter((fact) => fact.evidenceUrl);
                return (
                  <article key={item.id} className={index === 0 ? "rounded-[22px] border border-line bg-paper/55 p-5 md:col-span-2" : "rounded-[22px] border border-line bg-paper/55 p-5"} data-testid="preview-line">
                    <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Approved line {index + 1}</p>
                    <p className={index === 0 ? "mt-2 font-display text-[23px] leading-[1.45] text-ink" : "mt-2 font-display text-[20px] leading-[1.45] text-ink"}>{text}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {provenances.map((provenance) => <ProvenanceBadge key={provenance} provenance={provenance} />)}
                      {item.editedText && <span className="rounded-full border border-line px-2 py-1 text-[9px] text-ink-muted">Edited by candidate</span>}
                    </div>
                    {linkedFacts.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {linkedFacts.flatMap((fact) => fact.evidenceUrl ? [
                          <EvidenceLink key={fact.id} factId={fact.id} evidenceUrl={fact.evidenceUrl} initialStatus={fact.linkStatus?.status ?? null} initialCheckedAt={fact.linkStatus?.checkedAt ?? null} />
                        ] : [])}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
            <p className="mt-5 flex items-start gap-2 border-t border-line pt-4 text-[10px] leading-5 text-ink-muted">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
              Every line traces back to a fact in the candidate&apos;s single master record. Evidence-link status (“Link works” or “Link unreachable”) is mechanical and does not imply that a claim is true. Employer confirmation is simulated seed data, not a real check.
            </p>
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Approval audit</p>
            <div className="mt-3 space-y-2 text-[10.5px] leading-5 text-ink-muted">
              <p className="flex justify-between gap-3"><span>Approved by</span><span className="font-semibold text-ink">{session.candidate.name}</span></p>
              <p className="flex justify-between gap-3"><span>Approved at</span><span className="font-semibold text-ink">{draft.approvedAt ? new Date(draft.approvedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</span></p>
              <p className="flex justify-between gap-3"><span>Engine</span><span className="font-semibold text-ink">{draft.engine === "fallback" ? "Demo AI fallback" : "Nemotron 3.5 Super VL"}</span></p>
              <p className="flex justify-between gap-3"><span>Lines shared</span><span className="font-semibold text-ink">{approved.length}</span></p>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Master record is untouched</p>
            <p className="mt-2 text-[10.5px] leading-5 text-ink-muted">Tailoring created a separate per-role view. It did not add experience, remove facts, or change any provenance label.</p>
            <Link href="/profile" className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink transition hover:text-rose">Open the master record <ArrowRight className="h-3 w-3" /></Link>
          </Card>
          <Card className="p-5">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Want another version?</p>
            <p className="mt-2 text-[10.5px] leading-5 text-ink-muted">This version is approved and locked. Return to the master record if you want to change the underlying facts; those changes would need a new review.</p>
            <Link href="/tailor" className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[10.5px] font-semibold text-ink">Back to tailoring <ExternalLink className="h-3 w-3" /></Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
