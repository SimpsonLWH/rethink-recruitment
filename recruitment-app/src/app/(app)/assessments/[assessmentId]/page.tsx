import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { StartAssessmentButton } from "@/components/assessments/start-assessment-button";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ assessmentId: string }> }): Promise<Metadata> {
  const { assessmentId } = await params;
  const catalog = await getRepository().getAssessmentCatalog();
  const assessment = catalog.find((entry) => entry.id === assessmentId);
  return { title: assessment?.title ?? "Assessment" };
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Questions</p>
              <p className="mt-1 text-[20px] font-semibold">4 of 8</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Attempts</p>
              <p className="mt-1 text-[20px] font-semibold">{assessment.retakeLimit + 1} max</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Cooldown</p>
              <p className="mt-1 text-[20px] font-semibold">{assessment.cooldownHours}h</p>
            </div>
          </div>

          {result ? (
            <div className="mt-6 rounded-2xl border border-line bg-paper p-4">
              <p className="text-[12px] font-medium text-ink">Your best score: {result.bestScore}/100</p>
              <p className="mt-1 text-[12px] leading-5 text-ink-muted">
                {result.attemptCount} {result.attemptCount === 1 ? "attempt" : "attempts"} this cycle.{" "}
                {result.canRetake
                  ? "A retake is available."
                  : result.cooldownUntil
                    ? "The next retake opens after " + new Date(result.cooldownUntil).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) + "."
                    : "No retake is left this cycle."}
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!assessment.playable ? (
              <span className="text-[12px] text-ink-muted">This catalogue entry is not playable in the demo.</span>
            ) : session.side === "candidate" ? (
              <StartAssessmentButton
                assessmentId={assessment.id}
                label={result ? (result.canRetake ? "Retake assessment" : "Start another attempt") : "Start assessment"}
                disabled={Boolean(result && !result.canRetake)}
              />
            ) : (
              <span className="text-[12px] text-ink-muted">Only a candidate can take this assessment.</span>
            )}
            <span className="text-[11px] leading-5 text-ink-faint">No timer. No proctoring. Synthetic questions.</span>
          </div>
        </div>

        <p className="mt-6 flex items-start gap-2 text-[12px] leading-5 text-ink-faint">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          A score below an employer&apos;s bar does not auto-reject you. It places the role in a secondary view where a
          human can still review your evidence.
        </p>
      </div>
    </div>
  );
}
