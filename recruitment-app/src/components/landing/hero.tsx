"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Avatar } from "@/components/brand/avatar";
import { PRIORITY_INTRO, PriorityIntroIcon } from "@/lib/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const heroLines = ["Evidence first.", "Then decide."];
const spring = { type: "spring", stiffness: 180, damping: 20 } as const;

function HeroWords({ reduce }: { reduce: boolean | null }) {
  let wordIndex = 0;

  return (
    <h1 className="mt-6 font-display text-[clamp(2.4rem,6.4vw,4.75rem)] leading-[0.94] tracking-[-0.055em] text-ink">
      <span className="sr-only">Evidence first. Then decide.</span>
      <span aria-hidden="true">
        {heroLines.map((line, lineIndex) => (
          <span
            key={line}
            className={cn("block whitespace-nowrap", lineIndex === 1 && "italic")}
          >
            {line.split(" ").map((word) => {
              const index = wordIndex++;
              return (
                <motion.span
                  key={line + "-" + index}
                  data-motion-reveal
                  className="inline-block"
                  style={{ marginRight: "0.24em" }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduce ? { duration: 0 } : { ...spring, delay: 0.08 + index * 0.07 }}
                >
                  {word}
                </motion.span>
              );
            })}
          </span>
        ))}
      </span>
    </h1>
  );
}

function EvidenceRecord({ reduce }: { reduce: boolean | null }) {
  return (
    <motion.div
      data-motion-reveal
      className="relative mx-auto w-full max-w-[540px]"
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { ...spring, delay: 0.24 }}
    >
      <div className="overflow-hidden rounded-[28px] border border-line bg-surface shadow-lift">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Evidence record</p>
          <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[10px] font-medium text-ink-muted">Synthetic</span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <Avatar name="Aino Vikström" monogram="AV" palette="plum" size="lg" />
            <div className="min-w-0">
              <p className="font-display text-[27px] leading-none tracking-[-0.03em]">Aino Vikström</p>
              <p className="mt-2 text-[13px] leading-5 text-ink-muted">Product-minded frontend engineer · Espoo</p>
              <p className="mt-1 text-[11px] text-ink-faint">Sample candidate · no ranking</p>
            </div>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-faint">Role bar</p>
                <p className="mt-1 text-[14px] font-medium leading-5 text-ink">JavaScript: Data handling</p>
              </div>
              <p className="shrink-0 font-display text-[24px] leading-none text-ink">80<span className="text-[13px] text-ink-muted"> / 100</span></p>
            </div>

            <div className="mt-3" aria-hidden="true">
              <div className="relative h-2 rounded-full bg-line">
                <motion.div
                  className="h-2 rounded-full bg-accent"
                  style={{ width: "80%", transformOrigin: "left center" }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                />
                <span className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-ink" style={{ left: "70%" }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                <span className="text-ink-faint">Role bar 70</span>
                <span className="font-medium text-accent-deep">Meets the bar</span>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-faint">Also in the record</p>
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink">Returns flow rebuild</p>
                  <p className="mt-0.5 text-[12px] leading-5 text-ink-muted">Completion 61% → 84% in six weeks</p>
                </div>
                <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-medium text-ink-muted">Employer-confirmed</span>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 border-t border-line pt-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink">Design-system audit</p>
                  <p className="mt-0.5 text-[12px] leading-5 text-ink-muted">90% fewer hard-coded colours</p>
                </div>
                <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-medium text-ink-muted">Self-claimed</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-line pt-5" aria-hidden="true">
            <span className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-line-strong text-[11px] text-ink-muted">Pass</span>
            <span className="inline-flex h-10 flex-[1.1] items-center justify-center rounded-full bg-accent text-[11px] font-medium text-white">Like</span>
            <span className="inline-flex h-10 flex-[1.35] items-center justify-center gap-1 rounded-full border border-accent/35 bg-accent-tint px-2 text-[10px] font-medium text-accent-deep">
              <PriorityIntroIcon className="h-3.5 w-3.5" />
              {PRIORITY_INTRO.name}
            </span>
          </div>
          <p className="mt-3 text-center text-[10px] text-ink-faint">Synthetic preview · no actions recorded · no auto-reject</p>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section id="product" className="mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:px-10 lg:pb-28 lg:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-12">
        <div className="max-w-2xl">
          <motion.p
            data-motion-reveal
            className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { ...spring, delay: 0.04 }}
          >
            Junction 2026 · City of Espoo
          </motion.p>

          <HeroWords reduce={reduce} />

          <motion.p
            data-motion-reveal
            className="mt-7 max-w-xl text-[17px] leading-8 text-ink-soft sm:text-[18px]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { ...spring, delay: 0.42 }}
          >
            Rivet is a two-sided hiring loop for the Espoo career event. Candidates bring role-relevant assessments
            and structured experience. Hiring teams state the bar before they browse. A person makes the call.
          </motion.p>

          <motion.p
            data-motion-reveal
            className="mt-3 max-w-lg text-[13px] leading-6 text-ink-muted"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { ...spring, delay: 0.5 }}
          >
            Sample accounts. No keys. Every person, team and evidence link is synthetic.
          </motion.p>

          <motion.div
            data-motion-reveal
            className="mt-8 grid max-w-[520px] grid-cols-1 gap-3 sm:grid-cols-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { ...spring, delay: 0.58 }}
          >
            <Link
              href="/enter"
              data-testid="landing-cta-hiring"
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "group h-12 justify-between rounded-full px-4 text-[14px]",
              )}
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold">NL</span>
                I&apos;m hiring
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/enter"
              data-testid="landing-cta-candidate"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "group h-12 justify-between rounded-full px-4 text-[14px]",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Avatar name="Aino" monogram="AV" palette="plum" size="xs" />
                I&apos;m looking for work
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <motion.div
            data-motion-reveal
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-muted"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { ...spring, delay: 0.66 }}
          >
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> About 3 minutes</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> Sample accounts</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> Synthetic data</span>
          </motion.div>
        </div>

        <EvidenceRecord reduce={reduce} />
      </div>
    </section>
  );
}