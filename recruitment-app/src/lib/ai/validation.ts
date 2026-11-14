import type { FactView } from "@/lib/repo";
import {
  askResponseSchema,
  highlightResponseSchema,
  tailoringResponseSchema,
  type AskResult,
  type Highlight,
  type TailoringSuggestion,
} from "./schemas";

export class AiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiValidationError";
  }
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

const URL_PATTERN = /https?:\/\/[^\s<>"')]+/gi;

function urlsIn(value: string) {
  return (value.match(URL_PATTERN) ?? []).map((url) => url.replace(/[.,;:]$/, ""));
}

export function validateHighlights(raw: unknown, sourceText: string): Highlight[] {
  const parsed = highlightResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AiValidationError("Highlight JSON did not match the schema: " + parsed.error.issues[0]?.message);
  }
  const normalizedSource = normalize(sourceText);
  const seen = new Set<string>();
  const valid: Highlight[] = [];
  for (const highlight of parsed.data.highlights) {
    if (!normalizedSource.includes(normalize(highlight.sourceQuote))) {
      continue;
    }
    const evidenceUrl = highlight.evidenceUrl && sourceText.includes(highlight.evidenceUrl)
      ? highlight.evidenceUrl
      : null;
    const claim = highlight.claim.trim();
    if (claim.length < 8 || seen.has(claim.toLowerCase())) continue;
    seen.add(claim.toLowerCase());
    valid.push({
      skill: highlight.skill.trim().slice(0, 60),
      claim: claim.slice(0, 500),
      evidenceUrl,
      sourceQuote: highlight.sourceQuote.slice(0, 800),
    });
  }
  if (valid.length === 0) {
    throw new AiValidationError("No highlight was grounded in the supplied answer.");
  }
  return valid.slice(0, 5);
}

export function validateTailoring(raw: unknown, facts: FactView[]): TailoringSuggestion[] {
  const parsed = tailoringResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AiValidationError("Tailoring JSON did not match the schema: " + parsed.error.issues[0]?.message);
  }
  const factIds = new Set(facts.map((fact) => fact.id));
  const allowedUrls = new Set(
    facts.flatMap((fact) => [...urlsIn(fact.claim), ...(fact.evidenceUrl ? [fact.evidenceUrl] : [])]),
  );
  const seen = new Set<string>();
  const valid: TailoringSuggestion[] = [];
  for (const suggestion of parsed.data.suggestions) {
    if (suggestion.sourceFactIds.length === 0 || !suggestion.sourceFactIds.every((id) => factIds.has(id))) {
      throw new AiValidationError("A suggestion cited a fact that is not in the master record.");
    }
    const inventedUrl = urlsIn(suggestion.proposedText).some((url) => !allowedUrls.has(url));
    if (inventedUrl) {
      throw new AiValidationError("A suggestion introduced a link that is not in the source facts.");
    }
    if (seen.has(suggestion.proposedText.toLowerCase())) continue;
    seen.add(suggestion.proposedText.toLowerCase());
    valid.push({
      ...suggestion,
      sourceFactIds: Array.from(new Set(suggestion.sourceFactIds)),
      proposedText: suggestion.proposedText.slice(0, 500),
      rationale: suggestion.rationale.slice(0, 260),
    });
  }
  if (valid.length === 0) throw new AiValidationError("Tailoring produced no usable suggestions.");
  return valid.slice(0, 5);
}

export function validateAsk(raw: unknown, facts: FactView[]): AskResult {
  const parsed = askResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AiValidationError("Q&A JSON did not match the schema: " + parsed.error.issues[0]?.message);
  }
  const factIds = new Set(facts.map((fact) => fact.id));
  if (!parsed.data.sourceFactIds.every((id) => factIds.has(id))) {
    throw new AiValidationError("Q&A cited a source outside the profile.");
  }
  return {
    answer: parsed.data.answer.slice(0, 900),
    sourceFactIds: Array.from(new Set(parsed.data.sourceFactIds)),
  };
}
