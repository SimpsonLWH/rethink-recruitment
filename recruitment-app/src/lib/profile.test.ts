import { describe, expect, it } from "vitest";
import type { CandidateDetail, FactView } from "@/lib/repo/types";
import type { ReviewModule } from "./profile";
import { REVIEW_MODULE_KIND_LABEL, buildReviewModules, reviewModuleKindLabel } from "./profile";

function makeFact(overrides: Partial<FactView> & Pick<FactView, "id" | "claim">): FactView {
  return {
    prompt: "",
    skillTags: [],
    meta: {},
    evidenceUrl: null,
    provenance: "SELF_CLAIMED",
    confirmedByEmployerName: null,
    origin: "MANUAL",
    order: 0,
    linkStatus: null,
    ...overrides,
  };
}

function makeCandidate(facts: FactView[]): CandidateDetail {
  return {
    id: "candidate-1",
    slug: "candidate-1",
    name: "Test Candidate",
    headline: "Product engineer",
    location: "Helsinki",
    bio: "A small candidate fixture for the review-card builder.",
    monogram: "TC",
    palette: "sage",
    tags: [],
    order: 1,
    facts,
  };
}

function moduleOfKind(modules: ReviewModule[], kind: ReviewModule["kind"]): ReviewModule | undefined {
  return modules.find((module) => module.kind === kind);
}

function sourceFactIds(modules: ReviewModule[]): string[] {
  const ids: string[] = [];
  for (const reviewModule of modules) {
    ids.push(...reviewModule.factIds);
    if (reviewModule.kind === "timeline") ids.push(...reviewModule.entries.map((entry) => entry.factId));
    if (reviewModule.kind === "skills") {
      for (const skill of reviewModule.skills) ids.push(...skill.factIds);
    }
  }
  return ids;
}

function expectKnownFactIds(modules: ReviewModule[], facts: FactView[]): void {
  const known = new Set(facts.map((fact) => fact.id));
  for (const id of sourceFactIds(modules)) {
    expect(known.has(id), "module references unknown fact " + id).toBe(true);
  }
}

const portfolioFacts: FactView[] = [
  makeFact({
    id: "fact-achievement",
    prompt: "The hardest problem I've solved",
    claim:
      "Our design system had fourteen shades of grey, so I wrote contribution rules and cut hard-coded colours in the storefront by 90%.",
    skillTags: ["Design systems", "Frontend"],
    meta: {
      module: "ACHIEVEMENT",
      title: "Design-system audit",
      stat: "90%",
      context: "fewer hard-coded colours in the storefront after a design-system audit",
    },
    provenance: "EMPLOYER_CONFIRMED",
    confirmedByEmployerName: "Lumen Retail",
  }),
  makeFact({
    id: "fact-project",
    prompt: "A project I'm proud of",
    claim:
      "I rebuilt the returns flow so a first-time shopper could finish it without contacting support.",
    skillTags: ["Product engineering", "Accessibility"],
    meta: {
      module: "PROJECT",
      title: "Returns flow rebuild",
      organisation: "Lumen Retail",
      image: "/demo/returns-flow.svg",
      start: "2024-03",
      end: "2025-09",
    },
    evidenceUrl: "https://example.com/?evidence=aino-returns",
  }),
  makeFact({
    id: "fact-role",
    prompt: "Work history",
    claim: "Contract frontend engineer on the returns and checkout flows, 2024-2025.",
    skillTags: ["Contract", "Retail"],
    meta: {
      module: "ROLE",
      title: "Contract frontend engineer",
      organisation: "Lumen Retail",
      start: "2024-03",
      end: "2025-09",
      skills: ["React", "TypeScript"],
    },
    provenance: "EMPLOYER_CONFIRMED",
    confirmedByEmployerName: "Lumen Retail",
  }),
  makeFact({
    id: "fact-skills",
    prompt: "The tools I reach for",
    claim: "I build interfaces with TypeScript and React.",
    skillTags: ["react", "Design systems"],
    meta: { skills: ["React", "Design systems"] },
  }),
];

