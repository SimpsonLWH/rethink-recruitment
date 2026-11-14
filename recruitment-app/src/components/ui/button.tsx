import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full border text-sm font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px",
  {
    variants: {
      variant: {
        primary: "border-ink bg-ink text-paper hover:border-ink-soft hover:bg-ink-soft",
        accent: "border-rose bg-rose text-white hover:border-rose-deep hover:bg-rose-deep",
        secondary: "border-line bg-surface text-ink hover:border-line-strong hover:bg-[#FBF7F1]",
        ghost: "border-transparent bg-transparent text-ink-soft hover:bg-ink/[0.055] hover:text-ink",
        outline: "border-line-strong bg-transparent text-ink hover:bg-ink/[0.04]",
        roseGhost: "border-rose/25 bg-rose-tint text-rose-deep hover:border-rose/45 hover:bg-rose-soft",
        danger: "border-transparent bg-transparent text-rose-deep hover:bg-rose-tint",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px]",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-11 w-11 p-0",
        iconLg: "h-14 w-14 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
