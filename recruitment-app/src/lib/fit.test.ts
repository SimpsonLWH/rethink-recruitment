import { describe, expect, it } from "vitest";
import { buildFitSummary } from "./fit";

const facts = [
  { id: "fact-1", claim: "I rebuilt a returns flow and cut support calls by a third.", skillTags: ["Accessibility", "Frontend"], evidenceUrl: "https://example.com/?evidence=one" },
  { id: "fact-2", claim: "I wrote contribution rules for a design system.", skillTags: ["Design systems"], evidenceUrl: null },
];

const role = {
  title: "Product Engineer",
  summary: "Build the case-worker product.",
  problemNow: "The consent flow reads like a legal form.",
  skills: ["Frontend", "Design systems"],
  employerName: "Northwind Labs",
};

describe("advisory fit briefs", () => {
  it("is derived from visible themes and evidence presence, not a hidden score", () => {
    const fit = buildFitSummary({ candidateName: "Aino Vikström", candidateTags: ["Frontend"], facts, role });
    expect(fit.digest).toContain("Aino");
    expect(fit.digest).toContain("1 of 2 claims include an evidence link");
    expect(fit.digest).toContain("Reachability is not a truth score");
    expect(fit.sharedThemes.map((theme) => theme.theme)).toContain("Frontend");
    expect(fit.sharedThemes.flatMap((theme) => theme.factIds).length).toBeGreaterThan(0);
    expect(fit.questions.length).toBeGreaterThan(0);
  });

  it("works when the record has no evidence or portfolio links", () => {
    const fit = buildFitSummary({
      candidateName: "Elias Nieminen",
      candidateTags: ["Retail"],
      facts: [{ id: "fact-3", claim: "I kept a team through the Christmas rush.", skillTags: ["Team leadership"], evidenceUrl: null }],
      role: { ...role, title: "Store Supervisor", skills: ["Team leadership"] },
    });
    expect(fit.evidenceCoverage).toBe(0);
    expect(fit.digest).toContain("0 of 1 claims include an evidence link");
  });
});
