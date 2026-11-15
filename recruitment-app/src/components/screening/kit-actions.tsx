"use client";

import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";

export function KitActions({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copying" | "copied" | "error">("idle");

  async function copy() {
    setState("copying");
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      window.setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("error");
      window.setTimeout(() => setState("idle"), 2400);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-[11px] font-medium text-ink-muted transition hover:border-line-strong hover:text-ink sm:h-8"
      aria-live="polite"
    >
      {state === "copying" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : state === "copied" ? (
        <Check className="h-3.5 w-3.5 text-accent" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
      {state === "copied" ? "Copied" : state === "error" ? "Copy failed" : "Copy kit"}
    </button>
  );
}
