/**
 * Small display helpers for copy that comes from demo data or enums.
 * Keeps user-facing wording consistent instead of leaking internal tokens.
 */

/**
 * Assessment titles are stored as "Family - Topic"; the product voice uses a
 * colon on cards and the detail H1.
 */
export function assessmentTitle(title: string) {
  return title.replace(/\s+-\s+/g, ": ");
}

/** Human wording for the structured-signal enum. */
export function signalStatusLabel(status: string) {
  if (status === "exact") return "Matches";
  if (status === "related") return "Related";
  if (status === "not_met") return "Not met yet";
  if (status === "uncertain") return "Unclear yet";
  return "Not stated";
}

/** Sentence-case Like allowance, used across feed cards and dashboards. */
export function likesLeftLabel(count: number) {
  return count + (count === 1 ? " like" : " likes") + " left";
}

/** Platform difficulty wording: ADVANCED reads as "Hard". */
export function difficultyText(difficulty: string) {
  if (difficulty === "ADVANCED") return "Hard";
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
}

export function difficultyTone(difficulty: string) {
  if (difficulty === "EASY") return "text-emerald-700";
  if (difficulty === "ADVANCED") return "text-rose-700";
  return "text-amber-700";
}
