import { NextResponse } from "next/server";
import { z } from "zod";
import { parseFeedPreference } from "@/lib/ai/feed-parse";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  text: z.string().trim().min(2, "Describe who you want to see.").max(400, "Keep the request under 400 characters."),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "employer") return jsonError("The feed is a recruiter-side surface in this demo.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Describe who you want to see.", 400, "invalid_request");
    }
    const result = await parseFeedPreference(parsed.data.text);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
