import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";
import { isMatchStage } from "@/lib/stages";

const schema = z.object({ stage: z.string().min(1) });

export async function PATCH(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "employer") return jsonError("Only a recruiter can move a match.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success || !isMatchStage(parsed.data.stage)) return jsonError("Invalid stage.", 400, "invalid_stage");
    const { matchId } = await params;
    const match = await getRepository().updateMatchStage(matchId, session.employer.id, parsed.data.stage);
    return NextResponse.json({ match });
  } catch (error) {
    return handleRouteError(error);
  }
}
