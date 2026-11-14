"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Note } from "@/components/brand/note";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { signalStatusLabel } from "@/lib/ui-copy";
import type { EmployerFeed, EmployerFeedCard, RoleDetail } from "@/lib/repo";

function difficultyLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function evidenceLine(card: EmployerFeedCard) {
  if (!card.evidence) return "No assessment evidence yet";
  return card.evidence.assessment.family + " " + card.evidence.assessment.version + " · " + difficultyLabel(card.evidence.assessment.difficulty) + " · " + card.evidence.score + "/100 · bar " + card.evidence.requiredScore;
}

export function DiscoveryLane({
  feed,
  activeRole,
}: {
  feed: EmployerFeed;
  activeRole: RoleDetail;
}) {
  const router = useRouter();
  const [inviteTarget, setInviteTarget] = useState<EmployerFeedCard | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function openInvite(card: EmployerFeedCard) {
    setInviteTarget(card);
    const assessment = card.evidence?.assessment;
    setMessage(
      assessment
        ? "Your " + assessment.family + " " + assessment.version + " result is strong, and your experience matches what this role needs. Would you consider taking a look?"
        : "Your profile matches what this role needs. Would you consider taking a look?",
    );
  }

  async function send() {
    if (!inviteTarget || busy) return;
    if (message.trim().length < 1) {
      toast.error("Add a short message.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roleId: activeRole.id,
          candidateId: inviteTarget.candidate.id,
          message,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not send the invitation.");
        return;
      }
      toast.success("Invitation sent. It is a message, not a match.");
      setInviteTarget(null);
      router.refresh();
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const hasAny = feed.main.length + feed.belowBar.length + feed.notEvidenced.length > 0;

  return (
    <div className="mx-auto max-w-4xl" data-testid="discovery-lane">
      {!hasAny ? (
        <div className="rounded-[22px] border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Discovery lane</p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-ink-muted">
            No opted-in candidates are waiting for an invitation on this role. Candidates can still appear through the
            mixed feed.
          </p>
        </div>
      ) : (
        <>
          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-sans text-[18px] font-semibold leading-tight text-ink">Relevant non-swipers</h2>
              <p className="text-[11px] text-ink-faint">{feed.main.length} waiting</p>
            </div>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">Opted in, not yet swiped on this role.</p>
            <div className="mt-4 divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
              {feed.main.map((card) => (
                <div key={card.candidate.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-ink">{card.candidate.name}</p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">{card.candidate.headline}</p>
                    <p className="mt-2 text-[12px] leading-5 text-ink-soft">{evidenceLine(card)}</p>
                    {card.signals.length ? (
                      <p className="mt-1 text-[11px] leading-5 text-ink-faint">
                        {card.signals.map((signal) => signal.signal.label + ": " + signalStatusLabel(signal.status)).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Link href={"/candidates/" + card.candidate.id} className="text-[11px] font-medium text-ink-muted">Profile</Link>
                    <Button variant="secondary" size="sm" onClick={() => openInvite(card)} data-testid="open-invite">
                      <MessageCircle className="h-3.5 w-3.5" /> Invite
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {feed.belowBar.length ? (
            <section className="mt-6 rounded-[20px] border border-line bg-surface p-5">
              <p className="text-[13px] font-semibold text-ink">Below your stated bar</p>
              <p className="mt-1 text-[12px] leading-5 text-ink-muted">
                These candidates are not invited automatically. They stay visible for human review, with their evidence.
              </p>
              <div className="mt-3 divide-y divide-line border-t border-line">
                {feed.belowBar.map((card) => (
                  <div key={card.candidate.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <p className="text-[12px] text-ink">{card.candidate.name}</p>
                    <p className="text-[11px] text-ink-muted">{evidenceLine(card)}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {feed.notEvidenced.length ? (
            <section className="mt-6 rounded-[20px] border border-line bg-surface p-5">
              <p className="text-[13px] font-semibold text-ink">No assessment yet</p>
              <p className="mt-1 text-[12px] leading-5 text-ink-muted">Not a failure. They can still be reviewed through the mixed feed.</p>
              <div className="mt-3 divide-y divide-line border-t border-line">
                {feed.notEvidenced.map((card) => (
                  <div key={card.candidate.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <p className="text-[12px] text-ink">{card.candidate.name}</p>
                    <p className="text-[11px] text-ink-muted">{card.candidate.headline}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {inviteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4" role="dialog" aria-modal="true" data-testid="invite-dialog">
          <div className="w-full max-w-lg rounded-[22px] border border-line bg-surface p-5 shadow-lift sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Invite to look</p>
            <h2 className="mt-2 font-sans text-[22px] font-semibold leading-tight">{inviteTarget.candidate.name}</h2>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">
              {evidenceLine(inviteTarget)}
            </p>
            <Note className="mt-3 py-2">A message only. It does not create an application, booking or match.</Note>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 400))}
              className="mt-4 min-h-[100px]"
              maxLength={400}
              data-testid="invite-message"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setInviteTarget(null)} disabled={busy}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => void send()} disabled={busy} data-testid="send-invitation">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send invitation
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}