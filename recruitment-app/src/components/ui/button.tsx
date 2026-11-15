import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full border text-sm font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px",
  {
    variants: {
      variant: {
        primary: "border-accent bg-accent text-white hover:border-accent-deep hover:bg-accent-deep",
        accent: "border-accent bg-accent text-white hover:border-accent-deep hover:bg-accent-deep",
        secondary: "border-line bg-surface text-ink hover:border-line-strong hover:bg-paper",
        ghost: "border-transparent bg-transparent text-ink-soft hover:bg-ink/[0.055] hover:text-ink",
        outline: "border-line-strong bg-transparent text-ink hover:bg-ink/[0.04]",
        roseGhost: "border-accent/25 bg-accent-tint text-accent-deep hover:border-accent/45 hover:bg-accent-soft",
        danger: "border-transparent bg-transparent text-ink-muted hover:bg-ink/[0.05] hover:text-ink",
      },
      size: {
        sm: "h-10 px-4 text-[12px]",
        md: "h-11 px-5 text-[13px]",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10 p-0",
        iconLg: "h-12 w-12 p-0",
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
