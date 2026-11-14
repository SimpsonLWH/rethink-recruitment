import type { FactMeta } from "@/lib/fact-meta";
import type { CandidateDetail, FactView } from "@/lib/repo";

/**
 * Deterministic "Customise feed" rules parser and matcher.
 *
 * The parser turns free-text preference rules (for example
 * "React, at least 2 years, finance background") into structured criteria.
 * The matcher compares those criteria against a candidate's facts only: the
 * candidate's name, headline, location, bio, monogram and tags are never read.
 * There is no model call, network call, ranking or hidden scoring here.
 */

export type FeedCriterionKind = "SKILL" | "EXPERIENCE" | "DOMAIN";

export interface FeedCriterion {
  id: string;
  kind: FeedCriterionKind;
  label: string;
  value: string;
  years?: number;
  skill?: string;
  sourceText?: string;
}

export interface FeedParseResult {
  criteria: FeedCriterion[];
  rejected: Array<{ text: string; reason: string }>;
  unparsed: string[];
}

export type FeedCriterionStatus = "exact" | "related" | "unknown" | "uncertain" | "not_met";

export interface FeedCriterionMatch {
  criterion: FeedCriterion;
  status: FeedCriterionStatus;
  factIds: string[];
  explanation: string;
  countedMonths?: number;
  relatedSkill?: string;
  selfDescribedYears?: number;
}

export interface CandidateFeedMatch {
  candidateId: string;
  criteria: FeedCriterionMatch[];
  state: "in_feed" | "not_stated" | "outside";
  inFeed: boolean;
  hasNotMet: boolean;
  hasUnknown: boolean;
  hasRelated: boolean;
}

const MONTHS_PER_YEAR = 12;
const DOMAIN_CONTEXT_PATTERN =
  /\b(?:background|backgrounds|domain|industry|sector|field|space|vertical|experience\s+in|worked\s+in|work\s+in)\b/i;

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeIdValue(value: string): string {
  return normalizeText(value).replace(/\s+/g, "-");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^{}()|[\]\\$]/g, "\\$&");
}

/** Builds a word-bounded regex source for a plain-language phrase. */
function phrasePattern(phrase: string, separator = "\\s+"): string {
  const tokens = normalizeText(phrase).split(" ").filter(Boolean);
  if (tokens.length === 0) return "";
  return "\\b" + tokens.map(escapeRegExp).join(separator) + "\\b";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function countWords(count: number, singular: string, plural?: string): string {
  return count + " " + (count === 1 ? singular : plural ?? singular + "s");
}

function joinSentences(parts: Array<string | undefined | null>): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(" ");
}

function uniqueStrings(values: readonly string[]): string[] {
  const result: string[] = [];
  for (const value of values) if (!result.includes(value)) result.push(value);
  return result;
}

function orderFactIds(facts: readonly FactView[], factIds: readonly string[]): string[] {
  const wanted = new Set(factIds);
  return facts.filter((fact) => wanted.has(fact.id)).map((fact) => fact.id);
}

function formatMonthSpan(months: number): string {
  if (months % MONTHS_PER_YEAR === 0) {
    const years = months / MONTHS_PER_YEAR;
    return years + " " + (years === 1 ? "year" : "years");
  }
  if (months > MONTHS_PER_YEAR) {
    const years = Math.floor(months / MONTHS_PER_YEAR);
    const remainder = months % MONTHS_PER_YEAR;
    return (
      years +
      " " +
      (years === 1 ? "year" : "years") +
      " " +
      remainder +
      " " +
      (remainder === 1 ? "month" : "months")
    );
  }
  return months + " " + (months === 1 ? "month" : "months");
}

// ---------------------------------------------------------------------------
// Lexicons
// ---------------------------------------------------------------------------

interface SkillLexiconEntry {
  name: string;
  aliases: readonly string[];
}

const SKILL_LEXICON: readonly SkillLexiconEntry[] = [
  { name: "React", aliases: ["React", "React.js", "ReactJS"] },
  { name: "TypeScript", aliases: ["TypeScript", "TS"] },
  { name: "JavaScript", aliases: ["JavaScript", "JS"] },
  { name: "Vue", aliases: ["Vue", "Vue.js", "VueJS"] },
  { name: "Angular", aliases: ["Angular", "AngularJS"] },
  { name: "Svelte", aliases: ["Svelte", "SvelteKit"] },
  { name: "Node.js", aliases: ["Node.js", "NodeJS", "Node"] },
  { name: "Python", aliases: ["Python"] },
  { name: "SQL", aliases: ["SQL"] },
  { name: "PostgreSQL", aliases: ["PostgreSQL", "Postgres"] },
  { name: "Design systems", aliases: ["Design systems", "Design system"] },
  { name: "Product design", aliases: ["Product design", "Product designer"] },
  { name: "UX research", aliases: ["UX research", "User research", "Research"] },
  { name: "Accessibility", aliases: ["Accessibility", "a11y"] },
  { name: "QA", aliases: ["QA", "Testing", "Quality assurance"] },
  { name: "Customer support", aliases: ["Customer support", "Customer service"] },
  { name: "Operations", aliases: ["Operations", "Ops"] },
  { name: "Logistics", aliases: ["Logistics", "Supply chain"] },
  { name: "Community", aliases: ["Community", "Community management"] },
  { name: "Machine learning", aliases: ["Machine learning", "ML"] },
  { name: "Data analysis", aliases: ["Data analysis", "Analytics", "Data analytics"] },
  { name: "Figma", aliases: ["Figma"] },
];

interface SkillAliasRecord {
  skill: string;
  normalizedAlias: string;
  tokenCount: number;
  regex: RegExp;
}

const SKILL_ORDER = new Map(SKILL_LEXICON.map((entry, index) => [entry.name, index]));

function buildSkillAliasRecords(): SkillAliasRecord[] {
  const records: SkillAliasRecord[] = [];
  for (const entry of SKILL_LEXICON) {
    for (const alias of entry.aliases) {
      const tokens = normalizeText(alias).split(" ").filter(Boolean);
      if (tokens.length === 0) continue;
      const pattern = "\\b" + tokens.map(escapeRegExp).join("[\\s._-]*") + "\\b";
      records.push({
        skill: entry.name,
        normalizedAlias: tokens.join(" "),
        tokenCount: tokens.length,
        regex: new RegExp(pattern, "gi"),
      });
    }
  }
  return records.sort(
    (left, right) =>
      right.tokenCount - left.tokenCount ||
      right.normalizedAlias.length - left.normalizedAlias.length ||
      (SKILL_ORDER.get(left.skill) ?? 0) - (SKILL_ORDER.get(right.skill) ?? 0),
  );
}

