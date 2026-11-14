"use client";

import { Check, X } from "lucide-react";
import { PRIORITY_INTRO, PriorityIntroIcon } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function DecisionActions({
  displayName,
  remaining,
  likesRemaining,
  busy,
  onPass,
  onLike,
  onPriorityIntro,
  className,
}: {
  displayName: string;
  remaining: number;
  likesRemaining?: number;
  busy: boolean;
  onPass: () => void;
  onLike: () => void;
  onPriorityIntro: () => void;
  className?: string;
}) {
  const likes = likesRemaining ?? 0;
  const likeDisabled = busy || likes <= 0;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(4.35rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-paper/95 px-4 py-2.5 backdrop-blur-md lg:bottom-0 lg:left-[248px] lg:px-8",
        className,
      )}
      aria-label="Decision controls"
      data-testid="review-actions"
    >
      <div className="mx-auto flex max-w-[760px] items-stretch gap-2 lg:items-center lg:justify-center lg:gap-2.5">
        <button
          type="button"
          onClick={onPass}
          disabled={busy}
          aria-label={"Pass on " + displayName}
          aria-keyshortcuts="ArrowLeft"
          data-testid="discover-pass"
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 text-ink-muted transition hover:border-ink hover:text-ink disabled:opacity-40 lg:w-auto lg:flex-none"
        >
          <X className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium">Pass</span>
        </button>
        <button
          type="button"
          onClick={onLike}
          disabled={likeDisabled}
          aria-label={"Like " + displayName}
          aria-keyshortcuts="ArrowRight"
          data-testid="discover-yes"
          className="flex h-10 flex-[1.25] items-center justify-center gap-1.5 rounded-full border border-accent bg-accent px-3 text-white transition hover:bg-accent-deep disabled:opacity-40 lg:w-auto lg:flex-none lg:px-5"
        >
          <Check className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold">Like</span>
          <span className="text-[10px] font-medium text-paper/70">{likes} left</span>
        </button>
        <button
          type="button"
          onClick={onPriorityIntro}
          disabled={busy || remaining <= 0}
          aria-label={"Send a " + PRIORITY_INTRO.name + " to " + displayName}
          aria-keyshortcuts="P"
          data-testid="discover-priority-intro"
          className="flex h-10 flex-[1.35] items-center justify-center gap-1.5 rounded-full border border-accent/35 bg-accent-tint px-2 text-accent-deep transition hover:border-accent hover:bg-accent-soft disabled:opacity-40 lg:w-auto lg:flex-none lg:px-4"
        >
          <PriorityIntroIcon className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap text-[11px] font-semibold">
            <span className="lg:hidden">Priority</span>
            <span className="hidden lg:inline">{PRIORITY_INTRO.name}</span>
          </span>
          <span className="whitespace-nowrap text-[10px] font-medium text-accent">{remaining} left</span>
        </button>
        <span className="hidden shrink-0 pl-2 text-[10px] text-ink-faint lg:block">
          <kbd className="rounded border border-line bg-surface px-1 py-0.5 font-mono">←</kbd> pass{" "}
          <kbd className="ml-2 rounded border border-line bg-surface px-1 py-0.5 font-mono">→</kbd> like{" "}
          <kbd className="ml-2 rounded border border-line bg-surface px-1 py-0.5 font-mono">P</kbd> priority
        </span>
      </div>
    </div>
  );
}