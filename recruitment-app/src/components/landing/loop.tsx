"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Reveal } from "@/components/landing/reveal";

const steps = [
  {
    number: "01",
    label: "Candidate",
    title: "Bring evidence.",
    body: "A short assessment tied to the role, plus the structured facts the candidate wants read. One sitting per assessment per cycle, marked against a hidden test set.",
  },
  {
    number: "02",
    label: "Hiring team",
    title: "State the bar.",
    body: "One to three exact assessments with a score, and the signals that matter — before browsing. The bar is visible on the role card.",
  },
  {
    number: "03",
    label: "Both sides",
    title: "Choose, then talk.",
    body: "Pass, Like, or send one Priority intro. A match needs two explicit yeses. Discovery is opt-in, invitations are messages, and a human makes the decision.",
  },
];

export function Loop() {
  const reduce = useReducedMotion();

  return (
    <section id="loop" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        <div className="self-start lg:sticky lg:top-28">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">The loop</p>
          <h2 className="mt-4 max-w-md font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.98] tracking-[-0.045em]">
            Three moves. <span className="italic">No hidden score.</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-ink-muted">
            The demo starts with a seeded event. Try the hiring path, then switch persona and see the candidate side.
          </p>
          <Link
            href="/how-it-works"
            className="mt-7 inline-flex min-h-10 items-center gap-1.5 text-[13px] font-medium text-ink underline decoration-line-strong underline-offset-4 transition hover:text-accent-deep"
          >
            Read the full rules <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div>
          <motion.div
            className="h-px origin-left bg-line"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={reduce ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
          />
          <div>
            {steps.map((step, index) => (
              <Reveal key={step.number} delay={index * 0.06}>
                <article className="grid grid-cols-[44px_1fr] gap-4 border-t border-line py-7 first:border-t-0 first:pt-8 sm:grid-cols-[64px_1fr] sm:gap-6">
                  <p className="font-display text-[36px] leading-none tracking-[-0.03em] text-ink-faint sm:text-[42px]">{step.number}</p>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{step.label}</p>
                    <h3 className="mt-2 text-[20px] font-semibold leading-tight tracking-[-0.02em] text-ink">{step.title}</h3>
                    <p className="mt-2 max-w-xl text-[14px] leading-7 text-ink-muted">{step.body}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
