import type { FactMeta, FactModuleKind } from "@/lib/fact-meta";
import type { CandidateDetail, FactView, Provenance } from "@/lib/repo/types";

/**
 * Pure rich-profile module builder for the recruiter review card.
 *
 * Everything here is deterministic: it reads a CandidateDetail and returns
 * display modules without touching the database, the network or the clock.
 * A module is only as strong as its source facts: every module keeps the fact
 * IDs it came from and the facts' provenance, and the builder never invents
 * dates, images or claims. When FactMeta does not say what a fact is, a
 * narrow prompt/claim heuristic guesses a sensible display kind instead.
 */

export type ReviewModuleKind =
  | "achievement"
  | "project"
  | "timeline"
  | "skills"
  | "responsibility"
  | "qualification"
  | "availability"
  | "result"
  | "fact";

export const REVIEW_MODULE_KIND_LABEL: Record<ReviewModuleKind, string> = {
  achievement: "Achievement",
  project: "Project",
  timeline: "Work history",
  skills: "Skills",
  responsibility: "Responsibility",
  qualification: "Qualification",
  availability: "Availability",
  result: "Result",
  fact: "Fact",
};

export function reviewModuleKindLabel(kind: ReviewModuleKind): string {
  return REVIEW_MODULE_KIND_LABEL[kind];
}

export interface ReviewModuleBase {
  id: string;
  kind: ReviewModuleKind;
  title: string;
  /** Every source fact that the content of this module came from. */
  factIds: string[];
  provenance: Provenance;
}

export interface TimelineEntry {
  factId: string;
  title: string;
  organisation: string;
  /** Inclusive month, format YYYY-MM, copied from FactMeta. */
  start: string;
  /** Exclusive month, format YYYY-MM, or null for an open-ended role. */
  end: string | null;
  provenance: Provenance;
}

export interface AchievementReviewModule extends ReviewModuleBase {
  kind: "achievement";
  stat: string;
  context: string;
}

export interface ProjectReviewModule extends ReviewModuleBase {
  kind: "project";
  outcome: string;
  image: string | null;
  link: string | null;
  organisation?: string;
  start?: string;
  end?: string;
}

export interface TimelineReviewModule extends ReviewModuleBase {
  kind: "timeline";
  entries: TimelineEntry[];
}

export interface SkillEntry {
  name: string;
  factIds: string[];
  /** Only present when a dated source fact gave the skill a month span. */
  months?: number;
}

export interface SkillsReviewModule extends ReviewModuleBase {
  kind: "skills";
  skills: SkillEntry[];
}

export type TextReviewModuleKind =
  | "responsibility"
  | "qualification"
  | "availability"
  | "result"
  | "fact";

export interface TextReviewModule extends ReviewModuleBase {
  kind: TextReviewModuleKind;
  body: string;
  metaTitle?: string;
}

export type ReviewModule =
  | AchievementReviewModule
  | ProjectReviewModule
  | TimelineReviewModule
  | SkillsReviewModule
  | TextReviewModule;

const DEFAULT_MAX_MODULES = 4;
const MAX_SKILLS = 8;
const CONTEXT_MAX_LENGTH = 240;

const FACT_MODULE_KIND_TO_REVIEW_KIND: Record<FactModuleKind, ReviewModuleKind> = {
  ACHIEVEMENT: "achievement",
  PROJECT: "project",
  ROLE: "timeline",
  RESPONSIBILITY: "responsibility",
  QUALIFICATION: "qualification",
  AVAILABILITY: "availability",
  RESULT: "result",
  FACT: "fact",
};

/**
 * Heuristics used only when a fact carries no explicit FactMeta.module.
 * They look at the prompt and the claim together, because the prompt is
 * usually the taxonomy question ("A project I'm proud of") that the claim
 * answers. The order below is deliberate: specific intents win over a
 * passing numeric mention, and dates are only ever read from FactMeta.
 */
const QUALIFICATION_RE =
  /\b(qualification|qualifications|degree|bachelor|bsc|msc|mba|phd|doctorate|certificate|certified|certification|diploma|graduated|bootcamp)\b/i;

const AVAILABILITY_RE =
  /\b(ideal team|looking for|availability|available|notice period|seeking|open to (?:work|roles?|opportunit(?:y|ies))|start date|can start)\b/i;

const RESPONSIBILITY_RE = /\b(hardest problem|responsibilit(?:y|ies)|owned|responsible for)\b/i;

const EXPLICIT_PROJECT_RE = /\b(project|projects|portfolio|side project|case study)\b/i;

const ROLE_TITLE_RE =
  /\b(?:engineer|designer|developer|manager|lead|director|analyst|consultant|architect|specialist|coordinator)\s+at\b/i;

