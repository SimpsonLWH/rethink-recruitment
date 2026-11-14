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
          <circle cx="12" cy="16" r="8.25" fill="none" stroke={light ? "#FFFFFF" : "#0E141E"} strokeWidth="2" />
          <circle cx="20" cy="16" r="8.25" fill="none" stroke={light ? "#2EC866" : "#16833F"} strokeWidth="2" />
          <circle cx="16" cy="16" r="1.8" fill={light ? "#2EC866" : "#16833F"} />
        </svg>
      </span>
      {!compact && (
        <span
          className={cn(
            "font-sans text-[22px] font-bold leading-none tracking-[-0.04em]",
            light ? "text-white" : "text-ink",
          )}
        >
          rivet
        </span>
      )}
    </span>
  );
}
