import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Info, LockKeyhole } from "lucide-react";
import { Note } from "@/components/brand/note";
import { PageHeader } from "@/components/brand/page-header";
import { AssessmentEntry } from "@/components/assessments/assessment-entry";
import { ProctoringChip, proctoringLabel } from "@/components/assessments/integrity-badge";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { assessmentTitle } from "@/lib/ui-copy";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ assessmentId: string }> }): Promise<Metadata> {
  const { assessmentId } = await params;
  const catalog = await getRepository().getAssessmentCatalog();
  const assessment = catalog.find((entry) => entry.id === assessmentId);
  return { title: assessment ? assessmentTitle(assessment.title) : "Assessment" };
}

function submittedLabel(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
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
    <div className="mx-auto max-w-2xl animate-fade-up" data-testid="assessment-detail">
      <Link href="/assessments" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> All assessments
      </Link>
      <div className="mt-5">
        <PageHeader
          title={assessmentTitle(assessment.title)}
          description={assessment.description}
          className="pb-2"
        />
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[12px] leading-5 text-ink-faint">
            {assessment.family} · Version {assessment.version}
          </p>
          <ProctoringChip mode={assessment.proctoring} durationMinutes={assessment.durationMinutes} />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-surface p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Problems</p>
            <p className="mt-1 text-[20px] font-semibold tabular-nums">{assessment.problemCount}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Time limit</p>
            <p className="mt-1 text-[20px] font-semibold tabular-nums">
              {assessment.durationMinutes > 0 ? assessment.durationMinutes + " min" : "None"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Integrity</p>
            <p className="mt-1 text-[20px] font-semibold">{proctoringLabel(assessment.proctoring)}</p>
          </div>
        </div>

        <Note className="mt-6">
          <span className="flex items-center gap-2 font-medium text-ink">
            <LockKeyhole className="h-3.5 w-3.5 text-ink-muted" /> One sitting per recruiting cycle
          </span>
          <span className="mt-1.5 block">
            There is no retake and no cooldown. Once you submit, the result is final for this cycle. Leave and return
            as often as you like before submitting; your open attempt is kept.
          </span>
        </Note>

        {submitted ? (
          <div className="mt-6 rounded-xl border border-line bg-paper p-4">
            <p className="text-[12px] font-medium text-ink">Final score: {result?.score}/100</p>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">
              Closed for this recruiting cycle.
              {result?.lastSubmittedAt ? " Attempt submitted " + submittedLabel(result.lastSubmittedAt) + "." : ""}
            </p>
            {result?.attemptId ? (
              <Link
                href={"/assessments/attempts/" + result.attemptId}
                className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-4 text-[12px] font-medium text-ink"
              >
                View score breakdown <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        ) : openAttemptId ? (
          <div className="mt-6 rounded-xl border border-line bg-paper p-4">
            <p className="text-[12px] font-medium text-ink">Attempt in progress</p>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">
              Nothing has been marked yet. Continue when you are ready, and your draft code in this browser is kept.
            </p>
          </div>
        ) : null}

        {assessment.playable && assessment.problemCount > 0 && !submitted && !openAttemptId ? (
          <div className="mt-6 rounded-xl border border-line bg-paper p-4">
            <p className="text-[12px] font-medium text-ink">
              {assessment.problemCount} coding {assessment.problemCount === 1 ? "problem" : "problems"} in this sitting
            </p>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">
              {assessment.family === "Quant"
                ? "Questions are revealed when you start. Expect multiple-choice and numeric answers, or short JavaScript functions on price data."
                : "The problems are revealed when you start. Each one asks you to write a single JavaScript function. You can run the sample cases as often as you like before the final submission."}
            </p>
            {assessment.durationMinutes > 0 ? (
              <p className="mt-2 text-[12px] leading-5 text-ink-muted">
                The {assessment.durationMinutes}-minute clock starts when you open the test and keeps running if you
                leave. Answers submit automatically at zero.
              </p>
            ) : null}
            {assessment.proctoring === "LOCKDOWN" ? (
              <p className="mt-2 text-[12px] leading-5 text-ink-muted">
                Browser lockdown: the test needs fullscreen, copy and paste are blocked, and leaving the test three
                times submits it. No camera or microphone is used.
              </p>
            ) : assessment.proctoring === "PROCTORED" ? (
              <p className="mt-2 text-[12px] leading-5 text-ink-muted">
                Proctored: tab switches, focus loss and paste attempts are logged with times and shown to reviewing
                employers. Nothing is blocked and no camera is used.
              </p>
            ) : null}
            <Link href="/learn" className="mt-3 inline-flex text-[12px] font-medium text-accent hover:text-accent-deep">
              Warm up in Prepare first
            </Link>
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
          <span className="text-[11px] leading-5 text-ink-faint">
            Synthetic problems.{" "}
            {assessment.durationMinutes > 0 ? assessment.durationMinutes + "-minute timer." : "No timer."}{" "}
            {assessment.proctoring === "NONE" ? "Not proctored." : proctoringLabel(assessment.proctoring) + ", browser events only."}
          </span>
        </div>
      </div>

      <p className="mt-6 flex items-start gap-2 text-[12px] leading-5 text-ink-faint">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        A score below an employer&apos;s bar does not auto-reject you. It places the role in a secondary view where a
        human can still review your evidence. It does not reopen the assessment.
      </p>
    </div>
  );
}