import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Check, Info } from "lucide-react";
import { AiStatusLine } from "@/components/brand/ai-status-line";
import { Avatar } from "@/components/brand/avatar";
import { Logo } from "@/components/brand/logo";
import { PRIORITY_INTRO, PriorityIntroIcon } from "@/lib/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  {
    n: "01",
    title: "Evidence, not a CV",
    body: "Candidates take a short assessment from a random pool and add structured experience. Every result is tied to one family, version and difficulty.",
  },
  {
    n: "02",
    title: "Say what you need first",
    body: "Employers create role cards with an exact assessment bar and the signals that matter. The feed presents evidence; a human still decides.",
  },
  {
    n: "03",
    title: "Interest goes both ways",
    body: "Pass, Like, or send one free Priority intro. A match needs two explicit yeses. Discovery invitations are messages, never automatic matches.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-paper text-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 lg:px-8">
        <Link href="/" aria-label="Rivet home">
          <Logo />
        </Link>
        <div className="hidden items-center gap-7 text-[13px] font-medium text-ink-muted md:flex">
          <a className="transition hover:text-ink" href="#product">The product</a>
          <a className="transition hover:text-ink" href="#loop">How it works</a>
          <Link className="transition hover:text-ink" href="/how-it-works">The details</Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/enter" className={cn(buttonVariants({ variant: "primary", size: "sm" }), "gap-1.5")}>
            Sign in <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section id="product" className="mx-auto max-w-7xl px-5 pb-20 pt-10 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Junction 2026 · Espoo career event</p>
            <h1 className="mt-6 font-display text-[clamp(3.6rem,8vw,6.6rem)] leading-[0.9] tracking-[-0.055em]">
              Evidence first.
              <br />
              <span className="italic">Then decide.</span>
            </h1>
            <p className="mt-8 max-w-xl text-[17px] leading-[1.75] text-ink-soft sm:text-[18px]">
              Rivet is a two-sided matchmaking layer for City of Espoo recruiting events. Candidates show capability
              through short assessments. Employers state their need as role cards. Both sides swipe, and a human makes
              every decision.
            </p>
            <p className="mt-4 max-w-lg text-[14px] leading-7 text-ink-muted">
              No sign-in. No keys. Every person, team and evidence link is fictional.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/enter"
                className={cn(buttonVariants({ variant: "primary", size: "lg" }), "group h-[54px] justify-between rounded-2xl px-5 text-[15px] sm:w-[238px]")}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold">NL</span>
                  I&apos;m hiring
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/enter"
                className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "group h-[54px] justify-between rounded-2xl px-5 text-[15px] sm:w-[210px]")}
              >
                <span className="flex items-center gap-2.5">
                  <Avatar name="Aino" monogram="AV" palette="plum" size="xs" />
                  I&apos;m looking for work
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> About 3 minutes</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> Fictional data only</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> Works with no keys</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] lg:mr-0">
            <div className="overflow-hidden rounded-[24px] border border-line bg-surface shadow-lift">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-ink-muted">Candidate review · demo profile</p>
                <span className="text-[11px] text-ink-faint">1 of 10</span>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <Avatar name="Noor Salmi" monogram="NS" palette="sage" size="lg" />
                  <div className="min-w-0">
                    <p className="font-display text-[30px] leading-none tracking-[-0.035em]">Noor Salmi</p>
                    <p className="mt-2 text-[14px] text-ink-muted">Finance frontend engineer · Espoo</p>
                    <p className="mt-1 text-[12px] text-ink-faint">In event order · no ranking</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-[1.15fr_0.85fr] gap-3">
                  <div className="rounded-2xl border border-line bg-paper p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Result</p>
                    <p className="mt-2 font-display text-[34px] leading-none">9 min → 90 sec</p>
                    <p className="mt-2 text-[12px] leading-5 text-ink-muted">Invoice matching for 40 analysts; manual corrections down 38%.</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-paper p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Project</p>
                    <div className="mt-2 overflow-hidden rounded-lg border border-line">
                      <Image src="/demo/invoice-matching.svg" alt="Synthetic illustration of the invoice-matching project" width={640} height={360} unoptimized className="h-auto w-full" />
                    </div>
                    <p className="mt-2 text-[11px] leading-4 text-ink-muted">One screen replaced a spreadsheet and two tools.</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-4">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted"><span className="h-1.5 w-1.5 rounded-full bg-ink-faint" /> Self-claimed</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted"><span className="h-1.5 w-1.5 rounded-full bg-ink-faint" /> Link works</span>
                  <span className="text-[11px] text-ink-faint">Fictional evidence</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["Finance", "React", "TypeScript", "Design systems"].map((skill) => (
                    <span key={skill} className="rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-muted">{skill}</span>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                  <span className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-line-strong text-[12px] text-ink-muted">Pass</span>
                  <span className="inline-flex h-10 flex-[1.15] items-center justify-center rounded-full bg-accent text-[12px] font-medium text-white">Like</span>
                  <span className="inline-flex h-10 flex-[1.4] items-center justify-center gap-1.5 rounded-full border border-accent/35 bg-accent-tint px-3 text-[12px] font-medium text-accent-deep">
                    <PriorityIntroIcon className="h-3.5 w-3.5" /> {PRIORITY_INTRO.name}
                  </span>
                </div>
                <p className="mt-2 text-center text-[11px] text-ink-faint">{PRIORITY_INTRO.countLabel(2)} · synthetic demo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="loop" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">The loop</p>
              <h2 className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.98] tracking-[-0.045em]">
                A room where both sides are legible.
              </h2>
            </div>
            <p className="max-w-sm text-[14px] leading-7 text-ink-muted">
              The demo starts with a seeded event. Try the recruiter path, then switch persona and see the candidate side.
            </p>
          </div>

          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n} className="border-t border-line pt-5">
                <p className="font-display text-[32px] leading-none text-ink-faint">{step.n}</p>
                <h3 className="mt-4 text-[18px] font-semibold leading-snug text-ink">{step.title}</h3>
                <p className="mt-3 text-[14px] leading-7 text-ink-muted">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6 text-[13px] text-ink-muted">
            <Link href="/how-it-works" className="inline-flex items-center gap-1.5 font-medium text-ink underline decoration-line-strong underline-offset-4">
              <Info className="h-3.5 w-3.5" /> How Rivet works
            </Link>
            <span>Evidence is labelled, never merged into a score.</span>
            <span>AI is optional; the deterministic demo is complete.</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">For the reviewer</p>
            <h2 className="mt-4 max-w-lg font-display text-[clamp(2.3rem,4.5vw,3.7rem)] leading-[1.0] tracking-[-0.04em]">
              Spend attention on the people who deserve it.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-ink-muted">
              The feed is a discovery filter, not a judgement. It narrows the room so a human can read more carefully.
              It never ranks a person or evaluates their worth.
            </p>
          </div>
          <div className="space-y-4">
            {[
              ["Editable criteria, never a hidden score", "Your request becomes visible chips you can edit, remove or add. Every candidate card says why it is there."],
              ["Unknown is not a failure", "When a profile does not state something, it stays visible with a note. Explicit contradictions are grouped outside your criteria, with a one-tap broaden."],
              ["Dated evidence, not vibes", "Experience durations count only dated roles and projects, merge overlaps, and never infer a skill's duration from a role that merely mentions it."],
            ].map(([title, body], index) => (
              <div key={title} className="grid grid-cols-[auto_1fr] gap-4 border-t border-line pt-4">
                <span className="font-display text-[22px] leading-none text-ink-faint">0{index + 1}</span>
                <div>
                  <p className="text-[15px] font-semibold text-ink">{title}</p>
                  <p className="mt-1.5 text-[13px] leading-6 text-ink-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <Logo compact />
            <div>
              <p className="text-[12px] font-medium text-ink-soft">Rivet · Junction 2026</p>
              <p className="mt-0.5 text-[11px] text-ink-muted">Every person, team, link and confirmation is fictional.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-[11px] text-ink-muted">
            <Link className="transition hover:text-ink" href="/how-it-works">How Rivet works</Link>
            <Link className="transition hover:text-ink" href="/enter">Open the demo</Link>
          </div>
        </div>
        <div className="mx-auto max-w-7xl border-t border-line px-5 py-4 lg:px-8">
          <AiStatusLine />
        </div>
      </footer>
    </main>
  );
}
