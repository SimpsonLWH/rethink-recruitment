/**
 * Deterministic fallback audit for every AI-adjacent surface.
 *
 * This script NEVER talks to a model provider. It deliberately does not
 * import callNemotron, callGemini, or the HTTP helper; it imports only
 * deterministic local fallback functions. Running it cannot spend quota,
 * contact a hosted endpoint, or read an API key.
 *
 * It loads the seeded Aino Vikstrom candidate and the Northwind Product
 * Engineer role through the repository, runs the local fallbacks, compares
 * each tailoring suggestion with the facts it cites, and writes:
 *
 *     audit/fallback-samples.json
 *
 * Prerequisites: a seeded database (npm run seed from recruitment-app/) and
 * src/lib/feed.ts. Run from recruitment-app/:
 *
 *     npx tsx scripts/ai-audit.ts
 *
 * The artifact contains no environment values, keys, tokens, cookies, or
 * authorization headers. Do not add any.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { answerFromFactsLocally, extractHighlightsLocally, suggestTailoringLocally } from "@/lib/ai/local";
import { buildEvidenceReadingLocally, buildReadingInput, containsRankingLanguage } from "@/lib/ai/reading";
import { prisma } from "@/lib/prisma";
import { getRepository } from "@/lib/repo";
import type { CandidateDetail, RecruitmentRepository, RoleDetail } from "@/lib/repo";
import { parseFeedPreferenceRules } from "@/lib/feed";

const CANDIDATE_SLUG = "aino-vikstrom";
const CANDIDATE_NAME = "Aino Vikström";
const EMPLOYER_SLUG = "northwind-labs";
const ROLE_SLUG = "northwind-product-engineer";
const ROLE_TITLE = "Product Engineer";
const OUTPUT_RELATIVE_PATH = "audit/fallback-samples.json";

const SEEDED_DB_MESSAGE =
  "The demo database is not seeded with the expected synthetic data. Run `npm run seed` from recruitment-app/ and retry. This audit never calls a live model and never needs an API key.";

interface AuditedSuggestion {
  kind: string;
  sourceFactIds: string[];
  proposedText: string;
  rationale: string;
}

interface TailoringOutput {
  suggestions: AuditedSuggestion[];
  note: string | null;
}

interface SourceComparison {
  sourceFactIds: string[];
  sourceClaims: string[];
  proposedText: string;
  similarity: {
    tokenJaccard: number;
    diceBigrams: number;
  };
  preserved: {
    numbersFromSource: string[];
    missingNumbers: string[];
    urlsFromSource: string[];
    missingUrls: string[];
  };
  citesOnlyKnownFacts: boolean;
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function normalizeForCompare(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenJaccard(a: string, b: string) {
  const tokenize = (value: string) =>
    new Set(normalizeForCompare(value).split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  const left = tokenize(a);
  const right = tokenize(b);
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

function diceBigrams(a: string, b: string) {
  const left = normalizeForCompare(a);
  const right = normalizeForCompare(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const counts = new Map<string, number>();
  for (let index = 0; index < left.length - 1; index += 1) {
    const gram = left.slice(index, index + 2);
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  let overlap = 0;
  for (let index = 0; index < right.length - 1; index += 1) {
    const gram = right.slice(index, index + 2);
    const count = counts.get(gram) ?? 0;
    if (count > 0) {
      counts.set(gram, count - 1);
      overlap += 1;
    }
  }
  return (2 * overlap) / (left.length - 1 + (right.length - 1));
}

function numbersIn(value: string) {
  return (value.match(/\d+(?:[.,]\d+)?/g) ?? []).map((number) => number.replace(",", "."));
}

function urlsIn(value: string) {
  return (value.match(/https?:\/\/[^\s<>"')]+/gi) ?? []).map((url) => url.replace(/[.,;:]$/, ""));
}

function missingFrom(values: string[], haystack: string) {
  const normalizedHaystack = haystack.replace(/,/g, ".");
  return [...new Set(values)].filter((value) => !normalizedHaystack.includes(value));
}

/**
 * The tailored fallback contract is being finalised in a parallel change:
 * older local.ts returned TailoringSuggestion[] directly, the newer version
 * returns { suggestions, note }. Normalise both at runtime and keep the
 * artifact shape identical either way.
 */
