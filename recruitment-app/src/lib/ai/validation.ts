import type { FactView } from "@/lib/repo";
import {
  askResponseSchema,
  feedParseResponseSchema,
  highlightResponseSchema,
  readingResponseSchema,
  tailoringResponseSchema,
  type AskResult,
  type Highlight,
  type TailoringSuggestion,
} from "./schemas";
import { containsRankingLanguage } from "./reading";
import type { EvidenceReadingRaw, ReadingRequirement } from "./reading-types";

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

const PROTECTED_CRITERION_PATTERNS: RegExp[] = [
  /\b(?:age|aged|under\s+\d+|over\s+\d+|young|older|recent\s+graduate|senior|junior|energetic)\b/i,
  /\b(?:male|female|man|woman|non[- ]?binary|gender)\b/i,
  /\b(?:race|racial|ethnicity|ethnic|white|black|asian|african|latino|hispanic)\b/i,
  /\b(?:nationality|national|citizen|citizenship|passport|native\s+speaker|native[- ]language|finnish|swedish|estonian|russian)\b/i,
  /\b(?:disabled|disability|neurodivergent|mental\s+health|chronic\s+illness)\b/i,
  /\b(?:religion|religious|christian|muslim|jewish|hindu|buddhist)\b/i,
  /\b(?:pregnan\w*|marital|married|single\s+parent|family\s+status|sexual\s+orientation|lgbtq?)\b/i,
];

const PROTECTED_REASON =
  "That is a protected characteristic or a proxy, so it is not used in discovery. The rest of the request still applies.";

export interface ValidatedFeedCriterion {
  kind: "SKILL" | "EXPERIENCE" | "DOMAIN";
  value: string;
  years?: number;
}

export interface ValidatedFeedParse {
  criteria: ValidatedFeedCriterion[];
  rejected: Array<{ text: string; reason: string }>;
  unparsed: string[];
}

export function isProtectedFeedCriterion(value: string): boolean {
  return PROTECTED_CRITERION_PATTERNS.some((pattern) => pattern.test(value));
}

export function validateFeedParse(raw: unknown): ValidatedFeedParse {
  const parsed = feedParseResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AiValidationError("Feed parse JSON did not match the schema: " + parsed.error.issues[0]?.message);
  }

  const rejected = [...parsed.data.rejected];
  const unparsed = [...parsed.data.unparsed];
  const seen = new Set<string>();
  const criteria: ValidatedFeedCriterion[] = [];

  for (const criterion of parsed.data.criteria) {
    const value = criterion.value.trim();
    if (!value) continue;
    if (isProtectedFeedCriterion(value)) {
      rejected.push({ text: value, reason: PROTECTED_REASON });
      continue;
    }
    if (criterion.kind === "EXPERIENCE" && (!criterion.years || criterion.years <= 0)) {
      unparsed.push(value + " (no supported duration)");
      continue;
    }
    const key = criterion.kind + ":" + value.toLowerCase() + (criterion.years ? ":" + criterion.years : "");
    if (seen.has(key)) continue;
    seen.add(key);
    criteria.push({
      kind: criterion.kind,
      value,
      ...(criterion.kind === "EXPERIENCE" ? { years: criterion.years } : {}),
    });
    if (criteria.length >= 8) break;
  }

  return {
    criteria,
    rejected: rejected.slice(0, 6),
    unparsed: Array.from(new Set(unparsed)).slice(0, 8),
  };
}

export interface ReadingValidationContext {
  requirements: ReadingRequirement[];
  facts: Array<{ id: string; claim: string }>;
}

export function validateReading(raw: unknown, context: ReadingValidationContext): EvidenceReadingRaw {
  const parsed = readingResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AiValidationError("Reading JSON did not match the schema: " + parsed.error.issues[0]?.message);
  }

  const requirementById = new Map(context.requirements.map((requirement) => [requirement.id, requirement] as const));
  const factById = new Map(context.facts.map((fact) => [fact.id, fact] as const));
  const seen = new Set<string>();
  const covered: EvidenceReadingRaw["covered"] = [];

  for (const item of parsed.data.covered) {
    const requirement = requirementById.get(item.requirementId);
    if (!requirement) {
      throw new AiValidationError("The reading cited a requirement that is not on this role card.");
    }
    if (seen.has(item.requirementId)) {
      throw new AiValidationError("The reading repeated a requirement.");
    }
    if (requirement.status !== "met" && requirement.status !== "related") {
      throw new AiValidationError("The reading put an unsupported requirement in the covered list.");
    }
    seen.add(item.requirementId);

    const factIds = Array.from(new Set(item.factIds));
    if (requirement.kind === "SIGNAL" && factIds.length === 0) {
      throw new AiValidationError("A covered signal must cite at least one source fact.");
    }
    for (const factId of factIds) {
      if (!factById.has(factId)) {
        throw new AiValidationError("The reading cited a fact that is not on this review card.");
      }
    }

    const quote = item.quote?.trim() ? item.quote.trim() : null;
    if (quote) {
      if (factIds.length === 0) {
        throw new AiValidationError("A quote needs at least one cited fact.");
      }
      const normalizedQuote = normalize(quote);
      const grounded = factIds.some((factId) => normalize(factById.get(factId)!.claim).includes(normalizedQuote));
      if (!grounded) {
        throw new AiValidationError("A quote from the reading is not contained in its cited fact.");
      }
    }

    covered.push({
      requirementId: item.requirementId,
      note: item.note,
      factIds,
      quote,
    });
  }

  const gaps: EvidenceReadingRaw["gaps"] = [];
  for (const item of parsed.data.gaps) {
    const requirement = requirementById.get(item.requirementId);
    if (!requirement) {
      throw new AiValidationError("The reading cited a requirement that is not on this role card.");
    }
    if (seen.has(item.requirementId)) {
      throw new AiValidationError("The reading repeated a requirement.");
    }
    if (requirement.status === "met" || requirement.status === "related") {
      throw new AiValidationError("The reading put a supported requirement in the gaps list.");
    }
    seen.add(item.requirementId);
    gaps.push({ requirementId: item.requirementId, note: item.note });
  }

  const missing = context.requirements.filter((requirement) => !seen.has(requirement.id));
  if (missing.length > 0) {
    throw new AiValidationError(
      "The reading did not cover every requirement: " + missing.map((requirement) => requirement.label).join(", "),
    );
  }

  const narrative = [
    parsed.data.summary,
    ...covered.map((item) => item.note),
    ...gaps.map((item) => item.note),
    ...parsed.data.questions,
  ].join(" ");
  if (containsRankingLanguage(narrative)) {
    throw new AiValidationError("The reading used ranking or decision language.");
  }

  return {
    summary: parsed.data.summary,
    covered,
    gaps,
    questions: parsed.data.questions,
    caveats: parsed.data.caveats,
  };
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
