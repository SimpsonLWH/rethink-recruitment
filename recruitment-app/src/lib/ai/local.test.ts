import { describe, expect, it } from "vitest";
import { answerFromFactsLocally, extractHighlightsLocally, suggestTailoringLocally } from "./local";
import type { FactView, RoleDetail } from "@/lib/repo";

const facts: FactView[] = [
  {
    id: "fact-a",
    prompt: "A project I'm proud of",
    claim: "I rebuilt the returns flow and made the interface more accessible.",
    skillTags: ["Accessibility", "Frontend"],
    evidenceUrl: "https://example.com/?evidence=one",
    provenance: "SELF_CLAIMED",
    confirmedByEmployerName: null,
    origin: "SEED",
    order: 1,
    linkStatus: null,
  },
  {
    id: "fact-b",
    prompt: "My ideal team",
    claim: "People who argue about the problem before the solution.",
    skillTags: ["Teamwork"],
    evidenceUrl: null,
    provenance: "SELF_CLAIMED",
    confirmedByEmployerName: null,
    origin: "SEED",
    order: 2,
    linkStatus: null,
  },
];

const role = {
  id: "role-1",
  title: "Product Engineer",
  skills: ["Frontend", "Accessibility"],
  problemNow: "The consent flow is hard to read.",
  employer: { name: "Northwind Labs" },
} as unknown as RoleDetail;

describe("local extraction fallback", () => {
  it("returns grounded highlights and only URLs present in the answer", () => {
    const text =
      "I rebuilt the returns flow at Lumen Retail and made it accessible. The evidence is at https://example.com/?evidence=one and I documented the change. Another project did not include a link.";
    const highlights = extractHighlightsLocally(text);
    expect(highlights.length).toBeGreaterThan(0);
    for (const highlight of highlights) {
      expect(text).toContain(highlight.sourceQuote);
      if (highlight.evidenceUrl) expect(text).toContain(highlight.evidenceUrl);
    }
    expect(highlights.some((highlight) => highlight.skill === "Accessibility")).toBe(true);
    expect(highlights.some((highlight) => highlight.evidenceUrl === "https://example.com/?evidence=one")).toBe(true);
  });

  it("has no provenance field at all", () => {
    const highlight = extractHighlightsLocally("I built an accessible form and tested it with real users.")[0];
    expect(Object.keys(highlight)).not.toContain("provenance");
  });
});

describe("local tailoring fallback", () => {
  it("only cites facts already in the master record", () => {
    const suggestions = suggestTailoringLocally(
      facts.map((fact) => ({ id: fact.id, prompt: fact.prompt, claim: fact.claim, skillTags: fact.skillTags, evidenceUrl: fact.evidenceUrl })),
      role,
    );
    expect(suggestions.length).toBeGreaterThan(0);
    const ids = new Set(facts.map((fact) => fact.id));
    for (const suggestion of suggestions) {
      expect(suggestion.sourceFactIds.length).toBeGreaterThan(0);
      expect(suggestion.sourceFactIds.every((id) => ids.has(id))).toBe(true);
      expect(suggestion.proposedText).not.toContain("https://invented");
    }
  });

  it("works without any evidence links or portfolio content", () => {
    const noLinks = facts.map((fact) => ({ ...fact, evidenceUrl: null }));
    const suggestions = suggestTailoringLocally(
      noLinks.map((fact) => ({ id: fact.id, prompt: fact.prompt, claim: fact.claim, skillTags: fact.skillTags, evidenceUrl: null })),
      role,
    );
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((suggestion) => suggestion.proposedText.length > 0)).toBe(true);
  });
});

describe("local profile Q&A fallback", () => {
  it("answers only from the record and cites facts", () => {
    const result = answerFromFactsLocally(facts, "What does this person want in a team?");
    expect(result.answer).toContain("argue about the problem");
    expect(result.sourceFactIds).toEqual(["fact-b"]);
  });

  it("refuses questions that are not in the record", () => {
    const result = answerFromFactsLocally(facts, "What is their salary expectation in Tokyo?");
    expect(result.sourceFactIds).toHaveLength(0);
    expect(result.answer).toContain("isn't answered by this profile's record");
  });
});
