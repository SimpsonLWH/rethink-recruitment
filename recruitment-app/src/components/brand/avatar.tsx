import { cn } from "@/lib/utils";

const PALETTES: Record<string, string> = {
  sand: "bg-[#EDE6D8] text-[#5F4D33]",
  plum: "bg-[#E7DCE5] text-[#5A3552]",
  sage: "bg-[#DFE7DC] text-[#3C5544]",
  slate: "bg-[#DEE5E9] text-[#314A55]",
  clay: "bg-[#EADBD3] text-[#683F36]",
  ochre: "bg-[#EAE1CB] text-[#5A4A22]",
  blue: "bg-[#DFE4ED] text-[#38465F]",
};

export function Avatar({
  name,
  monogram,
  palette = "sand",
  size = "md",
  className,
  square = false,
}: {
  name: string;
  monogram: string;
  palette?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  square?: boolean;
}) {
  const sizeClass = {
    xs: "h-8 w-8 text-[11px]",
    sm: "h-10 w-10 text-[13px]",
    md: "h-12 w-12 text-[15px]",
    lg: "h-16 w-16 text-[20px]",
    xl: "h-24 w-24 text-[30px]",
  }[size];

  return (
    <span
      aria-label={name}
      title={name}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-ink/10 font-semibold tracking-[-0.02em]",
        square ? "rounded-xl" : "rounded-full",
        PALETTES[palette] ?? PALETTES.sand,
        sizeClass,
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0 7px, rgba(255,255,255,.7) 7px 8px)",
        }}
      />
      <span className="relative">{monogram}</span>
    </span>
  );
}
