import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  /**
   * Optional context that the title does not already carry. Never repeat the
   * heading here: most app pages should omit the eyebrow entirely.
   */
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-muted">{eyebrow}</p>
        ) : null}
        <h1 className={cn("max-w-3xl font-sans text-[clamp(1.55rem,2.5vw,2.1rem)] font-semibold leading-[1.12] tracking-[-0.025em]", eyebrow && "mt-2")}>
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
