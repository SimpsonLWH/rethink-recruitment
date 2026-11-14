import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Check, Flower2, Sparkles, UserRound } from "lucide-react";
import { AiStatusChip } from "@/components/brand/ai-status-chip";
import { Avatar } from "@/components/brand/avatar";
import { Logo } from "@/components/brand/logo";
import { SyntheticTag } from "@/components/brand/evidence-badges";
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
  const side = params.side === "employer" ? "employer" : "candidate";
  const repo = getRepository();
  const [candidates, employers, event] = await Promise.all([
    repo.getCandidateDirectory(),
    repo.getEmployerDirectory(),
    repo.getEvent(),
  ]);
  const error = params.error;

  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="/" aria-label="Rivet home">
          <Logo />
        </Link>
        <div className="flex items-center gap-2.5">
          <AiStatusChip className="hidden sm:inline-flex" />
          <Link href="/about-ai" className="text-[12px] font-medium text-ink-muted transition hover:text-ink">
            About the AI
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 lg:px-8 lg:pt-10">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-ink-muted transition hover:text-ink">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to the concept
            </Link>
            <h1 className="mt-6 max-w-xl font-display text-[clamp(2.8rem,6vw,5.2rem)] leading-[0.98] tracking-[-0.045em]">
              Pick a seat.
              <br />
              <span className="italic text-rose">Not an account.</span>
            </h1>
            <p className="mt-5 max-w-md text-[14px] leading-7 text-ink-muted">
              This is the whole authentication layer: choose one of the fictional people or teams at the
              Junction 2026 Espoo event. Switch sides whenever you like.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <SyntheticTag />
              <span className="text-[11px] text-ink-faint">No passwords. No real people.</span>
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-surface p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-faint">The event</p>
                <p className="mt-1 font-display text-[22px] leading-tight">{event.name}</p>
                <p className="mt-1 text-[11px] text-ink-muted">{event.dateLabel} · {event.city}</p>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-line bg-paper/60 px-4 py-3">
                <div>
                  <p className="font-display text-[24px] leading-none">{candidates.length}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.11em] text-ink-faint">candidates</p>
                </div>
                <span className="h-7 w-px bg-line" />
                <div>
                  <p className="font-display text-[24px] leading-none">{employers.length}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.11em] text-ink-faint">teams</p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-rose-tint px-3.5 py-3 text-[11.5px] leading-5 text-rose-deep">
              <Flower2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Every persona gets <strong>3 free roses</strong>. Send one with a line about why. A rose is
                interest, not a score.
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-rose/20 bg-rose-tint px-4 py-3 text-[12px] text-rose-deep">
            That persona could not be found. Pick another seat below.
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-line">
          <div className="flex items-center gap-1">
            <Link
              href="/enter?side=candidate"
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-semibold transition",
                side === "candidate" ? "border-rose text-ink" : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              <UserRound className="h-4 w-4" /> I&apos;m a candidate
            </Link>
            <Link
              href="/enter?side=employer"
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-semibold transition",
                side === "employer" ? "border-rose text-ink" : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              <Building2 className="h-4 w-4" /> I&apos;m an employer
            </Link>
          </div>
          <p className="hidden items-center gap-1.5 pb-3 text-[11px] text-ink-faint sm:flex">
            <Sparkles className="h-3.5 w-3.5" /> Recommended demo personas are marked
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
                      "group flex h-full w-full flex-col rounded-[22px] border bg-surface p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-card",
                      recommended ? "border-rose/35 ring-1 ring-rose/10" : "border-line hover:border-line-strong",
                    )}
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <Avatar name={candidate.name} monogram={candidate.monogram} palette={candidate.palette} size="md" />
                      {recommended ? (
                        <span className="rounded-full border border-rose/20 bg-rose-tint px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rose-deep">Recommended</span>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-rose" />
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="font-display text-[21px] leading-tight">{candidate.name}</p>
                      <p className="mt-1 text-[11.5px] leading-5 text-ink-muted">{candidate.headline}</p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                      {candidate.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full border border-line px-2 py-1 text-[9.5px] text-ink-muted">{tag}</span>
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
                      "group flex h-full w-full flex-col rounded-[22px] border bg-surface p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-card",
                      recommended ? "border-rose/35 ring-1 ring-rose/10" : "border-line hover:border-line-strong",
                    )}
                  >
                    <div className="flex w-full items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink/10 bg-[#EFE7DB] font-display text-[15px] font-semibold text-ink-soft">
                        {employer.logoMark}
                      </span>
                      {recommended ? (
                        <span className="rounded-full border border-rose/20 bg-rose-tint px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rose-deep">Recommended</span>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-rose" />
                      )}
                    </div>
                    <p className="mt-4 font-display text-[21px] leading-tight">{employer.name}</p>
                    <p className="mt-1 text-[11.5px] leading-5 text-ink-muted">{employer.tagline}</p>
                    <div className="mt-auto pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">{employer.roles.length} open {employer.roles.length === 1 ? "role" : "roles"}</p>
                      <div className="mt-2 space-y-1">
                        {employer.roles.slice(0, 2).map((role) => (
                          <p key={role.id} className="truncate text-[11px] text-ink-soft">· {role.title}</p>
                        ))}
                      </div>
                    </div>
                  </button>
                </form>
              );
            })}
          </div>
        )}

        <div className="mt-12 grid gap-4 rounded-[26px] border border-line bg-[#F3EDE4] p-5 sm:grid-cols-3 sm:p-6">
          {[
            ["All profiles are fictional", "Names, teams, evidence artifacts, and employer confirmations are synthetic demo data."],
            ["No ranking, no auto-reject", "You browse in event order. A human on each side decides."],
            ["Evidence has two labels", "Link status is mechanical. Provenance comes from the record, never from AI."],
          ].map(([title, body]) => (
            <div key={title}>
              <p className="flex items-center gap-2 text-[12px] font-semibold text-ink-soft">
                <Check className="h-3.5 w-3.5 text-rose" /> {title}
              </p>
              <p className="mt-1.5 text-[11px] leading-5 text-ink-muted">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-ink-muted")}>
            Back to the concept <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
