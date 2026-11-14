"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Flower2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/brand/avatar";
import type { RoseInboxItem } from "@/lib/repo";
import { cn, formatRelativeTime } from "@/lib/utils";

export function RoseInboxList({ items, side }: { items: RoseInboxItem[]; side: "candidate" | "employer" }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function matchBack(item: RoseInboxItem) {
    if (busyId) return;
    setBusyId(item.id);
    try {
      const response = await fetch("/api/decisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roleId: item.role.id,
          candidateId: item.candidate.id,
          action: "LIKE",
        }),
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
    <div className="space-y-3">
      {items.map((item) => {
        const candidateViewer = side === "candidate";
        const passed = item.recipientAction === "PASS";
        const alreadyYes = item.recipientAction === "LIKE" || item.recipientAction === "ROSE";
        return (
          <article key={item.id} className="overflow-hidden rounded-[26px] border border-line bg-surface" data-testid="rose-inbox-item">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  {candidateViewer ? (
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-ink/10 bg-[#EFE7DB] font-display text-[15px] font-semibold text-ink-soft">
                      {item.employer.logoMark}
                    </span>
                  ) : (
                    <Avatar name={item.candidate.name} monogram={item.candidate.monogram} palette={item.candidate.palette} size="md" />
                  )}
                  <div>
                    <p className="font-display text-[23px] leading-tight">
                      {candidateViewer ? item.employer.name : item.candidate.name}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-muted">
                      {candidateViewer ? item.role.title : item.candidate.headline}
                    </p>
                    <p className="mt-1 text-[10px] text-ink-faint">
                      {candidateViewer ? "Team" : "Candidate"} · sent {formatRelativeTime(item.createdAt)} · for {item.role.title}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose/20 bg-rose-tint px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rose-deep">
                  <Flower2 className="h-3 w-3" /> Rose
                </span>
              </div>

              <blockquote className="mt-5 border-l-2 border-rose/40 pl-4 font-display text-[22px] leading-[1.4] text-ink sm:text-[25px]">
                “{item.reason}”
              </blockquote>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-ink-faint">
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-moss" /> A rose also says yes</span>
                <span>They can only send 3 for the whole event.</span>
                <span>Never bought, never ranked.</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper/45 px-5 py-3.5 sm:px-6">
              <Link
                href={candidateViewer ? "/roles/" + item.role.id : "/candidates/" + item.candidate.id}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted transition hover:text-ink"
              >
                View {candidateViewer ? "role & team" : "full profile"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              {item.matched ? (
                <Link href={item.matchId ? "/matches/" + item.matchId : "/matches"} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[11px] font-semibold text-paper">
                  Matched — open conversation <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : passed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[10px] font-medium text-ink-muted">
                  <X className="h-3 w-3" /> You passed on this role
                </span>
              ) : alreadyYes ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-moss/20 bg-moss/10 px-3 py-1.5 text-[10px] font-semibold text-moss">
                  <Check className="h-3 w-3" /> You already said yes
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void matchBack(item)}
                  disabled={busyId === item.id}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full border border-rose bg-rose px-4 text-[11px] font-semibold text-white transition hover:bg-rose-deep disabled:opacity-50",
                  )}
                  data-testid="rose-match-back"
                >
                  {busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Say yes — make it mutual
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
