import type { DecisionAction } from "@/lib/repo";

export function actionCountsAsYes(action: string | null | undefined): boolean {
  return action === "LIKE" || action === "ROSE";
}

/** A match exists only when both recorded actions are a yes. A PASS never matches. */
export function canCreateMatch(myAction: DecisionAction | string, otherAction: string | null | undefined): boolean {
  return actionCountsAsYes(myAction) && actionCountsAsYes(otherAction);
}

/** Roses are a hard, equal budget. No hidden penalty; no purchase. */
export function canUseRose(used: number, allowance: number): boolean {
  return used < allowance;
}

export function remainingRoses(allowance: number, used: number): number {
  return Math.max(0, allowance - used);
}
