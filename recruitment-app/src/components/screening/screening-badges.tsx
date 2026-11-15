import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClaimCheckStatus, EffectiveClaimStatus, EvidenceState, ScreeningCriterionStatus, ScreeningRunStatus } from "@/lib/screening";

const tone = {
  positive: "border-accent/25 bg-accent-tint text-accent-deep",
  caution: "border-amber-300/70 bg-amber-50 text-amber-800",
  negative: "border-rose-300/70 bg-rose-50 text-rose-800",
  neutral: "border-line bg-paper text-ink-muted",
} as const;

export function EvidenceStateBadge({ state, className }: { state: EvidenceState; className?: string }) {
  const label = state === "ENOUGH_TO_DISCUSS" ? "Ready to discuss" : state === "OPEN_ITEMS" ? "Open items" : "Thin evidence";
  const variant = state === "ENOUGH_TO_DISCUSS" ? tone.positive : state === "OPEN_ITEMS" ? tone.caution : tone.neutral;
  return <Badge className={cn(variant, className)}>{label}</Badge>;
}

export function RunStatusBadge({ status, className }: { status: ScreeningRunStatus; className?: string }) {
  const label = status === "OPEN" ? "In review" : status === "ADVANCE" ? "Moved to interview" : status === "HOLD" ? "On hold" : "Not moving forward";
  const variant = status === "ADVANCE" ? tone.positive : status === "HOLD" ? tone.caution : status === "DECLINE" ? tone.negative : tone.neutral;
  return <Badge className={cn(variant, className)}>{label}</Badge>;
}

export function CriterionStatusBadge({ status, className }: { status: ScreeningCriterionStatus; className?: string }) {
  const label =
    status === "MET" ? "Evidenced" : status === "PARTLY" ? "Partly" : status === "NOT_MET" ? "Below bar" : status === "OPEN" ? "Opening" : "Not assessed";
  const variant = status === "MET" ? tone.positive : status === "PARTLY" || status === "OPEN" ? tone.caution : status === "NOT_MET" ? tone.negative : tone.neutral;
  return <Badge className={cn(variant, className)}>{label}</Badge>;
}

export function ClaimStatusBadge({ status, className }: { status: EffectiveClaimStatus; className?: string }) {
  const label =
    status === "VERIFIED"
      ? "Checked"
      : status === "LINK_ONLY"
        ? "Artifact only"
        : status === "NEEDS_CONVERSATION"
          ? "For conversation"
          : status === "NOT_CHECKABLE"
            ? "Not checkable"
            : status === "CONTEXT"
              ? "Context"
              : "Still prose";
  const variant =
    status === "VERIFIED" ? tone.positive : status === "LINK_ONLY" || status === "NEEDS_CONVERSATION" ? tone.caution : tone.neutral;
  return <Badge className={cn(variant, className)}>{label}</Badge>;
}

export function ClaimCheckStatusLabel({ status }: { status: ClaimCheckStatus }) {
  return <>{status === "VERIFIED" ? "Checked" : status === "LINK_ONLY" ? "Artifact only" : status === "NEEDS_CONVERSATION" ? "For conversation" : "Not checkable"}</>;
}

export function CriterionKindBadge({ kind, className }: { kind: "MUST_HAVE" | "NICE_TO_HAVE" | "CONVERSATION"; className?: string }) {
  return (
    <span className={cn("text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint", className)}>
      {kind === "MUST_HAVE" ? "Must have" : kind === "NICE_TO_HAVE" ? "Nice to have" : "In conversation"}
    </span>
  );
}
