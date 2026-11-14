import {
  NEMOTRON_BASE_URL,
  NEMOTRON_MODEL,
  geminiModel,
} from "./config";

/**
 * Static inventory of every AI-adjacent surface in Rivet.
 *
 * This is the source of truth for "what exists and what it is", not for
 * "what has been proven to work live". Execution evidence is separate:
 *   - LIVE_EVIDENCE in ./live-evidence.ts lists captured live outputs.
 *   - deriveSurfaceStatus()/getAiStatusState() in ./status.ts combine recent
 *     AiRun rows with LIVE_EVIDENCE. Nothing here may claim a live run.
 *
 * Exact model IDs are intentionally spelled out so the audit can be checked
 * against the code. Only the NVIDIA model is a hard-coded constant; Gemini
 * comes from geminiModel() (default gemini-2.5-flash, override GEMINI_MODEL).
 */

export type AiSurfaceId =
  | "extract"
  | "tailor"
  | "ask"
  | "feed-parse-live"
  | "feed-parse-rules"
  | "modal-fit"
  | "gemma";

export interface AiSurface {
  id: AiSurfaceId;
  name: string;
  provider: string;
  model: string;
  baseUrl?: string;
  callPath: string;
  input: string;
  output: string;
  fallback: string;
  liveCapable: boolean;
  implemented: boolean;
  /** Guidance for what a live claim would require. Never a live claim itself. */
  evidenceStatus: string;
  notes: string;
}

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export const AI_SURFACES: readonly AiSurface[] = [
  {
    id: "extract",
    name: "Highlight extraction",
    provider: "NVIDIA",
    model: NEMOTRON_MODEL,
    baseUrl: NEMOTRON_BASE_URL,
    callPath:
      "POST /api/ai/extract -> src/lib/ai/orchestrator.ts#extractHighlights -> src/lib/ai/nemotron.ts#callNemotron (POST {NEMOTRON_BASE_URL}/chat/completions)",
    input: "Candidate free text, trimmed to 1,600 characters.",
    output:
      "Strict JSON { highlights: [{ skill, claim, evidenceUrl: string | null, sourceQuote }] }. Zod-validated server-side; sourceQuote must be contained in the input and evidenceUrl is kept only when the URL appears verbatim in the input.",
    fallback:
      "extractHighlightsLocally() in src/lib/ai/local.ts: deterministic sentence splitting, skill hints, and URL retention only when literally present.",
    liveCapable: true,
    implemented: true,
    evidenceStatus:
      "No captured live output. A live claim would require a real LIVE AiRun plus a redacted LIVE_EVIDENCE entry pointing at a file under audit/live/.",
    notes:
      "Live path requires NVIDIA_API_KEY. Three attempts on 429/5xx with backoff, one JSON repair attempt, a 24-hour SHA-256 response cache, and a deterministic fallback on any failure. No live request has been made in this checkout.",
  },
  {
    id: "tailor",
    name: "Tailoring suggestions",
    provider: "NVIDIA",
    model: NEMOTRON_MODEL,
    baseUrl: NEMOTRON_BASE_URL,
    callPath:
      "POST /api/ai/tailor -> src/lib/ai/orchestrator.ts#suggestTailoring -> src/lib/ai/nemotron.ts#callNemotron",
    input:
      "Up to 8 master-record facts (the prompt payload includes the first 6) plus one role (employer, title, summary, problemNow, skills).",
    output:
      "Strict JSON { suggestions: [{ kind: FOREGROUND | REWORD, sourceFactIds, proposedText, rationale }] }. Zod-validated; unknown source fact IDs and URLs not present in the source facts are rejected.",
    fallback:
      "suggestTailoringLocally() / the deterministic local rewrite path in src/lib/ai: foregrounds facts already in the record and adds no new claim or URL.",
    liveCapable: true,
    implemented: true,
    evidenceStatus:
      "No captured live output. A live claim would require a real LIVE AiRun plus a redacted LIVE_EVIDENCE entry pointing at a file under audit/live/.",
    notes:
      "Same NVIDIA key, retry, repair, cache and fallback discipline as extraction. The model cannot add experience, metrics, evidence, or provenance; a human must approve any line before it is shareable.",
  },
  {
    id: "ask",
    name: "Profile Q&A",
    provider: "Google",
    model: geminiModel(),
    baseUrl: GEMINI_BASE_URL,
    callPath:
      "POST /api/ai/ask -> src/lib/ai/orchestrator.ts#askProfile -> src/lib/ai/gemini.ts#callGemini (models/{model}:generateContent)",
    input: "Up to 8 master-record facts plus one question, trimmed to 300 characters.",
    output:
      "Strict JSON { answer, sourceFactIds }. Zod-validated; every cited fact ID must belong to the candidate's record. Out-of-record questions are refused, not guessed.",
    fallback:
      "answerFromFactsLocally() in src/lib/ai/local.ts: deterministic retrieval over the same facts, with source fact IDs or an explicit out-of-record refusal.",
    liveCapable: true,
    implemented: true,
    evidenceStatus:
      "No captured live output. A live claim would require a real LIVE AiRun plus a redacted LIVE_EVIDENCE entry pointing at a file under audit/live/.",
    notes:
      "Live path requires GEMINI_API_KEY. The model ID is read through geminiModel(), so the effective model is the default gemini-2.5-flash unless GEMINI_MODEL overrides it. No live request has been made in this checkout.",
  },
  {
    id: "feed-parse-live",
    name: "Live feed preference parser (optional)",
    provider: "Google",
    model: geminiModel(),
    baseUrl: GEMINI_BASE_URL,
    callPath:
      "POST /api/feed/parse -> src/lib/ai/feed-parse.ts#parseFeedPreference -> src/lib/ai/gemini.ts#callGemini, gated by RIVET_FEED_PARSER=gemini and GEMINI_API_KEY; the deterministic rules parser (src/lib/feed.ts#parseFeedPreferenceRules) is the default and the fallback.",
    input: "Recruiter preference text, trimmed to 400 characters.",
    output:
      "Structured criteria plus rejected/protected terms and unparsed text ({ criteria, rejected, unparsed }).",
    fallback:
      "Rules-v1 parser in src/lib/feed.ts (the default path, no network, no model).",
    liveCapable: true,
    implemented: true,
    evidenceStatus:
      "No live run and no captured output. Only the rules parser path is exercised; a live claim would need a real LIVE AiRun plus a redacted LIVE_EVIDENCE entry.",
    notes:
      "Opt-in only: wired behind the explicit RIVET_FEED_PARSER=gemini flag plus GEMINI_API_KEY in the final integration, with the rules parser as the default. It has never run live and has no captured evidence in this checkout; no live parser output is claimed.",
  },
  {
    id: "feed-parse-rules",
    name: "Rules feed preference parser (default)",
    provider: "Local",
    model: "rules-v1 (deterministic parser, not a model)",
    callPath:
      "src/lib/feed.ts#parseFeedPreferenceRules; default parser for the customise-feed flow.",
    input: "Recruiter preference text.",
    output:
      "Criteria plus rejected/protected terms and unparsed text ({ criteria, rejected, unparsed }).",
    fallback:
      "This parser is itself the default and the fallback for feed-parse-live.",
    liveCapable: false,
    implemented: true,
    evidenceStatus:
      "Not applicable: local deterministic code with no model output to capture. Exercised by unit tests and the customise-feed UI.",
    notes:
      "No network, no model, no key. scripts/ai-audit.ts measures this parser directly.",
  },
  {
    id: "modal-fit",
    name: "Advisory fit-brief batch (optional Modal job)",
    provider: "Modal (optional Python batch, not a model integration)",
    model: "n/a - computes fit briefs; no language-model call",
    callPath:
      "modal/fit_batch.py (see modal/README.md) with scripts/fit-export.ts and scripts/fit-import.ts. The runtime demo uses the local TypeScript fit briefs in src/lib/fit.ts via scripts/fit-local.ts.",
    input: "Exported synthetic candidate x role dataset (modal/data/dataset.json).",
    output:
      "Advisory fit-brief JSON artifact: shared themes, evidence coverage, and human questions. Import validates source fact IDs and labels generatedBy = \"modal\".",
    fallback:
      "Local TypeScript fit briefs are the only fit-brief path exercised at runtime; the app does not depend on Modal.",
    liveCapable: false,
    implemented: true,
    evidenceStatus:
      "No deployment, remote run, or captured artifact in this checkout. This is not a live model integration.",
    notes:
      "Not deployed and not runtime. No Modal tokens were present. Adding a deploy would not change the demo's local fallback path.",
  },
  {
    id: "gemma",
    name: "Gemma model integration",
    provider: "Google (Gemma family - a different model family from Gemini)",
    model: "n/a - no Gemma model ID exists in the codebase",
    callPath: "None. No client, route, prompt, schema, or validation exists for Gemma.",
    input: "n/a",
    output: "n/a",
    fallback: "n/a - not implemented",
    liveCapable: false,
    implemented: false,
    evidenceStatus: "Not applicable: no integration exists, so there is nothing live to evidence.",
    notes:
      "Explicitly not implemented. Gemini and Gemma are different model families. Adding Gemma would require a new model client, prompt, validation, and evidence surface with no demonstrated task gain; the existing integrations still lack live evidence, so adding another unrun integration would be badge padding. Do not describe this repo as using Gemma.",
  },
];
