import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AiStatusLine } from "@/components/brand/ai-status-line";
import { Logo } from "@/components/brand/logo";
import { Deck } from "@/components/landing/deck";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { LandingMotion } from "@/components/landing/motion-provider";
import { Loop } from "@/components/landing/loop";
import { Questions } from "@/components/landing/questions";
import { SideSwitcher } from "@/components/landing/side-switcher";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "Rivet — evidence first, then decide" },
  description:
    "A two-sided hiring loop for Junction 2026. Candidates show role-relevant evidence; hiring teams state the bar first. Synthetic data, no keys.",
};

const navLinks = [
  { href: "#product", label: "Product" },
  { href: "#loop", label: "How it works" },
  { href: "#questions", label: "Questions" },
  { href: "#slides", label: "Slides" },
];

export default function LandingPage() {
  return (
    <LandingMotion>
      <main className="min-h-screen overflow-x-clip bg-paper text-ink">
        <header className="sticky top-0 z-40 border-b border-line bg-paper">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
            <Link href="/" aria-label="Rivet home" className="shrink-0">
              <Logo />
            </Link>

            <nav className="hidden items-center gap-7 text-[13px] font-medium text-ink-muted md:flex" aria-label="Landing">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="inline-flex min-h-10 items-center transition hover:text-ink">
                  {link.label}
                </a>
              ))}
            </nav>

            <Link
              href="/enter"
              data-testid="landing-header-cta"
              className={cn(buttonVariants({ variant: "primary", size: "sm" }), "gap-1.5")}
            >
              Open the demo <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <Hero />
        <SideSwitcher />
        <Loop />
        <Questions />
        <Deck />
        <FinalCta />

        <footer className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
            <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                <Logo />
                <p className="mt-4 max-w-sm text-[12px] leading-6 text-ink-muted">
                  A two-sided recruitment prototype for Junction 2026 · City of Espoo. Every person, team, assessment
                  and evidence link is fictional.
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-x-8 gap-y-2 text-[12px] text-ink-muted">
                <a href="#product" className="inline-flex min-h-10 items-center transition hover:text-ink">Product</a>
                <a href="#questions" className="inline-flex min-h-10 items-center transition hover:text-ink">Questions</a>
                <a href="#slides" className="inline-flex min-h-10 items-center transition hover:text-ink">Slides</a>
                <Link href="/how-it-works" className="inline-flex min-h-10 items-center transition hover:text-ink">The details</Link>
                <Link href="/enter" className="inline-flex min-h-10 items-center font-medium text-ink transition hover:text-accent-deep">Open the demo</Link>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-line pt-5 text-[11px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
              <AiStatusLine />
              <p>Synthetic data only. No ranking. No auto-reject.</p>
            </div>
          </div>
        </footer>
      </main>
    </LandingMotion>
  );
}
