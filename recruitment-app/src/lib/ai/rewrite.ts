import type { FactMeta } from "@/lib/fact-meta";

/**
 * Deterministic rewriting for the local tailoring fallback.
 *
 * This module never invents facts. It only restructures the candidate's own
 * claim: it strips filler, tightens known verbose phrases, turns first-person
 * sentences into statements, and reorders emphasis so a metric/result sentence
 * closes the claim (or role-relevant evidence leads). Any rewrite that is still
 * a near-copy of the source is rejected with null so the caller can say so
 * honestly instead of padding the source with cosmetic edits.
 */

export interface RewriteRole {
  title: string;
  skills: string[];
  employer?: { name: string };
}

/** Similarity at or above this value counts as a near-copy of the source. */
export const NEAR_COPY_THRESHOLD = 0.93;

const URL_PATTERN = /https?:\/\/[^\s<>"')]+/gi;
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const DECIMAL_PATTERN = /\b\d+\.\d+\b/g;
const NUMBER_PATTERN = /\d[\d,]*(?:\.\d+)?%?/g;
const PLACEHOLDER_PATTERN = /__RWS(\d+)__/g;
const TERMINAL_PUNCTUATION = /[.!?]+$/;

const REFERENCE_WORDS = new Set([
  "this", "that", "it", "these", "those", "they", "them", "he", "she", "which",
  "then", "there", "also", "but", "and", "so", "however", "its", "their",
]);

const LEANING_FUNCTIONS = new Set([
  "at", "in", "on", "when", "after", "before", "once", "while", "because",
  "since", "if", "the", "a", "an", "i", "we", "our", "they", "their", "my",
  "his", "her", "it", "this", "that", "these", "those", "people", "completion",
  "duplicate", "matching", "notes", "small", "working", "and", "but", "or", "so",
  "to", "for", "with", "by", "from", "as", "of", "not", "no", "all", "one",
]);

const IRREGULAR_PAST = new Set([
  "built", "rebuilt", "wrote", "rewrote", "made", "led", "ran", "drove",
  "grew", "sold", "brought", "won", "taught", "spoke", "took", "kept", "cut",
  "set", "put", "began", "saw", "found", "got", "gave", "sent", "told",
  "became", "came", "went", "held", "met", "paid", "read", "said", "showed",
  "spent", "stood", "thought", "understood", "oversaw", "drew", "chose",
  "fought", "bought", "caught", "forgot", "left", "lost", "shot", "slept",
  "felt", "heard", "overcame", "undertook", "rewrote", "rebuilt",
]);

/** Present-tense words that happen to end in "ed" and must not be treated as past tense. */
const PRESENT_TENSE_ED = new Set([
  "need", "feed", "seed", "speed", "proceed", "succeed", "exceed", "embed",
  "shed", "spread", "breed", "bleed",
]);

const NON_PLURAL_S = new Set([
  "series", "species", "news", "means", "always", "perhaps", "analysis",
  "status", "business", "census", "canvas", "bonus", "campus", "focus",
]);

const LEADING_FILLER_PATTERNS: RegExp[] = [
  /^honestly\b[\s,:;-]*/i,
  /^frankly\b[\s,:;-]*/i,
  /^truthfully\b[\s,:;-]*/i,
  /^to be honest\b[\s,:;-]*/i,
  /^in my opinion\b[\s,:;-]*/i,
  /^i think that\b[\s,:;-]*/i,
  /^i think\b[\s,:;-]*/i,
  /^i'd say that\b[\s,:;-]*/i,
  /^i'd say\b[\s,:;-]*/i,
  /^i would say\b[\s,:;-]*/i,
  /^i guess\b[\s,:;-]*/i,
  /^i suppose\b[\s,:;-]*/i,
  /^i believe\b[\s,:;-]*/i,
  /^personally\b[\s,:;-]*/i,
  /^basically\b[\s,:;-]*/i,
  /^actually\b[\s,:;-]*/i,
  /^really\b[\s,:;-]*/i,
  /^well,\s*/i,
  /^look,\s*/i,
  /^okay,\s*/i,
  /^ok,\s*/i,
  /^so,\s*/i,
];

const INLINE_FILLER = /\b(?:really|actually|basically|honestly|frankly|literally|simply|truly|definitely|absolutely)\b\s*/gi;

const SAFE_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bwent from\b/gi, replacement: "increased from" },
  { pattern: /\bgoes from\b/gi, replacement: "increases from" },
  { pattern: /\bso that\b/gi, replacement: "so" },
  { pattern: /\bin order to\b/gi, replacement: "to" },
  { pattern: /\ba number of\b/gi, replacement: "several" },
  { pattern: /\bdue to the fact that\b/gi, replacement: "because" },
  { pattern: /\bat this point in time\b/gi, replacement: "now" },
  { pattern: /\bin the event that\b/gi, replacement: "if" },
  { pattern: /\bmake use of\b/gi, replacement: "use" },
  { pattern: /\bmade use of\b/gi, replacement: "used" },
  { pattern: /\bwas able to\b/gi, replacement: "could" },
  { pattern: /\bwere able to\b/gi, replacement: "could" },
  { pattern: /\bis able to\b/gi, replacement: "can" },
  { pattern: /\bare able to\b/gi, replacement: "can" },
  { pattern: /\bhas the ability to\b/gi, replacement: "can" },
  { pattern: /\band also\b/gi, replacement: "and" },
];

