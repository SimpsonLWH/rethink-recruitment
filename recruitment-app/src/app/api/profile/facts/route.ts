import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";
import { parseFactMeta } from "@/lib/fact-meta";

const schema = z.object({
  prompt: z.string().trim().min(3).max(120),
  claim: z.string().trim().min(8).max(600),
  skillTags: z.array(z.string().trim().min(1).max(60)).max(6).default([]),
  meta: z.record(z.unknown()).default({}),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "candidate") return jsonError("Only a candidate can add to their profile.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid profile entry.", 400, "invalid_request");
    const meta = parseFactMeta(JSON.stringify(parsed.data.meta));
    const fact = await getRepository().addFact(session.candidate.id, {
      prompt: parsed.data.prompt,
      claim: parsed.data.claim,
      skillTags: parsed.data.skillTags,
      meta,
    });
    return NextResponse.json({ fact });
  } catch (error) {
    return handleRouteError(error);
  }
}
