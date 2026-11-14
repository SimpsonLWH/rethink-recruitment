"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmAction = "PASS" | "LIKE" | "PRIORITY_INTRO";

/**
 * Confirm keys stay inert for a beat after the dialog opens. A held key
 * auto-repeats and a fast double tap lands inside ~100ms; either would confirm
 * before the card has been read. Anything slower is a deliberate second press.
 */
const ARM_MS = 250;

const COPY: Record<
  ConfirmAction,
  { title: string; body: string; confirm: string; arrow?: { key: string; glyph: string } }
> = {
  PASS: {
    title: "Pass on this card?",
    body: "This records a no. It does not affect your other roles or any ranking.",
    confirm: "Confirm pass",
    arrow: { key: "ArrowLeft", glyph: "←" },
  },
  LIKE: {
    title: "Like this card?",
    body: "This records a yes on your side. A match still needs the other side to say yes.",
    confirm: "Confirm like",
    arrow: { key: "ArrowRight", glyph: "→" },
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
  const contentRef = useRef<HTMLDivElement>(null);
  const armedAt = useRef(0);

  useEffect(() => {
    if (open) armedAt.current = Date.now() + ARM_MS;
  }, [open, action]);

  if (!open || !action) return null;
  const copy = COPY[action];

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key !== "Enter" && event.key !== copy.arrow?.key) return;
    // A focused control keeps its own Enter behaviour, so Cancel stays Cancel.
    if (event.key === "Enter" && (event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    if (event.repeat || Date.now() < armedAt.current || busy) return;
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent
        ref={contentRef}
        tabIndex={-1}
        className="max-w-sm rounded-[22px] p-5 sm:p-5"
        data-testid="shortcut-confirm"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          contentRef.current?.focus();
        }}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Keyboard action</p>
            <DialogTitle className="mt-1.5 text-[18px] font-semibold leading-6 text-ink">{copy.title}</DialogTitle>
          </div>
          <DialogClose className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-ink/[0.06] hover:text-ink">
            <X className="h-4 w-4" />
            <span className="sr-only">Cancel</span>
          </DialogClose>
        </div>

        <DialogDescription className="mt-2 text-[13px] leading-6 text-ink-muted">
          {displayName}. {copy.body}
        </DialogDescription>

        <p
          className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-ink-muted"
          data-testid="shortcut-confirm-hint"
        >
          {copy.arrow ? (
            <>
              <kbd className="kbd">{copy.arrow.glyph}</kbd>
              <span>again or</span>
            </>
          ) : null}
          <kbd className="kbd">Enter</kbd>
          <span>to confirm</span>
          <span aria-hidden="true" className="text-line-strong">
            ·
          </span>
          <kbd className="kbd">Esc</kbd>
          <span>to cancel</span>
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} disabled={busy} data-testid="shortcut-confirm-yes">
            {busy ? "Saving…" : copy.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