function normalizeTailoringOutput(value: unknown): TailoringOutput {
  if (Array.isArray(value)) {
    return { suggestions: value as AuditedSuggestion[], note: null };
  }
  const record = value as { suggestions?: unknown; note?: unknown } | null;
  const suggestions = Array.isArray(record?.suggestions)
    ? (record?.suggestions as AuditedSuggestion[])
    : [];
  const note = typeof record?.note === "string" ? record.note : null;
  return { suggestions, note };
}

async function seedGuarded<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error && error.message.includes("npm run seed")) throw error;
    throw new Error(SEEDED_DB_MESSAGE);
  }
}

async function loadSeededTargets(repo: RecruitmentRepository): Promise<{
  candidate: CandidateDetail;
  role: RoleDetail;
}> {
  const candidates = await seedGuarded(() => repo.getCandidateDirectory());
  if (candidates.length === 0) throw new Error(SEEDED_DB_MESSAGE);

  const candidateSummary =
    candidates.find((candidate) => candidate.slug === CANDIDATE_SLUG) ??
    candidates.find((candidate) => candidate.name === CANDIDATE_NAME);
  if (!candidateSummary) {
    throw new Error(
      "The seeded candidate " + CANDIDATE_NAME + " (" + CANDIDATE_SLUG + ") was not found. " + SEEDED_DB_MESSAGE,
    );
  }
  const candidate = await seedGuarded(() => repo.getCandidateById(candidateSummary.id));
  if (!candidate) throw new Error("Could not load the seeded candidate " + CANDIDATE_NAME + ". " + SEEDED_DB_MESSAGE);
  if (candidate.facts.length === 0) {
    throw new Error("The seeded candidate " + CANDIDATE_NAME + " has no master-record facts. " + SEEDED_DB_MESSAGE);
  }

  const employers = await seedGuarded(() => repo.getEmployerDirectory());
  const employer = employers.find((item) => item.slug === EMPLOYER_SLUG);
  const roleSummary = employer?.roles.find(
    (item) => item.slug === ROLE_SLUG || item.title === ROLE_TITLE,
  );
  if (!employer || !roleSummary) {
    throw new Error(
      "The seeded role " + ROLE_TITLE + " at Northwind Labs was not found. " + SEEDED_DB_MESSAGE,
    );
  }
  const role = await seedGuarded(() => repo.getRoleById(roleSummary.id));
  if (!role) throw new Error("Could not load the seeded role " + ROLE_TITLE + ". " + SEEDED_DB_MESSAGE);

  return { candidate, role };
}

function buildSourceComparison(
  suggestion: AuditedSuggestion,
  facts: CandidateDetail["facts"],
): SourceComparison {
  const knownIds = new Set(facts.map((fact) => fact.id));
  const sourceFacts = facts.filter((fact) => suggestion.sourceFactIds.includes(fact.id));
  const sourceClaims = sourceFacts.map((fact) => fact.claim);
  const sourceText = sourceClaims.join(" ");
  const sourceNumbers = numbersIn(sourceText);
  // The evidence URL is not part of the claim and is not expected in the
  // rewritten line; it stays attached via the source fact. Only URLs written
  // inside the claim itself must survive the rewrite.
  const sourceUrls = sourceClaims.flatMap((claim) => urlsIn(claim));
  return {
    sourceFactIds: suggestion.sourceFactIds,
    sourceClaims,
    proposedText: suggestion.proposedText,
    similarity: {
      tokenJaccard: round(tokenJaccard(sourceText, suggestion.proposedText)),
      diceBigrams: round(diceBigrams(sourceText, suggestion.proposedText)),
    },
    preserved: {
      numbersFromSource: sourceNumbers,
      missingNumbers: missingFrom(sourceNumbers, suggestion.proposedText),
      urlsFromSource: [...new Set(sourceUrls)],
      missingUrls: missingFrom([...new Set(sourceUrls)], suggestion.proposedText),
    },
    citesOnlyKnownFacts: suggestion.sourceFactIds.every((id) => knownIds.has(id)),
  };
}

