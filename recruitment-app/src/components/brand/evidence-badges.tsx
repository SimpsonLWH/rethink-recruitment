import { Link2, Link2Off, BadgeCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LINK_STATUS_LABEL, PROVENANCE_LABEL } from "@/lib/evidence";

export { LINK_STATUS_LABEL, PROVENANCE_LABEL };

/**
 * Small, inline evidence language. These are deliberately not pills: provenance
 * and link status belong next to the claim, at the same visual weight as a
 * source note, never as a stacked badge cluster.
 */
export function LinkStatusBadge({
  status,
  className,
  showIcon = true,
}: {
  status?: "WORKS" | "UNREACHABLE" | null;
  checkedAt?: Date | string | null;
  className?: string;
  showIcon?: boolean;
}) {
  if (!status) {
    return <span className={cn("text-[11px] text-ink-faint", className)}>Link status not checked</span>;
  }
  const works = status === "WORKS";
  return (
    <span
      title={
        works
          ? "The server received a response from this URL. Reachability is not proof that the claim is true."
          : "The URL did not respond to a mechanical check. This says nothing about the person or the claim."
      }
      className={cn("inline-flex items-center gap-1 text-[11px] text-ink-muted", className)}
    >
      {showIcon &&
        (works ? <Link2 className="h-3 w-3" aria-hidden /> : <Link2Off className="h-3 w-3" aria-hidden />)}
      {works ? LINK_STATUS_LABEL.WORKS : LINK_STATUS_LABEL.UNREACHABLE}
    </span>
  );
}

export function ProvenanceBadge({
  provenance,
  className,
  simulated = true,
}: {
  provenance: "SELF_CLAIMED" | "EMPLOYER_CONFIRMED";
  className?: string;
  simulated?: boolean;
}) {
  const confirmed = provenance === "EMPLOYER_CONFIRMED";
  return (
    <span
      title={
        confirmed
          ? "Simulated demo data: an employer confirmation stored in this fictional seed record. Rivet never performs real employment verification."
          : "Supplied by the candidate and not independently verified."
      }
      className={cn("inline-flex items-center gap-1 text-[11px] text-ink-muted", className)}
    >
      {confirmed ? (
        <BadgeCheck className="h-3 w-3" aria-hidden />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-ink-faint" aria-hidden />
      )}
      {confirmed ? PROVENANCE_LABEL.EMPLOYER_CONFIRMED : PROVENANCE_LABEL.SELF_CLAIMED}
      {confirmed && simulated && <span className="text-ink-faint">· demo</span>}
    </span>
  );
}

export function EvidenceLegend({ className }: { className?: string }) {
  return null;
}

export function EngineBadge({
  engine,
  className,
}: {
  engine?: string | null;
  className?: string;
}) {
  if (!engine) return null;
  const live = engine.startsWith("nemotron") || engine.startsWith("gemini");
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] text-ink-muted", className)}>
      <Sparkles className="h-3 w-3" aria-hidden />
      {live ? (engine.startsWith("gemini") ? "Gemini" : "Nemotron") : "Demo mode · local"}
    </span>
  );
}

export function SyntheticTag({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return null;
}