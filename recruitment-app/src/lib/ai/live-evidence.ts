/**
 * Index of captured live-model evidence.
 *
 * This list is intentionally EMPTY in this checkout: no live model call has
 * been made here, no live output has been captured, and no live integration
 * may be claimed from an empty list.
 *
 * When a real, authorised live run is captured, add one entry per redacted
 * artifact stored under audit/live/. The rules live in audit/live/README.md.
 * Never commit API keys, tokens, cookies, or Authorization headers. Redact
 * them from the capture before hashing and committing the file.
 *
 * The status layer (./status.ts) only reports "live-with-evidence" when a
 * LIVE AiRun row exists AND a matching entry exists in this list.
 */

export interface LiveEvidenceEntry {
  /** AI surface id from AI_SURFACES in ./inventory.ts (e.g. "extract"). */
  surface: string;
  /** Provider name (e.g. "NVIDIA"). */
  provider: string;
  /** Exact model ID used for the captured call. */
  model: string;
  /** ISO-8601 timestamp of when the live response was captured. */
  capturedAt: string;
  /** Redacted capture file, relative to the repository root. */
  file: string;
  /** SHA-256 of the redacted capture file contents. */
  sha256: string;
  /** What was removed before committing, named explicitly. */
  redactions: string[];
}

/** No live evidence exists in this checkout. Do not add entries by hand. */
export const LIVE_EVIDENCE: LiveEvidenceEntry[] = [];

/** True when a captured live artifact is registered for this surface. */
export function hasLiveEvidence(surface: string): boolean {
  return LIVE_EVIDENCE.some((entry) => entry.surface === surface);
}

/** Captured live artifacts registered for one surface. */
export function evidenceForSurface(surface: string): LiveEvidenceEntry[] {
  return LIVE_EVIDENCE.filter((entry) => entry.surface === surface);
}