const DATE_RANGE_RE =
  /\b(?:19|20)\d{2}\s*(?:-|\u2013|\u2014|\bto\b)\s*(?:(?:19|20)\d{2}|present|current|now)\b/i;

const PROJECT_ACTIVITY_RE =
  /\b(proud|built|build|building|shipped|shipping|launched|launching|created|creating|designed|designing|developed|developing|made|migrated|rebuilt|rebuilding|redesigned|redesigning)\b/i;

const ROLE_RE =
  /\b(work history|employment history|role|roles|worked as|working as|job title|position|profession)\b/i;

const RESULT_RE =
  /\b(results?|impact|outcomes?|kpis?|metrics?|conversion|retention|churn|revenue|growth|profit|costs?|efficiency|performance|improved|increase[ds]?|decreased?|reduced?|cut|saved?|grew)\b/i;

const PLACEHOLDER_IMAGE_RE =
  /(?:^|[/_.\-\s])(?:placeholder|placehold\.co|no[-_ ]?image|missing|coming[-_ ]?soon|default)(?=[/_.\-\s]|$)/i;

const CALENDAR_YEAR_RE = /^(?:18|19|20)\d{2}$/;

/**
 * Metric-shaped tokens, ordered from most to least specific. When two
 * patterns match at the same offset the earlier pattern wins, so "38%" is
 * preferred over the bare "38" inside it.
 */
const STAT_PATTERNS: RegExp[] = [
  /[\u20ac$\u00a3]\s?\d[\d.,]*\s?(?:k|m|bn|b|million|billion|thousand)?/gi,
  /\b\d[\d.,]*\s?(?:%|percent(?:age)?)/gi,
  /\b\d[\d.,]*\s?(?:x|\u00d7)\b/gi,
  /\b\d[\d.,]*\s?(?:k|m|bn)\+?\b/gi,
  /\b\d[\d.,]*\s+(?:days?|weeks?|months?|years?|hours?|minutes?|seconds?|people|users|customers|clients|calls?|tickets?|orders?|accounts?|projects?|releases?|teams?|engineers?|staff|students?|patients?|bookings?|signups?|applicants?)\b/gi,
  /\b(?:a|one)\s+(?:third|quarter|half)\b/gi,
  /\b(?:two|three|four|five|ten)\s+(?:times|x)\b/gi,
  /\b\d{1,3}(?:,\d{3})+\b/g,
  /\b\d+(?:\.\d+)?\b/g,
];

function optionalText(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function concise(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= CONTEXT_MAX_LENGTH) return trimmed;
  return trimmed.slice(0, CONTEXT_MAX_LENGTH - 1).trimEnd() + "\u2026";
}

function moduleTitle(fact: FactView, kind: ReviewModuleKind): string {
  return optionalText(fact.meta?.title) ?? optionalText(fact.prompt) ?? REVIEW_MODULE_KIND_LABEL[kind];
}

/** First metric-shaped token in a claim, or null when the claim has none. */
function extractStat(claim: string): string | null {
  const text = claim.trim();
  if (!text) return null;

  const candidates: Array<{ index: number; priority: number; value: string }> = [];
  STAT_PATTERNS.forEach((pattern, priority) => {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const value = match[0].trim();
      if (!value || CALENDAR_YEAR_RE.test(value)) continue;
      candidates.push({ index: match.index ?? 0, priority, value });
      break;
    }
  });
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.index - b.index || a.priority - b.priority);
  return candidates[0].value;
}

function achievementStat(fact: FactView): string | null {
  return optionalText(fact.meta?.stat) ?? extractStat(fact.claim);
}

function inferReviewKind(fact: FactView): ReviewModuleKind {
  const text = (fact.prompt || "") + " " + fact.claim;

  if (QUALIFICATION_RE.test(text)) return "qualification";
  if (AVAILABILITY_RE.test(text)) return "availability";
  if (RESPONSIBILITY_RE.test(text)) return "responsibility";
  if (EXPLICIT_PROJECT_RE.test(text)) return "project";
  if (ROLE_TITLE_RE.test(text) || DATE_RANGE_RE.test(text)) return "timeline";
  if (extractStat(fact.claim) !== null) return "achievement";
  if (PROJECT_ACTIVITY_RE.test(text)) return "project";
  if (ROLE_RE.test(text)) return "timeline";
  if (RESULT_RE.test(text)) return "result";
  return "fact";
}

function classifyFact(fact: FactView): ReviewModuleKind {
  const explicit = fact.meta?.module;
  if (explicit) {
    const mapped = FACT_MODULE_KIND_TO_REVIEW_KIND[explicit];
    if (mapped !== undefined) return mapped;
  }
  return inferReviewKind(fact);
}

