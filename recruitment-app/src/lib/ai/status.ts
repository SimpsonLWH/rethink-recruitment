import { getRepository } from "@/lib/repo";
import type { AiRunView } from "@/lib/repo";
import { isGeminiConfigured, isNvidiaConfigured } from "./config";
import { AI_SURFACES, type AiSurfaceId } from "./inventory";
import { LIVE_EVIDENCE, type LiveEvidenceEntry } from "./live-evidence";

/**
 * Actual-state AI status layer.
 *
 * The status is derived, never hand-written:
 *   - LIVE AiRun rows come from the repository (recorded by the orchestrator
 *     only after a real live call succeeds; cache hits are also LIVE rows).
 *   - Captured live evidence comes from LIVE_EVIDENCE.
 *
 * "live-with-evidence" is only possible when BOTH exist for the same surface.
 * A live run without a captured artifact stays "implemented-not-run".
 * With no evidence captured anywhere, the runtime mode is "demo-fallback".
 */

export type AiSurfaceStatus = "live-with-evidence" | "implemented-not-run" | "demo-fallback";

export interface SurfaceStatusInput {
  surface: string;
  runs: AiRunView[];
  evidence: LiveEvidenceEntry[];
  configured: boolean;
}

export interface SurfaceStatus {
  status: AiSurfaceStatus;
  label: string;
  hasLiveRun: boolean;
  hasEvidence: boolean;
  lastLiveAt: string | null;
}

function latestIso(values: string[]): string | null {
  let latest: string | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    const time = Date.parse(value);
    if (Number.isNaN(time) || time <= latestTime) continue;
    latest = value;
    latestTime = time;
  }
  return latest;
}

function surfaceLabel(
  status: AiSurfaceStatus,
  hasLiveRun: boolean,
  hasEvidence: boolean,
  configured: boolean,
): string {
  if (status === "live-with-evidence") {
    return "Live run recorded with captured evidence";
  }
  if (status === "demo-fallback") {
    return "Demo fallback — deterministic local output only";
  }
  if (hasLiveRun) {
    return "Live run recorded — no captured evidence yet";
  }
  if (hasEvidence) {
    return "Captured evidence present — no matching live run recorded";
  }
  return configured
    ? "Implemented and configured — no live run recorded"
    : "Implemented — not configured and no live run recorded";
}

export function deriveSurfaceStatus(input: SurfaceStatusInput): SurfaceStatus {
  const surfaceRuns = input.runs.filter((run) => run.kind === input.surface);
  const liveRuns = surfaceRuns.filter((run) => run.mode === "LIVE");
  const surfaceEvidence = input.evidence.filter((entry) => entry.surface === input.surface);

  const hasLiveRun = liveRuns.length > 0;
  const hasEvidence = surfaceEvidence.length > 0;
  const lastLiveAt = latestIso(liveRuns.map((run) => run.createdAt));

  let status: AiSurfaceStatus;
  if (hasLiveRun && hasEvidence) {
    status = "live-with-evidence";
  } else if (hasLiveRun) {
    // A live call alone is not evidence: nothing was captured and verified.
    status = "implemented-not-run";
  } else if (surfaceRuns.length > 0 && !hasEvidence) {
    // Only deterministic fallback rows have run on this surface.
    status = "demo-fallback";
  } else {
    status = "implemented-not-run";
  }

  return {
    status,
    label: surfaceLabel(status, hasLiveRun, hasEvidence, input.configured),
    hasLiveRun,
    hasEvidence,
    lastLiveAt,
  };
}

export interface AiSurfaceState extends SurfaceStatus {
  id: AiSurfaceId;
  name: string;
  provider: string;
  model: string;
  liveCapable: boolean;
  implemented: boolean;
  configured: boolean;
}

export interface AiStatusState {
  mode: AiSurfaceStatus;
  label: string;
  generatedAt: string;
  databaseAvailable: boolean;
  evidenceEntries: number;
  configured: {
    nvidia: boolean;
    gemini: boolean;
  };
  surfaces: AiSurfaceState[];
}

interface ConfiguredFlags {
  nvidia: boolean;
  gemini: boolean;
}

function isConfiguredFor(surfaceId: AiSurfaceId, flags: ConfiguredFlags): boolean {
  switch (surfaceId) {
    case "extract":
    case "tailor":
      return flags.nvidia;
    case "ask":
    case "feed-parse-live":
      return flags.gemini;
    default:
      return false;
  }
}

function overallMode(surfaces: SurfaceStatus[], evidenceEntries: number): AiSurfaceStatus {
  if (surfaces.some((surface) => surface.status === "live-with-evidence")) {
    return "live-with-evidence";
  }
  if (evidenceEntries === 0) {
    // No captured live output exists, so the honest runtime mode is fallback.
    return "demo-fallback";
  }
  return "implemented-not-run";
}

function overallLabel(mode: AiSurfaceStatus): string {
  switch (mode) {
    case "live-with-evidence":
      return "At least one surface has a live run with captured evidence; every surface is labelled individually.";
    case "implemented-not-run":
      return "Captured evidence does not match a live run yet; no surface is claimed as live.";
    default:
      return "No captured live output — runtime uses deterministic fallbacks on every surface.";
  }
}

/**
 * Actual state of every AI surface in this checkout.
 *
 * Reads recent runs through the repository (best effort) and combines them
 * with LIVE_EVIDENCE. A missing/unreachable database never throws: it returns
 * a safe no-db state in which nothing is claimed live.
 */
export async function getAiStatusState(): Promise<AiStatusState> {
  const configured: ConfiguredFlags = {
    nvidia: isNvidiaConfigured(),
    gemini: isGeminiConfigured(),
  };

  let runs: AiRunView[] = [];
  let databaseAvailable = true;
  try {
    runs = await getRepository().getRecentAiRuns(50);
  } catch {
    databaseAvailable = false;
    runs = [];
  }

  const surfaces: AiSurfaceState[] = AI_SURFACES.map((surface) => {
    const surfaceConfigured = isConfiguredFor(surface.id, configured);
    return {
      id: surface.id,
      name: surface.name,
      provider: surface.provider,
      model: surface.model,
      liveCapable: surface.liveCapable,
      implemented: surface.implemented,
      configured: surfaceConfigured,
      ...deriveSurfaceStatus({
        surface: surface.id,
        runs,
        evidence: LIVE_EVIDENCE,
        configured: surfaceConfigured,
      }),
    };
  });

  const mode = overallMode(surfaces, LIVE_EVIDENCE.length);
  return {
    mode,
    label: overallLabel(mode),
    generatedAt: new Date().toISOString(),
    databaseAvailable,
    evidenceEntries: LIVE_EVIDENCE.length,
    configured,
    surfaces,
  };
}
