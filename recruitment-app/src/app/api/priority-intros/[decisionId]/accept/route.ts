import { NextResponse } from "next/server";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError } from "@/lib/api";

export async function POST(_request: Request, { params }: { params: Promise<{ decisionId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    const actorId = session.side === "candidate" ? session.candidate.id : session.employer.id;
    const { decisionId } = await params;
    const result = await getRepository().acceptPriorityIntro(decisionId, session.side, actorId);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
