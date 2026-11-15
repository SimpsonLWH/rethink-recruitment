import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

const criterionSchema = z.object({
  id: z.string().min(1).max(120),
  label: z.string().trim().min(3).max(160),
  kind: z.enum(["MUST_HAVE", "NICE_TO_HAVE", "CONVERSATION"]),
  source: z.enum(["ASSESSMENT", "SIGNAL", "CONVERSATION"]),
  detail: z.string().trim().min(5).max(320),
  ask: z.string().trim().min(5).max(240),
  assessmentId: z.string().max(120).optional(),
  requiredScore: z.number().int().min(0).max(100).optional(),
  signalId: z.string().max(120).optional(),
});

const schema = z.object({ criteria: z.array(criterionSchema).min(1).max(7) });

/** Save the interviewer-owned screening criteria for one role. */
export async function PUT(request: Request, { params }: { params: Promise<{ roleId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "employer") return jsonError("Only a hiring team can edit a screening plan.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid screening plan.", 400, "invalid_request");
    const { roleId } = await params;
    const role = await getRepository().saveScreeningPlan(roleId, session.employer.id, parsed.data.criteria);
    return NextResponse.json({ ok: true, plan: role.screeningPlan });
  } catch (error) {
    return handleRouteError(error);
  }
}
