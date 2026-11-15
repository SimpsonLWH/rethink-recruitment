"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-start justify-center py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Something went wrong</p>
      <h1 className="mt-4 font-display text-[42px] leading-none tracking-[-0.04em]">This view did not load.</h1>
      <p className="mt-4 text-[15px] leading-7 text-ink-muted">
        The demo state is still in the database. Try the view again, or return to discovery and reseed later if needed.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => reset()}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
        <Link href="/discover" className={buttonVariants({ variant: "secondary", size: "md" })}>
          Back to discovery
        </Link>
      </div>
    </div>
  );
}
