import type { FactMeta } from "@/lib/fact-meta";
import type {
  AssessmentDifficulty,
  IntegrityReport,
  IntegritySummary,
  OaMarking,
  ProblemMark,
  ProctoringMode,
  PublicOaProblem,
} from "@/lib/assessments";
import type { MatchStage } from "@/lib/stages";
import type {
  ClaimCheck,
  ClaimCheckStatus,
  ClaimResult,
  ClaimSummary,
  CriterionCheck,
  CriterionResult,
  EvidenceState,
  InterviewKit,
  PacketSummary,
  ScreeningCriterion,
  ScreeningDecision,
  ScreeningNote,
  ScreeningRunStatus,
} from "@/lib/screening";

export type PersonaSide = "candidate" | "employer";
export type Provenance = "SELF_CLAIMED" | "EMPLOYER_CONFIRMED";
export type LinkStatus = "WORKS" | "UNREACHABLE";
export type DecisionAction = "LIKE" | "PASS" | "PRIORITY_INTRO";
export type DecisionSource =
  | "SWIPE"
  | "PRIORITY_INTRO_REPLY"
  | "INVITATION_ACCEPT"
  | "INVITATION_REPLY"
  | "REVIEW_REQUEST"
  | "REVIEW_REPLY";

export interface EventView {
  id: string;
  slug: string;
  name: string;
  city: string;
  dateLabel: string;
  tagline: string;
}

export interface AssessmentSummary {
  id: string;
  slug: string;
  title: string;
  roleFamily: string;
  family: string;
  version: string;
  difficulty: AssessmentDifficulty;
  description: string;
  playable: boolean;
  problemCount: number;
  order: number;
  /** 0 means untimed. */
  durationMinutes: number;
  proctoring: ProctoringMode;
  topics: string[];
}

export interface AssessmentResultView {
  assessment: AssessmentSummary;
  score: number | null;
  attemptCount: number;
  lastSubmittedAt: string | null;
  attemptId: string | null;
  openAttemptId: string | null;
  /** Advisory proctoring and timing context. Never changes the score. */
  integrity?: IntegritySummary | null;
}

export interface AssessmentAttemptView {
  id: string;
  assessment: AssessmentSummary;
  problems: PublicOaProblem[];
  startedAt: string;
  /** Server clock when this view was built, so the browser timer can correct for skew. */
  serverNow: string;
  submittedAt: string | null;
  marking: OaMarking | null;
  integrity: IntegritySummary | null;
}

export interface AssessmentSubmissionView {
  marking: OaMarking;
  result: AssessmentResultView;
}

export type AssessmentFeedState = "MET" | "BELOW" | "NOT_TAKEN";

export interface RoleSignal {
  id: string;
  kind: "SKILL" | "EXPERIENCE" | "DOMAIN";
  label: string;
  value: string;
  years?: number;
  skill?: string;
}

export interface SignalMatch {
  signal: RoleSignal;
  status: "exact" | "related" | "unknown" | "uncertain" | "not_met";
  factIds: string[];
  explanation: string;
  countedMonths?: number;
}

export interface AssessmentRequirementEvidence {
  assessment: AssessmentSummary;
  requiredScore: number;
  score: number | null;
  meets: boolean;
  integrity?: IntegritySummary | null;
}

export interface AssessmentEvidence {
  assessment: AssessmentSummary;
  score: number;
  requiredScore: number;
  meetsBar: boolean;
  requirements: AssessmentRequirementEvidence[];
  attemptCount: number;
  lastSubmittedAt: string | null;
  integrity?: IntegritySummary | null;
}

export interface CandidateFeedCard {
  role: RoleDetail;
  evidence: AssessmentEvidence | null;
  state: AssessmentFeedState;
  signals: SignalMatch[];
}

export interface EmployerFeedCard {
  candidate: CandidateDetail;
  evidence: AssessmentEvidence | null;
  state: AssessmentFeedState;
  signals: SignalMatch[];
}

export interface CandidateFeed {
  main: CandidateFeedCard[];
  belowBar: CandidateFeedCard[];
}

export interface EmployerFeed {
  main: EmployerFeedCard[];
  belowBar: EmployerFeedCard[];
  notEvidenced: EmployerFeedCard[];
}

/**
 * One candidate-role review pair, independent of the feed's decision filters.
 * Used by the advisory evidence reading; it never creates or changes a decision.
 */
