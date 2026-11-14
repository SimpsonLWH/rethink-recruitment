export interface ProfileCompletionInput {
  headline: string;
  bio: string;
  interests: string[];
  availability: string;
  facts: Array<{ meta?: { module?: string } }>;
}

export interface ProfileCompletion {
  complete: boolean;
  completed: number;
  total: number;
  missing: string[];
}

/**
 * Completeness is a checklist, not a score. It never feeds matching and it
 * never ranks one candidate against another.
 */
export function profileCompletion(input: ProfileCompletionInput): ProfileCompletion {
  const checks = [
    { label: "headline", done: input.headline.trim().length > 0 },
    { label: "short bio", done: input.bio.trim().length > 0 },
    { label: "role interests", done: input.interests.length > 0 },
    { label: "availability", done: input.availability.trim().length > 0 },
    { label: "one role or experience", done: input.facts.some((fact) => fact.meta?.module === "ROLE") },
    { label: "one project", done: input.facts.some((fact) => fact.meta?.module === "PROJECT") },
  ];
  const missing = checks.filter((check) => !check.done).map((check) => check.label);
  const completed = checks.length - missing.length;
  return { complete: completed === checks.length, completed, total: checks.length, missing };
}