function combineProvenance(facts: FactView[]): Provenance {
  if (facts.length > 0 && facts.every((fact) => fact.provenance === "EMPLOYER_CONFIRMED")) {
    return "EMPLOYER_CONFIRMED";
  }
  return "SELF_CLAIMED";
}

function reviewImage(meta: FactMeta): string | null {
  const image = optionalText(meta?.image);
  if (!image || PLACEHOLDER_IMAGE_RE.test(image)) return null;
  return image;
}

function reviewLink(fact: FactView): string | null {
  const link = optionalText(fact.evidenceUrl);
  return link ?? null;
}

function monthsBetween(start: string | undefined, end: string | null | undefined): number | undefined {
  const from = optionalText(start);
  const to = optionalText(end);
  if (!from || !to) return undefined;
  const fromMatch = /^(\d{4})-(\d{2})$/.exec(from);
  const toMatch = /^(\d{4})-(\d{2})$/.exec(to);
  if (!fromMatch || !toMatch) return undefined;
  const months = (Number(toMatch[1]) - Number(fromMatch[1])) * 12 + (Number(toMatch[2]) - Number(fromMatch[2]));
  return months > 0 ? months : undefined;
}

function buildAchievementModule(fact: FactView, stat: string): AchievementReviewModule {
  const context = optionalText(fact.meta?.context) ?? concise(fact.claim);
  return {
    id: "achievement:" + fact.id,
    kind: "achievement",
    title: moduleTitle(fact, "achievement"),
    factIds: [fact.id],
    provenance: fact.provenance,
    stat,
    context,
  };
}

function buildProjectModule(fact: FactView): ProjectReviewModule {
  const meta = fact.meta ?? {};
  const reviewModule: ProjectReviewModule = {
    id: "project:" + fact.id,
    kind: "project",
    title: moduleTitle(fact, "project"),
    factIds: [fact.id],
    provenance: fact.provenance,
    outcome: optionalText(meta.outcome) ?? fact.claim.trim(),
    image: reviewImage(meta),
    link: reviewLink(fact),
  };

  const organisation = optionalText(meta.organisation);
  if (organisation) reviewModule.organisation = organisation;
  const start = optionalText(meta.start);
  if (start) reviewModule.start = start;
  const end = optionalText(meta.end);
  if (end) reviewModule.end = end;

  return reviewModule;
}

function roleEntryTitle(fact: FactView): string {
  return optionalText(fact.meta?.title) ?? optionalText(fact.prompt) ?? "Role";
}

function buildTimelineModule(datedRoleFacts: FactView[]): TimelineReviewModule {
  const dated = datedRoleFacts
    .map((fact, index) => ({ fact, index, start: optionalText(fact.meta?.start) }))
    .filter((entry): entry is { fact: FactView; index: number; start: string } => entry.start !== undefined)
    .sort((a, b) => {
      if (a.start !== b.start) return a.start < b.start ? 1 : -1;
      return a.index - b.index;
    });

  const entries: TimelineEntry[] = dated.map(({ fact, start }) => ({
    factId: fact.id,
    title: roleEntryTitle(fact),
    organisation: optionalText(fact.meta?.organisation) ?? "",
    start,
    end: optionalText(fact.meta?.end) ?? null,
    provenance: fact.provenance,
  }));

  return {
    id: "timeline:" + entries.map((entry) => entry.factId).join("+"),
    kind: "timeline",
    title: REVIEW_MODULE_KIND_LABEL.timeline,
    factIds: entries.map((entry) => entry.factId),
    provenance: combineProvenance(dated.map((entry) => entry.fact)),
    entries,
  };
}

