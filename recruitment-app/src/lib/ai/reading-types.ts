export type ReadingRequirementKind = "ASSESSMENT" | "SIGNAL";

export type ReadingRequirementStatus = "met" | "related" | "not_met" | "unknown" | "uncertain";

export interface ReadingFactMeta {
  module?: string;
  title?: string;
  organisation?: string;
  start?: string;
  end?: string | null;
}

export interface ReadingFact {
  id: string;
  prompt: string;
  claim: string;
  skills: string[];
  hasEvidenceLink: boolean;
  meta?: ReadingFactMeta;
}

export interface ReadingRequirement {
  id: string;
  kind: ReadingRequirementKind;
  label: string;
  status: ReadingRequirementStatus;
  detail: string;
  factIds: string[];
  requiredScore?: number;
  recordedScore?: number | null;
}

export interface ReadingInput {
  role: {
    id: string;
    title: string;
    summary: string;
    problemNow: string;
    first90: string;
    skills: string[];
  };
  candidateId: string;
  facts: ReadingFact[];
  requirements: ReadingRequirement[];
}

export interface ReadingCoveredRaw {
  requirementId: string;
  note: string;
  factIds: string[];
  quote: string | null;
}

export interface ReadingGapRaw {
  requirementId: string;
  note: string;
}

export interface EvidenceReadingRaw {
  summary: string;
  covered: ReadingCoveredRaw[];
  gaps: ReadingGapRaw[];
  questions: string[];
  caveats: string[];
}

export interface ReadingCoveredView {
  requirementId: string;
  label: string;
  kind: ReadingRequirementKind;
  status: ReadingRequirementStatus;
  note: string;
  factIds: string[];
  quote: string | null;
}

export interface ReadingGapView {
  requirementId: string;
  label: string;
  kind: ReadingRequirementKind;
  status: ReadingRequirementStatus;
  note: string;
}

export interface EvidenceReadingView {
  summary: string;
  covered: ReadingCoveredView[];
  gaps: ReadingGapView[];
  questions: string[];
  caveats: string[];
}

export type ReadingFallbackReason = "no_key" | "provider_error" | "invalid_output";

export interface ReadingApiResponse {
  engine: string;
  model: string;
  mode: "LIVE" | "FALLBACK";
  fallbackReason?: ReadingFallbackReason;
  latencyMs?: number;
  reading: EvidenceReadingView;
}