const SKILL_ALIAS_RECORDS: readonly SkillAliasRecord[] = buildSkillAliasRecords();

const SKILL_BY_NORMALIZED_ALIAS = new Map<string, string>();
for (const entry of SKILL_LEXICON) {
  SKILL_BY_NORMALIZED_ALIAS.set(normalizeText(entry.name), entry.name);
  for (const alias of entry.aliases) SKILL_BY_NORMALIZED_ALIAS.set(normalizeText(alias), entry.name);
}

function canonicalSkillForTag(value: string): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return SKILL_BY_NORMALIZED_ALIAS.get(normalized) ?? null;
}

interface DomainLexiconEntry {
  domain: string;
  aliases: readonly string[];
}

const DOMAIN_LEXICON: readonly DomainLexiconEntry[] = [
  { domain: "finance", aliases: ["finance", "fintech", "banking", "payments", "payment"] },
  { domain: "healthcare", aliases: ["healthcare", "health care", "healthtech", "health tech", "health"] },
  { domain: "retail", aliases: ["retail", "ecommerce", "e-commerce"] },
  { domain: "logistics", aliases: ["logistics", "supply chain", "warehousing"] },
  { domain: "education", aliases: ["education", "learning", "edtech", "education technology"] },
  { domain: "climate", aliases: ["climate", "climate tech", "sustainability", "clean energy"] },
  { domain: "civic", aliases: ["civic", "public sector", "government", "public service"] },
  { domain: "community", aliases: ["community", "nonprofit", "non-profit", "charity"] },
  { domain: "infrastructure", aliases: ["infrastructure"] },
  { domain: "analytics", aliases: ["analytics", "data"] },
];

interface DomainAliasRecord {
  domain: string;
  normalizedAlias: string;
  tokenCount: number;
  regex: RegExp;
}

function buildDomainAliasRecords(): DomainAliasRecord[] {
  const records: DomainAliasRecord[] = [];
  for (const entry of DOMAIN_LEXICON) {
    for (const alias of entry.aliases) {
      const tokens = normalizeText(alias).split(" ").filter(Boolean);
      if (tokens.length === 0) continue;
      const pattern = "\\b" + tokens.map(escapeRegExp).join("[\\s._-]*") + "\\b";
      records.push({
        domain: entry.domain,
        normalizedAlias: tokens.join(" "),
        tokenCount: tokens.length,
        regex: new RegExp(pattern, "gi"),
      });
    }
  }
  return records.sort(
    (left, right) =>
      right.tokenCount - left.tokenCount || right.normalizedAlias.length - left.normalizedAlias.length,
  );
}

const DOMAIN_ALIAS_RECORDS: readonly DomainAliasRecord[] = buildDomainAliasRecords();

const DOMAIN_BY_NORMALIZED_ALIAS = new Map<string, string>();
for (const entry of DOMAIN_LEXICON) {
  DOMAIN_BY_NORMALIZED_ALIAS.set(normalizeText(entry.domain), entry.domain);
  for (const alias of entry.aliases) DOMAIN_BY_NORMALIZED_ALIAS.set(normalizeText(alias), entry.domain);
}

function canonicalDomainForValue(value: string): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return DOMAIN_BY_NORMALIZED_ALIAS.get(normalized) ?? null;
}

// Skill pairs that are close enough to show as "related" evidence. The groups
// are expanded into a symmetric map so every relation works both ways.
function buildRelatedSkills(): Readonly<Record<string, readonly string[]>> {
  const groups: readonly (readonly string[])[] = [
    ["React", "Vue", "Angular", "Svelte"],
    ["TypeScript", "JavaScript"],
    ["JavaScript", "Node.js"],
    ["SQL", "PostgreSQL", "Data analysis"],
    ["Machine learning", "Python", "Data analysis"],
    ["Product design", "UX research", "Design systems", "Figma"],
    ["Accessibility", "QA"],
    ["Operations", "Logistics", "Customer support", "Community"],
  ];
  const related = new Map<string, Set<string>>();
  for (const group of groups) {
    for (const skill of group) {
      const bucket = related.get(skill) ?? new Set<string>();
      for (const other of group) if (other !== skill) bucket.add(other);
      related.set(skill, bucket);
    }
  }
  const result: Record<string, readonly string[]> = {};
  for (const entry of SKILL_LEXICON) {
    const bucket = related.get(entry.name);
    result[entry.name] = bucket
      ? [...bucket].sort((left, right) => (SKILL_ORDER.get(left) ?? 0) - (SKILL_ORDER.get(right) ?? 0))
      : [];
  }
  return result;
}

export const RELATED_SKILLS: Readonly<Record<string, readonly string[]>> = buildRelatedSkills();

// ---------------------------------------------------------------------------
// Protected-characteristic refusal
// ---------------------------------------------------------------------------

interface ProtectedCategory {
  key: string;
  reason: string;
  patterns: readonly RegExp[];
}

