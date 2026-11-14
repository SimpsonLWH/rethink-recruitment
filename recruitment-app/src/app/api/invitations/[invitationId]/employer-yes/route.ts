import { NextResponse } from "next/server";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError } from "@/lib/api";

export async function POST(_request: Request, { params }: { params: Promise<{ invitationId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "employer") return jsonError("Only a recruiter can respond.", 403, "forbidden");
    const { invitationId } = await params;
    const result = await getRepository().respondToAcceptedInvitation(invitationId, session.employer.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
