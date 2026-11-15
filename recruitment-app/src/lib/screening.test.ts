import { describe, expect, it } from "vitest";
import {
  buildInterviewKit,
  decisionBasis,
  deriveScreeningPlan,
  evaluateClaims,
  evaluateCriteria,
  parseClaimChecks,
  parseCriterionChecks,
  parseScreeningPlan,
  summariseClaims,
  summarisePacket,
  validateScreeningDecision,
  type ClaimCheck,
  type ClaimInput,
  type CriterionCheck,
  type PlanSource,
} from "./screening";

const planSource: PlanSource = {
  roleTitle: "Product Engineer",
  requirements: [
    {
      assessmentId: "assess-js",
      requiredScore: 70,
      assessment: { title: "JavaScript: Data handling", version: "v1 · medium", durationMinutes: 45 },
    },
  ],
  signals: [
    { id: "sig-ts", kind: "EXPERIENCE", label: "TypeScript, 2+ years", value: "2", years: 2, skill: "TypeScript" },
    { id: "sig-react", kind: "SKILL", label: "React", value: "React" },
    { id: "sig-civic", kind: "DOMAIN", label: "Civic context", value: "civic" },
  ],
};

describe("deriveScreeningPlan", () => {
  const plan = deriveScreeningPlan(planSource);

  it("turns the stated bar into assessment and signal criteria", () => {
    expect(plan.map((criterion) => criterion.id)).toEqual([
      "assessment:assess-js",
      "signal:sig-ts",
      "signal:sig-react",
      "signal:sig-civic",
      "conversation:how-they-work",
    ]);
    expect(plan[0].kind).toBe("MUST_HAVE");
    expect(plan[0].requiredScore).toBe(70);
    expect(plan[0].detail).toContain("45 min");
    expect(plan[1].kind).toBe("MUST_HAVE");
    expect(plan[3].kind).toBe("NICE_TO_HAVE");
    expect(plan[4].source).toBe("CONVERSATION");
  });

  it("still gives a usable plan when the role has no explicit bar", () => {
    const bare = deriveScreeningPlan({ roleTitle: "Generalist", requirements: [], signals: [] });
    expect(bare.map((criterion) => criterion.id)).toEqual(["conversation:relevant-work", "conversation:how-they-work"]);
    expect(bare[0].kind).toBe("MUST_HAVE");
  });

  it("caps the plan at seven criteria", () => {
    const many: PlanSource = {
      roleTitle: "Everything",
      requirements: Array.from({ length: 6 }, (_, index) => ({
        assessmentId: "a" + index,
        requiredScore: 50,
        assessment: { title: "Test " + index, version: "v1" },
      })),
      signals: Array.from({ length: 6 }, (_, index) => ({
        id: "s" + index,
        kind: "SKILL" as const,
        label: "Skill " + index,
        value: "x",
      })),
    };
    expect(deriveScreeningPlan(many)).toHaveLength(7);
  });
});

describe("parseScreeningPlan", () => {
  const fallback = deriveScreeningPlan(planSource);

  it("uses the stored plan when every criterion is valid", () => {
    const stored = [{ ...fallback[0], label: "Stored label" }];
    expect(parseScreeningPlan(JSON.stringify(stored), fallback)[0].label).toBe("Stored label");
  });

  it("falls back on malformed JSON or an unknown kind", () => {
    expect(parseScreeningPlan("{not json", fallback)).toEqual(fallback);
    expect(parseScreeningPlan(JSON.stringify([{ ...fallback[0], kind: "MAGIC" }]), fallback)).toEqual(fallback);
  });
});

