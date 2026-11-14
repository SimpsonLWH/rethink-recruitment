"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/brand/avatar";
import type { PriorityIntroInboxItem } from "@/lib/repo";
import { formatRelativeTime } from "@/lib/utils";

export function PriorityIntroInboxList({
  items,
  side,
}: {
  items: PriorityIntroInboxItem[];
  side: "candidate" | "employer";
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function matchBack(item: PriorityIntroInboxItem) {
    if (busyId) return;
    setBusyId(item.id);
    try {
      const response = await fetch("/api/priority-intros/" + item.id + "/accept", {
        method: "POST",
      });
      const data = (await response.json()) as { matched?: boolean; matchId?: string; error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not record that. Try again.");
        return;
      }
      if (data.matched && data.matchId) {
        toast.success("It's mutual.");
        router.push("/matches/" + data.matchId);
      } else {
        toast.success("Yes sent. A match needs both sides.");
      }
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const candidateViewer = side === "candidate";
        const passed = item.recipientAction === "PASS";
        const alreadyYes = item.recipientAction === "LIKE" || item.recipientAction === "PRIORITY_INTRO";
        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-[22px] border border-line bg-surface"
            data-testid="priority-intro-inbox-item"
          >
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {candidateViewer ? (
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-ink/10 bg-paper font-display text-[15px] font-semibold text-ink-soft">
                      {item.employer.logoMark}
                    </span>
                  ) : (
                    <Avatar name={item.candidate.name} monogram={item.candidate.monogram} palette={item.candidate.palette} size="md" />
                  )}
                  <div>
                    <p className="font-sans text-[20px] font-semibold leading-tight tracking-[-0.02em]">
                      {candidateViewer ? item.employer.name : item.candidate.name}
                    </p>
                    <p className="mt-1 text-[13px] text-ink-muted">
                      {candidateViewer ? item.role.title : item.candidate.headline}
                    </p>
                    <p className="mt-1 text-[12px] text-ink-faint">
                      {candidateViewer ? "Team" : "Candidate"} · {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <blockquote className="mt-4 border-l-2 border-accent/40 pl-4 text-[16px] leading-[1.6] text-ink sm:text-[18px]">
                “{item.reason}”
              </blockquote>

            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper/50 px-5 py-3.5 sm:px-7">
              <Link
                href={candidateViewer ? "/roles/" + item.role.id : "/candidates/" + item.candidate.id}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
              >
                View {candidateViewer ? "role & team" : "full profile"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              {item.matched ? (
                <Link
                  href={item.matchId ? "/matches/" + item.matchId : "/matches"}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[12px] font-medium text-paper"
                >
                  Matched. Open conversation <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : passed ? (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
                  <X className="h-3 w-3" /> You passed on this role
                </span>
              ) : alreadyYes ? (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent">
                  <Check className="h-3 w-3" /> You already said yes
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void matchBack(item)}
                  disabled={busyId === item.id}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white transition hover:bg-accent-deep disabled:opacity-50"
                  data-testid="priority-intro-match-back"
                >
                  {busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Say yes to match
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}