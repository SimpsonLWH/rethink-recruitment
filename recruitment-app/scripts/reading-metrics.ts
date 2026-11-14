import { containsRankingLanguage } from "@/lib/ai/reading";
import type { EvidenceReadingView, ReadingInput } from "@/lib/ai/reading-types";

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export interface ReadingMetrics {
  requirements: number;
  covered: number;
  gaps: number;
  questions: number;
  representedExactlyOnce: boolean;
  citedFactIds: string[];
  unknownFactIds: string[];
  quotesGrounded: boolean;
  noRankingLanguage: boolean;
}

export function readingMetrics(reading: EvidenceReadingView, input: ReadingInput): ReadingMetrics {
  const represented = [...reading.covered, ...reading.gaps].map((item) => item.requirementId);
  const knownFacts = new Map(input.facts.map((fact) => [fact.id, fact] as const));
  const citedFactIds = Array.from(new Set(reading.covered.flatMap((item) => item.factIds)));
  const unknownFactIds = citedFactIds.filter((id) => !knownFacts.has(id));
  const quotesGrounded = reading.covered.every((item) => {
    const quote = item.quote;
    if (!quote) return true;
    return item.factIds.some((factId) => {
      const fact = knownFacts.get(factId);
      return Boolean(fact && normalize(fact.claim).includes(normalize(quote)));
    });
  });
  const narrative = [
    reading.summary,
    ...reading.covered.map((item) => item.note),
    ...reading.gaps.map((item) => item.note),
    ...reading.questions,
  ].join(" ");

  return {
    requirements: input.requirements.length,
    covered: reading.covered.length,
    gaps: reading.gaps.length,
    questions: reading.questions.length,
    representedExactlyOnce:
      represented.length === input.requirements.length &&
      new Set(represented).size === input.requirements.length,
    citedFactIds,
    unknownFactIds,
    quotesGrounded,
    noRankingLanguage: !containsRankingLanguage(narrative),
  };
}
