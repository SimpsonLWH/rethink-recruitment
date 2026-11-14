import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

const schema = z.object({
  roleId: z.string().min(1),
  candidateId: z.string().min(1).optional(),
  action: z.enum(["LIKE", "PASS", "ROSE"]),
  reason: z.string().max(140).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError("Invalid decision.", 400, "invalid_request");

    const actorId = session.side === "candidate" ? session.candidate.id : session.employer.id;
    const candidateId =
      session.side === "candidate" ? session.candidate.id : parsed.data.candidateId;
    if (!candidateId) return jsonError("A candidate is required.", 400, "invalid_request");

    const result = await getRepository().recordDecision({
      side: session.side,
      actorId,
      roleId: parsed.data.roleId,
      candidateId,
      action: parsed.data.action,
      reason: parsed.data.reason,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
