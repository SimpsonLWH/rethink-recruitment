"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmAction = "PASS" | "LIKE" | "PRIORITY_INTRO";

const COPY: Record<ConfirmAction, { title: string; body: string; confirm: string }> = {
  PASS: {
    title: "Pass on this card?",
    body: "This records a no. It does not affect your other roles or any ranking.",
    confirm: "Confirm pass",
  },
  LIKE: {
    title: "Like this card?",
    body: "This records a yes on your side. A match still needs the other side to say yes.",
    confirm: "Confirm like",
  },
  PRIORITY_INTRO: {
    title: "Send a Priority intro?",
    body: "This uses your one Priority intro for the event and records a yes on your side.",
    confirm: "Send intro",
  },
};

export function ShortcutConfirmDialog({
  open,
  action,
  displayName,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  action: ConfirmAction | null;
  displayName: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open || !action) return null;
  const copy = COPY[action];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 px-4" role="dialog" aria-modal="true" data-testid="shortcut-confirm">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Keyboard action</p>
            <h2 className="mt-1.5 text-[18px] font-semibold leading-6 text-ink">{copy.title}</h2>
          </div>
          <button type="button" onClick={onCancel} className="text-ink-faint hover:text-ink" aria-label="Cancel">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-[13px] leading-6 text-ink-muted">{displayName}. {copy.body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={onConfirm} disabled={busy} data-testid="shortcut-confirm-yes">
            {busy ? "Saving…" : copy.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
