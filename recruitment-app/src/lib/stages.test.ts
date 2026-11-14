import { describe, expect, it } from "vitest";
import { availableStages, isMatchStage, stageLabel } from "./stages";

describe("match stages", () => {
  it("labels known stages and falls back safely", () => {
    expect(stageLabel("INTRO_CALL")).toBe("Intro call");
    expect(stageLabel("INTERVIEW")).toBe("Interview");
    expect(stageLabel("UNKNOWN")).toBe("In progress");
    expect(isMatchStage("CLOSED")).toBe(true);
    expect(isMatchStage("closed")).toBe(false);
  });

  it("only moves forward or closes", () => {
    expect(availableStages("INTRO_CALL")).toEqual(["INTRO_CALL", "EVENT_MEETING", "INTERVIEW", "CLOSED"]);
    expect(availableStages("EVENT_MEETING")).toEqual(["EVENT_MEETING", "INTERVIEW", "CLOSED"]);
    expect(availableStages("INTERVIEW")).toEqual(["INTERVIEW", "CLOSED"]);
    expect(availableStages("CLOSED")).toEqual(["CLOSED"]);
  });
});