const nonPortfolioFacts: FactView[] = [
  makeFact({
    id: "fact-result",
    prompt: "A result I'm proud of",
    claim: "The invoice-matching migration cut annual support costs by 40,000 euros.",
    meta: { module: "RESULT", title: "Invoice-matching migration" },
  }),
  makeFact({
    id: "fact-responsibility",
    prompt: "A responsibility I held",
    claim: "I owned the on-call rotation and the incident review every Friday.",
    meta: { module: "RESPONSIBILITY", title: "On-call ownership" },
  }),
  makeFact({
    id: "fact-availability",
    prompt: "What I'm looking for",
    claim: "I am available from March and looking for a four-day week.",
    meta: { module: "AVAILABILITY", title: "Looking for" },
  }),
  makeFact({
    id: "fact-project-no-image",
    prompt: "Something I made",
    claim: "I shipped an internal tool for the support team.",
    meta: { module: "PROJECT", title: "Internal tool" },
  }),
];

describe("rich portfolio review modules", () => {
  it("builds achievement, project, timeline and skills modules from FactMeta", () => {
    const candidate = makeCandidate(portfolioFacts);
    const modules = buildReviewModules(candidate);

    expect(modules.length).toBeLessThanOrEqual(4);
    expect(modules.map((module) => module.kind)).toEqual(["achievement", "project", "timeline", "skills"]);
    expectKnownFactIds(modules, portfolioFacts);

    const achievement = moduleOfKind(modules, "achievement");
    if (!achievement || achievement.kind !== "achievement") throw new Error("expected achievement module");
    expect(achievement.title).toBe("Design-system audit");
    expect(achievement.stat).toBe("90%");
    expect(achievement.context).toContain("design-system audit");
    expect(achievement.factIds).toEqual(["fact-achievement"]);
    expect(achievement.provenance).toBe("EMPLOYER_CONFIRMED");

    const project = moduleOfKind(modules, "project");
    if (!project || project.kind !== "project") throw new Error("expected project module");
    expect(project.title).toBe("Returns flow rebuild");
    expect(project.image).toBe("/demo/returns-flow.svg");
    expect(project.link).toBe("https://example.com/?evidence=aino-returns");
    expect(project.organisation).toBe("Lumen Retail");
    expect(project.start).toBe("2024-03");
    expect(project.end).toBe("2025-09");
    expect(project.factIds).toEqual(["fact-project"]);
    expect(project.provenance).toBe("SELF_CLAIMED");

    const timeline = moduleOfKind(modules, "timeline");
    if (!timeline || timeline.kind !== "timeline") throw new Error("expected timeline module");
    expect(timeline.entries).toHaveLength(1);
    expect(timeline.entries[0]).toMatchObject({
      factId: "fact-role",
      title: "Contract frontend engineer",
      organisation: "Lumen Retail",
      start: "2024-03",
      end: "2025-09",
      provenance: "EMPLOYER_CONFIRMED",
    });
    expect(timeline.provenance).toBe("EMPLOYER_CONFIRMED");

    const skills = moduleOfKind(modules, "skills");
    if (!skills || skills.kind !== "skills") throw new Error("expected skills module");
    const names = skills.skills.map((skill) => skill.name.toLowerCase());
    expect(names).toContain("react");
    expect(names).toContain("typescript");
    expect(names).toContain("design systems");
    expect(new Set(names).size).toBe(names.length);
    const react = skills.skills.find((skill) => skill.name.toLowerCase() === "react");
    expect(react?.months).toBe(18);
    expect(react?.factIds.length).toBe(2);
    expect(skills.provenance).toBe("SELF_CLAIMED");
  });
});

