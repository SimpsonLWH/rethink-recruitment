"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronDown, CircleHelp, XCircle } from "lucide-react";
import type { AssessmentRequirementEvidence } from "@/lib/repo";
import { cn } from "@/lib/utils";

function difficultyLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

type EvidenceTone = "success" | "warning" | "error" | "neutral";

const TONE: Record<EvidenceTone, { box: string; badge: string; icon: string; label: string; rowLabel: string }> = {
  success: {
    box: "border-emerald-300/70 bg-emerald-50/70 hover:border-emerald-400",
    badge: "bg-emerald-100 text-emerald-800",
    icon: "text-emerald-700",
    label: "Met",
    rowLabel: "Meets the bar",
  },
  warning: {
    box: "border-amber-300/80 bg-amber-50/70 hover:border-amber-400",
    badge: "bg-amber-100 text-amber-900",
    icon: "text-amber-700",
    label: "Not taken",
    rowLabel: "Not taken yet",
  },
  error: {
    box: "border-rose-300/80 bg-rose-50/70 hover:border-rose-400",
    badge: "bg-rose-100 text-rose-900",
    icon: "text-rose-700",
    label: "Below bar",
    rowLabel: "Below the bar",
  },
  neutral: {
    box: "border-line bg-paper hover:border-line-strong",
    badge: "bg-paper text-ink-muted",
    icon: "text-ink-faint",
    label: "No test",
    rowLabel: "No assessment",
  },
};

type Placement = { left: number; top: number; width: number };

