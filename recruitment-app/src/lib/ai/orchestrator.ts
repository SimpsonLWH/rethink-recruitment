import { createHash } from "node:crypto";
import { getRepository } from "@/lib/repo";
import type { FactView, RoleDetail } from "@/lib/repo";
import { isGeminiConfigured, isNvidiaConfigured, NEMOTRON_MODEL } from "./config";
import { callGemini } from "./gemini";
import { callNemotron } from "./nemotron";
import { parseModelJson } from "./json";
import { answerFromFactsLocally, extractHighlightsLocally, suggestTailoringLocally } from "./local";
import { askMessages, extractionMessages, tailoringMessages } from "./prompts";
import type { AskResult, Highlight, TailoringSuggestion } from "./schemas";
import { validateAsk, validateHighlights, validateTailoring } from "./validation";

export interface AiResultMeta {
  engine: string;
  model: string;
  mode: "LIVE" | "FALLBACK";
}

export interface ExtractionResult extends AiResultMeta {
  highlights: Highlight[];
}

export interface TailoringResult extends AiResultMeta {
  suggestions: TailoringSuggestion[];
  note: string | null;
}

export interface AskSource {
  factId: string;
  prompt: string;
  excerpt: string;
}

export interface ProfileAskResult extends AiResultMeta {
  answer: string;
  sources: AskSource[];
}

const warned = new Set<string>();

function warnFallback(kind: string, reason: string) {
  if (warned.has(kind)) return;
  warned.add(kind);
  console.warn("[ai] " + kind + " using deterministic demo fallback: " + reason);
}

function sha(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown error";
}

async function readCache(key: string): Promise<string | null> {
  try {
    return await getRepository().getCachedAi(key);
  } catch {
    return null;
  }
}

async function writeCache(key: string, kind: string, value: unknown) {
  try {
    await getRepository().saveAiCache(key, kind, JSON.stringify(value));
  } catch {
    // Caching should never break a demo.
  }
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
    // Observability is best-effort.
  }
}

function repairMessages<T extends { role: "system" | "user" | "assistant"; content: string }>(
  messages: T[],
  raw: string,
  validationError: unknown,
): T[] {
  return [
    ...messages,
    { role: "assistant", content: raw.slice(0, 2000) } as T,
    {
      role: "user",
      content:
        "Your previous output was invalid: " +
        errorMessage(validationError).slice(0, 300) +
        ". Return ONLY one valid JSON object with exactly the requested schema. Do not add prose, markdown, provenance, or new facts/links.",
    } as T,
  ];
}

export async function extractHighlights(text: string): Promise<ExtractionResult> {
  const source = text.trim().slice(0, 1600);
  const key = sha("extract:v1:" + NEMOTRON_MODEL + ":" + source);
  const cached = await readCache(key);
  if (cached) {
    try {
      const highlights = validateHighlights(JSON.parse(cached) as unknown, source);
      await recordRun({ kind: "extract", provider: "nvidia", model: NEMOTRON_MODEL, mode: "LIVE", status: "cache" });
      return { highlights, engine: "nemotron-cache", model: NEMOTRON_MODEL, mode: "LIVE" };
    } catch {
      // Stale or invalid cache entries are ignored; the live call below will replace them.
    }
  }

  if (isNvidiaConfigured()) {
    const started = Date.now();
    let latency = 0;
    try {
      const messages = extractionMessages(source);
      const call = await callNemotron(messages, { maxTokens: 700 });
      latency = call.latencyMs;
      let raw: unknown;
      try {
        raw = parseModelJson(call.text);
        validateHighlights(raw, source);
      } catch (firstError) {
        const repaired = await callNemotron(repairMessages(messages, call.text, firstError), {
          maxTokens: 700,
        });
        latency += repaired.latencyMs;
        raw = parseModelJson(repaired.text);
      }
      const highlights = validateHighlights(raw, source);
      await writeCache(key, "extract", highlights);
      await recordRun({
        kind: "extract",
        provider: "nvidia",
        model: NEMOTRON_MODEL,
        mode: "LIVE",
        status: "ok",
        latencyMs: latency,
      });
      return { highlights, engine: "nemotron-live", model: NEMOTRON_MODEL, mode: "LIVE" };
    } catch (error) {
      warnFallback("extract", errorMessage(error));
      await recordRun({
        kind: "extract",
        provider: "nvidia",
        model: NEMOTRON_MODEL,
        mode: "FALLBACK",
        status: "error-fallback",
        latencyMs: Date.now() - started,
        error: errorMessage(error),
      });
    }
  } else {
    warnFallback("extract", "NVIDIA_API_KEY is not set");
    await recordRun({
      kind: "extract",
      provider: "local",
      model: "deterministic-local",
      mode: "FALLBACK",
      status: "local-fallback",
    });
  }

  const highlights = extractHighlightsLocally(source);
  return {
    highlights,
    engine: "fallback",
    model: "deterministic-local",
    mode: "FALLBACK",
  };
}