const THAT_COMPLEMENT = /\b(made sure|showed|shows|show|found|realised|realized|noticed|learned|learnt|saw|ensured|explained|reported|proved|mean|means|meant|confirmed|discovered)\s+that\b/gi;

const RESULT_VERBS = /\b(?:increased|increases|decreased|decreases|dropped|drops|reduced|reduces|cut|cuts|saved|saves|grew|grows|doubled|tripled|halved|raised|lowered|improved|improves|boosted|accelerated|shortened|went|goes|fell|falls|climbed|shrank|gained)\b/i;

export function normalizeForCompare(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  const normalized = normalizeForCompare(value);
  return normalized ? normalized.split(" ") : [];
}

export function similarity(a: string, b: string): number {
  const left = tokenize(a);
  const right = tokenize(b);
  if (left.length === 0 || right.length === 0) {
    return left.length === right.length ? 1 : 0;
  }
  const remaining = new Map<string, number>();
  for (const token of left) remaining.set(token, (remaining.get(token) ?? 0) + 1);
  let intersection = 0;
  for (const token of right) {
    const available = remaining.get(token) ?? 0;
    if (available > 0) {
      intersection += 1;
      remaining.set(token, available - 1);
    }
  }
  const union = left.length + right.length - intersection;
  if (union === 0) return 1;
  return Math.round((intersection / union) * 10000) / 10000;
}

export function isNearCopy(source: string, candidate: string): boolean {
  const normalizedCandidate = normalizeForCompare(candidate);
  if (!normalizedCandidate) return true;
  if (normalizeForCompare(source) === normalizedCandidate) return true;
  return similarity(source, candidate) >= NEAR_COPY_THRESHOLD;
}

interface MaskedText {
  masked: string;
  restore: (value: string) => string;
}

/**
 * Replace URLs, emails, decimals and common abbreviations with placeholders so
 * sentence splitting and word-level rewriting can never damage them.
 */
function maskSensitiveParts(value: string): MaskedText {
  const stored: string[] = [];
  const store = (part: string) => {
    const placeholder = "__RWS" + stored.length + "__";
    stored.push(part);
    return placeholder;
  };
  let masked = value.replace(URL_PATTERN, (match) => {
    const trailing = TERMINAL_PUNCTUATION.exec(match)?.[0] ?? "";
    const core = trailing ? match.slice(0, match.length - trailing.length) : match;
    return store(core) + trailing;
  });
  masked = masked.replace(EMAIL_PATTERN, (match) => store(match));
  masked = masked.replace(DECIMAL_PATTERN, (match) => store(match));
  masked = masked.replace(/\b(?:e\.g\.|i\.e\.|etc\.|vs\.)/gi, (match) => store(match));
  return {
    masked,
    restore: (text: string) =>
      text.replace(PLACEHOLDER_PATTERN, (_match, index: string) => stored[Number(index)] ?? ""),
  };
}

function stripPlaceholders(value: string): string {
  return value.replace(PLACEHOLDER_PATTERN, " ").replace(/\s+/g, " ").trim();
}

function splitIntoSentences(masked: string): string[] {
  const matches = masked.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g) ?? [masked];
  return matches.map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 0);
}

function capitalizeFirstLetter(value: string): string {
  const trimmed = value.trimStart();
  if (!trimmed) return "";
  const first = trimmed.charAt(0);
  if (first >= "a" && first <= "z") return first.toUpperCase() + trimmed.slice(1);
  return trimmed;
}

function preserveCase(match: string, replacement: string): string {
  const letters = match.replace(/[^A-Za-z]/g, "");
  if (letters && letters === letters.toUpperCase()) return replacement.toUpperCase();
  const first = match.charAt(0);
  if (first >= "A" && first <= "Z") return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  return replacement;
}

