import { describe, expect, it } from "vitest";
import type { FactMeta } from "@/lib/fact-meta";
import type { CandidateDetail, FactView } from "@/lib/repo";
import {
  RELATED_SKILLS,
  matchCandidates,
  parseFeedPreferenceRules,
  pickCriterionToBroaden,
  type CandidateFeedMatch,
  type FeedCriterion,
  type FeedCriterionStatus,
} from "./feed";

// ---------------------------------------------------------------------------
// Synthetic fixtures. Everything is invented; no seed data is required.
// ---------------------------------------------------------------------------

function makeFact(
  id: string,
  claim: string,
  options: { skillTags?: string[]; meta?: FactMeta } = {},
): FactView {
  return {
    id,
    prompt: "Synthetic prompt",
    claim,
    skillTags: options.skillTags ?? [],
    meta: options.meta ?? {},
    evidenceUrl: null,
    provenance: "SELF_CLAIMED",
    confirmedByEmployerName: null,
    origin: "SEED",
    order: 0,
    linkStatus: null,
  };
}

function makeCandidate(
  id: string,
  facts: FactView[],
  overrides: Partial<CandidateDetail> = {},
): CandidateDetail {
  return {
    id,
    slug: id,
    name: "Synthetic Person",
    headline: "Synthetic headline",
    location: "Espoo, Finland",
    bio: "Synthetic bio.",
    monogram: "SP",
    palette: "plum",
    tags: [],
    interests: [],
    availability: "",
    discoveryOptIn: true,
    order: 0,
    facts,
    assessmentResults: [],
    profileCompletion: { complete: true, completed: 6, total: 6, missing: [] },
    ...overrides,
  };
}

function criteriaFor(text: string): FeedCriterion[] {
  return parseFeedPreferenceRules(text).criteria;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

describe("parseFeedPreferenceRules", () => {
  it("parses the required example into skill, experience and domain criteria", () => {
    const result = parseFeedPreferenceRules("React, at least 2 years, finance background");

    expect(result.rejected).toEqual([]);
    expect(result.unparsed).toEqual([]);
    expect(result.criteria.map((criterion) => criterion.kind)).toEqual([
      "SKILL",
      "EXPERIENCE",
      "DOMAIN",
    ]);
    expect(result.criteria[0]).toMatchObject({
      id: "skill:react",
      kind: "SKILL",
      label: "React",
      value: "React",
      skill: "React",
    });
    expect(result.criteria[1]).toMatchObject({
      id: "experience:react:2",
      kind: "EXPERIENCE",
      value: "React",
      skill: "React",
      years: 2,
    });
    expect(result.criteria[1].label).toContain("React");
    expect(result.criteria[2]).toMatchObject({
      id: "domain:finance",
      kind: "DOMAIN",
      label: "Finance",
      value: "finance",
    });
  });

  it("rejects a protected clause, keeps the rest and keeps parsing", () => {
    const result = parseFeedPreferenceRules("female React developer, 2 years");

    expect(result.criteria.map((criterion) => criterion.id)).toEqual([
      "skill:react",
      "experience:react:2",
    ]);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].text.toLowerCase()).toContain("female");
    expect(result.rejected[0].reason).toMatch(/protected/i);
    expect(result.rejected[0].reason).not.toContain("\n");
  });

  it("covers age proxies, nationality and ethnicity without dropping the rest", () => {
    const result = parseFeedPreferenceRules(
      "under 30, senior, native English speaker, Indian, TypeScript",
    );

    expect(result.rejected.length).toBeGreaterThanOrEqual(4);
    expect(result.criteria.map((criterion) => criterion.id)).toContain("skill:typescript");
    expect(result.criteria.some((criterion) => criterion.kind === "EXPERIENCE")).toBe(false);
    for (const rejection of result.rejected) {
      expect(rejection.reason).toMatch(/protected/i);
      expect(rejection.reason).not.toContain("\n");
    }
  });

  it("dedupes criteria and keeps an unattached experience phrase generic", () => {
    const deduped = parseFeedPreferenceRules("React, React.js, at least 3 years");
    expect(deduped.criteria.map((criterion) => criterion.id)).toEqual([
      "skill:react",
      "experience:react:3",
    ]);

    const generic = parseFeedPreferenceRules("at least 3 years");
    expect(generic.criteria).toHaveLength(1);
    expect(generic.criteria[0]).toMatchObject({
      id: "experience:general:3",
      kind: "EXPERIENCE",
      years: 3,
      value: "experience",
    });
    expect(generic.criteria[0].skill).toBeUndefined();
  });

  it("returns meaningful leftover terms in unparsed", () => {
    const result = parseFeedPreferenceRules("React, public speaking");

    expect(result.criteria.map((criterion) => criterion.id)).toEqual(["skill:react"]);
    expect(result.unparsed.join(" ")).toMatch(/public speaking/);
  });

  it("maps domain aliases and prefers a domain when the word has domain context", () => {
    const healthcare = parseFeedPreferenceRules("healthcare background");
    expect(healthcare.criteria).toHaveLength(1);
    expect(healthcare.criteria[0]).toMatchObject({ kind: "DOMAIN", id: "domain:healthcare" });

    // "community" is both a skill and a domain; "background" makes the domain
    // reading explicit, so it is not also reported as a skill.
    const community = parseFeedPreferenceRules("community background");
    expect(community.criteria).toHaveLength(1);
    expect(community.criteria[0]).toMatchObject({
      kind: "DOMAIN",
      value: "community",
    });
  });
});