describe("non-portfolio review modules", () => {
  it("keeps result, responsibility and availability text modules and never invents an image", () => {
    const candidate = makeCandidate(nonPortfolioFacts);
    const modules = buildReviewModules(candidate);
    const kinds = modules.map((module) => module.kind);

    expect(kinds).toContain("result");
    expect(kinds).toContain("responsibility");
    expect(kinds).toContain("availability");
    expect(kinds).not.toContain("achievement");
    expect(kinds).not.toContain("timeline");
    expect(kinds).not.toContain("skills");

    const project = moduleOfKind(modules, "project");
    if (!project || project.kind !== "project") throw new Error("expected project module");
    expect(project.image).toBeNull();
    expect(project.link).toBeNull();
    expect(project.start).toBeUndefined();
    expect(project.end).toBeUndefined();
    expect(JSON.stringify(modules)).not.toMatch(/placeholder/i);

    const result = moduleOfKind(modules, "result");
    if (!result || result.kind !== "result") throw new Error("expected result module");
    expect(result.body).toBe(nonPortfolioFacts[0].claim);
    expect(result.metaTitle).toBe("Invoice-matching migration");
    expect(result.factIds).toEqual(["fact-result"]);
    expect(result.provenance).toBe("SELF_CLAIMED");
    expectKnownFactIds(modules, nonPortfolioFacts);
  });

  it("only shows a project image that is a non-empty, non-placeholder string", () => {
    const blank = buildReviewModules(
      makeCandidate([
        makeFact({
          id: "fact-blank-image",
          claim: "I shipped an internal tool.",
          meta: { module: "PROJECT", title: "Internal tool", image: "   " },
        }),
      ]),
    );
    const blankProject = moduleOfKind(blank, "project");
    if (!blankProject || blankProject.kind !== "project") throw new Error("expected project module");
    expect(blankProject.image).toBeNull();

    const placeholder = buildReviewModules(
      makeCandidate([
        makeFact({
          id: "fact-placeholder-image",
          claim: "I shipped an internal tool.",
          meta: { module: "PROJECT", title: "Internal tool", image: "/images/placeholder.png" },
        }),
      ]),
    );
    const placeholderProject = moduleOfKind(placeholder, "project");
    if (!placeholderProject || placeholderProject.kind !== "project") throw new Error("expected project module");
    expect(placeholderProject.image).toBeNull();
  });
});

