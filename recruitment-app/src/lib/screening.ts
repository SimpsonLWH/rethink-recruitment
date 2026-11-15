/**
 * Pre-screen domain model.
 *
 * The product thesis: a CV is a claim, not evidence. Interviewers should not
 * scan prose with another model; they should review a short, checkable record:
 * a work-sample result against a stated bar, claims with the artifact they
 * point to, and the questions that close the gaps.
 *
 * Everything here is deterministic. It prepares a human decision; it never
 * scores a person, ranks people, or recommends an outcome.
 */

export type ScreeningCriterionKind = "MUST_HAVE" | "NICE_TO_HAVE" | "CONVERSATION";
export type ScreeningCriterionSource = "ASSESSMENT" | "SIGNAL" | "CONVERSATION";
export type ScreeningCriterionStatus = "MET" | "PARTLY" | "OPEN" | "NOT_MET" | "NOT_ASSESSED";
export type CriterionRating = "MEETS" | "PARTLY" | "NOT_YET" | "NOT_ASSESSED";

export interface ScreeningCriterion {
  id: string;
  label: string;
  kind: ScreeningCriterionKind;
  source: ScreeningCriterionSource;
  /** What the interviewer is actually looking for. */
  detail: string;
  assessmentId?: string;
  requiredScore?: number;
  signalId?: string;
  /** A concrete opening question for this criterion. */
  ask: string;
}

export interface PlanRequirement {
  assessmentId: string;
  requiredScore: number;
  assessment: {
    title: string;
    version: string;
    difficulty?: string;
    durationMinutes?: number;
    proctoring?: string;
  } | null;
}

export interface PlanSignal {
  id: string;
  kind: "SKILL" | "EXPERIENCE" | "DOMAIN";
  label: string;
  value: string;
  years?: number;
  skill?: string;
}

export interface PlanSource {
  roleTitle: string;
  requirements: PlanRequirement[];
  signals: PlanSignal[];
}

const MAX_CRITERIA = 7;

/**
 * Build the default screening plan from the role's stated bar. The first two
 * differentiators are must-haves; the rest are nice-to-haves. A conversation
 * criterion is always present because not everything worth knowing is on a
 * record.
 */
export function deriveScreeningPlan(source: PlanSource): ScreeningCriterion[] {
  const criteria: ScreeningCriterion[] = [];

  for (const requirement of source.requirements) {
    const assessment = requirement.assessment;
    if (!assessment) continue;
    const id = "assessment:" + requirement.assessmentId;
    if (criteria.some((criterion) => criterion.id === id)) continue;
    const minutes = assessment.durationMinutes ? " · " + assessment.durationMinutes + " min" : "";
    criteria.push({
      id,
      label: assessment.title,
      kind: "MUST_HAVE",
      source: "ASSESSMENT",
      detail: "Score " + requirement.requiredScore + "/100 or above on " + assessment.version + minutes + ". The score is a floor, not the whole story.",
      assessmentId: requirement.assessmentId,
      requiredScore: requirement.requiredScore,
      ask: "Which part of " + assessment.title + " took the longest, and how did you get through it?",
    });
  }

  const signals = source.signals.slice(0, 4);
  signals.forEach((signal, index) => {
    criteria.push({
      id: "signal:" + signal.id,
      label: signal.label,
      kind: index < 2 ? "MUST_HAVE" : "NICE_TO_HAVE",
      source: "SIGNAL",
      detail:
        signal.kind === "EXPERIENCE"
          ? "Dated experience of about " + (signal.years ?? 1) + "+ year" + ((signal.years ?? 1) === 1 ? "" : "s") + ", or a project that shows the same."
          : signal.kind === "DOMAIN"
            ? "Real context in a team or project, not just a keyword."
            : "Used in work they can point to, not just listed.",
      signalId: signal.id,
      ask:
        signal.kind === "EXPERIENCE"
          ? "Walk me through the " + signal.label + " evidence. What did you own, for how long?"
          : "Where have you used " + signal.label + " in real work? What broke, and what did you change?",
    });
  });

  criteria.push({
    id: "conversation:how-they-work",
    label: "How they work",
    kind: "CONVERSATION",
    source: "CONVERSATION",
    detail: "Trade-offs, feedback and what they would do differently. Ask for a decision they would revisit.",
    ask: "Tell me about a decision you would make differently now. What did you learn, and what changed?",
  });

  const trimmed = criteria.slice(0, MAX_CRITERIA);
  if (trimmed.length === 1) {
    trimmed.unshift({
      id: "conversation:relevant-work",
      label: "Relevant work",
      kind: "MUST_HAVE",
      source: "CONVERSATION",
      detail: "One piece of work close enough to this role to discuss in detail.",
      ask: "Which piece of your work is closest to this role? Walk me through it.",
    });
  }
  return trimmed;
}

