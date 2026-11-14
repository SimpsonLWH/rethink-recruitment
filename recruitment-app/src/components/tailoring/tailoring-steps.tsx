import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Generate", "Review", "Approve", "Preview"];

export function TailoringSteps({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Tailoring progress">
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                active
                  ? "border-accent bg-accent text-white"
                  : done
                    ? "border-line-strong bg-surface text-ink-soft"
                    : "border-line bg-surface text-ink-faint",
              )}
            >
              {done ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            <span
              className={cn(
                "text-[12px] font-medium",
                active ? "text-ink" : done ? "text-ink-soft" : "text-ink-faint",
              )}
            >
              {step}
            </span>
            {index < STEPS.length - 1 && <span aria-hidden className="ml-1 hidden h-px w-6 bg-line sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}
