import { cn } from "@/lib/utils";

const PALETTES: Record<string, string> = {
  sand: "bg-[#EBDCC7] text-[#5F452A]",
  rose: "bg-[#F2D8D4] text-[#7E2C34]",
  sage: "bg-[#DDE6DA] text-[#3C5544]",
  slate: "bg-[#DCE4E8] text-[#314A55]",
  clay: "bg-[#EAD7CF] text-[#683F36]",
  ochre: "bg-[#E9DFC6] text-[#5A4A22]",
  blue: "bg-[#DDE3ED] text-[#38465F]",
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
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0 7px, rgba(255,255,255,.7) 7px 8px)",
        }}
      />
      <span className="relative">{monogram}</span>
    </span>
  );
}
