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
          <circle cx="12" cy="16" r="8.25" fill="none" stroke={light ? "#FFFFFF" : "#171717"} strokeWidth="2" />
          <circle cx="20" cy="16" r="8.25" fill="none" stroke={light ? "#E9B4C0" : "#A64056"} strokeWidth="2" />
          <circle cx="16" cy="16" r="1.8" fill={light ? "#E9B4C0" : "#A64056"} />
        </svg>
      </span>
      {!compact && (
        <span
          className={cn(
            "font-display text-[25px] font-semibold leading-none tracking-[-0.045em]",
            light ? "text-white" : "text-ink",
          )}
        >
          rivet
        </span>
      )}
    </span>
  );
}