const CRITERION_KINDS: ScreeningCriterionKind[] = ["MUST_HAVE", "NICE_TO_HAVE", "CONVERSATION"];
const CRITERION_SOURCES: ScreeningCriterionSource[] = ["ASSESSMENT", "SIGNAL", "CONVERSATION"];

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export function isScreeningCriterion(value: unknown): value is ScreeningCriterion {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return Boolean(
    cleanText(record.id, 120) &&
      cleanText(record.label, 160) &&
      CRITERION_KINDS.includes(record.kind as ScreeningCriterionKind) &&
      CRITERION_SOURCES.includes(record.source as ScreeningCriterionSource) &&
      cleanText(record.detail, 320) &&
      cleanText(record.ask, 240),
  );
}

/** A stored plan is trusted only if every entry validates; otherwise derive. */
export function parseScreeningPlan(json: string | null | undefined, fallback: ScreeningCriterion[]): ScreeningCriterion[] {
  if (!json) return fallback;
  let raw: unknown;
  try {
    raw = JSON.parse(json) as unknown;
  } catch {
    return fallback;
  }
  if (!Array.isArray(raw)) return fallback;
  const parsed = raw.filter(isScreeningCriterion).map((criterion) => ({
    id: criterion.id.slice(0, 120),
    label: criterion.label.slice(0, 160),
    kind: criterion.kind,
    source: criterion.source,
    detail: criterion.detail.slice(0, 320),
    assessmentId: typeof criterion.assessmentId === "string" ? criterion.assessmentId.slice(0, 120) : undefined,
    requiredScore: typeof criterion.requiredScore === "number" ? criterion.requiredScore : undefined,
    signalId: typeof criterion.signalId === "string" ? criterion.signalId.slice(0, 120) : undefined,
    ask: criterion.ask.slice(0, 240),
  }));
  return parsed.length ? parsed.slice(0, MAX_CRITERIA) : fallback;
}

export function serializeScreeningPlan(criteria: ScreeningCriterion[]): string {
  return JSON.stringify(criteria.slice(0, MAX_CRITERIA));
}

// ---------------------------------------------------------------------------
// Evidence evaluation
// ---------------------------------------------------------------------------

export interface CriterionEvidenceInput {
  assessmentResults: Array<{
    assessmentId: string;
    score: number | null;
    assessment: { title: string; version: string };
  }>;
  signalMatches: Array<{
    signalId: string;
    status: "exact" | "related" | "unknown" | "uncertain" | "not_met";
    factIds: string[];
    explanation: string;
  }>;
}

export interface CriterionCheck {
  criterionId: string;
  rating: CriterionRating;
  note?: string;
}

export interface CriterionResult {
  criterion: ScreeningCriterion;
  status: ScreeningCriterionStatus;
  evidenceLine: string;
  sourceIds: string[];
  /** The interviewer's own rating, when they have recorded one. */
  humanRating: CriterionRating | null;
}

const SIGNAL_STATUS: Record<string, ScreeningCriterionStatus> = {
  exact: "MET",
  related: "PARTLY",
  uncertain: "OPEN",
  unknown: "NOT_ASSESSED",
  not_met: "NOT_MET",
};

