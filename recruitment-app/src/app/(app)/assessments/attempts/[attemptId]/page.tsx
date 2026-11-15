import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { EmptyState } from "@/components/brand/empty-state";
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
      <div className="mx-auto max-w-2xl animate-fade-up" data-testid="attempt-unavailable">
        <Link href="/assessments" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> All assessments
        </Link>
        <EmptyState
          className="mt-5"
          icon={Info}
          title="This attempt is not on this server instance."
          body="Each saved attempt lives on the demo server that started it, so a saved link can open a copy that never saw it. Start the assessment again from the catalogue; your browser draft and the one-attempt rule still apply."
          action={
            <Link href="/assessments" className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-[12px] font-medium text-white">
              Back to assessments
            </Link>
          }
        />
      </div>
    );
  }

  return <AssessmentRunner attempt={attempt} />;
}