describe("evaluateCriteria", () => {
  const plan = deriveScreeningPlan(planSource);
  const results = [
    { assessmentId: "assess-js", score: 80, assessment: { title: "JavaScript: Data handling", version: "v1" } },
  ];
  const signals = [
    { signalId: "sig-ts", status: "exact" as const, factIds: ["f1"], explanation: "Dated TypeScript role, 2023–2025." },
    { signalId: "sig-react", status: "related" as const, factIds: ["f2"], explanation: "React mentioned in a project." },
  ];

  it("marks a score at or above the bar as met and below as not met", () => {
    const met = evaluateCriteria(plan, { assessmentResults: results, signalMatches: signals });
    expect(met[0].status).toBe("MET");
    expect(met[0].evidenceLine).toContain("80/100");
    const below = evaluateCriteria(plan, {
      assessmentResults: [{ ...results[0], score: 60 }],
      signalMatches: signals,
    });
    expect(below[0].status).toBe("NOT_MET");
  });

  it("keeps a missing or open sitting distinct from a failure", () => {
    const missing = evaluateCriteria(plan, { assessmentResults: [], signalMatches: signals });
    expect(missing[0].status).toBe("NOT_ASSESSED");
    const open = evaluateCriteria(plan, {
      assessmentResults: [{ ...results[0], score: null }],
      signalMatches: signals,
    });
    expect(open[0].status).toBe("OPEN");
  });

  it("maps signal matches to evidence states", () => {
    const evaluated = evaluateCriteria(plan, { assessmentResults: results, signalMatches: signals });
    expect(evaluated[1].status).toBe("MET");
    expect(evaluated[2].status).toBe("PARTLY");
    expect(evaluated[3].status).toBe("NOT_ASSESSED");
  });

  it("uses the interviewer rating for a conversation criterion", () => {
    const checks: CriterionCheck[] = [{ criterionId: "conversation:how-they-work", rating: "MEETS" }];
    const evaluated = evaluateCriteria(plan, { assessmentResults: results, signalMatches: signals }, checks);
    const conversation = evaluated.find((result) => result.criterion.source === "CONVERSATION");
    expect(conversation?.status).toBe("MET");
    expect(conversation?.humanRating).toBe("MEETS");
  });
});

const claims: ClaimInput[] = [
  {
    id: "f1",
    claim: "I rebuilt the returns flow and completion rose from 61% to 84%.",
    provenance: "SELF_CLAIMED",
    evidenceUrl: "https://example.com/returns",
    linkStatus: "WORKS",
    skillTags: ["React"],
  },
  {
    id: "f2",
    claim: "I led the design-system audit.",
    provenance: "SELF_CLAIMED",
    evidenceUrl: "https://broken.invalid",
    linkStatus: "UNREACHABLE",
    skillTags: ["Design systems"],
  },
  {
    id: "f3",
    claim: "Contract frontend engineer at Lumen Retail, 2024–2025.",
    provenance: "EMPLOYER_CONFIRMED",
    evidenceUrl: null,
    linkStatus: null,
    skillTags: ["React"],
  },
  {
    id: "f4",
    claim: "I prototype with real copy before components.",
    provenance: "SELF_CLAIMED",
    evidenceUrl: null,
    linkStatus: null,
    skillTags: ["Product thinking"],
  },
];

describe("evaluateClaims", () => {
  it("treats prose as unchecked, a live link as link-only, and confirms employer records", () => {
    const evaluated = evaluateClaims(claims, []);
    expect(evaluated.map((claim) => claim.status)).toEqual(["LINK_ONLY", "UNCHECKED", "VERIFIED", "UNCHECKED"]);
    expect(evaluated[0].basis).toContain("Nobody has reviewed it");
    expect(evaluated[1].basis).toContain("did not load");
    expect(evaluated[3].basis).toContain("prose");
  });

  it("lets a human check override the default", () => {
    const checks: ClaimCheck[] = [
      { factId: "f1", status: "VERIFIED", note: "Opened the case study; metrics match." },
      { factId: "f4", status: "NEEDS_CONVERSATION" },
    ];
    const evaluated = evaluateClaims(claims, checks);
    expect(evaluated[0].status).toBe("VERIFIED");
    expect(evaluated[0].note).toContain("metrics match");
    expect(evaluated[3].status).toBe("NEEDS_CONVERSATION");
  });

  it("summarises the record without a person score", () => {
    const summary = summariseClaims(evaluateClaims(claims, []));
    expect(summary).toMatchObject({ total: 4, linked: 1, unchecked: 2, verified: 1, withArtifact: 2, context: 0 });
  });

  it("keeps preferences and availability out of the checkable claims", () => {
    const contextClaim: ClaimInput = {
      id: "f5",
      claim: "People who argue about the problem before the solution.",
      provenance: "SELF_CLAIMED",
      evidenceUrl: null,
      linkStatus: null,
      context: true,
      skillTags: ["Teamwork"],
    };
    const evaluated = evaluateClaims([...claims, contextClaim], []);
    expect(evaluated.at(-1)?.status).toBe("CONTEXT");
    const summary = summariseClaims(evaluated);
    expect(summary.context).toBe(1);
    expect(summary.unchecked).toBe(2);
  });
});

