import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canCreateMatch, canUsePriorityIntro, remainingPriorityIntros } from "@/lib/matching";
import { parseFactMeta } from "@/lib/fact-meta";
import {
  RepositoryError,
  type AiRunView,
  type CandidateDetail,
  type CandidateSummary,
  type DecisionAction,
  type DecisionResult,
  type EmployerBrief,
  type EmployerDetail,
  type EventView,
  type FactView,
  type FitInputs,
  type FitSeedRow,
  type FitSummaryView,
  type FitTheme,
  type LinkCheckView,
  type LinkStatus,
  type MatchDetail,
  type MatchSummary,
  type MessageView,
  type NavCounts,
  type NewFactInput,
  type PersonaSide,
  type Provenance,
  type RecruitmentRepository,
  type RoleDetail,
  type RoleSummary,
  type PriorityIntroInboxItem,
  type PriorityIntroState,
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
});

const roleInclude = Prisma.validator<Prisma.RoleInclude>()({
  employer: {
    include: { prompts: { orderBy: { order: "asc" } } },
  },
});

const employerInclude = Prisma.validator<Prisma.EmployerInclude>()({
  prompts: { orderBy: { order: "asc" } },
  roles: { orderBy: { order: "asc" } },
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
    order: candidate.order,
  };
}

function mapCandidate(candidate: CandidatePayload): CandidateDetail {
  return {
    ...mapCandidateSummary(candidate),
    facts: candidate.facts.map(mapFact),
  };
}

function mapEmployerBrief(employer: EmployerBrief): EmployerBrief {
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
  };
}

function mapRoleDetail(role: RolePayload): RoleDetail {
  const employer = mapEmployerBrief(role.employer);
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
    order: role.order,
    employer,
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
  order: number;
}, employer: EmployerBrief): RoleSummary {
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
    order: role.order,
    employer,
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

function priorityIntroUsageWhere(side: PersonaSide, actorId: string, eventId: string): Prisma.DecisionWhereInput {
  return side === "candidate"
    ? { eventId, actorType: "CANDIDATE", candidateId: actorId, action: "PRIORITY_INTRO" }
    : { eventId, actorType: "EMPLOYER", action: "PRIORITY_INTRO", role: { employerId: actorId } };
}

function receivedPriorityIntrosWhere(side: PersonaSide, actorId: string): Prisma.DecisionWhereInput {
  return side === "candidate"
    ? { actorType: "EMPLOYER", action: "PRIORITY_INTRO", candidateId: actorId }
    : { actorType: "CANDIDATE", action: "PRIORITY_INTRO", role: { employerId: actorId } };
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
        ? (await prisma.candidate.findUnique({ where: { id: actorId }, select: { priorityIntroAllowance: true } }))?.priorityIntroAllowance ?? 3
        : (await prisma.employer.findUnique({ where: { id: actorId }, select: { priorityIntroAllowance: true } }))?.priorityIntroAllowance ?? 3;
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
        include: { employer: { select: { id: true, priorityIntroAllowance: true } } },
      });
      if (!role) throw new RepositoryError("not_found", "Role not found.");

      const candidate = await tx.candidate.findUnique({
        where: { id: input.candidateId },
        select: { id: true, eventId: true, priorityIntroAllowance: true },
      });
      if (!candidate || candidate.eventId !== role.eventId) {
        throw new RepositoryError("not_found", "Candidate not found for this event.");
      }

      let allowance = 3;
      if (input.side === "candidate") {
        if (input.actorId !== candidate.id) throw new RepositoryError("forbidden", "Wrong candidate identity.");
        allowance = candidate.priorityIntroAllowance;
      } else {
        if (role.employer.id !== input.actorId) throw new RepositoryError("forbidden", "Wrong employer identity.");
        allowance = role.employer.priorityIntroAllowance;
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
      if (action === "PRIORITY_INTRO") {
        used = await tx.decision.count({
          where: priorityIntroUsageWhere(input.side, input.actorId, role.eventId),
        });
        if (!canUsePriorityIntro(used, allowance)) {
          throw new RepositoryError("priority_intro_exhausted", "No priority intros left for this event.");
        }
      }

      await tx.decision.create({
        data: {
          eventId: role.eventId,
          roleId: input.roleId,
          candidateId: input.candidateId,
          actorType,
          action,
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

      return {
        action,
        matched: Boolean(matchId),
        matchId,
        priorityIntrosRemaining: remainingPriorityIntros(allowance, used + (action === "PRIORITY_INTRO" ? 1 : 0)),
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
    const fit = await prisma.fitSummary.findUnique({
      where: {
        roleId_candidateId: {
          roleId: match.roleId,
          candidateId: match.candidateId,
        },
      },
    });
    return {
      id: match.id,
      role: mapRoleDetail(match.role),
      candidate: mapCandidate(match.candidate),
      messages: match.messages.map(mapMessage),
      fitSummary: fit ? mapFit(fit) : null,
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
    const [matches, priorityIntrosReceived] = await Promise.all([
      prisma.match.count({ where: matchWhere }),
      prisma.decision.count({ where: receivedPriorityIntrosWhere(side, actorId) }),
    ]);
    return { matches, priorityIntrosReceived };
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
        metaJson: "{}",
        evidenceUrl,
        // Provenance is never supplied by AI or the client. Extracted claims are self-claimed.
        provenance: "SELF_CLAIMED",
        origin: "AI_EXTRACTED",
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
}

export const repository = new PrismaRecruitmentRepository();
