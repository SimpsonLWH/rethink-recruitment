import { NextResponse } from "next/server";
import { getRepository } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const event = await getRepository().getEvent();
    return NextResponse.json({ ok: true, event: event.slug, runtime: process.env.VERCEL ? "vercel" : "local" });
  } catch (error) {
    console.error("[health]", error);
    return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 500 });
  }
}