describe("buildInterviewKit", () => {
  const plan = deriveScreeningPlan(planSource);
  const criteria = evaluateCriteria(
    plan,
    {
      assessmentResults: [],
      signalMatches: [{ signalId: "sig-ts", status: "unknown", factIds: [], explanation: "Not on the record." }],
    },
    [],
  );
  const claimResults = evaluateClaims(claims, []);

  it("turns open criteria and unchecked claims into a short kit", () => {
    const kit = buildInterviewKit({ roleTitle: "Product Engineer", criteria, claims: claimResults });
    expect(kit.questions.length).toBeGreaterThanOrEqual(4);
    expect(kit.questions.length).toBeLessThanOrEqual(5);
    expect(kit.questions.some((question) => question.prompt.includes("returns flow"))).toBe(true);
    expect(kit.questions.every((question) => question.listenFor.length > 20)).toBe(true);
    expect(kit.totalMinutes).toBeGreaterThanOrEqual(30);
    expect(kit.totalMinutes).toBeLessThanOrEqual(50);
    const agendaTotal = kit.agenda.reduce((total, item) => total + item.minutes, 0);
    expect(agendaTotal).toBe(kit.totalMinutes);
  });

  it("puts claims saved for the conversation into the kit", () => {
    const saved = evaluateClaims(claims, [{ factId: "f2", status: "NEEDS_CONVERSATION" }]);
    const kit = buildInterviewKit({ roleTitle: "Product Engineer", criteria, claims: saved, maxQuestions: 6 });
    expect(kit.questions.some((question) => question.prompt.includes("design-system audit"))).toBe(true);
  });

  it("asks about the exact work-sample questions with gaps", () => {
    const kit = buildInterviewKit({
      roleTitle: "Product Engineer",
      criteria,
      claims: claimResults,
      workSamples: [
        {
          assessmentTitle: "JavaScript: Data handling",
          problems: [
            { title: "Group names by category", passed: 5, total: 5 },
            { title: "Sort records by score", passed: 3, total: 5 },
          ],
        },
      ],
    });
    const gapQuestion = kit.questions.find((question) => question.prompt.includes("Sort records by score"));
    expect(gapQuestion).toBeTruthy();
    expect(gapQuestion?.prompt).toContain("3/5 checks");
    expect(gapQuestion?.sourceLabel).toContain("Sort records by score");
    expect(kit.questions.some((question) => question.prompt.includes("Group names by category"))).toBe(false);
  });

  it("does not repeat a prompt or ask about protected traits", () => {
    const kit = buildInterviewKit({ roleTitle: "Product Engineer", criteria, claims: claimResults, maxQuestions: 6 });
    const prompts = kit.questions.map((question) => question.prompt.toLowerCase());
    expect(new Set(prompts).size).toBe(prompts.length);
    for (const question of kit.questions) {
      expect(question.prompt.toLowerCase()).not.toMatch(/age|married|children|nationality|religion|disab/);
    }
  });

  it("respects a smaller maximum and still closes the conversation", () => {
    const kit = buildInterviewKit({ roleTitle: "Product Engineer", criteria, claims: claimResults, maxQuestions: 3 });
    expect(kit.questions).toHaveLength(3);
    expect(kit.questions.at(-1)?.kind).toBe("CLOSING");
  });
});

