import { createHash } from "node:crypto";
import type { CandidateDetail, RoleDetail, SignalMatch } from "@/lib/repo";
import { NEMOTRON_MODEL } from "./config";
import type {
  EvidenceReadingRaw,
  EvidenceReadingView,
  ReadingCoveredRaw,
  ReadingFact,
  ReadingFactMeta,
  ReadingGapRaw,
  ReadingInput,
  ReadingRequirement,
  ReadingRequirementStatus,
} from "./reading-types";

const READING_VERSION = "reading:v1";
const MAX_FACTS = 16;
const MAX_CLAIM = 400;

function trim(value: string, max: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + "…" : clean;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function assessmentStatus(score: number | null, requiredScore: number): ReadingRequirementStatus {
  if (score === null) return "unknown";
  return score >= requiredScore ? "met" : "not_met";
}

function signalStatus(status: SignalMatch["status"]): ReadingRequirementStatus {
  switch (status) {
    case "exact":
      return "met";
    case "related":
      return "related";
    case "not_met":
      return "not_met";
    case "uncertain":
      return "uncertain";
    default:
      return "unknown";
  }
}

function compactMeta(meta: CandidateDetail["facts"][number]["meta"]): ReadingFactMeta | undefined {
  const compact: ReadingFactMeta = {
    module: meta.module,
    title: meta.title,
    organisation: meta.organisation,
    start: meta.start,
    end: meta.end,
  };
  const hasValue = Object.values(compact).some((value) => value !== undefined && value !== null && value !== "");
  return hasValue ? compact : undefined;
}

function requirementLabel(assessment: NonNullable<RoleDetail["requirements"][number]["assessment"]>) {
  return assessment.title + " · " + assessment.version + " · " + assessment.difficulty.toLowerCase();
}

export function buildReadingInput(input: {
  role: RoleDetail;
  candidate: CandidateDetail;
  signals: SignalMatch[];
}): ReadingInput {
  const requirements: ReadingRequirement[] = [];
  const seen = new Set<string>();

  const roleRequirements =
    input.role.requirements.length > 0
      ? input.role.requirements
      : input.role.assessment && input.role.requiredScore !== null
        ? [
            {
              assessmentId: input.role.assessment.id,
              requiredScore: input.role.requiredScore,
              assessment: input.role.assessment,
            },
          ]
        : [];

  for (const requirement of roleRequirements) {
    const assessment = requirement.assessment;
    if (!assessment) continue;
    const id = "assessment:" + requirement.assessmentId;
    if (seen.has(id)) continue;
    seen.add(id);
    const result = input.candidate.assessmentResults.find(
      (entry) => entry.assessment.id === requirement.assessmentId,
    );
    const score = result?.score ?? null;
    const status = assessmentStatus(score, requirement.requiredScore);
    requirements.push({
      id,
      kind: "ASSESSMENT",
      label: requirementLabel(assessment),
      status,
      detail:
        score === null
          ? "No sitting is recorded for " + assessment.title + "."
          : "Recorded " + score + " against a stated bar of " + requirement.requiredScore + ".",
      factIds: [],
      requiredScore: requirement.requiredScore,
      recordedScore: score,
    });
  }

  for (const signal of input.role.evidenceSignals) {
    const id = "signal:" + signal.id;
    if (seen.has(id)) continue;
    seen.add(id);
    const match = input.signals.find((entry) => entry.signal.id === signal.id);
    requirements.push({
      id,
      kind: "SIGNAL",
      label: signal.label,
      status: match ? signalStatus(match.status) : "unknown",
      detail: match?.explanation ?? "No signal evidence is available in the record.",
      factIds: match?.factIds.slice(0, 3) ?? [],
    });
  }

  const signalFactIds = new Set(requirements.flatMap((requirement) => requirement.factIds));
  const orderedFacts = [...input.candidate.facts]
    .sort((left, right) => {
      const leftSignal = signalFactIds.has(left.id) ? 0 : 1;
      const rightSignal = signalFactIds.has(right.id) ? 0 : 1;
      return leftSignal - rightSignal || left.order - right.order;
    })
    .slice(0, MAX_FACTS);

  const facts: ReadingFact[] = orderedFacts.map((fact) => ({
    id: fact.id,
    prompt: trim(fact.prompt, 120),
    claim: trim(fact.claim, MAX_CLAIM),
    skills: unique([...fact.skillTags, ...(fact.meta.skills ?? [])]).slice(0, 8),
    hasEvidenceLink: Boolean(fact.evidenceUrl),
    meta: compactMeta(fact.meta),
  }));

  return {
    role: {
      id: input.role.id,
      title: input.role.title,
      summary: trim(input.role.summary, 600),
      problemNow: trim(input.role.problemNow, 400),
      first90: trim(input.role.first90, 300),
      skills: input.role.skills.slice(0, 12),
    },
    candidateId: input.candidate.id,
    facts,
    requirements,
  };
}

export function readingCacheKey(input: ReadingInput, model = NEMOTRON_MODEL) {
  const payload = {
    version: READING_VERSION,
    model,
    role: input.role,
    candidateId: input.candidateId,
    requirements: input.requirements,
    facts: input.facts,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function enrichReading(raw: EvidenceReadingRaw, input: ReadingInput): EvidenceReadingView {
  const coveredById = new Map(raw.covered.map((item) => [item.requirementId, item] as const));
  const gapsById = new Map(raw.gaps.map((item) => [item.requirementId, item] as const));

  const covered = input.requirements
    .filter((requirement) => coveredById.has(requirement.id))
    .map((requirement) => {
      const item = coveredById.get(requirement.id)!;
      return {
        requirementId: requirement.id,
        label: requirement.label,
        kind: requirement.kind,
        status: requirement.status,
        note: trim(item.note, 320),
        factIds: unique(item.factIds).slice(0, 3),
        quote: item.quote ? trim(item.quote, 320) : null,
      };
    });

  const gaps = input.requirements
    .filter((requirement) => gapsById.has(requirement.id))
    .map((requirement) => {
      const item = gapsById.get(requirement.id)!;
      return {
        requirementId: requirement.id,
        label: requirement.label,
        kind: requirement.kind,
        status: requirement.status,
        note: trim(item.note, 320),
      };
    });

  return {
    summary: trim(raw.summary, 700),
    covered,
    gaps,
    questions: raw.questions.map((question) => trim(question, 240)).slice(0, 4),
    caveats: raw.caveats.map((caveat) => trim(caveat, 240)).slice(0, 3),
  };
}

const RANKING_PATTERN =
  /\b(?:best candidate|top candidate|match percentage|percent(?:age)? match|suitability score|suitable|strong fit|weak fit|good fit|poor fit|ranked|rank|should hire|recommend hiring|recommend(?:ed|s|ing)?|auto[- ]reject|best|worst)\b/i;

export function containsRankingLanguage(value: string) {
  return RANKING_PATTERN.test(value);
}

function coveredNote(requirement: ReadingRequirement) {
  if (requirement.kind === "ASSESSMENT") {
    return trim(requirement.detail + " The recorded result meets the stated bar.", 320);
  }
  if (requirement.status === "related") {
    return "Related evidence only. The record does not directly state this.";
  }
  const count = requirement.factIds.length;
  return "The record states this directly in " + count + " source " + (count === 1 ? "fact" : "facts") + ".";
}

function gapNote(requirement: ReadingRequirement) {
  if (requirement.kind === "ASSESSMENT") {
    if (requirement.status === "not_met") {
      return trim(
        requirement.detail + " The result stays visible; it is not an automatic rejection.",
        320,
      );
    }
    return trim(requirement.detail + " Review the rest of the record.", 320);
  }
  if (requirement.status === "not_met") {
    return trim(requirement.detail + " This is a question for the conversation, not an automatic rejection.", 320);
  }
  if (requirement.status === "uncertain") {
    return "The record mentions this, but not with a complete dated example. Ask for a concrete example.";
  }
  return "Not stated in the record. Ask for a concrete example.";
}

export function buildEvidenceReadingLocally(input: ReadingInput): EvidenceReadingView {
  const supported = input.requirements.filter(
    (requirement) => requirement.status === "met" || requirement.status === "related",
  );
  const open = input.requirements.filter(
    (requirement) => requirement.status !== "met" && requirement.status !== "related",
  );
  const factById = new Map(input.facts.map((fact) => [fact.id, fact] as const));

  const covered: ReadingCoveredRaw[] = supported.map((requirement) => {
    const factIds = requirement.factIds.slice(0, 3);
    const fact = factIds.map((id) => factById.get(id)).find((candidate) => Boolean(candidate));
    return {
      requirementId: requirement.id,
      note: coveredNote(requirement),
      factIds,
      // Keep the quote a literal substring: do not add an ellipsis.
      quote: fact ? fact.claim.slice(0, 240).trim() : null,
    };
  });

  const gaps: ReadingGapRaw[] = open.map((requirement) => ({
    requirementId: requirement.id,
    note: gapNote(requirement),
  }));

  const total = input.requirements.length;
  const summary =
    total === 0
      ? "This role card has no stated assessment or signal requirements. This is a deterministic reading, not a model output."
      : "This deterministic reading uses the stated bar and the facts on the card. " +
        supported.length +
        " of " +
        total +
        " requirements have supporting evidence; " +
        open.length +
        " remain open questions.";

  const questions: string[] = [];
  if (open[0]) {
    questions.push('Ask for a concrete example that shows "' + open[0].label + '".');
  }
  if (open[1]) {
    questions.push('Ask what evidence would show "' + open[1].label + '".');
  }
  if (questions.length === 0 && input.role.skills[0]) {
    questions.push("Ask them to walk through one project that used " + input.role.skills[0] + ".");
  }
  const problem = trim(input.role.problemNow, 160).replace(/[.!?]+$/, "");
  if (problem) {
    questions.push("How would they approach the live problem: " + problem + "?");
  }
  if (questions.length === 0) {
    questions.push("Ask what evidence they would add to this record.");
  }

  return enrichReading(
    {
      summary,
      covered,
      gaps,
      questions: questions.slice(0, 2),
      caveats: [
        "No score or ranking is produced.",
        "A working evidence link only means the URL answered.",
      ],
    },
    input,
  );
}
