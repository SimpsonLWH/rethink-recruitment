import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[26px] border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center", className)}>
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface text-accent">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-5 font-display text-[28px] leading-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-6 text-ink-muted">{body}</p>
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
