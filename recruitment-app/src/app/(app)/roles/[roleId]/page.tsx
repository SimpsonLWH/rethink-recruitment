import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Check, Flower2, MapPin, Sparkles, Users } from "lucide-react";
import { EvidenceLegend, SyntheticTag } from "@/components/brand/evidence-badges";
import { Card } from "@/components/ui/card";
import { AiStatusChip } from "@/components/brand/ai-status-chip";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ roleId: string }> }): Promise<Metadata> {
  const { roleId } = await params;
  const role = await getRepository().getRoleById(roleId);
  return { title: role ? role.title + " · " + role.employer.name : "Role" };
}

export default async function RolePage({ params }: { params: Promise<{ roleId: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const { roleId } = await params;
  const repo = getRepository();
  const role = await repo.getRoleById(roleId);
  if (!role) notFound();

  const candidate = session.side === "candidate" ? session.candidate : null;
  const tailorable = candidate ? await repo.getTailorableRoles(candidate.id) : [];
  const option = tailorable.find((item) => item.role.id === role.id);
  const isEmployerActiveRole = session.side === "employer" && session.activeRole?.id === role.id;

  return (
    <div className="animate-fade-up">
      <Link href="/discover" className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted transition hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to discovery
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start">
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[28px] border border-line bg-surface p-5 sm:p-7">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-rose/[0.06]" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-ink/10 bg-[#EFE7DB] font-display text-[20px] font-semibold text-ink-soft">{role.employer.logoMark}</span>
                <div>
                  <p className="text-[11px] font-semibold text-ink-muted">{role.employer.name}</p>
                  <h1 className="mt-1 max-w-xl font-display text-[34px] leading-[1.02] tracking-[-0.035em] sm:text-[42px]">{role.title}</h1>
                  <p className="mt-2 text-[11px] text-ink-muted">{role.employmentType} · {role.workMode} · {role.location}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {role.skills.map((skill) => (
                      <span key={skill} className="rounded-full border border-line bg-paper/70 px-2.5 py-1 text-[9.5px] font-medium text-ink-muted">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <SyntheticTag>Fictional team</SyntheticTag>
                {!role.portfolioRequired && <span className="inline-flex items-center gap-1.5 rounded-full border border-moss/20 bg-moss/10 px-2.5 py-1 text-[9.5px] font-semibold text-moss"><Check className="h-3 w-3" /> No portfolio required</span>}
              </div>
            </div>
            <p className="relative mt-5 max-w-2xl text-[12.5px] leading-6 text-ink-muted">{role.summary}</p>
            {candidate && option && (
              <Link href={"/tailor/" + role.id} className="relative mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[12px] font-semibold text-paper transition hover:bg-ink-soft">
                <Sparkles className="h-4 w-4" /> {option.draftStatus === "APPROVED" ? "View your approved tailoring" : option.draftStatus === "DRAFT" ? "Continue your tailored profile" : "Tailor your record for this role"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
            {session.side === "employer" && isEmployerActiveRole && (
              <Link href="/discover" className="relative mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[12px] font-semibold text-paper transition hover:bg-ink-soft">
                <Users className="h-4 w-4" /> Browse candidates for this role <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-[24px] border border-line bg-[#F3E8E3] p-5 md:col-span-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-rose-deep">The problem right now</p>
              <p className="mt-2 font-display text-[24px] leading-[1.35] text-ink sm:text-[28px]">{role.problemNow}</p>
            </article>
            <article className="rounded-[24px] border border-line bg-surface p-5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-ink-faint">Why join us</p>
              <p className="mt-2 font-display text-[20px] leading-[1.4] text-ink">{role.whyJoin}</p>
            </article>
            <article className="rounded-[24px] border border-line bg-surface p-5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-ink-faint">What good looks like in 90 days</p>
              <p className="mt-2 font-display text-[20px] leading-[1.4] text-ink">{role.first90}</p>
            </article>
          </div>

          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint">The team, in their own words</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {role.employerPrompts.map((prompt, index) => (
                <article key={prompt.prompt} className={cn("rounded-[22px] border border-line bg-surface p-5", index === 0 && "sm:col-span-2")}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{prompt.prompt}</p>
                  <p className={cn("mt-2 font-display leading-[1.4] text-ink", index === 0 ? "text-[22px]" : "text-[19px]")}>{prompt.answer}</p>
                </article>
              ))}
            </div>
          </div>

          <Card className="p-5 sm:p-6">
            <p className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint"><Building2 className="h-4 w-4 text-rose" /> About {role.employer.name}</p>
            <p className="mt-3 text-[12px] leading-6 text-ink-muted">{role.employer.about}</p>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-ink-faint"><span>{role.employer.industry}</span><span>{role.employer.teamSize}</span><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {role.employer.location}</span></p>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">How you&apos;ll be read</p>
            <div className="mt-3 space-y-2 text-[10.5px] leading-5 text-ink-muted">
              <p className="flex gap-2"><Flower2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" /> Roses are optional. You have 3 free for the event.</p>
              <p className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" /> No portfolio requirement. Your prompt record is enough.</p>
              <p className="flex gap-2"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" /> Tailoring can only reuse existing facts; you approve the result.</p>
            </div>
          </Card>
          <EvidenceLegend />
          <Card className="p-5">
            <div className="flex items-center justify-between"><p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">AI status</p><AiStatusChip compact /></div>
            <p className="mt-2 text-[10.5px] leading-5 text-ink-muted">No AI ranks this role or screens your profile. AI may help with highlight extraction and tailoring suggestions only.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