const PROTECTED_CATEGORIES: readonly ProtectedCategory[] = [
  {
    key: "age",
    reason:
      "Age and age proxies are protected characteristics; remove this phrase and filter on skills or dated experience instead.",
    patterns: [
      /\b(?:under|over|below|above|younger\s+than|older\s+than)\s+(?:the\s+)?(?:age\s+(?:of\s+)?)?\d{1,3}\s*(?:years?|yrs?)[\s-]*old\b/gi,
      /\b(?:under|over|below|above)\s+(?:the\s+)?\d{1,3}\s*(?:years?|yrs?)\s+(?:of\s+)?age\b/gi,
      /\b\d{1,3}\s*(?:years?|yrs?)[\s-]*old\b/gi,
      /\b(?:aged?|age)\s+(?:of\s+)?\d{1,3}\b/gi,
      /\b(?:under|over|below|above)\s+(?:the\s+)?\d{2}\b(?!\s*(?:years?|yrs?|months?|weeks?|days?|hours?|people|persons?|projects?|roles?|candidates?))/gi,
      /\b(?:young|younger|youthful|youth|seniors?|recent\s+graduates?|recent\s+grads?|fresh\s+graduates?|fresh\s+grads?|new\s+graduates?|new\s+grads?|recently\s+graduated|energetic|high[\s-]energy|digital\s+native|mature\s+candidate|older\s+candidate)\b/gi,
    ],
  },
  {
    key: "gender",
    reason:
      "Gender or gender identity is a protected characteristic; remove this phrase from the feed rules.",
    patterns: [
      /\b(?:gender|gender\s+identity|gender\s+expression|sex)\b/gi,
      /\b(?:male|female|man|woman|men|women|boy|girl|boys|girls|non[\s-]?binary|trans|transgender|trans\s+man|trans\s+woman|guys|ladies)\b/gi,
    ],
  },
  {
    key: "ethnicity",
    reason: "Ethnicity or race is a protected characteristic; remove this phrase from the feed rules.",
    patterns: [
      /\b(?:race|racial|racially|ethnic|ethnicity|ethnically|descent)\b/gi,
      /\b(?:caucasian|asian|african(?:\s+american)?|african[\s-]american|hispanic|latino|latina|latinx|indigenous|native\s+american|roma|romani|gypsy|minority|bame|people\s+of\s+colou?r|skin\s+colou?r)\b/gi,
      /\b(?:white|black)\b(?![\s-]*(?:box|boxes|board|boards|paper|papers|space|spaces|belt|belts|friday|label|labels|hat|hats|tie|ties|hole|holes|list|lists|magic|rock|rocks|smith|market|markets))/gi,
    ],
  },
  {
    key: "nationality",
    reason:
      "Nationality, citizenship or native-speaker status is a protected characteristic; remove this phrase from the feed rules.",
    patterns: [
      /\b(?:nationality|nationalities|citizen|citizenship|naturalised|naturalized|permanent\s+resident|green\s+card|work\s+permit|work\s+visa|visa\s+status|passport|country\s+of\s+birth|born\s+in)\b/gi,
      /\bnative(?:[\s-]+[a-z]+){0,3}[\s-]+speaker\b/gi,
      /\bnative[\s-]+(?:language|fluency|proficiency|level)\b/gi,
      /\bmother(?:[\s-]+tongue)\b|\bmother\s+tongue\b/gi,
      /\b(?:finnish|swedish|norwegian|danish|icelandic|estonian|latvian|lithuanian|russian|ukrainian|polish|czech|slovak|hungarian|romanian|bulgarian|greek|turkish|german|austrian|swiss|french|belgian|dutch|luxembourgish|british|scottish|welsh|irish|american|canadian|mexican|brazilian|argentinian|chilean|colombian|peruvian|indian|pakistani|bangladeshi|sri\s+lankan|nepali|chinese|taiwanese|japanese|korean|vietnamese|thai|filipino|indonesian|malaysian|singaporean|australian|new\s+zealander|egyptian|nigerian|ghanaian|kenyan|ethiopian|somali|south\s+african|moroccan|tunisian|israeli|palestinian|saudi|emirati|iranian|iraqi|syrian|lebanese|jordanian|afghan|kazakh)\b/gi,
    ],
  },
  {
    key: "disability",
    reason:
      "Disability or health status is a protected characteristic; remove this phrase from the feed rules.",
    patterns: [
      /\b(?:disabilit(?:y|ies)|disabled|handicap(?:ped)?|wheelchair[\s-]*user|blind|deaf|hard\s+of\s+hearing|autis(?:m|tic)|adhd|dyslexi(?:a|c)|mental\s+health|mental\s+illness|chronic\s+illness|chronic\s+pain|medical\s+(?:condition|conditions|history)|health\s+(?:condition|conditions|status)|sick\s+leave|serious\s+illness|cancer|hiv|aids|epilep(?:sy|tic)|bipolar|depression|anxiety|neurodivergent|neurotypical|able[\s-]bodied)\b/gi,
    ],
  },
  {
    key: "religion",
    reason: "Religion or religious belief is a protected characteristic; remove this phrase from the feed rules.",
    patterns: [
      /\b(?:religion|religious|christian|christianity|catholic|protestant|evangelical|jewish|judaism|muslim|islam|islamic|hindu|hinduism|buddhist|buddhism|sikh|sikhism|atheist|agnostic|church|mosque|synagogue|temple|faith[\s-]based|religious\s+beliefs?)\b/gi,
    ],
  },
  {
    key: "family",
    reason:
      "Family or marital status is a protected characteristic; remove this phrase from the feed rules.",
    patterns: [
      /\b(?:marital\s+status|married|unmarried|divorced|separated|widowed|spouse|husband|wife|domestic\s+partner|life\s+partner|boyfriend|girlfriend|fianc(?:e|ée)?|single\s+(?:parent|mother|father)|parent(?:al)?\s+status|children|childcare|child\s+care|kids|pregnan(?:t|cy)|maternity|paternity|family\s+(?:status|background|commitments?|situation)|relationship\s+status)\b/gi,
      /\bsingle\b(?![\s-]*(?:page|pages|sign|source|handed|handedly|track|tracked|cell|file|company|point|seat|thread|threaded|use|user|tenant|class|line|step|level|window|click|module|purpose|goal|metric))/gi,
    ],
  },
  {
    key: "orientation",
    reason: "Sexual orientation is a protected characteristic; remove this phrase from the feed rules.",
    patterns: [
      /\b(?:sexual\s+orientation|gay|lesbian|bisexual|bisexuality|queer|lgbtq?(?:ia)?\+?|homosexual|heterosexual|asexual|pansexual)\b/gi,
      /\bstraight\b(?![\s-]*(?:forward|line|through|up|away))/gi,
    ],
  },
];

// ---------------------------------------------------------------------------
// Experience phrase and leftover vocabulary
// ---------------------------------------------------------------------------

interface DurationMatch {
  start: number;
  end: number;
  years: number;
}

