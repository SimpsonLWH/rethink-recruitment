import { NextResponse } from "next/server";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { jsonError } from "@/lib/api";

function cell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

/** CSV export of the hiring team's recorded decisions. Employer-only. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
  if (session.side !== "employer") return jsonError("Only a hiring team can export the decision log.", 403, "forbidden");

  const decisions = await getRepository().getScreeningDecisions(session.employer.id, { limit: 200 });
  const origin = new URL(request.url).origin;
  const headers = [
    "synthetic",
    "candidate",
    "role",
    "outcome",
    "reason",
    "basis",
    "decided_by",
    "assigned_reviewer",
    "decided_at",
    "hours_to_decision",
    "outcome_sent_at",
    "record_url",
  ];
  const rows = decisions.map((decision) => {
    const hours = decision.decidedAt
      ? (new Date(decision.decidedAt).getTime() - new Date(decision.createdAt).getTime()) / (60 * 60 * 1000)
      : null;
    return [
      "true",
      decision.candidateName,
      decision.roleTitle,
      decision.status,
      decision.reason,
      decision.basis,
      decision.decidedBy,
      decision.assignedReviewerName ?? "",
      decision.decidedAt,
      hours === null || !Number.isFinite(hours) ? "" : (Math.round(hours * 10) / 10).toString(),
      decision.outcomeSentAt,
      origin + "/prescreen/" + decision.roleId + "/" + decision.candidateId,
    ]
      .map(cell)
      .join(",");
  });
  const csv = [headers.map(cell).join(","), ...rows].join("\r\n") + "\r\n";
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="rivet-pre-screen-decisions-' + date + '.csv"',
      "cache-control": "no-store",
    },
  });
}