export function evaluateCriteria(
  plan: ScreeningCriterion[],
  input: CriterionEvidenceInput,
  checks: CriterionCheck[] = [],
): CriterionResult[] {
  const checkByCriterion = new Map(checks.map((check) => [check.criterionId, check] as const));

  return plan.map((criterion) => {
    const humanRating = checkByCriterion.get(criterion.id)?.rating ?? null;

    if (criterion.source === "ASSESSMENT" && criterion.assessmentId) {
      const result = input.assessmentResults.find((entry) => entry.assessmentId === criterion.assessmentId);
      if (!result) {
        return {
          criterion,
          status: "NOT_ASSESSED",
          evidenceLine: "No sitting on " + criterion.label + " yet.",
          sourceIds: [],
          humanRating,
        };
      }
      if (result.score === null) {
        return {
          criterion,
          status: "OPEN",
          evidenceLine: "A sitting is open, with no final score yet.",
          sourceIds: [result.assessmentId],
          humanRating,
        };
      }
      const bar = criterion.requiredScore ?? 0;
      return {
        criterion,
        status: result.score >= bar ? "MET" : "NOT_MET",
        evidenceLine:
          "Scored " + result.score + "/100 against a stated bar of " + bar + " · " + result.assessment.version + ".",
        sourceIds: [result.assessmentId],
        humanRating,
      };
    }

    if (criterion.source === "SIGNAL" && criterion.signalId) {
      const match = input.signalMatches.find((entry) => entry.signalId === criterion.signalId);
      if (!match) {
        return {
          criterion,
          status: "NOT_ASSESSED",
          evidenceLine: "Nothing on the record addresses this yet.",
          sourceIds: [],
          humanRating,
        };
      }
      const derived = SIGNAL_STATUS[match.status] ?? "NOT_ASSESSED";
      const status: ScreeningCriterionStatus =
        humanRating === "MEETS" ? "MET" : humanRating === "PARTLY" ? "PARTLY" : humanRating === "NOT_YET" ? "NOT_MET" : derived;
      return {
        criterion,
        status,
        evidenceLine:
          humanRating && humanRating !== "NOT_ASSESSED"
            ? match.explanation + " Your read: " + RATING_LABEL[humanRating].toLowerCase() + "."
            : match.explanation,
        sourceIds: match.factIds,
        humanRating,
      };
    }

    const ratingStatus: ScreeningCriterionStatus =
      humanRating === "MEETS" ? "MET" : humanRating === "PARTLY" ? "PARTLY" : humanRating === "NOT_YET" ? "NOT_MET" : "NOT_ASSESSED";
    return {
      criterion,
      status: ratingStatus,
      evidenceLine:
        humanRating === null
          ? "Not assessed until the conversation."
          : humanRating === "MEETS"
            ? "Your read: meets it."
            : humanRating === "PARTLY"
              ? "Your read: partly."
              : humanRating === "NOT_YET"
                ? "Your read: not yet."
                : "Not assessed.",
      sourceIds: [],
      humanRating,
    };
  });
}

// ---------------------------------------------------------------------------
// Claim checks
// ---------------------------------------------------------------------------

export type ClaimCheckStatus = "VERIFIED" | "LINK_ONLY" | "NEEDS_CONVERSATION" | "NOT_CHECKABLE";
export type EffectiveClaimStatus = ClaimCheckStatus | "UNCHECKED" | "CONTEXT";

export interface ClaimCheck {
  factId: string;
  status: ClaimCheckStatus;
  note?: string;
  updatedAt?: string;
}

export interface ClaimInput {
  id: string;
  claim: string;
  provenance: "SELF_CLAIMED" | "EMPLOYER_CONFIRMED";
  evidenceUrl: string | null;
  linkStatus: "WORKS" | "UNREACHABLE" | null;
  /** A synthetic artifact preview supplied with the fact metadata, if any. */
  image?: string | null;
  /** A preference or availability note. It is context, not a claim to check. */
  context?: boolean;
  skillTags: string[];
}

export interface ClaimResult {
  claim: ClaimInput;
  status: EffectiveClaimStatus;
  /** Why the status is what it is, in reviewer language. */
  basis: string;
  note: string | null;
}

