import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Flower2, MapPin, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { AiStatusChip } from "@/components/brand/ai-status-chip";
import { EvidenceLegend, SyntheticTag } from "@/components/brand/evidence-badges";
import { PageHeader } from "@/components/brand/page-header";
import { Avatar } from "@/components/brand/avatar";
import { CandidateHero } from "@/components/profile/candidate-hero";
import { FactCard } from "@/components/profile/fact-card";
import { HighlightStudio } from "@/components/profile/highlight-studio";
import { Card } from "@/components/ui/card";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Your master record and the rules behind it.",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;
  const repo = getRepository();
  const event = await repo.getEvent();

  if (session.side === "candidate") {
    const candidate = session.candidate;
    const tailorable = await repo.getTailorableRoles(candidate.id);
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
          eyebrow="Your master record · one factual source"
          title="One record. Many rooms."
          description="You keep one set of true facts. For a specific team, you can choose what to foreground and reword — but you never invent experience, and you approve every line."
          action={
            <>
              <SyntheticTag />
              <Link href="/tailor" className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[12px] font-semibold text-paper transition hover:bg-ink-soft">
                <Sparkles className="h-3.5 w-3.5" /> Tailor a profile
              </Link>
            </>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start">
          <div className="space-y-5">
            <CandidateHero candidate={candidate} />
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint">The prompt record</p>
                <p className="mt-1 text-[11px] text-ink-muted">Facts, projects, and preferences. Evidence links are optional.</p>
              </div>
              <p className="hidden text-[10px] text-ink-faint sm:block">{candidate.facts.length} items</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {candidate.facts.map((fact, index) => (
                <FactCard key={fact.id} fact={fact} featured={index === 0} className={index === 0 ? "md:col-span-2" : undefined} />
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <Card className="p-5">
              <p className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                <Sparkles className="h-4 w-4 text-rose" /> AI highlight studio
              </p>
              <p className="mt-2 text-[11px] leading-5 text-ink-muted">
                Paste a longer prompt answer and let the demo extract structured highlights. You review each
                one before it joins your record. Extraction never changes provenance.
              </p>
              <Link href="/profile#highlight-studio" className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink transition hover:text-rose">
                Open the studio <ArrowRight className="h-3 w-3" />
              </Link>
            </Card>
            <EvidenceLegend />
            <Card className="p-5">
              <p className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                <ShieldCheck className="h-4 w-4 text-moss" /> What tailoring can change
              </p>
              <ul className="mt-3 space-y-2 text-[10.5px] leading-5 text-ink-muted">
                <li className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-rose" /> Which existing facts to foreground.</li>
                <li className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-rose" /> Their order in the tailored view.</li>
                <li className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-rose" /> How a fact is reworded.</li>
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-[10px] leading-4 text-ink-faint">Never new experience. Never a provenance upgrade. You approve the final version.</p>
              <div className="mt-3 flex items-center justify-between"><AiStatusChip compact /><span className="text-[9px] text-ink-faint">{tailorable.length} tailor-ready {tailorable.length === 1 ? "role" : "roles"}</span></div>
            </Card>
          </aside>
        </div>

        <div id="highlight-studio" className="mt-8 rounded-[28px] border border-line bg-[#F3EDE4] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint">Optional · always self-claimed</p>
              <h2 className="mt-2 font-display text-[28px] leading-tight">Turn a longer answer into highlights.</h2>
              <p className="mt-2 max-w-xl text-[11.5px] leading-5 text-ink-muted">
                This is the AI highlight studio. It can surface the skills and claims already in your writing and
                suggest an evidence link only when one is literally present. You choose what to add.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Flower2 className="h-4 w-4 text-rose" />
              <span className="text-[10px] font-medium text-ink-muted">No portfolio required</span>
            </div>
          </div>
          <HighlightStudio sampleText={sampleText} candidateName={candidate.name} />
        </div>
      </div>
    );
  }

  const employer = session.employer;
  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Your team profile · what candidates see"
        title="Your team, in your own words."
        description="Candidates see prompts, not a logo wall. Keep the profile specific, honest about the work, and clear about what good looks like."
        action={<SyntheticTag />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start">
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[28px] border border-line bg-surface p-5 sm:p-7">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-moss/[0.06]" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-ink/10 bg-[#EFE7DB] font-display text-[26px] font-semibold text-ink-soft">{employer.logoMark}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-[34px] leading-none tracking-[-0.035em] sm:text-[40px]">{employer.name}</h1>
                    <SyntheticTag>Demo team</SyntheticTag>
                  </div>
                  <p className="mt-2 text-[13px] font-medium text-ink-soft sm:text-[14px]">{employer.tagline}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-ink-muted">
                    <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {employer.industry}</span>
                    <span>{employer.teamSize}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {employer.location}</span>
                  </p>
                </div>
              </div>
            </div>
            <p className="relative mt-5 max-w-2xl text-[12.5px] leading-6 text-ink-muted">{employer.about}</p>
          </section>

          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint">The team prompts</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {employer.prompts.map((prompt, index) => (
                <article key={prompt.prompt} className={cn("rounded-[22px] border border-line bg-surface p-5", index === 0 && "sm:col-span-2")}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{prompt.prompt}</p>
                  <p className={cn("mt-2 font-display leading-[1.4] text-ink", index === 0 ? "text-[22px]" : "text-[19px]")}>{prompt.answer}</p>
                </article>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint">Open roles</p>
            <div className="mt-3 space-y-2">
              {employer.roles.map((role) => (
                <div key={role.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-line bg-surface px-4 py-3.5">
                  <div>
                    <p className="font-display text-[20px] leading-tight">{role.title}</p>
                    <p className="mt-1 text-[10px] text-ink-muted">{role.employmentType} · {role.workMode} · {role.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!role.portfolioRequired && <span className="rounded-full border border-moss/20 bg-moss/10 px-2.5 py-1 text-[9px] font-medium text-moss">No portfolio</span>}
                    <Link href={"/roles/" + role.id} className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink-muted transition hover:text-ink">View role <ArrowRight className="h-3 w-3" /></Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">At this event</p>
            <p className="mt-2 font-display text-[22px] leading-tight">{event.name}</p>
            <p className="mt-1 text-[10.5px] text-ink-muted">{event.dateLabel} · {event.city}</p>
            <p className="mt-3 text-[10.5px] leading-5 text-ink-muted">You can switch the role you&apos;re hiring for at any time in the sidebar. Your yes is recorded per role.</p>
          </Card>
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint"><UserRound className="h-3.5 w-3.5 text-rose" /> Two-sided by design</p>
            <p className="mt-2 text-[10.5px] leading-5 text-ink-muted">Candidates browse your prompts and evidence just as you browse theirs. No CV extraction, no automated rejections, no hidden ranking.</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between"><p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">AI status</p><AiStatusChip compact /></div>
            <p className="mt-2 text-[10.5px] leading-5 text-ink-muted">AI can help a candidate reword their own record for your role, and can answer sourced questions from a profile. It cannot score or reject anyone.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
