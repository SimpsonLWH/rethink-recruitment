"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "rivet-prepare-v1";
const EVENT = "rivet:prepare-progress";

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Practice progress lives in this browser only. It is a convenience for the
 * learner, not evidence, and it is never sent to the server or to employers.
 */
export function usePrepareProgress() {
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    setDone(read());
    const sync = () => setDone(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const markDone = useCallback((key: string) => {
    const current = read();
    if (current.includes(key)) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify([...current, key]));
    } catch {
      // Storage may be unavailable; progress is optional.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { done, markDone };
}

export function TrackProgress({ keys, className }: { keys: string[]; className?: string }) {
  const { done } = usePrepareProgress();
  const count = keys.filter((key) => done.includes(key)).length;
  const percent = keys.length === 0 ? 0 : Math.round((count / keys.length) * 100);
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-[12px] text-ink-muted">
        <span>
          {count} of {keys.length} done
        </span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Track progress">
        <div className="h-full rounded-full bg-accent-bright transition-[width]" style={{ width: percent + "%" }} />
      </div>
    </div>
  );
}

export function ItemStatus({ itemKey, label }: { itemKey: string; label: string }) {
  const { done } = usePrepareProgress();
  const complete = done.includes(itemKey);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", complete ? "text-accent" : "text-ink-faint")}>
      {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
      {complete ? label : "Not yet"}
    </span>
  );
}

export function MarkLessonRead({ itemKey }: { itemKey: string }) {
  const { done, markDone } = usePrepareProgress();
  const complete = done.includes(itemKey);
  return (
    <button
      type="button"
      onClick={() => markDone(itemKey)}
      disabled={complete}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-[13px] font-semibold transition",
        complete ? "border border-line text-accent" : "bg-accent text-white hover:bg-accent-deep",
      )}
      data-testid="mark-lesson-read"
    >
      <CheckCircle2 className="h-4 w-4" /> {complete ? "Marked as read" : "Mark as read"}
    </button>
  );
}