export function evaluateClaims(claims: ClaimInput[], checks: ClaimCheck[]): ClaimResult[] {
  const checkById = new Map(checks.map((check) => [check.factId, check] as const));
  return claims.map((claim) => {
    if (claim.context) {
      return {
        claim,
        status: "CONTEXT",
        basis: "A preference or availability note. Nothing here needs an artifact.",
        note: null,
      };
    }
    const check = checkById.get(claim.id);
    if (check) {
      return {
        claim,
        status: check.status,
        basis:
          check.status === "VERIFIED"
            ? "Checked by you."
            : check.status === "LINK_ONLY"
              ? "Artifact opens; the claim itself is unchecked."
              : check.status === "NEEDS_CONVERSATION"
                ? "Saved for the conversation."
                : "Not checkable from the record.",
        note: check.note ?? null,
      };
    }
    if (claim.provenance === "EMPLOYER_CONFIRMED") {
      return {
        claim,
        status: "VERIFIED",
        basis: "A previous employer confirmed this on the record.",
        note: null,
      };
    }
    if (claim.evidenceUrl && claim.linkStatus === "WORKS") {
      return {
        claim,
        status: "LINK_ONLY",
        basis: "A linked artifact opens. Nobody has reviewed it yet.",
        note: null,
      };
    }
    if (claim.evidenceUrl && claim.linkStatus === "UNREACHABLE") {
      return {
        claim,
        status: "UNCHECKED",
        basis: "The linked artifact did not load.",
        note: null,
      };
    }
    return {
      claim,
      status: "UNCHECKED",
      basis: "No artifact attached. This is prose until a conversation.",
      note: null,
    };
  });
}

export interface ClaimSummary {
  total: number;
  verified: number;
  linked: number;
  needsConversation: number;
  notCheckable: number;
  context: number;
  unchecked: number;
  withArtifact: number;
}

export function summariseClaims(results: ClaimResult[]): ClaimSummary {
  return {
    total: results.length,
    verified: results.filter((result) => result.status === "VERIFIED").length,
    linked: results.filter((result) => result.status === "LINK_ONLY").length,
    needsConversation: results.filter((result) => result.status === "NEEDS_CONVERSATION").length,
    notCheckable: results.filter((result) => result.status === "NOT_CHECKABLE").length,
    context: results.filter((result) => result.status === "CONTEXT").length,
    unchecked: results.filter((result) => result.status === "UNCHECKED").length,
    withArtifact: results.filter((result) => Boolean(result.claim.evidenceUrl)).length,
  };
}

// ---------------------------------------------------------------------------
// Interview kit
// ---------------------------------------------------------------------------

export type QuestionKind = "EVIDENCE" | "CLAIM" | "REFLECTION" | "CLOSING";

export interface InterviewQuestion {
  id: string;
  prompt: string;
  listenFor: string;
  followUp: string;
  minutes: number;
  kind: QuestionKind;
  sourceLabel: string;
  criterionId?: string;
  factId?: string;
}

export interface WorkSampleGapInput {
  assessmentTitle: string;
  problems: Array<{ title: string; passed: number; total: number }>;
}

export interface InterviewKit {
  questions: InterviewQuestion[];
  agenda: Array<{ label: string; minutes: number }>;
  totalMinutes: number;
}

function quoteClaim(claim: string, max = 110): string {
  const trimmed = claim.trim().replace(/\s+/g, " ");
  return trimmed.length > max ? trimmed.slice(0, max - 1).trimEnd() + "…" : trimmed;
}

/**
 * Build a short, time-boxed kit from what is still open. It never asks the
 * interviewer to re-run the assessment; it asks about the work behind it.
 */
