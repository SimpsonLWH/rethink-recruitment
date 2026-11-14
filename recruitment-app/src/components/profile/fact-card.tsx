import { Link2Off } from "lucide-react";
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
  return (
    <article
      className={cn(
        "flex flex-col rounded-[20px] border border-line bg-surface p-6",
        featured && "sm:p-7",
        className,
      )}
      data-testid="fact-card"
    >
      <p className="text-[11px] font-semibold uppercase leading-5 tracking-[0.14em] text-ink-faint">{fact.prompt}</p>

      <blockquote
        className={cn(
          "mt-3 leading-7 text-ink",
          featured ? "text-[17px]" : "text-[16px]",
        )}
      >
        {fact.claim}
      </blockquote>

      {fact.skillTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {fact.skillTags.map((tag) => (
            <span key={tag} className="rounded-full border border-line px-2.5 py-1 text-[11px] leading-4 text-ink-muted">
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
          <p className="inline-flex items-center gap-1.5 text-[11px] leading-5 text-ink-faint">
            <Link2Off className="h-3.5 w-3.5 shrink-0" aria-hidden /> No evidence link attached — optional.
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-line pt-3 text-[11px] leading-5 text-ink-faint">
        <ProvenanceBadge provenance={fact.provenance} />
      </div>
    </article>
  );
}
