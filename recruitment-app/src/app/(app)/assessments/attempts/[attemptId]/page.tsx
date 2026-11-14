import { notFound } from "next/navigation";
import { AssessmentRunner } from "@/components/assessments/assessment-runner";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AssessmentAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const session = await getSession();
  if (!session || session.side !== "candidate") return null;
  const { attemptId } = await params;
  const attempt = await getRepository().getAssessmentAttemptView(attemptId, session.candidate.id);
  if (!attempt) notFound();
  return <AssessmentRunner attempt={attempt} />;
}
