import type { Highlight, TailoringSuggestion } from "./schemas";
import type { FactView, RoleDetail } from "@/lib/repo";
import type { FactMeta } from "@/lib/fact-meta";
import { isNearCopy, normalizeForCompare, rewriteClaimForRole } from "./rewrite";

const SKILL_HINTS: Array<[string, RegExp]> = [
  ["Accessibility", /accessib|screen reader|keyboard|contrast/i],
  ["Design systems", /design system|component library|pattern library/i],
  ["Frontend", /frontend|front-end|react|typescript|css|interface/i],
  ["Backend", /backend|back-end|api|postgres|database|pipeline|server/i],
  ["Data", /data|sql|dashboard|metric|analysis/i],
  ["Machine learning", /machine learning|model|ml|evaluation|inference/i],
  ["QA", /qa|test|regression|bug/i],
  ["Customer support", /customer|support|ticket|refund|queue/i],
  ["Operations", /operation|logistics|schedul|process|handoff/i],
  ["Community", /community|event|meetup|volunteer/i],
  ["Leadership", /lead|coach|team|mentor|manager/i],
  ["Research", /research|interview|usability|discover/i],
  ["Product thinking", /product|prototype|user|problem/i],
];

const URL_PATTERN = /https?:\/\/[^\s<>"')]+/gi;

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  // Protect URLs from sentence punctuation (especially query strings) before splitting.
  const urls = normalized.match(URL_PATTERN) ?? [];
  let protectedText = normalized;
  urls.forEach((url, index) => {
    protectedText = protectedText.split(url).join("__RIVET_URL_" + index + "__");
  });
  const matches = protectedText.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g);
  return (matches ?? [protectedText])
    .map((sentence) =>
      sentence
        .replace(/__RIVET_URL_(\d+)__/g, (_, index: string) => urls[Number(index)] ?? "")
        .trim(),
    )
    .filter((sentence) => sentence.length >= 8);
}

function inferSkill(value: string) {
  for (const [skill, pattern] of SKILL_HINTS) {
    if (pattern.test(value)) return skill;
  }
  return "Product thinking";
}

function findUrl(value: string) {
  const found = value.match(URL_PATTERN);
  return found?.[0]?.replace(/[.,;:]$/, "") ?? null;
}

export function extractHighlightsLocally(text: string): Highlight[] {
  const sentences = splitSentences(text).slice(0, 5);
  const results: Highlight[] = [];
  const seen = new Set<string>();
  for (const sentence of sentences) {
    const claim = sentence.replace(/\s+/g, " ").trim().slice(0, 400);
    if (claim.length < 8 || seen.has(claim.toLowerCase())) continue;
    seen.add(claim.toLowerCase());
    const url = findUrl(sentence);
    results.push({
      skill: inferSkill(sentence),
      claim,
      evidenceUrl: url && text.includes(url) ? url : null,
      sourceQuote: sentence.slice(0, 600),
    });
    if (results.length >= 4) break;
  }
  if (results.length === 0) {
    const fallback = text.trim().slice(0, 400);
    results.push({
      skill: inferSkill(fallback),
      claim: fallback.length >= 8 ? fallback : "A self-written answer, ready for a clearer highlight.",
      evidenceUrl: null,
      sourceQuote: fallback,
    });
  }
  return results;
}

export interface LocalTailoringFact {
  id: string;
  prompt: string;
  claim: string;
  skillTags: string[];
  evidenceUrl: string | null;
  meta?: FactMeta;
}

export interface LocalTailoringResult {
  suggestions: TailoringSuggestion[];
  /**
   * Plain-language note when some (or all) selected claims had no meaningful
   * rewrite. Null when every selected claim produced a suggestion.
   */
  note: string | null;
}

function normalizedSkillMatch(fact: LocalTailoringFact, roleSkills: string[]) {
  const haystack = normalize([fact.prompt, fact.claim, ...fact.skillTags].join(" "));
  const matches = roleSkills.filter((skill) => {
    const needle = normalize(skill);
    return needle.length > 1 && haystack.includes(needle);
  });
  return matches[0] ?? fact.skillTags[0] ?? null;
}

const NO_MEANINGFUL_REWRITE_NOTE =
  "No meaningful rewrite was possible for these claims. The master record is unchanged.";

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function countFirstPerson(value: string): number {
  return (value.match(/\bI\b/g) ?? []).length;
}

/**
 * Describe the change the deterministic rewrite actually made. It never
 * claims a change that did not happen: it compares the source claim with the
 * proposed text.
 */
