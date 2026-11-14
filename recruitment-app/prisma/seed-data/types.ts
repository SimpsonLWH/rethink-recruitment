import type { FactMeta } from "../../src/lib/fact-meta";

export type SeedProvenance = "SELF_CLAIMED" | "EMPLOYER_CONFIRMED";

export interface SeedFact {
  prompt: string;
  claim: string;
  skillTags: string[];
  meta?: FactMeta;
  evidenceUrl?: string | null;
  provenance?: SeedProvenance;
  confirmedByEmployerSlug?: string;
  origin?: "SEED" | "AI_EXTRACTED" | "MANUAL";
}

export interface SeedCandidate {
  slug: string;
  name: string;
  headline: string;
  location: string;
  bio: string;
  monogram: string;
  palette: string;
  tags: string[];
  interests?: string[];
  availability?: string;
  discoveryOptIn?: boolean;
  likeAllowance?: number;
  order: number;
  facts: SeedFact[];
}

export interface SeedRole {
  slug: string;
  title: string;
  employmentType: string;
  workMode: string;
  location: string;
  summary: string;
  whyJoin: string;
  problemNow: string;
  first90: string;
  skills: string[];
  portfolioRequired?: boolean;
  order: number;
}

export interface SeedEmployerPrompt {
  prompt: string;
  answer: string;
  order: number;
}

export interface SeedEmployer {
  slug: string;
  name: string;
  tagline: string;
  about: string;
  industry: string;
  teamSize: string;
  location: string;
  logoMark: string;
  palette: string;
  contactName?: string;
  likeAllowance?: number;
  order: number;
  prompts: SeedEmployerPrompt[];
  roles: SeedRole[];
}

export interface SeedAssessmentProblemCase {
  id: string;
  args: unknown[];
  expected: unknown;
  hidden?: boolean;
}

export interface SeedCodeProblem {
  kind?: "code";
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "ADVANCED";
  statement: string;
  functionName: string;
  starterCode: string;
  /** Used by the seed assertion to prove every hidden test is solvable. Never stored. */
  solution: string;
  testCases: SeedAssessmentProblemCase[];
}

/** Multiple choice. `answer` is the zero-based option index and is stored as a hidden test only. */
export interface SeedChoiceProblem {
  kind: "choice";
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "ADVANCED";
  statement: string;
  options: string[];
  answer: number;
  /** Shown in practice mode only, never during an assessment. */
  explanation?: string;
}

/** Numeric answer. `answer` is stored as a hidden test only. */
export interface SeedNumericProblem {
  kind: "numeric";
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "ADVANCED";
  statement: string;
  answer: number;
  tolerance?: number;
  explanation?: string;
}

export type SeedAssessmentProblem = SeedCodeProblem | SeedChoiceProblem | SeedNumericProblem;

export interface SeedAssessment {
  slug: string;
  title: string;
  roleFamily: string;
  family: string;
  version: string;
  difficulty: "EASY" | "MEDIUM" | "ADVANCED";
  description: string;
  playable: boolean;
  order: number;
  /** 0 or omitted means untimed. */
  durationMinutes?: number;
  proctoring?: "NONE" | "PROCTORED" | "LOCKDOWN";
  topics?: string[];
  problems: SeedAssessmentProblem[];
}

export type SeedSignalKind = "SKILL" | "EXPERIENCE" | "DOMAIN";

export interface SeedRoleSignal {
  id: string;
  kind: SeedSignalKind;
  label: string;
  value: string;
  years?: number;
  skill?: string;
}

export interface SeedRoleCard {
  roleSlug: string;
  roleFamily: string;
  assessmentSlug: string;
  requiredScore: number;
  /** Further exact assessment bars, all shown to the reviewer. */
  additionalRequirements?: Array<{ assessmentSlug: string; requiredScore: number }>;
  signals: SeedRoleSignal[];
  reviewOwnerName: string;
}

export interface SeedAssessmentAttempt {
  candidateSlug: string;
  assessmentSlug: string;
  score: number;
  /** Minutes the synthetic sitting took. Defaults to 20 (or the time limit if shorter). */
  minutesUsed?: number;
  /** Synthetic proctoring events for proctored or lockdown sittings. */
  integrityEvents?: Array<{
    type: "tab_hidden" | "window_blur" | "fullscreen_exit" | "paste_blocked" | "copy_blocked" | "context_menu" | "devtools_key";
    atMinute: number;
  }>;
  submittedHoursAgo: number;
}

export interface SeedMessage {
  sender: "candidate" | "employer";
  body: string;
  minutesAgo: number;
}

export interface SeedMatch {
  candidateSlug: string;
  roleSlug: string;
  stage?: "INTRO_CALL" | "EVENT_MEETING" | "INTERVIEW" | "CLOSED";
  messages: SeedMessage[];
}

export interface SeedPriorityIntro {
  candidateSlug: string;
  roleSlug: string;
  sender: "candidate" | "employer";
  reason: string;
  hoursAgo: number;
}

export interface SeedInvitation {
  candidateSlug: string;
  roleSlug: string;
  message: string;
  citedAssessmentSlug: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  hoursAgo: number;
}

export interface SeedOutcome {
  candidateSlug: string;
  roleSlug: string;
  kind: "NOT_SELECTED" | "ROLE_CLOSED" | "AFTER_CONVERSATION";
  message: string;
  hoursAgo: number;
}
export interface SeedCandidateInterest {
  candidateSlug: string;
  roleSlug: string;
  hoursAgo: number;
}