export interface EmployerReview {
  role: RoleDetail;
  candidate: CandidateDetail;
  evidence: AssessmentEvidence | null;
  signals: SignalMatch[];
  state: AssessmentFeedState;
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
  interests: string[];
  availability: string;
  discoveryOptIn: boolean;
  cvFileName: string | null;
  cvSource: string | null;
  cvUploadedAt: string | null;
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

export interface ProfileCompletionView {
  complete: boolean;
  completed: number;
  total: number;
  missing: string[];
}

export interface CandidateDetail extends CandidateSummary {
  facts: FactView[];
  assessmentResults: AssessmentResultView[];
  profileCompletion: ProfileCompletionView;
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
  contactName: string;
}

export interface EmployerDetail extends EmployerBrief {
  prompts: EmployerPromptView[];
  roles: RoleSummary[];
}

export interface RoleAssessmentRequirement {
  assessmentId: string;
  requiredScore: number;
  assessment: AssessmentSummary | null;
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
  roleFamily: string;
  assessment: AssessmentSummary | null;
  requiredScore: number | null;
  requirements: RoleAssessmentRequirement[];
  evidenceSignals: RoleSignal[];
  /** Interviewer-owned criteria. Empty means derive from the bar. */
  screeningPlan: ScreeningCriterion[];
  screeningPlanUpdatedAt: string | null;
  screeningPlanUpdatedBy: string | null;
  screeningPlanVersion: number;
  configStatus: "DRAFT" | "LIVE" | "CLOSED";
  reviewOwnerName: string | null;
  reviewDueHours: number;
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

export interface InterestState extends PriorityIntroState {
  likesTotal: number;
  likesUsed: number;
  likesRemaining: number;
}

export interface DecisionResult {
  action: DecisionAction;
  matched: boolean;
  matchId: string | null;
  priorityIntrosRemaining: number;
  likesRemaining: number;
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
  stage: MatchStage;
  stageUpdatedAt: string;
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
  stage: MatchStage;
  stageUpdatedAt: string;
  outcome: OutcomeView | null;
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

export interface InvitationView {
  id: string;
  message: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  createdAt: string;
  respondedAt: string | null;
  role: RoleDetail;
  candidate: CandidateSummary;
  employer: EmployerBrief;
  citedAssessment: AssessmentEvidence | null;
  matched: boolean;
  matchId: string | null;
  canRespondAsEmployer: boolean;
}

export interface OutcomeView {
  id: string;
  kind: "NOT_SELECTED" | "ROLE_CLOSED" | "AFTER_CONVERSATION";
  message: string;
  deliveredAt: string;
  roleId: string;
  roleTitle: string;
  employerName: string;
  candidateName: string;
}

export interface CandidateUpdate {
  id: string;
  type: "INTEREST" | "INVITATION" | "OUTCOME";
  status: string;
  roleId: string;
  roleTitle: string;
  employerName: string;
  matchId: string | null;
  message: string | null;
  createdAt: string;
}

export interface RoleCardInput {
  title: string;
  employmentType: string;
  workMode: string;
  location: string;
  summary: string;
  whyJoin: string;
  problemNow: string;
  first90: string;
  skills: string[];
  roleFamily: string;
  assessmentId: string;
  requiredScore: number;
  requirements: Array<{ assessmentId: string; requiredScore: number }>;
  signals: RoleSignal[];
  reviewOwnerName: string;
  publish: boolean;
}

export interface InvitationInput {
  employerId: string;
  roleId: string;
  candidateId: string;
  message: string;
  citedAttemptId?: string | null;
}

export interface NavCounts {
  matches: number;
  priorityIntrosReceived: number;
  invitations: number;
  updates: number;
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
  meta?: FactMeta;
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

export interface AccountRecord {
  id: string;
  side: PersonaSide;
  email: string;
  displayName: string | null;
  personId: string;
  passwordHash: string;
  passwordSalt: string;
}

export interface CreateAccountInput {
  side: PersonaSide;
  name: string;
  email: string;
  displayName?: string | null;
  passwordHash: string;
  passwordSalt: string;
}

export interface CandidateCvInput {
  cvSource: "UPLOAD" | "SAMPLE";
  cvFileName: string;
  sampleCandidateSlug?: string | null;
}



// ---------------------------------------------------------------------------
// Pre-screen
// ---------------------------------------------------------------------------

export interface ScreeningEventView {
  id: string;
  kind: string;
  detail: string;
  actor: string;
  createdAt: string;
}

export interface ScreeningRunView {
  id: string;
  stage: "EVIDENCE" | "VERIFY" | "KIT" | "DECISION";
  status: ScreeningRunStatus;
  claimChecks: ClaimCheck[];
  criterionChecks: CriterionCheck[];
  notes: ScreeningNote[];
  decisionReason: string | null;
  decisionBasis: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  outcomeSentAt: string | null;
  assignedReviewerName: string | null;
  createdAt: string;
  updatedAt: string;
  events: ScreeningEventView[];
}

export interface ScreeningQueueItem {
  candidate: CandidateDetail;
  evidence: AssessmentEvidence | null;
  state: AssessmentFeedState;
  signals: SignalMatch[];
  plan: ScreeningCriterion[];
  criteria: CriterionResult[];
  claims: ClaimResult[];
  claimSummary: ClaimSummary;
  summary: PacketSummary;
  kit: InterviewKit;
  openItems: number;
  /** Null until the interviewer opens the packet; listing never creates a record. */
  run: ScreeningRunView | null;
}

export interface ScreeningRoleSummary {
  role: RoleSummary;
  plan: ScreeningCriterion[];
  counts: {
    total: number;
    inReview: number;
    advanced: number;
    held: number;
    declined: number;
    needsChecking: number;
    readyToDiscuss: number;
    overdue: number;
  };
  evidenceState: EvidenceState | null;
  lastActivityAt: string | null;
}

export interface ScreeningPacket {
  role: RoleDetail;
  candidate: CandidateDetail;
  evidence: AssessmentEvidence | null;
  state: AssessmentFeedState;
  signals: SignalMatch[];
  plan: ScreeningCriterion[];
  criteria: CriterionResult[];
  claims: ClaimResult[];
  claimSummary: ClaimSummary;
  summary: PacketSummary;
  kit: InterviewKit;
  run: ScreeningRunView;
  employerName: string;
  reviewerName: string;
  /** Criterion snapshot used for this packet: current plan, or the frozen one. */
  planVersion: number;
  currentPlanVersion: number;
  planIsCurrent: boolean;
  workSamples: WorkSampleBreakdown[];
}

export interface WorkSampleBreakdown {
  assessmentId: string;
  title: string;
  version: string;
  score: number | null;
  requiredScore: number;
  problems: ProblemMark[];
}

export interface ScreeningDecisionRow {
  runId: string;
  roleId: string;
  roleTitle: string;
  candidateId: string;
  candidateName: string;
  candidateMonogram: string;
  candidatePalette: string;
  status: "ADVANCE" | "HOLD" | "DECLINE";
  reason: string | null;
  basis: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
  outcomeSentAt: string | null;
  assignedReviewerName: string | null;
}

export interface ScreeningClaimInput {
  roleId: string;
  candidateId: string;
  employerId: string;
  reviewerName?: string;
  factId: string;
  status: ClaimCheckStatus;
  note?: string | null;
}

export interface ScreeningNoteInput {
  roleId: string;
  candidateId: string;
  employerId: string;
  reviewerName?: string;
  body: string;
}

export interface ScreeningAssignInput {
  roleId: string;
  candidateId: string;
  employerId: string;
  reviewerName: string;
}

export interface ScreeningDecisionInput {
  roleId: string;
  candidateId: string;
  employerId: string;
  reviewerName?: string;
  decision: ScreeningDecision;
  reason: string;
  criterionChecks: CriterionCheck[];
  confirmed: boolean;
  sendOutcome?: boolean;
}

export type RepositoryErrorCode =
  | "not_found"
  | "forbidden"
  | "already_decided"
  | "priority_intro_exhausted"
  | "like_exhausted"
  | "invalid_reason"
  | "invalid_action"
  | "invalid_role"
  | "invalid_claim"
  | "draft_approved"
  | "draft_empty"
  | "no_sources"
  | "attempt_limit"
  | "attempt_closed"
  | "assessment_not_playable"
  | "invitation_exists"
  | "invitation_closed"
  | "role_card_incomplete"
  | "invalid_stage"
  | "invalid_screening"
  | "invalid_screening_decision"
  | "invalid_screening_plan";

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
  getAccountByEmail(email: string): Promise<AccountRecord | null>;
  createAccount(input: CreateAccountInput): Promise<AccountRecord>;
  completeCandidateCv(candidateId: string, input: CandidateCvInput): Promise<CandidateDetail>;
  getCandidateById(id: string): Promise<CandidateDetail | null>;
  getEmployerById(id: string): Promise<EmployerDetail | null>;
  getRoleById(id: string): Promise<RoleDetail | null>;
  getDiscoveryRolesForCandidate(candidateId: string): Promise<RoleDetail[]>;
  getDiscoveryCandidatesForRole(roleId: string, employerId: string): Promise<CandidateDetail[]>;
  getPriorityIntroState(side: PersonaSide, actorId: string): Promise<PriorityIntroState>;
  getInterestState(side: PersonaSide, actorId: string): Promise<InterestState>;
  hasEmployerInterest(candidateId: string, employerId: string): Promise<boolean>;
  recordDecision(input: {
    side: PersonaSide;
    actorId: string;
    roleId: string;
    candidateId: string;
    action: DecisionAction;
    reason?: string;
  }): Promise<DecisionResult>;
  acceptPriorityIntro(decisionId: string, side: PersonaSide, actorId: string): Promise<DecisionResult>;
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

