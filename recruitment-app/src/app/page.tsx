import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  Flower2,
  Heart,
  Link2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/brand/avatar";
import { LinkStatusBadge, ProvenanceBadge, SyntheticTag } from "@/components/brand/evidence-badges";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const counts = [
  { value: "12", label: "fictional candidates" },
  { value: "8", label: "fictional teams" },
  { value: "15", label: "open roles" },
  { value: "3", label: "free roses each" },
];

const steps = [
  {
    n: "01",
    title: "Make a profile that sounds like you",
    body: "Short prompts instead of a CV. A project you're proud of. A problem you actually solved. A team where you do your best work.",
  },
  {
    n: "02",
    title: "Both sides choose",
    body: "Candidates browse roles. Teams browse people. A match needs a yes on both sides — no black-box scoring, no auto-rejection.",
  },
  {
    n: "03",
    title: "A rose says more than a like",
    body: "Three free flowers each. Attach one sentence about why. Roses signal interest, not ability, and never change who sees what first.",
  },
  {
    n: "04",
    title: "For one team, tell your story again",
    body: "Pick which true facts to foreground for a specific role. AI can suggest the order and wording. You approve every line.",
  },
];

const guardrails = [
  {
    icon: Link2,
    title: "A working link is not proof",
    body: "We check whether a URL answers. That's all. Reachability says nothing about whether the claim is true.",
  },
  {
    icon: BadgeCheck,
    title: "Two labels, never merged",
    body: "Link status and provenance live separately. Employer-confirmed facts are simulated seed data in this prototype.",
  },
  {
    icon: Users,
    title: "Humans still decide",
    body: "No automated screening, no secret ranking, no penalty for interest. A human reviews every profile.",
  },
  {
    icon: Flower2,
    title: "Roses are free and equal",
    body: "Three per event for everyone, candidates and employers. Never sold, never used to rank people.",
  },
];