export function buildInterviewKit(args: {
  roleTitle: string;
  criteria: CriterionResult[];
  claims: ClaimResult[];
  workSamples?: WorkSampleGapInput[];
  maxQuestions?: number;
}): InterviewKit {
  const max = Math.min(Math.max(args.maxQuestions ?? 5, 3), 6);
  const questions: InterviewQuestion[] = [];
  const seen = new Set<string>();

  function add(question: Omit<InterviewQuestion, "id"> & { id?: string }, options?: { closing?: boolean }) {
    // Always leave room for the closing question.
    const limit = options?.closing ? max : Math.max(max - 1, 1);
    if (questions.length >= limit) return;
    const key = question.prompt.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    questions.push({
      ...question,
      id: question.id ?? "q-" + (questions.length + 1) + "-" + question.kind.toLowerCase(),
    });
  }

  const mustHaves = args.criteria.filter((result) => result.criterion.kind === "MUST_HAVE");

  for (const result of mustHaves) {
    if (result.status === "NOT_ASSESSED" || result.status === "OPEN") {
      add({
        prompt: result.criterion.ask,
        listenFor: "A named piece of work, their own contribution, and what changed because of it.",
        followUp: "What would you do differently on the next attempt?",
        minutes: 6,
        kind: "EVIDENCE",
        sourceLabel: result.criterion.label + " · not evidenced yet",
        criterionId: result.criterion.id,
      });
    } else if (result.status === "PARTLY") {
      add({
        prompt: "Your record shows some of " + result.criterion.label.toLowerCase() + ", but not the whole picture. What is the most direct example you have?",
        listenFor: "Specifics that fill the gap, not a longer version of the same claim.",
        followUp: "What part of it did you own, and what did someone else own?",
        minutes: 5,
        kind: "EVIDENCE",
        sourceLabel: result.criterion.label + " · partly evidenced",
        criterionId: result.criterion.id,
      });
    } else if (result.status === "NOT_MET") {
      add({
        prompt:
          result.criterion.source === "ASSESSMENT"
            ? "Your result on " + result.criterion.label.toLowerCase() + " sits below the stated bar. Which part was hardest, and what have you learned since?"
            : "The record does not show " + result.criterion.label.toLowerCase() + " directly. What is the closest example you have, and what did you own?",
        listenFor:
          result.criterion.source === "ASSESSMENT"
            ? "Honest reflection and a concrete next step, not defensiveness."
            : "A concrete example that fills the gap, not a longer list of skills.",
        followUp:
          result.criterion.source === "ASSESSMENT"
            ? "Show me how you would approach the part you missed now."
            : "What would you need to learn to do it here?",
        minutes: 5,
        kind: "REFLECTION",
        sourceLabel: result.criterion.label + (result.criterion.source === "ASSESSMENT" ? " · below the stated bar" : " · not on the record"),
        criterionId: result.criterion.id,
      });
    }
  }

  // Ask about the exact question that exposed a gap, not just the score.
  const gapQuestions = (args.workSamples ?? [])
    .flatMap((sample) =>
      sample.problems
        .filter((problem) => problem.total > 0 && problem.passed < problem.total)
        .map((problem) => ({ sample, problem, ratio: problem.passed / problem.total })),
    )
    .sort((left, right) => left.ratio - right.ratio)
    .slice(0, 2);
  for (const gap of gapQuestions) {
    add({
      prompt:
        "The work sample on " +
        gap.sample.assessmentTitle +
        " shows " +
        gap.problem.title +
        " at " +
        gap.problem.passed +
        "/" +
        gap.problem.total +
        " checks. Walk me through how you approached it, and what you would do differently now.",
      listenFor: "Their reasoning on the exact gap, not a rehearsed answer, plus one concrete next step.",
      followUp: "What would you need to solve it end to end?",
      minutes: 6,
      kind: "REFLECTION",
      sourceLabel: gap.sample.assessmentTitle + " · " + gap.problem.title + " " + gap.problem.passed + "/" + gap.problem.total,
    });
  }

  const openClaims = args.claims
    .filter((claim) => claim.status === "UNCHECKED" || claim.status === "LINK_ONLY" || claim.status === "NEEDS_CONVERSATION")
    .slice(0, 2);
  for (const claim of openClaims) {
    add({
      prompt: "You wrote: “" + quoteClaim(claim.claim.claim) + "” Walk me through what you personally did, and what changed.",
      listenFor: "The same details as the record, plus their own contribution. A mismatch is something to explore, not a gotcha.",
      followUp: "Who else worked on it, and what did they own?",
      minutes: 5,
      kind: "CLAIM",
      sourceLabel: "Claim with no verified artifact",
      factId: claim.claim.id,
    });
  }

  const conversation = args.criteria.find((result) => result.criterion.source === "CONVERSATION" && result.status === "NOT_ASSESSED");
  if (conversation) {
    add({
      prompt: conversation.criterion.ask,
      listenFor: "A real trade-off, what they learned, and whether they can name their own part in it.",
      followUp: "What did you change in how you work afterwards?",
      minutes: 6,
      kind: "REFLECTION",
      sourceLabel: conversation.criterion.label,
      criterionId: conversation.criterion.id,
    });
  }

  add(
    {
      prompt: "What would you want to understand about this work before day one? What would make you say no?",
      listenFor: "Real questions about the work, not rehearsed enthusiasm. Treat a good 'no' as useful signal.",
      followUp: "What kind of team brings out your best work?",
      minutes: 4,
      kind: "CLOSING",
      sourceLabel: "Close the conversation",
    },
    { closing: true },
  );

  const questionsMinutes = questions.reduce((total, question) => total + question.minutes, 0);
  const agenda = [
    { label: "Open: role, bar and what you will decide today", minutes: 3 },
    { label: "Evidence questions", minutes: questionsMinutes },
    { label: "Their questions", minutes: 6 },
    { label: "Close: next step and date", minutes: 2 },
  ];
  return {
    questions,
    agenda,
    totalMinutes: agenda.reduce((total, item) => total + item.minutes, 0),
  };
}

