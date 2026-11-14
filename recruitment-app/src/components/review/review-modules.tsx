"use client";

import Image from "next/image";
import { ArrowUpRight, ExternalLink, FileText, Link2, Link2Off } from "lucide-react";
import { ProvenanceBadge } from "@/components/brand/evidence-badges";
import { reviewModuleKindLabel, type ReviewModule } from "@/lib/profile";
import type { FactView } from "@/lib/repo";
import { cn } from "@/lib/utils";

function ModuleFooter({
  label,
  facts,
}: {
  label: string;
  facts: FactView[];
}) {
  const first = facts[0];
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-line pt-1.5 text-[11px] text-ink-faint">
      <FileText className="h-3 w-3" aria-hidden />
      <span>{label}</span>
      {first && <ProvenanceBadge provenance={first.provenance} />}
      {first?.evidenceUrl &&
        (first.linkStatus?.status === "WORKS" ? (
          <span className="inline-flex items-center gap-1"><Link2 className="h-3 w-3" /> Link works</span>
        ) : first.linkStatus?.status === "UNREACHABLE" ? (
          <span className="inline-flex items-center gap-1"><Link2Off className="h-3 w-3" /> Link unreachable</span>
        ) : (
          <span>Link attached</span>
        ))}
    </p>
  );
}

export function ReviewModuleCard({
  module,
  candidateFacts,
  onOpen,
  className,
}: {
  module: ReviewModule;
  candidateFacts: FactView[];
  onOpen: (title: string, facts: FactView[]) => void;
  className?: string;
}) {
  const facts = module.factIds
    .map((id) => candidateFacts.find((fact) => fact.id === id))
    .filter((fact): fact is FactView => Boolean(fact));
  const label = reviewModuleKindLabel(module.kind);

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border border-line bg-surface p-3.5 transition hover:border-line-strong",
        className,
      )}
      data-testid={"review-module-" + module.kind}
    >
      <button
        type="button"
        onClick={() => onOpen(module.title || label, facts)}
        className="group flex flex-1 flex-col text-left"
        aria-label={"View evidence for " + (module.title || label)}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-ink-faint">{label}</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-ink-faint transition group-hover:text-accent" aria-hidden />
        </span>

        {module.kind === "achievement" && (
          <>
            <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-ink">{module.stat}</p>
            <p className="mt-1.5 text-[12px] leading-[1.45] text-ink-muted">{module.context}</p>
          </>
        )}

        {module.kind === "project" && (
          <>
            <p className="mt-1.5 text-[13px] font-semibold leading-snug text-ink">{module.title}</p>
            <p className="mt-0.5 text-[12px] leading-[1.4] text-ink-muted">{module.outcome}</p>
            {module.image && (
              <span className="mt-2 block overflow-hidden rounded-xl border border-line bg-paper">
                <Image
                  src={module.image}
                  alt={"Synthetic illustration for " + module.title}
                  width={960}
                  height={540}
                  unoptimized
                  className="h-[75px] w-full object-cover object-top"
                />
              </span>
            )}
            {(module.start || module.end || module.organisation) && (
              <span className="mt-1 block text-[11px] text-ink-faint">
                {[module.organisation, module.start, module.end].filter(Boolean).join(" · ")}
              </span>
            )}
          </>
        )}

        {module.kind === "timeline" && (
          <span className="mt-1.5 space-y-1.5">
            {module.entries.map((entry) => (
              <span key={entry.factId} className="block border-l border-line pl-3">
                <span className="block text-[11px] text-ink-faint">
                  {entry.start} — {entry.end ?? "present"}
                </span>
                <span className="mt-0.5 block text-[13px] font-medium leading-snug text-ink">{entry.title}</span>
                <span className="mt-0.5 block text-[11px] text-ink-muted">{entry.organisation}</span>
              </span>
            ))}
          </span>
        )}

        {module.kind === "skills" && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {module.skills.map((skill) => (
              <span key={skill.name} className="rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] text-ink-soft">
                {skill.name}
                {skill.months ? <span className="ml-1 text-ink-faint">{Math.round(skill.months / 12 * 10) / 10}y</span> : null}
              </span>
            ))}
          </span>
        )}

        {(module.kind === "responsibility" ||
          module.kind === "qualification" ||
          module.kind === "availability" ||
          module.kind === "result" ||
          module.kind === "fact") && (
          <>
            {module.title && <p className="mt-1.5 text-[13px] font-semibold leading-snug text-ink">{module.title}</p>}
            <p className="mt-0.5 text-[12px] leading-[1.4] text-ink-muted">{module.body}</p>
          </>
        )}

        <ModuleFooter label={facts.length + " source " + (facts.length === 1 ? "fact" : "facts")} facts={facts} />
      </button>

      {module.kind === "project" && module.link && (
        <div className="mt-2 flex items-center justify-between gap-3">
          <a
            href={module.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent underline decoration-accent/30 underline-offset-4"
          >
            <ExternalLink className="h-3 w-3" /> Open the linked evidence
          </a>
        </div>
      )}
    </article>
  );
}