  getAssessmentCatalog(): Promise<AssessmentSummary[]>;
  getAssessmentResults(candidateId: string): Promise<AssessmentResultView[]>;
  getAssessmentAttemptView(attemptId: string, candidateId: string): Promise<AssessmentAttemptView | null>;
  startAssessmentAttempt(assessmentId: string, candidateId: string): Promise<AssessmentAttemptView>;
  submitAssessmentAttempt(
    attemptId: string,
    candidateId: string,
    submissions: Record<string, string>,
    assessmentId?: string,
    integrity?: IntegrityReport | null,
  ): Promise<AssessmentSubmissionView>;
  checkAssessmentAnswer(
    attemptId: string,
    candidateId: string,
    problemId: string,
    code: string,
  ): Promise<ProblemMark>;
  getCandidateFeed(candidateId: string): Promise<CandidateFeed>;
  getEmployerFeed(roleId: string, employerId: string): Promise<EmployerFeed>;
  getEmployerReview(roleId: string, candidateId: string, employerId: string): Promise<EmployerReview | null>;
  getDiscoveryLane(roleId: string, employerId: string): Promise<EmployerFeed>;
  createRoleCard(employerId: string, input: RoleCardInput): Promise<RoleDetail>;
  updateRoleCard(roleId: string, employerId: string, input: RoleCardInput): Promise<RoleDetail>;
  closeRole(roleId: string, employerId: string): Promise<number>;
  sendInvitation(input: InvitationInput): Promise<InvitationView>;
  getInvitations(side: PersonaSide, actorId: string): Promise<InvitationView[]>;
  respondToInvitation(
    invitationId: string,
    side: PersonaSide,
    actorId: string,
    action: "ACCEPT" | "DECLINE",
  ): Promise<{ invitation: InvitationView; matched: boolean; matchId: string | null }>;
  respondToAcceptedInvitation(invitationId: string, employerId: string): Promise<DecisionResult>;
  getCandidateUpdates(candidateId: string): Promise<CandidateUpdate[]>;
  updateMatchStage(matchId: string, employerId: string, stage: MatchStage): Promise<MatchDetail>;
  closeMatch(matchId: string, employerId: string): Promise<MatchDetail>;
  updateCandidateProfile(
    candidateId: string,
    input: {
      headline?: string;
      bio?: string;
      location?: string;
      interests?: string[];
      availability?: string;
      discoveryOptIn?: boolean;
    },
  ): Promise<CandidateDetail>;

