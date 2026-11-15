import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { actionCountsAsYes, canCreateMatch, canUseLike, canUsePriorityIntro, remainingLikes, remainingPriorityIntros } from "@/lib/matching";
import { parseFactMeta } from "@/lib/fact-meta";
import {
  attemptState,
  isProctoringMode,
  parseIntegritySummary,
  parseProblemBank,
  publicProblems,
  summariseIntegrity,
  type IntegrityReport,
  type OaMarking,
  type ProblemMark,
} from "@/lib/assessments";
import { checkExamples, markSubmissions } from "@/lib/oa-marking";
import { composeFeed } from "@/lib/feed-composition";
import { outcomeForConversation, outcomeForPass, outcomeForRoleClose } from "@/lib/outcomes";
import { profileCompletion } from "@/lib/profile-completion";
import { availableStages, isMatchStage, type MatchStage } from "@/lib/stages";
import {
  DECISION_LABEL,
  buildInterviewKit,
  decisionBasis,
  deriveScreeningPlan,
  evaluateClaims,
  evaluateCriteria,
  isScreeningCriterion,
  parseClaimChecks,
  parseCriterionChecks,
  parseScreeningNotes,
  parseScreeningPlan,
  serializeScreeningPlan,
  summariseClaims,
  summarisePacket,
  validateScreeningDecision,
  type ClaimInput,
  type CriterionCheck,
  type ScreeningCriterion,
  type ScreeningDecision,
} from "@/lib/screening";
import { unsafeRoleSignal } from "@/lib/role-card-templates";
import { matchCandidates, type FeedCriterion } from "@/lib/feed";
import {
  RepositoryError,
  type AccountRecord,
  type AiRunView,
  type AssessmentAttemptView,
  type AssessmentEvidence,
  type AssessmentFeedState,
  type AssessmentResultView,
  type AssessmentSubmissionView,
  type AssessmentSummary,
  type CandidateCvInput,
  type CandidateDetail,
  type CandidateFeed,
  type CandidateFeedCard,
  type CandidateSummary,
  type CandidateUpdate,
  type CreateAccountInput,
  type DecisionAction,
  type DecisionResult,
  type DecisionSource,
  type EmployerBrief,
  type EmployerDetail,
  type EmployerFeed,
  type EmployerFeedCard,
  type EmployerReview,
  type EventView,
  type FactView,
  type FitInputs,
  type FitSeedRow,
  type FitSummaryView,
  type FitTheme,
  type InterestState,
  type InvitationInput,
  type InvitationView,
  type LinkCheckView,
  type LinkStatus,
  type MatchDetail,
  type MatchSummary,
  type MessageView,
  type NavCounts,
  type NewFactInput,
  type OutcomeView,
  type PersonaSide,
  type PriorityIntroInboxItem,
  type PriorityIntroState,
  type Provenance,
  type RecruitmentRepository,
  type RoleAssessmentRequirement,
  type RoleCardInput,
  type RoleDetail,
  type RoleSignal,
  type RoleSummary,
  type ScreeningClaimInput,
  type ScreeningDecisionInput,
  type ScreeningDecisionRow,
  type ScreeningNoteInput,
  type ScreeningPacket,
  type ScreeningQueueItem,
  type ScreeningRoleSummary,
  type ScreeningRunView,
  type SignalMatch,
  type WorkSampleBreakdown,
  type TailorOption,
  type TailoringDraftView,
  type TailoringItemView,
} from "./types";

const factInclude = Prisma.validator<Prisma.FactInclude>()({
  linkCheck: true,
  confirmedByEmployer: { select: { name: true } },
});

const candidateInclude = Prisma.validator<Prisma.CandidateInclude>()({
  facts: {
    orderBy: { order: "asc" },
    include: factInclude,
  },
  assessmentAttempts: {
    orderBy: [{ submittedAt: "desc" }, { startedAt: "desc" }],
    include: { assessment: true },
  },
});


const screeningRunInclude = Prisma.validator<Prisma.ScreeningRunInclude>()({
  events: { orderBy: { createdAt: "asc" } },
});

type ScreeningRunPayload = Prisma.ScreeningRunGetPayload<{ include: typeof screeningRunInclude }>;

const roleInclude = Prisma.validator<Prisma.RoleInclude>()({
  employer: {
    include: { prompts: { orderBy: { order: "asc" } } },
  },
  assessment: true,
});

const employerInclude = Prisma.validator<Prisma.EmployerInclude>()({
  prompts: { orderBy: { order: "asc" } },
  roles: {
    orderBy: { order: "asc" },
    include: { assessment: true },
  },
});

type FactPayload = Prisma.FactGetPayload<{ include: typeof factInclude }>;
type CandidatePayload = Prisma.CandidateGetPayload<{ include: typeof candidateInclude }>;
type RolePayload = Prisma.RoleGetPayload<{ include: typeof roleInclude }>;
type EmployerPayload = Prisma.EmployerGetPayload<{ include: typeof employerInclude }>;

function parseTags(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    // Corrupt seed data should not take the app down.
  }
  return [];
}

function parseThemes(value: string): FitTheme[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is { theme: string; factIds: unknown } => Boolean(item) && typeof item === "object")
      .map((item) => ({
        theme: String((item as { theme?: unknown }).theme ?? ""),
        factIds: Array.isArray((item as { factIds?: unknown }).factIds)
          ? ((item as { factIds: unknown[] }).factIds.filter((id): id is string => typeof id === "string"))
          : [],
      }))
      .filter((theme) => theme.theme.length > 0);
  } catch {
    return [];
  }
}

function parseQuestions(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    // Ignore malformed local metadata.
  }
  return [];
}

function asProvenance(value: string): Provenance {
  return value === "EMPLOYER_CONFIRMED" ? "EMPLOYER_CONFIRMED" : "SELF_CLAIMED";
}

function asLinkStatus(value: string): LinkStatus {
  return value === "WORKS" ? "WORKS" : "UNREACHABLE";
}

function asDecisionAction(value: string): DecisionAction {
  return value === "PRIORITY_INTRO" ? "PRIORITY_INTRO" : value === "PASS" ? "PASS" : "LIKE";
}

function mapFact(fact: FactPayload): FactView {
  return {
    id: fact.id,
    prompt: fact.prompt,
    claim: fact.claim,
    skillTags: parseTags(fact.skillTagsJson),
    meta: parseFactMeta(fact.metaJson),
    evidenceUrl: fact.evidenceUrl,
    provenance: asProvenance(fact.provenance),
    confirmedByEmployerName: fact.confirmedByEmployer?.name ?? null,
    origin: fact.origin,
    order: fact.order,
    linkStatus: fact.linkCheck
      ? {
          status: asLinkStatus(fact.linkCheck.status),
          checkedAt: fact.linkCheck.checkedAt.toISOString(),
        }
      : null,
  };
}

export function mapCandidateSummary(candidate: {
  id: string;
  slug: string;
  name: string;
  headline: string;
  location: string;
  bio: string;
  monogram: string;
  palette: string;
  tagsJson: string;
  interestsJson: string;
  availability: string;
  discoveryOptIn: boolean;
  cvFileName: string | null;
  cvSource: string | null;
  cvUploadedAt: Date | null;
  order: number;
}): CandidateSummary {
  return {
    id: candidate.id,
    slug: candidate.slug,
    name: candidate.name,
    headline: candidate.headline,
    location: candidate.location,
    bio: candidate.bio,
    monogram: candidate.monogram,
    palette: candidate.palette,
    tags: parseTags(candidate.tagsJson),
    interests: parseTags(candidate.interestsJson),
    availability: candidate.availability,
    discoveryOptIn: candidate.discoveryOptIn,
    cvFileName: candidate.cvFileName,
    cvSource: candidate.cvSource,
    cvUploadedAt: candidate.cvUploadedAt?.toISOString() ?? null,
    order: candidate.order,
  };
}

function mapAssessmentSummary(assessment: {
  id: string;
  slug: string;
  title: string;
  roleFamily: string;
  family: string;
  version: string;
  difficulty: string;
  description: string;
  problemsJson?: string;
  problemCount?: number;
  playable: boolean;
  order: number;
  durationMinutes?: number;
  proctoring?: string;
  topicsJson?: string;
  topics?: unknown;
}): AssessmentSummary {
  const difficulty: AssessmentSummary["difficulty"] =
    assessment.difficulty === "EASY" || assessment.difficulty === "ADVANCED" ? assessment.difficulty : "MEDIUM";
  return {
    id: assessment.id,
    slug: assessment.slug,
    title: assessment.title,
    roleFamily: assessment.roleFamily,
    family: assessment.family,
    version: assessment.version,
    difficulty,
    description: assessment.description,
    playable: assessment.playable,
    problemCount:
      typeof assessment.problemCount === "number"
        ? assessment.problemCount
        : parseProblemBank(assessment.problemsJson).length,
    order: assessment.order,
    durationMinutes: typeof assessment.durationMinutes === "number" ? assessment.durationMinutes : 0,
    proctoring: isProctoringMode(assessment.proctoring) ? assessment.proctoring : "NONE",
    topics: parseTopics(assessment.topics ?? assessment.topicsJson),
  };
}

function parseTopics(value: unknown): string[] {
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return Array.isArray(raw) ? raw.filter((entry): entry is string => typeof entry === "string").slice(0, 6) : [];
}

function parseStoredMarking(value: string | null, fallbackScore: number | null): OaMarking | null {
  if (value) {
    try {
      const parsed = JSON.parse(value) as Partial<OaMarking>;
      if (
        typeof parsed.score === "number" &&
        typeof parsed.passedTests === "number" &&
        typeof parsed.totalTests === "number" &&
        Array.isArray(parsed.problems)
      ) {
        return {
          score: parsed.score,
          passedTests: parsed.passedTests,
          totalTests: parsed.totalTests,
          problems: parsed.problems,
        };
      }
    } catch {
      // Fall through to the stored score.
    }
  }
  if (fallbackScore === null) return null;
  return { score: fallbackScore, passedTests: 0, totalTests: 0, problems: [] };
}

function mapAssessmentResults(candidate: CandidatePayload): AssessmentResultView[] {
  const results: AssessmentResultView[] = [];
  for (const attempt of candidate.assessmentAttempts) {
    results.push({
      assessment: mapAssessmentSummary(attempt.assessment),
      score: attempt.submittedAt ? attempt.score : null,
      attemptCount: attempt.submittedAt ? 1 : 0,
      lastSubmittedAt: attempt.submittedAt?.toISOString() ?? null,
      attemptId: attempt.id,
      openAttemptId: attempt.submittedAt ? null : attempt.id,
      integrity: attempt.submittedAt ? parseIntegritySummary(attempt.integrityJson) : null,
    });
  }
  return results.sort((left, right) => left.assessment.order - right.assessment.order);
}

function mapCandidate(candidate: CandidatePayload): CandidateDetail {
  const summary = mapCandidateSummary(candidate);
  return {
    ...summary,
    facts: candidate.facts.map(mapFact),
    assessmentResults: mapAssessmentResults(candidate),
    profileCompletion: profileCompletion({
      headline: summary.headline,
      bio: summary.bio,
      interests: summary.interests,
      availability: summary.availability,
      facts: candidate.facts.map((fact) => ({ meta: parseFactMeta(fact.metaJson) })),
    }),
  };
}

function mapEmployerBrief(employer: {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  industry: string;
  teamSize: string;
  location: string;
  logoMark: string;
  palette: string;
  about: string;
  contactName: string;
}): EmployerBrief {
  return {
    id: employer.id,
    slug: employer.slug,
    name: employer.name,
    tagline: employer.tagline,
    industry: employer.industry,
    teamSize: employer.teamSize,
    location: employer.location,
    logoMark: employer.logoMark,
    palette: employer.palette,
    about: employer.about,
    contactName: employer.contactName,
  };
}

function parseSignals(value: string): RoleSignal[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({
        id: String(entry.id ?? ""),
        kind:
          entry.kind === "EXPERIENCE" || entry.kind === "DOMAIN"
            ? (entry.kind as RoleSignal["kind"])
            : ("SKILL" as const),
        label: String(entry.label ?? ""),
        value: String(entry.value ?? ""),
        years: typeof entry.years === "number" ? entry.years : undefined,
        skill: typeof entry.skill === "string" ? entry.skill : undefined,
      }))
      .filter((signal) => signal.id && signal.label && signal.value);
  } catch {
    return [];
  }
}

function parseRequirements(value: string): RoleAssessmentRequirement[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => {
        const assessment = entry.assessment;
        const summary =
          assessment && typeof assessment === "object"
            ? mapAssessmentSummary(assessment as Parameters<typeof mapAssessmentSummary>[0])
            : null;
        return {
          assessmentId: String(entry.assessmentId ?? summary?.id ?? ""),
          requiredScore: typeof entry.requiredScore === "number" ? entry.requiredScore : 0,
          assessment: summary,
        };
      })
      .filter((entry) => entry.assessmentId);
  } catch {
    return [];
  }
}

function mapRoleSummary(role: {
  id: string;
  slug: string;
  title: string;
  employmentType: string;
  workMode: string;
  location: string;
  summary: string;
  skillsJson: string;
  portfolioRequired: boolean;
  roleFamily: string;
  assessment: Parameters<typeof mapAssessmentSummary>[0] | null;
  requiredScore: number | null;
  requirementsJson: string;
  evidenceSignalsJson: string;
  screeningPlanJson: string;
  screeningPlanUpdatedAt?: Date | null;
  screeningPlanUpdatedBy?: string | null;
  screeningPlanVersion?: number;
  configStatus: string;
  reviewOwnerName: string | null;
  reviewDueHours: number;
  order: number;
}, employer: EmployerBrief): RoleSummary {
  const configStatus: RoleSummary["configStatus"] =
    role.configStatus === "LIVE" || role.configStatus === "CLOSED" ? role.configStatus : "DRAFT";
  const requirements = parseRequirements(role.requirementsJson);
  if (requirements.length === 0 && role.assessment && role.requiredScore !== null) {
    requirements.push({
      assessmentId: role.assessment.id,
      requiredScore: role.requiredScore,
      assessment: mapAssessmentSummary(role.assessment),
    });
  }
  return {
    id: role.id,
    slug: role.slug,
    title: role.title,
    employmentType: role.employmentType,
    workMode: role.workMode,
    location: role.location,
    summary: role.summary,
    skills: parseTags(role.skillsJson),
    portfolioRequired: role.portfolioRequired,
    roleFamily: role.roleFamily,
    assessment: role.assessment ? mapAssessmentSummary(role.assessment) : null,
    requiredScore: role.requiredScore,
    requirements,
    evidenceSignals: parseSignals(role.evidenceSignalsJson),
    screeningPlan: parseScreeningPlan(
      role.screeningPlanJson,
      deriveScreeningPlan({
        roleTitle: role.title,
        requirements,
        signals: parseSignals(role.evidenceSignalsJson),
      }),
    ),
    screeningPlanUpdatedAt: role.screeningPlanUpdatedAt?.toISOString() ?? null,
    screeningPlanUpdatedBy: role.screeningPlanUpdatedBy ?? null,
    screeningPlanVersion: role.screeningPlanVersion ?? 1,
    configStatus,
    reviewOwnerName: role.reviewOwnerName,
    reviewDueHours: role.reviewDueHours,
    order: role.order,
    employer,
  };
}