describe("summarisePacket", () => {
  const plan = deriveScreeningPlan(planSource);
  const evaluated = evaluateCriteria(plan, {
    assessmentResults: [{ assessmentId: "assess-js", score: 80, assessment: { title: "JavaScript", version: "v1" } }],
    signalMatches: [
      { signalId: "sig-ts", status: "exact", factIds: ["f1"], explanation: "Dated TypeScript role." },
      { signalId: "sig-react", status: "exact", factIds: ["f2"], explanation: "React in a project." },
      { signalId: "sig-civic", status: "unknown", factIds: [], explanation: "No civic context on the record." },
    ],
  });

  it("does not claim enough evidence while a must-have has no evidence", () => {
    const summary = summarisePacket(evaluated, evaluateClaims(claims, []));
    expect(summary.state).toBe("OPEN_ITEMS");
    expect(summary.nextActions.length).toBeGreaterThan(0);
    expect(summary.mustHaveAssessed).toBe(3);
    expect(summary.mustHaveTotal).toBe(3);
  });

  it("reaches 'enough to discuss' only when the record is checked", () => {
    const checks: ClaimCheck[] = claims.map((claim) => ({ factId: claim.id, status: "VERIFIED" as const }));
    const allSignals = [
      { signalId: "sig-ts", status: "exact" as const, factIds: ["f1"], explanation: "Dated TypeScript role." },
      { signalId: "sig-react", status: "exact" as const, factIds: ["f2"], explanation: "React in a project." },
      { signalId: "sig-civic", status: "exact" as const, factIds: ["f3"], explanation: "Civic project." },
    ];
    const checked = evaluateCriteria(
      plan,
      {
        assessmentResults: [{ assessmentId: "assess-js", score: 80, assessment: { title: "JavaScript", version: "v1" } }],
        signalMatches: allSignals,
      },
      [{ criterionId: "conversation:how-they-work", rating: "MEETS" }],
    );
    const summary = summarisePacket(checked, evaluateClaims(claims, checks));
    expect(summary.state).toBe("ENOUGH_TO_DISCUSS");
    expect(summary.headline).toContain("The decision is yours");
  });

  it("flags a thin record rather than inventing a verdict", () => {
    const thin = evaluateCriteria(
      deriveScreeningPlan(planSource),
      { assessmentResults: [], signalMatches: [] },
      [],
    );
    const summary = summarisePacket(thin, []);
    expect(summary.state).toBe("THIN");
    expect(summary.headline).toContain("Thin evidence");
  });
});

describe("validateScreeningDecision", () => {
  const checks: CriterionCheck[] = [{ criterionId: "assessment:assess-js", rating: "MEETS" }];

  it("requires a reason, a rating and a human confirmation", () => {
    const errors = validateScreeningDecision({ decision: "ADVANCE", reason: "ok", criterionChecks: [], confirmed: false });
    expect(errors).toHaveLength(3);
  });

  it("accepts a complete, human-owned decision", () => {
    const errors = validateScreeningDecision({
      decision: "ADVANCE",
      reason: "Assessment met the bar and two claims checked out.",
      criterionChecks: checks,
      confirmed: true,
    });
    expect(errors).toEqual([]);
  });

  it("rejects an unknown decision and a bad rating", () => {
    const errors = validateScreeningDecision({
      decision: "HIRE" as never,
      reason: "A long enough reason to pass the length check.",
      criterionChecks: [{ criterionId: "x", rating: "MAYBE" as never }],
      confirmed: true,
    });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe("persisted parsing", () => {
  it("reads criterion checks and ignores unsafe values", () => {
    expect(parseCriterionChecks(JSON.stringify([{ criterionId: "a", rating: "MEETS", note: "Good" }]))).toEqual([
      { criterionId: "a", rating: "MEETS", note: "Good" },
    ]);
    expect(parseCriterionChecks(JSON.stringify([{ criterionId: "a", rating: "HIRED" }]))[0].rating).toBe("NOT_ASSESSED");
    expect(parseCriterionChecks("nope")).toEqual([]);
  });

  it("reads claim checks and drops entries with no fact", () => {
    expect(parseClaimChecks(JSON.stringify([{ factId: "f1", status: "VERIFIED" }, { status: "VERIFIED" }]))).toEqual([
      { factId: "f1", status: "VERIFIED", note: undefined, updatedAt: undefined },
    ]);
    expect(parseClaimChecks(null)).toEqual([]);
  });

  it("summarises a decision basis from criterion labels", () => {
    const plan = deriveScreeningPlan(planSource);
    expect(decisionBasis([{ criterionId: "assessment:assess-js", rating: "MEETS" }], plan)).toContain("JavaScript: Data handling");
  });
});
