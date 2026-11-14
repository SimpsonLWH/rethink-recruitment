export const LINK_STATUS_LABEL = {
  WORKS: "Link works",
  UNREACHABLE: "Link unreachable",
} as const;

export const PROVENANCE_LABEL = {
  SELF_CLAIMED: "Self-claimed",
  EMPLOYER_CONFIRMED: "Employer-confirmed",
} as const;

export type LinkStatus = keyof typeof LINK_STATUS_LABEL;
export type Provenance = keyof typeof PROVENANCE_LABEL;

export function normalizeLinkStatus(value: string | null | undefined): LinkStatus | null {
  if (value === "WORKS" || value === "UNREACHABLE") return value;
  return null;
}
