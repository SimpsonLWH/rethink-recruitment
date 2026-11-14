import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Info, LockKeyhole } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { AssessmentEntry } from "@/components/assessments/assessment-entry";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ assessmentId: string }> }): Promise<Metadata> {
  const { assessmentId } = await params;
  const catalog = await getRepository().getAssessmentCatalog();
  const assessment = catalog.find((entry) => entry.id === assessmentId);
  return { title: assessment?.title ?? "Assessment" };
}

function difficultyLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default async function AssessmentDetailPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const { assessmentId } = await params;
  const repo = getRepository();
  const [catalog, results] = await Promise.all([
    repo.getAssessmentCatalog(),
    session.side === "candidate" ? repo.getAssessmentResults(session.candidate.id) : Promise.resolve([]),
  ]);
  const assessment = catalog.find((entry) => entry.id === assessmentId);
  if (!assessment) notFound();
  const result = results.find((entry) => entry.assessment.id === assessment.id);
  const submitted = result?.score !== null && result?.score !== undefined;
  const openAttemptId = result?.openAttemptId ?? null;

  return (
    <div className="animate-fade-up" data-testid="assessment-detail">
      <Link href="/assessments" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> All assessments
      </Link>
      <div className="mx-auto mt-5 max-w-2xl">
        <PageHeader
          eyebrow={assessment.family + " · " + assessment.version + " · " + assessment.difficulty.toLowerCase()}
          title={assessment.title}
          description={assessment.description}
        />

        <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Problems</p>
              <p className="mt-1 text-[20px] font-semibold">{assessment.problemCount}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Language</p>
              <p className="mt-1 text-[20px] font-semibold">JavaScript</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Attempts</p>
              <p className="mt-1 text-[20px] font-semibold">1, final</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-accent/25 bg-accent-tint p-4">
            <p className="flex items-center gap-2 text-[12px] font-medium text-ink">
              <LockKeyhole className="h-3.5 w-3.5 text-accent" /> One sitting per recruiting cycle
            </p>
            <p className="mt-1.5 text-[12px] leading-5 text-ink-soft">
              There is no retake and no cooldown. Once you submit, the result is final for this cycle. Leave and return
              as often as you like before submitting; your open attempt is kept.
            </p>
          </div>

          {submitted ? (
            <div className="mt-6 rounded-2xl border border-line bg-paper p-4">
              <p className="text-[12px] font-medium text-ink">Final score: {result?.score}/100</p>
              <p className="mt-1 text-[12px] leading-5 text-ink-muted">
                Closed for this recruiting cycle.
                {result?.lastSubmittedAt
                  ? " Submitted " + new Date(result.lastSubmittedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) + "."
                  : ""}
              </p>
              {result?.attemptId ? (
                <Link
                  href={"/assessments/attempts/" + result.attemptId}
                  className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[12px] font-medium text-ink"
                >
                  View score breakdown <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          ) : openAttemptId ? (
            <div className="mt-6 rounded-2xl border border-line bg-paper p-4">
              <p className="text-[12px] font-medium text-ink">Attempt in progress</p>
              <p className="mt-1 text-[12px] leading-5 text-ink-muted">
                Nothing has been marked yet. Continue when you are ready, and your draft code in this browser is kept.
              </p>
            </div>
          ) : null}

          {assessment.playable && assessment.problemCount > 0 && !submitted && !openAttemptId ? (
            <div className="mt-6 rounded-2xl border border-line bg-paper p-4">
              <p className="text-[12px] font-medium text-ink">{assessment.problemCount} coding {assessment.problemCount === 1 ? "problem" : "problems"} in this sitting</p>
              <p className="mt-1 text-[12px] leading-5 text-ink-muted">
                The problems are revealed when you start. Each one asks you to write a single JavaScript function. You
                can run the public examples as often as you like before the final submission.
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!assessment.playable ? (
              <span className="text-[12px] text-ink-muted">This catalogue entry is not playable in the demo.</span>
            ) : session.side === "candidate" ? (
              submitted ? (
                <span className="rounded-full border border-line px-4 py-2 text-[12px] font-medium text-ink-muted">Assessment closed</span>
              ) : openAttemptId ? (
                <AssessmentEntry assessment={assessment} label="Continue attempt" continueAttempt />
              ) : (
                <AssessmentEntry assessment={assessment} />
              )
            ) : (
              <span className="text-[12px] text-ink-muted">Only a candidate can take this assessment.</span>
            )}
            <span className="text-[11px] leading-5 text-ink-faint">Synthetic problems. No timer. No proctoring.</span>
          </div>
        </div>

        <p className="mt-6 flex items-start gap-2 text-[12px] leading-5 text-ink-faint">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          A score below an employer&apos;s bar does not auto-reject you. It places the role in a secondary view where a
          human can still review your evidence. It does not reopen the assessment.
        </p>
      </div>
    </div>
  );
}
