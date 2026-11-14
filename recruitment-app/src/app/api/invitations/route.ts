import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

const schema = z.object({
  roleId: z.string().min(1),
  candidateId: z.string().min(1),
  message: z.string().trim().min(1).max(400),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "employer") return jsonError("Only a recruiter can send an invitation.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid invitation.", 400, "invalid_request");
    const invitation = await getRepository().sendInvitation({
      employerId: session.employer.id,
      roleId: parsed.data.roleId,
      candidateId: parsed.data.candidateId,
      message: parsed.data.message,
    });
    return NextResponse.json({ invitation });
  } catch (error) {
    return handleRouteError(error);
  }
}
