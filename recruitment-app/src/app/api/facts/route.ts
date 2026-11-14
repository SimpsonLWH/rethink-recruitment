import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  sourceText: z.string().min(20).max(1600),
  claim: z.string().trim().min(8).max(500),
  skill: z.string().trim().min(1).max(60),
  evidenceUrl: z.union([z.string().trim().url(), z.null()]).optional(),
  sourceQuote: z.string().trim().min(4).max(800),
});

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "candidate") return jsonError("Only a candidate can add to their master record.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid highlight.", 400, "invalid_request");

    const normalizedSource = normalize(parsed.data.sourceText);
    if (!normalizedSource.includes(normalize(parsed.data.sourceQuote))) {
      return jsonError("That quote is not present in the supplied answer.", 400, "ungrounded");
    }
    if (parsed.data.evidenceUrl && !parsed.data.sourceText.includes(parsed.data.evidenceUrl)) {
      return jsonError("The evidence link must appear in the supplied answer; the app will not invent links.", 400, "ungrounded_link");
    }

    const fact = await getRepository().addFact(session.candidate.id, {
      prompt: "AI-extracted highlight",
      claim: parsed.data.claim,
      skillTags: [parsed.data.skill],
      evidenceUrl: parsed.data.evidenceUrl ?? null,
    });
    revalidatePath("/profile");
    return NextResponse.json({ fact });
  } catch (error) {
    return handleRouteError(error);
  }
}
