"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PRIORITY_INTRO, PriorityIntroIcon } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function PriorityIntroDialog({
  open,
  onOpenChange,
  recipientName,
  remaining,
  busy,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  remaining: number;
  busy: boolean;
  onSend: (reason: string) => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            <PriorityIntroIcon className="h-3.5 w-3.5" />
            {PRIORITY_INTRO.name} · {remaining} left
          </p>
          <DialogTitle className="mt-2">Send {recipientName} a Priority intro?</DialogTitle>
          <DialogDescription>{PRIORITY_INTRO.explainer} It also counts as a yes on your side.</DialogDescription>
        </DialogHeader>
        <label className="block">
          <span className="mb-2 block text-[12px] font-medium text-ink-soft">One line about why</span>
          <Textarea
            autoFocus
            value={reason}
            onChange={(event) => setReason(event.target.value.slice(0, 140))}
            placeholder="The detail that made you stop scrolling…"
            className="min-h-[110px] text-[14px]"
            data-testid="priority-intro-reason"
          />
          <span className="mt-2 flex justify-between text-[11px] text-ink-faint">
            <span>Visible to the recipient. Never used for ranking.</span>
            <span>{reason.length}/140</span>
          </span>
        </label>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="accent"
            disabled={busy || reason.trim().length === 0 || remaining <= 0}
            onClick={() => void onSend(reason.trim())}
            data-testid="priority-intro-send"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PriorityIntroIcon className="h-4 w-4" />}
            {busy ? "Sending…" : "Send " + PRIORITY_INTRO.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}