function fallbackExtractInput(candidate: CandidateDetail) {
  const primary = candidate.facts.find((fact) => fact.evidenceUrl) ?? candidate.facts[0];
  const parts = [primary.claim];
  if (primary.evidenceUrl) parts.push("The supporting artifact is at " + primary.evidenceUrl + ".");
  return parts.join(" ");
}

async function writeArtifact(artifact: unknown) {
  const outputPath = path.join(process.cwd(), OUTPUT_RELATIVE_PATH);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(artifact, null, 2) + "\n", "utf8");
  return outputPath;
}

async function main() {
  const repo = getRepository();
  const { candidate, role } = await loadSeededTargets(repo);

  // --- extract: deterministic highlight extraction -------------------------
  const extractInput = fallbackExtractInput(candidate);
  const highlights = extractHighlightsLocally(extractInput);
  const extractChecks = {
    everySourceQuoteInInput: highlights.every((highlight) => extractInput.includes(highlight.sourceQuote)),
    everyEvidenceUrlInInput: highlights.every(
      (highlight) => !highlight.evidenceUrl || extractInput.includes(highlight.evidenceUrl),
    ),
    provenanceFieldPresent: highlights.some((highlight) => "provenance" in highlight),
  };

  // --- tailor: deterministic suggestion + source comparison ----------------
  const localFacts = candidate.facts.slice(0, 8).map((fact) => ({
    id: fact.id,
    prompt: fact.prompt,
    claim: fact.claim,
    skillTags: fact.skillTags,
    meta: fact.meta,
    evidenceUrl: fact.evidenceUrl,
  }));
  const tailoringRaw: unknown = suggestTailoringLocally(localFacts, role);
  const tailoring = normalizeTailoringOutput(tailoringRaw);
  const sourceComparisons = tailoring.suggestions.map((suggestion) =>
    buildSourceComparison(suggestion, candidate.facts),
  );
  const averageSimilarity =
    sourceComparisons.length === 0
      ? null
      : round(
          sourceComparisons.reduce(
            (total, comparison) =>
              total + (comparison.similarity.tokenJaccard + comparison.similarity.diceBigrams) / 2,
            0,
          ) / sourceComparisons.length,
        );

  // --- ask: deterministic grounded retrieval -------------------------------
  const askQuestion = "What does " + candidate.name + " want in an ideal team?";
  const ask = answerFromFactsLocally(candidate.facts, askQuestion);

  // --- reading: deterministic evidence reading ------------------------------
  const review = await seedGuarded(() =>
    repo.getEmployerReview(role.id, candidate.id, role.employer.id),
  );
  if (!review) {
    throw new Error("Could not load the seeded candidate/role review pair for the reading audit. " + SEEDED_DB_MESSAGE);
  }
  const readingInput = buildReadingInput({
    role: review.role,
    candidate: review.candidate,
    signals: review.signals,
  });
  const reading = buildEvidenceReadingLocally(readingInput);
  const readingIds = [...reading.covered, ...reading.gaps].map((item) => item.requirementId);
  const readingFactIds = new Set(readingInput.facts.map((fact) => fact.id));
  const readingChecks = {
    everyRequirementRepresentedOnce:
      readingIds.length === readingInput.requirements.length &&
      new Set(readingIds).size === readingInput.requirements.length,
    citedFactsKnown: reading.covered.every((item) => item.factIds.every((id) => readingFactIds.has(id))),
    quotesGrounded: reading.covered.every((item) => {
      const quote = item.quote;
      if (!quote) return true;
      return item.factIds.some((factId) => {
        const fact = readingInput.facts.find((entry) => entry.id === factId);
        return Boolean(fact && fact.claim.includes(quote));
      });
    }),
    noRankingLanguage: !containsRankingLanguage(
      [
        reading.summary,
        ...reading.covered.map((item) => item.note),
        ...reading.gaps.map((item) => item.note),
        ...reading.questions,
      ].join(" "),
    ),
  };

  // --- feed rules: deterministic preference parser -------------------------
  const feedQuery = "React, at least 2 years, finance background";
  const feedParse = parseFeedPreferenceRules(feedQuery);
  const protectedFeedQuery = "female React developer, 2 years, finance background";
  const protectedFeedParse = parseFeedPreferenceRules(protectedFeedQuery);

  const artifact = {
    generatedAt: new Date().toISOString(),
    audit: "fallback-only",
    note:
      "Every output in this file was produced by deterministic local fallback functions: extractHighlightsLocally, suggestTailoringLocally and answerFromFactsLocally from src/lib/ai/local.ts, buildEvidenceReadingLocally from src/lib/ai/reading.ts, and parseFeedPreferenceRules from src/lib/feed.ts. No live model was called, no network request was made, and no API key, token, cookie, or authorization header was read or written. These outputs demonstrate determinism and grounding only. They are not model output and say nothing about live model quality, latency, or accuracy.",
    target: {
      candidate: { id: candidate.id, name: candidate.name, slug: candidate.slug },
      role: { id: role.id, title: role.title, slug: role.slug, employer: role.employer.name },
      source: "seeded synthetic demo data",
    },
    fallbacks: {
      extract: {
        surface: "extract",
        engine: "deterministic-local",
        model: "deterministic-local (no model call)",
        input: { text: extractInput },
        output: { highlights },
        checks: extractChecks,
      },
      tailor: {
        surface: "tailor",
        engine: "deterministic-local",
        model: "deterministic-local (no model call)",
        input: { factIds: localFacts.map((fact) => fact.id), roleId: role.id },
        output: { suggestions: tailoring.suggestions, note: tailoring.note },
        sourceComparison: {
          averageSimilarity,
          suggestions: sourceComparisons,
        },
      },
      ask: {
        surface: "ask",
        engine: "deterministic-local",
        model: "deterministic-local (no model call)",
        input: { question: askQuestion, factIds: candidate.facts.map((fact) => fact.id) },
        output: ask,
      },
      reading: {
        surface: "reading",
        engine: "deterministic-local",
        model: "deterministic-local (no model call)",
        input: {
          roleId: review.role.id,
          candidateId: review.candidate.id,
          factIds: readingInput.facts.map((fact) => fact.id),
          requirements: readingInput.requirements.map((requirement) => ({
            id: requirement.id,
            kind: requirement.kind,
            status: requirement.status,
          })),
        },
        output: reading,
        checks: readingChecks,
      },
      feedRules: {
        surface: "feed-parse-rules",
        engine: "rules-v1",
        model: "not a model (deterministic parser)",
        input: { text: feedQuery },
        output: feedParse,
        protectedExample: {
          input: { text: protectedFeedQuery },
          output: protectedFeedParse,
        },
      },
    },
  };

  const outputPath = await writeArtifact(artifact);

  console.log("AI fallback audit written to " + OUTPUT_RELATIVE_PATH);
  console.log("  candidate: " + candidate.name + " (" + candidate.id + ")");
  console.log("  role: " + role.title + " at " + role.employer.name + " (" + role.id + ")");
  console.log(
    "  extract: " +
      highlights.length +
      " deterministic highlight(s); sourceQuote/URL checks passed=" +
      (extractChecks.everySourceQuoteInInput && extractChecks.everyEvidenceUrlInInput),
  );
  console.log(
    "  tailor: " +
      tailoring.suggestions.length +
      " deterministic suggestion(s); average similarity=" +
      (averageSimilarity === null ? "n/a" : averageSimilarity) +
      (tailoring.note ? "; note: " + tailoring.note : ""),
  );
  console.log(
    "  ask: grounded answer with " +
      ask.sourceFactIds.length +
      " cited fact(s)" +
      (ask.sourceFactIds.length === 0 ? " (out-of-record refusal)" : ""),
  );
  console.log(
    "  reading: " +
      reading.covered.length +
      " covered, " +
      reading.gaps.length +
      " open; every requirement represented once=" +
      readingChecks.everyRequirementRepresentedOnce,
  );
  console.log("  feed rules: parsed example recruiter preference (rules-v1)");
  console.log("  file: " + outputPath);
  console.log("No live model was called. No live output is claimed.");
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\nAI fallback audit failed: " + message);
    console.error(
      "This script requires a seeded database (npm run seed from recruitment-app/) and src/lib/feed.ts. It never calls a live model and never needs an API key.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
