import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Code2, Info, LockKeyhole } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Online assessments",
  description: "Short coding assessments marked against hidden tests. One attempt per recruiting cycle.",
};

function difficultyLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function dateLabel(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AssessmentsPage() {
  const session = await getSession();
  if (!session) return null;
  if (session.side === "employer") {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="Online assessments"
          title="Evidence, not a CV screen."
          description="Candidates solve short coding problems once per recruiting cycle. Recruiters see the exact assessment family, version, difficulty and final score against their own stated bar."
        />
        <Link href="/discover" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">
          Back to review <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const repo = getRepository();
  const [catalog, results] = await Promise.all([
    repo.getAssessmentCatalog(),
    repo.getAssessmentResults(session.candidate.id),
  ]);
  const resultByAssessment = new Map(results.map((result) => [result.assessment.id, result] as const));
  const playable = catalog.filter((assessment) => assessment.playable);
  const catalogueOnly = catalog.filter((assessment) => !assessment.playable);
  const complete = results.filter((result) => result.score !== null).length;

  function actionFor(assessmentId: string) {
    const result = resultByAssessment.get(assessmentId);
    const final = result?.score !== null && result?.score !== undefined;
    const inProgress = Boolean(result?.openAttemptId);
    if (final) {
      return {
        href: result?.attemptId ? "/assessments/attempts/" + result.attemptId : "/assessments/" + assessmentId,
        label: "View result",
        muted: true,
        status: "Final score: " + result?.score + "/100",
        meta: result?.lastSubmittedAt ? "Closed " + dateLabel(result.lastSubmittedAt) : "Closed for this cycle",
      };
    }
    if (inProgress) {
      return {
        href: "/assessments/attempts/" + result?.openAttemptId,
        label: "Continue",
        muted: false,
        status: "Attempt in progress",
        meta: "Not marked yet",
      };
    }
    return { href: "/assessments/" + assessmentId, label: "Start assessment", muted: false, status: "Not attempted", meta: "Public examples available" };
  }

  return (
    <div className="animate-fade-up" data-testid="assessments-page">
      <PageHeader
        eyebrow="Candidate assessments"
        title="Online assessments"
        description="Short coding problems, marked against hidden tests. One attempt per recruiting cycle. There is no retake."
      />

      <div className="mx-auto max-w-4xl space-y-10">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              <Code2 className="h-3.5 w-3.5" /> Playable
            </p>
            <p className="mt-2 text-[20px] font-semibold leading-none">{playable.length}</p>
            <p className="mt-2 text-[11px] leading-5 text-ink-muted">Coding assessments in this demo.</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              <ClipboardCheck className="h-3.5 w-3.5" /> Completed
            </p>
            <p className="mt-2 text-[20px] font-semibold leading-none">{complete}</p>
            <p className="mt-2 text-[11px] leading-5 text-ink-muted">Final results on this profile.</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              <LockKeyhole className="h-3.5 w-3.5" /> Attempt rule
            </p>
            <p className="mt-2 text-[20px] font-semibold leading-none">1</p>
            <p className="mt-2 text-[11px] leading-5 text-ink-muted">Sitting per assessment per cycle.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-accent/25 bg-accent-tint px-4 py-3 text-[12px] leading-5 text-ink-soft">
          <span className="font-medium text-ink">One shot. Server-marked.</span> Write JavaScript, run the public examples
          as often as you like, then submit once. Your code is marked against hidden tests. Submission is final for this
          recruiting cycle, so take the examples seriously.
        </div>

        <section aria-labelledby="open-assessments">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Open now</p>
              <h2 id="open-assessments" className="mt-1 text-[20px] font-semibold leading-tight">Pick a challenge</h2>
              <p className="mt-1 text-[12px] text-ink-faint">Each card is one exact assessment version. Scores do not cross versions.</p>
            </div>
            <p className="text-[11px] text-ink-faint">{playable.length} playable</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {playable.map((assessment) => {
              const action = actionFor(assessment.id);
              return (
                <article
                  key={assessment.id}
                  className="flex flex-col justify-between rounded-[20px] border border-line bg-surface p-5"
                  data-testid={"assessment-row-" + assessment.slug}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                        {assessment.family} · {assessment.version}
                      </p>
                      <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted">
                        {difficultyLabel(assessment.difficulty)}
                      </span>
                    </div>
                    <h3 className="mt-2 text-[17px] font-semibold leading-snug text-ink">{assessment.title}</h3>
                    <p className="mt-1.5 text-[12px] leading-5 text-ink-muted">{assessment.description}</p>
                    <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[11px]">
                      <div>
                        <dt className="text-ink-faint">Problems</dt>
                        <dd className="mt-0.5 font-medium text-ink">{assessment.problemCount}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-faint">Attempts</dt>
                        <dd className="mt-0.5 font-medium text-ink">1, final</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    <div>
                      <p className="text-[12px] font-medium text-ink">{action.status}</p>
                      <p className="mt-0.5 text-[10px] text-ink-faint">{action.meta}</p>
                    </div>
                    <Link
                      href={action.href}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[12px] font-medium",
                        action.muted ? "border border-line text-ink-muted" : "bg-accent text-white",
                      )}
                    >
                      {action.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {catalogueOnly.length > 0 ? (
          <section aria-labelledby="catalogue-assessments">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Catalogue</p>
                <h2 id="catalogue-assessments" className="mt-1 text-[20px] font-semibold leading-tight">Not playable in this demo</h2>
                <p className="mt-1 text-[12px] text-ink-faint">Shown for scope. No coding problems are attached.</p>
              </div>
              <p className="text-[11px] text-ink-faint">{catalogueOnly.length} entries</p>
            </div>
            <div className="mt-3 divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
              {catalogueOnly.map((assessment) => (
                <div key={assessment.id} className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5" data-testid={"assessment-row-" + assessment.slug}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-medium leading-6 text-ink">{assessment.title}</p>
                      <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                        Catalogue only
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {assessment.family} · {assessment.version} · {difficultyLabel(assessment.difficulty)}
                    </p>
                    <p className="mt-1 max-w-2xl text-[12px] leading-5 text-ink-faint">{assessment.description}</p>
                  </div>
                  <span className="text-[11px] text-ink-faint">No problems</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex items-start gap-2 text-[12px] leading-5 text-ink-faint">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Scores are not interchangeable across families, versions or difficulties. There is no universal person
            score, percentile or match percentage.{" "}
            <Link href="/how-it-works" className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4">
              How this fits the demo
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
