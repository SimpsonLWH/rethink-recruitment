"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronDown, CircleHelp, XCircle } from "lucide-react";
import type { AssessmentRequirementEvidence } from "@/lib/repo";
import { cn } from "@/lib/utils";

function difficultyLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

type EvidenceTone = "success" | "warning" | "error" | "neutral";

const TONE: Record<EvidenceTone, { box: string; badge: string; icon: string; label: string }> = {
  success: {
    box: "border-emerald-300/70 bg-emerald-50/70 hover:border-emerald-400",
    badge: "bg-emerald-100 text-emerald-800",
    icon: "text-emerald-700",
    label: "Met",
  },
  warning: {
    box: "border-amber-300/80 bg-amber-50/70 hover:border-amber-400",
    badge: "bg-amber-100 text-amber-900",
    icon: "text-amber-700",
    label: "Not taken",
  },
  error: {
    box: "border-rose-300/80 bg-rose-50/70 hover:border-rose-400",
    badge: "bg-rose-100 text-rose-900",
    icon: "text-rose-700",
    label: "Below bar",
  },
  neutral: {
    box: "border-line bg-paper hover:border-line-strong",
    badge: "bg-paper text-ink-muted",
    icon: "text-ink-faint",
    label: "No test",
  },
};

export function EvidenceStatus({
  requirements,
  className,
  align = "left",
}: {
  requirements: AssessmentRequirementEvidence[];
  className?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);

  const missing = requirements.filter((requirement) => requirement.score === null).length;
  const below = requirements.filter((requirement) => requirement.score !== null && !requirement.meets).length;
  const met = requirements.filter((requirement) => requirement.meets).length;

  const tone: EvidenceTone =
    requirements.length === 0 ? "neutral" : below > 0 ? "error" : missing > 0 ? "warning" : "success";
  const style = TONE[tone];
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? AlertTriangle : tone === "error" ? XCircle : CircleHelp;

  const primary = requirements[0];
  const headline = primary
    ? primary.assessment.family + " " + primary.assessment.version
    : "No assessment required";
  const summary =
    requirements.length === 0
      ? "This role does not state an assessment."
      : missing > 0
        ? missing + (missing === 1 ? " assessment to take" : " assessments to take")
        : below > 0
          ? met + " of " + requirements.length + " requirements met"
          : requirements.length === 1
            ? (primary.score ?? 0) + "/100, bar " + primary.requiredScore
            : requirements.length + " requirements met";

  return (
    <div className={cn("group relative z-20 inline-block max-w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        data-testid="evidence-status"
        className={cn(
          "flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-left transition",
          style.box,
        )}
      >
        <Icon className={cn("h-3.5 w-3.5 shrink-0", style.icon)} aria-hidden />
        <span className="min-w-0">
          <span className="block truncate text-[12px] font-medium text-ink">{headline}</span>
          <span className="block truncate text-[10px] text-ink-muted">{summary}</span>
        </span>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]", style.badge)}>
          {style.label}
        </span>
        <ChevronDown
          className={cn("h-3 w-3 shrink-0 text-ink-faint transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          "absolute top-full z-50 w-[min(340px,calc(100vw-2rem))] pt-2 transition",
          align === "right" ? "right-0" : "left-0",
          open
            ? "visible opacity-100"
            : "invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100",
        )}
      >
        <div className="rounded-xl border border-line bg-surface p-3 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-muted">Required evidence</p>
          <div className="mt-2 space-y-2">
            {requirements.length === 0 ? (
              <p className="text-[11px] leading-5 text-ink-muted">No assessment is listed for this role.</p>
            ) : (
              requirements.map((requirement) => {
                const state: EvidenceTone = requirement.meets ? "success" : requirement.score === null ? "warning" : "error";
                const rowStyle = TONE[state];
                return (
                  <div key={requirement.assessment.id} className="rounded-lg border border-line bg-paper p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-ink">
                          {requirement.assessment.family} {requirement.assessment.version} · {difficultyLabel(requirement.assessment.difficulty)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-ink-muted">
                          {requirement.score === null ? "Not taken" : requirement.score + "/100"} · needs {requirement.requiredScore}
                        </p>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em]", rowStyle.badge)}>
                        {rowStyle.label}
                      </span>
                    </div>
                    <Link
                      href={"/assessments/" + requirement.assessment.id}
                      className="mt-1.5 inline-flex text-[10px] font-medium text-accent underline decoration-accent/30 underline-offset-4"
                    >
                      {requirement.score === null ? "Take assessment" : "View result"}
                    </Link>
                  </div>
                );
              })
            )}
          </div>
          {requirements.length > 0 ? (
            <p className="mt-2 text-[10px] leading-4 text-ink-faint">Exact version only. No aggregate score.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
