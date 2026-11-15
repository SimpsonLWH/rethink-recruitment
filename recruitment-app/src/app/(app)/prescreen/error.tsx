"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function PrescreenError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl animate-fade-up py-10" data-testid="prescreen-error">
      <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/70 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </span>
        <h1 className="mt-4 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink">The pre-screen did not load.</h1>
        <p className="mt-2 text-[13px] leading-6 text-ink-muted">
          No decision was recorded by this screen. You can try the record again, or return to the queues. If the problem
          continues, the demo database may not be seeded.
        </p>
        {process.env.NODE_ENV === "development" ? (
          <pre className="mt-4 overflow-x-auto rounded-md border border-line bg-paper p-3 text-[11px] leading-5 text-ink-muted">
            {error.message}
          </pre>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-4 text-[12px] font-medium text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Try again
          </button>
          <Link href="/prescreen" className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line bg-surface px-4 text-[12px] font-medium text-ink">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to queues
          </Link>
        </div>
      </div>
    </div>
  );
}
