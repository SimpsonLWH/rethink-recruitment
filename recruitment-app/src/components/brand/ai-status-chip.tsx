"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiStatusSummary } from "@/lib/ai/status-types";

export function AiStatusChip({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<AiStatusSummary | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/ai/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as AiStatusSummary;
        if (alive) setStatus(data);
      } catch {
        // Keyless demo is the expected state; keep the quiet fallback label.
      }
    };
    void load();
    const onAiRun = () => void load();
    window.addEventListener("rivet:ai-run", onAiRun);
    return () => {
      alive = false;
      window.removeEventListener("rivet:ai-run", onAiRun);
    };
  }, []);

  const live = status?.mode === "LIVE_NEMOTRON" || status?.mode === "LIVE_GEMINI";
  const label = live
    ? status.mode === "LIVE_GEMINI"
      ? "AI: live (Gemini)"
      : "AI: live (Nemotron)"
    : "AI: demo fallback";

  return (
    <Link
      href="/about-ai"
      title={
        live
          ? "The last generation used a live hosted model. This label changes to demo fallback if a call fails or is not configured."
          : "No live AI call has succeeded. Deterministic local logic is powering every AI surface. See About the AI."
      }
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] transition",
        live
          ? "border-moss/25 bg-moss/10 text-moss hover:bg-moss/15"
          : "border-line bg-paper/80 text-ink-muted hover:border-line-strong hover:text-ink-soft",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          live ? "bg-moss" : "bg-rose/70",
        )}
        aria-hidden
      />
      <Sparkles className="h-3 w-3" aria-hidden />
      {compact ? (live ? "Live AI" : "Demo AI") : label}
    </Link>
  );
}
