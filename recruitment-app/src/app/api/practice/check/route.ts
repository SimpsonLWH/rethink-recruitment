import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";
import { MAX_CODE_LENGTH } from "@/lib/oa-marking";
import { checkPractice } from "@/lib/learn/practice";

const schema = z.object({
  problemId: z.string().trim().min(1).max(80),
  answer: z.string().max(MAX_CODE_LENGTH),
});

/** Practice runs are unlimited and never stored as assessment evidence. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError("Invalid practice check.", 400, "invalid_request");
    const result = checkPractice(parsed.data.problemId, parsed.data.answer);
    if (!result) return jsonError("Practice problem not found.", 404, "not_found");
    return NextResponse.json({ result });
  } catch (error) {
    return handleRouteError(error);
  }
}