const DURATION_PATTERNS: readonly RegExp[] = [
  /\b(\d+)\s*(?:-|–|to)\s*\d+\s*(?:years?|yrs?)\b/i,
  /\b(?:at\s+least|more\s+than|minimum(?:\s+of)?|over)\s+(\d+(?:\.\d+)?)\s*(?:\+|plus)?\s*(?:years?|yrs?)\b/i,
  /\b(\d+(?:\.\d+)?)\s*(?:\+|plus)\s*(?:years?|yrs?)\b/i,
  /\b(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b/i,
];

function findDuration(text: string): DurationMatch | null {
  for (const pattern of DURATION_PATTERNS) {
    const match = pattern.exec(text);
    if (!match || match.index === undefined) continue;
    const years = Number(match[1]);
    if (!Number.isFinite(years) || years <= 0) continue;
    return { start: match.index, end: match.index + match[0].length, years };
  }
  return null;
}

const FILLER_WORDS = new Set(
  [
    "a", "an", "the", "and", "or", "of", "to", "in", "on", "at", "for", "with", "by", "from", "into",
    "about", "around", "approximately", "approx", "some", "any", "least", "more", "than", "over", "under",
    "plus", "minimum", "min", "maximum", "max", "ideally", "preferably", "preferred", "required", "require",
    "requires", "requirement", "requirements", "must", "should", "would", "could", "like", "similar",
    "relevant", "related", "also", "well", "very", "really", "strong", "solid", "good", "great",
    "excellent", "deep", "broad", "proven", "demonstrated", "track", "record", "professional", "commercial",
    "production", "practical", "working", "work", "worked", "works", "using", "use", "used", "hands",
    "handson", "developer", "developers", "engineer", "engineers", "designer", "designers", "manager",
    "managers", "analyst", "analysts", "specialist", "specialists", "lead", "leads", "architect", "architects",
    "coordinator", "coordinators", "administrator", "administrators", "consultant", "consultants", "scientist",
    "scientists", "researcher", "researchers", "practitioner", "practitioners", "professionals",
    "person", "people", "someone", "somebody", "candidate", "candidates", "applicant", "applicants", "individual",
    "individuals", "role", "roles", "position", "positions", "job", "jobs", "team", "teams", "member", "members",
    "experience", "experienced", "background", "backgrounds", "skill", "skills", "skilled", "ability",
    "abilities", "knowledge", "understanding", "familiar", "familiarity", "proficient", "proficiency",
    "expertise", "expert", "years", "year", "yrs", "yr", "months", "month", "time", "full", "part",
    "fulltime", "parttime", "bonus", "nice", "have", "has", "having", "had", "been", "being", "is", "are",
    "was", "were", "be", "do", "does", "did", "as", "our", "we", "us", "your", "their", "this", "that",
    "these", "those", "it", "its", "i", "me", "my", "who", "whom", "which", "what", "when", "where", "why",
    "how", "you", "they", "them", "he", "she", "his", "her", "there", "here", "not", "no", "yes", "need",
    "needs", "needed", "want", "wants", "wanting", "looking", "look", "seeking", "seek", "anyone",
    "junior", "graduate", "graduates", "degree", "analytical", "detail", "oriented", "communication",
    "stakeholder", "stakeholders", "management", "skillset", "comfortable",
  ].map((word) => normalizeText(word)),
);

function collectLeftover(text: string): string {
  const rawTokens = text.split(/[^A-Za-z0-9+#.'’-]+/);
  const kept: string[] = [];
  for (const rawToken of rawTokens) {
    const token = rawToken.replace(/^[.'’+-]+/, "").replace(/[.'’+-]+$/, "");
    if (token.length <= 1) continue;
    if (/^\d/.test(token)) continue;
    if (FILLER_WORDS.has(normalizeText(token))) continue;
    kept.push(token);
  }
  return kept.join(" ").trim();
}

interface ClauseSpan {
  start: number;
  end: number;
}

function spansOverlap(left: { start: number; end: number }, right: { start: number; end: number }): boolean {
  return left.start < right.end && right.start < left.end;
}

function mergeSpans(spans: readonly ClauseSpan[]): ClauseSpan[] {
  const sorted = [...spans].sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: ClauseSpan[] = [];
  for (const span of sorted) {
    const last = merged[merged.length - 1];
    if (last && span.start <= last.end) {
      last.end = Math.max(last.end, span.end);
    } else {
      merged.push({ start: span.start, end: span.end });
    }
  }
  return merged;
}

function stripRanges(text: string, spans: readonly ClauseSpan[]): string {
  const characters = text.split("");
  for (const span of spans) {
    for (let index = span.start; index < span.end && index < characters.length; index += 1) {
      characters[index] = " ";
    }
  }
  return characters.join("");
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

interface LocatedMatch {
  start: number;
  end: number;
  text: string;
}

function findProtectedMatches(text: string, category: ProtectedCategory): LocatedMatch[] {
  const matches: LocatedMatch[] = [];
  for (const pattern of category.patterns) {
    for (const match of text.matchAll(pattern)) {
      if (match.index === undefined) continue;
      if (!match[0].trim()) continue;
      matches.push({ start: match.index, end: match.index + match[0].length, text: match[0] });
    }
  }
  return matches.sort((left, right) => left.start - right.start || right.end - left.end);
}

interface SkillHit {
  skill: string;
  start: number;
  end: number;
}

interface DomainHit {
  domain: string;
  start: number;
  end: number;
}

function blankRange(text: string, start: number, end: number): string {
  return text.slice(0, start) + " ".repeat(end - start) + text.slice(end);
}

function addCriterion(result: FeedParseResult, seen: Set<string>, criterion: FeedCriterion): void {
  if (seen.has(criterion.id)) return;
  seen.add(criterion.id);
  result.criteria.push(criterion);
}

function addUnparsed(result: FeedParseResult, seen: Set<string>, text: string): void {
  const normalized = normalizeText(text);
  if (!normalized || seen.has(normalized)) return;
  seen.add(normalized);
  result.unparsed.push(text);
}

export function parseFeedPreferenceRules(text: string): FeedParseResult {
  const result: FeedParseResult = { criteria: [], rejected: [], unparsed: [] };
  const seenCriteria = new Set<string>();
  const seenRejected = new Set<string>();
  const seenUnparsed = new Set<string>();
  const clauses = text.split(/[,;\n•]+/).map((clause) => clause.trim()).filter(Boolean);
  let lastSkill: string | undefined;

  for (const clause of clauses) {
    let working = clause;

    // 1. Refuse protected/proxy phrases but keep parsing the rest of the clause.
    for (const category of PROTECTED_CATEGORIES) {
      const matches = findProtectedMatches(working, category);
      if (matches.length === 0) continue;
      const matchedTexts: string[] = [];
      for (const match of matches) {
        const matchedText = match.text.trim();
        if (!matchedText) continue;
        if (!matchedTexts.some((existing) => normalizeText(existing) === normalizeText(matchedText))) {
          matchedTexts.push(matchedText);
        }
      }
      const rejectionKey = category.key + ":" + matchedTexts.map((value) => normalizeText(value)).join("|");
      if (!seenRejected.has(rejectionKey)) {
        seenRejected.add(rejectionKey);
        result.rejected.push({ text: matchedTexts.join(", "), reason: category.reason });
      }
      for (const span of mergeSpans(matches)) working = blankRange(working, span.start, span.end);
    }

    // 2. Experience phrase (for example "at least 2 years").
    const duration = findDuration(working);
    if (duration) working = blankRange(working, duration.start, duration.end);

    // 3. Skills from the clause. Longer aliases win so "design systems" is not
    //    split into noise, and "React.js" does not match twice.
    const skillHits: SkillHit[] = [];
    for (const record of SKILL_ALIAS_RECORDS) {
      for (const match of working.matchAll(record.regex)) {
        if (match.index === undefined) continue;
        const start = match.index;
        const end = start + match[0].length;
        if (end <= start) continue;
        if (skillHits.some((hit) => spansOverlap(hit, { start, end }))) continue;
        skillHits.push({ skill: record.skill, start, end });
      }
    }
    skillHits.sort((left, right) => left.start - right.start || left.end - right.end);

    // 4. Domains. A domain that overlaps a skill alias needs explicit domain
    //    context ("finance background"); otherwise the skill reading wins.
    const hasDomainContext = DOMAIN_CONTEXT_PATTERN.test(working);
    const domainHits: DomainHit[] = [];
    for (const record of DOMAIN_ALIAS_RECORDS) {
      for (const match of working.matchAll(record.regex)) {
        if (match.index === undefined) continue;
        const start = match.index;
        const end = start + match[0].length;
        if (end <= start) continue;
        if (domainHits.some((hit) => spansOverlap(hit, { start, end }))) continue;
        const overlapsSkill = skillHits.some((hit) => spansOverlap(hit, { start, end }));
        if (overlapsSkill && !hasDomainContext) continue;
        domainHits.push({ domain: record.domain, start, end });
      }
    }
    domainHits.sort((left, right) => left.start - right.start || left.end - right.end);

    // Domains claimed above override the overlapping skill reading.
    const acceptedSkillHits = skillHits.filter(
      (hit) => !domainHits.some((domainHit) => spansOverlap(hit, domainHit)),
    );
    const acceptedSkills = uniqueStrings(
      acceptedSkillHits.sort((left, right) => left.start - right.start).map((hit) => hit.skill),
    );
    const acceptedDomains = uniqueStrings(domainHits.map((hit) => hit.domain));

    // 5. Work out which skill the experience phrase belongs to: a trailing
    //    skill in the same clause, then a preceding skill in the clause, then
    //    the nearest preceding parsed skill, then a generic experience rule.
    let experienceSkill: string | undefined;
    if (duration) {
      const trailing = acceptedSkillHits.find((hit) => hit.start >= duration.end);
      const preceding = acceptedSkillHits.filter((hit) => hit.end <= duration.start);
      experienceSkill = trailing
        ? trailing.skill
        : preceding.length > 0
          ? preceding[preceding.length - 1].skill
          : lastSkill;
    }

    for (const skill of acceptedSkills) {
      addCriterion(result, seenCriteria, {
        id: "skill:" + normalizeIdValue(skill),
        kind: "SKILL",
        label: skill,
        value: skill,
        skill,
        sourceText: clause,
      });
    }

    if (duration) {
      const years = duration.years;
      const yearsText = String(years);
      addCriterion(result, seenCriteria, {
        id: experienceSkill
          ? "experience:" + normalizeIdValue(experienceSkill) + ":" + yearsText
          : "experience:general:" + yearsText,
        kind: "EXPERIENCE",
        label: experienceSkill ? yearsText + "+ years of " + experienceSkill : yearsText + "+ years of experience",
        value: experienceSkill ?? "experience",
        years,
        skill: experienceSkill,
        sourceText: clause,
      });
    }

    for (const domain of acceptedDomains) {
      addCriterion(result, seenCriteria, {
        id: "domain:" + normalizeIdValue(domain),
        kind: "DOMAIN",
        label: capitalize(domain),
        value: domain,
        sourceText: clause,
      });
    }

    // 6. Leftover meaningful terms are reported, never silently dropped.
    const stripped = stripRanges(working, [
      ...acceptedSkillHits.map((hit) => ({ start: hit.start, end: hit.end })),
      ...domainHits.map((hit) => ({ start: hit.start, end: hit.end })),
    ]);
    const leftover = collectLeftover(stripped);
    if (leftover) addUnparsed(result, seenUnparsed, leftover);

    if (acceptedSkills.length > 0) lastSkill = acceptedSkills[acceptedSkills.length - 1];
  }

  return result;
}

// ---------------------------------------------------------------------------
// Matcher evidence helpers
// ---------------------------------------------------------------------------

interface DatedInterval {
  factId: string;
  start: number;
  end: number;
}

interface MergedInterval {
  start: number;
  end: number;
}

interface RelatedDatedEvidence {
  skill: string;
  months: number;
  factIds: string[];
}

interface RelatedMentionEvidence {
  skill: string;
  factIds: string[];
}

interface SelfDescribedYears {
  years: number;
  factIds: string[];
}

function metaOf(fact: FactView): FactMeta {
  return fact.meta ?? {};
}

function canonicalSkillTags(fact: FactView): string[] {
  const tags = [...fact.skillTags, ...(metaOf(fact).skills ?? [])];
  const canonical: string[] = [];
  for (const tag of tags) {
    const skill = canonicalSkillForTag(tag);
    if (skill && !canonical.includes(skill)) canonical.push(skill);
  }
  return canonical;
}

const skillMentionRegexCache = new Map<string, RegExp>();

function skillMentionPattern(skill: string): string {
  const aliases = SKILL_ALIAS_RECORDS.filter((record) => record.skill === skill).map(
    (record) => phrasePattern(record.normalizedAlias, "\\s+"),
  );
  return aliases.length > 0 ? aliases.join("|") : phrasePattern(skill, "\\s+");
}

function skillMentionRegex(skill: string): RegExp {
  const cached = skillMentionRegexCache.get(skill);
  if (cached) return cached;
  const regex = new RegExp("(?:" + skillMentionPattern(skill) + ")", "i");
  skillMentionRegexCache.set(skill, regex);
  return regex;
}

function factMentionsSkill(fact: FactView, skill: string): boolean {
  if (canonicalSkillTags(fact).includes(skill)) return true;
  return skillMentionRegex(skill).test(normalizeText(fact.claim));
}

const domainMentionRegexCache = new Map<string, RegExp>();

function domainMentionRegex(domain: string): RegExp {
  const cached = domainMentionRegexCache.get(domain);
  if (cached) return cached;
  const entry = DOMAIN_LEXICON.find((candidate) => candidate.domain === domain);
  const aliases = entry ? entry.aliases : [domain];
  const source = aliases.map((alias) => phrasePattern(alias, "\\s+")).join("|");
  const regex = new RegExp(source || phrasePattern(domain, "\\s+"), "i");
  domainMentionRegexCache.set(domain, regex);
  return regex;
}

function parseMonth(value: string | null | undefined): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return year * MONTHS_PER_YEAR + (month - 1);
}

function datedSkillIntervals(facts: readonly FactView[], skill: string): DatedInterval[] {
  const intervals: DatedInterval[] = [];
  for (const fact of facts) {
    const meta = metaOf(fact);
    const metaSkills = meta.skills ?? [];
    const hasSkill = metaSkills.some((tag) => canonicalSkillForTag(tag) === skill);
    if (!hasSkill) continue;
    const start = parseMonth(meta.start);
    const end = parseMonth(meta.end);
    if (start === null || end === null || end <= start) continue;
    intervals.push({ factId: fact.id, start, end });
  }
  return intervals;
}

function allDatedIntervals(facts: readonly FactView[]): DatedInterval[] {
  const intervals: DatedInterval[] = [];
  for (const fact of facts) {
    const meta = metaOf(fact);
    const start = parseMonth(meta.start);
    const end = parseMonth(meta.end);
    if (start === null || end === null || end <= start) continue;
    intervals.push({ factId: fact.id, start, end });
  }
  return intervals;
}

function mergeIntervals(intervals: readonly DatedInterval[]): MergedInterval[] {
  const sorted = [...intervals].sort(
    (left, right) => left.start - right.start || left.end - right.end || left.factId.localeCompare(right.factId),
  );
  const merged: MergedInterval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ start: interval.start, end: interval.end });
    }
  }
  return merged;
}

