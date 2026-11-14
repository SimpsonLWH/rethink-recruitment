import { describe, expect, it } from "vitest";
import { answerFromFactsLocally, extractHighlightsLocally, suggestTailoringLocally } from "./local";
import type { LocalTailoringFact } from "./local";
import { isNearCopy, normalizeForCompare, similarity } from "./rewrite";
import type { FactView, RoleDetail } from "@/lib/repo";

const facts: FactView[] = [
  {
    id: "fact-a",
    prompt: "A project I'm proud of",
    claim: "I rebuilt the returns flow and made the interface more accessible.",
    skillTags: ["Accessibility", "Frontend"],
    meta: {},
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
    meta: {},
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

const NO_REWRITE_NOTE =
  "No meaningful rewrite was possible for these claims. The master record is unchanged.";

function tailoringFacts(source: FactView[]): LocalTailoringFact[] {
  return source.map((fact) => ({
    id: fact.id,
    prompt: fact.prompt,
    claim: fact.claim,
    skillTags: fact.skillTags,
    evidenceUrl: fact.evidenceUrl,
    meta: fact.meta,
  }));
}

function numbersIn(value: string): string[] {
  return value.match(/\d[\d,]*(?:\.\d+)?%?/g) ?? [];
}

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
  it("returns suggestions plus a note", () => {
    const result = suggestTailoringLocally(tailoringFacts(facts), role);
    expect(Array.isArray(result.suggestions)).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.note === null || typeof result.note === "string").toBe(true);
  });

  it("only cites facts already in the master record", () => {
    const { suggestions } = suggestTailoringLocally(tailoringFacts(facts), role);
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
    const { suggestions } = suggestTailoringLocally(tailoringFacts(noLinks), role);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((suggestion) => suggestion.proposedText.length > 0)).toBe(true);
  });

  it("emits visibly changed suggestions and never near copies", () => {
    const { suggestions } = suggestTailoringLocally(tailoringFacts(facts), role);
    const claimById = new Map(facts.map((fact) => [fact.id, fact.claim]));
    expect(suggestions.length).toBeGreaterThan(0);
    let visiblyChanged = 0;
    for (const suggestion of suggestions) {
      const sourceClaim = claimById.get(suggestion.sourceFactIds[0]);
      expect(sourceClaim).toBeTruthy();
      expect(normalizeForCompare(suggestion.proposedText)).not.toBe(normalizeForCompare(sourceClaim ?? ""));
      expect(similarity(sourceClaim ?? "", suggestion.proposedText)).toBeLessThan(0.93);
      expect(isNearCopy(sourceClaim ?? "", suggestion.proposedText)).toBe(false);
      visiblyChanged += 1;
    }
    expect(visiblyChanged).toBeGreaterThan(0);
    expect(suggestions.every((suggestion) => suggestion.proposedText.length <= 500)).toBe(true);
  });

  it("keeps source names, numbers and URLs and never injects the evidence link", () => {
    const grounded: FactView[] = [
      {
        id: "fact-grounded",
        prompt: "A project I'm proud of",
        claim:
          "At Lumen Retail, I rebuilt the checkout flow so that first-time shoppers could finish it; completion went from 41% to 63% in six weeks. Notes: https://example.com/?evidence=checkout.",
        skillTags: ["Accessibility", "Frontend"],
        meta: { module: "PROJECT", organisation: "Lumen Retail" },
        evidenceUrl: "https://evidence.example/should-not-be-injected",
        provenance: "SELF_CLAIMED",
        confirmedByEmployerName: null,
        origin: "SEED",
        order: 1,
        linkStatus: null,
      },
    ];
    const { suggestions, note } = suggestTailoringLocally(tailoringFacts(grounded), role);
    expect(suggestions).toHaveLength(1);
    expect(note).toBeNull();
    const text = suggestions[0].proposedText;
    expect(text).toContain("Lumen Retail");
    expect(text).toContain("41%");
    expect(text).toContain("63%");
    expect(text).toContain("https://example.com/?evidence=checkout");
    expect(numbersIn(text).sort()).toEqual(numbersIn(grounded[0].claim).sort());
    expect(text).not.toContain("should-not-be-injected");
    expect(text).not.toContain("https://invented");
    expect(text).not.toContain("Northwind Labs");
  });

  it("does not add provenance, invented employers or invented links", () => {
    const { suggestions } = suggestTailoringLocally(tailoringFacts(facts), role);
    for (const suggestion of suggestions) {
      expect(Object.keys(suggestion).sort()).toEqual(["kind", "proposedText", "rationale", "sourceFactIds"]);
      expect(suggestion.proposedText.toLowerCase()).not.toContain("provenance");
      expect(suggestion.proposedText).not.toContain("SELF_CLAIMED");
      expect(suggestion.proposedText).not.toContain("EMPLOYER_CONFIRMED");
      expect(suggestion.proposedText).not.toContain("Northwind Labs");
    }
  });

  it("describes the actual change and notes that every source fact is preserved", () => {
    const { suggestions } = suggestTailoringLocally(tailoringFacts(facts), role);
    expect(suggestions.length).toBeGreaterThan(0);
    for (const suggestion of suggestions) {
      expect(suggestion.rationale).toMatch(/tightened|reordered|action instead|increased from|At X:/);
      expect(suggestion.rationale).toContain("Every name, number and source fact is preserved");
      expect(suggestion.rationale.length).toBeLessThanOrEqual(260);
    }
  });

  it("omits unchangeable claims and explains the omission in the note", () => {
    const mixed: LocalTailoringFact[] = [
      {
        id: "fact-good",
        prompt: "A project I'm proud of",
        claim: "I rebuilt the returns flow and made the interface more accessible.",
        skillTags: ["Accessibility"],
        evidenceUrl: null,
      },
      {
        id: "fact-short",
        prompt: "My ideal team",
        claim: "People who argue about the problem before the solution.",
        skillTags: ["Accessibility"],
        evidenceUrl: null,
      },
    ];
    const { suggestions, note } = suggestTailoringLocally(mixed, role);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].sourceFactIds).toEqual(["fact-good"]);
    expect(note).toBe("1 claim(s) had no meaningful rewrite and were left out; they remain in the master record.");
  });

  it("returns the honest empty note when none of the claims can be rewritten", () => {
    const unchangeable: LocalTailoringFact[] = [
      {
        id: "fact-short",
        prompt: "My ideal team",
        claim: "People who argue about the problem before the solution.",
        skillTags: ["Teamwork"],
        evidenceUrl: null,
      },
    ];
    const result = suggestTailoringLocally(unchangeable, role);
    expect(result.suggestions).toEqual([]);
    expect(result.note).toBe(NO_REWRITE_NOTE);
  });

  it("uses FOREGROUND for the first two suggestions and REWORD for the rest", () => {
    const claims = [
      "I rebuilt the returns flow and made it accessible.",
      "I wrote a number of scripts in order to automate the release.",
      "At Lumen Retail, I rebuilt the checkout flow.",
      "I led the billing migration for the finance team.",
    ];
    const changeable: LocalTailoringFact[] = claims.map((claim, index) => ({
      id: "fact-" + index,
      prompt: "A project I'm proud of",
      claim,
      skillTags: ["Frontend"],
      evidenceUrl: null,
    }));
    const { suggestions } = suggestTailoringLocally(changeable, role);
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
    expect(suggestions[0].kind).toBe("FOREGROUND");
    expect(suggestions[1].kind).toBe("FOREGROUND");
    expect(suggestions[2].kind).toBe("REWORD");
    expect(suggestions.every((suggestion) => suggestion.sourceFactIds.length === 1)).toBe(true);
  });

  it("has no note when every selected claim has a meaningful rewrite", () => {
    const { suggestions, note } = suggestTailoringLocally(tailoringFacts([facts[0]]), role);
    expect(suggestions).toHaveLength(1);
    expect(note).toBeNull();
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
