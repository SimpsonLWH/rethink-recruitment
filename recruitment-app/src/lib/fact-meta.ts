export type FactModuleKind =
  | "ACHIEVEMENT"
  | "PROJECT"
  | "ROLE"
  | "RESPONSIBILITY"
  | "QUALIFICATION"
  | "AVAILABILITY"
  | "RESULT"
  | "FACT";

/**
 * Optional, applicant-supplied structured metadata attached to a fact.
 * It never upgrades provenance and it never adds a claim: it only helps the
 * review card present the fact in a richer, more glanceable module.
 */
export interface FactMeta {
  module?: FactModuleKind;
  title?: string;
  organisation?: string;
  /** Inclusive month, format YYYY-MM. */
  start?: string;
  /** Exclusive month, format YYYY-MM. Omit for an open-ended item. */
  end?: string | null;
  image?: string;
  stat?: string;
  context?: string;
  /** One-line project outcome supplied with the fact's structured metadata. */
  outcome?: string;
  skills?: string[];
  domain?: string[];
  linkLabel?: string;
}

const MODULES: FactModuleKind[] = [
  "ACHIEVEMENT",
  "PROJECT",
  "ROLE",
  "RESPONSIBILITY",
  "QUALIFICATION",
  "AVAILABILITY",
  "RESULT",
  "FACT",
];

function cleanString(value: unknown, max = 200): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function cleanStrings(value: unknown, max = 12): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
  return items.length ? items : undefined;
}

export function parseFactMeta(value: string | null | undefined): FactMeta {
  if (!value) return {};
  let raw: unknown;
  try {
    raw = JSON.parse(value) as unknown;
  } catch {
    return {};
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const record = raw as Record<string, unknown>;
  const moduleKind =
    typeof record.module === "string" && MODULES.includes(record.module as FactModuleKind)
      ? (record.module as FactModuleKind)
      : undefined;
  const start = cleanString(record.start, 7);
  const end = cleanString(record.end, 7);
  return {
    module: moduleKind,
    title: cleanString(record.title, 120),
    organisation: cleanString(record.organisation, 120),
    start: start && /^\d{4}-\d{2}$/.test(start) ? start : undefined,
    end: end && /^\d{4}-\d{2}$/.test(end) ? end : end === undefined ? undefined : null,
    image: cleanString(record.image, 300),
    stat: cleanString(record.stat, 40),
    context: cleanString(record.context, 240),
    outcome: cleanString(record.outcome, 240),
    skills: cleanStrings(record.skills),
    domain: cleanStrings(record.domain),
    linkLabel: cleanString(record.linkLabel, 80),
  };
}

export function factMetaJson(meta: FactMeta | null | undefined): string {
  if (!meta) return "{}";
  return JSON.stringify(meta);
}