export async function suggestTailoring(
  facts: FactView[],
  role: RoleDetail,
  candidateName: string,
): Promise<TailoringResult> {
  const usableFacts = facts.slice(0, 8);
  const key = sha(
    "tailor:v1:" +
      NEMOTRON_MODEL +
      ":" +
      role.id +
      ":" +
      usableFacts.map((fact) => fact.id + "|" + sha(fact.claim)).join(":"),
  );
  const cached = await readCache(key);
  if (cached) {
    try {
      const suggestions = validateTailoring(JSON.parse(cached) as unknown, usableFacts);
      await recordRun({ kind: "tailor", provider: "nvidia", model: NEMOTRON_MODEL, mode: "LIVE", status: "cache" });
      return { suggestions, note: null, engine: "nemotron-cache", model: NEMOTRON_MODEL, mode: "LIVE" };
    } catch {
      // Ignore invalid cache and retry live/local.
    }
  }

  if (isNvidiaConfigured()) {
    const started = Date.now();
    let latency = 0;
    try {
      const messages = tailoringMessages(candidateName, usableFacts, role);
      const call = await callNemotron(messages, { maxTokens: 900 });
      latency = call.latencyMs;
      let raw: unknown;
      try {
        raw = parseModelJson(call.text);
        validateTailoring(raw, usableFacts);
      } catch (firstError) {
        const repaired = await callNemotron(repairMessages(messages, call.text, firstError), {
          maxTokens: 900,
        });
        latency += repaired.latencyMs;
        raw = parseModelJson(repaired.text);
      }
      const suggestions = validateTailoring(raw, usableFacts);
      await writeCache(key, "tailor", suggestions);
      await recordRun({
        kind: "tailor",
        provider: "nvidia",
        model: NEMOTRON_MODEL,
        mode: "LIVE",
        status: "ok",
        latencyMs: latency,
      });
      return { suggestions, note: null, engine: "nemotron-live", model: NEMOTRON_MODEL, mode: "LIVE" };
    } catch (error) {
      warnFallback("tailor", errorMessage(error));
      await recordRun({
        kind: "tailor",
        provider: "nvidia",
        model: NEMOTRON_MODEL,
        mode: "FALLBACK",
        status: "error-fallback",
        latencyMs: Date.now() - started,
        error: errorMessage(error),
      });
    }
  } else {
    warnFallback("tailor", "NVIDIA_API_KEY is not set");
    await recordRun({
      kind: "tailor",
      provider: "local",
      model: "deterministic-local",
      mode: "FALLBACK",
      status: "local-fallback",
    });
  }

  const local = suggestTailoringLocally(
    usableFacts.map((fact) => ({
      id: fact.id,
      prompt: fact.prompt,
      claim: fact.claim,
      skillTags: fact.skillTags,
      meta: fact.meta,
      evidenceUrl: fact.evidenceUrl,
    })),
    role,
  );
  if (local.suggestions.length === 0) {
    throw new Error(local.note ?? "No meaningful rewrite was possible for these claims.");
  }
  return {
    suggestions: local.suggestions,
    note: local.note,
    engine: "fallback",
    model: "deterministic-local",
    mode: "FALLBACK",
  };
}

export async function askProfile(
  facts: FactView[],
  question: string,
  candidateName: string,
): Promise<ProfileAskResult> {
  const usableFacts = facts.slice(0, 8);
  const cleanQuestion = question.trim().slice(0, 300);
  const key = sha(
    "ask:v1:" +
      usableFacts.map((fact) => fact.id).join(":") +
      ":" +
      sha(cleanQuestion),
  );
  const cached = await readCache(key);
  if (cached) {
    try {
      const parsed = validateAsk(JSON.parse(cached) as unknown, usableFacts);
      const sources = buildAskSources(parsed, usableFacts);
      await recordRun({ kind: "ask", provider: "gemini", model: "cache", mode: "LIVE", status: "cache" });
      return { answer: parsed.answer, sources, engine: "gemini-cache", model: "gemini", mode: "LIVE" };
    } catch {
      // Ignore invalid cache.
    }
  }

  if (isGeminiConfigured()) {
    const started = Date.now();
    let model = "gemini";
    let latency = 0;
    try {
      const messages = askMessages(candidateName, usableFacts, cleanQuestion);
      const call = await callGemini(messages, { maxTokens: 700 });
      model = call.model;
      latency = call.latencyMs;
      let raw: unknown;
      try {
        raw = parseModelJson(call.text);
        validateAsk(raw, usableFacts);
      } catch (firstError) {
        const repaired = await callGemini(repairMessages(messages, call.text, firstError), {
          maxTokens: 700,
        });
        latency += repaired.latencyMs;
        raw = parseModelJson(repaired.text);
      }
      const parsed = validateAsk(raw, usableFacts);
      await writeCache(key, "ask", parsed);
      const sources = buildAskSources(parsed, usableFacts);
      await recordRun({
        kind: "ask",
        provider: "gemini",
        model,
        mode: "LIVE",
        status: "ok",
        latencyMs: latency,
      });
      return { answer: parsed.answer, sources, engine: "gemini-live", model, mode: "LIVE" };
    } catch (error) {
      warnFallback("ask", errorMessage(error));
      await recordRun({
        kind: "ask",
        provider: "gemini",
        model,
        mode: "FALLBACK",
        status: "error-fallback",
        latencyMs: Date.now() - started,
        error: errorMessage(error),
      });
    }
  } else {
    warnFallback("ask", "GEMINI_API_KEY is not set");
    await recordRun({
      kind: "ask",
      provider: "local",
      model: "deterministic-local",
      mode: "FALLBACK",
      status: "local-fallback",
    });
  }

  const local = answerFromFactsLocally(usableFacts, cleanQuestion);
  const parsed: AskResult = local;
  return {
    answer: parsed.answer,
    sources: buildAskSources(parsed, usableFacts),
    engine: "fallback",
    model: "deterministic-local",
    mode: "FALLBACK",
  };
}

function buildAskSources(parsed: AskResult, facts: FactView[]): AskSource[] {
  return parsed.sourceFactIds
    .map((id) => facts.find((fact) => fact.id === id))
    .filter((fact): fact is FactView => Boolean(fact))
    .map((fact) => ({
      factId: fact.id,
      prompt: fact.prompt,
      excerpt: fact.claim.length > 180 ? fact.claim.slice(0, 179) + "…" : fact.claim,
    }));
}
