export type AiStatusMode = "LIVE_NEMOTRON" | "LIVE_GEMINI" | "FALLBACK";

export interface AiSurfaceSummary {
  id: string;
  name: string;
  provider: string;
  model: string;
  status: "live-with-evidence" | "implemented-not-run" | "demo-fallback";
  statusLabel: string;
  implemented: boolean;
  liveCapable: boolean;
  configured: boolean;
  hasLiveRun: boolean;
  hasEvidence: boolean;
  lastLiveAt: string | null;
}

export interface AiStatusSummary {
  mode: AiStatusMode;
  label: string;
  nvidiaConfigured: boolean;
  geminiConfigured: boolean;
  model: string;
  geminiModel: string;
  evidenceEntries: number;
  databaseAvailable: boolean;
  surfaces: AiSurfaceSummary[];
  lastRuns: Array<{
    kind: string;
    provider: string;
    model: string;
    mode: string;
    createdAt: string;
  }>;
}
