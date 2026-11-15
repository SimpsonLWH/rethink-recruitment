import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, Check, FileSearch, MessageSquareText, ScanSearch, ShieldCheck, XCircle } from "lucide-react";
import { AiStatusLine } from "@/components/brand/ai-status-line";
import { Avatar } from "@/components/brand/avatar";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Rivet · Hire the work, not the wording",
  description:
    "Rivet is the interviewer's pre-screen for the AI-CV era: verified work samples, checkable claims and a conversation kit. No CV keyword scan, no AI detector, no auto-reject.",
};

const steps = [
  {
    n: "01",
    title: "State the bar before the people",
    body: "A role card turns into a short screening plan: exact assessment bars, the signals that matter, and one conversation criterion. Must-haves are visible before anyone is reviewed.",
  },
  {
    n: "02",
    title: "Check the record, not the prose",
    body: "A work-sample result with a known difficulty. Claims that keep their artifact and link status. An employer confirmation, where one exists. Candidate prose stays prose until a human checks it.",
  },
  {
    n: "03",
    title: "Leave with a kit and a decision",
    body: "A time-boxed conversation kit built from what is still open, a criterion scorecard, and an audit trail with who, when and why. Nothing is ranked or auto-rejected.",
  },
];

const features = [
  {
    icon: ScanSearch,
    title: "No CV scanner, no AI detector",
    body: "Rivet does not guess whether a document was written by AI, and it does not turn a CV into a keyword score. It removes the need for the guess by putting work in front of the reviewer.",
  },
  {
    icon: BadgeCheck,
    title: "Claims carry their evidence",
    body: "Every claim has a source and a state: checked, artifact only, for the conversation, or still prose. A working link proves a link worked, not that the claim is true.",
  },
  {
    icon: MessageSquareText,
    title: "A conversation kit, not a verdict",
    body: "The kit asks about the work behind the score and the claims without an artifact. Listen-fors and follow-ups are written down, so two interviewers can compare notes.",
  },
  {
    icon: ShieldCheck,
    title: "A decision a person owns",
    body: "The reviewer rates the stated criteria, writes a reason, and confirms the decision. The record keeps the basis and the time. There is no hidden weighting and no automatic rejection.",
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
          <a className="transition hover:text-ink" href="#problem">The CV problem</a>
          <a className="transition hover:text-ink" href="#loop">How it works</a>
          <a className="transition hover:text-ink" href="#inside">Inside the pre-screen</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/enter" className={cn(buttonVariants({ variant: "primary", size: "sm" }), "gap-1.5")}>
            Open the demo <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 lg:px-8 lg:pb-28 lg:pt-14">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Junction 2026 · Espoo · For interviewers
            </p>
            <h1 className="mt-6 font-display text-[clamp(3.4rem,7.4vw,6.1rem)] leading-[0.9] tracking-[-0.055em]">
              Hire the work.
              <br />
              <span className="italic">Not the wording.</span>
            </h1>
            <p className="mt-7 max-w-xl text-[17px] leading-[1.75] text-ink-soft sm:text-[18px]">
              A model writes the CV. Another model reads it. Rivet replaces that loop with a short, checkable record: a work
              sample against a stated bar, claims with their artifacts, and the questions worth asking.
            </p>
            <p className="mt-4 max-w-xl text-[14px] leading-7 text-ink-muted">
              No keyword filter. No AI detector. No auto-reject. The interviewer reads the evidence and owns the decision.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/enter"
                className={cn(buttonVariants({ variant: "primary", size: "lg" }), "group h-[54px] justify-between rounded-lg px-5 text-[15px] sm:w-[248px]")}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-[11px] font-semibold">NL</span>
                  Open the pre-screen
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/enter"
                className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "group h-[54px] justify-between rounded-lg px-5 text-[15px] sm:w-[218px]")}
              >
                <span className="flex items-center gap-2.5">
                  <Avatar name="Aino" monogram="AV" palette="plum" size="xs" />
                  See the candidate side
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> No CV keyword scan</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> No AI detector</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> No auto-reject</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] lg:mr-0">
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-ink-muted">Pre-screen · evidence packet</p>
                <span className="rounded-full border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">2 open items</span>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-3.5">
                  <Avatar name="Aino Vikström" monogram="AV" palette="plum" size="lg" />
                  <div className="min-w-0">
                    <p className="font-display text-[27px] leading-none tracking-[-0.035em]">Aino Vikström</p>
                    <p className="mt-1.5 text-[12.5px] text-ink-muted">Product-minded frontend engineer · Espoo</p>
                    <p className="mt-1 text-[11px] text-ink-faint">Pre-screening for Product Engineer · Northwind Labs</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-accent/25 bg-accent-tint px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-accent-deep">Work sample</p>
                    <p className="mt-0.5 truncate text-[12px] font-medium text-ink">JavaScript: Data handling · 80/100</p>
                  </div>
                  <span className="shrink-0 rounded border border-accent/25 bg-white px-2 py-1 text-[10px] font-semibold text-accent-deep">Bar 70 · met</span>
                </div>

                <div className="mt-4 border-t border-line pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Claims, checked or still prose</p>
                  <div className="mt-2 space-y-2">
                    {[
                      { status: "Checked", claim: "Returns flow rebuild · 61% → 84% completion", tone: "text-accent-deep" },
                      { status: "Artifact only", claim: "Design-system audit · link opens, claim unchecked", tone: "text-amber-800" },
                      { status: "Employer-confirmed", claim: "Contract frontend engineer at Lumen Retail", tone: "text-ink-soft" },
                      { status: "For conversation", claim: "Prototypes with real copy before components", tone: "text-amber-800" },
                    ].map((row) => (
                      <div key={row.claim} className="flex items-start justify-between gap-3 text-[11px] leading-5">
                        <span className="text-ink-soft">{row.claim}</span>
                        <span className={cn("shrink-0 font-medium", row.tone)}>{row.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-line bg-paper px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">Conversation kit · 26 min</p>
                    <span className="text-[10px] text-ink-faint">3 questions</span>
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-5 text-ink-soft">
                    “You wrote: the design-system audit cut hard-coded colours by 90%. Walk me through what you personally did.”
                  </p>
                  <p className="mt-1 text-[10px] text-ink-faint">Listen for: the artifact, their own contribution, what changed.</p>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                  <span className="inline-flex h-8 flex-1 items-center justify-center rounded-md bg-accent text-[11px] font-medium text-white">Move to interview</span>
                  <span className="inline-flex h-8 flex-1 items-center justify-center rounded-md border border-line text-[11px] font-medium text-ink-muted">Hold</span>
                  <span className="inline-flex h-8 flex-1 items-center justify-center rounded-md border border-line text-[11px] font-medium text-ink-muted">Close</span>
                </div>
                <p className="mt-2 text-center text-[10px] text-ink-faint">A decision with a reason and an audit trail. Synthetic demo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">The CV problem</p>
              <h2 className="mt-4 max-w-lg font-display text-[clamp(2.4rem,4.6vw,3.9rem)] leading-[0.98] tracking-[-0.045em]">
                Two models, no signal.
              </h2>
              <p className="mt-5 max-w-md text-[14.5px] leading-7 text-ink-muted">
                Candidates use AI to make a CV sound right. Hiring teams use AI to guess whether it is. Both sides are
                optimising the same document, and the person doing the work disappears from it.
              </p>
            </div>
            <div className="space-y-3">
              {[
                {
                  title: "The writer rewards fluency",
                  body: "A polished CV says who can prompt well. It does not say who can debug the returns flow, run the analysis or talk a team through a trade-off.",
                },
                {
                  title: "The scanner rewards vocabulary",
                  body: "Keyword scoring is a mirror of the job description. It cannot tell a real project from a plausible sentence, and it leaves no artifact for a reviewer to inspect.",
                },
                {
                  title: "The interview arrives too late",
                  body: "By the time a person reads the work, the funnel has already filtered on prose. The cheapest evidence is also the least informative.",
                },
                {
                  title: "The decision disappears",
                  body: "A score with no reason, no author and no record is impossible to review or improve. Rejections happen by default rather than by a person.",
                },
              ].map((row, index) => (
                <div key={row.title} className="grid grid-cols-[auto_1fr] gap-4 border-t border-line pt-4">
                  <span className="font-display text-[22px] leading-none text-ink-faint">0{index + 1}</span>
                  <div>
                    <p className="text-[15px] font-semibold text-ink">{row.title}</p>
                    <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-ink-muted">{row.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="loop" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">How it works</p>
            <h2 className="mt-4 max-w-2xl font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.98] tracking-[-0.045em]">
              A pre-screen a person can finish.
            </h2>
          </div>
          <p className="max-w-sm text-[14px] leading-7 text-ink-muted">
            One queue per role. A short record per candidate. A decision with a reason. About six minutes per person.
          </p>
        </div>

        <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="border-t border-line pt-5">
              <p className="font-display text-[32px] leading-none text-ink-faint">{step.n}</p>
              <h3 className="mt-4 text-[18px] font-semibold leading-snug text-ink">{step.title}</h3>
              <p className="mt-3 text-[13.5px] leading-7 text-ink-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="inside" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Inside the pre-screen</p>
              <h2 className="mt-4 max-w-xl font-display text-[clamp(2.3rem,4.5vw,3.7rem)] leading-[1.0] tracking-[-0.04em]">
                What replaces the CV scan.
              </h2>
            </div>
            <Link href="/enter" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent">
              Try the interviewer path <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-xl border border-line bg-paper p-5">
                  <Icon className="h-4 w-4 text-accent" aria-hidden />
                  <h3 className="mt-3 text-[15px] font-semibold leading-snug text-ink">{feature.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-6 text-ink-muted">{feature.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-navy px-5 py-4 text-[11.5px] text-white/65">
            <span className="inline-flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-accent-bright" aria-hidden /> No &ldquo;AI-written&rdquo; accusation
            </span>
            <span className="inline-flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-accent-bright" aria-hidden /> No hidden person score
            </span>
            <span className="inline-flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-accent-bright" aria-hidden /> No ranking by model output
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5 text-accent-bright" aria-hidden /> A decision with a name and a reason
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">For candidates</p>
            <h2 className="mt-4 max-w-lg font-display text-[clamp(2.3rem,4.5vw,3.7rem)] leading-[1.0] tracking-[-0.04em]">
              No CV arms race. Show the work.
            </h2>
            <p className="mt-5 max-w-md text-[14.5px] leading-7 text-ink-muted">
              Take one short work sample against the role&apos;s exact bar. Keep the projects and artifacts that show what you
              did. Skip the prose contest you were never going to win.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/enter" className={cn(buttonVariants({ variant: "secondary", size: "md" }), "rounded-md")}>
                See the candidate demo
              </Link>
              <Link href="/how-it-works" className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium text-ink-muted hover:text-ink">
                <FileSearch className="h-3.5 w-3.5" aria-hidden /> How the evidence works
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["One sitting", "The assessment is versioned and taken once. It is a floor, not a personality score."],
              ["Claims with sources", "A project, a link, an employer confirmation. Each claim says what it is."],
              ["A human on the other side", "The reviewer sees the record and the open questions. Nobody is auto-rejected."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl border border-line bg-surface p-4">
                <p className="text-[13px] font-semibold text-ink">{title}</p>
                <p className="mt-1.5 text-[11.5px] leading-5 text-ink-muted">{body}</p>
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
              <p className="mt-0.5 text-[11px] text-ink-muted">Every person, role, score and artifact in this demo is synthetic.</p>
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
