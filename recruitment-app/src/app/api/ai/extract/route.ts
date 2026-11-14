import { NextResponse } from "next/server";
import { z } from "zod";
import { extractHighlights } from "@/lib/ai/orchestrator";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  text: z.string().trim().min(20, "Add at least a sentence to extract from.").max(1600, "Keep the answer under 1,600 characters."),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "candidate") return jsonError("Highlight extraction is candidate-side.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid text.", 400, "invalid_request");
    const result = await extractHighlights(parsed.data.text);
    return NextResponse.json({
      engine: result.engine,
      model: result.model,
      mode: result.mode,
      highlights: result.highlights,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
