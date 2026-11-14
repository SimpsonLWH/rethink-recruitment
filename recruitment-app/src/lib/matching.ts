import type { DecisionAction } from "@/lib/repo";

export function actionCountsAsYes(action: string | null | undefined): boolean {
  return action === "LIKE" || action === "PRIORITY_INTRO";
}

/** A match exists only when both recorded actions are a yes. A PASS never matches. */
export function canCreateMatch(myAction: DecisionAction | string, otherAction: string | null | undefined): boolean {
  return actionCountsAsYes(myAction) && actionCountsAsYes(otherAction);
}

/** Priority intros are a hard, equal budget. No hidden penalty; no purchase. */
export function canUsePriorityIntro(used: number, allowance: number): boolean {
  return used < allowance;
}

export function remainingPriorityIntros(allowance: number, used: number): number {
  return Math.max(0, allowance - used);
}

/** Ordinary Likes are limited. Replies and invitation acceptances are responses, not swipes. */
export function canUseLike(used: number, allowance: number): boolean {
  return used < allowance;
}

export function remainingLikes(allowance: number, used: number): number {
  return Math.max(0, allowance - used);
}

export function sourceConsumesLike(source: string | null | undefined): boolean {
  return !source || source === "SWIPE";
}

export function isResponseSource(source: string | null | undefined): boolean {
  return (
    source === "PRIORITY_INTRO_REPLY" ||
    source === "INVITATION_ACCEPT" ||
    source === "INVITATION_REPLY" ||
    source === "REVIEW_REQUEST" ||
    source === "REVIEW_REPLY"
  );
}
