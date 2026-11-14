export interface FitFact {
  id?: string;
  claim: string;
  skillTags: string[];
  evidenceUrl?: string | null;
}

export interface FitRole {
  title: string;
  summary: string;
  problemNow: string;
  skills: string[];
  employerName: string;
}

export interface FitTheme {
  theme: string;
  factIds: string[];
}

export interface FitSummaryData {
  digest: string;
  sharedThemes: FitTheme[];
  questions: string[];
  evidenceCoverage: number;
}

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+]+/gi, " ").trim();
}

export function buildFitSummary(input: {
  candidateName: string;
  candidateTags: string[];
  facts: FitFact[];
  role: FitRole;
}): FitSummaryData {
  const { candidateName, candidateTags, facts, role } = input;
  const first = candidateName.split(/\s+/)[0] || candidateName;
  const themes: FitTheme[] = [];
  const seen = new Set<string>();

  for (const skill of role.skills) {
    const needle = normalized(skill);
    if (!needle) continue;
    const matching = facts.filter((fact) => {
      const tags = fact.skillTags.map(normalized);
      return tags.includes(needle) || normalized(fact.claim).includes(needle);
    });
    if (matching.length > 0 && !seen.has(needle)) {
      seen.add(needle);
      themes.push({
        theme: skill,
        factIds: matching.map((fact) => fact.id ?? fact.claim.slice(0, 24)),
      });
    }
  }

  for (const tag of candidateTags) {
    const needle = normalized(tag);
    if (themes.length >= 3) break;
    if (role.skills.some((skill) => normalized(skill) === needle) && !seen.has(needle)) {
      seen.add(needle);
      themes.push({ theme: tag, factIds: [] });
    }
  }

  const evidenceCoverage = facts.filter((fact) => Boolean(fact.evidenceUrl)).length;
  const themeLabels = themes.slice(0, 3).map((theme) => theme.theme);
  const skillSentence =
    themeLabels.length > 0
      ? "Shared themes in the record: " + themeLabels.join(", ") + "."
      : "No direct skill overlaps found in the record; use the facts below as conversation starters.";

  const digest =
    first +
    " has " +
    facts.length +
    " master-record " +
    (facts.length === 1 ? "item" : "items") +
    ". " +
    skillSentence +
    " " +
    evidenceCoverage +
    " of " +
    facts.length +
    " claims include an evidence link. Reachability is not a truth score.";

  const topSkill = role.skills[0] || role.title;
  const questions = [
    "Ask " + first + " to walk through a concrete example of " + topSkill + ".",
    "How would " + first + " approach the live problem: " + role.problemNow + "?",
    "What would " + first + " want to learn in the first 30 days with " + role.employerName + "?",
  ];

  return {
    digest,
    sharedThemes: themes.slice(0, 3),
    questions,
    evidenceCoverage,
  };
}
