"use client";

import Link from "next/link";
import { ExternalLink, Link2, Link2Off, ShieldCheck } from "lucide-react";
import { ProvenanceBadge } from "@/components/brand/evidence-badges";
import type { FactView } from "@/lib/repo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function EvidenceSheet({
  open,
  onOpenChange,
  title,
  facts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  facts: FactView[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="review-evidence-sheet">
        <DialogHeader>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Evidence behind this highlight</p>
          <DialogTitle className="mt-1 text-[28px]">{title}</DialogTitle>
          <DialogDescription>
            The exact source facts this module came from. Provenance and link status are separate labels.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {facts.map((fact) => (
            <article key={fact.id} className="rounded-xl border border-line bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">{fact.prompt}</p>
                <ProvenanceBadge provenance={fact.provenance} />
              </div>
              <p className="mt-2 text-[15px] leading-7 text-ink">{fact.claim}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-[12px] text-ink-muted">
                {fact.evidenceUrl ? (
                  <Link
                    href={fact.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-accent underline decoration-accent/30 underline-offset-4"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open evidence link
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-ink-faint">
                    <Link2Off className="h-3.5 w-3.5" /> No evidence link attached
                  </span>
                )}
                {fact.linkStatus ? (
                  <span className="inline-flex items-center gap-1.5">
                    {fact.linkStatus.status === "WORKS" ? <Link2 className="h-3.5 w-3.5" /> : <Link2Off className="h-3.5 w-3.5" />}
                    {fact.linkStatus.status === "WORKS" ? "Link works" : "Link unreachable"}
                  </span>
                ) : (
                  <span className="text-ink-faint">Link not checked</span>
                )}
                {fact.origin === "AI_EXTRACTED" && <span className="text-ink-faint">Extracted, self-claimed</span>}
              </div>
            </article>
          ))}
        </div>
        <p className="flex items-start gap-2 border-t border-line pt-3 text-[12px] leading-5 text-ink-faint">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          A working link only means the URL answered. It does not prove the claim. Employer confirmation in this demo is
          simulated seed data, not a real check.
        </p>
        <p className="text-[12px] text-ink-faint">
          <Link href="/how-it-works#evidence" className="font-medium text-ink underline decoration-line-strong underline-offset-4">
            How evidence works
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