function toneFor(requirement: AssessmentRequirementEvidence): EvidenceTone {
  if (requirement.meets) return "success";
  return requirement.score === null ? "warning" : "error";
}

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
  const [preview, setPreview] = useState(false);
  const [inline, setInline] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();
  const headingId = useId();
  const show = open || preview;

  const missing = requirements.filter((requirement) => requirement.score === null).length;
  const below = requirements.filter((requirement) => requirement.score !== null && !requirement.meets).length;

  const tone: EvidenceTone =
    requirements.length === 0 ? "neutral" : below > 0 ? "error" : missing > 0 ? "warning" : "success";
  const style = TONE[tone];
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? AlertTriangle : tone === "error" ? XCircle : CircleHelp;

  const primary = requirements[0];
  const headline = primary ? primary.assessment.family + " " + primary.assessment.version : "No assessment required";
  const summary =
    requirements.length === 0
      ? "No assessment stated"
      : missing > 0
        ? missing + (missing === 1 ? " assessment not taken" : " assessments not taken")
        : below > 0
          ? below + " below the bar"
          : requirements.length === 1
            ? (primary.score ?? 0) + "/100, bar " + primary.requiredScore
            : "All " + requirements.length + " requirements met";

  const focusPanel = useCallback(() => {
    window.requestAnimationFrame(() => panelRef.current?.focus());
  }, []);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    setPreview(false);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    setMounted(true);
    const query = window.matchMedia("(min-width: 640px)");
    const sync = () => {
      setInline(!query.matches);
      if (!query.matches) setPreview(false);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;
    const margin = 12;
    const gap = 8;
    const width = Math.min(340, window.innerWidth - margin * 2);
    const height = panel.offsetHeight;
    const rect = trigger.getBoundingClientRect();
    let left = align === "right" ? rect.right - width : rect.left;
    left = Math.min(Math.max(margin, left), window.innerWidth - margin - width);
    let top = rect.bottom + gap;
    if (top + height > window.innerHeight - margin) {
      const above = rect.top - gap - height;
      top = above >= margin ? above : Math.max(margin, window.innerHeight - margin - height);
    }
    setPlacement({ left, top, width });
  }, [align]);

  useLayoutEffect(() => {
    if (!show || inline) {
      setPlacement(null);
      return;
    }
    place();
    const frame = window.requestAnimationFrame(place);
    const onViewportChange = () => place();
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [show, inline, place]);

  useEffect(() => {
    if (open && (inline || placement)) focusPanel();
  }, [open, inline, placement, focusPanel]);

  useEffect(() => {
    if (!show) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Only close this layer. Never swallow Escape: a dialog opened above the
      // popover must still receive it.
      close(open);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [show, open, close]);

  useEffect(() => {
    if (!show) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    };
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [show, close]);

  useEffect(() => {
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, []);

  function handleTriggerClick() {
    setPreview(false);
    setOpen((value) => !value);
  }

  function schedulePreviewOff() {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setPreview(false), 120);
  }

  const panel = (
    <div
      ref={panelRef}
      id={panelId}
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      tabIndex={-1}
      data-testid="evidence-popover"
      className={cn(
        "rounded-xl border border-line bg-surface p-3.5 shadow-card outline-none",
        inline ? "mt-2 w-full" : "fixed z-40",
      )}
      style={
        inline
          ? undefined
          : {
              left: placement?.left,
              top: placement?.top,
              width: placement?.width ?? "min(340px, calc(100vw - 24px))",
              visibility: placement ? "visible" : "hidden",
            }
      }
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        }
      }}
      onMouseEnter={() => {
        if (previewTimer.current) clearTimeout(previewTimer.current);
      }}
      onMouseLeave={() => {
        if (!open) schedulePreviewOff();
      }}
    >
      <p id={headingId} className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-muted">
        Required evidence
      </p>
      {requirements.length === 0 ? (
        <p className="mt-2 text-[12px] leading-5 text-ink-muted">No assessment is listed for this role.</p>
      ) : (
        <div className="mt-2 divide-y divide-line">
          {requirements.map((requirement) => {
            const row = TONE[toneFor(requirement)];
            return (
              <div key={requirement.assessment.id} className="py-2 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-ink">
                      {requirement.assessment.family} {requirement.assessment.version}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-4 text-ink-muted">
                      {difficultyLabel(requirement.assessment.difficulty)} ·{" "}
                      {requirement.score === null ? "not taken" : requirement.score + "/100"} · team bar{" "}
                      {requirement.requiredScore}
                    </p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em]", row.badge)}>
                    {row.rowLabel}
                  </span>
                </div>
                <Link
                  href={"/assessments/" + requirement.assessment.id}
                  className="mt-1 inline-flex text-[11px] font-medium text-accent underline decoration-accent/30 underline-offset-4"
                >
                  {requirement.score === null ? "Take this assessment" : "View the result"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-2 text-[10px] leading-4 text-ink-faint">Exact assessment version. No aggregate score.</p>
    </div>
  );

  return (
    <div
      className={cn("relative z-20 max-w-full", inline ? "block" : "inline-block", className)}
      onBlurCapture={(event) => {
        if (!open) return;
        const next = event.relatedTarget as Node | null;
        if (next && (triggerRef.current?.contains(next) || panelRef.current?.contains(next))) return;
        close();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        aria-expanded={show}
        aria-haspopup="dialog"
        aria-controls={panelId}
        data-testid="evidence-status"
        className={cn("flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-left transition", style.box)}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse" && !inline && !open) setPreview(true);
        }}
        onPointerLeave={() => {
          if (!open) schedulePreviewOff();
        }}
      >
        <Icon className={cn("h-3.5 w-3.5 shrink-0", style.icon)} aria-hidden />
        <span className="min-w-0">
          <span className="block truncate text-[12px] font-medium text-ink">{headline}</span>
          <span className="block truncate text-[10px] text-ink-muted">{summary}</span>
        </span>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]", style.badge)}>
          {style.label}
        </span>
        <ChevronDown className={cn("h-3 w-3 shrink-0 text-ink-faint transition-transform", show && "rotate-180")} aria-hidden />
      </button>

      {inline
        ? show
          ? panel
          : null
        : mounted && show
          ? createPortal(panel, document.body)
          : null}
    </div>
  );
}