function totalMonths(intervals: readonly MergedInterval[]): number {
  return intervals.reduce((total, interval) => total + (interval.end - interval.start), 0);
}

function relatedDatedEvidence(facts: readonly FactView[], skill: string): RelatedDatedEvidence | null {
  let best: RelatedDatedEvidence | null = null;
  for (const relatedSkill of RELATED_SKILLS[skill] ?? []) {
    const intervals = datedSkillIntervals(facts, relatedSkill);
    if (intervals.length === 0) continue;
    const months = totalMonths(mergeIntervals(intervals));
    if (months <= 0) continue;
    if (!best || months > best.months) {
      best = {
        skill: relatedSkill,
        months,
        factIds: orderFactIds(facts, intervals.map((interval) => interval.factId)),
      };
    }
  }
  return best;
}

function relatedMentionEvidence(facts: readonly FactView[], skill: string): RelatedMentionEvidence | null {
  for (const relatedSkill of RELATED_SKILLS[skill] ?? []) {
    const factIds = orderFactIds(
      facts,
      facts.filter((fact) => factMentionsSkill(fact, relatedSkill)).map((fact) => fact.id),
    );
    if (factIds.length > 0) return { skill: relatedSkill, factIds };
  }
  return null;
}

const selfDescribedSkillRegexCache = new Map<string, readonly RegExp[]>();

