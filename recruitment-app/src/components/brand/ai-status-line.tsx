"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiStatusSummary } from "@/lib/ai/status-types";

export function AiStatusLine({
  initial,
  className,
  showLink = true,
}: {
  initial?: AiStatusSummary | null;
  className?: string;
  showLink?: boolean;
}) {
  const [status, setStatus] = useState<AiStatusSummary | null>(initial ?? null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch("/api/ai/status", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as AiStatusSummary;
        if (alive) setStatus(data);
      } catch {
        // The keyless fallback line is the correct quiet default.
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

  const label = status?.label ?? "AI features: demo mode";

  return (
    <p className={cn("flex flex-wrap items-center gap-x-1.5 text-[12px] leading-5 text-ink-faint", className)}>
      <span>Demo data</span>
      <span aria-hidden>·</span>
      <span>{label}</span>
      {showLink && (
        <>
          <span aria-hidden>·</span>
          <Link
            href="/how-it-works#ai"
            className="inline-flex items-center gap-1 font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink"
          >
            <Info className="h-3 w-3" aria-hidden />
            How Rivet works
          </Link>
        </>
      )}
    </p>
  );
}