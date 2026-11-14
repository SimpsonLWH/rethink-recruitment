"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ProductError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface text-rose">
        <AlertCircle className="h-6 w-6" />
      </span>
      <h1 className="mt-6 font-display text-[34px] leading-tight">Something went off-script.</h1>
      <p className="mt-3 text-sm leading-6 text-ink-muted">
        The demo hit an unexpected error. If this is a fresh clone, run <code className="rounded bg-ink/5 px-1.5 py-0.5 text-[12px]">npm run seed</code> and try again.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
        <Button onClick={reset} variant="primary">
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
        <Link href="/enter" className={cn(buttonVariants({ variant: "secondary" }))}>
          <ArrowLeft className="h-4 w-4" /> Choose a persona
        </Link>
      </div>
    </div>
  );
}
