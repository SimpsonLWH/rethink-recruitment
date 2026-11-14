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
        "fixed inset-x-0 bottom-[calc(4.4rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-md lg:static lg:inset-auto lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none",
        className,
      )}
      aria-label="Decision controls"
      data-testid="review-actions"
    >
      <div className="mx-auto flex max-w-[720px] items-stretch gap-2.5 lg:items-center lg:justify-center lg:gap-3">
        <button
          type="button"
          onClick={onPass}
          disabled={busy}
          aria-label={"Pass on " + displayName}
          data-testid="discover-pass"
          className="flex h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border border-line-strong bg-surface text-ink-muted transition hover:border-ink hover:text-ink disabled:opacity-40 lg:mt-0 lg:h-11 lg:w-auto lg:flex-none lg:flex-row lg:gap-1.5 lg:rounded-full lg:px-5"
        >
          <X className="h-4 w-4" />
          <span className="text-[11px] font-medium lg:text-[12px]">Pass</span>
        </button>
        <button
          type="button"
          onClick={onLike}
          disabled={likeDisabled}
          aria-label={"Like " + displayName}
          data-testid="discover-yes"
          className="flex h-11 flex-[1.2] flex-col items-center justify-center gap-0.5 rounded-2xl border border-accent bg-accent text-white transition hover:bg-accent-deep disabled:opacity-40 lg:mt-0 lg:h-11 lg:w-auto lg:flex-none lg:flex-row lg:rounded-full lg:px-6"
        >
          <Check className="h-4 w-4" />
          <span className="text-[11px] font-semibold lg:text-[12px]">Like</span>
          <span className="text-[10px] font-medium text-white/80 lg:text-[11px]">{likes} left</span>
        </button>
        <button
          type="button"
          onClick={onPriorityIntro}
          disabled={busy || remaining <= 0}
          aria-label={"Send a " + PRIORITY_INTRO.name + " to " + displayName}
          data-testid="discover-priority-intro"
          className="flex h-11 flex-[1.4] flex-col items-center justify-center gap-0.5 rounded-2xl border border-accent/35 bg-accent-tint px-2 text-accent-deep transition hover:border-accent hover:bg-accent-soft disabled:opacity-40 lg:mt-0 lg:h-11 lg:w-auto lg:flex-none lg:flex-row lg:gap-1.5 lg:rounded-full lg:px-5"
        >
          <PriorityIntroIcon className="h-4 w-4" />
          <span className="text-[11px] font-semibold lg:text-[12px]">{PRIORITY_INTRO.name}</span>
          <span className="text-[11px] font-medium text-accent lg:text-[11px]">{PRIORITY_INTRO.countLabel(remaining)}</span>
        </button>
      </div>
    </div>
  );
}
