import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none tracking-[0.01em]",
  {
    variants: {
      variant: {
        outline: "border-line-strong bg-transparent text-ink-muted",
        neutral: "border-line bg-paper text-ink-soft",
        surface: "border-line bg-surface text-ink-soft",
        ink: "border-ink bg-ink text-paper",
        rose: "border-rose/20 bg-rose-tint text-rose-deep",
        accent: "border-rose bg-rose text-white",
        moss: "border-moss/20 bg-moss/10 text-moss",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