// ---------------------------------------------------------------------------
// Packet summary
// ---------------------------------------------------------------------------

export type EvidenceState = "ENOUGH_TO_DISCUSS" | "OPEN_ITEMS" | "THIN";

export interface PacketSummary {
  state: EvidenceState;
  headline: string;
  supporting: string[];
  open: string[];
  nextActions: string[];
  mustHaveAssessed: number;
  mustHaveOpen: number;
  mustHaveTotal: number;
}

export function summarisePacket(criteria: CriterionResult[], claims: ClaimResult[]): PacketSummary {
  const claimSummary = summariseClaims(claims);
  const mustHaves = criteria.filter((result) => result.criterion.kind === "MUST_HAVE");
  const mustHaveAssessed = mustHaves.filter((result) => ["MET", "PARTLY", "NOT_MET"].includes(result.status)).length;
  const mustHaveOpen = mustHaves.filter((result) => ["NOT_ASSESSED", "OPEN", "PARTLY"].includes(result.status)).length;
  // The conversation is the next step, not a gap in the record. It is listed,
  // but it does not hold the packet in "open items" for ever.
  const openCriteria = criteria.filter(
    (result) =>
      result.criterion.source !== "CONVERSATION" &&
      (result.status === "NOT_ASSESSED" || result.status === "OPEN" || result.status === "PARTLY"),
  );
  const conversationOpen = criteria.filter(
    (result) => result.criterion.source === "CONVERSATION" && result.status === "NOT_ASSESSED",
  );

  const supporting = criteria
    .filter((result) => result.status === "MET")
    .map((result) => result.criterion.label + ": " + result.evidenceLine);
  const verifiedClaims = claims.filter((claim) => claim.status === "VERIFIED" && claim.claim.provenance !== "EMPLOYER_CONFIRMED");
  if (verifiedClaims.length) {
    supporting.push(verifiedClaims.length + " claim" + (verifiedClaims.length === 1 ? "" : "s") + " checked against the artifact.");
  }
  if (claimSummary.linked > 0) {
    supporting.push(claimSummary.linked + " linked artifact" + (claimSummary.linked === 1 ? "" : "s") + " available to review.");
  }

  const open = [
    ...openCriteria.map((result) => result.criterion.label + ": " + result.evidenceLine),
    ...conversationOpen.map((result) => result.criterion.label + ": " + result.evidenceLine),
    ...claims
      .filter((claim) => claim.status === "NEEDS_CONVERSATION")
      .map((claim) => "Saved for the conversation: “" + quoteClaim(claim.claim.claim, 80) + "”"),
    ...claims
      .filter((claim) => claim.status === "LINK_ONLY")
      .map((claim) => "Artifact not yet reviewed: “" + quoteClaim(claim.claim.claim, 80) + "”"),
    ...claims
      .filter((claim) => claim.status === "UNCHECKED")
      .map((claim) => "No artifact yet: “" + quoteClaim(claim.claim.claim, 80) + "”"),
  ];

  const nextActions: string[] = [];
  if (mustHaveOpen > 0) {
    nextActions.push("Close " + mustHaveOpen + " open must-have" + (mustHaveOpen === 1 ? "" : "s") + " in the conversation.");
  }
  if (claimSummary.linked > 0) {
    nextActions.push("Open " + claimSummary.linked + " linked artifact" + (claimSummary.linked === 1 ? "" : "s") + " and mark what you checked.");
  }
  if (claimSummary.unchecked + claimSummary.needsConversation > 0) {
    nextActions.push("Put " + (claimSummary.unchecked + claimSummary.needsConversation) + " prose claim" + (claimSummary.unchecked + claimSummary.needsConversation === 1 ? "" : "s") + " into the conversation.");
  }
  if (nextActions.length === 0) {
    nextActions.push("The record is checked. Decide from your notes, or hold if you want another data point.");
  }

  // A missing nice-to-have does not block a conversation. A missing must-have,
  // an unchecked artifact or still-prose claim does.
  const state: EvidenceState =
    mustHaveAssessed === 0
      ? "THIN"
      : mustHaveOpen === 0 && claimSummary.unchecked === 0 && claimSummary.linked === 0
        ? "ENOUGH_TO_DISCUSS"
        : "OPEN_ITEMS";

  const proseOpen = claimSummary.unchecked + claimSummary.linked + claimSummary.needsConversation;
  const headline =
    state === "THIN"
      ? "Thin evidence so far. One work sample or a short conversation will tell you more than the prose."
      : state === "ENOUGH_TO_DISCUSS"
        ? "The record is complete enough to discuss. The decision is yours."
        : mustHaveOpen > 0
          ? mustHaveAssessed + " of " + mustHaves.length + " must-haves have evidence. " + mustHaveOpen + " still need" + (mustHaveOpen === 1 ? "s" : "") + " a check."
          : "The must-haves have evidence. " + proseOpen + " prose item" + (proseOpen === 1 ? "" : "s") + " still need" + (proseOpen === 1 ? "s" : "") + " a conversation.";

  return {
    state,
    headline,
    supporting,
    open,
    nextActions,
    mustHaveAssessed,
    mustHaveOpen,
    mustHaveTotal: mustHaves.length,
  };
}

