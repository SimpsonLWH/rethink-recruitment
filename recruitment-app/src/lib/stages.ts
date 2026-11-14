export type MatchStage = "INTRO_CALL" | "EVENT_MEETING" | "INTERVIEW" | "CLOSED";

export const MATCH_STAGES: MatchStage[] = ["INTRO_CALL", "EVENT_MEETING", "INTERVIEW", "CLOSED"];

export const MATCH_STAGE_LABELS: Record<MatchStage, string> = {
  INTRO_CALL: "Intro call",
  EVENT_MEETING: "Event-day meeting",
  INTERVIEW: "Interview",
  CLOSED: "Closed",
};

export function isMatchStage(value: string): value is MatchStage {
  return MATCH_STAGES.includes(value as MatchStage);
}

export function stageLabel(stage: string): string {
  return isMatchStage(stage) ? MATCH_STAGE_LABELS[stage] : "In progress";
}

export function availableStages(current: string): MatchStage[] {
  const currentStage = isMatchStage(current) ? current : "INTRO_CALL";
  if (currentStage === "CLOSED") return ["CLOSED"];
  return MATCH_STAGES.filter((stage) => stage === currentStage || MATCH_STAGES.indexOf(stage) >= MATCH_STAGES.indexOf(currentStage));
}