function describeRewrite(source: string, proposed: string): string {
  const sourceWords = countWords(source);
  const proposedWords = countWords(proposed);
  const changes: string[] = [];
  if (proposedWords < sourceWords) {
    changes.push("tightened from " + sourceWords + " to " + proposedWords + " words");
  }
  if (countFirstPerson(proposed) < countFirstPerson(source)) {
    changes.push("led with the action instead of first person");
  }
  if (/\bwent from\b/i.test(source) && /\bincreased from\b/i.test(proposed)) {
    changes.push("replaced \"went from\" with \"increased from\"");
  }
  if (changes.length === 0) changes.push("reordered the sentence emphasis");
  const rationale =
    "Rewritten from the candidate's own claim: " +
    changes.join(", ") +
    ". Every name, number and source fact is preserved; nothing new is added.";
  if (rationale.length <= 260) return rationale;
  const cut = rationale.slice(0, 257);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

export function suggestTailoringLocally(
  facts: LocalTailoringFact[],
  role: Pick<RoleDetail, "title" | "skills" | "employer" | "problemNow">,
): LocalTailoringResult {
  const scored = facts
    .map((fact, index) => {
      const haystack = normalize([fact.prompt, fact.claim, ...fact.skillTags].join(" "));
      const score = role.skills.reduce((total, skill) => {
        const needle = normalize(skill);
        return total + (needle && haystack.includes(needle) ? 2 : 0);
      }, 0);
      return { fact, index, score };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const selected = scored.slice(0, 4);
  const suggestions: TailoringSuggestion[] = [];
  let skipped = 0;

  for (const { fact } of selected) {
    const rewritten = rewriteClaimForRole(
      fact.claim,
      {
        title: role.title,
        skills: role.skills,
        employer: role.employer?.name ? { name: role.employer.name } : undefined,
      },
      fact.meta,
    );
    const proposedText = rewritten?.trim().slice(0, 500) ?? "";
    if (
      !proposedText ||
      normalizeForCompare(proposedText) === normalizeForCompare(fact.claim) ||
      isNearCopy(fact.claim, proposedText)
    ) {
      skipped += 1;
      continue;
    }
    const isReword = suggestions.length >= 2;
    suggestions.push({
      kind: isReword ? "REWORD" : "FOREGROUND",
      sourceFactIds: [fact.id],
      proposedText,
      rationale: describeRewrite(fact.claim, proposedText),
    });
  }

  if (suggestions.length === 0) {
    return { suggestions: [], note: NO_MEANINGFUL_REWRITE_NOTE };
  }
  return {
    suggestions,
    note:
      skipped > 0
        ? skipped + " claim(s) had no meaningful rewrite and were left out; they remain in the master record."
        : null,
  };
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "with", "is", "are", "was", "were",
  "what", "which", "who", "how", "does", "do", "did", "this", "that", "their", "they", "them", "it",
  "person", "candidate", "profile", "record", "from", "has", "have", "had", "about", "tell", "me",
]);

function tokens(value: string) {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

export function answerFromFactsLocally(
  facts: FactView[],
  question: string,
): { answer: string; sourceFactIds: string[] } {
  const lower = question.toLowerCase();
  const available = facts;

  if (/evidence|proof|link|verify|verified/.test(lower)) {
    const linked = available.filter((fact) => fact.evidenceUrl);
    if (linked.length > 0) {
      const first = linked[0];
      return {
        answer:
          "The record contains " +
          linked.length +
          " claim" +
          (linked.length === 1 ? "" : "s") +
          " with an evidence link. One example: " +
          '"' + first.claim + '"' +
          ". The link status is a mechanical reachability check only. It does not prove the claim is true, and this demo never performs real employment verification.",
        sourceFactIds: linked.slice(0, 3).map((fact) => fact.id),
      };
    }
    return {
      answer:
        "This record has no evidence links attached. That is not a deficiency: evidence and portfolio material are optional in Rivet. The candidate has " +
        available.length +
        " self-claimed prompt facts available to discuss.",
      sourceFactIds: available.slice(0, 2).map((fact) => fact.id),
    };
  }

  if (/team|work with|culture|ideal|colleague/.test(lower)) {
    const teamFact = available.find((fact) => /team|ideal|work with|colleague/i.test(fact.prompt + " " + fact.claim));
    if (teamFact) {
      return {
        answer: "From " + '"' + teamFact.prompt + '"' + ": " + teamFact.claim,
        sourceFactIds: [teamFact.id],
      };
    }
  }

  if (/ship|shipped|built|project|proud|made|delivered/.test(lower)) {
    const projectFacts = available.filter((fact) => /project|proud|built|shipped|made|delivered|created/i.test(fact.prompt + " " + fact.claim));
    if (projectFacts.length > 0) {
      return {
        answer:
          "The record names these concrete pieces of work: " +
          projectFacts
            .slice(0, 2)
            .map((fact) => fact.claim)
            .join(" "),
        sourceFactIds: projectFacts.slice(0, 2).map((fact) => fact.id),
      };
    }
  }

  const questionTokens = tokens(question);
  const scored = available
    .map((fact) => {
      const haystack = normalize([fact.prompt, fact.claim, ...fact.skillTags].join(" "));
      const score = questionTokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
      return { fact, score };
    })
    .sort((a, b) => b.score - a.score);

  if (scored[0]?.score > 0) {
    const matches = scored.filter((item) => item.score > 0).slice(0, 2);
    return {
      answer:
        "From the profile record: " +
        matches
          .map(({ fact }) => '"' + fact.claim + '" (' + fact.prompt + ')')
          .join(" "),
      sourceFactIds: matches.map(({ fact }) => fact.id),
    };
  }

  return {
    answer:
      "That question isn't answered by this profile's record. The record covers " +
      available.slice(0, 4).map((fact) => fact.prompt).join(", ") +
      ". I won't guess beyond those facts.",
    sourceFactIds: [],
  };
}
