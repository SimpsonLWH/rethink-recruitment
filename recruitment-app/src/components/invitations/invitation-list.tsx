"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { InvitationView } from "@/lib/repo";

function difficultyLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function InvitationList({ items, side }: { items: InvitationView[]; side: "candidate" | "employer" }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function respond(invitation: InvitationView, action: "ACCEPT" | "DECLINE") {
    if (busyId) return;
    setBusyId(invitation.id);
    try {
      const response = await fetch("/api/invitations/" + invitation.id + "/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as { matched?: boolean; matchId?: string | null; error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not respond.");
        return;
      }
      if (data.matched && data.matchId) {
        toast.success("It's mutual.");
        router.push("/matches/" + data.matchId);
        return;
      }
      toast.success(action === "ACCEPT" ? "Interest recorded. A match needs their yes too." : "Invitation declined.");
      router.refresh();
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function employerYes(invitation: InvitationView) {
    if (busyId) return;
    setBusyId(invitation.id);
    try {
      const response = await fetch("/api/invitations/" + invitation.id + "/employer-yes", { method: "POST" });
      const data = (await response.json()) as { matched?: boolean; matchId?: string | null; error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not record your yes.");
        return;
      }
      if (data.matched && data.matchId) {
        toast.success("It's mutual.");
        router.push("/matches/" + data.matchId);
        return;
      }
      toast.success("Yes recorded.");
      router.refresh();
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-line-strong bg-surface px-6 py-12 text-center" data-testid="invitations-empty">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">No invitations</p>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-ink-muted">
          Invitations are messages from a recruiter&apos;s discovery lane. They never create an application, a booking
          or a match by themselves.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="invitation-list">
      {items.map((invitation) => {
        const pending = invitation.status === "PENDING";
        return (
          <article key={invitation.id} className="overflow-hidden rounded-[22px] border border-line bg-surface">
            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-sans text-[20px] font-semibold leading-tight tracking-[-0.02em]">{invitation.role.title}</p>
                  <p className="mt-1 text-[13px] text-ink-muted">{invitation.employer.name} · {invitation.role.employer.contactName}</p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {side === "candidate" ? "Invited you to look" : "Invited " + invitation.candidate.name} · {new Date(invitation.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                  </p>
                </div>
                <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                  {invitation.status.toLowerCase()}
                </span>
              </div>

              <p className="mt-5 border-l-2 border-accent/40 pl-4 text-[15px] leading-7 text-ink-soft">“{invitation.message}”</p>

              {invitation.citedAssessment ? (
                <p className="mt-4 text-[12px] leading-5 text-ink-muted">
                  Cited evidence: {invitation.citedAssessment.assessment.family} {invitation.citedAssessment.assessment.version} ·{" "}
                  {difficultyLabel(invitation.citedAssessment.assessment.difficulty)} · {invitation.citedAssessment.score}/100 vs bar {invitation.citedAssessment.requiredScore}.
                </p>
              ) : null}

              <p className="mt-3 text-[11px] leading-5 text-ink-faint">
                An invitation is a message only. Accepting records your interest; it is not a match, application or booking.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper/50 px-5 py-3.5 sm:px-7">
              <Link href={"/roles/" + invitation.role.id} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted">
                Read the role <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              {invitation.matched && invitation.matchId ? (
                <Link href={"/matches/" + invitation.matchId} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[12px] font-medium text-paper">
                  Matched. Open conversation <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : side === "candidate" && pending ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void respond(invitation, "DECLINE")}
                    disabled={busyId === invitation.id}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[12px] font-medium text-ink-muted disabled:opacity-50"
                    data-testid="decline-invitation"
                  >
                    <X className="h-3.5 w-3.5" /> Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => void respond(invitation, "ACCEPT")}
                    disabled={busyId === invitation.id}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white disabled:opacity-50"
                    data-testid="accept-invitation"
                  >
                    {busyId === invitation.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Accept interest
                  </button>
                </div>
              ) : side === "employer" && invitation.canRespondAsEmployer ? (
                <button
                  type="button"
                  onClick={() => void employerYes(invitation)}
                  disabled={busyId === invitation.id}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white disabled:opacity-50"
                  data-testid="employer-yes-invitation"
                >
                  {busyId === invitation.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Say yes to match
                </button>
              ) : (
                <span className="text-[12px] text-ink-faint">
                  {invitation.status === "ACCEPTED" ? "Accepted. A match needs both sides." : "No action needed."}
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}