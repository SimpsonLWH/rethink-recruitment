import { MapPin } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import type { CandidateDetail } from "@/lib/repo";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function CandidateHero({
  candidate,
  action,
  className,
  nameAs: NameTag = "h1",
}: {
  candidate: CandidateDetail;
  action?: ReactNode;
  className?: string;
  nameAs?: "h1" | "h2";
}) {
  const linked = candidate.facts.filter((fact) => fact.evidenceUrl).length;
  const confirmed = candidate.facts.filter((fact) => fact.provenance === "EMPLOYER_CONFIRMED").length;
  const stats = [
    { value: candidate.facts.length.toString(), label: "profile facts" },
    { value: linked.toString(), label: "evidence links" },
    { value: confirmed.toString(), label: "employer confirmations" },
  ];

  return (
    <section className={cn("rounded-[20px] border border-line bg-surface p-6 sm:p-8", className)}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar name={candidate.name} monogram={candidate.monogram} palette={candidate.palette} size="xl" />
          <div className="min-w-0">
            <NameTag className="font-display text-[34px] leading-[0.95] tracking-[-0.035em] sm:text-[40px]">
              {candidate.name}
            </NameTag>
            <p className="mt-3 text-[15px] font-medium leading-6 text-ink-soft sm:text-[16px]">{candidate.headline}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> {candidate.location}
            </p>
            {candidate.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {candidate.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-muted">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {candidate.bio && <p className="mt-6 max-w-2xl text-[15px] leading-7 text-ink-muted">{candidate.bio}</p>}

      <dl className="mt-6 grid grid-cols-3 border-t border-line pt-5">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn("flex min-w-0 flex-col", index > 0 && "border-l border-line pl-4 sm:pl-6")}
          >
            <dt className="order-2 mt-2 text-[11px] font-medium uppercase leading-4 tracking-[0.1em] text-ink-faint">
              {stat.label}
            </dt>
            <dd className="order-1 text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 text-[12px] leading-5 text-ink-faint">
        Prompts, not CV lines. Evidence links and employer confirmations are fictional demo data.
      </p>
    </section>
  );
}
