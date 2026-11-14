import { describe, expect, it } from "vitest";
import { validateAsk, validateHighlights, validateReading, validateTailoring } from "./validation";
import type { ReadingRequirement } from "./reading-types";
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

const readingRequirements: ReadingRequirement[] = [
  {
    id: "assessment:js",
    kind: "ASSESSMENT",
    label: "JavaScript",
    status: "met",
    detail: "Recorded 70 against a stated bar of 70.",
    factIds: [],
    requiredScore: 70,
    recordedScore: 70,
  },
  {
    id: "signal:react",
    kind: "SIGNAL",
    label: "React",
    status: "related",
    detail: "React is related to the accessibility work in the record.",
    factIds: ["fact-a"],
  },
  {
    id: "signal:civic",
    kind: "SIGNAL",
    label: "Civic context",
    status: "unknown",
    detail: "No civic context is named in the record.",
    factIds: [],
  },
];

const readingContext = {
  requirements: readingRequirements,
  facts: [{ id: "fact-a", claim: facts[0].claim }],
};

function validReading() {
  return {
    summary: "The record shows a met assessment and related React evidence. Civic context is not stated.",
    covered: [
      {
        requirementId: "assessment:js",
        note: "Recorded 70 against a stated bar of 70.",
        factIds: [],
        quote: null,
      },
      {
        requirementId: "signal:react",
        note: "React is related to the accessibility work in the record.",
        factIds: ["fact-a"],
        quote: "made the interface more accessible",
      },
    ],
    gaps: [
      {
        requirementId: "signal:civic",
        note: "No civic context is named in the record. Ask for a concrete example.",
      },
    ],
    questions: ["Ask for a concrete example of civic work."],
    caveats: ["Advisory reading only."],
  };
}

describe("evidence reading validation", () => {
  it("accepts a grounded reading with every requirement represented once", () => {
    const reading = validateReading(validReading(), readingContext);
    expect(reading.covered).toHaveLength(2);
    expect(reading.gaps).toHaveLength(1);
    expect(reading.covered[1].quote).toBe("made the interface more accessible");
  });

  it("rejects an unknown requirement id", () => {
    const reading = validReading();
    reading.gaps[0].requirementId = "signal:unknown";
    expect(() => validateReading(reading, readingContext)).toThrow(/not on this role card/i);
  });

  it("rejects a missing requirement", () => {
    const reading = validReading();
    reading.gaps = [];
    expect(() => validateReading(reading, readingContext)).toThrow(/did not cover every requirement/i);
  });

  it("rejects a duplicate requirement", () => {
    const reading = validReading();
    reading.covered.push({ ...reading.covered[0] });
    expect(() => validateReading(reading, readingContext)).toThrow(/repeated/i);
  });

  it("rejects a not-met requirement in covered", () => {
    const reading = validReading();
    reading.covered.push({
      requirementId: "signal:civic",
      note: "Civic context is not named.",
      factIds: [],
      quote: null,
    });
    reading.gaps = [];
    expect(() => validateReading(reading, readingContext)).toThrow(/unsupported requirement/i);
  });

  it("rejects a met requirement in gaps", () => {
    const reading = validReading();
    reading.covered = reading.covered.filter((item) => item.requirementId !== "assessment:js");
    reading.gaps.push({
      requirementId: "assessment:js",
      note: "The assessment is recorded but should not be a gap.",
    });
    expect(() => validateReading(reading, readingContext)).toThrow(/supported requirement/i);
  });

  it("rejects a quote that is not in the cited fact", () => {
    const reading = validReading();
    reading.covered[1].quote = "This sentence never appeared in the record.";
    expect(() => validateReading(reading, readingContext)).toThrow(/quote/i);
  });

  it("rejects a covered signal with no source fact", () => {
    const reading = validReading();
    reading.covered[1].factIds = [];
    expect(() => validateReading(reading, readingContext)).toThrow(/cite at least one source fact/i);
  });

  it("rejects a cited fact outside the review card", () => {
    const reading = validReading();
    reading.covered[1].factIds = ["fact-outside"];
    expect(() => validateReading(reading, readingContext)).toThrow(/not on this review card/i);
  });

  it("rejects ranking or decision language", () => {
    const reading = validReading();
    reading.summary = "The best candidate for this role is clear from the record.";
    expect(() => validateReading(reading, readingContext)).toThrow(/ranking or decision/i);
  });
});
