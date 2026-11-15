"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Link2, Loader2, MessageCircle, MinusCircle } from "lucide-react";
import type { ClaimCheckStatus } from "@/lib/screening";
import { cn } from "@/lib/utils";

const options: Array<{ status: ClaimCheckStatus; label: string; short: string; icon: typeof Check }> = [
  { status: "VERIFIED", label: "I checked this against the artifact", short: "Checked", icon: Check },
  { status: "NEEDS_CONVERSATION", label: "Save this for the conversation", short: "For conversation", icon: MessageCircle },
  { status: "LINK_ONLY", label: "The artifact opens, but the claim is unchecked", short: "Artifact only", icon: Link2 },
  { status: "NOT_CHECKABLE", label: "This cannot be checked from the record", short: "Not checkable", icon: MinusCircle },
];

export function ClaimCheckControl({
  roleId,
  candidateId,
  factId,
  status,
  note,
}: {
  roleId: string;
  candidateId: string;
  factId: string;
  status: ClaimCheckStatus | "UNCHECKED";
  note: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<ClaimCheckStatus | "note" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState(note ?? "");

  async function save(nextStatus: ClaimCheckStatus, nextNote?: string | null, mode: "status" | "note" = "status") {
    setBusy(mode === "note" ? "note" : nextStatus);
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch("/api/screening/" + roleId + "/" + candidateId, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "claim",
          factId,
          status: nextStatus,
          ...(nextNote !== undefined ? { note: nextNote } : {}),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save the check.");
      setFeedback("Saved");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the check.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Check this claim">
        {options.map((option) => {
          const Icon = option.icon;
          const active = status === option.status;
          return (
            <button
              key={option.status}
              type="button"
              aria-pressed={active}
              title={option.label}
              disabled={busy !== null}
              onClick={() => save(option.status)}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition sm:h-8",
                active
                  ? "border-accent bg-accent-tint text-accent-deep"
                  : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink",
                busy !== null && "opacity-60",
              )}
            >
              {busy === option.status ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Icon className="h-3.5 w-3.5" aria-hidden />
              )}
              {option.short}
            </button>
          );
        })}
      </div>

      <details className="mt-2 group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-ink">
          {note ? "Edit check note" : "Add a check note"}
          <span className="text-ink-faint transition group-open:rotate-90" aria-hidden>›</span>
        </summary>
        <div className="mt-2">
          <label htmlFor={"claim-note-" + factId} className="sr-only">
            Note on this claim check
          </label>
          <textarea
            id={"claim-note-" + factId}
            value={draftNote}
            onChange={(event) => setDraftNote(event.target.value)}
            rows={2}
            maxLength={600}
            placeholder="What did you open or compare? Keep it factual."
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12px] leading-5 text-ink outline-none focus:border-accent"
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => save(status === "UNCHECKED" ? "NEEDS_CONVERSATION" : status, draftNote.trim() || null, "note")}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-[11px] font-medium text-white disabled:opacity-60"
            >
              {busy === "note" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
              Save note
            </button>
            <span className="text-[10px] text-ink-faint">
              {status === "UNCHECKED" ? "A note on an unchecked claim saves it for the conversation." : "The status saves separately from the note."}
            </span>
          </div>
        </div>
      </details>

      <p className="mt-1 min-h-4 text-[10px] text-ink-faint" aria-live="polite">
        {error ? <span className="text-rose-700">{error}</span> : feedback}
      </p>
    </div>
  );
}
