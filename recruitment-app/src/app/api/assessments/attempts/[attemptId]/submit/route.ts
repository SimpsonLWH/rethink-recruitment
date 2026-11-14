import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";
import { MAX_CODE_LENGTH } from "@/lib/oa-marking";

const schema = z.object({
  submissions: z.record(z.string().max(MAX_CODE_LENGTH)),
  assessmentId: z.string().trim().min(1).max(120).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "candidate") return jsonError("Only a candidate can submit an assessment.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError("Invalid submissions.", 400, "invalid_request");
    const { attemptId } = await params;
    const result = await getRepository().submitAssessmentAttempt(
      attemptId,
      session.candidate.id,
      parsed.data.submissions,
      parsed.data.assessmentId,
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