function selfDescribedSkillRegexes(skill: string): readonly RegExp[] {
  const cached = selfDescribedSkillRegexCache.get(skill);
  if (cached) return cached;
  const alias = "(?:" + skillMentionPattern(skill) + ")";
  const years = "\\b(\\d{1,3}(?:\\.\\d+)?)\\s*(?:\\+\\s*)?(?:years?|yrs?)\\b";
  const before = "\\b(?:more\\s+than|over|at\\s+least\\s+)?";
  const link =
    "(?:\\s+(?:of|with|using|in|working|experience|professional|commercial|hands\\s+on|relevant))*\\s+";
  const regexes = [
    new RegExp(before + years + link + alias, "i"),
    new RegExp(alias + "\\s+(?:for|over)?\\s*" + years, "i"),
  ];
  selfDescribedSkillRegexCache.set(skill, regexes);
  return regexes;
}

const GENERIC_SELF_DESCRIBED_REGEXES: readonly RegExp[] = [
  /\b(?:more\s+than|over|at\s+least\s+)?(\d{1,3}(?:\.\d+)?)\s*(?:\+\s*)?(?:years?|yrs?)\b(?:\s+(?:of|professional|commercial|hands\s+on|relevant|industry))*\s+experience\b/i,
  /\bexperience\s+(?:of\s+|for\s+)?(\d{1,3}(?:\.\d+)?)\s*(?:\+\s*)?(?:years?|yrs?)\b/i,
];

function firstNumber(regexes: readonly RegExp[], claim: string): number | null {
  let best: number | null = null;
  for (const regex of regexes) {
    const match = regex.exec(claim);
    if (!match) continue;
    const years = Number(match[1]);
    if (!Number.isFinite(years)) continue;
    if (best === null || years > best) best = years;
  }
  return best;
}

