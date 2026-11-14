export type RoleFamily = "Software engineering" | "Data / ML" | "Quantitative finance" | "Platform engineering";

export type SignalKind = "SKILL" | "EXPERIENCE" | "DOMAIN";

export interface RoleSignalTemplate {
  id: string;
  kind: SignalKind;
  label: string;
  value: string;
  years?: number;
  skill?: string;
}

export interface RoleFamilyTemplate {
  family: RoleFamily;
  recommendedAssessmentFamily: string;
  exampleDescription: string;
  suggestedSignals: RoleSignalTemplate[];
  guidance: string;
}

export const ROLE_FAMILY_TEMPLATES: RoleFamilyTemplate[] = [
  {
    family: "Software engineering",
    recommendedAssessmentFamily: "JavaScript",
    exampleDescription:
      "Build and maintain a user-facing service with a small team. Own a slice of the product, not just tickets.",
    guidance:
      "Pick the assessment version you actually accept. Add only signals that are relevant to the work, such as a skill with a dated minimum or a domain the team genuinely works in.",
    suggestedSignals: [
      { id: "se-typescript-2", kind: "EXPERIENCE", label: "TypeScript, 2+ years", value: "2", years: 2, skill: "TypeScript" },
      { id: "se-react", kind: "SKILL", label: "React", value: "React" },
      { id: "se-civic", kind: "DOMAIN", label: "Public-sector or civic context", value: "civic" },
    ],
  },
  {
    family: "Data / ML",
    recommendedAssessmentFamily: "Algorithms",
    exampleDescription:
      "Work with messy operational data and turn it into a decision a busy person can use. The role is as much judgment as modelling.",
    guidance:
      "Use a skill and a domain signal, not a personality trait. Unknown experience is shown as not stated, not as a failure.",
    suggestedSignals: [
      { id: "dm-python", kind: "SKILL", label: "Python", value: "Python" },
      { id: "dm-sql", kind: "SKILL", label: "SQL", value: "SQL" },
      { id: "dm-analytics", kind: "DOMAIN", label: "Analytics or measurement", value: "analytics" },
    ],
  },
  {
    family: "Quantitative finance",
    recommendedAssessmentFamily: "Quant",
    exampleDescription:
      "Research, trade or build systems where probability, statistics and careful code decide the outcome.",
    guidance:
      "Quant roles usually need two bars: a reasoning test (probability or statistics) and a coding or arithmetic test. Quant reasoning tests run in browser lockdown; the reviewer sees the sitting record as context, never as an automatic decision.",
    suggestedSignals: [
      { id: "qf-probability", kind: "SKILL", label: "Probability", value: "Probability" },
      { id: "qf-python", kind: "SKILL", label: "Python", value: "Python" },
      { id: "qf-markets", kind: "DOMAIN", label: "Markets or trading context", value: "markets" },
    ],
  },
  {
    family: "Platform engineering",
    recommendedAssessmentFamily: "JavaScript",
    exampleDescription:
      "Keep a small platform reliable for the people who depend on it. Make the next incident less likely and the handover less painful.",
    guidance:
      "Platform engineering is a template-only family in this demo. A live role card must use one of the playable JavaScript or algorithms assessments.",
    suggestedSignals: [
      { id: "pe-linux", kind: "SKILL", label: "Linux", value: "Linux" },
      { id: "pe-postgres", kind: "SKILL", label: "PostgreSQL", value: "PostgreSQL" },
      { id: "pe-infra", kind: "DOMAIN", label: "Infrastructure or reliability", value: "infrastructure" },
    ],
  },
];

export const LIVE_ROLE_FAMILIES: RoleFamily[] = ["Software engineering", "Data / ML", "Quantitative finance"];

export function roleFamilyTemplate(family: string): RoleFamilyTemplate {
  return ROLE_FAMILY_TEMPLATES.find((template) => template.family === family) ?? ROLE_FAMILY_TEMPLATES[0];
}
export const PROTECTED_SIGNAL_PATTERN =
  /\b(?:nationality|nationalities|citizen|citizenship|immigrant|migrant|race|racial|ethnicity|ethnic|religion|religious|gender|male|female|woman|man|age\s+under|age\s+over|disability|disabled|pregnan|marital|family\s+status|sexual\s+orientation|university|degree|bachelor|master|phd|school)\b/i;

export function unsafeRoleSignal(signal: { label: string; value: string; skill?: string }): string | null {
  const haystack = [signal.label, signal.value, signal.skill].filter(Boolean).join(" ");
  return PROTECTED_SIGNAL_PATTERN.test(haystack)
    ? "A role-card signal uses a protected or education-related attribute. Use a skill or dated experience instead."
    : null;
}
