"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

export function ScreeningNoteForm({ roleId, candidateId }: { roleId: string; candidateId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/screening/" + roleId + "/" + candidateId, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "note", body }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not save the note.");
      setBody("");
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the note.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-[12px] font-medium text-ink transition hover:border-line-strong"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden /> Add a note
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-line bg-paper p-3">
      <label htmlFor="screening-note" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        Note for the record
      </label>
      <textarea
        id="screening-note"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        maxLength={2000}
        autoFocus
        placeholder="What did you see, and what still needs asking? Keep it evidence-based."
        className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-[13px] leading-6 text-ink outline-none focus:border-accent"
      />
      {error ? <p className="mt-1 text-[11px] text-rose-700" role="alert">{error}</p> : null}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="submit"
          disabled={busy || body.trim().length < 2}
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-3.5 text-[12px] font-medium text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null} Save note
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="inline-flex h-9 items-center rounded-md px-3 text-[12px] font-medium text-ink-muted hover:text-ink"
        >
          Cancel
        </button>
        <span className="ml-auto text-[10px] text-ink-faint">{body.length}/2000</span>
      </div>
    </form>
  );
}