// ---------------------------------------------------------------------------
// Matcher
// ---------------------------------------------------------------------------

describe("matchCandidates", () => {
  it("matches an exact dated candidate through all three criteria", () => {
    const noor = makeCandidate("noor", [
      makeFact("noor-role", "Built a React dashboard for a fintech client.", {
        skillTags: ["React", "Design systems"],
        meta: {
          module: "ROLE",
          title: "Frontend engineer",
          organisation: "Fintech client",
          start: "2022-01",
          end: "2023-06",
          skills: ["React"],
          domain: ["finance"],
        },
      }),
      makeFact("noor-project", "Shipped a React checkout flow.", {
        skillTags: ["React"],
        meta: {
          module: "PROJECT",
          title: "Checkout flow",
          start: "2023-03",
          end: "2024-01",
          skills: ["React"],
          domain: ["payments"],
        },
      }),
    ]);

    const [match] = matchCandidates(
      [noor],
      criteriaFor("React, at least 2 years, finance background"),
    );

    expect(match.state).toBe("in_feed");
    expect(match.inFeed).toBe(true);
    expect(match.criteria.map((criterion) => criterion.status)).toEqual([
      "exact",
      "exact",
      "exact",
    ]);
    expect(match.criteria[0].factIds).toEqual(["noor-role", "noor-project"]);
    expect(match.criteria[1].countedMonths).toBe(24);
    expect(match.criteria[1].explanation).toMatch(/merged/i);
    expect(match.criteria[2].factIds).toEqual(["noor-role", "noor-project"]);
  });

  it("marks a Vue candidate as related to React, never exact", () => {
    const vue = makeCandidate("vue", [
      makeFact("vue-role", "Built Vue dashboards.", {
        skillTags: ["Vue"],
        meta: {
          module: "ROLE",
          title: "Frontend developer",
          start: "2021-01",
          end: "2024-01",
          skills: ["Vue"],
        },
      }),
    ]);

    const [match] = matchCandidates([vue], criteriaFor("React, at least 2 years"));

    expect(match.criteria.map((criterion) => criterion.status)).toEqual(["related", "related"]);
    expect(match.criteria[0].relatedSkill).toBe("Vue");
    expect(match.criteria[1].relatedSkill).toBe("Vue");
    expect(match.criteria[1].countedMonths).toBe(36);
    expect(match.criteria[1].explanation).toContain("Vue, 3 years - related to React");
    expect(match.criteria.every((criterion) => criterion.status !== "exact")).toBe(true);
    expect(match.inFeed).toBe(true);
    expect(match.hasRelated).toBe(true);
    expect(RELATED_SKILLS.React).toContain("Vue");
  });

  it("leaves a candidate with no relevant evidence unknown", () => {
    const blank = makeCandidate("blank", [
      makeFact("blank-role", "Ran the events programme.", {
        skillTags: ["Events"],
        meta: { module: "ROLE", title: "Events lead", start: "2020-01", end: "2020-06" },
      }),
    ]);

    const [match] = matchCandidates(
      [blank],
      criteriaFor("React, at least 2 years, finance background"),
    );

    expect(match.criteria.map((criterion) => criterion.status)).toEqual([
      "unknown",
      "unknown",
      "unknown",
    ]);
    expect(match.state).toBe("not_stated");
    expect(match.inFeed).toBe(false);
    expect(match.hasUnknown).toBe(true);
    expect(match.hasNotMet).toBe(false);
  });

  it("treats an undated mention as uncertain experience", () => {
    const undated = makeCandidate("undated", [
      makeFact("undated-1", "I used React on a side project.", { skillTags: ["Frontend"] }),
    ]);

    const [match] = matchCandidates([undated], criteriaFor("React, at least 2 years"));

    expect(match.criteria[0].status).toBe("unknown");
    expect(match.criteria[1].status).toBe("uncertain");
    expect(match.criteria[1].explanation).toMatch(/no dated/i);
    expect(match.state).toBe("not_stated");
  });

  it("reports self-described years separately and never silently meets the bar", () => {
    const claimOnly = makeCandidate("claim-only", [
      makeFact("claim-1", "I have 4 years of React experience.", { skillTags: ["React"] }),
    ]);

    const [match] = matchCandidates([claimOnly], criteriaFor("React, at least 2 years"));
    const experience = match.criteria[1];

    expect(match.criteria[0].status).toBe("exact");
    expect(experience.status).toBe("uncertain");
    expect(experience.selfDescribedYears).toBe(4);
    expect(experience.explanation).toMatch(/self-described/i);
    expect(experience.explanation).toMatch(/not counted/i);
    expect(match.state).toBe("not_stated");
  });

  it("treats self-described years below the bar as not met", () => {
    const belowClaim = makeCandidate("below-claim", [
      makeFact("below-claim-1", "1 year of React.", { skillTags: ["React"] }),
    ]);

    const [match] = matchCandidates([belowClaim], criteriaFor("React, at least 2 years"));

    expect(match.criteria[1].status).toBe("not_met");
    expect(match.criteria[1].selfDescribedYears).toBe(1);
    expect(match.state).toBe("outside");
  });

  it("does not let related months rescue dated months below the bar", () => {
    const underBar = makeCandidate("under-bar", [
      makeFact("underbar-react", "React dashboards.", {
        skillTags: ["React"],
        meta: {
          module: "ROLE",
          title: "React developer",
          start: "2023-01",
          end: "2023-10",
          skills: ["React"],
        },
      }),
      makeFact("underbar-vue", "Vue work.", {
        skillTags: ["Vue"],
        meta: {
          module: "ROLE",
          title: "Vue developer",
          start: "2021-01",
          end: "2024-01",
          skills: ["Vue"],
        },
      }),
    ]);

    const [match] = matchCandidates([underBar], criteriaFor("React, at least 2 years"));
    const experience = match.criteria[1];

    expect(experience.status).toBe("not_met");
    expect(experience.countedMonths).toBe(9);
    expect(experience.explanation).toContain("Vue, 3 years - related to React");
    expect(match.state).toBe("outside");
    expect(match.hasNotMet).toBe(true);
    expect(match.inFeed).toBe(false);
  });

  it("merges overlapping role and project intervals before summing months", () => {
    const overlap = makeCandidate("overlap", [
      makeFact("overlap-a", "React role.", {
        skillTags: ["React"],
        meta: {
          module: "ROLE",
          title: "First role",
          start: "2022-01",
          end: "2023-01",
          skills: ["React"],
        },
      }),
      makeFact("overlap-b", "React project.", {
        skillTags: ["React"],
        meta: {
          module: "PROJECT",
          title: "Second project",
          start: "2022-07",
          end: "2023-07",
          skills: ["React"],
        },
      }),
    ]);

    const [match] = matchCandidates([overlap], criteriaFor("React, at least 2 years"));
    const experience = match.criteria[1];

    // 12 + 12 raw months, 6 overlapping months: a naive sum would wrongly pass.
    expect(experience.countedMonths).toBe(18);
    expect(experience.status).toBe("not_met");
    expect(experience.explanation).toMatch(/merged/i);
  });

  it("never counts a role that mentions React unless meta.skills includes it", () => {
    const mentionOnly = makeCandidate("mention-only", [
      makeFact("mention-only-1", "React developer on a two-year contract.", {
        skillTags: ["React"],
        meta: {
          module: "ROLE",
          title: "React developer",
          start: "2020-01",
          end: "2022-01",
        },
      }),
    ]);

    const [match] = matchCandidates([mentionOnly], criteriaFor("React, at least 2 years"));
    const experience = match.criteria[1];

    expect(experience.status).toBe("uncertain");
    expect(experience.countedMonths).toBeUndefined();
    expect(experience.explanation).toMatch(/no dated/i);
  });

  it("never infers from name, headline, location, bio, monogram or candidate tags", () => {
    const disguised = makeCandidate(
      "disguised",
      [makeFact("disguised-1", "Ran the events programme.", { skillTags: ["Events"] })],
      {
        name: "React Expert",
        headline: "React developer",
        location: "React City",
        bio: "React expert.",
        monogram: "RX",
        tags: ["React", "React.js"],
      },
    );
    const [disguisedMatch] = matchCandidates([disguised], criteriaFor("React"));
    expect(disguisedMatch.criteria[0].status).toBe("unknown");

    const evidence = makeCandidate("evidence", [
      makeFact("evidence-1", "Built a React dashboard.", { skillTags: ["React"] }),
    ]);
    const renamed: CandidateDetail = {
      ...evidence,
      name: "Someone Else",
      headline: "Unrelated headline",
      location: "Somewhere Else",
      bio: "A different bio.",
      monogram: "ZZ",
      palette: "slate",
      tags: ["React", "TypeScript"],
    };
    const criteria = criteriaFor("React, at least 2 years, finance background");
    expect(matchCandidates([renamed], criteria)).toEqual(matchCandidates([evidence], criteria));
  });

  it("matches domains only from metadata or an explicit claim, never from tags", () => {
    const criteria = criteriaFor("finance background");

    const claimCandidate = makeCandidate("claim-domain", [
      makeFact("claim-domain-1", "Built payments infrastructure.", {}),
    ]);
    const metaCandidate = makeCandidate("meta-domain", [
      makeFact("meta-domain-1", "Built dashboards.", { meta: { domain: ["fintech"] } }),
    ]);
    const tagOnly = makeCandidate("tag-domain", [
      makeFact("tag-domain-1", "Built dashboards.", { skillTags: ["Finance"] }),
    ]);

    expect(matchCandidates([claimCandidate], criteria)[0].criteria[0].status).toBe("exact");
    expect(matchCandidates([metaCandidate], criteria)[0].criteria[0].status).toBe("exact");

    const tagMatch = matchCandidates([tagOnly], criteria)[0].criteria[0];
    expect(tagMatch.status).toBe("unknown");
    expect(tagMatch.explanation).toMatch(/does not infer/i);
  });
});

