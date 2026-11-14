import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "SUGGESTED"]).optional(),
  editedText: z.string().max(1200).nullable().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ itemId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "candidate") return jsonError("Only the candidate can review their tailoring.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError("Invalid review action.", 400, "invalid_request");
    if (parsed.data.status === undefined && parsed.data.editedText === undefined) {
      return jsonError("Nothing to update.", 400, "invalid_request");
    }
    const { itemId } = await context.params;
    await getRepository().updateTailoringItem({
      itemId,
      candidateId: session.candidate.id,
      status: parsed.data.status,
      editedText: parsed.data.editedText,
    });
    revalidatePath("/tailor");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
