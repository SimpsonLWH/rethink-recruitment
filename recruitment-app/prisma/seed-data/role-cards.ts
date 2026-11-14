import type { SeedRoleCard } from "./types";

export const seedEmployerContacts: Record<string, string> = {
  "northwind-labs": "Mikko Ranta",
  "saari-systems": "Helena Saari",
  "kide-studio": "Ilona Mäki",
  "fjord-logistics": "Tomas Berg",
  "lumen-retail": "Sanna Lehto",
  "polar-signal": "Jussi Lahti",
  "metsa-health": "Päivi Koski",
  "common-ground": "Sofia Lind",
};

/**
 * Only roles with a complete, playable role card enter the swipe feed.
 * The other seeded roles stay as profile/catalogue context for this demo.
 */
export const seedRoleCards: SeedRoleCard[] = [
  {
    roleSlug: "northwind-product-engineer",
    roleFamily: "Software engineering",
    assessmentSlug: "backend-design-v1-advanced",
    requiredScore: 70,
    reviewOwnerName: "Mikko Ranta",
    signals: [
      { id: "np-typescript", kind: "EXPERIENCE", label: "TypeScript, 2+ years", value: "2", years: 2, skill: "TypeScript" },
      { id: "np-react", kind: "SKILL", label: "React", value: "React" },
      { id: "np-civic", kind: "DOMAIN", label: "Public-sector or civic context", value: "civic" },
    ],
  },
  {
    roleSlug: "northwind-ml-engineer",
    roleFamily: "Data / ML",
    assessmentSlug: "algorithms-v1-medium",
    requiredScore: 60,
    reviewOwnerName: "Mikko Ranta",
    signals: [
      { id: "nm-python", kind: "SKILL", label: "Python", value: "Python" },
      { id: "nm-ml", kind: "SKILL", label: "Machine learning", value: "Machine learning" },
      { id: "nm-eval", kind: "EXPERIENCE", label: "Evaluation or safety work", value: "1", years: 1, skill: "Machine learning" },
    ],
  },
  {
    roleSlug: "saari-backend-engineer",
    roleFamily: "Software engineering",
    assessmentSlug: "backend-design-v1-advanced",
    requiredScore: 75,
    reviewOwnerName: "Helena Saari",
    signals: [
      { id: "sb-postgres", kind: "SKILL", label: "PostgreSQL", value: "PostgreSQL" },
      { id: "sb-node", kind: "SKILL", label: "Node.js", value: "Node.js" },
      { id: "sb-infra", kind: "DOMAIN", label: "Infrastructure or reliability", value: "infrastructure" },
    ],
  },
  {
    roleSlug: "polar-data-analyst",
    roleFamily: "Data / ML",
    assessmentSlug: "algorithms-v1-medium",
    requiredScore: 60,
    reviewOwnerName: "Jussi Lahti",
    signals: [
      { id: "pd-sql", kind: "SKILL", label: "SQL", value: "SQL" },
      { id: "pd-analysis", kind: "SKILL", label: "Data analysis", value: "Data analysis" },
      { id: "pd-analytics", kind: "DOMAIN", label: "Analytics or measurement", value: "analytics" },
    ],
  },
  {
    roleSlug: "metsa-qa-specialist",
    roleFamily: "Software engineering",
    assessmentSlug: "algorithms-v1-medium",
    requiredScore: 65,
    reviewOwnerName: "Päivi Koski",
    signals: [
      { id: "mq-qa", kind: "SKILL", label: "QA or testing", value: "QA" },
      { id: "mq-a11y", kind: "SKILL", label: "Accessibility", value: "Accessibility" },
      { id: "mq-health", kind: "DOMAIN", label: "Health or public services", value: "healthcare" },
    ],
  },
  {
    roleSlug: "common-ground-frontend-engineer",
    roleFamily: "Software engineering",
    assessmentSlug: "backend-design-v1-advanced",
    requiredScore: 70,
    reviewOwnerName: "Sofia Lind",
    signals: [
      { id: "cg-react", kind: "SKILL", label: "React", value: "React" },
      { id: "cg-ts", kind: "EXPERIENCE", label: "TypeScript, 1+ year", value: "1", years: 1, skill: "TypeScript" },
      { id: "cg-community", kind: "DOMAIN", label: "Community or non-profit context", value: "community" },
    ],
  },
];
