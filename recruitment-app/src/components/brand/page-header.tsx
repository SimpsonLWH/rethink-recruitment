import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <p className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-rose" />
          {eyebrow}
        </p>
        <h1 className="mt-2.5 font-display text-[clamp(2rem,4.1vw,3.3rem)] leading-[1] tracking-[-0.04em]">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-[13px] leading-6 text-ink-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
