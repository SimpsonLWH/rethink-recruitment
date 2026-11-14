import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
  light = false,
}: {
  className?: string;
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center">
        <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
          <circle cx="12" cy="16" r="8.25" fill="none" stroke={light ? "#FFFCF8" : "#1B1714"} strokeWidth="2" />
          <circle cx="20" cy="16" r="8.25" fill="none" stroke="#C63F4A" strokeWidth="2" />
          <circle cx="16" cy="16" r="1.8" fill="#C63F4A" />
        </svg>
      </span>
      {!compact && (
        <span
          className={cn(
            "font-display text-[25px] font-semibold leading-none tracking-[-0.045em]",
            light ? "text-paper" : "text-ink",
          )}
        >
          rivet
        </span>
      )}
    </span>
  );
}
