import { describe, expect, it } from "vitest";
import { LIVE_ROLE_FAMILIES, roleFamilyTemplate, unsafeRoleSignal } from "./role-card-templates";

describe("role-card signals", () => {
  it("offers only structured templates for live families", () => {
    expect(LIVE_ROLE_FAMILIES).toEqual(["Software engineering", "Data / ML", "Quantitative finance"]);
    expect(roleFamilyTemplate("Quantitative finance").recommendedAssessmentFamily).toBe("Quant");
    const template = roleFamilyTemplate("Software engineering");
    expect(template.recommendedAssessmentFamily).toBe("JavaScript");
    expect(template.suggestedSignals.length).toBeGreaterThan(0);
    expect(template.suggestedSignals.every((signal) => signal.kind !== "DOMAIN" || signal.value.length > 0)).toBe(true);
  });

  it("rejects protected and education-based signals", () => {
    expect(unsafeRoleSignal({ label: "Nationality", value: "Finnish" })).toContain("protected");
    expect(unsafeRoleSignal({ label: "University", value: "Aalto" })).toContain("protected");
    expect(unsafeRoleSignal({ label: "React", value: "React" })).toBeNull();
    expect(unsafeRoleSignal({ label: "TypeScript, 2+ years", value: "2", skill: "TypeScript" })).toBeNull();
  });
});
