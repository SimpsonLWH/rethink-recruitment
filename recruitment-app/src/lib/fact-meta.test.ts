import { describe, expect, it } from "vitest";
import { isContextFact } from "./fact-meta";

describe("isContextFact", () => {
  it("treats preference and availability facts as context", () => {
    expect(isContextFact({ prompt: "My ideal team", meta: {} })).toBe(true);
    expect(isContextFact({ prompt: "What I'm looking for", meta: { module: "AVAILABILITY" } })).toBe(true);
    expect(isContextFact({ prompt: "Anything else", meta: { module: "FACT" } })).toBe(true);
  });

  it("keeps projects, achievements and roles as evidence claims", () => {
    expect(isContextFact({ prompt: "A project I'm proud of", meta: { module: "PROJECT" } })).toBe(false);
    expect(isContextFact({ prompt: "The hardest problem I've solved", meta: { module: "ACHIEVEMENT" } })).toBe(false);
    expect(isContextFact({ prompt: "Work history", meta: { module: "ROLE" } })).toBe(false);
  });

  it("does not classify a normal claim from its wording alone", () => {
    expect(isContextFact({ prompt: "A result I'm proud of", meta: {} })).toBe(false);
  });
});
