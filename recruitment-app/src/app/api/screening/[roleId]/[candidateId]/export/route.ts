import { NextResponse } from "next/server";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { jsonError } from "@/lib/api";

/**
 * Portable pre-screen record for the hiring team's own audit trail.
 * Employer-only. The export contains what the packet shows; it is not an
 * assessment score, a recommendation or a candidate ranking.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ roleId: string; candidateId: string }> }) {
  const session = await getSession();
  if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
  if (session.side !== "employer") return jsonError("Only a hiring team can export a pre-screen record.", 403, "forbidden");
  const { roleId, candidateId } = await params;
  const packet = await getRepository().getScreeningPacket(roleId, candidateId, session.employer.id);
  if (!packet) return jsonError("Screening record not found.", 404, "not_found");

  const record = {
    generatedAt: new Date().toISOString(),
    synthetic: true,
    disclaimer:
      "Synthetic demo record. It is a structured pre-screen note, not a recommendation, a suitability score or a ranking. A human made the decision.",
    employer: { id: session.employer.id, name: packet.employerName },
    role: {
      id: packet.role.id,
      slug: packet.role.slug,
      title: packet.role.title,
      workMode: packet.role.workMode,
      location: packet.role.location,
    },
    candidate: {
      id: packet.candidate.id,
      slug: packet.candidate.slug,
      name: packet.candidate.name,
      headline: packet.candidate.headline,
      availability: packet.candidate.availability,
    },
    plan: {
      version: packet.planVersion,
      currentVersion: packet.currentPlanVersion,
      frozenAtDecision: !packet.planIsCurrent,
      criteria: packet.plan,
    },
    criteria: packet.criteria.map((result) => ({
      id: result.criterion.id,
      label: result.criterion.label,
      kind: result.criterion.kind,
      source: result.criterion.source,
      status: result.status,
      evidence: result.evidenceLine,
      humanRating: result.humanRating,
    })),
    workSamples: packet.workSamples,
    claims: packet.claims.map((claim) => ({
      id: claim.claim.id,
      claim: claim.claim.claim,
      provenance: claim.claim.provenance,
      context: claim.claim.context ?? false,
      artifactUrl: claim.claim.evidenceUrl,
      linkStatus: claim.claim.linkStatus,
      status: claim.status,
      basis: claim.basis,
      note: claim.note,
    })),
    decision: {
      status: packet.run.status,
      stage: packet.run.stage,
      reason: packet.run.decisionReason,
      basis: packet.run.decisionBasis,
      decidedBy: packet.run.decidedBy,
      decidedAt: packet.run.decidedAt,
    },
    notes: packet.run.notes,
    auditTrail: packet.run.events,
    summary: {
      state: packet.summary.state,
      headline: packet.summary.headline,
      supporting: packet.summary.supporting,
      open: packet.summary.open,
      nextActions: packet.summary.nextActions,
    },
  };

  const filename = "rivet-pre-screen-" + packet.role.slug + "-" + packet.candidate.slug + ".json";
  return new NextResponse(JSON.stringify(record, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="' + filename + '"',
      "cache-control": "no-store",
    },
  });
}
