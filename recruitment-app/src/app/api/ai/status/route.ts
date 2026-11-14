import { NextResponse } from "next/server";
import {
  DEFAULT_GEMINI_MODEL,
  NEMOTRON_MODEL,
  geminiModel,
} from "@/lib/ai/config";
import { getAiStatusState } from "@/lib/ai/status";
import { getRepository } from "@/lib/repo";
import type { AiStatusMode, AiStatusSummary } from "@/lib/ai/status-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getAiStatusState();
  let lastRuns: AiStatusSummary["lastRuns"] = [];
  try {
    lastRuns = (await getRepository().getRecentAiRuns(12)).map((run) => ({
      kind: run.kind,
      provider: run.provider,
      model: run.model,
      mode: run.mode,
      createdAt: run.createdAt,
    }));
  } catch {
    // The status endpoint should still answer before a database is seeded.
  }

  const liveSurfaces = state.surfaces.filter((surface) => surface.status === "live-with-evidence");
  const firstLive = liveSurfaces[0];
  const mode: AiStatusMode = firstLive
    ? firstLive.provider === "Google"
      ? "LIVE_GEMINI"
      : "LIVE_NEMOTRON"
    : "FALLBACK";
  const label = firstLive ? "AI: live (evidence logged)" : "AI features: demo mode";

  const summary: AiStatusSummary = {
    mode,
    label,
    nvidiaConfigured: state.configured.nvidia,
    geminiConfigured: state.configured.gemini,
    model: NEMOTRON_MODEL,
    geminiModel: geminiModel() || DEFAULT_GEMINI_MODEL,
    evidenceEntries: state.evidenceEntries,
    databaseAvailable: state.databaseAvailable,
    surfaces: state.surfaces.map((surface) => ({
      id: surface.id,
      name: surface.name,
      provider: surface.provider,
      model: surface.model,
      status: surface.status,
      statusLabel: surface.label,
      implemented: surface.implemented,
      liveCapable: surface.liveCapable,
      configured: surface.configured,
      hasLiveRun: surface.hasLiveRun,
      hasEvidence: surface.hasEvidence,
      lastLiveAt: surface.lastLiveAt,
    })),
    lastRuns,
  };

  return NextResponse.json(summary);
}