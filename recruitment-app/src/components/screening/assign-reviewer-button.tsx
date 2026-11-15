"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, UserRoundPlus } from "lucide-react";

export function AssignReviewerButton({
  roleId,
  candidateId,
  assignedName,
  myName,
}: {
  roleId: string;
  candidateId: string;
  assignedName: string | null;
  myName: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(assignedName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function assign() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/screening/" + roleId + "/" + candidateId, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "assign" }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not assign the reviewer.");
      setCurrent(myName);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not assign the reviewer.");
    } finally {
      setBusy(false);
    }
  }

  if (current === myName) {
    return (
      <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-accent-deep">
        <Check className="h-3 w-3" aria-hidden /> Assigned to you
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-[10.5px] text-ink-muted">{current ? "Assigned to " + current : "Unassigned"}</span>
      <button
        type="button"
        onClick={assign}
        disabled={busy}
        className="inline-flex h-8 items-center gap-1 rounded-md border border-line bg-surface px-2 text-[10.5px] font-medium text-ink-muted transition hover:border-line-strong hover:text-ink disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <UserRoundPlus className="h-3 w-3" aria-hidden />}
        Assign to me
      </button>
      {error ? <span className="text-[10px] text-rose-700" role="alert">{error}</span> : null}
    </span>
  );
}
