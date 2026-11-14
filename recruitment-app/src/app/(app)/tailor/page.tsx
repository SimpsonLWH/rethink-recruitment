import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { EmptyState } from "@/components/brand/empty-state";
import { AiStatusChip } from "@/components/brand/ai-status-chip";
import { SyntheticTag } from "@/components/brand/evidence-badges";
import { StartTailoringButton } from "@/components/tailoring/start-tailoring-button";
import { Card } from "@/components/ui/card";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tailor a profile",
  description: "One master record. One approved version per role.",
};

export default async function TailorIndexPage() {
  const session = await getSession();
  if (!session) return null;
  if (session.side !== "candidate") redirect("/matches");
  const repo = getRepository();
  const options = await repo.getTailorableRoles(session.candidate.id);
  const candidate = session.candidate;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Tailoring · selection, not invention"
        title="One record. One audience."
        description="Choose a team you already liked or matched with. The app will suggest which existing facts to foreground and how to reword them. You approve every line before anyone else sees it."
        action={<SyntheticTag />}
      />

      {options.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No roles to tailor for yet"
          body="Tailoring is available for a role you liked or matched with. Go back to discovery and say yes to a team that feels worth a closer look."
          action={<Link href="/discover" className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[12px] font-semibold text-paper">Go to discovery <ArrowRight className="h-3.5 w-3.5" /></Link>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-3">
            {options.map((option) => {
              const role = option.role;
              return (
                <article key={role.id} className="rounded-[24px] border border-line bg-surface p-5" data-testid="tailor-option">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-[#EFE7DB] font-display text-[14px] font-semibold text-ink-soft">{role.employer.logoMark}</span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-[23px] leading-tight">{role.title}</p>
                          <span className={cn("rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em]", option.state === "MATCHED" ? "border-moss/20 bg-moss/10 text-moss" : "border-line bg-paper text-ink-muted")}>
                            {option.state === "MATCHED" ? "Matched" : "You said yes"}
                          </span>
                          {option.draftStatus === "APPROVED" && <span className="rounded-full border border-moss/20 bg-moss/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-moss">Approved</span>}
                        </div>
                        <p className="mt-1 text-[11px] text-ink-muted">{role.employer.name} · {role.employmentType} · {role.workMode}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {option.draftStatus === "APPROVED" || option.draftStatus === "DRAFT" ? (
                        <Link href={"/tailor/" + role.id + (option.draftStatus === "APPROVED" ? "/preview" : "")} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-[11px] font-semibold text-paper transition hover:bg-ink-soft">
                          {option.draftStatus === "APPROVED" ? "View approved preview" : "Continue review"} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <StartTailoringButton roleId={role.id} />
                      )}
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-2 text-[11.5px] leading-5 text-ink-muted">{role.problemNow}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[9.5px] text-ink-faint">
                    <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /> Master record · {candidate.facts.length} facts</span>
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-moss" /> Only existing facts</span>
                    <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-rose" /> You approve the final version</span>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="space-y-4">
            <Card className="p-5">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">The tailoring rule</p>
              <p className="mt-2 font-display text-[23px] leading-tight">Same facts. Better light.</p>
              <div className="mt-3 space-y-2 text-[10.5px] leading-5 text-ink-muted">
                <p>AI can select, reorder, and reword your existing master-record facts.</p>
                <p>It cannot add experience, change a provenance label, or invent an evidence link.</p>
                <p>Nothing is shared until you approve at least one line.</p>
              </div>
            </Card>
            <Card className="p-5">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Your master record</p>
              <p className="mt-2 text-[11px] leading-5 text-ink-muted">{candidate.name} · {candidate.headline}</p>
              <Link href="/profile" className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink transition hover:text-rose">Open the record <ArrowRight className="h-3 w-3" /></Link>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between"><p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">AI status</p><AiStatusChip compact /></div>
              <p className="mt-2 text-[10.5px] leading-5 text-ink-muted">Without a live key, local template suggestions power this flow. With a key, Nemotron 3.5 Super VL generates the suggestions. The guardrails are identical.</p>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
