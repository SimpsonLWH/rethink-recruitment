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
    <div className={cn("flex flex-col gap-5 pb-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.3rem,4.4vw,3.6rem)] leading-[0.98] tracking-[-0.04em]">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
