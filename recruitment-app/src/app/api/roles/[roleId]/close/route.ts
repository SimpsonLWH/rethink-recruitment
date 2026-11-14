import { NextResponse } from "next/server";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError } from "@/lib/api";

export async function POST(_request: Request, { params }: { params: Promise<{ roleId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "employer") return jsonError("Only a recruiter can close a role.", 403, "forbidden");
    const { roleId } = await params;
    const outcomes = await getRepository().closeRole(roleId, session.employer.id);
    return NextResponse.json({ closed: true, outcomes });
  } catch (error) {
    return handleRouteError(error);
  }
}