function mapRoleDetail(role: RolePayload): RoleDetail {
  const employer = mapEmployerBrief(role.employer);
  return {
    ...mapRoleSummary(role, employer),
    whyJoin: role.whyJoin,
    problemNow: role.problemNow,
    first90: role.first90,
    employerPrompts: role.employer.prompts.map((prompt) => ({
      prompt: prompt.prompt,
      answer: prompt.answer,
      order: prompt.order,
    })),
  };
}

function mapEmployer(employer: EmployerPayload): EmployerDetail {
  const brief = mapEmployerBrief(employer);
  return {
    ...brief,
    prompts: employer.prompts.map((prompt) => ({
      prompt: prompt.prompt,
      answer: prompt.answer,
      order: prompt.order,
    })),
    roles: employer.roles.map((role) => mapRoleSummary(role, brief)),
  };
}

function mapFit(fit: {
  digest: string;
  sharedThemesJson: string;
  questionsJson: string;
  evidenceCoverage: number;
  generatedBy: string;
}): FitSummaryView {
  return {
    digest: fit.digest,
    sharedThemes: parseThemes(fit.sharedThemesJson),
    questions: parseQuestions(fit.questionsJson),
    evidenceCoverage: fit.evidenceCoverage,
    generatedBy: fit.generatedBy,
  };
}

function mapMessage(message: { id: string; senderType: string; body: string; createdAt: Date }): MessageView {
  return {
    id: message.id,
    senderType: message.senderType === "CANDIDATE" ? "CANDIDATE" : "EMPLOYER",
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}

function mapOutcomeRow(
  outcome: {
    id: string;
    kind: string;
    message: string;
    deliveredAt: Date;
    roleId: string;
  },
  roleTitle: string,
  employerName: string,
  candidateName: string,
): OutcomeView {
  return {
    id: outcome.id,
    kind:
      outcome.kind === "ROLE_CLOSED" || outcome.kind === "AFTER_CONVERSATION"
        ? outcome.kind
        : "NOT_SELECTED",
    message: outcome.message,
    deliveredAt: outcome.deliveredAt.toISOString(),
    roleId: outcome.roleId,
    roleTitle,
    employerName,
    candidateName,
  };
}

function signalMatchesForRole(candidate: CandidateDetail, role: RoleDetail): SignalMatch[] {
  if (role.evidenceSignals.length === 0) return [];
  const criteria: FeedCriterion[] = role.evidenceSignals.map((signal) => ({
    id: signal.id,
    kind: signal.kind,
    label: signal.label,
    value: signal.value,
    years: signal.years,
    skill: signal.skill,
  }));
  const match = matchCandidates([candidate], criteria)[0];
  if (!match) return [];
  return match.criteria.map((entry) => ({
    signal: {
      id: entry.criterion.id,
      kind: entry.criterion.kind,
      label: entry.criterion.label,
      value: entry.criterion.value,
      years: entry.criterion.years,
      skill: entry.criterion.skill,
    },
    status: entry.status,
    factIds: entry.factIds,
    explanation: entry.explanation,
    countedMonths: entry.countedMonths,
  }));
}

function evidenceFor(candidate: CandidateDetail, role: RoleDetail): AssessmentEvidence | null {
  const requirements = role.requirements.filter(( requirement) => requirement.assessment);
  if (requirements.length === 0) return null;
  const primary = requirements[0];
  const primaryAssessment = primary.assessment;
  if (!primaryAssessment) return null;
  const primaryResult = candidate.assessmentResults.find((entry) => entry.assessment.id === primary.assessmentId);
  if (!primaryResult || primaryResult.score === null) return null;

  const requirementEvidence = requirements.map((requirement) => {
    const result = candidate.assessmentResults.find((entry) => entry.assessment.id === requirement.assessmentId);
    const score = result?.score ?? null;
    return {
      assessment: requirement.assessment!,
      requiredScore: requirement.requiredScore,
      score,
      meets: score !== null && score >= requirement.requiredScore,
      integrity: result?.integrity ?? null,
    };
  });

  return {
    assessment: primaryAssessment,
    score: primaryResult.score,
    requiredScore: primary.requiredScore,
    meetsBar: requirementEvidence.every((requirement) => requirement.meets),
    requirements: requirementEvidence,
    attemptCount: primaryResult.attemptCount,
    lastSubmittedAt: primaryResult.lastSubmittedAt,
    integrity: primaryResult.integrity,
  };
}

function feedState(evidence: AssessmentEvidence | null): AssessmentFeedState {
  if (!evidence) return "NOT_TAKEN";
  return evidence.meetsBar ? "MET" : "BELOW";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "role";
}

function parseSignalsJson(value: string): RoleSignal[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({
        id: String(entry.id ?? ""),
        kind:
          entry.kind === "EXPERIENCE" || entry.kind === "DOMAIN"
            ? (entry.kind as RoleSignal["kind"])
            : ("SKILL" as const),
        label: String(entry.label ?? ""),
        value: String(entry.value ?? ""),
        years: typeof entry.years === "number" ? entry.years : undefined,
        skill: typeof entry.skill === "string" ? entry.skill : undefined,
      }))
      .filter((signal) => signal.id && signal.label && signal.value);
  } catch {
    return [];
  }
}

function priorityIntroUsageWhere(side: PersonaSide, actorId: string, eventId: string): Prisma.DecisionWhereInput {
  return side === "candidate"
    ? { eventId, actorType: "CANDIDATE", candidateId: actorId, action: "PRIORITY_INTRO" }
    : { eventId, actorType: "EMPLOYER", action: "PRIORITY_INTRO", role: { employerId: actorId } };
}

function likeUsageWhere(side: PersonaSide, actorId: string, eventId: string): Prisma.DecisionWhereInput {
  return side === "candidate"
    ? { eventId, actorType: "CANDIDATE", candidateId: actorId, action: "LIKE", source: "SWIPE" }
    : { eventId, actorType: "EMPLOYER", action: "LIKE", source: "SWIPE", role: { employerId: actorId } };
}

function receivedPriorityIntrosWhere(side: PersonaSide, actorId: string): Prisma.DecisionWhereInput {
  return side === "candidate"
    ? { actorType: "EMPLOYER", action: "PRIORITY_INTRO", candidateId: actorId }
    : { actorType: "CANDIDATE", action: "PRIORITY_INTRO", role: { employerId: actorId } };
}


