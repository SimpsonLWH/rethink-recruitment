import { Clock3, ShieldCheck, ShieldAlert, Lock } from "lucide-react";
import { integrityLine, type IntegritySummary, type ProctoringMode } from "@/lib/assessments";
import { cn } from "@/lib/utils";

export function proctoringLabel(mode: ProctoringMode) {
  if (mode === "LOCKDOWN") return "Browser lockdown";
  if (mode === "PROCTORED") return "Proctored";
  return "Open book";
}

/** Small mode chip for catalogue cards and detail pages. */
export function ProctoringChip({ mode, durationMinutes, className }: { mode: ProctoringMode; durationMinutes: number; className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {durationMinutes > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-soft">
          <Clock3 className="h-3 w-3" aria-hidden /> {durationMinutes} min
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-soft">
          <Clock3 className="h-3 w-3" aria-hidden /> Untimed
        </span>
      )}
      {mode !== "NONE" ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
            mode === "LOCKDOWN" ? "bg-navy text-white" : "border border-line bg-paper text-ink-soft",
          )}
        >
          {mode === "LOCKDOWN" ? <Lock className="h-3 w-3" aria-hidden /> : <ShieldCheck className="h-3 w-3" aria-hidden />}
          {proctoringLabel(mode)}
        </span>
      ) : null}
    </span>
  );
}

/**
 * One advisory line for a reviewer or the candidate. It describes how the
 * sitting went; it never changes the score and is not a cheating verdict.
 */
export function IntegrityNote({ integrity, className }: { integrity: IntegritySummary | null | undefined; className?: string }) {
  const line = integrityLine(integrity ?? null);
  if (!integrity || !line) return null;
  const flagged = Object.values(integrity.counts).some((count) => (count ?? 0) > 0) || integrity.overTime;
  const Icon = flagged ? ShieldAlert : ShieldCheck;
  return (
    <p
      className={cn(
        "inline-flex items-start gap-1.5 text-[11px] leading-5",
        flagged ? "text-amber-800" : "text-ink-muted",
        className,
      )}
      data-testid="integrity-note"
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{line}</span>
    </p>
  );
}
