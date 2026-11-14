import { seededRandom } from "@/lib/assessments";

/**
 * Fixed demo mix: one already-interested card for one discovery card, then a
 * deterministic shuffle so the two cohorts are not visibly blocked. The
 * returned array never carries a cohort field; the UI only sees cards.
 */
export const FEED_MIX = { interested: 1, discovery: 1 } as const;

export interface ComposeFeedOptions<T> {
  interested: T[];
  discovery: T[];
  keyOf: (item: T) => string;
  /** Stable per-viewer / per-role salt; keeps the order reproducible. */
  salt: string;
}

export function composeFeed<T>({ interested, discovery, keyOf, salt }: ComposeFeedOptions<T>): T[] {
  const interestedQueue = interested.slice().sort((left, right) => keyOf(left).localeCompare(keyOf(right)));
  const discoveryQueue = discovery.slice().sort((left, right) => keyOf(left).localeCompare(keyOf(right)));

  const mixed: T[] = [];
  let interestedIndex = 0;
  let discoveryIndex = 0;

  while (interestedIndex < interestedQueue.length || discoveryIndex < discoveryQueue.length) {
    for (let count = 0; count < FEED_MIX.interested && interestedIndex < interestedQueue.length; count++) {
      mixed.push(interestedQueue[interestedIndex++]);
    }
    for (let count = 0; count < FEED_MIX.discovery && discoveryIndex < discoveryQueue.length; count++) {
      mixed.push(discoveryQueue[discoveryIndex++]);
    }
  }

  return shuffle(mixed, salt);
}

export function shuffle<T>(items: T[], salt: string): T[] {
  const result = items.slice();
  const random = seededRandom(salt || "rivet");
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = result[index];
    result[index] = result[swapIndex];
    result[swapIndex] = current;
  }
  return result;
}
