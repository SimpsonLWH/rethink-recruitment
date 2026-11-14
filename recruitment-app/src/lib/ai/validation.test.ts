import { describe, expect, it } from "vitest";
import { validateAsk, validateHighlights, validateTailoring } from "./validation";
import type { FactView } from "@/lib/repo";

const facts: FactView[] = [
  {
    id: "fact-a",
    prompt: "A project I'm proud of",
    claim: "I rebuilt the returns flow and made the interface more accessible.",
    skillTags: ["Accessibility"],
    meta: {},
    evidenceUrl: "https://example.com/?evidence=one",
    provenance: "SELF_CLAIMED",
    confirmedByEmployerName: null,
    origin: "SEED",
    order: 1,
    linkStatus: null,
  },
];

describe("AI output validation", () => {
  it("strips an evidence link that is not literally in the source answer", () => {
    const highlights = validateHighlights(
      {
        highlights: [
          {
            skill: "Accessibility",
            claim: "I rebuilt an accessible returns flow.",
            evidenceUrl: "https://example.com/?evidence=invented",
            sourceQuote: "I rebuilt an accessible returns flow.",
          },
        ],
      },
      "I rebuilt an accessible returns flow. The old form was hard to use.",
    );
    expect(highlights[0].evidenceUrl).toBeNull();
  });

  it("rejects a sourceQuote that is not in the source answer", () => {
    expect(() =>
      validateHighlights(
        {
          highlights: [
            {
              skill: "Accessibility",
              claim: "I built an accessible form.",
              evidenceUrl: null,
              sourceQuote: "This sentence never appeared.",
            },
          ],
        },
        "A different answer entirely.",
      ),
    ).toThrow(/grounded/i);
  });

  it("rejects tailoring that cites an unknown fact", () => {
    expect(() =>
      validateTailoring(
        {
          suggestions: [
            {
              kind: "FOREGROUND",
              sourceFactIds: ["fact-not-mine"],
              proposedText: "I built an accessible form.",
              rationale: "Matches the role.",
            },
          ],
        },
        facts,
      ),
    ).toThrow(/not in the master record/i);
  });

  it("rejects an invented URL in a tailored line", () => {
    expect(() =>
      validateTailoring(
        {
          suggestions: [
            {
              kind: "REWORD",
              sourceFactIds: ["fact-a"],
              proposedText: "I rebuilt the returns flow. See https://invented.example/proof.",
              rationale: "Relevant.",
            },
          ],
        },
        facts,
      ),
    ).toThrow(/link/i);
  });

  it("rejects Q&A sources outside the profile", () => {
    expect(() =>
      validateAsk(
        { answer: "They have 10 years of experience.", sourceFactIds: ["fact-outside"] },
        facts,
      ),
    ).toThrow(/outside/i);
  });

  it("accepts a valid Q&A answer and keeps only known sources", () => {
    const result = validateAsk(
      { answer: "The record says the interface was made more accessible.", sourceFactIds: ["fact-a"] },
      facts,
    );
    expect(result.sourceFactIds).toEqual(["fact-a"]);
  });
});
