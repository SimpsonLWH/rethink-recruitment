import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

const criterionCheckSchema = z.object({
  criterionId: z.string().min(1).max(120),
  rating: z.enum(["MEETS", "PARTLY", "NOT_YET", "NOT_ASSESSED"]),
  note: z.string().max(600).optional(),
});

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("claim"),
    factId: z.string().min(1),
    status: z.enum(["VERIFIED", "LINK_ONLY", "NEEDS_CONVERSATION", "NOT_CHECKABLE"]),
    note: z.string().max(600).nullable().optional(),
  }),
  z.object({
    action: z.literal("note"),
    body: z.string().trim().min(2).max(2000),
  }),
  z.object({
    action: z.literal("decision"),
    decision: z.enum(["ADVANCE", "HOLD", "DECLINE"]),
    reason: z.string().trim().min(12).max(1200),
    criterionChecks: z.array(criterionCheckSchema).max(12),
    confirmed: z.literal(true),
    sendOutcome: z.boolean().default(false),
  }),
  z.object({ action: z.literal("reopen") }),
]);

/**
 * Human pre-screen actions. Nothing here scores a person, ranks a person or
 * sends a candidate an automatic outcome.
 */
export async function POST(request: Request, { params }: { params: Promise<{ roleId: string; candidateId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "employer") return jsonError("Only a hiring team can pre-screen.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid pre-screen action.", 400, "invalid_request");
    const { roleId, candidateId } = await params;
    const repo = getRepository();
    const employerId = session.employer.id;

    let packet = null;
    if (parsed.data.action === "claim") {
      packet = await repo.updateScreeningClaim({
        roleId,
        candidateId,
        employerId,
        factId: parsed.data.factId,
        status: parsed.data.status,
        note: parsed.data.note,
      });
    } else if (parsed.data.action === "note") {
      packet = await repo.addScreeningNote({ roleId, candidateId, employerId, body: parsed.data.body });
    } else if (parsed.data.action === "decision") {
      packet = await repo.saveScreeningDecision({
        roleId,
        candidateId,
        employerId,
        decision: parsed.data.decision,
        reason: parsed.data.reason,
        criterionChecks: parsed.data.criterionChecks,
        confirmed: parsed.data.confirmed,
        sendOutcome: parsed.data.sendOutcome,
      });
    } else {
      packet = await repo.reopenScreeningDecision({ roleId, candidateId, employerId });
    }

    return NextResponse.json({ ok: true, packet });
  } catch (error) {
    return handleRouteError(error);
  }
}
