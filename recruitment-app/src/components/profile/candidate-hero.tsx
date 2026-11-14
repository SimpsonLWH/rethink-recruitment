import { MapPin, Sparkles } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { SyntheticTag } from "@/components/brand/evidence-badges";
import type { CandidateDetail } from "@/lib/repo";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function CandidateHero({
  candidate,
  action,
  className,
}: {
  candidate: CandidateDetail;
  action?: ReactNode;
  className?: string;
}) {
  const linked = candidate.facts.filter((fact) => fact.evidenceUrl).length;
  const confirmed = candidate.facts.filter((fact) => fact.provenance === "EMPLOYER_CONFIRMED").length;

  return (
    <section className={cn("relative overflow-hidden rounded-[28px] border border-line bg-surface p-5 sm:p-7", className)}>
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-rose/[0.06]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar name={candidate.name} monogram={candidate.monogram} palette={candidate.palette} size="xl" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[32px] leading-none tracking-[-0.035em] sm:text-[38px]">{candidate.name}</h1>
              <SyntheticTag>Demo profile</SyntheticTag>
            </div>
            <p className="mt-2 text-[13px] font-medium text-ink-soft sm:text-[14px]">{candidate.headline}</p>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-muted">
              <MapPin className="h-3 w-3" /> {candidate.location}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {candidate.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-line bg-paper/70 px-2.5 py-1 text-[9.5px] font-medium text-ink-muted">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <p className="relative mt-5 max-w-2xl text-[13px] leading-6 text-ink-muted">{candidate.bio}</p>
      <div className="relative mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
        {[
          [candidate.facts.length.toString(), "master-record facts"],
          [linked.toString(), "evidence links"],
          [confirmed.toString(), "simulated confirmations"],
        ].map(([value, label]) => (
          <div key={label} className="bg-paper/60 px-3 py-3 text-center">
            <p className="font-display text-[20px] leading-none">{value}</p>
            <p className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.09em] text-ink-faint">{label}</p>
          </div>
        ))}
      </div>
      <p className="relative mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-ink-faint">
        <Sparkles className="mt-0.5 h-3 w-3 shrink-0" /> Prompts, not CV lines. Every evidence link and employer confirmation is fictional demo data.
      </p>
    </section>
  );
}
