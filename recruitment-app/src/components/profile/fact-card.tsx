import { Link2Off, Sparkles } from "lucide-react";
import { EvidenceLink } from "@/components/brand/evidence-link";
import { ProvenanceBadge } from "@/components/brand/evidence-badges";
import type { FactView } from "@/lib/repo";
import { cn } from "@/lib/utils";

export function FactCard({
  fact,
  featured = false,
  className,
}: {
  fact: FactView;
  featured?: boolean;
  className?: string;
}) {
  const confirmed = fact.provenance === "EMPLOYER_CONFIRMED";
  return (
    <article
      className={cn(
        "flex flex-col rounded-[24px] border border-line bg-surface p-5 sm:p-6",
        featured && "sm:p-7",
        className,
      )}
      data-testid="fact-card"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint">{fact.prompt}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          {fact.origin === "AI_EXTRACTED" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2 py-1 text-[9px] font-semibold text-ink-muted">
              <Sparkles className="h-2.5 w-2.5" /> AI-extracted
            </span>
          )}
          {confirmed && (
            <span className="rounded-full border border-ink/15 bg-paper px-2 py-1 text-[8.5px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Fictional record
            </span>
          )}
        </div>
      </div>

      <blockquote
        className={cn(
          "mt-3 font-display leading-[1.45] tracking-[-0.015em] text-ink",
          featured ? "text-[23px] sm:text-[26px]" : "text-[19px] sm:text-[21px]",
        )}
      >
        {fact.claim}
      </blockquote>

      {fact.skillTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {fact.skillTags.map((tag) => (
            <span key={tag} className="rounded-full border border-line bg-paper/60 px-2.5 py-1 text-[9.5px] font-medium text-ink-muted">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5">
        {fact.evidenceUrl ? (
          <EvidenceLink
            factId={fact.id}
            evidenceUrl={fact.evidenceUrl}
            initialStatus={fact.linkStatus?.status ?? null}
            initialCheckedAt={fact.linkStatus?.checkedAt ?? null}
          />
        ) : (
          <p className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-2.5 py-1 text-[10px] text-ink-faint">
            <Link2Off className="h-3 w-3" /> No evidence link attached — optional
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-2 border-t border-line pt-3.5">
        <ProvenanceBadge provenance={fact.provenance} />
        <span className="text-[10px] leading-4 text-ink-faint">
          {confirmed
            ? "Simulated confirmation from " + (fact.confirmedByEmployerName ?? "an employer") + " in the demo dataset — not a real check."
            : "Supplied by the candidate. The app does not verify it."}
        </span>
      </div>
    </article>
  );
}
