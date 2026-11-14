import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

const schema = z.object({
  matchId: z.string().min(1),
  body: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError("Write a message between 1 and 2,000 characters.", 400, "invalid_request");

    const actorId = session.side === "candidate" ? session.candidate.id : session.employer.id;
    const message = await getRepository().sendMessage(
      parsed.data.matchId,
      session.side,
      actorId,
      parsed.data.body,
    );
    revalidatePath("/matches/" + parsed.data.matchId);
    revalidatePath("/matches");
    return NextResponse.json({ message });
  } catch (error) {
    return handleRouteError(error);
  }
}
