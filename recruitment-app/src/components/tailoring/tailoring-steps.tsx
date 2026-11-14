import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Generate", "Review", "Approve", "Preview"];

export function TailoringSteps({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl border border-line bg-surface px-3 py-2.5 sm:gap-3 sm:px-4">
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <div key={step} className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold",
                done ? "border-moss bg-moss text-white" : active ? "border-rose bg-rose text-white" : "border-line bg-paper text-ink-faint",
              )}
            >
              {done ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            <span className={cn("text-[9.5px] font-semibold sm:text-[10.5px]", active ? "text-ink" : done ? "text-moss" : "text-ink-faint")}>{step}</span>
            {index < STEPS.length - 1 && <span className={cn("hidden h-px flex-1 sm:block", done ? "bg-moss/30" : "bg-line")} />}
          </div>
        );
      })}
    </div>
  );
}