  getScreeningRoles(employerId: string): Promise<ScreeningRoleSummary[]>;
  getScreeningQueue(roleId: string, employerId: string, reviewerName?: string): Promise<{ role: RoleDetail; items: ScreeningQueueItem[] } | null>;
  getScreeningPacket(roleId: string, candidateId: string, employerId: string, reviewerName?: string): Promise<ScreeningPacket | null>;
  updateScreeningClaim(input: ScreeningClaimInput): Promise<ScreeningPacket>;
  addScreeningNote(input: ScreeningNoteInput): Promise<ScreeningPacket>;
  saveScreeningDecision(input: ScreeningDecisionInput): Promise<ScreeningPacket>;
  reopenScreeningDecision(input: { roleId: string; candidateId: string; employerId: string; reviewerName?: string }): Promise<ScreeningPacket>;
  assignScreeningReviewer(input: ScreeningAssignInput): Promise<ScreeningPacket>;
  saveScreeningPlan(roleId: string, employerId: string, criteria: ScreeningCriterion[]): Promise<RoleDetail>;
  resetScreeningPlan(roleId: string, employerId: string): Promise<RoleDetail>;
  getRecentScreeningDecisions(employerId: string, limit?: number): Promise<ScreeningDecisionRow[]>;
  getScreeningDecisions(
    employerId: string,
    options?: { status?: "ADVANCE" | "HOLD" | "DECLINE"; roleId?: string; limit?: number },
  ): Promise<ScreeningDecisionRow[]>;
}
