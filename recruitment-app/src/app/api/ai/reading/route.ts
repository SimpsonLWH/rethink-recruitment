import { NextResponse } from "next/server";
import { z } from "zod";
import { readEvidence } from "@/lib/ai/orchestrator";
import { buildReadingInput } from "@/lib/ai/reading";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const schema = z.object({
  roleId: z.string().trim().min(1).max(200),
  candidateId: z.string().trim().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "employer") {
      return jsonError("Evidence reading is employer-side.", 403, "forbidden");
    }

    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return jsonError("Choose a candidate and a role.", 400, "invalid_request");
    }

    const review = await getRepository().getEmployerReview(
      parsed.data.roleId,
      parsed.data.candidateId,
      session.employer.id,
    );
    if (!review) {
      return jsonError("That candidate is not available for this role.", 404, "not_found");
    }

    const input = buildReadingInput({
      role: review.role,
      candidate: review.candidate,
      signals: review.signals,
    });
    const result = await readEvidence(input);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
