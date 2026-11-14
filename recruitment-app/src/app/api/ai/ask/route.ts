import { NextResponse } from "next/server";
import { z } from "zod";
import { askProfile } from "@/lib/ai/orchestrator";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  candidateId: z.string().min(1),
  question: z.string().trim().min(4).max(240),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "employer") return jsonError("Profile Q&A is employer-side in this demo.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError("Ask a question under 240 characters.", 400, "invalid_request");
    const candidate = await getRepository().getCandidateById(parsed.data.candidateId);
    if (!candidate) return jsonError("Candidate not found.", 404, "not_found");
    const result = await askProfile(candidate.facts, parsed.data.question, candidate.name);
    return NextResponse.json({
      answer: result.answer,
      sources: result.sources,
      engine: result.engine,
      model: result.model,
      mode: result.mode,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
