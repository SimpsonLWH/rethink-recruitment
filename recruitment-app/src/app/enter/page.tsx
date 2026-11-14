import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Check, UserRound } from "lucide-react";
import { AiStatusLine } from "@/components/brand/ai-status-line";
import { Avatar } from "@/components/brand/avatar";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRepository } from "@/lib/repo";
import { selectPersona } from "@/app/actions/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Choose a demo persona",
  description: "Pick a fictional candidate or employer to explore the Rivet prototype.",
};

const RECOMMENDED_CANDIDATE = "cand-aino-vikstrom";
const RECOMMENDED_EMPLOYER = "emp-northwind-labs";

export default async function EnterPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string; error?: string }>;
}) {
  const params = await searchParams;
  const side = params.side === "candidate" ? "candidate" : "employer";
  const repo = getRepository();
  const [candidates, employers, event] = await Promise.all([
    repo.getCandidateDirectory(),
    repo.getEmployerDirectory(),
    repo.getEvent(),
  ]);
  const error = params.error;

  return (
    <main className="flex min-h-screen flex-col bg-paper">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
        <Link href="/" aria-label="Rivet home">
          <Logo />
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/how-it-works" className="hidden text-[13px] font-medium text-ink-muted transition hover:text-ink sm:block">
            How Rivet works
          </Link>
          <Link
            href={side === "candidate" ? "/enter?side=employer" : "/enter?side=candidate"}
            className="text-[13px] font-medium text-ink-muted transition hover:text-ink"
          >
            {side === "candidate" ? "Employer side" : "Candidate side"}
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-5 pb-16 pt-4 lg:px-8 lg:pt-8">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to the concept
            </Link>
            <h1 className="mt-7 max-w-lg font-display text-[clamp(2.8rem,6vw,5rem)] leading-[0.96] tracking-[-0.05em]">
              Pick a seat.
              <br />
              <span className="italic">Not an account.</span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-ink-muted">
              This is the whole authentication layer: choose one of the fictional people or teams at the Junction
              2026 Espoo event. Switch sides whenever you like.
            </p>
            <p className="mt-4 text-[12px] text-ink-faint">No passwords. No real people. No keys.</p>
          </div>

          <div className="rounded-[22px] border border-line bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-faint">The event</p>
                <p className="mt-2 font-display text-[24px] leading-tight">{event.name}</p>
                <p className="mt-1 text-[12px] text-ink-muted">
                  {event.dateLabel} · {event.city}
                </p>
              </div>
              <div className="flex items-center gap-4 rounded-xl border border-line bg-paper px-4 py-3">
                <div>
                  <p className="font-display text-[24px] leading-none">{candidates.length}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-ink-faint">candidates</p>
                </div>
                <span className="h-7 w-px bg-line" />
                <div>
                  <p className="font-display text-[24px] leading-none">{employers.length}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-ink-faint">teams</p>
                </div>
              </div>
            </div>
            <p className="mt-5 border-t border-line pt-4 text-[13px] leading-6 text-ink-muted">
              Start with the recruiter path: create a role card, review evidence, and send one free Priority intro or a
              discovery invitation. Then switch to a candidate and take an assessment.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-line bg-surface px-4 py-3 text-[13px] text-ink-soft">
            That persona could not be found. Pick another seat below.
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-line">
          <div className="flex items-center gap-1">
            <Link
              href="/enter?side=employer"
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-medium transition",
                side === "employer" ? "border-accent text-ink" : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              <Building2 className="h-4 w-4" /> I&apos;m hiring
            </Link>
            <Link
              href="/enter?side=candidate"
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-medium transition",
                side === "candidate" ? "border-accent text-ink" : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              <UserRound className="h-4 w-4" /> I&apos;m a candidate
            </Link>
          </div>
          <p className="hidden items-center gap-1.5 pb-3 text-[11px] text-ink-faint sm:flex">
            <Check className="h-3.5 w-3.5 text-accent" /> Recommended review path is marked
          </p>
        </div>

        {side === "candidate" ? (
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate) => {
              const recommended = candidate.id === RECOMMENDED_CANDIDATE;
              return (
                <form key={candidate.id} action={selectPersona}>
                  <input type="hidden" name="side" value="candidate" />
                  <input type="hidden" name="id" value={candidate.id} />
                  <button
                    type="submit"
                    className={cn(
                      "group flex h-full w-full flex-col rounded-[18px] border bg-surface p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-card",
                      recommended ? "border-accent/40" : "border-line hover:border-line-strong",
                    )}
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <Avatar name={candidate.name} monogram={candidate.monogram} palette={candidate.palette} size="md" />
                      {recommended ? (
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">Start here</span>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-accent" />
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="font-display text-[22px] leading-tight">{candidate.name}</p>
                      <p className="mt-1 text-[12px] leading-5 text-ink-muted">{candidate.headline}</p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                      {candidate.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[11px] text-ink-faint">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                </form>
              );
            })}
          </div>
        ) : (
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {employers.map((employer) => {
              const recommended = employer.id === RECOMMENDED_EMPLOYER;
              return (
                <form key={employer.id} action={selectPersona}>
                  <input type="hidden" name="side" value="employer" />
                  <input type="hidden" name="id" value={employer.id} />
                  <button
                    type="submit"
                    className={cn(
                      "group flex h-full w-full flex-col rounded-[18px] border bg-surface p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-card",
                      recommended ? "border-accent/40" : "border-line hover:border-line-strong",
                    )}
                  >
                    <div className="flex w-full items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink/10 bg-paper font-display text-[15px] font-semibold text-ink-soft">
                        {employer.logoMark}
                      </span>
                      {recommended ? (
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">Start here</span>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-accent" />
                      )}
                    </div>
                    <p className="mt-4 font-display text-[22px] leading-tight">{employer.name}</p>
                    <p className="mt-1 text-[12px] leading-5 text-ink-muted">{employer.tagline}</p>
                    <div className="mt-auto pt-4">
                      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                        {employer.roles.length} open {employer.roles.length === 1 ? "role" : "roles"}
                      </p>
                      <div className="mt-2 space-y-1">
                        {employer.roles.slice(0, 2).map((role) => (
                          <p key={role.id} className="truncate text-[12px] text-ink-soft">
                            · {role.title}
                          </p>
                        ))}
                      </div>
                    </div>
                  </button>
                </form>
              );
            })}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-5 text-[12px] text-ink-muted">
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> All profiles are fictional</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> No ranking or auto-reject</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> Evidence has two labels</span>
          <Link href="/how-it-works" className="font-medium text-ink underline decoration-line-strong underline-offset-4">
            Read how it works
          </Link>
        </div>

        <div className="mt-8">
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-ink-muted")}>
            Back to the concept <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto w-full max-w-7xl px-5 py-5 lg:px-8">
          <AiStatusLine />
        </div>
      </footer>
    </main>
  );
}