describe("pickCriterionToBroaden", () => {
  const react: FeedCriterion = {
    id: "skill:react",
    kind: "SKILL",
    label: "React",
    value: "React",
    skill: "React",
  };
  const finance: FeedCriterion = {
    id: "domain:finance",
    kind: "DOMAIN",
    label: "Finance",
    value: "finance",
  };

  function makeMatch(
    candidateId: string,
    statuses: ReadonlyArray<readonly [FeedCriterion, FeedCriterionStatus]>,
  ): CandidateFeedMatch {
    const criteria = statuses.map(([criterion, status]) => ({
      criterion,
      status,
      factIds: [],
      explanation: "",
    }));
    const hasNotMet = criteria.some((entry) => entry.status === "not_met");
    const hasUnknown = criteria.some(
      (entry) => entry.status === "unknown" || entry.status === "uncertain",
    );
    const hasRelated = criteria.some((entry) => entry.status === "related");
    const state = hasNotMet ? "outside" : hasUnknown ? "not_stated" : "in_feed";
    return {
      candidateId,
      criteria,
      state,
      inFeed: state === "in_feed",
      hasNotMet,
      hasUnknown,
      hasRelated,
    };
  }

  it("picks the criterion that removes the most candidates", () => {
    expect(
      pickCriterionToBroaden([
        makeMatch("c1", [
          [react, "not_met"],
          [finance, "exact"],
        ]),
        makeMatch("c2", [
          [react, "not_met"],
          [finance, "exact"],
        ]),
        makeMatch("c3", [
          [react, "exact"],
          [finance, "not_met"],
        ]),
      ]),
    ).toBe("skill:react");
  });

  it("breaks a tie toward the last criterion seen and returns null when nothing is outside", () => {
    expect(
      pickCriterionToBroaden([
        makeMatch("c1", [
          [react, "not_met"],
          [finance, "exact"],
        ]),
        makeMatch("c2", [
          [react, "exact"],
          [finance, "not_met"],
        ]),
      ]),
    ).toBe("domain:finance");

    expect(
      pickCriterionToBroaden([
        makeMatch("c1", [
          [react, "exact"],
          [finance, "unknown"],
        ]),
      ]),
    ).toBeNull();
  });
});