describe("candidates without FactMeta", () => {
  it("infers kinds from prompt and claim", () => {
    const facts: FactView[] = [
      makeFact({ id: "inf-availability", prompt: "My ideal team", claim: "People who argue about the problem before the solution." }),
      makeFact({ id: "inf-qualification", prompt: "A qualification", claim: "BSc in Computer Science from a small university." }),
      makeFact({ id: "inf-responsibility", prompt: "The hardest problem I've solved", claim: "A delivery went missing and I rebuilt the stock count." }),
      makeFact({ id: "inf-project", prompt: "Something I'm proud of", claim: "I shipped a volunteer shift planner." }),
      makeFact({ id: "inf-result", prompt: "What changed because of you?", claim: "Support retention improved across the quarter." }),
      makeFact({
        id: "inf-role",
        prompt: "Work history",
        claim: "Frontend developer at a regional logistics operator from 2019 to 2022.",
        meta: { start: "2019-01", end: "2022-01" },
      }),
    ];
    const modules = buildReviewModules(makeCandidate(facts), 8);
    const kinds = modules.map((module) => module.kind);

    expect(kinds).toContain("availability");
    expect(kinds).toContain("qualification");
    expect(kinds).toContain("responsibility");
    expect(kinds).toContain("project");
    expect(kinds).toContain("result");
    expect(kinds).toContain("timeline");
    expectKnownFactIds(modules, facts);

    const timeline = moduleOfKind(modules, "timeline");
    if (!timeline || timeline.kind !== "timeline") throw new Error("expected timeline module");
    expect(timeline.entries[0]).toMatchObject({ factId: "inf-role", start: "2019-01", end: "2022-01" });
  });

  it("always yields at least one module without inventing dates, images or claims", () => {
    const facts: FactView[] = [
      makeFact({ id: "fact-generic", prompt: "What should we know?", claim: "I care about accessible interfaces and careful copy." }),
      makeFact({ id: "fact-numeric", prompt: "What changed because of you?", claim: "I cut onboarding time by 3 days." }),
      makeFact({ id: "fact-looking", prompt: "What I'm looking for", claim: "I want a team that argues about the problem first." }),
      makeFact({ id: "fact-dateless-role", prompt: "Work history", claim: "I was a product engineer at several studios." }),
    ];
    const modules = buildReviewModules(makeCandidate(facts));

    expect(modules.length).toBeGreaterThanOrEqual(1);
    expect(modules.map((module) => module.kind)).not.toContain("timeline");
    expect(modules.map((module) => module.kind)).not.toContain("project");
    expectKnownFactIds(modules, facts);

    const serialized = JSON.stringify(modules);
    expect(serialized).not.toMatch(/"image"/);
    expect(serialized).not.toMatch(/"start"/);
    expect(serialized).not.toMatch(/"end"/);
    expect(serialized).not.toMatch(/placeholder/i);
    expect(serialized).not.toMatch(/Present/);

    const achievement = moduleOfKind(modules, "achievement");
    if (!achievement || achievement.kind !== "achievement") throw new Error("expected inferred achievement module");
    expect(achievement.stat).toBe("3 days");
    expect(achievement.factIds).toEqual(["fact-numeric"]);
  });

  it("returns a single plain fact module when the only fact is a claim", () => {
    const fact = makeFact({ id: "fact-only", claim: "I care about careful copy." });
    const modules = buildReviewModules(makeCandidate([fact]));

    expect(modules).toHaveLength(1);
    expect(modules[0].kind).toBe("fact");
    expect(modules[0].title).toBe(REVIEW_MODULE_KIND_LABEL.fact);
    expect(modules[0].factIds).toEqual(["fact-only"]);
    expect(modules[0].provenance).toBe("SELF_CLAIMED");
    if (modules[0].kind !== "fact") throw new Error("expected fact module");
    expect(modules[0].body).toBe("I care about careful copy.");
  });
});

