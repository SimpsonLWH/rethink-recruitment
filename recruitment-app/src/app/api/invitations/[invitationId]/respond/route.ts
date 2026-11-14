import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

const schema = z.object({ action: z.enum(["ACCEPT", "DECLINE"]) });

export async function POST(request: Request, { params }: { params: Promise<{ invitationId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "candidate") return jsonError("Only the candidate can respond.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError("Invalid response.", 400, "invalid_request");
    const { invitationId } = await params;
    const result = await getRepository().respondToInvitation(
      invitationId,
      session.side,
      session.candidate.id,
      parsed.data.action,
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
