import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AssessmentRunner } from "@/components/assessments/assessment-runner";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AssessmentAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const session = await getSession();
  if (!session || session.side !== "candidate") return null;
  const { attemptId } = await params;
  const attempt = await getRepository().getAssessmentAttemptView(attemptId, session.candidate.id);

  if (!attempt) {
    return (
      <div className="mx-auto max-w-2xl" data-testid="attempt-unavailable">
        <Link href="/assessments" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> All assessments
        </Link>
        <div className="mt-5 rounded-[24px] border border-line bg-surface p-6 sm:p-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            <Info className="h-3.5 w-3.5" /> Attempt unavailable
          </p>
          <h1 className="mt-3 font-display text-[32px] leading-tight">This attempt is not on this server instance.</h1>
          <p className="mt-3 text-[13px] leading-6 text-ink-muted">
            The deployed demo keeps its SQLite writes per serverless instance. A saved attempt link can land on an
            instance that did not create it. Start the assessment again from the catalogue; your browser draft and the
            final-score rule still apply.
          </p>
          <Link href="/assessments" className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">
            Back to assessments
          </Link>
        </div>
      </div>
    );
  }

  return <AssessmentRunner attempt={attempt} />;
}
