import { NextResponse } from "next/server";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError } from "@/lib/api";

export async function POST(_request: Request, { params }: { params: Promise<{ assessmentId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "candidate") return jsonError("Only a candidate can take an assessment.", 403, "forbidden");
    const { assessmentId } = await params;
    const attempt = await getRepository().startAssessmentAttempt(assessmentId, session.candidate.id);
    return NextResponse.json({ attempt });
  } catch (error) {
    return handleRouteError(error);
  }
}
