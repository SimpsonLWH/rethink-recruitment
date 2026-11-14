import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { createAccountAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a temporary candidate or hiring account and enter the matching flow.",
};

function errorCopy(error?: string) {
  if (error === "details") return "Add a name, a valid email and a password of at least 6 characters.";
  if (error === "email") return "That email is already used. Try signing in instead.";
  return null;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string; error?: string }>;
}) {
  const params = await searchParams;
  const side = params.side === "employer" ? "employer" : "candidate";
  const error = errorCopy(params.error);
  const candidate = side === "candidate";

  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6 lg:px-8">
        <Link href="/" aria-label="Rivet"><Logo /></Link>
        <Link href="/enter" className="text-[13px] font-medium text-ink-muted transition hover:text-ink">Back to sign in</Link>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-20 pt-4 lg:px-8 lg:pt-8">
        <Link href="/enter" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Choose a side
        </Link>

        <div className="mt-7 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Temporary account</p>
            <h1 className="mt-4 text-[clamp(2rem,3.6vw,2.8rem)] font-semibold leading-[1.04] tracking-[-0.03em]">
              {candidate ? "Create a candidate account." : "Create a hiring account."}
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-ink-muted">
              {candidate
                ? "Create a candidate account, upload a CV or choose a sample, then browse roles and complete assessments."
                : "Create a hiring account, choose the assessments you accept and the score you need, then review candidates."}
            </p>
            <div className="mt-6 space-y-3 text-[12px] leading-5 text-ink-muted">
              <p className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> Demo data only. Nothing is sent to a real employer.</p>
              <p className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> No CV screening and no automated decision.</p>
              <p className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> You can sign in later with this email and password.</p>
            </div>

            <div className="mt-8 rounded-xl border border-line bg-surface p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Or use a sample account</p>
              <Link href="/enter" className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-accent">
                Open the sample candidate or recruiter <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex rounded-full border border-line p-1">
              <Link
                href="/signup?side=candidate"
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium",
                  candidate ? "bg-ink text-paper" : "text-ink-muted",
                )}
              >
                <UserRound className="h-3.5 w-3.5" /> Candidate
              </Link>
              <Link
                href="/signup?side=employer"
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium",
                  !candidate ? "bg-ink text-paper" : "text-ink-muted",
                )}
              >
                <BriefcaseBusiness className="h-3.5 w-3.5" /> Hiring team
              </Link>
            </div>

            {error ? <p className="mt-4 rounded-xl border border-line bg-paper px-3 py-2 text-[12px] text-ink-soft">{error}</p> : null}

            <form action={createAccountAction} className="mt-6 space-y-4" data-testid="signup-form">
              <input type="hidden" name="side" value={side} />
              <label className="block text-[12px] font-medium text-ink-soft">
                {candidate ? "Your name" : "Team or company name"}
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                  className="mt-1.5 h-11 w-full rounded-lg border border-line bg-paper px-3 text-[13px] text-ink outline-none focus:border-accent"
                  placeholder={candidate ? "Alex Example" : "Example Studio"}
                  data-testid="signup-name"
                />
              </label>
              <label className="block text-[12px] font-medium text-ink-soft">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-1.5 h-11 w-full rounded-lg border border-line bg-paper px-3 text-[13px] text-ink outline-none focus:border-accent"
                  placeholder="you@example.com"
                  data-testid="signup-email"
                />
              </label>
              <label className="block text-[12px] font-medium text-ink-soft">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="mt-1.5 h-11 w-full rounded-lg border border-line bg-paper px-3 text-[13px] text-ink outline-none focus:border-accent"
                  placeholder="At least 6 characters"
                  data-testid="signup-password"
                />
              </label>
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent px-5 text-[13px] font-medium text-white transition hover:bg-accent-deep"
                data-testid="signup-submit"
              >
                Continue to {candidate ? "CV setup" : "hiring setup"} <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-4 text-[11px] leading-5 text-ink-faint">
              Temporary demo authentication. No email verification, password reset, payment or real personal data.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}