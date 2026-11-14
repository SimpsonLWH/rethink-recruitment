"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { availableStages, MATCH_STAGE_LABELS, type MatchStage } from "@/lib/stages";

export function MatchStageControl({ matchId, current }: { matchId: string; current: MatchStage }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const stages = availableStages(current);

  async function move(stage: MatchStage) {
    if (busy || stage === current) return;
    setBusy(true);
    try {
      const response = await fetch("/api/matches/" + matchId + "/stage", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not move that match.");
        return;
      }
      toast.success(stage === "CLOSED" ? "Match closed. An honest after-conversation update was sent." : "Stage updated.");
      router.refresh();
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3" data-testid="match-stage-control">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Next step</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {stages.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => void move(stage)}
            disabled={busy || stage === current}
            className={
              stage === current
                ? "rounded-full bg-ink px-3 py-1.5 text-[11px] font-medium text-paper"
                : "rounded-full border border-line px-3 py-1.5 text-[11px] font-medium text-ink-muted transition hover:border-line-strong hover:text-ink disabled:opacity-50"
            }
          >
            {busy ? <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> : null}
            {MATCH_STAGE_LABELS[stage]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-5 text-ink-faint">
        Closing sends an after-conversation update. It never claims a review that did not happen.
      </p>
    </div>
  );
}
