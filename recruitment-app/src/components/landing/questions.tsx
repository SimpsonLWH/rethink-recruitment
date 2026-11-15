"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const questions = [
  {
    question: "Isn't a test just another gate?",
    answer:
      "It can be. The guardrails are one stated bar per role, below-bar records kept visible in a secondary view, and no automatic rejection. A human still reads the evidence.",
  },
  {
    question: "Why would a candidate trust the bar?",
    answer:
      "The bar is the same one the employer sees. The candidate sees the exact assessment family, version and score it asks for, and gets one sitting per cycle. Interest stays private until mutual.",
  },
  {
    question: "Doesn't the AI just decide?",
    answer:
      "No. The evidence reading explains what the record covers, cites the source and lists open questions. It cannot change the bar, feed order, decision, match or outcome.",
  },
  {
    question: "Why should a hiring team do the work before browsing?",
    answer:
      "One to three requirements, stated once. Every card then says why it is there, and the team stops sifting for a stack that was never in the role.",
  },
  {
    question: "Is this ready for real hiring?",
    answer:
      "No. This is a synthetic Junction prototype. The assessments are illustrative, not validated, and nothing here is a compliance claim.",
  },
];

export function Questions() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section id="questions" className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <div className="self-start lg:sticky lg:top-28">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">A short interview with the idea</p>
            <h2 className="mt-4 max-w-md font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.98] tracking-[-0.045em]">
              What would make <span className="italic">this fail?</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-ink-muted">
              Five objections we would put to the team before trusting a hiring demo. The answers are the rules, not a
              pitch.
            </p>
            <p className="mt-4 max-w-md text-[12px] leading-6 text-ink-faint">
              If an answer is wrong, the product should change. That is the point of writing it down.
            </p>
            <Link
              href="/how-it-works#limits"
              className="mt-7 inline-flex min-h-10 items-center gap-1.5 text-[13px] font-medium text-ink underline decoration-line-strong underline-offset-4 transition hover:text-accent-deep"
            >
              Read the honest limits <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="border-t border-line">
            {questions.map((item, index) => {
              const isOpen = open === index;
              const buttonId = "landing-question-" + index;
              const panelId = "landing-question-panel-" + index;
              return (
                <div key={item.question} className="border-b border-line">
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : index)}
                      className="flex w-full items-start justify-between gap-5 py-5 text-left"
                      data-testid={buttonId}
                    >
                      <span className={cn("text-[15px] font-semibold leading-6 transition-colors sm:text-[16px]", isOpen ? "text-ink" : "text-ink-soft")}>
                        {item.question}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                          isOpen ? "border-accent bg-accent text-white" : "border-line bg-paper text-ink-muted",
                        )}
                        aria-hidden="true"
                      >
                        <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24 }}>
                          <Plus className="h-3.5 w-3.5" />
                        </motion.span>
                      </span>
                    </button>
                  </h3>
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    aria-hidden={!isOpen}
                    inert={!isOpen}
                    initial={false}
                    animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                    data-testid={panelId}
                  >
                    <p className="max-w-2xl pb-6 pr-10 text-[14px] leading-7 text-ink-muted">{item.answer}</p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