const prompts = [
  "A project I'm proud of",
  "The hardest problem I've solved",
  "My ideal team",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-paper text-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-8 lg:py-6">
        <Link href="/" aria-label="Rivet home">
          <Logo />
        </Link>
        <div className="hidden items-center gap-7 text-[13px] font-medium text-ink-muted md:flex">
          <a className="transition hover:text-ink" href="#why">Why Rivet</a>
          <a className="transition hover:text-ink" href="#how">How it works</a>
          <a className="transition hover:text-ink" href="#guardrails">Guardrails</a>
          <Link className="transition hover:text-ink" href="/about-ai">About the AI</Link>
        </div>
        <div className="flex items-center gap-2">
          <SyntheticTag className="hidden sm:inline-flex">All data synthetic</SyntheticTag>
          <Link href="/enter" className={cn(buttonVariants({ variant: "primary", size: "sm" }), "gap-1.5")}>
            Open the demo <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-rose" />
              Junction 2026 · Espoo career event
            </div>
            <h1 className="font-display text-[clamp(3.4rem,8vw,6.5rem)] font-medium leading-[0.92] tracking-[-0.055em]">
              Hiring goes{" "}
              <span className="relative inline-block italic text-rose">
                both ways.
                <svg
                  className="absolute -bottom-3 left-0 h-3 w-full text-rose/50"
                  viewBox="0 0 300 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M2 8.5C64 3.5 148 2 298 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-[17px] leading-[1.75] text-ink-soft sm:text-[18px]">
              Rivet is a two-sided recruitment event prototype built around short prompts, mutual interest,
              and evidence you can inspect. Not another swipe-for-jobs clone. Not an automated screening tool.
            </p>
            <p className="mt-4 max-w-lg text-sm leading-6 text-ink-muted">
              Pick a fictional candidate or team and try the whole thing. No sign-in, no keys, no real people.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/enter?side=candidate"
                className={cn(
                  buttonVariants({ variant: "accent", size: "lg" }),
                  "group h-[54px] justify-between rounded-[18px] px-5 text-[15px] sm:w-[228px]",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Avatar name="Aino" monogram="AV" palette="rose" size="xs" />
                  I&apos;m a candidate
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/enter?side=employer"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "group h-[54px] justify-between rounded-[18px] border-line-strong px-5 text-[15px] sm:w-[228px]",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-paper">
                    NL
                  </span>
                  I&apos;m an employer
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-rose" /> Takes about 3 minutes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-rose" /> No account needed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-rose" /> Fully synthetic
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[500px] lg:mr-0">
            <div className="absolute -left-8 top-10 hidden h-40 w-40 rounded-full bg-rose/10 blur-3xl sm:block" />
            <div className="relative h-[510px] sm:h-[560px]">
              <div className="absolute left-4 right-4 top-4 h-[470px] rotate-[-4deg] rounded-[30px] border border-line-strong bg-[#F0E8DC] sm:h-[510px]" />
              <div className="absolute left-2 right-2 top-2 h-[470px] rotate-[2.5deg] rounded-[30px] border border-line bg-[#F5EDE2] sm:h-[510px]" />

              <div className="absolute inset-x-0 top-0 overflow-hidden rounded-[30px] border border-line bg-surface shadow-lift">
                <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose" />
                    Candidate · Aino V.
                  </div>
                  <span className="rounded-full border border-line px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                    Demo profile
                  </span>
                </div>

                <div className="px-6 pb-5 pt-6 sm:px-7">
                  <div className="flex items-center gap-3.5">
                    <Avatar name="Aino Vikstrom" monogram="AV" palette="rose" size="lg" />
                    <div>
                      <p className="font-display text-[23px] leading-tight">Aino Vikström</p>
                      <p className="mt-1 text-[12px] text-ink-muted">Product-minded frontend engineer · Espoo</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-line bg-paper/60 p-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-faint">My ideal team</p>
                    <p className="mt-2 font-display text-[20px] leading-[1.35] text-ink">
                      &ldquo;People who argue about the problem before the solution.&rdquo;
                    </p>
                  </div>

                  <div className="mt-3 rounded-2xl border border-line bg-paper/60 p-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-faint">A project I&apos;m proud of</p>
                    <p className="mt-2 font-display text-[18px] leading-[1.4] text-ink-soft">
                      &ldquo;Rebuilt the returns flow so first-time users could finish it without calling support.&rdquo;
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <LinkStatusBadge status="WORKS" />
                      <ProvenanceBadge provenance="SELF_CLAIMED" />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-[11px] text-ink-muted">
                    <Flower2 className="h-4 w-4 text-rose" /> 3 free roses <span className="text-ink-faint">· never for sale</span>
                  </div>
                </div>
              </div>

              <div className="absolute -right-2 -bottom-2 z-20 w-[220px] -rotate-2 rounded-2xl border border-line bg-surface p-4 shadow-lift sm:-right-10 sm:-bottom-4">
                <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-ink-muted">
                  <Flower2 className="h-3.5 w-3.5 text-rose" /> Rose received
                </div>
                <p className="mt-2 font-display text-[17px] leading-[1.35]">
                  &ldquo;Your note on accessible forms is why this role exists.&rdquo;
                </p>
                <p className="mt-2 text-[10px] text-ink-faint">Common Ground · Frontend Engineer</p>
              </div>

              <div className="absolute -left-3 bottom-24 z-20 hidden rotate-2 items-center gap-2 rounded-full border border-line bg-ink px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.09em] text-paper shadow-lift sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-rose" /> It&apos;s a mutual match
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4 lg:mt-24">
          {counts.map((item) => (
            <div key={item.label} className="bg-paper px-5 py-5 text-center sm:py-6">
              <p className="font-display text-[30px] leading-none">{item.value}</p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="why" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="eyebrow">The bit everyone gets wrong</p>
            <h2 className="mt-5 max-w-md font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1.02] tracking-[-0.04em]">
              A CV is a compressed claim. A prompt is a <span className="italic text-rose">conversation.</span>
            </h2>
          </div>
          <div className="space-y-6">
            <p className="text-[17px] leading-[1.8] text-ink-soft">
              Job boards ask people to flatten themselves into bullet points, then feed those bullets into a
              ranking machine. Rivet starts somewhere else: what someone noticed, what they changed, and who
              they want beside them.
            </p>
            <p className="text-[15px] leading-[1.8] text-ink-muted">
              Teams get the same treatment — real prompts, a real problem, not a logo and a list of perks. Both
              sides browse. Both sides decide. A match is only a match when it is mutual.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Prompts", "Not keyword CVs"],
                ["Mutual yes", "Not hidden ranks"],
                ["Sourced claims", "Not blind trust"],
              ].map(([title, subtitle]) => (
                <div key={title} className="rounded-2xl border border-line bg-surface px-4 py-4">
                  <p className="font-display text-[18px]">{title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-ink-muted">{subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <div className="rounded-[26px] border border-line bg-surface p-6 md:col-span-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-rose">
              <MessageCircle className="h-[18px] w-[18px]" />
            </div>
            <h3 className="mt-5 font-display text-[26px] leading-tight">Prompt-first profiles</h3>
            <p className="mt-3 text-[13px] leading-6 text-ink-muted">
              Three questions. Real answers. Enough to start a conversation that isn&apos;t about years of
              experience.
            </p>
          </div>
          <div className="rounded-[26px] border border-line bg-[#F3E8E3] p-6 md:col-span-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-rose/15 bg-surface/70 text-rose">
              <Heart className="h-[18px] w-[18px]" />
            </div>
            <h3 className="mt-5 font-display text-[26px] leading-tight">Interest is two-sided</h3>
            <p className="mt-3 text-[13px] leading-6 text-ink-soft">
              There is no score to game. No invisible penalty for saying yes to a lot of profiles. The other
              side simply has to say yes too.
            </p>
          </div>
          <div className="rounded-[26px] border border-line bg-surface p-6 md:col-span-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-rose">
              <Sparkles className="h-[18px] w-[18px]" />
            </div>
            <h3 className="mt-5 font-display text-[26px] leading-tight">AI that stays in its lane</h3>
            <p className="mt-3 text-[13px] leading-6 text-ink-muted">
              It can find highlights and suggest wording. It cannot invent experience, upgrade provenance, or
              decide anything about a person.
            </p>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-line bg-[#F3EDE4]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">The whole loop</p>
              <h2 className="mt-4 font-display text-[clamp(2.3rem,5vw,4rem)] leading-[1.02] tracking-[-0.04em]">
                Four steps, no mystery.
              </h2>
            </div>
            <p className="max-w-sm text-[13px] leading-6 text-ink-muted">
              Every step is visible in the product. The demo starts with a seeded event so you can walk the
              loop in minutes.
            </p>
          </div>

          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.n} className="relative">
                <div className="flex items-center gap-3">
                  <span className="font-display text-[38px] leading-none text-rose">{step.n}</span>
                  <span className="h-px flex-1 bg-line-strong" />
                </div>
                <h3 className="mt-5 max-w-[220px] font-display text-[24px] leading-[1.15]">{step.title}</h3>
                <p className="mt-3 max-w-[260px] text-[12.5px] leading-6 text-ink-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="guardrails" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="overflow-hidden rounded-[36px] bg-ink text-paper">
          <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
            <div className="relative overflow-hidden border-b border-paper/10 p-7 sm:p-10 lg:border-b-0 lg:border-r">
              <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border border-rose/20" />
              <div className="absolute -right-6 top-3 h-32 w-32 rounded-full border border-rose/15" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-paper/50">The guardrails</p>
              <h2 className="mt-5 max-w-sm font-display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.02]">
                The demo is honest about what it <span className="italic text-rose">doesn&apos;t know.</span>
              </h2>
              <p className="mt-6 max-w-sm text-[13px] leading-6 text-paper/55">
                These are not compliance checkboxes. They are the product. A hiring tool should be legible to
                the people inside it.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-paper/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-paper/65">
                <ShieldCheck className="h-3.5 w-3.5 text-rose" />
                No auto-reject. No opaque score.
              </div>
            </div>
            <div className="grid gap-px bg-paper/10 sm:grid-cols-2">
              {guardrails.map((item) => (
                <div key={item.title} className="bg-ink p-6 sm:p-7">
                  <item.icon className="h-5 w-5 text-rose" />
                  <h3 className="mt-5 font-display text-[22px] leading-tight text-paper">{item.title}</h3>
                  <p className="mt-2.5 text-[12px] leading-[1.75] text-paper/55">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-2 lg:px-8 lg:pb-28">
        <div className="rounded-[36px] border border-line bg-surface p-7 sm:p-10 lg:p-14">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow">Two front doors. One event.</p>
              <h2 className="mt-4 max-w-2xl font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.98] tracking-[-0.045em]">
                Try the side you <span className="italic text-rose">know.</span>
              </h2>
              <p className="mt-5 max-w-lg text-[14px] leading-7 text-ink-muted">
                The event uses fictional people and teams. Choose a persona, look around, send a rose, approve a
                tailored profile. Reseed anytime from the README.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
              <Link href="/enter?side=candidate" className={cn(buttonVariants({ variant: "accent", size: "lg" }), "justify-between rounded-2xl px-5")}>
                <span className="flex items-center gap-2.5">
                  <Heart className="h-4 w-4" /> I&apos;m a candidate
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/enter?side=employer" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "justify-between rounded-2xl px-5")}>
                <span className="flex items-center gap-2.5">
                  <Users className="h-4 w-4" /> I&apos;m an employer
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="mt-10 grid gap-5 border-t border-line pt-7 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Prompts you&apos;ll see</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {prompts.map((prompt) => (
                  <span key={prompt} className="rounded-full border border-line px-2.5 py-1 text-[10px] text-ink-muted">{prompt}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">What is seeded</p>
              <p className="mt-2 text-[11px] leading-5 text-ink-muted">Matches, conversation threads, roses, and employer confirmations are fictional scenario data.</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">What is real</p>
              <p className="mt-2 text-[11px] leading-5 text-ink-muted">Link checks, mutual-match rules, rose limits, approval gates, and every local AI fallback.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <Logo compact />
            <div>
              <p className="text-[12px] font-semibold text-ink-soft">Rivet · Junction 2026</p>
              <p className="mt-0.5 text-[11px] text-ink-muted">Every person, team, link, and confirmation is fictional.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-[11px] text-ink-muted">
            <Link className="transition hover:text-ink" href="/about-ai">About the AI</Link>
            <Link className="transition hover:text-ink" href="/enter">Enter the demo</Link>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-rose" /> Synthetic data</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
