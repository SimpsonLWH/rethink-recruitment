import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Check, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AiStatusLine } from "@/components/brand/ai-status-line";
import { buttonVariants } from "@/components/ui/button";
import { Hash, Mail } from "lucide-react";
import { getSession } from "@/lib/session";
import { SAMPLE_ACCOUNTS, SAMPLE_QUANT_EMPLOYER } from "@/lib/auth";
import { signInAccount, signInSample, signOutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Open the interviewer pre-screen demo or the candidate evidence flow. No CV scan, no AI detector, no auto-reject.",
};

function errorCopy(error?: string) {
  if (error === "invalid") return "That email and password did not match an account.";
  if (error === "missing") return "Enter an email and password.";
  if (error === "sample") return "The sample account is not available in this seed. Run npm run seed.";
  return null;
}

export default async function EnterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const error = errorCopy(params.error);

  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
        <Link href="/" aria-label="Rivet">
          <Logo />
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/how-it-works" className="hidden text-[13px] font-medium text-ink-muted transition hover:text-ink sm:block">
            How it works
          </Link>
          <Link href="/" className="text-[13px] font-medium text-ink-muted transition hover:text-ink">
            Back to concept
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-4 lg:px-8 lg:pt-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Junction 2026 · Espoo</p>
          <h1 className="mt-4 text-[clamp(2.2rem,4vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
            Sign in.
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-ink-muted">
            Open the interviewer pre-screen to check a work sample and a claim record, or see the candidate side that
            produces the evidence. A CV is optional context; it is never scanned or scored.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> No CV keyword scan</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> No AI detector</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> No auto-reject</span>
          </div>
        </div>

        {session ? (
          <div className="mt-8 rounded-xl border border-line bg-surface px-4 py-3 text-[13px] text-ink-soft">
            You are signed in as <span className="font-medium text-ink">{session.side === "candidate" ? session.candidate.name : session.employer.name}</span>.
            <Link href="/dashboard" className="ml-2 font-medium text-accent underline decoration-accent/30 underline-offset-4">Continue to dashboard</Link>
            <form action={signOutAction} className="ml-2 inline">
              <button type="submit" className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4">Sign out</button>
            </form>
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-[13px] text-ink-soft" data-testid="auth-error">
            {error}
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <section className="order-2 rounded-xl border border-line bg-surface p-6 sm:p-8" data-testid="candidate-account-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">For candidates</p>
                <h2 className="mt-2 text-[24px] font-semibold leading-tight">Candidate account</h2>
                <p className="mt-2 max-w-md text-[13px] leading-6 text-ink-muted">
                  Start with a short work sample and a structured record. A CV is optional context; it is never scanned
                  or scored. Browse roles that ask for evidence you can actually provide.
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-ink-muted">
                <UserRound className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-6 rounded-xl border border-line bg-paper p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Sample candidate</p>
              <p className="mt-2 text-[14px] font-medium text-ink">{SAMPLE_ACCOUNTS.candidate.label}</p>
              <p className="mt-1 text-[12px] leading-5 text-ink-muted">{SAMPLE_ACCOUNTS.candidate.description}</p>
              <p className="mt-2 font-mono text-[11px] text-ink-faint">
                {SAMPLE_ACCOUNTS.candidate.email} · {SAMPLE_ACCOUNTS.candidate.password}
              </p>
              <form action={signInSample} className="mt-4">
                <input type="hidden" name="side" value="candidate" />
                <button type="submit" className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-full justify-between gap-2")} data-testid="sample-candidate">
                  Open candidate demo <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link href="/signup?side=candidate" className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-line px-4 text-[12px] font-medium text-ink">
                Create candidate account
              </Link>
              <Link href="/how-it-works#assessments" className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-line px-4 text-[12px] font-medium text-ink-muted">
                How evidence works
              </Link>
            </div>
          </section>

          <section className="order-1 rounded-xl border border-line bg-surface p-6 sm:p-8" data-testid="employer-account-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">For hiring teams</p>
                <h2 className="mt-2 text-[24px] font-semibold leading-tight">Hiring account</h2>
                <p className="mt-2 max-w-md text-[13px] leading-6 text-ink-muted">
                  Turn a role into a screening plan, check claims against their artifacts, and leave with a conversation
                  kit and a decision that has a reason.
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-ink-muted">
                <BriefcaseBusiness className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-6 rounded-xl border border-line bg-paper p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Sample hiring team</p>
              <p className="mt-2 text-[14px] font-medium text-ink">{SAMPLE_ACCOUNTS.employer.label}</p>
              <p className="mt-1 text-[12px] leading-5 text-ink-muted">{SAMPLE_ACCOUNTS.employer.description}</p>
              <p className="mt-2 font-mono text-[11px] text-ink-faint">
                {SAMPLE_ACCOUNTS.employer.email} · {SAMPLE_ACCOUNTS.employer.password}
              </p>
              <form action={signInSample} className="mt-4">
                <input type="hidden" name="side" value="employer" />
                <button type="submit" className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-full justify-between gap-2")} data-testid="sample-employer">
                  Open pre-screen demo <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div className="mt-3 rounded-xl border border-line bg-paper p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Sample quant hiring team</p>
              <p className="mt-2 text-[14px] font-medium text-ink">{SAMPLE_QUANT_EMPLOYER.label}</p>
              <p className="mt-1 text-[12px] leading-5 text-ink-muted">{SAMPLE_QUANT_EMPLOYER.description}</p>
              <p className="mt-2 font-mono text-[11px] text-ink-faint">
                {SAMPLE_QUANT_EMPLOYER.email} · {SAMPLE_QUANT_EMPLOYER.password}
              </p>
              <form action={signInSample} className="mt-4">
                <input type="hidden" name="side" value="employer" />
                <input type="hidden" name="sample" value="quant" />
                <button type="submit" className={cn(buttonVariants({ variant: "secondary", size: "md" }), "w-full justify-between gap-2")} data-testid="sample-quant-employer">
                  Open quant recruiter demo <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link href="/signup?side=employer" className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-line px-4 text-[12px] font-medium text-ink">
                Create hiring account
              </Link>
              <Link href="/how-it-works#prescreen" className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-line px-4 text-[12px] font-medium text-ink-muted">
                How pre-screening works
              </Link>
            </div>
          </section>
        </div>

        <div className="mt-8 rounded-xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                <LogIn className="h-4 w-4" /> Already have a temporary account?
              </p>
              <p className="mt-1 text-[12px] text-ink-muted">Sign in with the email and password from sign-up.</p>
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-ink-faint">
              <ShieldCheck className="h-3.5 w-3.5" /> Demo auth only. No email verification.
            </p>
          </div>
          <form action={signInAccount} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="block text-[12px] font-medium text-ink-soft">
              Email
              <span className="mt-1.5 flex h-11 items-center gap-2 rounded-lg border border-line bg-paper px-3">
                <Mail className="h-4 w-4 text-ink-faint" />
                <input name="email" type="email" required className="h-full w-full bg-transparent text-[13px] text-ink outline-none" placeholder="you@example.com" data-testid="login-email" />
              </span>
            </label>
            <label className="block text-[12px] font-medium text-ink-soft">
              Password
              <span className="mt-1.5 flex h-11 items-center gap-2 rounded-lg border border-line bg-paper px-3">
                <Hash className="h-4 w-4 text-ink-faint" />
                <input name="password" type="password" required className="h-full w-full bg-transparent text-[13px] text-ink outline-none" placeholder="At least 6 characters" data-testid="login-password" />
              </span>
            </label>
            <button type="submit" className={cn(buttonVariants({ variant: "primary", size: "md" }), "h-11 self-end")} data-testid="login-submit">
              Sign in <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <div className="mt-10 grid gap-4 text-[12px] leading-5 text-ink-muted sm:grid-cols-3">
          <p className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> No CV screening. Evidence is assessment-specific.</p>
          <p className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> No ranking, no match percentage, no automatic rejection.</p>
          <p className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> Every person, employer and assessment is synthetic.</p>
        </div>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-5 text-[11px] text-ink-muted sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <AiStatusLine />
          <Link href="/how-it-works" className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4">Read the rules</Link>
        </div>
      </footer>
    </main>
  );
}