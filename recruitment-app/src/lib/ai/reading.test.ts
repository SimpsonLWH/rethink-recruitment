import { describe, expect, it } from "vitest";
import type { CandidateDetail, FactView, RoleDetail, SignalMatch } from "@/lib/repo";
import {
  buildEvidenceReadingLocally,
  buildReadingInput,
  containsRankingLanguage,
  readingCacheKey,
} from "./reading";

const assessment = {
  id: "assess-js",
  slug: "javascript-v1-medium",
  title: "JavaScript",
  roleFamily: "Software engineering",
  family: "JavaScript",
  version: "v1",
  difficulty: "MEDIUM" as const,
  description: "A short JavaScript assessment.",
  playable: true,
  problemCount: 2,
  order: 1,
    durationMinutes: 0,
    proctoring: "NONE" as const,
    topics: [],
};

const facts: FactView[] = [
  {
    id: "fact-a",
    prompt: "A project I am proud of",
    claim: "I rebuilt the returns flow and made the interface more accessible for screen-reader users.",
    skillTags: ["Accessibility", "React"],
    meta: {
      module: "PROJECT",
      title: "Returns rebuild",
      organisation: "Lumen Retail",
      start: "2024-01",
      end: "2024-10",
    },
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

function roleFixture(): RoleDetail {
  return {
    id: "role-1",
    slug: "product-engineer",
    title: "Product Engineer",
    employmentType: "Full-time",
    workMode: "Hybrid",
    location: "Espoo",
    summary: "Build calm, accessible public services.",
    skills: ["React", "Accessibility"],
    portfolioRequired: false,
    roleFamily: "Software engineering",
    assessment,
    requiredScore: 70,
    requirements: [{ assessmentId: "assess-js", requiredScore: 70, assessment }],
    evidenceSignals: [
      { id: "sig-react", kind: "SKILL", label: "React", value: "React" },
      { id: "sig-civic", kind: "DOMAIN", label: "Civic context", value: "civic" },
    ],
    configStatus: "LIVE",
    reviewOwnerName: "Mikko Ranta",
    reviewDueHours: 48,
    order: 1,
    employer: {
      id: "emp-1",
      slug: "northwind-labs",
      name: "Northwind Labs",
      tagline: "Public services, calmly built.",
      industry: "Civic technology",
      teamSize: "12",
      location: "Espoo",
      logoMark: "NL",
      palette: "ink",
      about: "A synthetic employer.",
      contactName: "Mikko Ranta",
    },
    whyJoin: "Small team, real problems.",
    problemNow: "The consent flow is hard to read.",
    first90: "Ship the first accessible release.",
    employerPrompts: [],
  };
}

function candidateFixture(score: number | null, sourceFacts: FactView[] = facts): CandidateDetail {
  return {
    id: "cand-1",
    slug: "aino-vikstrom",
    name: "Aino Vikström",
    headline: "Product-minded frontend engineer",
    location: "Espoo",
    bio: "secret-bio",
    monogram: "AV",
    palette: "rose",
    tags: ["secret-tag"],
    interests: [],
    availability: "Available now",
    discoveryOptIn: true,
    cvFileName: null,
    cvSource: null,
    cvUploadedAt: null,
    order: 1,
    facts: sourceFacts,
    assessmentResults: score === null
      ? []
      : [
          {
            assessment,
            score,
            attemptCount: 1,
            lastSubmittedAt: "2026-11-14T10:00:00.000Z",
            attemptId: "attempt-1",
            openAttemptId: null,
          },
        ],
    profileCompletion: { complete: true, completed: 1, total: 1, missing: [] },
  };
}

function signalsFixture(): SignalMatch[] {
  const role = roleFixture();
  return [
    {
      signal: role.evidenceSignals[0],
      status: "exact",
      factIds: ["fact-a"],
      explanation: "React is stated directly in the source fact.",
    },
    {
      signal: role.evidenceSignals[1],
      status: "unknown",
      factIds: [],
      explanation: "No civic context is named in the record.",
    },
  ];
}

describe("evidence reading input", () => {
  it("keeps the app's fixed statuses and minimises identity data", () => {
    const input = buildReadingInput({
      role: roleFixture(),
      candidate: candidateFixture(70),
      signals: signalsFixture(),
    });

    expect(input.requirements.map((requirement) => [requirement.id, requirement.status])).toEqual([
      ["assessment:assess-js", "met"],
      ["signal:sig-react", "met"],
      ["signal:sig-civic", "unknown"],
    ]);
    expect(input.requirements[0].factIds).toEqual([]);
    expect(input.requirements[1].factIds).toEqual(["fact-a"]);

    const sent = JSON.stringify(input);
    expect(sent).not.toContain("Aino");
    expect(sent).not.toContain("secret-bio");
    expect(sent).not.toContain("secret-tag");
    expect(sent).not.toContain("Product-minded frontend engineer");
  });

  it("marks a below-bar assessment as a gap, not a covered requirement", () => {
    const input = buildReadingInput({
      role: roleFixture(),
      candidate: candidateFixture(60),
      signals: signalsFixture(),
    });
    expect(input.requirements[0].status).toBe("not_met");
    expect(input.requirements[1].status).toBe("met");
  });

  it("uses a stable cache key and changes it when a fact changes", () => {
    const input = buildReadingInput({
      role: roleFixture(),
      candidate: candidateFixture(70),
      signals: signalsFixture(),
    });
    const first = readingCacheKey(input);
    expect(readingCacheKey(input)).toBe(first);
    input.facts[0].claim += " Verified with a second user test.";
    expect(readingCacheKey(input)).not.toBe(first);
  });
});

describe("deterministic evidence reading", () => {
  it("represents every requirement exactly once and cites only real facts", () => {
    const input = buildReadingInput({
      role: roleFixture(),
      candidate: candidateFixture(70),
      signals: signalsFixture(),
    });
    const reading = buildEvidenceReadingLocally(input);
    const represented = [...reading.covered, ...reading.gaps].map((item) => item.requirementId);
    expect(represented.sort()).toEqual(input.requirements.map((requirement) => requirement.id).sort());

    expect(reading.covered.map((item) => item.requirementId)).toEqual(["assessment:assess-js", "signal:sig-react"]);
    expect(reading.gaps.map((item) => item.requirementId)).toEqual(["signal:sig-civic"]);
    expect(reading.covered[1].factIds).toEqual(["fact-a"]);
    expect(facts[0].claim).toContain(reading.covered[1].quote ?? "");

    const narrative = [
      reading.summary,
      ...reading.covered.map((item) => item.note),
      ...reading.gaps.map((item) => item.note),
      ...reading.questions,
    ].join(" ");
    expect(containsRankingLanguage(narrative)).toBe(false);
    expect(reading.questions.length).toBeGreaterThan(0);
  });

  it("writes a neutral gap for a below-bar result", () => {
    const input = buildReadingInput({
      role: roleFixture(),
      candidate: candidateFixture(60),
      signals: signalsFixture(),
    });
    const reading = buildEvidenceReadingLocally(input);
    const assessmentGap = reading.gaps.find((item) => item.requirementId === "assessment:assess-js");
    expect(assessmentGap).toBeDefined();
    expect(assessmentGap!.note).toMatch(/not an automatic rejection/i);
    expect(reading.covered.some((item) => item.requirementId === "assessment:assess-js")).toBe(false);
  });

  it("stays useful when the record has no facts", () => {
    const input = buildReadingInput({
      role: roleFixture(),
      candidate: candidateFixture(null, []),
      signals: signalsFixture().map((signal) => ({
        ...signal,
        status: "unknown" as const,
        factIds: [],
        explanation: "No fact is available.",
      })),
    });
    const reading = buildEvidenceReadingLocally(input);
    expect(reading.covered).toHaveLength(0);
    expect(reading.gaps.length).toBe(input.requirements.length);
    expect(reading.questions.length).toBeGreaterThan(0);
    expect(reading.summary).toMatch(/deterministic reading/i);
  });
});

describe("ranking language guard", () => {
  it("flags ranking and recommendation phrases", () => {
    for (const phrase of [
      "The best candidate is clear.",
      "They are ranked first.",
      "A strong fit for this role.",
      "We recommend hiring.",
      "An auto-reject.",
    ]) {
      expect(containsRankingLanguage(phrase)).toBe(true);
    }
  });

  it("does not flag the product's own negative phrasing", () => {
    for (const phrase of [
      "No score or ranking is produced.",
      "This is not a ranking.",
      "Related evidence only.",
      "The record does not state a civic context.",
    ]) {
      expect(containsRankingLanguage(phrase)).toBe(false);
    }
  });
});
