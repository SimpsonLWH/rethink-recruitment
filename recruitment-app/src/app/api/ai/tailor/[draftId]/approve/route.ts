import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ draftId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "candidate") return jsonError("Only the candidate can approve a tailored profile.", 403, "forbidden");
    const { draftId } = await context.params;
    await getRepository().approveTailoringDraft(draftId, session.candidate.id);
    revalidatePath("/tailor");
    revalidatePath("/profile");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
