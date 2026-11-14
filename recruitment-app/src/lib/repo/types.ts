import type { FactMeta } from "@/lib/fact-meta";

export type PersonaSide = "candidate" | "employer";
export type Provenance = "SELF_CLAIMED" | "EMPLOYER_CONFIRMED";
export type LinkStatus = "WORKS" | "UNREACHABLE";
export type DecisionAction = "LIKE" | "PASS" | "PRIORITY_INTRO";

export interface EventView {
  id: string;
  slug: string;
  name: string;
  city: string;
  dateLabel: string;
  tagline: string;
}

export interface CandidateSummary {
  id: string;
  slug: string;
  name: string;
  headline: string;
  location: string;
  bio: string;
  monogram: string;
  palette: string;
  tags: string[];
  order: number;
}

export interface FactView {
  id: string;
  prompt: string;
  claim: string;
  skillTags: string[];
  meta: FactMeta;
  evidenceUrl: string | null;
  provenance: Provenance;
  confirmedByEmployerName: string | null;
  origin: string;
  order: number;
  linkStatus: {
    status: LinkStatus;
    checkedAt: string;
  } | null;
}

export interface CandidateDetail extends CandidateSummary {
  facts: FactView[];
}

export interface EmployerPromptView {
  prompt: string;
  answer: string;
  order: number;
}

export interface EmployerBrief {
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
}

export interface EmployerDetail extends EmployerBrief {
  prompts: EmployerPromptView[];
  roles: RoleSummary[];
}

export interface RoleSummary {
  id: string;
  slug: string;
  title: string;
  employmentType: string;
  workMode: string;
  location: string;
  summary: string;
  skills: string[];
  portfolioRequired: boolean;
  order: number;
  employer: EmployerBrief;
}

export interface RoleDetail extends RoleSummary {
  whyJoin: string;
  problemNow: string;
  first90: string;
  employerPrompts: EmployerPromptView[];
}

export interface PriorityIntroState {
  total: number;
  used: number;
  remaining: number;
  received: number;
}

export interface DecisionResult {
  action: DecisionAction;
  matched: boolean;
  matchId: string | null;
  priorityIntrosRemaining: number;
}

export interface MatchSummary {
  id: string;
  roleId: string;
  roleTitle: string;
  employerId: string;
  employerName: string;
  employerLogoMark: string;
  employerPalette: string;
  candidateId: string;
  candidateName: string;
  candidateHeadline: string;
  candidateMonogram: string;
  candidatePalette: string;
  createdAt: string;
  lastMessageAt: string | null;
  lastMessage: string | null;
}

export interface MessageView {
  id: string;
  senderType: "CANDIDATE" | "EMPLOYER";
  body: string;
  createdAt: string;
}

export interface FitTheme {
  theme: string;
  factIds: string[];
}

export interface FitSummaryView {
  digest: string;
  sharedThemes: FitTheme[];
  questions: string[];
  evidenceCoverage: number;
  generatedBy: string;
}

export interface MatchDetail {
  id: string;
  role: RoleDetail;
  candidate: CandidateDetail;
  messages: MessageView[];
  fitSummary: FitSummaryView | null;
  createdAt: string;
}

export interface PriorityIntroInboxItem {
  id: string;
  reason: string;
  createdAt: string;
  role: RoleDetail;
  candidate: CandidateSummary;
  employer: EmployerBrief;
  matched: boolean;
  matchId: string | null;
  recipientAction: DecisionAction | null;
  senderSide: PersonaSide;
}

export interface NavCounts {
  matches: number;
  priorityIntrosReceived: number;
}

export interface TailorOption {
  role: RoleDetail;
  state: "MATCHED" | "LIKED";
  draftStatus: "DRAFT" | "APPROVED" | null;
  draftId: string | null;
  matchedAt: string | null;
}

export interface TailoringItemView {
  id: string;
  kind: "FOREGROUND" | "REWORD";
  suggestedText: string;
  editedText: string | null;
  rationale: string;
  status: "SUGGESTED" | "APPROVED" | "REJECTED";
  order: number;
  sourceFacts: FactView[];
}

export interface TailoringDraftView {
  id: string;
  candidateId: string;
  role: RoleDetail;
  status: "DRAFT" | "APPROVED";
  engine: string;
  model: string | null;
  note: string | null;
  approvedAt: string | null;
  createdAt: string;
  items: TailoringItemView[];
}

export interface NewFactInput {
  prompt: string;
  claim: string;
  skillTags: string[];
  evidenceUrl?: string | null;
}