describe("limits, provenance and ordering", () => {
  it("respects the max parameter and floors it", () => {
    const candidate = makeCandidate(portfolioFacts);

    expect(buildReviewModules(candidate, 1)).toHaveLength(1);
    expect(buildReviewModules(candidate, 2).map((module) => module.kind)).toEqual(["achievement", "project"]);
    expect(buildReviewModules(candidate, 2.9)).toHaveLength(2);
    expect(buildReviewModules(candidate, 0)).toEqual([]);
    expect(buildReviewModules(candidate, -3)).toEqual([]);
    expect(buildReviewModules(candidate)).toHaveLength(4);
  });

  it("preserves the provenance of every source fact", () => {
    const modules = buildReviewModules(makeCandidate(portfolioFacts));

    const achievement = moduleOfKind(modules, "achievement");
    if (!achievement || achievement.kind !== "achievement") throw new Error("expected achievement module");
    expect(achievement.provenance).toBe("EMPLOYER_CONFIRMED");

    const project = moduleOfKind(modules, "project");
    if (!project || project.kind !== "project") throw new Error("expected project module");
    expect(project.provenance).toBe("SELF_CLAIMED");

    const timeline = moduleOfKind(modules, "timeline");
    if (!timeline || timeline.kind !== "timeline") throw new Error("expected timeline module");
    expect(timeline.entries.every((entry) => entry.provenance === "EMPLOYER_CONFIRMED")).toBe(true);

    const selfClaimed = buildReviewModules(
      makeCandidate([
        makeFact({
          id: "fact-self",
          claim: "I shipped a small tool.",
          meta: { module: "PROJECT", title: "Small tool" },
        }),
      ]),
    );
    expect(selfClaimed[0].provenance).toBe("SELF_CLAIMED");
  });

  it("sorts dated roles newest first and leaves an open-ended role null", () => {
    const facts: FactView[] = [
      makeFact({
        id: "role-older",
        prompt: "Work history",
        claim: "Frontend developer at an agency, 2017-2020.",
        meta: {
          module: "ROLE",
          title: "Frontend developer",
          organisation: "An agency",
          start: "2017-05",
          end: "2020-05",
        },
      }),
      makeFact({
        id: "role-newer",
        prompt: "Work history",
        claim: "Staff engineer at Northwind Labs from 2022.",
        meta: {
          module: "ROLE",
          title: "Staff engineer",
          organisation: "Northwind Labs",
          start: "2022-01",
        },
      }),
    ];
    const modules = buildReviewModules(makeCandidate(facts));
    const timeline = moduleOfKind(modules, "timeline");
    if (!timeline || timeline.kind !== "timeline") throw new Error("expected timeline module");

    expect(timeline.entries.map((entry) => entry.start)).toEqual(["2022-01", "2017-05"]);
    expect(timeline.entries[0].end).toBeNull();
    expect(timeline.entries[0].organisation).toBe("Northwind Labs");
    expect(timeline.entries[1].end).toBe("2020-05");
    expect(timeline.factIds).toEqual(["role-newer", "role-older"]);
  });

  it("omits the timeline module when no role has a month start", () => {
    const modules = buildReviewModules(
      makeCandidate([
        makeFact({
          id: "role-undated",
          prompt: "Work history",
          claim: "I was a product engineer at several studios.",
          meta: { module: "ROLE", title: "Product engineer" },
        }),
      ]),
    );
    expect(modules.map((module) => module.kind)).not.toContain("timeline");
    expect(modules.length).toBeGreaterThanOrEqual(1);
    expect(modules[0].kind).toBe("fact");
  });
});

describe("skills module", () => {
  it("needs at least two skills", () => {
    const modules = buildReviewModules(
      makeCandidate([
        makeFact({ id: "one-skill", claim: "I use TypeScript.", skillTags: ["TypeScript"] }),
      ]),
    );
    expect(modules.map((module) => module.kind)).not.toContain("skills");
    expect(modules.length).toBeGreaterThanOrEqual(1);
  });

  it("dedupes case-insensitively and caps the list at eight", () => {
    const modules = buildReviewModules(
      makeCandidate([
        makeFact({
          id: "many-skills",
          claim: "I work across the stack.",
          skillTags: ["TypeScript", "typescript", "Node", "SQL", "Docker", "AWS", "GraphQL", "CI", "Testing"],
          meta: { skills: ["React", "Design systems"] },
        }),
      ]),
    );
    const skills = moduleOfKind(modules, "skills");
    if (!skills || skills.kind !== "skills") throw new Error("expected skills module");

    expect(skills.skills).toHaveLength(8);
    const names = skills.skills.map((skill) => skill.name.toLowerCase());
    expect(new Set(names).size).toBe(8);
    expect(names.filter((name) => name === "typescript")).toHaveLength(1);
    expect(names).not.toContain("testing");
    expect(skills.skills.every((skill) => skill.months === undefined)).toBe(true);
  });
});

describe("kind labels", () => {
  it("exports stable labels for every module kind", () => {
    expect(reviewModuleKindLabel("achievement")).toBe("Achievement");
    expect(reviewModuleKindLabel("project")).toBe("Project");
    expect(reviewModuleKindLabel("timeline")).toBe("Work history");
    expect(reviewModuleKindLabel("skills")).toBe("Skills");
    expect(reviewModuleKindLabel("fact")).toBe("Fact");
    expect(Object.keys(REVIEW_MODULE_KIND_LABEL)).toHaveLength(9);
  });
});
