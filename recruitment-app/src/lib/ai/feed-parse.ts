import { createHash } from "node:crypto";
import { getRepository } from "@/lib/repo";
import { geminiModel, isGeminiConfigured } from "./config";
import { callGemini } from "./gemini";
import { parseModelJson } from "./json";
import { feedParseMessages } from "./prompts";
import { validateFeedParse } from "./validation";
import {
  parseFeedPreferenceRules,
  type FeedCriterion,
  type FeedCriterionKind,
  type FeedParseResult,
} from "@/lib/feed";

export interface FeedParseServiceResult extends FeedParseResult {
  engine: "rules" | "gemini-live";
  model: string;
  mode: "LIVE" | "FALLBACK";
}

function sha(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown error";
}

function criterionLabel(kind: FeedCriterionKind, value: string, years?: number): string {
  if (kind === "SKILL") return "Skill: " + value;
  if (kind === "DOMAIN") return "Domain: " + value;
  return "Experience: " + (years ?? 0) + "+ years" + (value ? " " + value : "");
}

function toCriterion(kind: FeedCriterionKind, value: string, years?: number): FeedCriterion {
  const clean = value.trim();
  return {
    id: kind.toLowerCase() + ":" + clean.toLowerCase() + (years ? ":" + years : ""),
    kind,
    value: clean,
    label: criterionLabel(kind, clean, years),
    ...(kind === "SKILL" ? { skill: clean } : {}),
    ...(kind === "EXPERIENCE" ? { skill: clean || undefined, years: years ?? 0 } : {}),
  };
}

function liveEnabled() {
  return process.env.RIVET_FEED_PARSER?.trim().toLowerCase() === "gemini" && isGeminiConfigured();
}

async function recordRun(input: {
  kind: string;
  provider: string;
  model: string;
  mode: "LIVE" | "FALLBACK";
  status: string;
  latencyMs?: number;
  error?: string | null;
}) {
  try {
    await getRepository().recordAiRun(input);
  } catch {
    // Observability is best-effort; the demo must never depend on it.
  }
}

async function readCache(key: string) {
  try {
    return await getRepository().getCachedAi(key);
  } catch {
    return null;
  }
}

async function writeCache(key: string, value: unknown) {
  try {
    await getRepository().saveAiCache(key, "feed-parse", JSON.stringify(value));
  } catch {
    // Cache failures are harmless.
  }
}

/**
 * The customise-feed parse service.
 *
 * The deterministic rules parser (rules-v1) is always the default. A live
 * Gemini parse only runs when the developer explicitly sets
 * RIVET_FEED_PARSER=gemini AND GEMINI_API_KEY in the local environment. It has
 * never run in this checkout and no live output is claimed. Any live failure
 * returns the rules result and records honest fallback metadata.
 */
export async function parseFeedPreference(text: string): Promise<FeedParseServiceResult> {
  const clean = text.trim().slice(0, 400);
  const rules = parseFeedPreferenceRules(clean);

  if (!liveEnabled()) {
    await recordRun({
      kind: "feed-parse-rules",
      provider: "local",
      model: "rules-v1",
      mode: "FALLBACK",
      status: "rules",
    });
    return { ...rules, engine: "rules", model: "rules-v1", mode: "FALLBACK" };
  }

  const model = geminiModel();
  const key = sha("feed-parse:v1:" + model + ":" + clean);
  const cached = await readCache(key);
  if (cached) {
    try {
      const validated = validateFeedParse(JSON.parse(cached) as unknown);
      if (validated.criteria.length > 0) {
        const criteria = validated.criteria.map((criterion) =>
          toCriterion(criterion.kind, criterion.value, criterion.years),
        );
        await recordRun({ kind: "feed-parse-live", provider: "gemini", model, mode: "LIVE", status: "cache" });
        return {
          criteria,
          rejected: validated.rejected,
          unparsed: validated.unparsed,
          engine: "gemini-live",
          model,
          mode: "LIVE",
        };
      }
    } catch {
      // Invalid cache entries are ignored; the live call or rules path replaces them.
    }
  }

  const started = Date.now();
  try {
    const call = await callGemini(feedParseMessages(clean), { maxTokens: 600 });
    const raw = parseModelJson(call.text);
    const validated = validateFeedParse(raw);
    if (validated.criteria.length === 0) {
      throw new Error("The live parser returned no usable criteria.");
    }
    const parsed = {
      criteria: validated.criteria.map((criterion) => toCriterion(criterion.kind, criterion.value, criterion.years)),
      rejected: validated.rejected,
      unparsed: validated.unparsed,
    };
    await writeCache(key, parsed);
    await recordRun({
      kind: "feed-parse-live",
      provider: "gemini",
      model: call.model,
      mode: "LIVE",
      status: "ok",
      latencyMs: call.latencyMs,
    });
    return {
      ...parsed,
      engine: "gemini-live",
      model: call.model,
      mode: "LIVE",
    };
  } catch (error) {
    await recordRun({
      kind: "feed-parse-live",
      provider: "gemini",
      model,
      mode: "FALLBACK",
      status: "error-fallback",
      latencyMs: Date.now() - started,
      error: errorMessage(error),
    });
    return { ...rules, engine: "rules", model: "rules-v1", mode: "FALLBACK" };
  }
}