function selfDescribedYearsFor(facts: readonly FactView[], skill: string | undefined): SelfDescribedYears | null {
  const hits: Array<{ factId: string; years: number }> = [];
  for (const fact of facts) {
    const claim = normalizeText(fact.claim);
    const years = skill
      ? firstNumber(selfDescribedSkillRegexes(skill), claim)
      : firstNumber(GENERIC_SELF_DESCRIBED_REGEXES, claim);
    if (years !== null && years > 0) hits.push({ factId: fact.id, years });
  }
  if (hits.length === 0) return null;
  const max = Math.max(...hits.map((hit) => hit.years));
  return { years: max, factIds: orderFactIds(facts, hits.map((hit) => hit.factId)) };
}

function describeDatedEvidence(facts: readonly FactView[], intervals: readonly DatedInterval[]): string {
  const factIds = orderFactIds(facts, intervals.map((interval) => interval.factId));
  const factById = new Map(facts.map((fact) => [fact.id, fact] as const));
  const labels: string[] = [];
  for (const factId of factIds) {
    const fact = factById.get(factId);
    if (!fact) {
      labels.push("dated entry");
      continue;
    }
    const meta = metaOf(fact);
    const moduleWord = meta.module === "PROJECT" ? "project" : meta.module === "ROLE" ? "role" : "dated entry";
    const title = meta.title ?? meta.organisation;
    labels.push(title ? title + ", " + moduleWord : moduleWord);
  }
  const count = countWords(factIds.length, "role/project entry", "role/project entries");
  return labels.length > 0 ? count + " (" + labels.join("; ") + ")" : count;
}

// ---------------------------------------------------------------------------
// Criterion matchers
// ---------------------------------------------------------------------------

function matchSkillCriterion(facts: readonly FactView[], criterion: FeedCriterion): FeedCriterionMatch {
  const skill = criterion.skill ?? criterion.value;
  const exactFactIds = orderFactIds(
    facts,
    facts.filter((fact) => canonicalSkillTags(fact).includes(skill)).map((fact) => fact.id),
  );
  if (exactFactIds.length > 0) {
    return {
      criterion,
      status: "exact",
      factIds: exactFactIds,
      explanation: "Stated directly in skill tags or structured metadata (" + countWords(exactFactIds.length, "fact") + ").",
    };
  }
  const related = relatedMentionEvidence(facts, skill);
  if (related) {
    return {
      criterion,
      status: "related",
      factIds: related.factIds,
      relatedSkill: related.skill,
      explanation: related.skill + " is related to " + skill + "; no direct " + skill + " evidence.",
    };
  }
  return {
    criterion,
    status: "unknown",
    factIds: [],
    explanation: "No direct " + skill + " skill tag or metadata evidence in the record.",
  };
}

function matchDomainCriterion(facts: readonly FactView[], criterion: FeedCriterion): FeedCriterionMatch {
  const domain = canonicalDomainForValue(criterion.value) ?? normalizeText(criterion.value);
  const mentionedFactIds = orderFactIds(
    facts,
    facts
      .filter((fact) => {
        const metaDomains = metaOf(fact).domain ?? [];
        const metaHit = metaDomains.some((value) => canonicalDomainForValue(value) === domain);
        if (metaHit) return true;
        return domainMentionRegex(domain).test(normalizeText(fact.claim));
      })
      .map((fact) => fact.id),
  );
  if (mentionedFactIds.length > 0) {
    return {
      criterion,
      status: "exact",
      factIds: mentionedFactIds,
      explanation:
        capitalize(domain) +
        " is explicitly named in " +
        countWords(mentionedFactIds.length, "fact") +
        " through metadata or claim text.",
    };
  }
  return {
    criterion,
    status: "unknown",
    factIds: [],
    explanation:
      "No explicit " +
      domain +
      " domain evidence in the record; the matcher does not infer domains from names, tags or unrelated roles.",
  };
}

