import { Spotlight } from "lucide-react";

/**
 * The single source of truth for the limited interest signal.
 * Renaming the signal, changing its icon or changing its count wording
 * is a one-file edit; no UI component hardcodes these strings.
 */
export const PRIORITY_INTRO = {
  name: "Priority intro",
  plural: "Priority intros",
  navLabel: "Priority intros",
  shortLabel: "Intros",
  actionLabel: "Priority intro",
  icon: Spotlight,
  explainer:
    "A Priority intro says you'd especially like to meet. It is interest, never an assessment of suitability.",
  countLabel(remaining: number) {
    const safe = Math.max(0, remaining);
    return safe + " Priority intro" + (safe === 1 ? "" : "s") + " left";
  },
} as const;

export const PriorityIntroIcon = PRIORITY_INTRO.icon;

export function priorityIntroCountLabel(remaining: number) {
  return PRIORITY_INTRO.countLabel(remaining);
}