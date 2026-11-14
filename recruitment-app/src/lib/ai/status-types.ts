export type AiStatusMode = "LIVE_NEMOTRON" | "LIVE_GEMINI" | "FALLBACK";

export interface AiStatusSummary {
  mode: AiStatusMode;
  label: string;
  nvidiaConfigured: boolean;
  geminiConfigured: boolean;
  modalConfigured: boolean;
  model: string;
  geminiModel: string;
  lastRuns: Array<{
    kind: string;
    provider: string;
    model: string;
    mode: string;
    createdAt: string;
  }>;
}
