import { Flower2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function RoseCounter({
  remaining,
  total,
  className,
}: {
  remaining: number;
  total: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.11em] text-ink-muted">
          <Flower2 className="h-4 w-4 text-rose" /> Roses left
        </p>
        <p className="font-display text-[20px] leading-none">{remaining}<span className="text-[12px] text-ink-faint">/{total}</span></p>
      </div>
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: total }).map((_, index) => (
          <span key={index} className={cn("h-2 flex-1 rounded-full", index < remaining ? "bg-rose" : "bg-line")} />
        ))}
      </div>
      <p className="mt-2.5 text-[10px] leading-4 text-ink-faint">Free and equal for everyone. Never bought, never used to rank people.</p>
    </div>
  );
}
