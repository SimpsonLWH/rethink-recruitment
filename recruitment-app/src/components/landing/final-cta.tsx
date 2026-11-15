import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
      <Reveal>
        <div className="overflow-hidden rounded-[32px] bg-accent-deep px-6 py-14 text-paper sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-paper/60">Junction 2026 · City of Espoo</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
            <div>
              <h2 className="max-w-2xl font-display text-[clamp(2.25rem,6vw,4.6rem)] leading-[0.94] tracking-[-0.05em]">
                See both sides. <span className="italic">Keep the human decision.</span>
              </h2>
              <p className="mt-5 max-w-lg text-[14px] leading-7 text-paper/75">
                Open the seeded demo as a candidate or a hiring team. No keys, no external account, no real people.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link
                href="/enter"
                data-testid="landing-final-cta"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-paper px-6 text-[14px] font-semibold text-accent-deep transition-colors hover:bg-white"
              >
                Open the demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-paper/30 px-6 text-[14px] font-medium text-paper transition-colors hover:bg-white/10"
              >
                Read how Rivet works
              </Link>
            </div>
          </div>
          <p className="mt-10 text-[11px] leading-5 text-paper/55">
            Synthetic data · 3-minute tour · sample accounts · built for Junction 2026
          </p>
        </div>
      </Reveal>
    </section>
  );
}
