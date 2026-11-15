"use client";

import { Printer } from "lucide-react";

export function PrintPacketButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-[11px] font-medium text-ink-muted transition hover:border-line-strong hover:text-ink print:hidden"
    >
      <Printer className="h-3.5 w-3.5" aria-hidden /> Print packet
    </button>
  );
}