// ---------------------------------------------------------------------------
// Decision record
// ---------------------------------------------------------------------------

export type ScreeningDecision = "ADVANCE" | "HOLD" | "DECLINE";
export type ScreeningRunStatus = "OPEN" | ScreeningDecision;

export const DECISION_LABEL: Record<ScreeningDecision, string> = {
  ADVANCE: "Move to interview",
  HOLD: "Hold for more evidence",
  DECLINE: "Not moving forward",
};

export const RUN_STATUS_LABEL: Record<ScreeningRunStatus, string> = {
  OPEN: "In review",
  ADVANCE: "Moved to interview",
  HOLD: "On hold",
  DECLINE: "Not moving forward",
};

export const RATING_LABEL: Record<CriterionRating, string> = {
  MEETS: "Meets it",
  PARTLY: "Partly",
  NOT_YET: "Not yet",
  NOT_ASSESSED: "Not assessed",
};

export interface DecisionDraft {
  decision: ScreeningDecision;
  reason: string;
  criterionChecks: CriterionCheck[];
  confirmed: boolean;
}

export function isScreeningDecision(value: unknown): value is ScreeningDecision {
  return value === "ADVANCE" || value === "HOLD" || value === "DECLINE";
}

export function isCriterionRating(value: unknown): value is CriterionRating {
  return value === "MEETS" || value === "PARTLY" || value === "NOT_YET" || value === "NOT_ASSESSED";
}

/** Guardrails for a decision a human owns. Returns user-facing errors. */
export function validateScreeningDecision(draft: DecisionDraft): string[] {
  const errors: string[] = [];
  if (!isScreeningDecision(draft.decision)) errors.push("Choose what happens next.");
  const reason = draft.reason.trim();
  if (reason.length < 12) errors.push("Write at least a short reason (12 characters) so the decision can be reviewed later.");
  if (draft.criterionChecks.filter((check) => check.rating !== "NOT_ASSESSED").length === 0) {
    errors.push("Rate at least one criterion from the evidence you reviewed.");
  }
  if (draft.criterionChecks.some((check) => !isCriterionRating(check.rating))) {
    errors.push("Every rated criterion needs a valid rating.");
  }
  if (!draft.confirmed) errors.push("Confirm that you reviewed the evidence and the decision is yours.");
  return errors;
}