export interface LinkCheckView {
  factId: string;
  evidenceUrl: string | null;
  status: LinkStatus | null;
  checkedAt: string | null;
  httpStatus: number | null;
}

export interface AiRunView {
  id: string;
  kind: string;
  provider: string;
  model: string;
  mode: "LIVE" | "FALLBACK";
  status: string;
  createdAt: string;
}

export interface FitSeedRow {
  roleId: string;
  candidateId: string;
  digest: string;
  sharedThemes: FitTheme[];
  questions: string[];
  evidenceCoverage: number;
}

export interface FitInputs {
  eventId: string;
  candidates: Array<{
    id: string;
    name: string;
    tags: string[];
    facts: Array<{ id: string; claim: string; skillTags: string[]; evidenceUrl: string | null }>;
  }>;
  roles: Array<{
    id: string;
    title: string;
    summary: string;
    problemNow: string;
    skills: string[];
    employerName: string;
  }>;
}

export type RepositoryErrorCode =
  | "not_found"
  | "forbidden"
  | "already_decided"
  | "priority_intro_exhausted"
  | "invalid_reason"
  | "invalid_action"
  | "invalid_role"
  | "invalid_claim"
  | "draft_approved"
  | "draft_empty"
  | "no_sources";

export class RepositoryError extends Error {
  code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string) {
    super(message);
    this.name = "RepositoryError";
    this.code = code;
  }
}

export interface RecruitmentRepository {
  getEvent(): Promise<EventView>;
  getCandidateDirectory(): Promise<CandidateSummary[]>;
  getEmployerDirectory(): Promise<EmployerDetail[]>;
  getCandidateById(id: string): Promise<CandidateDetail | null>;
  getEmployerById(id: string): Promise<EmployerDetail | null>;
  getRoleById(id: string): Promise<RoleDetail | null>;
  getDiscoveryRolesForCandidate(candidateId: string): Promise<RoleDetail[]>;
  getDiscoveryCandidatesForRole(roleId: string, employerId: string): Promise<CandidateDetail[]>;
  getPriorityIntroState(side: PersonaSide, actorId: string): Promise<PriorityIntroState>;
  hasEmployerInterest(candidateId: string, employerId: string): Promise<boolean>;
  recordDecision(input: {
    side: PersonaSide;
    actorId: string;
    roleId: string;
    candidateId: string;
    action: DecisionAction;
    reason?: string;
  }): Promise<DecisionResult>;
  getMatches(side: PersonaSide, actorId: string): Promise<MatchSummary[]>;
  getMatch(matchId: string, side: PersonaSide, actorId: string): Promise<MatchDetail | null>;
  sendMessage(matchId: string, side: PersonaSide, actorId: string, body: string): Promise<MessageView>;
  getPriorityIntroInbox(side: PersonaSide, actorId: string): Promise<PriorityIntroInboxItem[]>;
  getNavCounts(side: PersonaSide, actorId: string): Promise<NavCounts>;
  getTailorableRoles(candidateId: string): Promise<TailorOption[]>;
  getTailoringDraft(candidateId: string, roleId: string): Promise<TailoringDraftView | null>;
  replaceTailoringDraft(input: {
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
  }): Promise<TailoringDraftView>;
  updateTailoringItem(input: {
    itemId: string;
    candidateId: string;
    status?: "APPROVED" | "REJECTED" | "SUGGESTED";
    editedText?: string | null;
  }): Promise<void>;
  approveTailoringDraft(draftId: string, candidateId: string): Promise<void>;
  addFact(candidateId: string, input: NewFactInput): Promise<FactView>;
  getLinkTarget(factId: string): Promise<LinkCheckView | null>;
  saveLinkCheck(factId: string, status: LinkStatus, httpStatus: number | null, detail: string | null): Promise<LinkCheckView>;
  getCachedAi(key: string): Promise<string | null>;
  saveAiCache(key: string, kind: string, responseJson: string): Promise<void>;
  recordAiRun(input: {
    kind: string;
    provider: string;
    model: string;
    mode: "LIVE" | "FALLBACK";
    status: string;
    latencyMs?: number;
    error?: string | null;
  }): Promise<void>;
  getRecentAiRuns(limit?: number): Promise<AiRunView[]>;
  getFitSummary(roleId: string, candidateId: string): Promise<FitSummaryView | null>;
  getFitInputs(): Promise<FitInputs>;
  saveFitSummaries(rows: FitSeedRow[], generatedBy: string): Promise<number>;
}