function buildSkillsModule(facts: FactView[]): SkillsReviewModule | null {
  const byKey = new Map<string, SkillEntry>();
  const contributingFacts: FactView[] = [];
  const contributingIds = new Set<string>();

  const addSkill = (fact: FactView, rawSkill: string, months: number | undefined): void => {
    const name = optionalText(rawSkill);
    if (!name) return;
    const key = name.toLowerCase();
    const existing = byKey.get(key);
    if (existing) {
      if (!existing.factIds.includes(fact.id)) existing.factIds.push(fact.id);
      if (months !== undefined) existing.months = Math.max(existing.months ?? 0, months);
      return;
    }
    byKey.set(key, months === undefined ? { name, factIds: [fact.id] } : { name, factIds: [fact.id], months });
  };

  for (const fact of facts) {
    const months = monthsBetween(fact.meta?.start, fact.meta?.end);
    const metaSkills = Array.isArray(fact.meta?.skills) ? fact.meta.skills : [];
    const tags = Array.isArray(fact.skillTags) ? fact.skillTags : [];
    for (const skill of metaSkills) addSkill(fact, skill, months);
    for (const skill of tags) addSkill(fact, skill, months);
  }

  const skills = Array.from(byKey.values()).slice(0, MAX_SKILLS);
  if (skills.length < 2) return null;

  for (const skill of skills) {
    for (const factId of skill.factIds) {
      if (contributingIds.has(factId)) continue;
      const source = facts.find((fact) => fact.id === factId);
      if (source) {
        contributingIds.add(factId);
        contributingFacts.push(source);
      }
    }
  }

  const skillFactIds = Array.from(new Set(skills.flatMap((skill) => skill.factIds)));

  return {
    id: "skills:" + skillFactIds.join("+"),
    kind: "skills",
    title: REVIEW_MODULE_KIND_LABEL.skills,
    factIds: contributingFacts.map((fact) => fact.id),
    provenance: combineProvenance(contributingFacts),
    skills,
  };
}

function fallbackKind(kind: ReviewModuleKind): TextReviewModuleKind {
  switch (kind) {
    case "result":
    case "responsibility":
    case "qualification":
    case "availability":
      return kind;
    case "achievement":
      return "result";
    default:
      return "fact";
  }
}

const TEXT_KIND_PREFERENCE: Record<TextReviewModuleKind, number> = {
  result: 0,
  responsibility: 1,
  qualification: 2,
  availability: 3,
  fact: 4,
};

function buildTextModule(fact: FactView, kind: TextReviewModuleKind): TextReviewModule {
  const reviewModule: TextReviewModule = {
    id: kind + ":" + fact.id,
    kind,
    title: optionalText(fact.prompt) ?? REVIEW_MODULE_KIND_LABEL[kind],
    factIds: [fact.id],
    provenance: fact.provenance,
    body: fact.claim.trim(),
  };
  const metaTitle = optionalText(fact.meta?.title);
  if (metaTitle) reviewModule.metaTitle = metaTitle;
  return reviewModule;
}

function resolveLimit(max: number): number {
  if (!Number.isFinite(max)) return 0;
  return Math.max(0, Math.floor(max));
}

/**
 * Build at most `max` review modules for a candidate.
 *
 * Works with nothing but the visible facts: modules are built in the order
 * achievement, project, timeline, skills, then result / responsibility /
 * qualification / availability, and finally plain fact modules. A fact is
 * allowed to feed at most one portfolio module (the timeline may combine
 * several role facts), so a card never repeats a claim in two modules. The
 * skills module is cross-cutting and does not consume its source facts.
 */
export function buildReviewModules(candidate: CandidateDetail, max = DEFAULT_MAX_MODULES): ReviewModule[] {
  const limit = resolveLimit(max);
  if (limit === 0) return [];

  const facts = (candidate.facts ?? []).filter((fact) => Boolean(optionalText(fact.claim)));
  if (facts.length === 0) return [];

  const classified = facts.map((fact) => ({ fact, kind: classifyFact(fact) }));
  const modules: ReviewModule[] = [];
  const usedFactIds = new Set<string>();

  for (const entry of classified) {
    if (entry.kind !== "achievement") continue;
    const stat = achievementStat(entry.fact);
    if (!stat) continue;
    modules.push(buildAchievementModule(entry.fact, stat));
    usedFactIds.add(entry.fact.id);
    break;
  }

  const project = classified.find((entry) => entry.kind === "project");
  if (project) {
    modules.push(buildProjectModule(project.fact));
    usedFactIds.add(project.fact.id);
  }

  const datedRoleFacts = classified
    .filter((entry) => entry.kind === "timeline" && optionalText(entry.fact.meta?.start) !== undefined)
    .map((entry) => entry.fact);
  if (datedRoleFacts.length > 0) {
    modules.push(buildTimelineModule(datedRoleFacts));
    for (const fact of datedRoleFacts) usedFactIds.add(fact.id);
  }

  const skillsModule = buildSkillsModule(facts);
  if (skillsModule) modules.push(skillsModule);

  const fallback = classified
    .filter((entry) => !usedFactIds.has(entry.fact.id))
    .map((entry, index) => {
      const kind = fallbackKind(entry.kind);
      return { fact: entry.fact, kind, index, preference: TEXT_KIND_PREFERENCE[kind] };
    })
    .sort((a, b) => a.preference - b.preference || a.index - b.index);

  const remaining = limit - modules.length;
  if (remaining > 0) {
    for (const entry of fallback.slice(0, remaining)) {
      modules.push(buildTextModule(entry.fact, entry.kind));
    }
  }

  return modules.slice(0, limit);
}
