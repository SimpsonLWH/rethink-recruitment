"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Quote, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PRIORITY_INTRO, PriorityIntroIcon } from "@/lib/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Side = "candidate" | "employer";

const sideSpring = { type: "spring", stiffness: 320, damping: 30 } as const;
const panelSpring = { type: "spring", stiffness: 150, damping: 24 } as const;

function CandidatePanel() {
  return (
    <div className="rounded-[28px] border border-line bg-paper p-5 sm:p-7" data-testid="landing-side-panel" data-side="candidate">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Role card · Northwind Labs</p>
          <h3 className="mt-2 font-display text-[30px] leading-none tracking-[-0.035em]">Product Engineer</h3>
          <p className="mt-2 text-[13px] leading-5 text-ink-muted">Hybrid · 2 days in Espoo · Full-time</p>
        </div>
        <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-medium text-ink-muted">Synthetic</span>
      </div>

      <p className="mt-5 text-[14px] leading-7 text-ink-soft">
        The consent flow is technically finished but reads like a legal form. The team needs someone who can make it
        understandable to a stressed parent.
      </p>

      <div className="mt-5 border-t border-line pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">The bar</p>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-ink">JavaScript: Data handling</p>
            <p className="mt-1 text-[11px] text-ink-muted">One sitting per cycle</p>
          </div>
          <span className="font-display text-[24px] leading-none text-ink">70<span className="text-[12px] text-ink-muted"> / 100</span></span>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["TypeScript, 2+ years", "React", "Civic context"].map((signal) => (
            <span key={signal} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] text-ink-muted">{signal}</span>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">What Aino brings</p>
        <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-[13px] font-medium text-ink">JavaScript: Data handling</p>
          <span className="text-[12px] font-medium text-accent-deep">80 / 100 · meets the bar</span>
        </div>
        <p className="mt-2 text-[12px] leading-5 text-ink-muted">Returns flow: completion 61% → 84% in six weeks.</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="max-w-[220px] text-[11px] leading-5 text-ink-faint">No auto-reject. Below-bar records stay visible for a human.</p>
        <Link href="/enter" className={cn(buttonVariants({ variant: "primary", size: "sm" }), "gap-1.5")}>
          Open the candidate demo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function EmployerPanel() {
  return (
    <div className="rounded-[28px] border border-line bg-paper p-5 sm:p-7" data-testid="landing-side-panel" data-side="employer">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Evidence record · Aino Vikström</p>
          <h3 className="mt-2 font-display text-[30px] leading-none tracking-[-0.035em]">Against your bar</h3>
          <p className="mt-2 text-[13px] leading-5 text-ink-muted">Product engineer · Northwind Labs</p>
        </div>
        <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-medium text-ink-muted">Synthetic</span>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-4 border-t border-line pt-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Your bar</p>
          <p className="mt-2 text-[13px] font-medium text-ink">JavaScript: Data handling · 70</p>
        </div>
        <div className="text-right">
          <p className="font-display text-[26px] leading-none text-ink">80<span className="text-[12px] text-ink-muted"> / 100</span></p>
          <p className="mt-1 text-[10px] font-medium text-accent-deep">Meets the bar</p>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">What the record covers</p>
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <p className="text-[13px] font-medium text-ink">Returns flow rebuild</p>
              <span className="text-[10px] text-ink-muted">Employer-confirmed</span>
            </div>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">Completion 61% → 84% in six weeks, without a support contact.</p>
          </div>
          <div className="border-t border-line pt-3">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <p className="text-[13px] font-medium text-ink">Design-system audit</p>
              <span className="text-[10px] text-ink-muted">Self-claimed</span>
            </div>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">90% fewer hard-coded colours in the storefront.</p>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          <Quote className="h-3 w-3" /> One open question
        </p>
        <p className="mt-2 font-display text-[20px] italic leading-snug tracking-[-0.02em] text-ink">
          How does she work with a designer when the deadline moves?
        </p>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-5 text-ink-faint">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          Advisory reading · cites the record · never a score or a decision
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="max-w-[220px] text-[11px] leading-5 text-ink-faint">Like is the only primary action. A human decides.</p>
        <Link href="/enter" className={cn(buttonVariants({ variant: "primary", size: "sm" }), "gap-1.5")}>
          Open the hiring demo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function SideSwitcher() {
  const [side, setSide] = useState<Side>("candidate");
  const reduce = useReducedMotion();

  return (
    <section id="sides" className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Two sides, one bar</p>
            <h2 className="mt-4 max-w-md font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.98] tracking-[-0.045em]">
              One bar. <span className="italic">Both sides see it.</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-ink-muted">
              The role card is the contract. The evidence record answers it. Neither side is guessing what the other
              means by &ldquo;strong&rdquo;.
            </p>

            <div className="mt-7 inline-flex rounded-full border border-line bg-paper p-1" role="group" aria-label="Choose a side">
              {([
                ["candidate", "Candidate"],
                ["employer", "Hiring team"],
              ] as const).map(([value, label]) => {
                const active = side === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    data-testid={"landing-side-toggle-" + value}
                    onClick={() => setSide(value)}
                    className={cn(
                      "relative flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[12px] font-medium transition-colors",
                      active ? "text-paper" : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="landing-side-pill"
                        className="absolute inset-0 rounded-full bg-ink"
                        transition={reduce ? { duration: 0 } : sideSpring}
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2 text-[12px] leading-5 text-ink-muted">
              <p className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> Exactly one stated bar per assessment.</p>
              <p className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> Below-bar evidence stays visible.</p>
              <p className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> A match still needs two yeses.</p>
            </div>

            <p className="mt-7 flex items-center gap-1.5 text-[11px] text-ink-faint">
              <PriorityIntroIcon className="h-3.5 w-3.5" /> {PRIORITY_INTRO.countLabel(1)} in this demo · no ranking
            </p>
          </div>

          <div className="min-h-[520px] sm:min-h-[540px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={side}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 1, transition: { duration: 0 } } : { opacity: 0, y: -6, transition: { duration: 0.16, ease: "easeOut" } }}
                transition={reduce ? { duration: 0 } : panelSpring}
              >
                {side === "candidate" ? <CandidatePanel /> : <EmployerPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
