import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

const schema = z.object({
  headline: z.string().trim().min(3).max(120).optional(),
  bio: z.string().trim().min(10).max(700).optional(),
  location: z.string().trim().max(120).optional(),
  interests: z.array(z.string().trim().min(1).max(60)).max(8).optional(),
  availability: z.string().trim().max(160).optional(),
  discoveryOptIn: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "candidate") return jsonError("Only a candidate can edit this profile.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid profile.", 400, "invalid_request");
    const candidate = await getRepository().updateCandidateProfile(session.candidate.id, parsed.data);
    return NextResponse.json({ candidate });
  } catch (error) {
    return handleRouteError(error);
  }
}
