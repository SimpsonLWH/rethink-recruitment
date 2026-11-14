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

/**
 * The role card already answers these three topics. The employer-wide prompt
 * answers would repeat them in the same words, so role detail only shows
 * employer prompts that add a topic the role itself does not cover.
 */
const ROLE_TOPIC_PROMPTS = new Set([
  "why join us",
  "a problem our team is solving right now",
  "what good looks like in 90 days",
]);

function promptTopic(label: string) {
  return label.replace(/\s+/g, " ").trim().toLowerCase();
}

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
  const employerPrompts = role.employerPrompts.filter(
    (prompt) => !ROLE_TOPIC_PROMPTS.has(promptTopic(prompt.prompt)),
  );

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
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-paper text-[17px] font-semibold tracking-[-0.02em] text-ink-soft">
            {role.employer.logoMark}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{role.employer.name}</p>
            <h1 className="mt-2 text-[clamp(1.9rem,3.2vw,2.4rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
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

        <div className="mt-4 space-y-1 text-[12px] leading-5 text-ink-faint">
          {candidate && option ? (
            <p>Tailoring reuses only your existing facts, and you approve every line.</p>
          ) : null}
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <PriorityIntroIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              {candidate
                ? "A " + PRIORITY_INTRO.name + " is interest, never a suitability score."
                : "Candidates can send a " +
                  PRIORITY_INTRO.name +
                  " with a one-line reason. It is interest, never a suitability score."}
            </span>
            <Link
              href="/how-it-works#interest"
              className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink"
            >
              How this works
            </Link>
          </p>
        </div>
      </header>

      {role.assessment ? (
        <section className="mt-6 rounded-[20px] border border-line bg-paper p-5 sm:p-6" data-testid="role-assessment-bar">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Evidence for this role</p>
          <div className="mt-2 space-y-1">
            {(role.requirements.length ? role.requirements : role.assessment ? [{ assessment: role.assessment, requiredScore: role.requiredScore ?? 0, assessmentId: role.assessment.id }] : []).map((requirement) => (
              <p key={requirement.assessmentId} className="text-[15px] font-medium text-ink">
                {requirement.assessment?.family} {requirement.assessment?.version} · {requirement.assessment?.difficulty.toLowerCase()} · team bar {requirement.requiredScore}
              </p>
            ))}
          </div>
          {candidate ? (
            (() => {
              const result = candidate.assessmentResults.find((entry) => entry.assessment.id === role.assessment?.id);
              return result && result.score !== null ? (
                <p className="mt-2 text-[13px] leading-6 text-ink-soft">
                  Your final result: {result.score}/100.{" "}
                  {result.score >= (role.requiredScore ?? 0)
                    ? "You meet this team's stated bar."
                    : "You are below this team's stated bar. The role stays in your below-bar view and a human can still review it; the assessment is final for this cycle."}
                  {" "}
                  <Link href={"/assessments/"+role.assessment.id} className="font-medium text-accent underline decoration-accent/30 underline-offset-4">
                    Open assessment
                  </Link>
                </p>
              ) : result?.openAttemptId ? (
                <p className="mt-2 text-[13px] leading-6 text-ink-soft">
                  You have an attempt in progress.{" "}
                  <Link href={"/assessments/attempts/"+result.openAttemptId} className="font-medium text-accent underline decoration-accent/30 underline-offset-4">
                    Continue the assessment
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

      {employerPrompts.length > 0 ? (
        <section className="mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            The team, in their own words
          </p>
          <div className={cn("mt-4 grid gap-4", employerPrompts.length > 1 && "sm:grid-cols-2")}>
            {employerPrompts.map((prompt, index) => (
              <article
                key={prompt.prompt}
                className={cn(
                  "rounded-[20px] border border-line bg-surface p-6",
                  employerPrompts.length > 1 &&
                    employerPrompts.length % 2 === 1 &&
                    index === employerPrompts.length - 1 &&
                    "sm:col-span-2",
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{prompt.prompt}</p>
                <p className="mt-3 text-[15px] leading-7 text-ink-soft">{prompt.answer}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

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
