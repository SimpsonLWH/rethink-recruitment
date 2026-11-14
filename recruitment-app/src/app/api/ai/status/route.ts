import { NextResponse } from "next/server";
import {
  DEFAULT_GEMINI_MODEL,
  NEMOTRON_MODEL,
  geminiModel,
  isGeminiConfigured,
  isModalConfigured,
  isNvidiaConfigured,
} from "@/lib/ai/config";
import { getRepository } from "@/lib/repo";
import type { AiStatusSummary } from "@/lib/ai/status-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const nvidiaConfigured = isNvidiaConfigured();
  const geminiConfigured = isGeminiConfigured();
  let runs: AiStatusSummary["lastRuns"] = [];
  try {
    runs = (await getRepository().getRecentAiRuns(8)).map((run) => ({
      kind: run.kind,
      provider: run.provider,
      model: run.model,
      mode: run.mode,
      createdAt: run.createdAt,
    }));
  } catch {
    // Status endpoint should still answer before a database is seeded.
  }

  const last = runs[0];
  const mode: AiStatusSummary["mode"] =
    last?.mode === "LIVE"
      ? last.provider === "gemini"
        ? "LIVE_GEMINI"
        : "LIVE_NEMOTRON"
      : "FALLBACK";
  const summary: AiStatusSummary = {
    mode,
    label:
      mode === "LIVE_NEMOTRON"
        ? "AI: live (Nemotron)"
        : mode === "LIVE_GEMINI"
          ? "AI: live (Gemini)"
          : "AI: demo fallback",
    nvidiaConfigured,
    geminiConfigured,
    modalConfigured: isModalConfigured(),
    model: NEMOTRON_MODEL,
    geminiModel: geminiModel() || DEFAULT_GEMINI_MODEL,
    lastRuns: runs,
  };
  return NextResponse.json(summary);
}
