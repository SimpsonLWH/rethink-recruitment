import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { suggestTailoring } from "@/lib/ai/orchestrator";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({ roleId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "candidate") return jsonError("Tailoring is candidate-side.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError("Choose a role to tailor for.", 400, "invalid_request");

    const repo = getRepository();
    const tailorable = await repo.getTailorableRoles(session.candidate.id);
    if (!tailorable.some((option) => option.role.id === parsed.data.roleId)) {
      return jsonError("You can only tailor for a role you liked or matched with.", 403, "forbidden");
    }
    const existing = await repo.getTailoringDraft(session.candidate.id, parsed.data.roleId);
    if (existing?.status === "APPROVED") {
      return NextResponse.json({ draft: existing, engine: existing.engine, model: existing.model, mode: "FALLBACK" });
    }
    const role = await repo.getRoleById(parsed.data.roleId);
    if (!role) return jsonError("Role not found.", 404, "not_found");
    if (session.candidate.facts.length === 0) {
      return jsonError("Add at least one fact to your master record before tailoring.", 400, "empty_record");
    }

    const result = await suggestTailoring(session.candidate.facts, role, session.candidate.name);
    const draft = await repo.replaceTailoringDraft({
      candidateId: session.candidate.id,
      roleId: role.id,
      engine: result.engine,
      model: result.model,
      note: result.note,
      suggestions: result.suggestions.map((suggestion) => ({
        kind: suggestion.kind,
        sourceFactIds: suggestion.sourceFactIds,
        suggestedText: suggestion.proposedText,
        rationale: suggestion.rationale,
      })),
    });
    revalidatePath("/tailor");
    revalidatePath("/profile");
    return NextResponse.json({ draft, engine: result.engine, model: result.model, mode: result.mode });
  } catch (error) {
    return handleRouteError(error);
  }
}
