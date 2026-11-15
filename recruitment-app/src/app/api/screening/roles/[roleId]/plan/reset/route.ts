import { NextResponse } from "next/server";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError } from "@/lib/api";

/** Replace a custom plan with a fresh one derived from the role card. */
export async function POST(_request: Request, { params }: { params: Promise<{ roleId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "employer") return jsonError("Only a hiring team can reset a screening plan.", 403, "forbidden");
    const { roleId } = await params;
    const role = await getRepository().resetScreeningPlan(roleId, session.employer.id);
    return NextResponse.json({ ok: true, plan: role.screeningPlan, version: role.screeningPlanVersion });
  } catch (error) {
    return handleRouteError(error);
  }
}
