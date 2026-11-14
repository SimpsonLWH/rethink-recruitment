"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function MatchDialog({
  open,
  onOpenChange,
  personaName,
  matchName,
  matchSubtitle,
  matchId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personaName: string;
  matchName: string;
  matchSubtitle: string;
  matchId: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center" data-testid="match-dialog">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white">
          <Check className="h-6 w-6" />
        </div>
        <DialogHeader className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Mutual yes</p>
          <DialogTitle className="mt-2 text-[34px]">It&apos;s a match.</DialogTitle>
          <DialogDescription>
            {personaName} and {matchName} both said yes to {matchSubtitle || "the role"}. Neither side was ranked or
            auto-screened into it.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border border-line bg-paper px-4 py-3 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Next</p>
          <p className="mt-1 text-[14px] leading-6 text-ink-soft">Start with one specific question. No cover letter required.</p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Keep reviewing
          </Button>
          {matchId && (
            <Link
              href={"/matches/" + matchId}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white transition hover:bg-accent-deep"
              onClick={() => onOpenChange(false)}
            >
              Open conversation <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
