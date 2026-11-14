import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, MapPin, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PRIORITY_INTRO, PriorityIntroIcon } from "@/lib/brand";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ roleId: string }> }): Promise<Metadata> {
  const { roleId } = await params;
  const role = await getRepository().getRoleById(roleId);
  return { title: role ? role.title + " · " + role.employer.name : "Role" };
}

export default async function RolePage({ params }: { params: Promise<{ roleId: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const { roleId } = await params;
  const repo = getRepository();
  const role = await repo.getRoleById(roleId);
  if (!role) notFound();

  const candidate = session.side === "candidate" ? session.candidate : null;
  const tailorable = candidate ? await repo.getTailorableRoles(candidate.id) : [];
  const option = tailorable.find((item) => item.role.id === role.id);
  const isEmployerActiveRole = session.side === "employer" && session.activeRole?.id === role.id;

  const tailorLabel = option
    ? option.draftStatus === "APPROVED"
      ? "View your approved tailoring"
      : option.draftStatus === "DRAFT"
        ? "Continue your tailored profile"
        : "Tailor your record for this role"
    : null;

  return (
    <div className="mx-auto max-w-4xl animate-fade-up">
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to discovery
      </Link>

      <header className="mt-6 rounded-[20px] border border-line bg-surface p-6 sm:p-9">
        <div className="flex items-start gap-4 sm:gap-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-paper font-display text-[19px] font-semibold text-ink-soft">
            {role.employer.logoMark}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{role.employer.name}</p>
            <h1 className="mt-2 font-display text-[clamp(2.1rem,4.6vw,3.3rem)] leading-[0.98] tracking-[-0.04em]">
              {role.title}
            </h1>
          </div>
        </div>

        <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted">
          <span>{role.employmentType}</span>
          <span aria-hidden>·</span>
          <span>{role.workMode}</span>
          <span aria-hidden>·</span>
          <span>{role.location}</span>
          {!role.portfolioRequired && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> No portfolio required
              </span>
            </>
          )}
        </p>

        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-soft">{role.summary}</p>
        <p className="mt-3 text-[12px] leading-5 text-ink-faint">Skills · {role.skills.join(" · ")}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {candidate && option && tailorLabel && (
            <Link
              href={"/tailor/" + role.id}
              className={cn(buttonVariants({ variant: "primary", size: "md" }), "gap-2")}
            >
              {tailorLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {isEmployerActiveRole && (
            <Link href="/discover" className={cn(buttonVariants({ variant: "primary", size: "md" }), "gap-2")}>
              <Users className="h-4 w-4" /> Browse candidates for this role <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-5 text-ink-faint">
          {candidate && option ? (
            <span>Tailoring reuses only your existing facts, and you approve every line.</span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <PriorityIntroIcon className="h-3.5 w-3.5" />
            {candidate
              ? "A " + PRIORITY_INTRO.name.toLowerCase() + " is interest, never a suitability score."
              : "Candidates can send a " +
                PRIORITY_INTRO.name.toLowerCase() +
                " with a one-line reason — interest, never a suitability score."}
          </span>
          <Link
            href="/how-it-works#interest"
            className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink"
          >
            How this works
          </Link>
        </div>
      </header>

      {role.assessment ? (
        <section className="mt-6 rounded-[20px] border border-accent/25 bg-accent-tint p-5 sm:p-6" data-testid="role-assessment-bar">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Evidence for this role</p>
          <p className="mt-2 text-[16px] font-medium text-ink">
            {role.assessment.family} {role.assessment.version} · {role.assessment.difficulty.toLowerCase()} · team bar {role.requiredScore ?? "not set"}
          </p>
          {candidate ? (
            (() => {
              const result = candidate.assessmentResults.find((entry) => entry.assessment.id === role.assessment?.id);
              return result && result.bestScore !== null ? (
                <p className="mt-2 text-[13px] leading-6 text-ink-soft">
                  Your best result: {result.bestScore}/100.{" "}
                  {result.bestScore >= (role.requiredScore ?? 0)
                    ? "You meet this team's stated bar."
                    : "You are below this team's stated bar. The role stays in your below-bar view; you can retake or add evidence."}
                  {" "}
                  <Link href={"/assessments/"+role.assessment.id} className="font-medium text-accent underline decoration-accent/30 underline-offset-4">
                    Open assessment
                  </Link>
                </p>
              ) : (
                <p className="mt-2 text-[13px] leading-6 text-ink-soft">
                  You have not evidenced this yet.{" "}
                  <Link href={"/assessments/"+role.assessment.id} className="font-medium text-accent underline decoration-accent/30 underline-offset-4">
                    Take the assessment
                  </Link>
                </p>
              );
            })()
          ) : (
            <p className="mt-2 text-[13px] leading-6 text-ink-soft">
              Scores are specific to this family, version and difficulty. A below-bar result is not auto-rejected.
            </p>
          )}
        </section>
      ) : null}

      <section className="mt-6 space-y-4">
        <TextModule label="The problem right now">{role.problemNow}</TextModule>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextModule label="Why join us">{role.whyJoin}</TextModule>
          <TextModule label="What good looks like in 90 days">{role.first90}</TextModule>
        </div>
      </section>

      <section className="mt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
          The team, in their own words
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {role.employerPrompts.map((prompt) => (
            <article key={prompt.prompt} className="rounded-[20px] border border-line bg-surface p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{prompt.prompt}</p>
              <p className="mt-3 text-[15px] leading-7 text-ink-soft">{prompt.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[20px] border border-line bg-surface p-6 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
          About {role.employer.name}
        </p>
        <p className="mt-3 max-w-2xl text-[14px] leading-7 text-ink-soft">{role.employer.about}</p>
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-muted">
          <span>{role.employer.industry}</span>
          <span aria-hidden>·</span>
          <span>{role.employer.teamSize}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {role.employer.location}
          </span>
        </p>
      </section>
    </div>
  );
}

function TextModule({ label, children }: { label: string; children: ReactNode }) {
  return (
    <article className="rounded-[20px] border border-line bg-surface p-6 sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{label}</p>
      <p className="mt-3 text-[16px] leading-[1.7] text-ink">{children}</p>
    </article>
  );
}