function isDroppableVerb(verb: string): boolean {
  const lower = verb.toLowerCase();
  if (IRREGULAR_PAST.has(lower)) return true;
  if (PRESENT_TENSE_ED.has(lower)) return false;
  return /^[a-z]{2,}ed$/.test(lower);
}

function stripLeadingFillers(value: string): string {
  let result = value.trim();
  for (let pass = 0; pass < 4; pass += 1) {
    const before = result;
    for (const pattern of LEADING_FILLER_PATTERNS) {
      const next = result.replace(pattern, "").trim();
      if (next && next !== result) {
        result = next;
        break;
      }
    }
    if (result === before) break;
  }
  return result ? capitalizeFirstLetter(result) : "";
}

function removeInlineFillers(value: string): string {
  return value
    .replace(INLINE_FILLER, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,;:])\s*([.!?])/g, "$2")
    .trim();
}

function applySafeReplacements(value: string): string {
  let result = value;
  for (const { pattern, replacement } of SAFE_REPLACEMENTS) {
    result = result.replace(pattern, (match) => preserveCase(match, replacement));
  }
  return result;
}

function dropLeadingFirstPerson(sentence: string): string {
  const match = sentence.match(/^I\s+([A-Za-z']+)([\s\S]*)$/);
  if (!match) return sentence;
  if (!isDroppableVerb(match[1])) return sentence;
  const rest = sentence.slice(2).trimStart();
  return rest ? capitalizeFirstLetter(rest) : sentence;
}

function dropCoordinatedFirstPerson(value: string): string {
  return value.replace(
    /\b(and|then|but|so)\s+(I|we)\s+([A-Za-z']+)/gi,
    (match, conjunction: string, _subject: string, verb: string) => {
      if (!isDroppableVerb(verb)) return match;
      const replacement = conjunction + " " + verb;
      return conjunction.charAt(0) === conjunction.charAt(0).toUpperCase()
        ? capitalizeFirstLetter(replacement)
        : replacement;
    },
  );
}

function applyAtColonRewrite(sentence: string): string {
  const match = sentence.match(/^At\s+([^,]{2,80}),\s+I\s+([\s\S]+)$/);
  if (!match) return sentence;
  const location = match[1].trim();
  const predicate = match[2].trim();
  const verb = predicate.match(/^([A-Za-z']+)/)?.[1] ?? "";
  if (verb && isDroppableVerb(verb)) {
    const terminal = TERMINAL_PUNCTUATION.exec(predicate)?.[0] ?? ".";
    const body = predicate.replace(/[.!?]+$/, "").trim();
    return capitalizeFirstLetter(body) + " at " + location + terminal;
  }
  return "At " + location + ": I " + predicate;
}

function invertIntroClause(sentence: string): string {
  const match = sentence.match(/^(When|After|Before|Once|While|Because|Since|If)\s+(.+?),\s+I\s+([A-Za-z']+)([\s\S]*)$/);
  if (!match) return sentence;
  const conjunction = match[1];
  const subordinateBody = match[2].trim();
  const verb = match[3];
  const remainder = match[4];
  if (!isDroppableVerb(verb)) return sentence;
  const terminal = TERMINAL_PUNCTUATION.exec(remainder)?.[0] ?? ".";
  const body = (verb + remainder).replace(/[.!?]+\s*$/, "").trim();
  if (!body) return sentence;
  return capitalizeFirstLetter(body) + " " + conjunction.toLowerCase() + " " + subordinateBody + terminal;
}

function dropDefiniteArticlesBeforePlurals(value: string): string {
  return value.replace(/\bthe\s+((?:[a-z][a-z'-]*\s+){0,2}[a-z][a-z'-]*s)\b/g, (match, nounPhrase: string) => {
    const words = nounPhrase.trim().split(/\s+/);
    const noun = words[words.length - 1] ?? "";
    if (/(?:ss|us|is|as|os)$/.test(noun)) return match;
    if (NON_PLURAL_S.has(noun)) return match;
    return nounPhrase;
  });
}

function removeThatComplementizer(value: string): string {
  return value.replace(THAT_COMPLEMENT, (_match, verb: string) => verb);
}

/**
 * Strong-pass compression for "Our design system had fourteen shades..." style
 * context sentences: turn a possessive subject + "had" into a label statement
 * ("Our design system: fourteen shades..."). Every content word is kept.
 */
function compressPossessionSentence(sentence: string): string {
  const match = sentence.match(/^([A-Z][^.:!?]{2,60}?) had (.+)$/);
  if (!match) return sentence;
  const subject = match[1].trim();
  const words = subject.split(/\s+/);
  if (words.length < 2 || words.length > 7) return sentence;
  return subject + ": " + match[2].trim();
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stemWord(word: string): string {
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function buildRoleTokenSet(role: RewriteRole): Set<string> {
  const tokens = new Set<string>();
  const values = [role.title, role.employer?.name ?? "", ...role.skills];
  for (const value of values) {
    for (const word of tokenize(value)) {
      if (word.length > 2) tokens.add(stemWord(word));
    }
  }
  return tokens;
}

function sentenceRoleScore(sentence: string, roleTokens: Set<string>): number {
  let score = 0;
  for (const word of tokenize(stripPlaceholders(sentence))) {
    if (word.length > 2 && roleTokens.has(stemWord(word))) score += 1;
  }
  return score;
}

function startsWithReference(sentence: string): boolean {
  const first = stripPlaceholders(sentence)
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase()
    .replace(/[^a-z]/g, "");
  return !!first && REFERENCE_WORDS.has(first);
}

function isResultSentence(sentence: string): boolean {
  const visible = stripPlaceholders(sentence);
  const hasMetric = /\d/.test(visible) || /[%€$£]/.test(visible) || /\b(?:zero|half|double|triple)\b/i.test(visible);
  return hasMetric && RESULT_VERBS.test(visible);
}

/**
 * Reorder whole sentences only (never fragments), with a guard for sentences
 * that begin with a pronoun/reference so ordering never breaks a reference.
 */
function reorderSentences(sentences: string[], roleTokens: Set<string>): string[] {
  if (sentences.length < 2) return sentences;
  const resultFlags = sentences.map((sentence) => isResultSentence(sentence));
  if (resultFlags.some(Boolean)) {
    if (resultFlags.some((flag, index) => flag && startsWithReference(sentences[index]))) return sentences;
    const context = sentences.filter((_sentence, index) => !resultFlags[index]);
    const results = sentences.filter((_sentence, index) => resultFlags[index]);
    const reordered = [...context, ...results];
    return reordered.join(" ") === sentences.join(" ") ? sentences : reordered;
  }
  const scored = sentences.map((sentence, index) => ({ sentence, index, score: sentenceRoleScore(sentence, roleTokens) }));
  const best = [...scored].sort((a, b) => b.score - a.score || a.index - b.index)[0];
  if (!best || best.score === 0 || best.index === 0) return sentences;
  if (startsWithReference(best.sentence)) return sentences;
  return [best.sentence, ...sentences.filter((_sentence, index) => index !== best.index)];
}

function transformSentence(sentence: string, strength: "light" | "strong"): string {
  let result = sentence;
  result = stripLeadingFillers(result);
  result = removeInlineFillers(result);
  result = applyAtColonRewrite(result);
  result = invertIntroClause(result);
  result = dropLeadingFirstPerson(result);
  result = dropCoordinatedFirstPerson(result);
  result = applySafeReplacements(result);
  result = removeInlineFillers(result);
  if (strength === "strong") {
    result = dropCoordinatedFirstPerson(result);
    result = removeThatComplementizer(result);
    result = compressPossessionSentence(result);
    result = dropDefiniteArticlesBeforePlurals(result);
    result = removeInlineFillers(result);
    result = applySafeReplacements(result);
  }
  return result ? capitalizeFirstLetter(result) : "";
}

function transformSentences(sentences: string[], strength: "light" | "strong"): string[] {
  return sentences
    .map((sentence) => transformSentence(sentence, strength))
    .filter((sentence) => sentence.length > 0);
}

function finalizeSentences(sentences: string[], restore: (value: string) => string): string {
  const withTerminal = sentences
    .map((sentence) => collapseWhitespace(sentence))
    .filter((sentence) => sentence.length > 0)
    .map((sentence) => (TERMINAL_PUNCTUATION.test(sentence) ? sentence : sentence + "."));
  const restored = restore(withTerminal.join(" "));
  let result = restored.replace(/\s+/g, " ").trim();
  result = result.replace(/\s+([,.;:!?])/g, "$1");
  result = result.replace(/([,;:])\s*([.!?])/g, "$2");
  if (result && !TERMINAL_PUNCTUATION.test(result)) result += ".";
  return result;
}

function extractUrls(value: string): string[] {
  return (value.match(URL_PATTERN) ?? []).map((url) => url.replace(/[.,;:!?]+$/, ""));
}

/**
 * Capitalised words/word pairs in the source that look like names, brands or
 * organisations. The first word of a sentence is only kept when it starts a
 * multi-word proper noun (e.g. "Lumen Retail"), so ordinary capitalisation is
 * not mistaken for an entity.
 */
function entityTerms(source: string): string[] {
  const terms = new Set<string>();
  for (const sentence of source.split(/[.!?]\s+/)) {
    const words = sentence.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
    for (let index = 0; index < words.length; index += 1) {
      const word = words[index];
      if (!/^[A-Z]/.test(word) || word === "I") continue;
      const currentIsFunction = LEANING_FUNCTIONS.has(word.toLowerCase());
      const next = words[index + 1];
      const nextIsProper =
        !!next && /^[A-Z]/.test(next) && next !== "I" && !LEANING_FUNCTIONS.has(next.toLowerCase());
      if (!currentIsFunction && nextIsProper) terms.add(word + " " + next);
      else if (index > 0 && !currentIsFunction) terms.add(word);
    }
  }
  return [...terms];
}

/**
 * Role and meta values that actually appear in the source claim are protected
 * too: if the claim names the candidate's employer or a tagged skill, the
 * rewrite must keep that exact wording.
 */
function dictionaryTerms(source: string, role: RewriteRole, meta?: FactMeta): string[] {
  const candidates: string[] = [
    role.title,
    role.employer?.name ?? "",
    ...role.skills,
    meta?.title ?? "",
    meta?.organisation ?? "",
    meta?.stat ?? "",
    meta?.linkLabel ?? "",
    ...(meta?.skills ?? []),
    ...(meta?.domain ?? []),
  ];
  const lowerSource = source.toLowerCase();
  const terms: string[] = [];
  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (trimmed.length < 2) continue;
    if (lowerSource.includes(trimmed.toLowerCase())) terms.push(trimmed);
  }
  return terms;
}

function preservesFacts(source: string, candidate: string, role: RewriteRole, meta?: FactMeta): boolean {
  if (!candidate.trim()) return false;
  const lowerCandidate = candidate.toLowerCase();
  const sourceUrls = extractUrls(source);
  for (const url of sourceUrls) if (!candidate.includes(url)) return false;
  for (const url of extractUrls(candidate)) if (!sourceUrls.includes(url)) return false;

  const sourceNumbers: string[] = source.match(NUMBER_PATTERN) ?? [];
  const candidateNumbers: string[] = candidate.match(NUMBER_PATTERN) ?? [];
  for (const number of sourceNumbers) if (!candidateNumbers.includes(number)) return false;
  for (const number of candidateNumbers) if (!sourceNumbers.includes(number)) return false;

  for (const quote of source.match(/["“][^"”]{2,140}["”]/g) ?? []) {
    if (!candidate.includes(quote)) return false;
  }

  const terms = new Set<string>([...entityTerms(source), ...dictionaryTerms(source, role, meta)]);
  for (const term of terms) {
    if (!lowerCandidate.includes(term.toLowerCase())) return false;
  }

  const lowerSource = source.toLowerCase();
  for (const forbidden of ["self_claimed", "employer_confirmed", "provenance", "auto-generated", "auto generated"]) {
    if (lowerCandidate.includes(forbidden) && !lowerSource.includes(forbidden)) return false;
  }
  return true;
}

/**
 * Rewrite a candidate's own claim for a role, or return null when no honest,
 * visibly different rewrite is possible.
 *
 * The rewrite only removes filler/tightens phrasing/reorders sentences. It
 * never adds facts, numbers, links, employers or provenance, and a result that
 * is still a near-copy of the source is rejected.
 */
export function rewriteClaimForRole(claim: string, role: RewriteRole, meta?: FactMeta): string | null {
  const source = claim.replace(/\s+/g, " ").trim();
  if (!source) return null;
  if (tokenize(source).length < 4) return null;

  const { masked, restore } = maskSensitiveParts(source);
  const sentences = splitIntoSentences(masked);
  if (sentences.length === 0) return null;

  const roleTokens = buildRoleTokenSet(role);
  const normalizedSource = normalizeForCompare(source);

  const firstSentences = reorderSentences(transformSentences(sentences, "light"), roleTokens);
  const firstCandidate = finalizeSentences(firstSentences, restore);
  if (firstCandidate) {
    const visibleChange = normalizeForCompare(firstCandidate) !== normalizedSource;
    if (visibleChange && !isNearCopy(source, firstCandidate) && preservesFacts(source, firstCandidate, role, meta)) {
      return firstCandidate;
    }
  }

  const secondSentences = reorderSentences(transformSentences(firstSentences, "strong"), roleTokens);
  const secondCandidate = finalizeSentences(secondSentences, restore);
  if (!secondCandidate) return null;
  if (normalizeForCompare(secondCandidate) === normalizedSource) return null;
  if (isNearCopy(source, secondCandidate)) return null;
  if (!preservesFacts(source, secondCandidate, role, meta)) return null;
  return secondCandidate;
}