function matchExperienceCriterion(facts: readonly FactView[], criterion: FeedCriterion): FeedCriterionMatch {
  const skill = criterion.skill;
  const years = criterion.years;
  const skillLabel = skill ?? "experience";
  const ordered = (factIds: readonly string[]) => orderFactIds(facts, factIds);

  // Experience criteria without a year bar can only report whether dated
  // evidence exists at all; this keeps hand-built criteria well defined.
  if (years === undefined) {
    const intervals = skill ? datedSkillIntervals(facts, skill) : allDatedIntervals(facts);
    if (intervals.length > 0) {
      const months = totalMonths(mergeIntervals(intervals));
      return {
        criterion,
        status: "exact",
        factIds: ordered(intervals.map((interval) => interval.factId)),
        countedMonths: months,
        explanation:
          "Dated " + skillLabel + " evidence exists: " + countWords(intervals.length, "dated entry", "dated entries") + ", " + months + " months after merging overlaps.",
      };
    }
    const mentionIds = skill
      ? ordered(facts.filter((fact) => factMentionsSkill(fact, skill)).map((fact) => fact.id))
      : [];
    if (mentionIds.length > 0) {
      return {
        criterion,
        status: "uncertain",
        factIds: mentionIds,
        explanation: capitalize(skillLabel) + " is mentioned, but no complete dated range is available.",
      };
    }
    return {
      criterion,
      status: "unknown",
      factIds: [],
      explanation: "No " + skillLabel + " evidence in the record.",
    };
  }

  const targetMonths = years * MONTHS_PER_YEAR;
  const intervals = skill ? datedSkillIntervals(facts, skill) : allDatedIntervals(facts);
  const merged = mergeIntervals(intervals);
  const countedMonths = totalMonths(merged);
  const rawMonths = intervals.reduce((total, interval) => total + (interval.end - interval.start), 0);
  const overlapMerged = countedMonths < rawMonths;
  const datedFactIds = ordered(intervals.map((interval) => interval.factId));
  const datedFactIdSet = new Set(datedFactIds);
  const mentionFactIds = skill
    ? ordered(facts.filter((fact) => factMentionsSkill(fact, skill)).map((fact) => fact.id))
    : [];
  const undatedMentionFactIds = mentionFactIds.filter((factId) => !datedFactIdSet.has(factId));
  const genericUndatedFactIds = skill
    ? []
    : ordered(
        facts
          .filter((fact) => {
            const meta = metaOf(fact);
            const hasCompleteDates = parseMonth(meta.start) !== null && parseMonth(meta.end) !== null;
            return !hasCompleteDates && (meta.module === "ROLE" || meta.module === "PROJECT");
          })
          .map((fact) => fact.id),
      );
  const undatedEvidenceFactIds = skill ? undatedMentionFactIds : genericUndatedFactIds;
  const selfDescribed = selfDescribedYearsFor(facts, skill);
  const related = skill ? relatedDatedEvidence(facts, skill) : null;
  const relatedMention = skill ? relatedMentionEvidence(facts, skill) : null;

  const countedDescription = describeDatedEvidence(facts, intervals);
  const overlapNote = overlapMerged
    ? "Overlapping periods were merged, so shared months are not double-counted."
    : "";
  const undatedNote =
    undatedEvidenceFactIds.length > 0
      ? countWords(undatedEvidenceFactIds.length, "undated mention") +
        " not counted because " +
        (undatedEvidenceFactIds.length === 1 ? "it has" : "they have") +
        " no complete dated role or project range."
      : "";
  const selfNote = selfDescribed
    ? "Self-described " + selfDescribed.years + " years noted separately, not counted."
    : "";
  const relatedNote = related
    ? related.skill +
      ", " +
      formatMonthSpan(related.months) +
      " - related to " +
      skill +
      ", not direct " +
      skill +
      " evidence."
    : "";

  if (countedMonths >= targetMonths) {
    return {
      criterion,
      status: "exact",
      factIds: ordered([...datedFactIds, ...undatedEvidenceFactIds]),
      countedMonths,
      selfDescribedYears: selfDescribed?.years,
      explanation: joinSentences([
        "Counted " + countedMonths + " dated " + skillLabel + " months from " + countedDescription + ".",
        "The " + years + "-year bar is met.",
        overlapNote,
        undatedNote,
        selfNote,
      ]),
    };
  }

  if (countedMonths > 0) {
    return {
      criterion,
      status: "not_met",
      factIds: ordered([...datedFactIds, ...undatedEvidenceFactIds]),
      countedMonths,
      relatedSkill: related?.skill,
      selfDescribedYears: selfDescribed?.years,
      explanation: joinSentences([
        "Counted " +
          countedMonths +
          " dated " +
          skillLabel +
          " months from " +
          countedDescription +
          ", below the " +
          years +
          "-year bar.",
        overlapNote,
        undatedNote,
        selfNote,
        relatedNote,
      ]),
    };
  }

  if (related) {
    return {
      criterion,
      status: "related",
      factIds: ordered(related.factIds),
      countedMonths: related.months,
      relatedSkill: related.skill,
      selfDescribedYears: selfDescribed?.years,
      explanation:
        related.skill +
        ", " +
        formatMonthSpan(related.months) +
        " - related to " +
        skill +
        ". No dated " +
        skill +
        " evidence, so this is related, never exact.",
    };
  }

  if (selfDescribed) {
    if (selfDescribed.years < years) {
      return {
        criterion,
        status: "not_met",
        factIds: ordered(selfDescribed.factIds),
        selfDescribedYears: selfDescribed.years,
        explanation:
          "Self-described " +
          selfDescribed.years +
          " years of " +
          skillLabel +
          " is below the " +
          years +
          "-year bar; no dated " +
          skillLabel +
          " months were counted.",
      };
    }
    return {
      criterion,
      status: "uncertain",
      factIds: ordered(selfDescribed.factIds),
      selfDescribedYears: selfDescribed.years,
      explanation:
        "Self-described " +
        selfDescribed.years +
        " years of " +
        skillLabel +
        " is noted separately and not counted; no dated role or project months, so this is uncertain.",
    };
  }

  if (undatedEvidenceFactIds.length > 0) {
    return {
      criterion,
      status: "uncertain",
      factIds: undatedEvidenceFactIds,
      explanation:
        "No dated " +
        skillLabel +
        " role or project months; " +
        countWords(undatedEvidenceFactIds.length, "undated mention") +
        " only, so experience is uncertain.",
    };
  }

  if (relatedMention) {
    return {
      criterion,
      status: "unknown",
      factIds: ordered(relatedMention.factIds),
      explanation:
        relatedMention.skill +
        " is related to " +
        skill +
        " but has no dated months, and there is no direct " +
        skill +
        " evidence.",
    };
  }

  return {
    criterion,
    status: "unknown",
    factIds: [],
    explanation: skill
      ? "No " + skill + " mention or dated " + skill + " evidence in the record."
      : "No dated experience evidence in the record.",
  };
}

// ---------------------------------------------------------------------------
// Public matcher
// ---------------------------------------------------------------------------

export function matchCandidates(
  candidates: CandidateDetail[],
  criteria: FeedCriterion[],
): CandidateFeedMatch[] {
  return candidates.map((candidate) => {
    const facts = candidate.facts ?? [];
    const criterionMatches = criteria.map((criterion) => {
      if (criterion.kind === "SKILL") return matchSkillCriterion(facts, criterion);
      if (criterion.kind === "DOMAIN") return matchDomainCriterion(facts, criterion);
      return matchExperienceCriterion(facts, criterion);
    });
    const hasNotMet = criterionMatches.some((match) => match.status === "not_met");
    const hasUnknown = criterionMatches.some(
      (match) => match.status === "unknown" || match.status === "uncertain",
    );
    const hasRelated = criterionMatches.some((match) => match.status === "related");
    const state = hasNotMet ? "outside" : hasUnknown ? "not_stated" : "in_feed";
    return {
      candidateId: candidate.id,
      criteria: criterionMatches,
      state,
      inFeed: state === "in_feed",
      hasNotMet,
      hasUnknown,
      hasRelated,
    };
  });
}

/**
 * Picks the criterion that removes the most candidates from the feed, so the
 * UI can suggest a single broadening step. Ties go to the last criterion seen.
 */
export function pickCriterionToBroaden(matches: CandidateFeedMatch[]): string | null {
  const counts = new Map<string, number>();
  const order: string[] = [];
  for (const match of matches) {
    for (const criterionMatch of match.criteria) {
      const id = criterionMatch.criterion.id;
      if (!counts.has(id)) {
        counts.set(id, 0);
        order.push(id);
      }
      if (criterionMatch.status === "not_met") counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const id of order) {
    const count = counts.get(id) ?? 0;
    if (count > 0 && count >= bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}
