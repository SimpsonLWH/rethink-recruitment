import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Neutral information callout. Rose is reserved for brand and primary actions,
 * so informational notes stay on paper/surface with a line border.
 */
export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-line bg-paper px-4 py-3 text-[12px] leading-5 text-ink-soft", className)}>
      {children}
    </div>
  );
}
