"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, Download } from "lucide-react";
import { useCallback, useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const slides = [
  { file: "slide-01.png", label: "Cover", title: "Evidence first, then decide." },
  { file: "slide-02.png", label: "The problem", title: "Hiring events optimise for volume, not evidence." },
  { file: "slide-03.png", label: "The idea", title: "One bar. Both sides see it." },
  { file: "slide-04.png", label: "Candidate", title: "The candidate never has to guess what strong means." },
  { file: "slide-05.png", label: "Hiring team", title: "The bar is written before the feed exists." },
  { file: "slide-06.png", label: "Evidence reading", title: "An explanation, not a decision." },
  { file: "slide-07.png", label: "Trust", title: "The rules remove the usual shortcuts." },
  { file: "slide-08.png", label: "What is built", title: "A working product, checked end to end." },
  { file: "slide-09.png", label: "Limits", title: "A prototype with clear edges." },
  { file: "slide-10.png", label: "Close", title: "Evidence before the swipe. A human decides." },
] as const;

const pad = (value: number) => String(value).padStart(2, "0");

export function Deck() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const current = slides[index];

  const go = useCallback((next: number) => {
    setIndex(Math.max(0, Math.min(slides.length - 1, next)));
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  };

  return (
    <section id="slides" data-testid="landing-deck" className="border-b border-line bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">The submission deck</p>
            <h2 className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.98] tracking-[-0.045em]">
              Ten slides. <span className="italic">Every claim has a source.</span>
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-ink-muted">
              The Junction 2026 deck for City of Espoo&apos;s Rethinking Recruitment challenge. Step through it here, or
              take the PDF. The limits get a slide of their own.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2.5 lg:shrink-0 lg:items-end">
            <div className="flex flex-wrap gap-2">
              <a
                href="/rivet-deck.pdf"
                download
                data-testid="landing-deck-download"
                className={cn(buttonVariants({ variant: "primary", size: "md" }), "gap-2")}
              >
                Download the deck <Download className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://github.com/SimpsonLWH/rethink-recruitment/tree/main/submission-draft/rivet"
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "secondary", size: "md" }), "gap-2")}
              >
                Read the pack <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-ink-faint">10 slides · 16:9 · PDF, 312 KB</p>
          </div>
        </div>

        <div className="mt-10 lg:mt-14" onKeyDown={handleKeyDown}>
          <div className="mx-auto max-w-5xl">
            <div className="rounded-[22px] border border-line bg-surface p-2 shadow-lift sm:p-2.5">
              <div className="relative aspect-video overflow-hidden rounded-[15px] bg-paper">
                <motion.div
                  key={current.file}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={"/deck/" + current.file}
                    alt={"Slide " + (index + 1) + ", " + current.label + ": " + current.title}
                    fill
                    sizes="(max-width: 1024px) calc(100vw - 44px), 960px"
                    className="object-cover"
                  />
                </motion.div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 sm:mt-5">
              <div className="min-w-0">
                <div aria-live="polite" aria-atomic="true">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    Slide {pad(index + 1)} · {current.label}
                  </p>
                  <p className="mt-1 font-display text-[19px] leading-tight tracking-[-0.02em] text-ink sm:text-[21px]">
                    {current.title}
                  </p>
                </div>
                <a
                  href={"/deck/" + current.file}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex min-h-8 items-center gap-1 text-[11px] font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition hover:text-accent-deep"
                >
                  Open slide full size <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous slide"
                  onClick={() => go(index - 1)}
                  disabled={index === 0}
                  data-testid="landing-deck-prev"
                  className={cn(buttonVariants({ variant: "secondary", size: "icon" }), "rounded-full")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="min-w-[62px] text-center text-[12px] tabular-nums text-ink-muted">
                  {pad(index + 1)} / {slides.length}
                </p>
                <button
                  type="button"
                  aria-label="Next slide"
                  onClick={() => go(index + 1)}
                  disabled={index === slides.length - 1}
                  data-testid="landing-deck-next"
                  className={cn(buttonVariants({ variant: "secondary", size: "icon" }), "rounded-full")}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-1.5" role="group" aria-label="Choose a slide">
              {slides.map((slide, slideIndex) => (
                <button
                  key={slide.file}
                  type="button"
                  onClick={() => setIndex(slideIndex)}
                  aria-label={"Slide " + (slideIndex + 1) + ": " + slide.title}
                  aria-current={slideIndex === index ? "true" : undefined}
                  data-testid={"landing-slide-" + (slideIndex + 1)}
                  className={cn(
                    "h-10 w-10 rounded-full border text-[11px] font-semibold tabular-nums transition-colors",
                    slideIndex === index
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink",
                  )}
                >
                  {pad(slideIndex + 1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