function mapScreeningRun(run: ScreeningRunPayload): ScreeningRunView {
  const stage =
    run.stage === "VERIFY" || run.stage === "KIT" || run.stage === "DECISION" ? run.stage : "EVIDENCE";
  return {
    id: run.id,
    stage,
    status:
      run.status === "ADVANCE" || run.status === "HOLD" || run.status === "DECLINE" ? run.status : "OPEN",
    claimChecks: parseClaimChecks(run.claimChecksJson),
    criterionChecks: parseCriterionChecks(run.criterionChecksJson),
    notes: parseScreeningNotes(run.notesJson),
    decisionReason: run.decisionReason,
    decisionBasis: run.decisionBasis,
    decidedBy: run.decidedBy,
    decidedAt: run.decidedAt?.toISOString() ?? null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    events: run.events.map((event) => ({
      id: event.id,
      kind: event.kind,
      detail: event.detail,
      actor: event.actor,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

function claimInputsFor(candidate: CandidateDetail): ClaimInput[] {
  return candidate.facts.map((fact) => ({
    id: fact.id,
    claim: fact.claim,
    provenance: fact.provenance,
    evidenceUrl: fact.evidenceUrl,
    linkStatus: fact.linkStatus?.status ?? null,
    image: fact.meta.image ?? null,
    context:
      fact.meta.module === "FACT" ||
      fact.meta.module === "AVAILABILITY" ||
      /ideal team|looking for|availability/i.test(fact.prompt),
    skillTags: fact.skillTags,
  }));
}

function countOpenItems(criteria: ReturnType<typeof evaluateCriteria>, claims: ReturnType<typeof evaluateClaims>): number {
  const openCriteria = criteria.filter(
    (result) => result.criterion.source !== "CONVERSATION" && result.status !== "MET" && result.status !== "NOT_MET",
  ).length;
  const openClaims = claims.filter((claim) => claim.status === "UNCHECKED" || claim.status === "LINK_ONLY" || claim.status === "NEEDS_CONVERSATION").length;
  return openCriteria + openClaims;
}

export class PrismaRecruitmentRepository implements RecruitmentRepository {
  private eventIdPromise: Promise<string> | null = null;

  private async eventId() {
    if (!this.eventIdPromise) {
      this.eventIdPromise = prisma.event
        .findFirstOrThrow({ orderBy: { createdAt: "asc" }, select: { id: true } })
        .then((event) => event.id);
    }
    return this.eventIdPromise;
  }

  async getEvent(): Promise<EventView> {
    const event = await prisma.event.findFirstOrThrow({ orderBy: { createdAt: "asc" } });
    return {
      id: event.id,
      slug: event.slug,
      name: event.name,
      city: event.city,
      dateLabel: event.dateLabel,
      tagline: event.tagline,
    };
  }

  async getCandidateDirectory(): Promise<CandidateSummary[]> {
    const eventId = await this.eventId();
    const candidates = await prisma.candidate.findMany({
      where: { eventId },
      orderBy: { order: "asc" },
    });
    return candidates.map(mapCandidateSummary);
  }

  async getEmployerDirectory(): Promise<EmployerDetail[]> {
    const eventId = await this.eventId();
    const employers = await prisma.employer.findMany({
      where: { eventId },
      include: employerInclude,
      orderBy: { order: "asc" },
    });
    return employers.map(mapEmployer);
  }

  async getAccountByEmail(email: string): Promise<AccountRecord | null> {
    const account = await prisma.account.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!account) return null;
    return {
      id: account.id,
      side: account.side === "employer" ? "employer" : "candidate",
      email: account.email,
      personId: account.personId,
      passwordHash: account.passwordHash,
      passwordSalt: account.passwordSalt,
    };
  }

  async createAccount(input: CreateAccountInput): Promise<AccountRecord> {
    const eventId = await this.eventId();
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (name.length < 2 || name.length > 120) {
      throw new RepositoryError("invalid_claim", "Name must be between 2 and 120 characters.");
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new RepositoryError("invalid_claim", "Enter a valid email address.");
    }
    const existing = await prisma.account.findUnique({ where: { email } });
    if (existing) throw new RepositoryError("already_decided", "An account with that email already exists.");

    const idSuffix = randomUUID();
    const monogram = name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const personId =
      input.side === "candidate"
        ? (
            await prisma.candidate.create({
              data: {
                id: "cand-" + idSuffix,
                slug: slugify(name) + "-" + idSuffix.slice(0, 8),
                eventId,
                name,
                headline: "New candidate",
                location: "Espoo, Finland",
                bio: "I am setting up my Rivet profile. Add evidence and take an assessment to show what I can do.",
                monogram,
                palette: "plum",
                tagsJson: "[]",
                interestsJson: "[]",
                availability: "",
                discoveryOptIn: false,
                order: (await prisma.candidate.aggregate({ where: { eventId }, _max: { order: true } }))._max.order ?? 0,
                priorityIntroAllowance: 1,
                likeAllowance: 5,
                synthetic: true,
              },
            })
          ).id
        : (
            await prisma.employer.create({
              data: {
                id: "emp-" + idSuffix,
                slug: slugify(name) + "-" + idSuffix.slice(0, 8),
                eventId,
                name,
                tagline: "Hiring with evidence.",
                about: "We are setting up a Rivet hiring profile.",
                industry: "Not set",
                teamSize: "Not set",
                location: "Espoo, Finland",
                logoMark: monogram,
                palette: "slate",
                contactName: name,
                order: (await prisma.employer.aggregate({ where: { eventId }, _max: { order: true } }))._max.order ?? 0,
                priorityIntroAllowance: 1,
                likeAllowance: 10,
                synthetic: true,
              },
            })
          ).id;

    const account = await prisma.account.create({
      data: {
        eventId,
        side: input.side,
        email,
        passwordHash: input.passwordHash,
        passwordSalt: input.passwordSalt,
        personId,
      },
    });
    return {
      id: account.id,
      side: input.side,
      email: account.email,
      personId: account.personId,
      passwordHash: account.passwordHash,
      passwordSalt: account.passwordSalt,
    };
  }

  async completeCandidateCv(candidateId: string, input: CandidateCvInput): Promise<CandidateDetail> {
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new RepositoryError("not_found", "Candidate not found.");
    if (input.cvSource !== "UPLOAD" && input.cvSource !== "SAMPLE") {
      throw new RepositoryError("invalid_claim", "Choose an uploaded CV or a sample profile.");
    }
    const fileName = input.cvFileName.trim().slice(0, 200);
    if (!fileName) throw new RepositoryError("invalid_claim", "Choose a file or sample profile.");

    await prisma.$transaction(async (tx) => {
      if (input.cvSource === "SAMPLE") {
        const sampleSlug = input.sampleCandidateSlug?.trim();
        if (!sampleSlug) throw new RepositoryError("invalid_claim", "Choose a sample profile.");
        const sample = await tx.candidate.findUnique({
          where: { slug: sampleSlug },
          include: { facts: { orderBy: { order: "asc" } } },
        });
        if (!sample) throw new RepositoryError("not_found", "Sample profile not found.");
        await tx.fact.deleteMany({ where: { candidateId } });
        await tx.candidate.update({
          where: { id: candidateId },
          data: {
            headline: sample.headline,
            location: sample.location,
            bio: sample.bio,
            tagsJson: sample.tagsJson,
            interestsJson: sample.interestsJson,
            availability: sample.availability,
            discoveryOptIn: sample.discoveryOptIn,
            cvFileName: fileName,
            cvSource: "SAMPLE",
            cvUploadedAt: new Date(),
          },
        });
        for (const fact of sample.facts) {
          await tx.fact.create({
            data: {
              candidateId,
              prompt: fact.prompt,
              claim: fact.claim,
              skillTagsJson: fact.skillTagsJson,
              metaJson: fact.metaJson,
              evidenceUrl: fact.evidenceUrl,
              provenance: "SELF_CLAIMED",
              origin: "SAMPLE_CV",
              order: fact.order,
            },
          });
        }
      } else {
        await tx.candidate.update({
          where: { id: candidateId },
          data: {
            cvFileName: fileName,
            cvSource: "UPLOAD",
            cvUploadedAt: new Date(),
          },
        });
      }
    });

    const updated = await this.getCandidateById(candidateId);
    if (!updated) throw new RepositoryError("not_found", "Candidate not found.");
    return updated;
  }

  async getCandidateById(id: string): Promise<CandidateDetail | null> {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: candidateInclude,
    });
    return candidate ? mapCandidate(candidate) : null;
  }

  async getEmployerById(id: string): Promise<EmployerDetail | null> {
    const employer = await prisma.employer.findUnique({
      where: { id },
      include: employerInclude,
    });
    return employer ? mapEmployer(employer) : null;
  }

  async getRoleById(id: string): Promise<RoleDetail | null> {
    const role = await prisma.role.findUnique({
      where: { id },
      include: roleInclude,
    });
    return role ? mapRoleDetail(role) : null;
  }

  async getDiscoveryRolesForCandidate(candidateId: string): Promise<RoleDetail[]> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { eventId: true },
    });
    if (!candidate) return [];
    const roles = await prisma.role.findMany({
      where: {
        eventId: candidate.eventId,
        decisions: { none: { actorType: "CANDIDATE", candidateId } },
      },
      include: roleInclude,
    });
    roles.sort((a, b) => a.employer.order - b.employer.order || a.order - b.order);
    return roles.map(mapRoleDetail);
  }

  async getDiscoveryCandidatesForRole(roleId: string, employerId: string): Promise<CandidateDetail[]> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { eventId: true, employerId: true },
    });
    if (!role || role.employerId !== employerId) return [];
    const candidates = await prisma.candidate.findMany({
      where: {
        eventId: role.eventId,
        decisions: { none: { actorType: "EMPLOYER", roleId } },
      },
      include: candidateInclude,
      orderBy: { order: "asc" },
    });
    return candidates.map(mapCandidate);
  }

  async getPriorityIntroState(side: PersonaSide, actorId: string): Promise<PriorityIntroState> {
    const eventId = await this.eventId();
    const allowance =
      side === "candidate"
        ? (await prisma.candidate.findUnique({ where: { id: actorId }, select: { priorityIntroAllowance: true } }))?.priorityIntroAllowance ?? 1
        : (await prisma.employer.findUnique({ where: { id: actorId }, select: { priorityIntroAllowance: true } }))?.priorityIntroAllowance ?? 1;
    const [used, received] = await Promise.all([
      prisma.decision.count({ where: priorityIntroUsageWhere(side, actorId, eventId) }),
      prisma.decision.count({ where: receivedPriorityIntrosWhere(side, actorId) }),
    ]);
    return {
      total: allowance,
      used,
      remaining: Math.max(0, allowance - used),
      received,
    };
  }

  async recordDecision(input: {
    side: PersonaSide;
    actorId: string;
    roleId: string;
    candidateId: string;
    action: DecisionAction;
    reason?: string;
  }): Promise<DecisionResult> {
    const action = input.action;
    if (action !== "LIKE" && action !== "PASS" && action !== "PRIORITY_INTRO") {
      throw new RepositoryError("invalid_action", "Unknown action.");
    }
    const trimmedReason = (input.reason ?? "").trim();
    if (action === "PRIORITY_INTRO" && (trimmedReason.length < 1 || trimmedReason.length > 140)) {
      throw new RepositoryError("invalid_reason", "A priority intro needs a reason between 1 and 140 characters.");
    }
    if (action !== "PRIORITY_INTRO" && trimmedReason.length > 0) {
      // Reasons are only meaningful for priority intros; ignore anything else.
    }

    return prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({
        where: { id: input.roleId },
        include: {
          employer: { select: { id: true, name: true, priorityIntroAllowance: true, likeAllowance: true } },
        },
      });
      if (!role) throw new RepositoryError("not_found", "Role not found.");

      const candidate = await tx.candidate.findUnique({
        where: { id: input.candidateId },
        select: { id: true, eventId: true, priorityIntroAllowance: true, likeAllowance: true },
      });
      if (!candidate || candidate.eventId !== role.eventId) {
        throw new RepositoryError("not_found", "Candidate not found for this event.");
      }

      let allowance = 1;
      let likeAllowance = 5;
      if (input.side === "candidate") {
        if (input.actorId !== candidate.id) throw new RepositoryError("forbidden", "Wrong candidate identity.");
        allowance = candidate.priorityIntroAllowance;
        likeAllowance = candidate.likeAllowance;
      } else {
        if (role.employer.id !== input.actorId) throw new RepositoryError("forbidden", "Wrong employer identity.");
        allowance = role.employer.priorityIntroAllowance;
        likeAllowance = role.employer.likeAllowance;
      }

      const actorType = input.side === "candidate" ? "CANDIDATE" : "EMPLOYER";
      const existing = await tx.decision.findUnique({
        where: {
          roleId_candidateId_actorType: {
            roleId: input.roleId,
            candidateId: input.candidateId,
            actorType,
          },
        },
      });
      if (existing) {
        throw new RepositoryError("already_decided", "You already made a decision on this profile.");
      }

      let used = 0;
      let likesUsed = 0;
      if (action === "PRIORITY_INTRO") {
        used = await tx.decision.count({
          where: priorityIntroUsageWhere(input.side, input.actorId, role.eventId),
        });
        if (!canUsePriorityIntro(used, allowance)) {
          throw new RepositoryError("priority_intro_exhausted", "No priority intros left for this event.");
        }
      }
      if (action === "LIKE") {
        likesUsed = await tx.decision.count({
          where: likeUsageWhere(input.side, input.actorId, role.eventId),
        });
        if (!canUseLike(likesUsed, likeAllowance)) {
          throw new RepositoryError("like_exhausted", "No Likes left for this event.");
        }
      }

      await tx.decision.create({
        data: {
          eventId: role.eventId,
          roleId: input.roleId,
          candidateId: input.candidateId,
          actorType,
          action,
          source: "SWIPE",
          reason: action === "PRIORITY_INTRO" ? trimmedReason : null,
        },
      });

      let matchId: string | null = null;
      if (action !== "PASS") {
        const otherType = input.side === "candidate" ? "EMPLOYER" : "CANDIDATE";
        const other = await tx.decision.findUnique({
          where: {
            roleId_candidateId_actorType: {
              roleId: input.roleId,
              candidateId: input.candidateId,
              actorType: otherType,
            },
          },
        });
        if (other && canCreateMatch(action, other.action)) {
          const existingMatch = await tx.match.findUnique({
            where: {
              roleId_candidateId: {
                roleId: input.roleId,
                candidateId: input.candidateId,
              },
            },
          });
          const match =
            existingMatch ??
            (await tx.match.create({
              data: {
                eventId: role.eventId,
                roleId: input.roleId,
                candidateId: input.candidateId,
              },
            }));
          matchId = match.id;
        }
      }

      if (action === "PASS" && input.side === "employer") {
        await tx.invitation.updateMany({
          where: { roleId: input.roleId, candidateId: input.candidateId, status: "PENDING" },
          data: { status: "WITHDRAWN", respondedAt: new Date() },
        });
        const candidateDecision = await tx.decision.findUnique({
          where: {
            roleId_candidateId_actorType: {
              roleId: input.roleId,
              candidateId: input.candidateId,
              actorType: "CANDIDATE",
            },
          },
        });
        if (candidateDecision && actionCountsAsYes(candidateDecision.action)) {
          const existingOutcome = await tx.outcome.findUnique({
            where: { roleId_candidateId: { roleId: input.roleId, candidateId: input.candidateId } },
          });
          if (!existingOutcome) {
            await tx.outcome.create({
              data: {
                eventId: role.eventId,
                roleId: input.roleId,
                candidateId: input.candidateId,
                kind: "NOT_SELECTED",
                message: outcomeForPass({ roleTitle: role.title, employerName: role.employer.name }).message,
              },
            });
          }
        }
      }

      return {
        action,
        matched: Boolean(matchId),
        matchId,
        priorityIntrosRemaining: remainingPriorityIntros(allowance, used + (action === "PRIORITY_INTRO" ? 1 : 0)),
        likesRemaining: remainingLikes(likeAllowance, likesUsed + (action === "LIKE" ? 1 : 0)),
      };
    });
  }

  async getMatches(side: PersonaSide, actorId: string): Promise<MatchSummary[]> {
    const where: Prisma.MatchWhereInput =
      side === "candidate" ? { candidateId: actorId } : { role: { employerId: actorId } };
    const matches = await prisma.match.findMany({
      where,
      include: {
        candidate: true,
        role: { include: { employer: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    });
    return matches.map((match) => ({
      id: match.id,
      roleId: match.roleId,
      roleTitle: match.role.title,
      employerId: match.role.employer.id,
      employerName: match.role.employer.name,
      employerLogoMark: match.role.employer.logoMark,
      employerPalette: match.role.employer.palette,
      candidateId: match.candidate.id,
      candidateName: match.candidate.name,
      candidateHeadline: match.candidate.headline,
      candidateMonogram: match.candidate.monogram,
      candidatePalette: match.candidate.palette,
      stage: isMatchStage(match.stage) ? match.stage : "INTRO_CALL",
      stageUpdatedAt: match.stageUpdatedAt.toISOString(),
      createdAt: match.createdAt.toISOString(),
      lastMessageAt: match.lastMessageAt?.toISOString() ?? null,
      lastMessage: match.messages[0]?.body ?? null,
    }));
  }

  async getMatch(matchId: string, side: PersonaSide, actorId: string): Promise<MatchDetail | null> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        candidate: { include: candidateInclude },
        role: { include: roleInclude },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!match) return null;
    if (side === "candidate" && match.candidateId !== actorId) return null;
    if (side === "employer" && match.role.employerId !== actorId) return null;
    const [fit, outcome] = await Promise.all([
      prisma.fitSummary.findUnique({
        where: {
          roleId_candidateId: {
            roleId: match.roleId,
            candidateId: match.candidateId,
          },
        },
      }),
      prisma.outcome.findUnique({
        where: {
          roleId_candidateId: {
            roleId: match.roleId,
            candidateId: match.candidateId,
          },
        },
      }),
    ]);
    return {
      id: match.id,
      role: mapRoleDetail(match.role),
      candidate: mapCandidate(match.candidate),
      messages: match.messages.map(mapMessage),
      fitSummary: fit ? mapFit(fit) : null,
      stage: isMatchStage(match.stage) ? match.stage : "INTRO_CALL",
      stageUpdatedAt: match.stageUpdatedAt.toISOString(),
      outcome: outcome
        ? {
            id: outcome.id,
            kind:
              outcome.kind === "ROLE_CLOSED" || outcome.kind === "AFTER_CONVERSATION"
                ? outcome.kind
                : "NOT_SELECTED",
            message: outcome.message,
            deliveredAt: outcome.deliveredAt.toISOString(),
            roleId: match.roleId,
            roleTitle: match.role.title,
            employerName: match.role.employer.name,
            candidateName: match.candidate.name,
          }
        : null,
      createdAt: match.createdAt.toISOString(),
    };
  }

  async sendMessage(matchId: string, side: PersonaSide, actorId: string, body: string): Promise<MessageView> {
    const trimmed = body.trim();
    if (trimmed.length < 1 || trimmed.length > 2000) {
      throw new RepositoryError("invalid_claim", "Messages must be between 1 and 2000 characters.");
    }
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { role: { select: { employerId: true } } },
    });
    if (!match) throw new RepositoryError("not_found", "Match not found.");
    if (side === "candidate" && match.candidateId !== actorId) throw new RepositoryError("forbidden", "Not your match.");
    if (side === "employer" && match.role.employerId !== actorId) throw new RepositoryError("forbidden", "Not your match.");

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          matchId,
          senderType: side === "candidate" ? "CANDIDATE" : "EMPLOYER",
          body: trimmed,
        },
      }),
      prisma.match.update({
        where: { id: matchId },
        data: { lastMessageAt: new Date() },
      }),
    ]);
    return mapMessage(message);
  }

  async getPriorityIntroInbox(side: PersonaSide, actorId: string): Promise<PriorityIntroInboxItem[]> {
    const decisions = await prisma.decision.findMany({
      where: receivedPriorityIntrosWhere(side, actorId),
      include: {
        candidate: true,
        role: { include: roleInclude },
      },
      orderBy: { createdAt: "desc" },
    });
    if (decisions.length === 0) return [];

    const matches = await prisma.match.findMany({
      where: side === "candidate" ? { candidateId: actorId } : { role: { employerId: actorId } },
      select: { id: true, roleId: true, candidateId: true },
    });
    const matchedPairs = new Map(matches.map((match) => [match.roleId + ":" + match.candidateId, match.id]));

    const recipientDecisions = await prisma.decision.findMany({
      where:
        side === "candidate"
          ? { actorType: "CANDIDATE", candidateId: actorId }
          : { actorType: "EMPLOYER", role: { employerId: actorId } },
      select: { roleId: true, candidateId: true, action: true },
    });
    const recipientByPair = new Map(
      recipientDecisions.map((decision) => [decision.roleId + ":" + decision.candidateId, asDecisionAction(decision.action)]),
    );

    return decisions.map((decision) => {
      const pairKey = decision.roleId + ":" + decision.candidateId;
      return {
        id: decision.id,
        reason: decision.reason ?? "",
        createdAt: decision.createdAt.toISOString(),
        role: mapRoleDetail(decision.role),
        candidate: mapCandidateSummary(decision.candidate),
        employer: mapEmployerBrief(decision.role.employer),
        matched: matchedPairs.has(pairKey),
        matchId: matchedPairs.get(pairKey) ?? null,
        recipientAction: recipientByPair.get(pairKey) ?? null,
        senderSide: side === "candidate" ? "employer" : "candidate",
      };
    });
  }

  async getNavCounts(side: PersonaSide, actorId: string): Promise<NavCounts> {
    const matchWhere: Prisma.MatchWhereInput =
      side === "candidate" ? { candidateId: actorId } : { role: { employerId: actorId } };
    const invitationWhere: Prisma.InvitationWhereInput =
      side === "candidate" ? { candidateId: actorId, status: "PENDING" } : { role: { employerId: actorId }, status: "PENDING" };
    const [matches, priorityIntrosReceived, invitations, updates] = await Promise.all([
      prisma.match.count({ where: matchWhere }),
      prisma.decision.count({ where: receivedPriorityIntrosWhere(side, actorId) }),
      prisma.invitation.count({ where: invitationWhere }),
      side === "candidate" ? prisma.outcome.count({ where: { candidateId: actorId } }) : Promise.resolve(0),
    ]);
    return { matches, priorityIntrosReceived, invitations, updates };
  }

  async hasEmployerInterest(candidateId: string, employerId: string): Promise<boolean> {
    const decision = await prisma.decision.findFirst({
      where: {
        actorType: "EMPLOYER",
        candidateId,
        action: { in: ["LIKE", "PRIORITY_INTRO"] },
        role: { employerId },
      },
      select: { id: true },
    });
    return Boolean(decision);
  }

  async getTailorableRoles(candidateId: string): Promise<TailorOption[]> {
    const decisions = await prisma.decision.findMany({
      where: { actorType: "CANDIDATE", candidateId, action: { in: ["LIKE", "PRIORITY_INTRO"] } },
      include: { role: { include: roleInclude } },
      orderBy: { createdAt: "desc" },
    });
    const matches = await prisma.match.findMany({
      where: { candidateId },
      select: { roleId: true, createdAt: true },
    });
    const matchedAt = new Map(matches.map((match) => [match.roleId, match.createdAt.toISOString()]));
    const drafts = await prisma.tailoringDraft.findMany({
      where: { candidateId },
      select: { id: true, roleId: true, status: true },
    });
    const draftMap = new Map(drafts.map((draft) => [draft.roleId, draft]));

    return decisions
      .map((decision) => {
        const draft = draftMap.get(decision.roleId);
        return {
          role: mapRoleDetail(decision.role),
          state: matchedAt.has(decision.roleId) ? ("MATCHED" as const) : ("LIKED" as const),
          draftStatus: draft ? (draft.status === "APPROVED" ? ("APPROVED" as const) : ("DRAFT" as const)) : null,
          draftId: draft?.id ?? null,
          matchedAt: matchedAt.get(decision.roleId) ?? null,
        };
      })
      .sort((a, b) => {
        if (a.state !== b.state) return a.state === "MATCHED" ? -1 : 1;
        return a.role.employer.name.localeCompare(b.role.employer.name);
      });
  }

  async getTailoringDraft(candidateId: string, roleId: string): Promise<TailoringDraftView | null> {
    const draft = await prisma.tailoringDraft.findUnique({
      where: { candidateId_roleId: { candidateId, roleId } },
      include: {
        role: { include: roleInclude },
        items: { orderBy: { order: "asc" } },
      },
    });
    if (!draft) return null;

    const factIds = Array.from(
      new Set(
        draft.items.flatMap((item) => {
          try {
            const parsed: unknown = JSON.parse(item.sourceFactIdsJson);
            return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
          } catch {
            return [];
          }
        }),
      ),
    );
    const facts = await prisma.fact.findMany({
      where: { id: { in: factIds } },
      include: factInclude,
    });
    const factMap = new Map(facts.map((fact) => [fact.id, mapFact(fact)]));

    const items: TailoringItemView[] = draft.items.map((item) => {
      let ids: string[] = [];
      try {
        const parsed: unknown = JSON.parse(item.sourceFactIdsJson);
        if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === "string");
      } catch {
        ids = [];
      }
      return {
        id: item.id,
        kind: item.kind === "REWORD" ? "REWORD" : "FOREGROUND",
        suggestedText: item.suggestedText,
        editedText: item.editedText,
        rationale: item.rationale,
        status:
          item.status === "APPROVED" ? "APPROVED" : item.status === "REJECTED" ? "REJECTED" : "SUGGESTED",
        order: item.order,
        sourceFacts: ids.map((id) => factMap.get(id)).filter((fact): fact is FactView => Boolean(fact)),
      };
    });

    return {
      id: draft.id,
      candidateId,
      role: mapRoleDetail(draft.role),
      status: draft.status === "APPROVED" ? "APPROVED" : "DRAFT",
      engine: draft.engine,
      model: draft.model,
      note: draft.note,
      approvedAt: draft.approvedAt?.toISOString() ?? null,
      createdAt: draft.createdAt.toISOString(),
      items,
    };
  }

  async replaceTailoringDraft(input: {
    candidateId: string;
    roleId: string;
    engine: string;
    model: string | null;
    note?: string | null;
    suggestions: Array<{
      kind: "FOREGROUND" | "REWORD";
      sourceFactIds: string[];
      suggestedText: string;
      rationale: string;
    }>;
  }): Promise<TailoringDraftView> {
    if (input.suggestions.length === 0) {
      throw new RepositoryError("draft_empty", "No suggestions were produced.");
    }
    const candidate = await prisma.candidate.findUnique({
      where: { id: input.candidateId },
      include: { facts: { select: { id: true } } },
    });
    if (!candidate) throw new RepositoryError("not_found", "Candidate not found.");
    const role = await prisma.role.findUnique({
      where: { id: input.roleId },
      select: { id: true, eventId: true },
    });
    if (!role || role.eventId !== candidate.eventId) throw new RepositoryError("not_found", "Role not found.");
    const positiveDecision = await prisma.decision.findFirst({
      where: {
        actorType: "CANDIDATE",
        candidateId: input.candidateId,
        roleId: input.roleId,
        action: { in: ["LIKE", "PRIORITY_INTRO"] },
      },
    });
    if (!positiveDecision) {
      throw new RepositoryError("forbidden", "You can only tailor a profile for a role you liked or matched with.");
    }

    const factIdSet = new Set(candidate.facts.map((fact) => fact.id));
    for (const suggestion of input.suggestions) {
      if (suggestion.sourceFactIds.length === 0 || !suggestion.sourceFactIds.every((id) => factIdSet.has(id))) {
        throw new RepositoryError("no_sources", "Every suggestion must trace to a fact in the master record.");
      }
      if (!suggestion.suggestedText.trim()) {
        throw new RepositoryError("invalid_claim", "Suggestion text cannot be empty.");
      }
    }

    const existing = await prisma.tailoringDraft.findUnique({
      where: { candidateId_roleId: { candidateId: input.candidateId, roleId: input.roleId } },
    });
    if (existing?.status === "APPROVED") {
      throw new RepositoryError("draft_approved", "This tailored profile is already approved.");
    }

    await prisma.$transaction(async (tx) => {
      let draftId: string;
      if (existing) {
        await tx.tailoringItem.deleteMany({ where: { draftId: existing.id } });
        await tx.tailoringDraft.update({
          where: { id: existing.id },
          data: {
            engine: input.engine,
            model: input.model,
            note: input.note ?? null,
            status: "DRAFT",
            approvedAt: null,
          },
        });
        draftId = existing.id;
      } else {
        const draft = await tx.tailoringDraft.create({
          data: {
            eventId: role.eventId,
            candidateId: input.candidateId,
            roleId: input.roleId,
            engine: input.engine,
            model: input.model,
            note: input.note ?? null,
            status: "DRAFT",
          },
        });
        draftId = draft.id;
      }

      await tx.tailoringItem.createMany({
        data: input.suggestions.map((suggestion, index) => ({
          draftId,
          kind: suggestion.kind,
          sourceFactIdsJson: JSON.stringify(suggestion.sourceFactIds),
          suggestedText: suggestion.suggestedText.trim(),
          rationale: suggestion.rationale.trim(),
          status: "SUGGESTED",
          order: index + 1,
        })),
      });
    });

    const result = await this.getTailoringDraft(input.candidateId, input.roleId);
    if (!result) throw new RepositoryError("not_found", "Draft was not saved.");
    return result;
  }

  async updateTailoringItem(input: {
    itemId: string;
    candidateId: string;
    status?: "APPROVED" | "REJECTED" | "SUGGESTED";
    editedText?: string | null;
  }): Promise<void> {
    const item = await prisma.tailoringItem.findUnique({
      where: { id: input.itemId },
      include: { draft: { select: { id: true, candidateId: true, status: true } } },
    });
    if (!item) throw new RepositoryError("not_found", "Suggestion not found.");
    if (item.draft.candidateId !== input.candidateId) throw new RepositoryError("forbidden", "Not your draft.");
    if (item.draft.status === "APPROVED") throw new RepositoryError("draft_approved", "This draft is already approved.");

    const editedText =
      input.editedText === undefined
        ? undefined
        : input.editedText === null || input.editedText.trim() === ""
          ? null
          : input.editedText.trim().slice(0, 1200);

    await prisma.tailoringItem.update({
      where: { id: input.itemId },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(editedText !== undefined ? { editedText } : {}),
      },
    });
  }

  async approveTailoringDraft(draftId: string, candidateId: string): Promise<void> {
    const draft = await prisma.tailoringDraft.findUnique({
      where: { id: draftId },
      include: { items: true, role: true },
    });
    if (!draft) throw new RepositoryError("not_found", "Draft not found.");
    if (draft.candidateId !== candidateId) throw new RepositoryError("forbidden", "Not your draft.");
    if (draft.status === "APPROVED") return;
    if (!draft.items.some((item) => item.status === "APPROVED")) {
      throw new RepositoryError("draft_empty", "Approve at least one suggestion before sharing.");
    }
    await prisma.tailoringDraft.update({
      where: { id: draftId },
      data: { status: "APPROVED", approvedAt: new Date() },
    });
  }

  async addFact(candidateId: string, input: NewFactInput): Promise<FactView> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, eventId: true, facts: { select: { order: true } } },
    });
    if (!candidate) throw new RepositoryError("not_found", "Candidate not found.");
    const claim = input.claim.trim();
    if (claim.length < 8 || claim.length > 600) {
      throw new RepositoryError("invalid_claim", "A highlight needs a claim between 8 and 600 characters.");
    }
    const prompt = input.prompt.trim().slice(0, 120) || "Extracted highlight";
    const tags = input.skillTags.map((tag) => tag.trim()).filter(Boolean).slice(0, 6);
    let evidenceUrl: string | null = null;
    if (input.evidenceUrl && input.evidenceUrl.trim()) {
      try {
        const url = new URL(input.evidenceUrl.trim());
        if (!["https:", "http:"].includes(url.protocol)) throw new Error("protocol");
        evidenceUrl = url.toString();
      } catch {
        throw new RepositoryError("invalid_claim", "Evidence link must be a valid http(s) URL.");
      }
    }
    const nextOrder = Math.max(0, ...candidate.facts.map((fact) => fact.order)) + 1;
    const fact = await prisma.fact.create({
      data: {
        candidateId,
        prompt,
        claim,
        skillTagsJson: JSON.stringify(tags),
        metaJson: JSON.stringify(input.meta ?? {}),
        evidenceUrl,
        // Provenance is never supplied by AI or the client. Extracted claims are self-claimed.
        provenance: "SELF_CLAIMED",
        origin: input.meta ? "MANUAL" : "AI_EXTRACTED",
        order: nextOrder,
      },
      include: factInclude,
    });
    return mapFact(fact);
  }

  async getLinkTarget(factId: string): Promise<LinkCheckView | null> {
    const fact = await prisma.fact.findUnique({
      where: { id: factId },
      select: { id: true, evidenceUrl: true, linkCheck: true },
    });
    if (!fact) return null;
    return {
      factId: fact.id,
      evidenceUrl: fact.evidenceUrl,
      status: fact.linkCheck ? asLinkStatus(fact.linkCheck.status) : null,
      checkedAt: fact.linkCheck?.checkedAt.toISOString() ?? null,
      httpStatus: fact.linkCheck?.httpStatus ?? null,
    };
  }

  async saveLinkCheck(
    factId: string,
    status: LinkStatus,
    httpStatus: number | null,
    detail: string | null,
  ): Promise<LinkCheckView> {
    const fact = await prisma.fact.findUnique({
      where: { id: factId },
      select: { id: true, evidenceUrl: true },
    });
    if (!fact) throw new RepositoryError("not_found", "Fact not found.");
    const check = await prisma.linkCheck.upsert({
      where: { factId },
      create: {
        factId,
        status,
        httpStatus,
        detail: detail?.slice(0, 300) ?? null,
        checkedAt: new Date(),
      },
      update: {
        status,
        httpStatus,
        detail: detail?.slice(0, 300) ?? null,
        checkedAt: new Date(),
      },
    });
    return {
      factId,
      evidenceUrl: fact.evidenceUrl,
      status: asLinkStatus(check.status),
      checkedAt: check.checkedAt.toISOString(),
      httpStatus: check.httpStatus,
    };
  }

  async getCachedAi(key: string): Promise<string | null> {
    const cached = await prisma.aiCache.findUnique({ where: { key } });
    if (!cached) return null;
    if (Date.now() - cached.createdAt.getTime() > 24 * 60 * 60 * 1000) {
      await prisma.aiCache.delete({ where: { key } }).catch(() => undefined);
      return null;
    }
    return cached.responseJson;
  }

  async saveAiCache(key: string, kind: string, responseJson: string): Promise<void> {
    await prisma.aiCache.upsert({
      where: { key },
      create: { key, kind, responseJson },
      update: { kind, responseJson, createdAt: new Date() },
    });
  }

  async recordAiRun(input: {
    kind: string;
    provider: string;
    model: string;
    mode: "LIVE" | "FALLBACK";
    status: string;
    latencyMs?: number;
    error?: string | null;
  }): Promise<void> {
    await prisma.aiRun.create({
      data: {
        kind: input.kind,
        provider: input.provider,
        model: input.model,
        mode: input.mode,
        status: input.status,
        latencyMs: input.latencyMs ?? null,
        error: input.error?.slice(0, 500) ?? null,
      },
    });
  }

  async getRecentAiRuns(limit = 8): Promise<AiRunView[]> {
    const runs = await prisma.aiRun.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return runs.map((run) => ({
      id: run.id,
      kind: run.kind,
      provider: run.provider,
      model: run.model,
      mode: run.mode === "LIVE" ? "LIVE" : "FALLBACK",
      status: run.status,
      createdAt: run.createdAt.toISOString(),
    }));
  }

  async getFitSummary(roleId: string, candidateId: string): Promise<FitSummaryView | null> {
    const fit = await prisma.fitSummary.findUnique({
      where: { roleId_candidateId: { roleId, candidateId } },
    });
    return fit ? mapFit(fit) : null;
  }

  async getFitInputs(): Promise<FitInputs> {
    const eventId = await this.eventId();
    const [candidates, roles] = await Promise.all([
      prisma.candidate.findMany({
        where: { eventId },
        include: { facts: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      }),
      prisma.role.findMany({
        where: { eventId },
        include: { employer: { select: { name: true } } },
        orderBy: { order: "asc" },
      }),
    ]);
    return {
      eventId,
      candidates: candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        tags: parseTags(candidate.tagsJson),
        facts: candidate.facts.map((fact) => ({
          id: fact.id,
          claim: fact.claim,
          skillTags: parseTags(fact.skillTagsJson),
          evidenceUrl: fact.evidenceUrl,
        })),
      })),
      roles: roles.map((role) => ({
        id: role.id,
        title: role.title,
        summary: role.summary,
        problemNow: role.problemNow,
        skills: parseTags(role.skillsJson),
        employerName: role.employer.name,
      })),
    };
  }

  async saveFitSummaries(rows: FitSeedRow[], generatedBy: string): Promise<number> {
    const eventId = await this.eventId();
    let count = 0;
    for (const row of rows) {
      await prisma.fitSummary.upsert({
        where: { roleId_candidateId: { roleId: row.roleId, candidateId: row.candidateId } },
        create: {
          eventId,
          roleId: row.roleId,
          candidateId: row.candidateId,
          digest: row.digest,
          sharedThemesJson: JSON.stringify(row.sharedThemes),
          questionsJson: JSON.stringify(row.questions),
          evidenceCoverage: row.evidenceCoverage,
          generatedBy,
        },
        update: {
          digest: row.digest,
          sharedThemesJson: JSON.stringify(row.sharedThemes),
          questionsJson: JSON.stringify(row.questions),
          evidenceCoverage: row.evidenceCoverage,
          generatedBy,
        },
      });
      count++;
    }
    return count;
  }

  async getAssessmentCatalog(): Promise<AssessmentSummary[]> {
    const eventId = await this.eventId();
    const assessments = await prisma.assessment.findMany({
      where: { eventId },
      orderBy: { order: "asc" },
    });
    return assessments.map(mapAssessmentSummary);
  }

  async getAssessmentResults(candidateId: string): Promise<AssessmentResultView[]> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: candidateInclude,
    });
    return candidate ? mapAssessmentResults(candidate) : [];
  }

  async getAssessmentAttemptView(attemptId: string, candidateId: string): Promise<AssessmentAttemptView | null> {
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });
    if (!attempt || attempt.candidateId !== candidateId) return null;
    const problems = parseProblemBank(attempt.assessment.problemsJson);
    return {
      id: attempt.id,
      assessment: mapAssessmentSummary(attempt.assessment),
      problems: publicProblems(problems),
      startedAt: attempt.startedAt.toISOString(),
      serverNow: new Date().toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      marking: attempt.submittedAt ? parseStoredMarking(attempt.resultsJson, attempt.score) : null,
      integrity: attempt.submittedAt ? parseIntegritySummary(attempt.integrityJson) : null,
    };
  }

  async startAssessmentAttempt(assessmentId: string, candidateId: string): Promise<AssessmentAttemptView> {
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new RepositoryError("not_found", "Assessment not found.");
    if (!assessment.playable) {
      throw new RepositoryError("assessment_not_playable", "This catalogue entry is not playable in the demo.");
    }
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { eventId: true },
    });
    if (!candidate || candidate.eventId !== assessment.eventId) {
      throw new RepositoryError("not_found", "Assessment not found for this candidate.");
    }

    const problems = parseProblemBank(assessment.problemsJson);
    if (problems.length === 0) {
      throw new RepositoryError("assessment_not_playable", "This assessment has no coding problems.");
    }

    const existing = await prisma.assessmentAttempt.findFirst({
      where: { assessmentId, candidateId },
    });
    if (existing?.submittedAt) {
      throw new RepositoryError("attempt_limit", "Your result for this assessment is final for this recruiting cycle.");
    }
    if (existing) {
      return {
        id: existing.id,
        assessment: mapAssessmentSummary(assessment),
        problems: publicProblems(problems),
        startedAt: existing.startedAt.toISOString(),
        serverNow: new Date().toISOString(),
        submittedAt: null,
        marking: null,
        integrity: null,
      };
    }

    const state = attemptState(0);
    if (!state.allowed) {
      throw new RepositoryError("attempt_limit", "Your result for this assessment is final for this recruiting cycle.");
    }

    let attempt;
    try {
      attempt = await prisma.assessmentAttempt.create({
        data: {
          assessmentId,
          candidateId,
          problemIdsJson: JSON.stringify(problems.map((problem) => problem.id)),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new RepositoryError("attempt_limit", "Your result for this assessment is final for this recruiting cycle.");
      }
      throw error;
    }
    return {
      id: attempt.id,
      assessment: mapAssessmentSummary(assessment),
      problems: publicProblems(problems),
      startedAt: attempt.startedAt.toISOString(),
      serverNow: new Date().toISOString(),
      submittedAt: null,
      marking: null,
      integrity: null,
    };
  }

  async submitAssessmentAttempt(
    attemptId: string,
    candidateId: string,
    submissions: Record<string, string>,
    assessmentId?: string,
    integrity?: IntegrityReport | null,
  ): Promise<AssessmentSubmissionView> {
    let attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });

    if (attempt && attempt.candidateId !== candidateId) {
      throw new RepositoryError("forbidden", "Not your attempt.");
    }
    if (attempt && assessmentId && attempt.assessmentId !== assessmentId) {
      throw new RepositoryError("forbidden", "That attempt belongs to a different assessment.");
    }
    if (attempt?.submittedAt) {
      throw new RepositoryError("attempt_closed", "This attempt is already submitted.");
    }

    // On the Vercel demo the SQLite file is copied per serverless instance. A
    // start request and the submit request can land on different instances, so
    // the attempt row may not exist here. Rebuild it from the assessment id,
    // while still rejecting any completed sitting for the same assessment.
    if (!attempt) {
      if (!assessmentId) throw new RepositoryError("not_found", "Attempt not found.");
      const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
      if (!assessment || !assessment.playable) {
        throw new RepositoryError("not_found", "Assessment not found.");
      }
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { eventId: true },
      });
      if (!candidate || candidate.eventId !== assessment.eventId) {
        throw new RepositoryError("not_found", "Assessment not found for this candidate.");
      }
      const problemsForAttempt = parseProblemBank(assessment.problemsJson);
      const conflict = await prisma.assessmentAttempt.findFirst({
        where: { assessmentId, candidateId },
        include: { assessment: true },
      });
      if (conflict) {
        if (conflict.submittedAt) {
          throw new RepositoryError("attempt_limit", "Your result for this assessment is final for this recruiting cycle.");
        }
        attempt = conflict;
      } else {
        try {
          attempt = await prisma.assessmentAttempt.create({
            data: {
              id: attemptId,
              assessmentId,
              candidateId,
              problemIdsJson: JSON.stringify(problemsForAttempt.map((problem) => problem.id)),
            },
            include: { assessment: true },
          });
        } catch (error) {
          if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
          attempt = await prisma.assessmentAttempt.findFirst({
            where: { assessmentId, candidateId },
            include: { assessment: true },
          });
          if (attempt?.submittedAt) {
            throw new RepositoryError("attempt_limit", "Your result for this assessment is final for this recruiting cycle.");
          }
          if (!attempt) throw new RepositoryError("attempt_limit", "This assessment is already in progress.");
        }
      }
    }

    if (!attempt) throw new RepositoryError("not_found", "Attempt not found.");
    const problems = parseProblemBank(attempt.assessment.problemsJson);
    if (problems.length === 0) throw new RepositoryError("assessment_not_playable", "This assessment has no coding problems.");
    // A timed or lockdown sitting can submit itself with blank answers; those
    // simply score zero. A manual submission must answer every problem.
    const autoSubmitted = Boolean(integrity?.autoSubmitted);
    const missing = problems.filter((problem) => !(submissions[problem.id] ?? "").trim());
    if (missing.length > 0 && !autoSubmitted) {
      throw new RepositoryError("invalid_claim", "Write an answer for every problem before submitting.");
    }

    const marking = markSubmissions(problems, submissions);
    const storedSubmissions = Object.fromEntries(
      problems.map((problem) => [problem.id, submissions[problem.id] ?? ""]),
    );
    const submittedAt = new Date();
    const integritySummary = summariseIntegrity({
      mode: isProctoringMode(attempt.assessment.proctoring) ? attempt.assessment.proctoring : "NONE",
      durationMinutes: attempt.assessment.durationMinutes,
      startedAt: attempt.startedAt,
      submittedAt,
      report: integrity ?? null,
    });
    await prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        submissionsJson: JSON.stringify(storedSubmissions),
        resultsJson: JSON.stringify(marking),
        score: marking.score,
        integrityJson: integritySummary ? JSON.stringify(integritySummary) : null,
        submittedAt,
      },
    });

    const results = await this.getAssessmentResults(candidateId);
    const result = results.find((entry) => entry.assessment.id === attempt.assessmentId);
    if (!result) throw new RepositoryError("not_found", "Assessment result was not saved.");
    return { marking, result };
  }

  async checkAssessmentAnswer(
    attemptId: string,
    candidateId: string,
    problemId: string,
    code: string,
  ): Promise<ProblemMark> {
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });
    if (!attempt) throw new RepositoryError("not_found", "Attempt not found.");
    if (attempt.candidateId !== candidateId) throw new RepositoryError("forbidden", "Not your attempt.");
    if (attempt.submittedAt) throw new RepositoryError("attempt_closed", "This attempt is already submitted.");
    const problems = parseProblemBank(attempt.assessment.problemsJson);
    const problem = problems.find((entry) => entry.id === problemId);
    if (!problem) throw new RepositoryError("not_found", "Problem not found in this attempt.");
    return checkExamples(problem, code);
  }

  async getInterestState(side: PersonaSide, actorId: string): Promise<InterestState> {
    const eventId = await this.eventId();
    const allowance =
      side === "candidate"
        ? await prisma.candidate.findUnique({
            where: { id: actorId },
            select: { priorityIntroAllowance: true, likeAllowance: true },
          })
        : await prisma.employer.findUnique({
            where: { id: actorId },
            select: { priorityIntroAllowance: true, likeAllowance: true },
          });
    const priorityAllowance = allowance?.priorityIntroAllowance ?? 1;
    const likeAllowance = allowance?.likeAllowance ?? (side === "candidate" ? 5 : 10);
    const [priorityUsed, received, likesUsed] = await Promise.all([
      prisma.decision.count({ where: priorityIntroUsageWhere(side, actorId, eventId) }),
      prisma.decision.count({ where: receivedPriorityIntrosWhere(side, actorId) }),
      prisma.decision.count({ where: likeUsageWhere(side, actorId, eventId) }),
    ]);
    return {
      total: priorityAllowance,
      used: priorityUsed,
      remaining: Math.max(0, priorityAllowance - priorityUsed),
      received,
      likesTotal: likeAllowance,
      likesUsed,
      likesRemaining: Math.max(0, likeAllowance - likesUsed),
    };
  }

  async acceptPriorityIntro(decisionId: string, side: PersonaSide, actorId: string): Promise<DecisionResult> {
    return prisma.$transaction(async (tx) => {
      const decision = await tx.decision.findUnique({
        where: { id: decisionId },
        include: { role: { include: { employer: true } }, candidate: true },
      });
      if (!decision || decision.action !== "PRIORITY_INTRO") {
        throw new RepositoryError("not_found", "Priority intro not found.");
      }
      if (side === "candidate") {
        if (decision.actorType !== "EMPLOYER" || decision.candidateId !== actorId) {
          throw new RepositoryError("forbidden", "This priority intro is not for you.");
        }
      } else if (decision.actorType !== "CANDIDATE" || decision.role.employerId !== actorId) {
        throw new RepositoryError("forbidden", "This priority intro is not for your team.");
      }
      if (decision.role.configStatus !== "LIVE") {
        throw new RepositoryError("invitation_closed", "This role is no longer open.");
      }

      const recipientType = side === "candidate" ? "CANDIDATE" : "EMPLOYER";
      const existing = await tx.decision.findUnique({
        where: {
          roleId_candidateId_actorType: {
            roleId: decision.roleId,
            candidateId: decision.candidateId,
            actorType: recipientType,
          },
        },
      });
      if (existing?.action === "PASS") {
        throw new RepositoryError("already_decided", "You already passed on this role.");
      }

      if (!existing) {
        await tx.decision.create({
          data: {
            eventId: decision.eventId,
            roleId: decision.roleId,
            candidateId: decision.candidateId,
            actorType: recipientType,
            action: "LIKE",
            source: "PRIORITY_INTRO_REPLY",
          },
        });
      }

      const match = await tx.match.findUnique({
        where: { roleId_candidateId: { roleId: decision.roleId, candidateId: decision.candidateId } },
      });
      const matchId =
        match?.id ??
        (
          await tx.match.create({
            data: {
              eventId: decision.eventId,
              roleId: decision.roleId,
              candidateId: decision.candidateId,
            },
          })
        ).id;

      const priorityUsed = await tx.decision.count({
        where: priorityIntroUsageWhere(side, actorId, decision.eventId),
      });
      const likesUsed = await tx.decision.count({
        where: likeUsageWhere(side, actorId, decision.eventId),
      });
      const priorityAllowance =
        side === "candidate"
          ? decision.candidate.priorityIntroAllowance
          : decision.role.employer.priorityIntroAllowance;
      const likeAllowance =
        side === "candidate" ? decision.candidate.likeAllowance : decision.role.employer.likeAllowance;

      return {
        action: "LIKE" as const,
        matched: true,
        matchId,
        priorityIntrosRemaining: remainingPriorityIntros(priorityAllowance, priorityUsed),
        likesRemaining: remainingLikes(likeAllowance, likesUsed),
      };
    });
  }

  async getCandidateFeed(candidateId: string): Promise<CandidateFeed> {
    const candidate = await this.getCandidateById(candidateId);
    if (!candidate) return { main: [], belowBar: [] };
    const eventId = await this.eventId();

    const [roles, candidateDecisions, employerDecisions, matches] = await Promise.all([
      prisma.role.findMany({ where: { eventId }, include: roleInclude, orderBy: [{ order: "asc" }] }),
      prisma.decision.findMany({
        where: { eventId, candidateId, actorType: "CANDIDATE" },
        select: { roleId: true, action: true },
      }),
      prisma.decision.findMany({
        where: { eventId, candidateId, actorType: "EMPLOYER" },
        select: { roleId: true, action: true },
      }),
      prisma.match.findMany({ where: { eventId, candidateId }, select: { roleId: true } }),
    ]);

    const candidateDecisionRoles = new Set(candidateDecisions.map((decision) => decision.roleId));
    const employerPassRoles = new Set(
      employerDecisions.filter((decision) => decision.action === "PASS").map((decision) => decision.roleId),
    );
    const interestedRoles = new Set(
      employerDecisions
        .filter((decision) => decision.action === "LIKE" || decision.action === "PRIORITY_INTRO")
        .map((decision) => decision.roleId),
    );
    const matchedRoles = new Set(matches.map((match) => match.roleId));

    const cards: CandidateFeedCard[] = [];
    for (const role of roles) {
      if (role.configStatus !== "LIVE" || !role.assessment?.playable) continue;
      if (candidateDecisionRoles.has(role.id) || employerPassRoles.has(role.id) || matchedRoles.has(role.id)) continue;
      const detail = mapRoleDetail(role);
      const evidence = evidenceFor(candidate, detail);
      cards.push({
        role: detail,
        evidence,
        state: feedState(evidence),
        signals: signalMatchesForRole(candidate, detail),
      });
    }

    const belowBar = cards.filter((card) => card.state === "BELOW").sort((left, right) => left.role.order - right.role.order);
    const main = cards.filter((card) => card.state !== "BELOW");
    const interested = main.filter((card) => interestedRoles.has(card.role.id));
    const discovery = main.filter((card) => !interestedRoles.has(card.role.id));

    return {
      main: composeFeed({
        interested,
        discovery,
        keyOf: (card) => card.role.id,
        salt: "candidate:" + candidateId,
      }),
      belowBar,
    };
  }

  private async buildEmployerFeed(roleId: string, employerId: string, discoveryOnly: boolean): Promise<EmployerFeed> {
    const role = await prisma.role.findUnique({ where: { id: roleId }, include: roleInclude });
    const empty: EmployerFeed = { main: [], belowBar: [], notEvidenced: [] };
    if (!role || role.employerId !== employerId || role.configStatus !== "LIVE") return empty;

    const roleDetail = mapRoleDetail(role);
    const [candidates, candidateDecisions, employerDecisions, matches, invitations] = await Promise.all([
      prisma.candidate.findMany({
        where: { eventId: role.eventId },
        include: candidateInclude,
        orderBy: { order: "asc" },
      }),
      prisma.decision.findMany({
        where: { roleId, actorType: "CANDIDATE" },
        select: { candidateId: true, action: true },
      }),
      prisma.decision.findMany({
        where: { roleId, actorType: "EMPLOYER" },
        select: { candidateId: true },
      }),
      prisma.match.findMany({ where: { roleId }, select: { candidateId: true } }),
      prisma.invitation.findMany({ where: { roleId }, select: { candidateId: true } }),
    ]);

    const candidateDecisionByCandidate = new Map(candidateDecisions.map((decision) => [decision.candidateId, decision.action] as const));
    const employerDecided = new Set(employerDecisions.map((decision) => decision.candidateId));
    const matched = new Set(matches.map((match) => match.candidateId));
    const invited = new Set(invitations.map((invitation) => invitation.candidateId));

    const cards: EmployerFeedCard[] = [];
    for (const row of candidates) {
      const candidate = mapCandidate(row);
      const action = candidateDecisionByCandidate.get(candidate.id);
      if (employerDecided.has(candidate.id) || matched.has(candidate.id) || invited.has(candidate.id)) continue;
      if (action === "PASS") continue;
      if (discoveryOnly && action) continue;
      if (!action && !candidate.discoveryOptIn) continue;

      const evidence = evidenceFor(candidate, roleDetail);
      cards.push({
        candidate,
        evidence,
        state: feedState(evidence),
        signals: signalMatchesForRole(candidate, roleDetail),
      });
    }

    const main = cards.filter((card) => card.state === "MET");
    const belowBar = cards.filter((card) => card.state === "BELOW").sort((left, right) => left.candidate.order - right.candidate.order);
    const notEvidenced = cards
      .filter((card) => card.state === "NOT_TAKEN")
      .sort((left, right) => left.candidate.order - right.candidate.order);

    const interested = main.filter((card) => candidateDecisionByCandidate.has(card.candidate.id));
    const discovery = main.filter((card) => !candidateDecisionByCandidate.has(card.candidate.id));

    return {
      main: composeFeed({
        interested,
        discovery,
        keyOf: (card) => card.candidate.id,
        salt: "employer:" + employerId + ":" + roleId,
      }),
      belowBar,
      notEvidenced,
    };
  }

  async getEmployerReview(roleId: string, candidateId: string, employerId: string): Promise<EmployerReview | null> {
    const role = await prisma.role.findUnique({ where: { id: roleId }, include: roleInclude });
    if (!role || role.employerId !== employerId || role.configStatus !== "LIVE") return null;

    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, include: candidateInclude });
    if (!candidate || candidate.eventId !== role.eventId) return null;

    const roleDetail = mapRoleDetail(role);
    const candidateDetail = mapCandidate(candidate);
    const evidence = evidenceFor(candidateDetail, roleDetail);
    return {
      role: roleDetail,
      candidate: candidateDetail,
      evidence,
      signals: signalMatchesForRole(candidateDetail, roleDetail),
      state: feedState(evidence),
    };
  }

  async getEmployerFeed(roleId: string, employerId: string): Promise<EmployerFeed> {
    return this.buildEmployerFeed(roleId, employerId, false);
  }

  async getDiscoveryLane(roleId: string, employerId: string): Promise<EmployerFeed> {
    return this.buildEmployerFeed(roleId, employerId, true);
  }

  private async validateRoleCard(employerId: string, input: RoleCardInput) {
    const employer = await prisma.employer.findUnique({
      where: { id: employerId },
      select: { eventId: true },
    });
    if (!employer) throw new RepositoryError("not_found", "Employer not found.");

    const rawRequirements =
      input.requirements && input.requirements.length > 0
        ? input.requirements
        : [{ assessmentId: input.assessmentId, requiredScore: input.requiredScore }];
    if (rawRequirements.length > 3) {
      throw new RepositoryError("role_card_incomplete", "Choose at most three assessment requirements.");
    }
    const assessmentIds = [...new Set(rawRequirements.map((requirement) => requirement.assessmentId))];
    const assessments = await prisma.assessment.findMany({ where: { id: { in: assessmentIds } } });
    const assessmentById = new Map(assessments.map((assessment) => [assessment.id, assessment] as const));
    const requirements = rawRequirements.map((requirement) => {
      const assessment = assessmentById.get(requirement.assessmentId);
      if (!assessment || assessment.eventId !== employer.eventId) {
        throw new RepositoryError("not_found", "Assessment not found for this event.");
      }
      if (!assessment.playable) {
        throw new RepositoryError("assessment_not_playable", "Only a playable assessment can publish a live role card.");
      }
      if (!Number.isInteger(requirement.requiredScore) || requirement.requiredScore < 0 || requirement.requiredScore > 100) {
        throw new RepositoryError("role_card_incomplete", "Every required score must be a whole number from 0 to 100.");
      }
      return {
        assessmentId: assessment.id,
        requiredScore: requirement.requiredScore,
        assessment: mapAssessmentSummary(assessment),
      };
    });

    const title = input.title.trim();
    const summary = input.summary.trim();
    if (title.length < 3 || title.length > 120) {
      throw new RepositoryError("role_card_incomplete", "Add a role title between 3 and 120 characters.");
    }
    if (summary.length < 10 || summary.length > 600) {
      throw new RepositoryError("role_card_incomplete", "Add a role description between 10 and 600 characters.");
    }
    if (input.signals.length > 4) {
      throw new RepositoryError("role_card_incomplete", "Choose at most four evidence signals.");
    }
    for (const signal of input.signals) {
      const unsafe = unsafeRoleSignal(signal);
      if (unsafe) throw new RepositoryError("role_card_incomplete", unsafe);
    }
    return { employer, requirements, primary: requirements[0] };
  }

  async createRoleCard(employerId: string, input: RoleCardInput): Promise<RoleDetail> {
    const validation = await this.validateRoleCard(employerId, input);
    const id = "role-" + randomUUID();
    const slug = slugify(input.title) + "-" + randomUUID().slice(0, 8);
    const order = (await prisma.role.aggregate({ where: { employerId }, _max: { order: true } }))._max.order ?? 0;
    const role = await prisma.role.create({
      data: {
        id,
        slug,
        eventId: (await prisma.employer.findUniqueOrThrow({ where: { id: employerId }, select: { eventId: true } })).eventId,
        employerId,
        title: input.title.trim(),
        employmentType: input.employmentType.trim() || "Full-time",
        workMode: input.workMode.trim() || "Hybrid",
        location: input.location.trim() || "Espoo",
        summary: input.summary.trim(),
        whyJoin: input.whyJoin.trim(),
        problemNow: input.problemNow.trim(),
        first90: input.first90.trim(),
        skillsJson: JSON.stringify(input.skills.slice(0, 12)),
        portfolioRequired: false,
        roleFamily: input.roleFamily,
        assessmentId: validation.primary.assessmentId,
        requiredScore: validation.primary.requiredScore,
        requirementsJson: JSON.stringify(validation.requirements),
        evidenceSignalsJson: JSON.stringify(input.signals.slice(0, 4)),
        configStatus: input.publish ? "LIVE" : "DRAFT",
        reviewOwnerName: input.reviewOwnerName.trim().slice(0, 120),
        reviewDueHours: 48,
        publishedAt: input.publish ? new Date() : null,
        order: order + 1,
      },
    });
    const detail = await this.getRoleById(role.id);
    if (!detail) throw new RepositoryError("not_found", "Role was not saved.");
    return detail;
  }

  async updateRoleCard(roleId: string, employerId: string, input: RoleCardInput): Promise<RoleDetail> {
    const existing = await prisma.role.findUnique({ where: { id: roleId } });
    if (!existing) throw new RepositoryError("not_found", "Role not found.");
    if (existing.employerId !== employerId) throw new RepositoryError("forbidden", "Not your role.");
    if (existing.configStatus === "CLOSED") {
      throw new RepositoryError("role_card_incomplete", "A closed role cannot be reopened in this cycle.");
    }
    const validation = await this.validateRoleCard(employerId, input);
    await prisma.role.update({
      where: { id: roleId },
      data: {
        title: input.title.trim(),
        employmentType: input.employmentType.trim() || existing.employmentType,
        workMode: input.workMode.trim() || existing.workMode,
        location: input.location.trim() || existing.location,
        summary: input.summary.trim(),
        whyJoin: input.whyJoin.trim(),
        problemNow: input.problemNow.trim(),
        first90: input.first90.trim(),
        skillsJson: JSON.stringify(input.skills.slice(0, 12)),
        roleFamily: input.roleFamily,
        assessmentId: validation.primary.assessmentId,
        requiredScore: validation.primary.requiredScore,
        requirementsJson: JSON.stringify(validation.requirements),
        evidenceSignalsJson: JSON.stringify(input.signals.slice(0, 4)),
        configStatus: input.publish ? "LIVE" : "DRAFT",
        reviewOwnerName: input.reviewOwnerName.trim().slice(0, 120),
        publishedAt: input.publish ? existing.publishedAt ?? new Date() : null,
      },
    });
    const detail = await this.getRoleById(roleId);
    if (!detail) throw new RepositoryError("not_found", "Role was not saved.");
    return detail;
  }

  async closeRole(roleId: string, employerId: string): Promise<number> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { employer: true },
    });
    if (!role) throw new RepositoryError("not_found", "Role not found.");
    if (role.employerId !== employerId) throw new RepositoryError("forbidden", "Not your role.");

    const [candidateYes, matches] = await Promise.all([
      prisma.decision.findMany({
        where: { roleId, actorType: "CANDIDATE", action: { in: ["LIKE", "PRIORITY_INTRO"] } },
        select: { candidateId: true },
      }),
      prisma.match.findMany({ where: { roleId }, select: { candidateId: true } }),
    ]);
    const matched = new Set(matches.map((match) => match.candidateId));
    let count = 0;
    await prisma.$transaction(async (tx) => {
      await tx.role.update({ where: { id: roleId }, data: { configStatus: "CLOSED" } });
      await tx.invitation.updateMany({
        where: { roleId, status: "PENDING" },
        data: { status: "WITHDRAWN", respondedAt: new Date() },
      });
      for (const decision of candidateYes) {
        if (matched.has(decision.candidateId)) continue;
        const existing = await tx.outcome.findUnique({
          where: { roleId_candidateId: { roleId, candidateId: decision.candidateId } },
        });
        if (existing) continue;
        await tx.outcome.create({
          data: {
            eventId: role.eventId,
            roleId,
            candidateId: decision.candidateId,
            kind: "ROLE_CLOSED",
            message: outcomeForRoleClose({ roleTitle: role.title, employerName: role.employer.name }).message,
          },
        });
        count++;
      }
    });
    return count;
  }

  private async invitationView(
    invitation: {
      id: string;
      message: string;
      status: string;
      createdAt: Date;
      respondedAt: Date | null;
      role: RolePayload;
      candidate: CandidatePayload;
      citedAttempt: (Prisma.AssessmentAttemptGetPayload<{ include: { assessment: true } }>) | null;
    },
    side: PersonaSide,
    actorId: string,
  ): Promise<InvitationView> {
    const role = mapRoleDetail(invitation.role);
    const candidateDetail = mapCandidate(invitation.candidate);
    const candidateSummary = mapCandidateSummary(invitation.candidate);
    let citedAssessment: AssessmentEvidence | null = null;
    if (invitation.citedAttempt?.score !== null && invitation.citedAttempt?.score !== undefined) {
      const assessment = mapAssessmentSummary(invitation.citedAttempt.assessment);
      citedAssessment = {
        assessment,
        score: invitation.citedAttempt.score,
        requiredScore: role.requiredScore ?? 0,
        meetsBar: role.requiredScore !== null && invitation.citedAttempt.score >= role.requiredScore,
        requirements: [
          {
            assessment,
            requiredScore: role.requiredScore ?? 0,
            score: invitation.citedAttempt.score,
            meets: role.requiredScore !== null && invitation.citedAttempt.score >= role.requiredScore,
            integrity: parseIntegritySummary(invitation.citedAttempt.integrityJson),
          },
        ],
        attemptCount: 1,
        lastSubmittedAt: invitation.citedAttempt.submittedAt?.toISOString() ?? null,
      };
    } else {
      citedAssessment = evidenceFor(candidateDetail, role);
    }

    const [match, employerDecision] = await Promise.all([
      prisma.match.findUnique({
        where: { roleId_candidateId: { roleId: invitation.role.id, candidateId: invitation.candidate.id } },
        select: { id: true },
      }),
      prisma.decision.findUnique({
        where: {
          roleId_candidateId_actorType: {
            roleId: invitation.role.id,
            candidateId: invitation.candidate.id,
            actorType: "EMPLOYER",
          },
        },
        select: { action: true },
      }),
    ]);

    return {
      id: invitation.id,
      message: invitation.message,
      status:
        invitation.status === "ACCEPTED" ||
        invitation.status === "DECLINED" ||
        invitation.status === "WITHDRAWN"
          ? invitation.status
          : "PENDING",
      createdAt: invitation.createdAt.toISOString(),
      respondedAt: invitation.respondedAt?.toISOString() ?? null,
      role,
      candidate: candidateSummary,
      employer: role.employer,
      citedAssessment,
      matched: Boolean(match),
      matchId: match?.id ?? null,
      canRespondAsEmployer:
        side === "employer" &&
        invitation.status === "ACCEPTED" &&
        !match &&
        (!employerDecision || (employerDecision.action !== "LIKE" && employerDecision.action !== "PRIORITY_INTRO")),
    };
  }

  async sendInvitation(input: InvitationInput): Promise<InvitationView> {
    const role = await prisma.role.findUnique({ where: { id: input.roleId }, include: roleInclude });
    if (!role) throw new RepositoryError("not_found", "Role not found.");
    if (role.employerId !== input.employerId) throw new RepositoryError("forbidden", "Not your role.");
    if (role.configStatus !== "LIVE") throw new RepositoryError("invitation_closed", "This role is not open.");
    const message = input.message.trim();
    if (message.length < 1 || message.length > 400) {
      throw new RepositoryError("invalid_reason", "An invitation message must be between 1 and 400 characters.");
    }

    const existingInvitation = await prisma.invitation.findUnique({
      where: {
        roleId_candidateId: {
          roleId: input.roleId,
          candidateId: input.candidateId,
        },
      },
    });
    if (existingInvitation) throw new RepositoryError("invitation_exists", "This candidate was already invited to this role.");

    const candidate = await prisma.candidate.findUnique({
      where: { id: input.candidateId },
      include: candidateInclude,
    });
    if (!candidate || candidate.eventId !== role.eventId) {
      throw new RepositoryError("not_found", "Candidate not found for this event.");
    }
    if (!candidate.discoveryOptIn) {
      throw new RepositoryError("forbidden", "This candidate has not opted into discovery.");
    }
    const existingDecision = await prisma.decision.findUnique({
      where: {
        roleId_candidateId_actorType: {
          roleId: input.roleId,
          candidateId: input.candidateId,
          actorType: "CANDIDATE",
        },
      },
    });
    if (existingDecision) throw new RepositoryError("already_decided", "This candidate already decided on the role.");

    const candidateDetail = mapCandidate(candidate);
    const roleDetail = mapRoleDetail(role);
    const evidence = evidenceFor(candidateDetail, roleDetail);
    if (!evidence || !evidence.meetsBar) {
      throw new RepositoryError("role_card_incomplete", "Invite only candidates who meet this role's stated assessment bar.");
    }
    const citedAttempt =
      input.citedAttemptId
        ? await prisma.assessmentAttempt.findUnique({
            where: { id: input.citedAttemptId },
            select: { id: true, candidateId: true, assessmentId: true },
          })
        : await prisma.assessmentAttempt.findFirst({
            where: {
              candidateId: input.candidateId,
              assessmentId: role.assessmentId ?? "",
              submittedAt: { not: null },
            },
            orderBy: { submittedAt: "desc" },
            select: { id: true, candidateId: true, assessmentId: true },
          });
    if (!citedAttempt || citedAttempt.candidateId !== input.candidateId || citedAttempt.assessmentId !== role.assessmentId) {
      throw new RepositoryError("role_card_incomplete", "This invitation needs a completed assessment result.");
    }

    const invitation = await prisma.invitation.create({
      data: {
        eventId: role.eventId,
        roleId: input.roleId,
        candidateId: input.candidateId,
        message,
        citedAttemptId: citedAttempt.id,
        status: "PENDING",
      },
    });
    const view = (await this.getInvitations("employer", input.employerId)).find((entry) => entry.id === invitation.id);
    if (!view) throw new RepositoryError("not_found", "Invitation was not saved.");
    return view;
  }

  async getInvitations(side: PersonaSide, actorId: string): Promise<InvitationView[]> {
    const invitations = await prisma.invitation.findMany({
      where: side === "candidate" ? { candidateId: actorId } : { role: { employerId: actorId } },
      include: {
        role: { include: roleInclude },
        candidate: { include: candidateInclude },
        citedAttempt: { include: { assessment: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Promise.all(invitations.map((invitation) => this.invitationView(invitation, side, actorId)));
  }

  async respondToInvitation(
    invitationId: string,
    side: PersonaSide,
    actorId: string,
    action: "ACCEPT" | "DECLINE",
  ): Promise<{ invitation: InvitationView; matched: boolean; matchId: string | null }> {
    if (side !== "candidate") throw new RepositoryError("forbidden", "Only the candidate can respond to an invitation.");
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { role: { include: { employer: true } } },
    });
    if (!invitation) throw new RepositoryError("not_found", "Invitation not found.");
    if (invitation.candidateId !== actorId) throw new RepositoryError("forbidden", "Not your invitation.");
    if (invitation.status !== "PENDING") throw new RepositoryError("invitation_closed", "This invitation is already closed.");
    if (invitation.role.configStatus !== "LIVE") throw new RepositoryError("invitation_closed", "This role is no longer open.");

    let matched = false;
    let matchId: string | null = null;
    await prisma.$transaction(async (tx) => {
      if (action === "DECLINE") {
        await tx.invitation.update({
          where: { id: invitationId },
          data: { status: "DECLINED", respondedAt: new Date() },
        });
        return;
      }

      await tx.invitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });

      const candidateDecision = await tx.decision.findUnique({
        where: {
          roleId_candidateId_actorType: {
            roleId: invitation.roleId,
            candidateId: invitation.candidateId,
            actorType: "CANDIDATE",
          },
        },
      });
      if (candidateDecision?.action === "PASS") {
        throw new RepositoryError("already_decided", "You already passed on this role.");
      }
      if (!candidateDecision) {
        await tx.decision.create({
          data: {
            eventId: invitation.eventId,
            roleId: invitation.roleId,
            candidateId: invitation.candidateId,
            actorType: "CANDIDATE",
            action: "LIKE",
            source: "INVITATION_ACCEPT",
          },
        });
      }
      const employerDecision = await tx.decision.findUnique({
        where: {
          roleId_candidateId_actorType: {
            roleId: invitation.roleId,
            candidateId: invitation.candidateId,
            actorType: "EMPLOYER",
          },
        },
      });
      if (employerDecision && actionCountsAsYes(employerDecision.action)) {
        const match = await tx.match.upsert({
          where: { roleId_candidateId: { roleId: invitation.roleId, candidateId: invitation.candidateId } },
          update: {},
          create: {
            eventId: invitation.eventId,
            roleId: invitation.roleId,
            candidateId: invitation.candidateId,
          },
        });
        matched = true;
        matchId = match.id;
      }
    });

    const view = (await this.getInvitations("candidate", actorId)).find((entry) => entry.id === invitationId);
    if (!view) throw new RepositoryError("not_found", "Invitation not found.");
    return { invitation: view, matched, matchId };
  }

  async respondToAcceptedInvitation(invitationId: string, employerId: string): Promise<DecisionResult> {
    return prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { id: invitationId },
        include: {
          role: { include: { employer: true } },
          candidate: { select: { priorityIntroAllowance: true, likeAllowance: true } },
        },
      });
      if (!invitation) throw new RepositoryError("not_found", "Invitation not found.");
      if (invitation.role.employerId !== employerId) throw new RepositoryError("forbidden", "Not your invitation.");
      if (invitation.status !== "ACCEPTED") throw new RepositoryError("invitation_closed", "The candidate has not accepted this invitation.");
      if (invitation.role.configStatus !== "LIVE") throw new RepositoryError("invitation_closed", "This role is not open.");

      const candidateDecision = await tx.decision.findUnique({
        where: {
          roleId_candidateId_actorType: {
            roleId: invitation.roleId,
            candidateId: invitation.candidateId,
            actorType: "CANDIDATE",
          },
        },
      });
      if (!candidateDecision || !actionCountsAsYes(candidateDecision.action)) {
        throw new RepositoryError("invitation_closed", "The candidate has not expressed interest.");
      }

      let employerDecision = await tx.decision.findUnique({
        where: {
          roleId_candidateId_actorType: {
            roleId: invitation.roleId,
            candidateId: invitation.candidateId,
            actorType: "EMPLOYER",
          },
        },
      });
      if (employerDecision?.action === "PASS") {
        throw new RepositoryError("already_decided", "You already passed on this candidate.");
      }
      if (!employerDecision) {
        employerDecision = await tx.decision.create({
          data: {
            eventId: invitation.eventId,
            roleId: invitation.roleId,
            candidateId: invitation.candidateId,
            actorType: "EMPLOYER",
            action: "LIKE",
            source: "INVITATION_REPLY",
          },
        });
      }

      const match = await tx.match.upsert({
        where: { roleId_candidateId: { roleId: invitation.roleId, candidateId: invitation.candidateId } },
        update: {},
        create: {
          eventId: invitation.eventId,
          roleId: invitation.roleId,
          candidateId: invitation.candidateId,
        },
      });

      const [priorityUsed, likesUsed] = await Promise.all([
        tx.decision.count({
          where: priorityIntroUsageWhere("employer", employerId, invitation.eventId),
        }),
        tx.decision.count({
          where: likeUsageWhere("employer", employerId, invitation.eventId),
        }),
      ]);
      return {
        action: "LIKE" as const,
        matched: true,
        matchId: match.id,
        priorityIntrosRemaining: remainingPriorityIntros(invitation.role.employer.priorityIntroAllowance, priorityUsed),
        likesRemaining: remainingLikes(invitation.role.employer.likeAllowance, likesUsed),
      };
    });
  }

  async getCandidateUpdates(candidateId: string): Promise<CandidateUpdate[]> {
    const [decisions, invitations, outcomes, matches] = await Promise.all([
      prisma.decision.findMany({
        where: { candidateId, actorType: "CANDIDATE", action: { in: ["LIKE", "PRIORITY_INTRO"] } },
        include: { role: { include: { employer: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invitation.findMany({
        where: { candidateId },
        include: { role: { include: { employer: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.outcome.findMany({
        where: { candidateId },
        include: { role: { include: { employer: true } } },
        orderBy: { deliveredAt: "desc" },
      }),
      prisma.match.findMany({ where: { candidateId }, select: { id: true, roleId: true } }),
    ]);
    const matchByRole = new Map(matches.map((match) => [match.roleId, match.id] as const));
    const outcomeByRole = new Map(outcomes.map((outcome) => [outcome.roleId, outcome] as const));

    const updates: CandidateUpdate[] = [];
    for (const decision of decisions) {
      if (outcomeByRole.has(decision.roleId)) continue;
      const matchId = matchByRole.get(decision.roleId) ?? null;
      updates.push({
        id: "interest-" + decision.id,
        type: "INTEREST",
        status: matchId ? "MATCHED" : "WAITING",
        roleId: decision.roleId,
        roleTitle: decision.role.title,
        employerName: decision.role.employer.name,
        matchId,
        message: null,
        createdAt: decision.createdAt.toISOString(),
      });
    }
    for (const invitation of invitations) {
      updates.push({
        id: "invitation-" + invitation.id,
        type: "INVITATION",
        status: invitation.status,
        roleId: invitation.roleId,
        roleTitle: invitation.role.title,
        employerName: invitation.role.employer.name,
        matchId: matchByRole.get(invitation.roleId) ?? null,
        message: invitation.message,
        createdAt: invitation.createdAt.toISOString(),
      });
    }
    for (const outcome of outcomes) {
      updates.push({
        id: "outcome-" + outcome.id,
        type: "OUTCOME",
        status: outcome.kind,
        roleId: outcome.roleId,
        roleTitle: outcome.role.title,
        employerName: outcome.role.employer.name,
        matchId: null,
        message: outcome.message,
        createdAt: outcome.deliveredAt.toISOString(),
      });
    }
    return updates.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }

  async updateMatchStage(matchId: string, employerId: string, stage: MatchStage): Promise<MatchDetail> {
    if (!isMatchStage(stage)) throw new RepositoryError("invalid_stage", "Unknown match stage.");
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { role: { include: { employer: true } } },
    });
    if (!match) throw new RepositoryError("not_found", "Match not found.");
    if (match.role.employerId !== employerId) throw new RepositoryError("forbidden", "Not your match.");
    if (match.stage === "CLOSED" && stage !== "CLOSED") {
      throw new RepositoryError("invalid_stage", "A closed match cannot be reopened.");
    }
    if (!availableStages(match.stage).includes(stage)) {
      throw new RepositoryError("invalid_stage", "That stage is not available from the current stage.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: { stage, stageUpdatedAt: new Date() },
      });
      if (stage === "CLOSED") {
        const existing = await tx.outcome.findUnique({
          where: { roleId_candidateId: { roleId: match.roleId, candidateId: match.candidateId } },
        });
        if (!existing) {
          await tx.outcome.create({
            data: {
              eventId: match.eventId,
              roleId: match.roleId,
              candidateId: match.candidateId,
              kind: "AFTER_CONVERSATION",
              message: outcomeForConversation({ roleTitle: match.role.title, employerName: match.role.employer.name }).message,
            },
          });
        }
      }
    });

    const detail = await this.getMatch(matchId, "employer", employerId);
    if (!detail) throw new RepositoryError("not_found", "Match not found.");
    return detail;
  }

  async closeMatch(matchId: string, employerId: string): Promise<MatchDetail> {
    return this.updateMatchStage(matchId, employerId, "CLOSED");
  }

  async updateCandidateProfile(
    candidateId: string,
    input: {
      headline?: string;
      bio?: string;
      location?: string;
      interests?: string[];
      availability?: string;
      discoveryOptIn?: boolean;
    },
  ): Promise<CandidateDetail> {
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new RepositoryError("not_found", "Candidate not found.");

    const headline = input.headline?.trim() ?? candidate.headline;
    const bio = input.bio?.trim() ?? candidate.bio;
    const location = input.location?.trim() ?? candidate.location;
    const availability = input.availability?.trim() ?? candidate.availability;
    if (headline.length < 3 || headline.length > 120) {
      throw new RepositoryError("invalid_claim", "Headline must be between 3 and 120 characters.");
    }
    if (bio.length < 10 || bio.length > 700) {
      throw new RepositoryError("invalid_claim", "Bio must be between 10 and 700 characters.");
    }
    if (availability.length > 160) {
      throw new RepositoryError("invalid_claim", "Availability must be 160 characters or fewer.");
    }

    const data: Prisma.CandidateUpdateInput = {
      headline,
      bio,
      location,
      availability,
      ...(input.interests ? { interestsJson: JSON.stringify(input.interests.map((item) => item.trim()).filter(Boolean).slice(0, 8)) } : {}),
      ...(typeof input.discoveryOptIn === "boolean" ? { discoveryOptIn: input.discoveryOptIn } : {}),
    };

    await prisma.$transaction(async (tx) => {
      await tx.candidate.update({ where: { id: candidateId }, data });
      if (input.discoveryOptIn === false) {
        await tx.invitation.updateMany({
          where: { candidateId, status: "PENDING" },
          data: { status: "WITHDRAWN", respondedAt: new Date() },
        });
      }
    });

    const updated = await this.getCandidateById(candidateId);
    if (!updated) throw new RepositoryError("not_found", "Candidate not found.");
    return updated;
  }
  // -------------------------------------------------------------------------
  // Pre-screen
  // -------------------------------------------------------------------------

  private buildScreeningContext(
    role: RoleDetail,
    candidate: CandidateDetail,
    run: ScreeningRunPayload | null,
    employerName: string,
    reviewerName: string,
    workSamples: WorkSampleBreakdown[] = [],
  ): ScreeningPacket {
    const frozenPlan =
      run && run.status !== "OPEN" && run.decisionPlanJson
        ? parseScreeningPlan(run.decisionPlanJson, role.screeningPlan)
        : null;
    const plan = frozenPlan ?? role.screeningPlan;
    const planVersion = frozenPlan ? run?.decisionPlanVersion ?? role.screeningPlanVersion : role.screeningPlanVersion;
    const evidence = evidenceFor(candidate, role);
    const signals = signalMatchesForRole(candidate, role);
    const criterionChecks = run ? parseCriterionChecks(run.criterionChecksJson) : [];
    const claimChecks = run ? parseClaimChecks(run.claimChecksJson) : [];
    const criteria = evaluateCriteria(
      plan,
      {
        assessmentResults: candidate.assessmentResults.map((result) => ({
          assessmentId: result.assessment.id,
          score: result.score,
          assessment: { title: result.assessment.title, version: result.assessment.version },
        })),
        signalMatches: signals.map((signal) => ({
          signalId: signal.signal.id,
          status: signal.status,
          factIds: signal.factIds,
          explanation: signal.explanation,
        })),
      },
      criterionChecks,
    );
    const claims = evaluateClaims(claimInputsFor(candidate), claimChecks);
    const summary = summarisePacket(criteria, claims);
    const kit = buildInterviewKit({
      roleTitle: role.title,
      criteria,
      claims,
      workSamples: workSamples.map((sample) => ({
        assessmentTitle: sample.title,
        problems: sample.problems.map((problem) => ({ title: problem.title, passed: problem.passed, total: problem.total })),
      })),
    });
    const fallbackRun = mapScreeningRun({
      id: "unopened",
      eventId: role.employer.id,
      roleId: role.id,
      candidateId: candidate.id,
      stage: "EVIDENCE",
      status: "OPEN",
      claimChecksJson: "[]",
      criterionChecksJson: "[]",
      notesJson: "[]",
      decisionReason: null,
      decisionBasis: null,
      decisionPlanJson: null,
      decisionPlanVersion: null,
      decidedBy: null,
      decidedAt: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      events: [],
    });

    return {
      role,
      candidate,
      evidence,
      state: feedState(evidence),
      signals,
      plan,
      criteria,
      claims,
      claimSummary: summariseClaims(claims),
      summary,
      kit,
      run: run ? mapScreeningRun(run) : fallbackRun,
      employerName,
      reviewerName,
      planVersion,
      currentPlanVersion: role.screeningPlanVersion,
      planIsCurrent: planVersion === role.screeningPlanVersion,
      workSamples,
    };
  }

  private async workSamplesFor(role: RoleDetail, candidate: CandidateDetail): Promise<WorkSampleBreakdown[]> {
    const requirements = role.requirements.filter((requirement) => requirement.assessment);
    if (requirements.length === 0) return [];
    const attempts = await prisma.assessmentAttempt.findMany({
      where: {
        candidateId: candidate.id,
        assessmentId: { in: requirements.map((requirement) => requirement.assessmentId) },
      },
      include: { assessment: true },
    });
    const attemptByAssessment = new Map(attempts.map((attempt) => [attempt.assessmentId, attempt] as const));
    return requirements.map((requirement) => {
      const assessment = requirement.assessment!;
      const attempt = attemptByAssessment.get(requirement.assessmentId);
      const marking = attempt ? parseStoredMarking(attempt.resultsJson, attempt.score) : null;
      return {
        assessmentId: requirement.assessmentId,
        title: assessment.title,
        version: assessment.version,
        score: attempt?.score ?? null,
        requiredScore: requirement.requiredScore,
        problems: marking?.problems ?? [],
      } satisfies WorkSampleBreakdown;
    });
  }

  private async findScreeningRun(roleId: string, candidateId: string): Promise<ScreeningRunPayload | null> {
    return prisma.screeningRun.findUnique({
      where: { roleId_candidateId: { roleId, candidateId } },
      include: screeningRunInclude,
    });
  }

  private async ensureScreeningRun(role: RoleDetail, candidate: CandidateDetail, employerName: string): Promise<ScreeningRunPayload> {
    const existing = await this.findScreeningRun(role.id, candidate.id);
    if (existing) return existing;
    const event = await prisma.role.findUnique({ where: { id: role.id }, select: { eventId: true } });
    if (!event) throw new RepositoryError("not_found", "Role not found.");
    try {
      return await prisma.screeningRun.create({
        data: {
          eventId: event.eventId,
          roleId: role.id,
          candidateId: candidate.id,
          stage: "EVIDENCE",
          status: "OPEN",
          events: {
            create: {
              kind: "OPENED",
              detail: "Opened the pre-screen record.",
              actor: employerName,
            },
          },
        },
        include: screeningRunInclude,
      });
    } catch {
      const raced = await this.findScreeningRun(role.id, candidate.id);
      if (!raced) throw new RepositoryError("not_found", "Could not open the screening record.");
      return raced;
    }
  }

  async getScreeningRoles(employerId: string): Promise<ScreeningRoleSummary[]> {
    const employer = await prisma.employer.findUnique({ where: { id: employerId }, include: employerInclude });
    if (!employer) return [];
    const employerDetail = mapEmployer(employer);
    const roles = employerDetail.roles
      .filter((role) => role.configStatus === "LIVE")
      .sort((left, right) => left.order - right.order);

    const summaries = await Promise.all(
      roles.map(async (role) => {
        const queue = await this.getScreeningQueue(role.id, employerId);
        const items = queue?.items ?? [];
        const counts = {
          total: items.length,
          inReview: items.filter((item) => (item.run?.status ?? "OPEN") === "OPEN").length,
          advanced: items.filter((item) => item.run?.status === "ADVANCE").length,
          held: items.filter((item) => item.run?.status === "HOLD").length,
          declined: items.filter((item) => item.run?.status === "DECLINE").length,
          needsChecking: items.filter((item) => (item.run?.status ?? "OPEN") === "OPEN" && item.openItems > 0).length,
          readyToDiscuss: items.filter((item) => (item.run?.status ?? "OPEN") === "OPEN" && item.summary.state === "ENOUGH_TO_DISCUSS").length,
        };
        const activity = items
          .map((item) => item.run?.updatedAt ?? null)
          .filter((value): value is string => Boolean(value))
          .sort()
          .at(-1) ?? null;
        return {
          role,
          plan: role.screeningPlan,
          counts,
          evidenceState: null,
          lastActivityAt: activity,
        } satisfies ScreeningRoleSummary;
      }),
    );
    return summaries;
  }

  async getScreeningQueue(roleId: string, employerId: string): Promise<{ role: RoleDetail; items: ScreeningQueueItem[] } | null> {
    const role = await prisma.role.findUnique({ where: { id: roleId }, include: roleInclude });
    if (!role || role.employerId !== employerId || role.configStatus !== "LIVE") return null;
    const roleDetail = mapRoleDetail(role);
    const employerName = role.employer.contactName || role.employer.name;

    const [candidates, runs, decisions, invitations, matches] = await Promise.all([
      prisma.candidate.findMany({
        where: { eventId: role.eventId },
        include: candidateInclude,
        orderBy: { order: "asc" },
      }),
      prisma.screeningRun.findMany({ where: { roleId }, include: screeningRunInclude }),
      prisma.decision.findMany({ where: { roleId }, select: { candidateId: true } }),
      prisma.invitation.findMany({ where: { roleId }, select: { candidateId: true } }),
      prisma.match.findMany({ where: { roleId }, select: { candidateId: true } }),
    ]);
    const runByCandidate = new Map(runs.map((run) => [run.candidateId, run] as const));
    const inPipeline = new Set([
      ...decisions.map((decision) => decision.candidateId),
      ...invitations.map((invitation) => invitation.candidateId),
      ...matches.map((match) => match.candidateId),
      ...runs.map((run) => run.candidateId),
    ]);
    const requirementIds = new Set(roleDetail.requirements.map((requirement) => requirement.assessmentId));

    const items: ScreeningQueueItem[] = [];
    for (const row of candidates) {
      const candidate = mapCandidate(row);
      const hasResult = candidate.assessmentResults.some(
        (result) => requirementIds.has(result.assessment.id) && result.score !== null,
      );
      if (!hasResult && !inPipeline.has(candidate.id)) continue;
      const packet = this.buildScreeningContext(roleDetail, candidate, runByCandidate.get(candidate.id) ?? null, role.employer.name, employerName);
      items.push({
        candidate: packet.candidate,
        evidence: packet.evidence,
        state: packet.state,
        signals: packet.signals,
        plan: packet.plan,
        criteria: packet.criteria,
        claims: packet.claims,
        claimSummary: packet.claimSummary,
        summary: packet.summary,
        kit: packet.kit,
        openItems: countOpenItems(packet.criteria, packet.claims),
        run: packet.run.id === "unopened" ? null : packet.run,
      });
    }
    // Event order, never evidence order: nothing here ranks a person.
    items.sort((left, right) => left.candidate.order - right.candidate.order);
    return { role: roleDetail, items };
  }

  async getScreeningPacket(roleId: string, candidateId: string, employerId: string): Promise<ScreeningPacket | null> {
    const role = await prisma.role.findUnique({ where: { id: roleId }, include: roleInclude });
    if (!role || role.employerId !== employerId || role.configStatus !== "LIVE") return null;
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, include: candidateInclude });
    if (!candidate || candidate.eventId !== role.eventId) return null;
    const roleDetail = mapRoleDetail(role);
    const candidateDetail = mapCandidate(candidate);
    const reviewerName = role.employer.contactName || role.employer.name;
    const run = await this.ensureScreeningRun(roleDetail, candidateDetail, reviewerName);
    const workSamples = await this.workSamplesFor(roleDetail, candidateDetail);
    return this.buildScreeningContext(roleDetail, candidateDetail, run, role.employer.name, reviewerName, workSamples);
  }

  async updateScreeningClaim(input: ScreeningClaimInput): Promise<ScreeningPacket> {
    const packet = await this.getScreeningPacket(input.roleId, input.candidateId, input.employerId);
    if (!packet) throw new RepositoryError("not_found", "Screening record not found.");
    const fact = packet.candidate.facts.find((entry) => entry.id === input.factId);
    if (!fact) throw new RepositoryError("not_found", "Claim not found on this record.");
    if (input.status !== "VERIFIED" && input.status !== "LINK_ONLY" && input.status !== "NEEDS_CONVERSATION" && input.status !== "NOT_CHECKABLE") {
      throw new RepositoryError("invalid_screening", "Unknown claim check.");
    }

    const checks = packet.run.claimChecks;
    const existing = checks.find((check) => check.factId === input.factId);
    const note = input.note === undefined ? existing?.note : input.note?.trim().slice(0, 600) ?? undefined;
    const next = checks.filter((check) => check.factId !== input.factId);
    next.push({ factId: input.factId, status: input.status, note, updatedAt: new Date().toISOString() });
    const detail =
      input.status === "VERIFIED"
        ? "Claim checked against its artifact."
        : input.status === "NEEDS_CONVERSATION"
          ? "Claim saved for the conversation."
          : input.status === "NOT_CHECKABLE"
            ? "Claim marked not checkable from the record."
            : "Artifact opens; the claim is still unchecked.";

    await prisma.screeningRun.update({
      where: { id: packet.run.id },
      data: {
        claimChecksJson: JSON.stringify(next),
        stage: "VERIFY",
        events: { create: { kind: "CLAIM_CHECKED", detail, actor: packet.reviewerName } },
      },
    });
    const updated = await this.getScreeningPacket(input.roleId, input.candidateId, input.employerId);
    if (!updated) throw new RepositoryError("not_found", "Screening record not found.");
    return updated;
  }

  async addScreeningNote(input: ScreeningNoteInput): Promise<ScreeningPacket> {
    const body = input.body.trim();
    if (body.length < 2) throw new RepositoryError("invalid_screening", "Write a note before saving.");
    if (body.length > 2000) throw new RepositoryError("invalid_screening", "Keep the note under 2,000 characters.");
    const packet = await this.getScreeningPacket(input.roleId, input.candidateId, input.employerId);
    if (!packet) throw new RepositoryError("not_found", "Screening record not found.");
    const notes = [...packet.run.notes];
    notes.push({
      id: randomUUID(),
      body,
      author: packet.reviewerName,
      createdAt: new Date().toISOString(),
    });
    await prisma.screeningRun.update({
      where: { id: packet.run.id },
      data: {
        notesJson: JSON.stringify(notes.slice(-50)),
        events: { create: { kind: "NOTE_ADDED", detail: body.slice(0, 140), actor: packet.reviewerName } },
      },
    });
    const updated = await this.getScreeningPacket(input.roleId, input.candidateId, input.employerId);
    if (!updated) throw new RepositoryError("not_found", "Screening record not found.");
    return updated;
  }

  async saveScreeningDecision(input: ScreeningDecisionInput): Promise<ScreeningPacket> {
    const packet = await this.getScreeningPacket(input.roleId, input.candidateId, input.employerId);
    if (!packet) throw new RepositoryError("not_found", "Screening record not found.");
    const allowed = new Set(packet.plan.map((criterion) => criterion.id));
    const criterionChecks: CriterionCheck[] = input.criterionChecks
      .filter((check) => allowed.has(check.criterionId))
      .map((check) => ({
        criterionId: check.criterionId,
        rating: check.rating,
        note: check.note?.trim().slice(0, 600) || undefined,
      }));
    const draft = {
      decision: input.decision,
      reason: input.reason,
      criterionChecks,
      confirmed: input.confirmed,
    };
    const errors = validateScreeningDecision(draft);
    if (errors.length) throw new RepositoryError("invalid_screening_decision", errors.join(" "));

    const basis = decisionBasis(criterionChecks, packet.plan);
    const reason = input.reason.trim().slice(0, 1200);
    await prisma.screeningRun.update({
      where: { id: packet.run.id },
      data: {
        status: input.decision,
        stage: "DECISION",
        criterionChecksJson: JSON.stringify(criterionChecks),
        decisionReason: reason,
        decisionBasis: basis || null,
        decisionPlanJson: serializeScreeningPlan(packet.plan),
        decisionPlanVersion: packet.planVersion,
        decidedBy: packet.reviewerName,
        decidedAt: new Date(),
        events: {
          create: {
            kind: "DECISION_RECORDED",
            detail: DECISION_LABEL[input.decision] + ": " + reason.slice(0, 240),
            actor: packet.reviewerName,
          },
        },
      },
    });
    const updated = await this.getScreeningPacket(input.roleId, input.candidateId, input.employerId);
    if (!updated) throw new RepositoryError("not_found", "Screening record not found.");
    return updated;
  }

  async reopenScreeningDecision(input: { roleId: string; candidateId: string; employerId: string }): Promise<ScreeningPacket> {
    const packet = await this.getScreeningPacket(input.roleId, input.candidateId, input.employerId);
    if (!packet) throw new RepositoryError("not_found", "Screening record not found.");
    if (packet.run.status === "OPEN") return packet;
    await prisma.screeningRun.update({
      where: { id: packet.run.id },
      data: {
        status: "OPEN",
        stage: "VERIFY",
        decidedAt: null,
        decidedBy: null,
        decisionReason: null,
        decisionBasis: null,
        decisionPlanJson: null,
        decisionPlanVersion: null,
        events: { create: { kind: "DECISION_REOPENED", detail: "Reopened for more evidence.", actor: packet.reviewerName } },
      },
    });
    const updated = await this.getScreeningPacket(input.roleId, input.candidateId, input.employerId);
    if (!updated) throw new RepositoryError("not_found", "Screening record not found.");
    return updated;
  }

  async getRecentScreeningDecisions(employerId: string, limit = 6): Promise<ScreeningDecisionRow[]> {
    const runs = await prisma.screeningRun.findMany({
      where: {
        status: { in: ["ADVANCE", "HOLD", "DECLINE"] },
        role: { employerId },
      },
      orderBy: { decidedAt: "desc" },
      take: Math.min(Math.max(limit, 1), 20),
      include: {
        role: { select: { id: true, title: true } },
        candidate: { select: { id: true, name: true, monogram: true, palette: true } },
      },
    });
    return runs.map((run) => ({
      runId: run.id,
      roleId: run.role.id,
      roleTitle: run.role.title,
      candidateId: run.candidate.id,
      candidateName: run.candidate.name,
      candidateMonogram: run.candidate.monogram,
      candidatePalette: run.candidate.palette,
      status: run.status as ScreeningDecisionRow["status"],
      reason: run.decisionReason,
      basis: run.decisionBasis,
      decidedBy: run.decidedBy,
      decidedAt: run.decidedAt?.toISOString() ?? null,
    }));
  }

  async saveScreeningPlan(roleId: string, employerId: string, criteria: ScreeningCriterion[]): Promise<RoleDetail> {
    const role = await prisma.role.findUnique({ where: { id: roleId }, include: roleInclude });
    if (!role || role.employerId !== employerId) throw new RepositoryError("not_found", "Role not found.");
    const clean = criteria.filter(isScreeningCriterion).slice(0, 7);
    if (clean.length !== criteria.length || clean.length === 0) {
      throw new RepositoryError("invalid_screening_plan", "Each criterion needs a label, a kind, a source and a question.");
    }
    if (new Set(clean.map((criterion) => criterion.id)).size !== clean.length) {
      throw new RepositoryError("invalid_screening_plan", "Criterion ids must be unique.");
    }
    const employer = await prisma.employer.findUnique({ where: { id: employerId }, select: { contactName: true, name: true } });
    await prisma.role.update({
      where: { id: roleId },
      data: {
        screeningPlanJson: serializeScreeningPlan(clean),
        screeningPlanUpdatedAt: new Date(),
        screeningPlanUpdatedBy: employer?.contactName || employer?.name || "Hiring team",
        screeningPlanVersion: { increment: 1 },
      },
    });
    const updated = await this.getRoleById(roleId);
    if (!updated) throw new RepositoryError("not_found", "Role not found.");
    return updated;
  }

}

export const repository = new PrismaRecruitmentRepository();