export function decisionBasis(checks: CriterionCheck[], criteria: ScreeningCriterion[]): string {
  const byId = new Map(criteria.map((criterion) => [criterion.id, criterion] as const));
  return checks
    .filter((check) => check.rating !== "NOT_ASSESSED")
    .map((check) => (byId.get(check.criterionId)?.label ?? "Criterion") + " — " + RATING_LABEL[check.rating])
    .join("; ");
}

// ---------------------------------------------------------------------------
// Persisted JSON parsing
// ---------------------------------------------------------------------------

export function parseCriterionChecks(json: string | null | undefined): CriterionCheck[] {
  if (!json) return [];
  try {
    const raw: unknown = JSON.parse(json);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({
        criterionId: typeof entry.criterionId === "string" ? entry.criterionId.slice(0, 120) : "",
        rating: isCriterionRating(entry.rating) ? entry.rating : ("NOT_ASSESSED" as const),
        note: typeof entry.note === "string" ? entry.note.slice(0, 600) : undefined,
      }))
      .filter((entry) => entry.criterionId.length > 0);
  } catch {
    return [];
  }
}

export function parseClaimChecks(json: string | null | undefined): ClaimCheck[] {
  if (!json) return [];
  try {
    const raw: unknown = JSON.parse(json);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({
        factId: typeof entry.factId === "string" ? entry.factId.slice(0, 120) : "",
        status: (entry.status === "VERIFIED" || entry.status === "LINK_ONLY" || entry.status === "NEEDS_CONVERSATION" || entry.status === "NOT_CHECKABLE"
          ? entry.status
          : "NOT_CHECKABLE") as ClaimCheckStatus,
        note: typeof entry.note === "string" ? entry.note.slice(0, 600) : undefined,
        updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : undefined,
      }))
      .filter((entry) => entry.factId.length > 0);
  } catch {
    return [];
  }
}

export interface ScreeningNote {
  id: string;
  body: string;
  author: string;
  createdAt: string;
}

export function parseScreeningNotes(json: string | null | undefined): ScreeningNote[] {
  if (!json) return [];
  try {
    const raw: unknown = JSON.parse(json);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({
        id: typeof entry.id === "string" ? entry.id : "note",
        body: typeof entry.body === "string" ? entry.body.slice(0, 2000) : "",
        author: typeof entry.author === "string" ? entry.author.slice(0, 80) : "Interviewer",
        createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date(0).toISOString(),
      }))
      .filter((entry) => entry.body.length > 0);
  } catch {
    return [];
  }
}

export function screeningStageLabel(stage: string): string {
  if (stage === "VERIFY") return "Checking claims";
  if (stage === "KIT") return "Conversation ready";
  if (stage === "DECISION") return "Decision recorded";
  return "Reading evidence";
}

export function evidenceStateLabel(state: EvidenceState): string {
  if (state === "ENOUGH_TO_DISCUSS") return "Ready to discuss";
  if (state === "OPEN_ITEMS") return "Open items";
  return "Thin evidence";
}


// ---------------------------------------------------------------------------
// Plan drift
// ---------------------------------------------------------------------------

/**
 * A plan is stale when its assessment or signal criteria no longer match the
 * role card's current requirements. Custom conversation criteria do not count.
 */
export function screeningPlanIsCurrent(
  plan: ScreeningCriterion[],
  requirements: Array<{ assessmentId: string }>,
  signals: Array<{ id: string }>,
): boolean {
  const planAssessments = new Set(
    plan.filter((criterion) => criterion.source === "ASSESSMENT" && criterion.assessmentId).map((criterion) => criterion.assessmentId!),
  );
  const roleAssessments = new Set(requirements.map((requirement) => requirement.assessmentId));
  const planSignals = new Set(
    plan.filter((criterion) => criterion.source === "SIGNAL" && criterion.signalId).map((criterion) => criterion.signalId!),
  );
  const roleSignals = new Set(signals.map((signal) => signal.id));
  const same = (left: Set<string>, right: Set<string>) => left.size === right.size && [...left].every((id) => right.has(id));
  return same(planAssessments, roleAssessments) && same(planSignals, roleSignals);
}
