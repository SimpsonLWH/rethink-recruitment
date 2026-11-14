import { Link2, Link2Off, BadgeCheck, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LINK_STATUS_LABEL, PROVENANCE_LABEL } from "@/lib/evidence";

export { LINK_STATUS_LABEL, PROVENANCE_LABEL };

export function LinkStatusBadge({
  status,
  checkedAt,
  className,
  showIcon = true,
}: {
  status?: "WORKS" | "UNREACHABLE" | null;
  checkedAt?: Date | string | null;
  className?: string;
  showIcon?: boolean;
}) {
  if (!status) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-strong px-2.5 py-1 text-[11px] font-semibold text-ink-faint",
          className,
        )}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint" />
        Checking link…
      </span>
    );
  }

  const works = status === "WORKS";
  return (
    <span
      title={
        works
          ? "The server received a response from this URL. Reachability is not proof that the claim is true."
          : "The URL did not respond to a mechanical check. This says nothing about the person or the claim."
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        works
          ? "border-ink/15 bg-surface text-ink-soft"
          : "border-line-strong border-dashed bg-paper text-ink-muted",
        className,
      )}
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
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        confirmed
          ? "border-ink bg-ink text-paper"
          : "border-line-strong bg-surface text-ink-soft",
        className,
      )}
    >
      {confirmed ? (
        <BadgeCheck className="h-3 w-3" aria-hidden />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-ink-faint" />
      )}
      {confirmed ? PROVENANCE_LABEL.EMPLOYER_CONFIRMED : PROVENANCE_LABEL.SELF_CLAIMED}
      {confirmed && simulated && (
        <span className="ml-0.5 rounded-full bg-paper/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-paper">
          Sim
        </span>
      )}
    </span>
  );
}

export function EvidenceLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-paper/70 p-4 text-[12px] leading-5 text-ink-muted",
        className,
      )}
    >
      <p className="mb-2 flex items-center gap-1.5 font-semibold text-ink-soft">
        <Info className="h-3.5 w-3.5" aria-hidden /> Two separate labels. Read them separately.
      </p>
      <p>
        <strong className="text-ink-soft">Link status</strong> is mechanical: it only says whether the URL
        answered. <strong className="text-ink-soft">Provenance</strong> says who stands behind the claim.
        &ldquo;Link works&rdquo; never means a claim is true. Employer confirmations in this demo are fictional
        seed data, not real checks.
      </p>
    </div>
  );
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
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
        live ? "border-moss/25 bg-moss/10 text-moss" : "border-line bg-paper text-ink-muted",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" aria-hidden />
      {live ? (engine.startsWith("gemini") ? "Gemini live" : "Nemotron live") : "Demo AI · local"}
    </span>
  );
}

export function SyntheticTag({
  className,
  children = "Simulated demo data",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-paper/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
